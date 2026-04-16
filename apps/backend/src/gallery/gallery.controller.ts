import { Controller } from '@nestjs/common';
import { Implement, implement } from '@orpc/nest';
import { protectedRoute } from 'src/common/middleware/protectedRoute';
import { requireCompleteProfile } from 'src/common/middleware/requireCompleteProfile';
import { contract } from 'src/contract';
import { GalleryService } from './gallery.service';
import { ROLES } from 'src/common/enum';

@Controller()
export class GalleryController {
  constructor(public readonly galleryService: GalleryService) {}

  @Implement(contract.gallery.getAllPosts)
  getAllPosts() {
    return implement(contract.gallery.getAllPosts)
      .use(protectedRoute)
      .use(requireCompleteProfile)
      .handler(async ({ input, context }) => {
        return await this.galleryService.getAllPosts({
          ...input,
          userId: context.session?.user.id ?? '',
        });
      });
  }

  @Implement(contract.gallery.getPostUserReactions)
  getPostUserReaction() {
    return implement(contract.gallery.getPostUserReactions)
      .use(protectedRoute)
      .use(requireCompleteProfile)
      .handler(async ({ input }) => {
        return await this.galleryService.getPostUserReactions(input);
      });
  }

  @Implement(contract.gallery.createPost)
  createPost() {
    return implement(contract.gallery.createPost)
      .use(protectedRoute)
      .use(requireCompleteProfile)
      .handler(async ({ input, context }) => {
        await this.galleryService.createPost({
          file: input.file,
          userId: context.session?.user.id ?? '',
        });
      });
  }

  @Implement(contract.gallery.reactPostById)
  reactPostById() {
    return implement(contract.gallery.reactPostById)
      .use(protectedRoute)
      .use(requireCompleteProfile)
      .handler(async ({ input, context }) => {
        await this.galleryService.upsertPostReaction({
          ...input,
          userId: context.session?.user.id ?? '',
        });
      });
  }

  @Implement(contract.gallery.deleteReactionByPostId)
  deleteReactionByPostId() {
    return implement(contract.gallery.deleteReactionByPostId)
      .use(protectedRoute)
      .use(requireCompleteProfile)
      .handler(async ({ input, context }) => {
        await this.galleryService.deletePostReaction({
          ...input,
          userId: context.session?.user.id ?? '',
        });
      });
  }

  @Implement(contract.gallery.deletePostById)
  deletePostById() {
    return implement(contract.gallery.deletePostById)
      .use(protectedRoute)
      .use(requireCompleteProfile)
      .handler(async ({ input, context }) => {
        await this.galleryService.deletePostById({
          ...input,
          userId: context.session?.user.id ?? '',
          isAdmin: context.session?.user.role === ROLES.ADMIN,
        });
      });
  }
}
