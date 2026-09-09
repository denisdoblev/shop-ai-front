import type { components } from "@/lib/api/generated";

export type RegisterRequest = components["schemas"]["CreateUserDto"];
export type LoginRequest = components["schemas"]["LoginUserDto"];
export type AuthResponse = components["schemas"]["AuthResponseDto"];
export type AuthenticatedUser = Omit<AuthResponse, "token">;

export type LoginCommand = LoginRequest & {
  remember: boolean;
};
