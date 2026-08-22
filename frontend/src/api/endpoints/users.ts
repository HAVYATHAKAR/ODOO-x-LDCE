import { del, get, put } from "../client";
import type { Message, UserProfile, UserUpdate } from "../types";

export const usersApi = {
  me: () => get<UserProfile>("/users/me"),
  updateMe: (body: UserUpdate) => put<UserProfile>("/users/me", body),
  deleteMe: () => del<Message>("/users/me"),
};
