import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorageService } from 'src/storage/storage.service';

@Injectable()
export class OrganizationService {
  constructor(
    public readonly prismaService: PrismaService,
    public readonly storageService: StorageService,
  ) {}

  async getOrganization() {
    return await this.prismaService.organization.findFirst({});
  }

  async updateOrganization() {}

  async updateOrganizationLogo() {}
}
