import { announcementsContract } from './announcements/announcements.contract';
import { assignmentsContract } from './assignments/assignments.contract';
import { dashboardContract } from './dashboard/dashboard.contract';
import { dutiesContract } from './duties/duties.contract';
import { fundsContract } from './funds/funds.contract';
import { galleryContract } from './gallery/gallery.contract';
import { organizationContract } from './organization/organization.contract';
import { profilesContract } from './profiles/profile.contract';
import { schedulesContract } from './schedules/schedules.contract';
import { settingsContract } from './settings/settings.contract';
import { subjectsContract } from './subjects/subjects.contract';
import { usersContract } from './users/users.contract';

export const contract = {
  profiles: profilesContract,
  funds: fundsContract,
  subjectMaterials: subjectsContract,
  gallery: galleryContract,
  assignments: assignmentsContract,
  duty: dutiesContract,
  organization: organizationContract,
  schedules: schedulesContract,
  users: usersContract,
  dashboard: dashboardContract,
  settings: settingsContract,
  announcements: announcementsContract,
};
