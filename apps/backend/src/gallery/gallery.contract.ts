import { oc } from '@orpc/contract';
import {
  createPostInputSchema,
  deletePostByIdInputSchema,
  getAllPostsInputSchema,
  getAllPostsOutputSchema,
  reactPostByIdInputSchema,
  getPostUserReactionsInputSchema,
  getPostUserReactionsOutputSchema,
  deleteReactionByPostIdInputSchema,
} from './gallery.schema';

const getAllPosts = oc
  .route({
    path: '/gallery/posts',
    method: 'GET',
    tags: ['Gallery'],
  })
  .input(getAllPostsInputSchema)
  .output(getAllPostsOutputSchema);

const getPostUserReactions = oc
  .route({
    path: '/gallery/posts/{postId}/reactions',
    method: 'GET',
    tags: ['Gallery'],
  })
  .input(getPostUserReactionsInputSchema)
  .output(getPostUserReactionsOutputSchema);

const deletePostById = oc
  .route({
    path: '/gallery/posts/{id}',
    method: 'DELETE',
    tags: ['Gallery'],
  })
  .input(deletePostByIdInputSchema);

const reactPostById = oc
  .route({
    path: '/gallery/posts/{postId}/reactions',
    method: 'POST',
    tags: ['Gallery'],
  })
  .input(reactPostByIdInputSchema);

const deleteReactionByPostId = oc
  .route({
    path: '/gallery/posts/{postId}/reactions',
    method: 'DELETE',
    tags: ['Gallery'],
  })
  .input(deleteReactionByPostIdInputSchema);

const createPost = oc
  .route({
    path: '/gallery/posts',
    method: 'POST',
    tags: ['Gallery'],
  })
  .input(createPostInputSchema);

export const galleryContract = {
  getAllPosts,
  getPostUserReactions,
  deleteReactionByPostId,
  reactPostById,
  deletePostById,
  createPost,
};
