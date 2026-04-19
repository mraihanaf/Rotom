import { Injectable, OnModuleInit } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import makeWASocket, {
  BaileysEventMap,
  CacheStore,
  ConnectionState,
  DEFAULT_CONNECTION_CONFIG,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  proto,
  useMultiFileAuthState,
  WAMessageContent,
  WAMessageKey,
} from 'baileys';
import type { WAMessage } from 'baileys';
import P from 'pino';
import NodeCache from '@cacheable/node-cache';
import { Boom } from '@hapi/boom';
import { BaileysDispatcher } from './dispatcher';
import { BAILEYS_ON_EVENT } from './decorators/metadata';
import { toString as qrCodeToString } from 'qrcode';
import { MessageStartsWith, On } from './decorators';
import { ApiService } from '../api/api.service';

@Injectable()
export class BaileysService implements OnModuleInit {
  public sock!: ReturnType<typeof makeWASocket>;
  private dispatcher!: BaileysDispatcher;
  private readonly logger = P({
    name: BaileysService.name,
    level: 'info',
    transport: {
      targets: [
        {
          target: 'pino-pretty',
          options: {
            colorize: true,
            level: 'info',
          },
        },
      ],
    },
  });
  private msgRetryCounterCache = new NodeCache() as CacheStore;

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly apiService: ApiService,
  ) {}

  onModuleInit(): void {
    this.initializeDispatcher();
    void this.startSock();
  }

  private initializeDispatcher(): void {
    const providers = this.discoveryService.getProviders();
    const providersWithHandlers = providers.filter((wrapper) => {
      if (!wrapper.instance || wrapper.isNotMetatype) return false;

      const prototype = Object.getPrototypeOf(wrapper.instance) as object;
      return Object.getOwnPropertyNames(prototype).some((methodName) => {
        const method = (wrapper.instance as Record<string, unknown>)[
          methodName
        ];
        return (
          typeof method === 'function' &&
          Reflect.hasMetadata(BAILEYS_ON_EVENT, method)
        );
      });
    });

    this.dispatcher = new BaileysDispatcher(providersWithHandlers);
  }

  private async startSock(): Promise<void> {
    const { state, saveCreds } =
      await useMultiFileAuthState('baileys_auth_info');

    const { version, isLatest } = await fetchLatestBaileysVersion();
    this.logger.info(`Using WA v${version.join('.')}, isLatest: ${isLatest}`);

    this.sock = makeWASocket({
      version,
      logger: this.logger,
      waWebSocketUrl: DEFAULT_CONNECTION_CONFIG.waWebSocketUrl,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, this.logger),
      },
      msgRetryCounterCache: this.msgRetryCounterCache,
      generateHighQualityLinkPreview: true,
      getMessage: this.getMessage,
    });

    this.sock.ev.process(async (events: Partial<BaileysEventMap>) => {
      if (events['creds.update']) {
        await saveCreds();
      }

      this.handleBatchEvents(events);
    });
  }

  private handleBatchEvents(events: Partial<BaileysEventMap>): void {
    for (const [event, payload] of Object.entries(events)) {
      this.dispatcher.dispatch(event as keyof BaileysEventMap, payload);
    }
  }

  @On('connection.update')
  private async handleConnectionUpdate(
    update: Partial<ConnectionState>,
  ): Promise<void> {
    const { connection, lastDisconnect, qr } = update;

    if (typeof qr === 'string') {
      const qrcode = await qrCodeToString(qr, { type: 'terminal' });
      console.log(qrcode);
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;

      if (statusCode !== 401) {
        this.logger.warn('Reconnecting...');
        void this.startSock();
      } else {
        this.logger.error('Logged out from WhatsApp');
      }
    }

    this.logger.debug({ connection }, 'Connection update');
  }

  private getMessage = async (
    _key: WAMessageKey,
  ): Promise<WAMessageContent | undefined> => {
    return Promise.resolve(proto.Message.create({ conversation: 'test' }));
  };

  @On('messages.upsert')
  private handleMessagesUpsert(
    payload: Partial<BaileysEventMap['messages.upsert']>,
  ) {
    const { type, messages } = payload;

    if (type !== 'notify') return;
    for (const message of messages ?? []) {
      this.logger.info(message);
    }
  }

  @MessageStartsWith('ping')
  private async handlePing(msg: WAMessage): Promise<void> {
    const jid = msg.key.remoteJid;
    if (jid) {
      await this.sock.sendMessage(jid, { text: 'pong' });
    }
  }

  private getPhoneFromMessage(msg: WAMessage): string | null {
    const key = msg.key as any;
    const participant = key.participant;
    const participantAlt = key.participantAlt; // Contains actual phone number when participant is LID
    const remoteJid = key.remoteJid;
    const remoteJidAlt = key.remoteJidAlt; // Contains actual phone number when using LID

    // First priority: participantAlt (in group chats, contains real phone when participant is LID)
    if (participantAlt && participantAlt.includes('@s.whatsapp.net')) {
      return participantAlt.replace(/@.*$/, '');
    }

    // Second priority: use remoteJidAlt if available (contains real phone number in LID mode)
    if (remoteJidAlt && remoteJidAlt.includes('@s.whatsapp.net')) {
      return remoteJidAlt.replace(/@.*$/, '');
    }

    // Third priority: participant JID (if it's already a phone number)
    if (participant) {
      if (/^\d+@/.test(participant)) {
        return participant.replace(/@.*$/, '');
      }
      // If it's a LID and no participantAlt, we can't resolve it
      return null;
    }

    // Fourth priority: remoteJid (fallback)
    if (remoteJid && remoteJid.includes('@s.whatsapp.net')) {
      return remoteJid.replace(/@.*$/, '');
    }

    // Can't resolve LID to phone number
    return null;
  }

  @MessageStartsWith('/announcement add')
  private async handleAnnouncementAdd(msg: WAMessage): Promise<void> {
    const jid = msg.key.remoteJid;
    if (!jid) return;

    try {
      // Extract sender's phone number from jid
      const senderPhone = this.getPhoneFromMessage(msg);
      if (!senderPhone) {
        await this.sock.sendMessage(jid, { text: '❌ Tidak dapat mengidentifikasi nomor pengirim.' });
        return;
      }

      // Check if sender is admin
      const isAdmin = await this.apiService.isAdminByPhone(senderPhone);
      if (!isAdmin) {
        await this.sock.sendMessage(jid, { text: '❌ Only admins can use this command.' });
        return;
      }

      // Determine group JID - auto-detect if in group, otherwise check for manual input
      let groupJid: string;

      if (jid.endsWith('@g.us')) {
        // Auto-detect: command used in a group
        groupJid = jid;
      } else {
        // Private chat: require manual JID input
        const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
        const parts = text.split(' ').filter(p => p.trim());
        const manualJid = parts[2]; // /announcement add <groupJid>

        if (!manualJid) {
          await this.sock.sendMessage(jid, {
            text: '⚠️ *Penggunaan di Private Chat:*\n/announcement add <group_jid>\n\n💡 *Tips:* Gunakan command ini langsung di grup untuk auto-detect JID.'
          });
          return;
        }

        // Validate JID format
        if (!manualJid.includes('@g.us') && !manualJid.includes('@s.whatsapp.net')) {
          await this.sock.sendMessage(jid, {
            text: '❌ Format JID tidak valid. Group JID harus diakhiri dengan @g.us'
          });
          return;
        }

        groupJid = manualJid;
      }

      // Update settings
      await this.apiService.updateAnnouncementGroupJid(senderPhone, groupJid);

      await this.sock.sendMessage(jid, {
        text: `✅ Grup pengumuman berhasil diatur!\n📝 JID: ${groupJid}`
      });
    } catch (error) {
      this.logger.error('Failed to set announcement group:', error);
      await this.sock.sendMessage(jid, { text: '❌ Gagal mengatur grup pengumuman.' });
    }
  }

  @MessageStartsWith('/announcement remove')
  private async handleAnnouncementRemove(msg: WAMessage): Promise<void> {
    const jid = msg.key.remoteJid;
    if (!jid) return;

    try {
      // Extract sender's phone number from jid
      const senderPhone = this.getPhoneFromMessage(msg);
      if (!senderPhone) {
        await this.sock.sendMessage(jid, { text: '❌ Tidak dapat mengidentifikasi nomor pengirim.' });
        return;
      }

      // Check if sender is admin
      const isAdmin = await this.apiService.isAdminByPhone(senderPhone);
      if (!isAdmin) {
        await this.sock.sendMessage(jid, { text: '❌ Only admins can use this command.' });
        return;
      }

      // Clear the announcement group JID
      await this.apiService.updateAnnouncementGroupJid(senderPhone, '');

      await this.sock.sendMessage(jid, {
        text: '✅ Grup pengumuman berhasil dihapus!\nBot tidak akan mengirim pengumuman otomatis lagi.'
      });
    } catch (error) {
      this.logger.error('Failed to remove announcement group:', error);
      await this.sock.sendMessage(jid, { text: '❌ Gagal menghapus grup pengumuman.' });
    }
  }

  @MessageStartsWith('/fund')
  private async handleFund(msg: WAMessage): Promise<void> {
    const jid = msg.key.remoteJid;
    if (!jid) return;

    try {
      const report = await this.apiService.getFundReport();
      const currency = report.currency.toUpperCase();

      const message = `💰 *KAS KELAS*\n\n` +
        `Saldo saat ini: ${this.formatCurrency(report.totalAmount, currency)}\n\n` +
        `📊 Laporan bulan ini:\n` +
        `• Pemasukan: ${this.formatCurrency(report.monthIncome, currency)}\n` +
        `• Pengeluaran: ${this.formatCurrency(report.monthExpense, currency)}\n` +
        `• Net: ${this.formatCurrency(report.monthNet, currency)}`;

      await this.sock.sendMessage(jid, { text: message });
    } catch (error) {
      this.logger.error('Failed to get fund report:', error);
      await this.sock.sendMessage(jid, { text: '❌ Failed to get fund information.' });
    }
  }

  @MessageStartsWith('/schedule')
  private async handleSchedule(msg: WAMessage): Promise<void> {
    const jid = msg.key.remoteJid;
    if (!jid) return;

    try {
      const schedules = await this.apiService.getTodaySchedule();

      if (schedules.length === 0) {
        await this.sock.sendMessage(jid, { text: '📅 Tidak ada jadwal hari ini.' });
        return;
      }

      const dayName = new Date().toLocaleDateString('id-ID', { weekday: 'long' });
      let message = `📅 *Jadwal Hari ${dayName}*\n\n`;

      schedules.forEach((s, idx) => {
        message += `${idx + 1}. *${s.subjectName}*\n`;
        message += `   🕐 ${s.startTime} - ${s.endTime}\n`;
        if (s.room) message += `   📍 ${s.room}\n`;
        message += '\n';
      });

      await this.sock.sendMessage(jid, { text: message.trim() });
    } catch (error) {
      this.logger.error('Failed to get schedule:', error);
      await this.sock.sendMessage(jid, { text: '❌ Failed to get schedule.' });
    }
  }

  @MessageStartsWith('/assignments')
  private async handleAssignments(msg: WAMessage): Promise<void> {
    const jid = msg.key.remoteJid;
    if (!jid) return;

    try {
      const assignments = await this.apiService.getPendingAssignments();

      if (assignments.length === 0) {
        await this.sock.sendMessage(jid, { text: '🎉 Tidak ada tugas yang pending. Semua sudah selesai!' });
        return;
      }

      let message = `📝 *Tugas Pending*\n\n`;

      assignments.forEach((a, idx) => {
        const dueDate = new Date(a.dueDate).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short'
        });
        message += `${idx + 1}. *${a.title}*\n`;
        message += `   📚 ${a.subject.name}\n`;
        message += `   📅 Deadline: ${dueDate}\n`;
        if (a.description) message += `   📝 ${a.description.substring(0, 50)}${a.description.length > 50 ? '...' : ''}\n`;
        message += '\n';
      });

      await this.sock.sendMessage(jid, { text: message.trim() });
    } catch (error) {
      this.logger.error('Failed to get assignments:', error);
      await this.sock.sendMessage(jid, { text: '❌ Failed to get assignments.' });
    }
  }

  @MessageStartsWith('/help')
  private async handleHelp(msg: WAMessage): Promise<void> {
    const jid = msg.key.remoteJid;
    if (!jid) return;

    const message = `🤖 *Rotom Bot Commands*\n\n` +
      `📢 *Admin Commands:*\n` +
      `• /announcement add - Set grup untuk pengumuman (admin only)\n` +
      `• /announcement remove - Hapus grup pengumuman (admin only)\n\n` +
      `📊 *Info Commands:*\n` +
      `• /fund - Lihat saldo kas & laporan bulan ini\n` +
      `• /schedule - Lihat jadwal pelajaran hari ini\n` +
      `• /assignments - Lihat tugas yang pending\n` +
      `• /help - Tampilkan pesan ini\n\n` +
      `⏰ *Pengumuman Otomatis:*\n` +
      `• Piket harian + reminder personal\n` +
      `• Jadwal pelajaran setiap pagi\n` +
      `• Reminder tugas\n` +
      `• Ucapan ulang tahun\n` +
      `• Laporan kas bulanan`;

    await this.sock.sendMessage(jid, { text: message });
  }

  private formatCurrency(amount: number, currency: string): string {
    if (currency === 'IDR' || currency === 'idr') {
      return `Rp ${amount.toLocaleString('id-ID')}`;
    }
    return `${amount} ${currency}`;
  }
}
