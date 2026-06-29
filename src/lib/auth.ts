export const AUTH_URL = 'https://functions.poehali.dev/1c31dd39-a734-4b06-bc38-a2e25d8ad7cf';
export const PROJECTS_URL = 'https://functions.poehali.dev/2b772da8-0a47-4371-97c7-b0a6834cdf0e';

export interface User {
  id: number;
  email: string;
  name: string;
  plan: string;
  created_at?: string;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  status: string;
  url: string;
  created_at: string;
  updated_at: string;
}

export function getSession(): string | null {
  return localStorage.getItem('session_id');
}

export function setSession(id: string) {
  localStorage.setItem('session_id', id);
}

export function clearSession() {
  localStorage.removeItem('session_id');
  localStorage.removeItem('user');
}

export function getStoredUser(): User | null {
  try {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
}

export function storeUser(user: User) {
  localStorage.setItem('user', JSON.stringify(user));
}

export async function apiRegister(email: string, password: string, name: string) {
  const res = await fetch(AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'register', email, password, name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка регистрации');
  return data;
}

export async function apiLogin(email: string, password: string) {
  const res = await fetch(AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login', email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка входа');
  return data;
}

export async function apiGetMe(sessionId: string) {
  const res = await fetch(AUTH_URL, {
    headers: { 'x-session-id': sessionId },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Не авторизован');
  return data;
}

export async function apiGetProjects(sessionId: string): Promise<Project[]> {
  const res = await fetch(PROJECTS_URL, {
    headers: { 'x-session-id': sessionId },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка загрузки проектов');
  return data.projects;
}

export async function apiCreateProject(sessionId: string, title: string, description: string) {
  const res = await fetch(PROJECTS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-session-id': sessionId },
    body: JSON.stringify({ title, description }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка создания проекта');
  return data.project;
}