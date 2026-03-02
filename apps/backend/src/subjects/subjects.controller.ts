import { Controller } from '@nestjs/common';
import { Implement, implement } from '@orpc/nest';
import { ROLES } from 'src/common/enum';
import { protectedRoute } from 'src/common/middleware/protectedRoute';
import { role } from 'src/common/middleware/role';
import { contract } from 'src/contract';
import { SubjectsService } from './subjects.service';

@Controller('')
export class SubjectsController {
  constructor(public readonly subjectsService: SubjectsService) {}

  @Implement(contract.subjectMaterials.getAll)
  getAll() {
    return implement(contract.subjectMaterials.getAll)
      .use(protectedRoute)
      .handler(async ({ input }) => {
        return await this.subjectsService.getAllSubjects(input);
      });
  }

  @Implement(contract.subjectMaterials.updateById)
  updateById() {
    return implement(contract.subjectMaterials.updateById)
      .use(role([ROLES.ADMIN]))
      .handler(async ({ input }) => {
        await this.subjectsService.updateSubjectById(input);
      });
  }

  @Implement(contract.subjectMaterials.create)
  create() {
    return implement(contract.subjectMaterials.create)
      .use(role([ROLES.ADMIN]))
      .handler(async ({ input }) => {
        await this.subjectsService.createSubject(input.name);
      });
  }

  @Implement(contract.subjectMaterials.deleteById)
  deleteById() {
    return implement(contract.subjectMaterials.deleteById)
      .use(role([ROLES.ADMIN]))
      .handler(async ({ input }) => {
        await this.subjectsService.deleteSubjectById(input.id);
      });
  }
}
