import { api } from "./client";

export type User = {
  id: number;
  full_name: string;
  email_or_phone: string;
  blood_type: string | null;
  emergency_contact: string | null;
  can_provide_first_aid: boolean;
  first_aid_skills: string[];
};

export type RegisterPayload = {
  full_name: string;
  email_or_phone: string;
  password: string;
  password_confirmation: string;
  blood_type?: string | null;
  emergency_contact?: string | null;
  can_provide_first_aid: boolean;
  first_aid_skills: string[];
};

export async function login(emailOrPhone: string, password: string) {
  const res = await api.post<{ access_token: string; token_type: string }>(
    "/auth/login",
    { email_or_phone: emailOrPhone, password }
  );
  return res.data;
}

export async function register(payload: RegisterPayload) {
  const res = await api.post<User>("/auth/register", payload);
  return res.data;
}

export async function getMe() {
  const res = await api.get<User>("/auth/me");
  return res.data;
}

export async function getFirstAidSkills() {
  const res = await api.get<{ skills: string[] }>("/auth/first-aid-skills");
  return res.data.skills;
}
