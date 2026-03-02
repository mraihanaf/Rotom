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

  constructor(private readonly discoveryService: DiscoveryService) {}

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
}
