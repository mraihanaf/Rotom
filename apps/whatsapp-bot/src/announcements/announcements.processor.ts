import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { BaileysService } from '../baileys/baileys.service';
import { ApiService } from '../api/api.service';

@Processor('whatsapp', {
  concurrency: 3, // Process up to 3 jobs simultaneously
})
export class AnnouncementsProcessor extends WorkerHost {
  private readonly logger = new Logger(AnnouncementsProcessor.name);

  constructor(
    private readonly baileysService: BaileysService,
    private readonly apiService: ApiService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.debug(`Processing job: ${job.name}`, job.data);

    // Ensure socket is ready
    const sock = this.baileysService.sock;
    if (!sock) {
      this.logger.warn('WhatsApp socket not ready, throwing error for retry');
      throw new Error('WhatsApp socket not ready');
    }

    const settings = await this.apiService.getAnnouncementSettings();

    switch (job.name) {
      case 'duty-reminder': {
        if (!settings.ENABLE_WHATSAPP_BOT_DUTY_REPORT) {
          this.logger.debug('Duty reminders disabled');
          return;
        }
        await this.sendDutyReminder(settings);
        break;
      }

      case 'schedule-reminder': {
        if (!settings.ENABLE_WHATSAPP_BOT_SUBJECT_SCHEDULE_REMINDER) {
          this.logger.debug('Schedule reminders disabled');
          return;
        }
        await this.sendScheduleReminder(settings);
        break;
      }

      case 'assignment-reminder': {
        if (!settings.ENABLE_WHATSAPP_BOT_ASSIGNMENT_REMINDER) {
          this.logger.debug('Assignment reminders disabled');
          return;
        }
        await this.sendAssignmentReminder(settings);
        break;
      }

      case 'birthday-check': {
        if (!settings.ENABLE_WHATSAPP_BOT_BIRTHDAY_REMINDER) {
          this.logger.debug('Birthday reminders disabled');
          return;
        }
        await this.sendBirthdayMessages(settings);
        break;
      }

      case 'fund-report': {
        if (!settings.ENABLE_WHATSAPP_BOT_FUND_REPORT) {
          this.logger.debug('Fund report disabled');
          return;
        }
        await this.sendFundReport(settings);
        break;
      }

      default:
        this.logger.warn(`Unknown job type: ${job.name}`);
    }
  }

  private async sendDutyReminder(settings: {
    announcementGroupJid: string | null;
    dutyPersonalizedMessage: string;
  }): Promise<void> {
    if (!settings.announcementGroupJid) {
      this.logger.warn('No announcement group JID configured');
      return;
    }

    try {
      const duties = await this.apiService.getTodayDuties();

      if (duties.length === 0) {
        this.logger.debug('No duties scheduled for today');
        return;
      }

      const dayName = new Date().toLocaleDateString('id-ID', { weekday: 'long' });

      // Send group announcement
      let groupMessage = `🧹 *Jadwal Piket Hari ${dayName}*\n\n`;
      duties.forEach((d, idx) => {
        groupMessage += `${idx + 1}. *${d.name}* - ${d.dutyType.name}\n`;
      });
      groupMessage += '\nJangan lupa piket tepat waktu ya! 👍';

      await this.baileysService.sock.sendMessage(settings.announcementGroupJid, {
        text: groupMessage,
      });

      // Send personalized messages to each person
      for (const duty of duties) {
        if (duty.phoneNumber) {
          const personalizedMessage = settings.dutyPersonalizedMessage.replace(
            '{name}',
            duty.name
          );
          const jid = `${duty.phoneNumber}@s.whatsapp.net`;
          try {
            await this.baileysService.sock.sendMessage(jid, {
              text: personalizedMessage,
            });
            this.logger.debug(`Sent duty reminder to ${duty.name}`);
          } catch (err) {
            this.logger.warn(`Failed to send duty reminder to ${duty.name}:`, err);
          }
        }
      }

      this.logger.log('Duty reminders sent successfully');
    } catch (error) {
      this.logger.error('Failed to send duty reminder:', error);
      throw error;
    }
  }

  private async sendScheduleReminder(settings: {
    announcementGroupJid: string | null;
  }): Promise<void> {
    if (!settings.announcementGroupJid) {
      this.logger.warn('No announcement group JID configured');
      return;
    }

    try {
      const schedules = await this.apiService.getTodaySchedule();

      if (schedules.length === 0) {
        this.logger.debug('No schedule for today');
        return;
      }

      const dayName = new Date().toLocaleDateString('id-ID', { weekday: 'long' });
      let message = `📚 *Jadwal Pelajaran Hari ${dayName}*\n\n`;

      schedules.forEach((s, idx) => {
        message += `${idx + 1}. *${s.subjectName}*\n`;
        message += `   🕐 ${s.startTime} - ${s.endTime}\n`;
        if (s.room) message += `   📍 Ruang: ${s.room}\n`;
        message += '\n';
      });

      message += 'Selamat belajar! 📖';

      await this.baileysService.sock.sendMessage(settings.announcementGroupJid, {
        text: message,
      });

      this.logger.log('Schedule reminder sent successfully');
    } catch (error) {
      this.logger.error('Failed to send schedule reminder:', error);
      throw error;
    }
  }

  private async sendAssignmentReminder(settings: {
    announcementGroupJid: string | null;
  }): Promise<void> {
    if (!settings.announcementGroupJid) {
      this.logger.warn('No announcement group JID configured');
      return;
    }

    try {
      const assignments = await this.apiService.getPendingAssignments();

      if (assignments.length === 0) {
        this.logger.debug('No pending assignments');
        return;
      }

      let message = `📝 *Reminder Tugas*\n\n`;
      message += `Ada ${assignments.length} tugas yang perlu diselesaikan:\n\n`;

      assignments.slice(0, 5).forEach((a, idx) => {
        const dueDate = new Date(a.dueDate).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
        });
        message += `${idx + 1}. *${a.title}*\n`;
        message += `   📚 ${a.subject.name} - 📅 ${dueDate}\n`;
        message += '\n';
      });

      if (assignments.length > 5) {
        message += `_...dan ${assignments.length - 5} tugas lainnya_\n\n`;
      }

      message += 'Jangan lupa kerjakan tugasnya tepat waktu! 💪';

      await this.baileysService.sock.sendMessage(settings.announcementGroupJid, {
        text: message,
      });

      this.logger.log('Assignment reminder sent successfully');
    } catch (error) {
      this.logger.error('Failed to send assignment reminder:', error);
      throw error;
    }
  }

  private async sendBirthdayMessages(settings: {
    announcementGroupJid: string | null;
    birthdayMessageTemplate: string;
  }): Promise<void> {
    if (!settings.announcementGroupJid) {
      this.logger.warn('No announcement group JID configured');
      return;
    }

    try {
      const birthdays = await this.apiService.getTodayBirthdays();

      if (birthdays.length === 0) {
        this.logger.debug('No birthdays today');
        return;
      }

      for (const person of birthdays) {
        // Send to group
        const groupMessage = `🎉 *Selamat Ulang Tahun ${person.name}!* 🎂\n\n` +
          `Semoga panjang umur, sehat selalu, dan sukses! 🎁🎈`;

        await this.baileysService.sock.sendMessage(settings.announcementGroupJid, {
          text: groupMessage,
        });

        // Send personalized message to birthday person
        if (person.phoneNumber) {
          const personalMessage = settings.birthdayMessageTemplate.replace(
            '{name}',
            person.name
          );
          const jid = `${person.phoneNumber}@s.whatsapp.net`;
          try {
            await this.baileysService.sock.sendMessage(jid, {
              text: personalMessage,
            });
            this.logger.debug(`Sent birthday message to ${person.name}`);
          } catch (err) {
            this.logger.warn(`Failed to send birthday message to ${person.name}:`, err);
          }
        }
      }

      this.logger.log(`Birthday messages sent for ${birthdays.length} person(s)`);
    } catch (error) {
      this.logger.error('Failed to send birthday messages:', error);
      throw error;
    }
  }

  private async sendFundReport(settings: {
    announcementGroupJid: string | null;
  }): Promise<void> {
    if (!settings.announcementGroupJid) {
      this.logger.warn('No announcement group JID configured');
      return;
    }

    try {
      const report = await this.apiService.getFundReport();
      const currency = report.currency.toUpperCase();
      const monthName = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

      const message = `💰 *Laporan Kas Bulan ${monthName}*\n\n` +
        `Saldo saat ini: *${this.formatCurrency(report.totalAmount, currency)}*\n\n` +
        `📊 Rincian bulan ini:\n` +
        `• Pemasukan: ${this.formatCurrency(report.monthIncome, currency)}\n` +
        `• Pengeluaran: ${this.formatCurrency(report.monthExpense, currency)}\n` +
        `• Net: ${this.formatCurrency(report.monthNet, currency)}\n\n` +
        `Terima kasih atas kontribusi semuanya! 🙏`;

      await this.baileysService.sock.sendMessage(settings.announcementGroupJid, {
        text: message,
      });

      this.logger.log('Fund report sent successfully');
    } catch (error) {
      this.logger.error('Failed to send fund report:', error);
      throw error;
    }
  }

  private formatCurrency(amount: number, currency: string): string {
    if (currency === 'IDR' || currency === 'idr') {
      return `Rp ${amount.toLocaleString('id-ID')}`;
    }
    return `${amount} ${currency}`;
  }
}
