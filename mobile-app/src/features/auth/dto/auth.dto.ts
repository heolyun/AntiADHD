export type UserSummary = {
  id: number;
  email: string;
  name: string;
};

export type AuthResponse = {
  token: string;
  user: UserSummary;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type SignupRequest = LoginRequest & {
  name: string;
};

