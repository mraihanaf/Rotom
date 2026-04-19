import { Controller } from '@nestjs/common';
import { Implement, implement } from '@orpc/nest';
import { contract } from 'src/contract';
import { SettingsService } from './settings.service';
import { role } from 'src/common/middleware/role';
import { ROLES } from 'src/common/enum';

@Controller()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Implement(contract.settings.getWhatsappSettings)
  getWhatsappSettings() {
    return implement(contract.settings.getWhatsappSettings)
      .use(role([ROLES.ADMIN]))
      .handler(async () => {
        return this.settingsService.getWhatsappSettings();
      });
  }

  @Implement(contract.settings.updateWhatsappSettings)
  updateWhatsappSettings() {
    return implement(contract.settings.updateWhatsappSettings)
      .use(role([ROLES.ADMIN]))
      .handler(async ({ input }) => {
        return this.settingsService.updateWhatsappSettings(input);
      });
  }

  @Implement(contract.settings.getPublicWhatsappSettings)
  getPublicWhatsappSettings() {
    return implement(contract.settings.getPublicWhatsappSettings)
      .handler(async () => {
        return this.settingsService.getPublicWhatsappSettings();
      });
  }
}
