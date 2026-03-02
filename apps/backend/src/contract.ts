import { assignmentsContract } from './assignments/assignments.contract';
import { dutiesContract } from './duties/duties.contract';
import { fundsContract } from './funds/funds.contract';
import { galleryContract } from './gallery/gallery.contract';
import { profilesContract } from './profiles/profile.contract';
import { subjectsContract } from './subjects/subjects.contract';

export const contract = {
  profiles: profilesContract,
  funds: fundsContract,
  subjectMaterials: subjectsContract,
  gallery: galleryContract,
  assignments: assignmentsContract,
  duty: dutiesContract,
};
