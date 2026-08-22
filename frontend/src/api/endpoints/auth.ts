import { get, post } from "../client";
import type {
  AuthResponse,
  ForgotPasswordResponse,
  LoginRequest,
  Message,
  RegisterRequest,
  UserProfile,
} from "../types";

export const authApi = {
  register: (body: RegisterRequest) => post<AuthResponse>("/auth/register", body),
  login: (body: LoginRequest) => post<AuthResponse>("/auth/login", body),
  me: () => get<UserProfile>("/auth/me"),
  logout: () => post<Message>("/auth/logout"),
  changePassword: (current_password: string, new_password: string) =>
    post<Message>("/auth/change-password", { current_password, new_password }),
  forgotPassword: (email: string) =>
    post<ForgotPasswordResponse>("/auth/forgot-password", { email }),
  resetPassword: (token: string, new_password: string) =>
    post<Message>("/auth/reset-password", { token, new_password }),
};
