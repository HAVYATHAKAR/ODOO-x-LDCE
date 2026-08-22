import { del, get, post, put } from "../client";
import type {
  CommentOut,
  LikeToggleResponse,
  Page,
  PostCreate,
  PostOut,
} from "../types";

export interface PostListParams {
  page?: number;
  size?: number;
}

export const communityApi = {
  listPosts: (params: PostListParams = {}) =>
    get<Page<PostOut>>("/community/posts", { params }),
  getPost: (id: number) => get<PostOut>(`/community/posts/${id}`),
  createPost: (body: PostCreate) => post<PostOut>("/community/posts", body),
  updatePost: (id: number, body: Partial<PostCreate>) =>
    put<PostOut>(`/community/posts/${id}`, body),
  deletePost: (id: number) => del(`/community/posts/${id}`),
  toggleLike: (id: number) => post<LikeToggleResponse>(`/community/posts/${id}/like`),

  listComments: (postId: number) =>
    get<CommentOut[]>(`/community/posts/${postId}/comments`),
  addComment: (postId: number, body: string) =>
    post<CommentOut>(`/community/posts/${postId}/comments`, { body }),
  deleteComment: (postId: number, commentId: number) =>
    del(`/community/posts/${postId}/comments/${commentId}`),
};
