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

async function apiFetch(url: string, options: RequestInit = {}) {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    let raw: Record<string, unknown> = {};
    try {
      raw = await res.json();
    } catch {
      if (!res.ok) throw new Error(`Ошибка сервера: ${res.status}`);
    }

    // Платформа может оборачивать ответ в { body: { ... } }
    // Если body — объект, используем его, иначе парсим как строку
    let data: Record<string, unknown> = raw;
    if (raw.body !== undefined) {
      if (typeof raw.body === 'string') {
        try { data = JSON.parse(raw.body); } catch { data = raw; }
      } else if (typeof raw.body === 'object' && raw.body !== null) {
        data = raw.body as Record<string, unknown>;
      }
    }

    // Определяем статус — из поля statusCode или из res.status
    const statusCode = typeof raw.statusCode === 'number' ? raw.statusCode : res.status;
    const ok = statusCode >= 200 && statusCode < 300;

    return { res: { ...res, ok, status: statusCode }, data };
  } catch (e: unknown) {
    if (e instanceof TypeError && e.message.includes('fetch')) {
      throw new Error('Нет соединения с сервером. Проверьте интернет.');
    }
    throw e;
  }
}

export async function apiRegister(email: string, password: string, name: string) {
  const { res, data } = await apiFetch(AUTH_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'register', email, password, name }),
  });
  if (!res.ok) throw new Error((data as {error?: string}).error || 'Ошибка регистрации');
  return data;
}

export async function apiLogin(email: string, password: string) {
  const { res, data } = await apiFetch(AUTH_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'login', email, password }),
  });
  if (!res.ok) throw new Error((data as {error?: string}).error || 'Ошибка входа');
  return data;
}

export async function apiGetMe(sessionId: string) {
  const { res, data } = await apiFetch(AUTH_URL, {
    headers: { 'x-session-id': sessionId },
  });
  if (!res.ok) throw new Error((data as {error?: string}).error || 'Не авторизован');
  return data;
}

export async function apiGetProjects(sessionId: string): Promise<Project[]> {
  const { res, data } = await apiFetch(PROJECTS_URL, {
    headers: { 'x-session-id': sessionId },
  });
  if (!res.ok) throw new Error((data as {error?: string}).error || 'Ошибка загрузки проектов');
  return (data as {projects: Project[]}).projects;
}

export async function apiCreateProject(sessionId: string, title: string, description: string) {
  const { res, data } = await apiFetch(PROJECTS_URL, {
    method: 'POST',
    headers: { 'x-session-id': sessionId },
    body: JSON.stringify({ title, description }),
  });
  if (!res.ok) throw new Error((data as {error?: string}).error || 'Ошибка создания проекта');
  return (data as {project: Project}).project;
}