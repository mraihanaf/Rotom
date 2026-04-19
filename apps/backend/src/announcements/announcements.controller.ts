import { Controller } from '@nestjs/common';
import { Implement, implement } from '@orpc/nest';
import { contract } from 'src/contract';
import { AnnouncementsService } from './announcements.service';

@Controller()
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Implement(contract.announcements.getTodayDuties)
  getTodayDuties() {
    return implement(contract.announcements.getTodayDuties)
      .handler(async () => {
        return this.announcementsService.getTodayDuties();
      });
  }

  @Implement(contract.announcements.getTodaySchedule)
  getTodaySchedule() {
    return implement(contract.announcements.getTodaySchedule)
      .handler(async () => {
        return this.announcementsService.getTodaySchedule();
      });
  }

  @Implement(contract.announcements.getPendingAssignments)
  getPendingAssignments() {
    return implement(contract.announcements.getPendingAssignments)
      .handler(async () => {
        return this.announcementsService.getPendingAssignments();
      });
  }

  @Implement(contract.announcements.getTodayBirthdays)
  getTodayBirthdays() {
    return implement(contract.announcements.getTodayBirthdays)
      .handler(async () => {
        return this.announcementsService.getTodayBirthdays();
      });
  }

  @Implement(contract.announcements.getFundReport)
  getFundReport() {
    return implement(contract.announcements.getFundReport)
      .handler(async () => {
        return this.announcementsService.getFundReport();
      });
  }

  @Implement(contract.announcements.getAnnouncementSettings)
  getAnnouncementSettings() {
    return implement(contract.announcements.getAnnouncementSettings)
      .handler(async () => {
        return this.announcementsService.getAnnouncementSettings();
      });
  }

  @Implement(contract.announcements.isAdminByPhone)
  isAdminByPhone() {
    return implement(contract.announcements.isAdminByPhone)
      .handler(async ({ input }) => {
        const isAdmin = await this.announcementsService.isAdminByPhone(input.phoneNumber);
        return { isAdmin };
      });
  }

  @Implement(contract.announcements.updateAnnouncementGroup)
  updateAnnouncementGroup() {
    return implement(contract.announcements.updateAnnouncementGroup)
      .handler(async ({ input }) => {
        const success = await this.announcementsService.updateAnnouncementGroup(
          input.phoneNumber,
          input.groupJid,
        );
        return { success };
      });
  }
}
