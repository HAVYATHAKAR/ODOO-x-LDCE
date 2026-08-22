import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { communityApi } from "@/api/endpoints/community";
import { tripsApi } from "@/api/endpoints/trips";
import { qk } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Container } from "@/components/Container";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { Input } from "@/components/Input";
import { Textarea } from "@/components/Textarea";
import { Select } from "@/components/Select";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { Alert } from "@/components/Alert";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/Skeleton";
import { Spinner } from "@/components/Spinner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { fmtRelative, fullName } from "@/lib/format";
import type { ApiError, CommentOut, Page, PostOut } from "@/api/types";

const PAGE_SIZE = 10;

export function CommunityPage() {
  const { isAuthenticated } = useAuth();
  const [page, setPage] = useState(1);
  const [composerOpen, setComposerOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: qk.posts({ page }),
    queryFn: () => communityApi.listPosts({ page, size: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });

  const posts = data?.items ?? [];
  const pages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));

  return (
    <Container size="narrow">
      <PageHeader
        title="Community"
        subtitle="Travel stories and itineraries shared by fellow travelers."
        actions={
          isAuthenticated ? (
            <Button icon="edit" onClick={() => setComposerOpen(true)}>
              New post
            </Button>
          ) : (
            <Link to="/login">
              <Button icon="login">Log in to post</Button>
            </Link>
          )
        }
      />

      <div className="mt-8 space-y-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-2 h-3 w-20" />
                </div>
              </div>
              <Skeleton className="mt-4 h-5 w-2/3" />
              <Skeleton className="mt-2 h-16 w-full" />
            </Card>
          ))
        ) : posts.length === 0 ? (
          <EmptyState
            icon="forum"
            title="No posts yet"
            description="Be the first to share a trip story with the community."
            action={
              isAuthenticated ? (
                <Button icon="edit" onClick={() => setComposerOpen(true)}>
                  Write a post
                </Button>
              ) : undefined
            }
          />
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>

      {pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <Button variant="outline" size="sm" icon="chevron_left" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Prev
          </Button>
          <span className="text-body-sm text-on-surface-variant">
            Page {page} of {pages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>
            Next <Icon name="chevron_right" size={18} />
          </Button>
        </div>
      )}

      {composerOpen && <NewPostModal onClose={() => setComposerOpen(false)} />}
    </Container>
  );
}

// ── Post card ────────────────────────────────────────────────
function PostCard({ post }: { post: PostOut }) {
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const patchInCache = (updater: (p: PostOut) => PostOut) => {
    queryClient.setQueriesData<Page<PostOut>>({ queryKey: ["posts"] }, (old) =>
      old ? { ...old, items: old.items.map((p) => (p.id === post.id ? updater(p) : p)) } : old,
    );
  };

  const like = useMutation({
    mutationFn: () => communityApi.toggleLike(post.id),
    onSuccess: (res) => patchInCache((p) => ({ ...p, liked_by_me: res.liked, like_count: res.like_count })),
    onError: (err) => toast.error((err as ApiError).detail || "Could not update like"),
  });

  const del = useMutation({
    mutationFn: () => communityApi.deletePost(post.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Post deleted");
    },
    onError: (err) => toast.error((err as ApiError).detail || "Could not delete post"),
  });

  const mine = user?.id === post.author.id;

  const onLike = () => {
    if (!isAuthenticated) {
      toast.info("Log in to like posts");
      return;
    }
    like.mutate();
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar user={post.author} size={44} />
          <div>
            <p className="font-semibold text-on-surface">{fullName(post.author)}</p>
            <p className="text-caption text-on-surface-variant">
              @{post.author.username} · {fmtRelative(post.created_at)}
            </p>
          </div>
        </div>
        {mine && (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-high hover:text-error"
            aria-label="Delete post"
          >
            <Icon name="delete" size={20} />
          </button>
        )}
      </div>

      <h3 className="mt-4 font-headline-md text-xl font-bold text-ocean-deep">{post.title}</h3>
      <p className="mt-2 whitespace-pre-wrap text-body-md text-on-surface-variant">{post.body}</p>

      {post.image_url && (
        <img src={post.image_url} alt="" className="mt-4 max-h-96 w-full rounded-xl object-cover" />
      )}

      {post.trip_id && (
        <Link
          to={`/trips/${post.trip_id}`}
          className="mt-4 inline-flex items-center gap-1 text-body-sm font-semibold text-ocean-deep hover:underline"
        >
          <Icon name="map" size={16} /> View the trip
        </Link>
      )}

      <div className="mt-4 flex items-center gap-2 border-t border-surface-variant pt-4">
        <button
          type="button"
          onClick={onLike}
          disabled={like.isPending}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-body-sm font-semibold transition-colors disabled:opacity-60 ${
            post.liked_by_me
              ? "bg-error-container text-on-error-container"
              : "text-on-surface-variant hover:bg-surface-container-high"
          }`}
        >
          <Icon name="favorite" fill={post.liked_by_me} size={18} /> {post.like_count}
        </button>
        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-body-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-high"
        >
          <Icon name="chat_bubble" size={18} /> {post.comment_count}
        </button>
      </div>

      {showComments && <CommentsSection postId={post.id} />}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this post?"
        message="This permanently removes your post and its comments."
        confirmLabel="Delete"
        danger
        loading={del.isPending}
        onConfirm={() => del.mutate()}
        onClose={() => setConfirmDelete(false)}
      />
    </Card>
  );
}

// ── Comments ─────────────────────────────────────────────────
function CommentsSection({ postId }: { postId: number }) {
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");

  const { data: comments, isLoading } = useQuery({
    queryKey: qk.comments(postId),
    queryFn: () => communityApi.listComments(postId),
  });

  const bumpCount = (delta: number) => {
    queryClient.setQueriesData<Page<PostOut>>({ queryKey: ["posts"] }, (old) =>
      old
        ? {
            ...old,
            items: old.items.map((p) =>
              p.id === postId ? { ...p, comment_count: Math.max(0, p.comment_count + delta) } : p,
            ),
          }
        : old,
    );
  };

  const add = useMutation({
    mutationFn: (body: string) => communityApi.addComment(postId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.comments(postId) });
      bumpCount(1);
      setText("");
    },
    onError: (err) => toast.error((err as ApiError).detail || "Could not add comment"),
  });

  const del = useMutation({
    mutationFn: (commentId: number) => communityApi.deleteComment(postId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.comments(postId) });
      bumpCount(-1);
    },
    onError: (err) => toast.error((err as ApiError).detail || "Could not delete comment"),
  });

  return (
    <div className="mt-4 border-t border-surface-variant pt-4">
      {isAuthenticated && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) add.mutate(text.trim());
          }}
          className="mb-4 flex items-start gap-2"
        >
          <Avatar user={user} size={32} />
          <div className="flex-1">
            <Textarea
              rows={2}
              placeholder="Add a comment…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="mt-2 flex justify-end">
              <Button type="submit" size="sm" icon="send" loading={add.isPending} disabled={!text.trim()}>
                Comment
              </Button>
            </div>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Spinner size={22} />
        </div>
      ) : (comments?.length ?? 0) === 0 ? (
        <p className="py-2 text-center text-body-sm text-on-surface-variant">No comments yet.</p>
      ) : (
        <ul className="space-y-3">
          {comments!.map((c: CommentOut) => (
            <li key={c.id} className="flex items-start gap-2">
              <Avatar user={c.author} size={32} />
              <div className="flex-1 rounded-xl bg-surface-container-low/70 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-body-sm font-semibold text-on-surface">
                    {fullName(c.author)}{" "}
                    <span className="font-normal text-on-surface-variant">· {fmtRelative(c.created_at)}</span>
                  </p>
                  {user?.id === c.author.id && (
                    <button
                      type="button"
                      onClick={() => del.mutate(c.id)}
                      className="text-on-surface-variant hover:text-error"
                      aria-label="Delete comment"
                    >
                      <Icon name="close" size={16} />
                    </button>
                  )}
                </div>
                <p className="mt-0.5 whitespace-pre-wrap text-body-sm text-on-surface-variant">{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Composer ─────────────────────────────────────────────────
const postSchema = z.object({
  title: z.string().trim().min(1, "Give your post a title").max(150),
  body: z.string().trim().min(1, "Write something to share").max(5000),
  image_url: z.string().trim().url("Enter a valid URL").or(z.literal("")).optional(),
  trip_id: z.string().optional(),
});
type PostValues = z.infer<typeof postSchema>;

function NewPostModal({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);

  const tripsQuery = useQuery({
    queryKey: qk.trips({ composer: true }),
    queryFn: () => tripsApi.list({ size: 100 }),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PostValues>({ resolver: zodResolver(postSchema) });

  const create = useMutation({
    mutationFn: (v: PostValues) =>
      communityApi.createPost({
        title: v.title,
        body: v.body,
        image_url: v.image_url || null,
        trip_id: v.trip_id ? Number(v.trip_id) : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Post published");
      onClose();
    },
    onError: (err) => setFormError((err as ApiError).detail || "Could not publish post"),
  });

  const trips = tripsQuery.data?.items ?? [];

  return (
    <Modal
      open
      onClose={onClose}
      title="New post"
      description="Share a trip story or tip with the community."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button icon="send" loading={create.isPending} onClick={handleSubmit((v) => { setFormError(null); create.mutate(v); })}>
            Publish
          </Button>
        </>
      }
    >
      <form className="space-y-4" noValidate>
        {formError && <Alert tone="danger">{formError}</Alert>}
        <Input label="Title" error={errors.title?.message} {...register("title")} />
        <Textarea label="Your story" rows={5} error={errors.body?.message} {...register("body")} />
        <Input label="Image URL (optional)" icon="image" error={errors.image_url?.message} {...register("image_url")} />
        <Select label="Link a trip (optional)" {...register("trip_id")}>
          <option value="">None</option>
          {trips.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
      </form>
    </Modal>
  );
}
