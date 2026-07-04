import { apiUrl } from './apiConfig';

export const AUTH_URL = apiUrl('auth');
export const PROJECTS_URL = apiUrl('user-projects');
export const FILES_URL = apiUrl('site-files');
export const PUBLIC_SITE_URL = apiUrl('public-site');
export const DOMAINS_URL = apiUrl('domains');
export const PROJECT_CORE_URL = apiUrl('project-core');
export const GENERATE_IMAGE_URL = apiUrl('generate-image');

export interface User {
  id: number;
  email: string;
  name: string;
  plan: string;
  created_at?: string;
  requests_used?: number;
  requests_limit?: number;
  energy_balance?: number;
  github_login?: string | null;
}

// Порог, при котором показываем предупреждение о низком балансе AI-запросов
export const LOW_BALANCE_THRESHOLD = 5;

/** Считает остаток AI-запросов пользователя (лимит тарифа - использовано + энергия). */
export function getRemainingRequests(user: User | null | undefined): number | null {
  if (!user || typeof user.requests_limit !== 'number') return null;
  return Math.max(0, user.requests_limit - (user.requests_used || 0)) + (user.energy_balance || 0);
}

export interface Order {
  order_number: string;
  order_type: 'plan' | 'energy';
  plan: string | null;
  energy_amount: number | null;
  billing_period: string | null;
  amount: number;
  status: string;
  created_at: string | null;
  paid_at: string | null;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  status: string;
  url: string;
  slug?: string | null;
  html_content?: string;
  chat_history?: unknown[];
  created_at: string;
  updated_at: string;
}

export interface SiteFile {
  id: number;
  project_id: number | null;
  file_name: string;
  file_url: string;
  file_type: 'html' | 'zip' | 'image';
  file_size: number;
  created_at: string;
}

export interface Domain {
  id: number;
  domain: string;
  status: 'pending' | 'active';
  is_primary: boolean;
  redirect_mode: 'none' | 'www_to_root' | 'root_to_www';
  ssl_status: 'pending' | 'active';
  ssl_issued_at: string | null;
  ssl_expires_at: string | null;
  last_checked_at: string | null;
  verified_at: string | null;
  created_at: string | null;
  project_id: number | null;
  project_title: string | null;
}

export interface DnsCheckResult {
  verified: boolean;
  a_record: { expected: string; found: string[]; ok: boolean };
  cname_record: { expected: string; found: string; ok: boolean };
  registrar: string | null;
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

export async function apiGithubOAuth(code: string) {
  const { res, data } = await apiFetch(AUTH_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'github_oauth', code }),
  });
  if (!res.ok) throw new Error((data as {error?: string}).error || 'Ошибка авторизации через GitHub');
  return data;
}

/** Привязывает GitHub-аккаунт к уже авторизованному пользователю (не создаёт новую сессию). */
export async function apiGithubConnect(sessionId: string, code: string) {
  const { res, data } = await apiFetch(AUTH_URL, {
    method: 'POST',
    headers: { 'x-session-id': sessionId },
    body: JSON.stringify({ action: 'github_connect', code }),
  });
  if (!res.ok) throw new Error((data as {error?: string}).error || 'Ошибка подключения GitHub');
  return data as { ok: boolean; github_login: string };
}

export async function apiYandexOAuth(code: string) {
  const { res, data } = await apiFetch(AUTH_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'yandex_oauth', code }),
  });
  if (!res.ok) throw new Error((data as {error?: string}).error || 'Ошибка авторизации через Яндекс');
  return data;
}

export async function apiGetMe(sessionId: string) {
  const { res, data } = await apiFetch(AUTH_URL, {
    headers: { 'x-session-id': sessionId },
  });
  if (!res.ok) throw new Error((data as {error?: string}).error || 'Не авторизован');
  return data;
}

export async function apiGetOrders(sessionId: string): Promise<Order[]> {
  const { res, data } = await apiFetch(`${AUTH_URL}?action=orders`, {
    headers: { 'x-session-id': sessionId },
  });
  if (!res.ok) throw new Error((data as {error?: string}).error || 'Ошибка загрузки истории платежей');
  return (data as {orders: Order[]}).orders;
}

export async function apiChangePassword(sessionId: string, oldPassword: string, newPassword: string) {
  const { res, data } = await apiFetch(AUTH_URL, {
    method: 'POST',
    headers: { 'x-session-id': sessionId },
    body: JSON.stringify({ action: 'change_password', old_password: oldPassword, new_password: newPassword }),
  });
  if (!res.ok) throw new Error((data as {error?: string}).error || 'Ошибка смены пароля');
  return data;
}

export async function apiUpdateName(sessionId: string, name: string) {
  const { res, data } = await apiFetch(AUTH_URL, {
    method: 'POST',
    headers: { 'x-session-id': sessionId },
    body: JSON.stringify({ action: 'update_name', name }),
  });
  if (!res.ok) throw new Error((data as {error?: string}).error || 'Ошибка изменения имени');
  return data;
}

export async function apiDeleteAccount(sessionId: string, password: string) {
  const { res, data } = await apiFetch(AUTH_URL, {
    method: 'POST',
    headers: { 'x-session-id': sessionId },
    body: JSON.stringify({ action: 'delete_account', password }),
  });
  if (!res.ok) throw new Error((data as {error?: string}).error || 'Ошибка удаления аккаунта');
  return data;
}

export async function apiDisconnectGithub(sessionId: string) {
  const { res, data } = await apiFetch(AUTH_URL, {
    method: 'POST',
    headers: { 'x-session-id': sessionId },
    body: JSON.stringify({ action: 'disconnect_github' }),
  });
  if (!res.ok) throw new Error((data as {error?: string}).error || 'Ошибка отключения GitHub');
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

export async function apiGetProject(sessionId: string, projectId: string | number): Promise<Project> {
  const { res, data } = await apiFetch(`${PROJECTS_URL}?id=${projectId}`, {
    headers: { 'x-session-id': sessionId },
  });
  if (!res.ok) throw new Error((data as {error?: string}).error || 'Ошибка загрузки проекта');
  return (data as {project: Project}).project;
}

export async function apiPublishProject(sessionId: string, projectId: string | number, title: string): Promise<{ slug: string; status: string }> {
  const { res, data } = await apiFetch(PROJECTS_URL, {
    method: 'POST',
    headers: { 'x-session-id': sessionId },
    body: JSON.stringify({ action: 'publish', id: projectId, title }),
  });
  if (!res.ok) throw new Error((data as {error?: string}).error || 'Ошибка публикации сайта');
  return data as { slug: string; status: string };
}

/** Сохраняет историю диалога чата проекта в БД, чтобы она не терялась между входами
 * и была доступна с любого устройства. Ошибки не критичны — вызываем «мягко». */
export async function apiSaveChatHistory(sessionId: string, projectId: string | number, chatHistory: unknown[]): Promise<void> {
  await apiFetch(PROJECTS_URL, {
    method: 'POST',
    headers: { 'x-session-id': sessionId },
    body: JSON.stringify({ action: 'save_chat', id: projectId, chat_history: chatHistory }),
  });
}

export async function apiGetFiles(sessionId: string): Promise<SiteFile[]> {
  const { res, data } = await apiFetch(FILES_URL, {
    headers: { 'x-session-id': sessionId },
  });
  if (!res.ok) throw new Error((data as {error?: string}).error || 'Ошибка загрузки файлов');
  return (data as {files: SiteFile[]}).files;
}

export async function apiUploadFile(
  sessionId: string,
  fileName: string,
  fileContentB64: string,
  isZip: boolean,
  projectId?: number,
): Promise<SiteFile> {
  const { res, data } = await apiFetch(FILES_URL, {
    method: 'POST',
    headers: { 'x-session-id': sessionId },
    body: JSON.stringify({
      file_name: fileName,
      file_content: fileContentB64,
      is_zip: isZip,
      project_id: projectId,
    }),
  });
  if (!res.ok) throw new Error((data as {error?: string}).error || 'Ошибка загрузки файла');
  return (data as {file: SiteFile}).file;
}

/** Повторяет запрос при временной недоступности AI-сервиса (502/503), с нарастающей паузой между попытками. */
async function withAiRetry<T>(
  fn: () => Promise<{ res: { ok: boolean; status: number }; data: T }>,
  maxRetries = 2,
  delayMs = 1500,
): Promise<{ res: { ok: boolean; status: number }; data: T }> {
  let result: { res: { ok: boolean; status: number }; data: T };
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    result = await fn();
    const isRetryable = result.res.status === 502 || result.res.status === 503;
    if (result.res.ok || !isRetryable || attempt === maxRetries) return result;
    await new Promise(r => setTimeout(r, delayMs * (attempt + 1)));
  }
  return result!;
}

export async function apiGenerateImage(
  sessionId: string,
  prompt: string,
  projectId?: number,
  size?: '1024x1024' | '1792x1024' | '1024x1792',
): Promise<{ url: string; file_name: string; revised_prompt: string; remaining?: number }> {
  const { res, data } = await withAiRetry(() => apiFetch(GENERATE_IMAGE_URL, {
    method: 'POST',
    headers: { 'x-session-id': sessionId },
    body: JSON.stringify({ prompt, project_id: projectId, size }),
  }));
  if (!res.ok) {
    if (res.status === 502 || res.status === 503) throw new Error('AI_SERVICE_UNAVAILABLE');
    throw new Error((data as {error?: string}).error || 'Ошибка генерации изображения');
  }
  return data as { url: string; file_name: string; revised_prompt: string; remaining?: number };
}

export async function apiDeleteFile(sessionId: string, fileId: number) {
  const { res, data } = await apiFetch(`${FILES_URL}?id=${fileId}`, {
    method: 'DELETE',
    headers: { 'x-session-id': sessionId },
  });
  if (!res.ok) throw new Error((data as {error?: string}).error || 'Ошибка удаления файла');
  return data;
}

export async function apiGetDomains(sessionId: string): Promise<{ domains: Domain[]; projects: { id: number; title: string }[] }> {
  const { res, data } = await apiFetch(DOMAINS_URL, {
    headers: { 'x-session-id': sessionId },
  });
  if (!res.ok) throw new Error((data as {error?: string}).error || 'Ошибка загрузки доменов');
  return data as { domains: Domain[]; projects: { id: number; title: string }[] };
}

export async function apiAddDomain(sessionId: string, domain: string, projectId?: number): Promise<Domain> {
  const { res, data } = await apiFetch(DOMAINS_URL, {
    method: 'POST',
    headers: { 'x-session-id': sessionId },
    body: JSON.stringify({ action: 'add', domain, project_id: projectId }),
  });
  if (!res.ok) throw new Error((data as {error?: string}).error || 'Ошибка добавления домена');
  return (data as { domain: Domain }).domain;
}

export async function apiVerifyDomain(sessionId: string, id: number): Promise<{ dns: DnsCheckResult; status: string }> {
  const { res, data } = await apiFetch(DOMAINS_URL, {
    method: 'POST',
    headers: { 'x-session-id': sessionId },
    body: JSON.stringify({ action: 'verify', id }),
  });
  if (!res.ok) throw new Error((data as {error?: string}).error || 'Ошибка проверки домена');
  return data as { dns: DnsCheckResult; status: string };
}

export async function apiSetPrimaryDomain(sessionId: string, id: number) {
  const { res, data } = await apiFetch(DOMAINS_URL, {
    method: 'POST',
    headers: { 'x-session-id': sessionId },
    body: JSON.stringify({ action: 'set_primary', id }),
  });
  if (!res.ok) throw new Error((data as {error?: string}).error || 'Ошибка назначения основного домена');
  return data;
}

export async function apiSetDomainRedirect(sessionId: string, id: number, redirectMode: string) {
  const { res, data } = await apiFetch(DOMAINS_URL, {
    method: 'POST',
    headers: { 'x-session-id': sessionId },
    body: JSON.stringify({ action: 'set_redirect', id, redirect_mode: redirectMode }),
  });
  if (!res.ok) throw new Error((data as {error?: string}).error || 'Ошибка настройки редиректа');
  return data;
}

export async function apiAssignDomainProject(sessionId: string, id: number, projectId: number | null) {
  const { res, data } = await apiFetch(DOMAINS_URL, {
    method: 'POST',
    headers: { 'x-session-id': sessionId },
    body: JSON.stringify({ action: 'assign_project', id, project_id: projectId }),
  });
  if (!res.ok) throw new Error((data as {error?: string}).error || 'Ошибка привязки проекта');
  return data;
}

export async function apiDeleteDomain(sessionId: string, id: number) {
  const { res, data } = await apiFetch(`${DOMAINS_URL}?id=${id}`, {
    method: 'DELETE',
    headers: { 'x-session-id': sessionId },
  });
  if (!res.ok) throw new Error((data as {error?: string}).error || 'Ошибка удаления домена');
  return data;
}

// ───────────────────────── PROJECT CORE (secrets, tables, rows) ─────────────────────────

export interface ProjectSecret {
  id: number;
  key_name: string;
  created_at: string;
}

export interface ProjectTableColumn {
  name: string;
  type: 'text' | 'number' | 'boolean';
}

export interface ProjectTable {
  id: number;
  table_name: string;
  columns: ProjectTableColumn[];
  created_at: string;
  rows_count: number;
}

export interface ProjectRow {
  id: number;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export async function apiGetProjectSecrets(sessionId: string, projectId: number): Promise<ProjectSecret[]> {
  const { res, data } = await apiFetch(`${PROJECT_CORE_URL}?resource=secrets&project_id=${projectId}`, {
    headers: { 'x-session-id': sessionId },
  });
  if (!res.ok) throw new Error((data as {error?: string}).error || 'Ошибка загрузки секретов');
  return (data as {secrets: ProjectSecret[]}).secrets;
}

export async function apiAddProjectSecret(sessionId: string, projectId: number, keyName: string, keyValue: string): Promise<ProjectSecret> {
  const { res, data } = await apiFetch(PROJECT_CORE_URL, {
    method: 'POST',
    headers: { 'x-session-id': sessionId },
    body: JSON.stringify({ resource: 'secrets', project_id: projectId, key_name: keyName, key_value: keyValue }),
  });
  if (!res.ok) throw new Error((data as {error?: string}).error || 'Ошибка добавления секрета');
  return (data as {secret: ProjectSecret}).secret;
}

export async function apiDeleteProjectSecret(sessionId: string, projectId: number, secretId: number) {
  const { res, data } = await apiFetch(`${PROJECT_CORE_URL}?resource=secrets&project_id=${projectId}&id=${secretId}`, {
    method: 'DELETE',
    headers: { 'x-session-id': sessionId },
  });
  if (!res.ok) throw new Error((data as {error?: string}).error || 'Ошибка удаления секрета');
  return data;
}

export async function apiGetProjectTables(sessionId: string, projectId: number): Promise<ProjectTable[]> {
  const { res, data } = await apiFetch(`${PROJECT_CORE_URL}?resource=tables&project_id=${projectId}`, {
    headers: { 'x-session-id': sessionId },
  });
  if (!res.ok) throw new Error((data as {error?: string}).error || 'Ошибка загрузки таблиц');
  return (data as {tables: ProjectTable[]}).tables;
}

export async function apiCreateProjectTable(sessionId: string, projectId: number, tableName: string, columns: ProjectTableColumn[]): Promise<ProjectTable> {
  const { res, data } = await apiFetch(PROJECT_CORE_URL, {
    method: 'POST',
    headers: { 'x-session-id': sessionId },
    body: JSON.stringify({ resource: 'tables', project_id: projectId, table_name: tableName, columns }),
  });
  if (!res.ok) throw new Error((data as {error?: string}).error || 'Ошибка создания таблицы');
  return (data as {table: ProjectTable}).table;
}

export async function apiDeleteProjectTable(sessionId: string, projectId: number, tableId: number) {
  const { res, data } = await apiFetch(`${PROJECT_CORE_URL}?resource=tables&project_id=${projectId}&id=${tableId}`, {
    method: 'DELETE',
    headers: { 'x-session-id': sessionId },
  });
  if (!res.ok) throw new Error((data as {error?: string}).error || 'Ошибка удаления таблицы');
  return data;
}

export async function apiGetProjectRows(sessionId: string, projectId: number, tableId: number): Promise<ProjectRow[]> {
  const { res, data } = await apiFetch(`${PROJECT_CORE_URL}?resource=rows&project_id=${projectId}&table_id=${tableId}`, {
    headers: { 'x-session-id': sessionId },
  });
  if (!res.ok) throw new Error((data as {error?: string}).error || 'Ошибка загрузки записей');
  return (data as {rows: ProjectRow[]}).rows;
}

export async function apiAddProjectRow(sessionId: string, projectId: number, tableId: number, rowData: Record<string, unknown>): Promise<ProjectRow> {
  const { res, data } = await apiFetch(`${PROJECT_CORE_URL}?resource=rows&project_id=${projectId}`, {
    method: 'POST',
    headers: { 'x-session-id': sessionId },
    body: JSON.stringify({ table_id: tableId, data: rowData }),
  });
  if (!res.ok) throw new Error((data as {error?: string}).error || 'Ошибка добавления записи');
  return (data as {row: ProjectRow}).row;
}

export async function apiUpdateProjectRow(sessionId: string, projectId: number, tableId: number, rowId: number, rowData: Record<string, unknown>): Promise<ProjectRow> {
  const { res, data } = await apiFetch(`${PROJECT_CORE_URL}?resource=rows&project_id=${projectId}`, {
    method: 'PUT',
    headers: { 'x-session-id': sessionId },
    body: JSON.stringify({ table_id: tableId, id: rowId, data: rowData }),
  });
  if (!res.ok) throw new Error((data as {error?: string}).error || 'Ошибка обновления записи');
  return (data as {row: ProjectRow}).row;
}

export async function apiDeleteProjectRow(sessionId: string, projectId: number, tableId: number, rowId: number) {
  const { res, data } = await apiFetch(`${PROJECT_CORE_URL}?resource=rows&project_id=${projectId}&table_id=${tableId}&id=${rowId}`, {
    method: 'DELETE',
    headers: { 'x-session-id': sessionId },
  });
  if (!res.ok) throw new Error((data as {error?: string}).error || 'Ошибка удаления записи');
  return data;
}