export const GET_LEADS_URL    = 'https://functions.poehali.dev/30e5ede9-3024-46d5-ad27-eae4b46b0056';
export const MANAGE_USER_URL  = 'https://functions.poehali.dev/f00990ba-30f7-4fe5-9cb2-974518f45564';
export const ANALYTICS_URL    = 'https://functions.poehali.dev/ee6777e6-59d0-4d5f-acb2-d292c72253d3';
export const SITE_LEADS_URL   = 'https://functions.poehali.dev/96a428e9-25c5-47d2-83b1-bdc68f9f8010';
export const ACTIVITY_LOG_URL = 'https://functions.poehali.dev/fa0bbc9f-ff34-4d08-877f-41fdf35d0dee';

export function unwrap(raw: Record<string, unknown>): Record<string, unknown> {
  if (raw.body !== undefined) {
    return typeof raw.body === 'string' ? JSON.parse(raw.body) : raw.body as Record<string, unknown>;
  }
  return raw;
}

export interface Lead { id: number; email: string; created_at: string; }

export interface User {
  id: number; email: string; name: string; plan: string;
  created_at: string; projects_count: number; blocked: boolean;
}

export interface SiteLead {
  id: number; name: string; phone: string; email: string;
  message: string; site: string; date: string; status: 'new' | 'processed' | 'rejected';
}

export interface AnalyticsData {
  total_views: number; total_visitors: number; views_change: number;
  chart: { day: string; views: number; visitors: number }[];
  devices: { name: string; value: number }[];
  top_pages: { path: string; views: number }[];
  top_sites: { url: string; views: number; visitors: number; leads: number }[];
  sources: { name: string; value: number }[];
}

export interface LogEntry {
  id: number; user_id: number | null; user_name: string; user_email: string;
  action: string; entity: string; entity_id: number | null;
  meta: Record<string, unknown>; ip: string; created_at: string;
}

export interface Notification {
  id: number; type: string; title: string; body: string;
  link: string; is_read: boolean; created_at: string;
}

export const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  free:    { label: 'Пробный',  color: 'bg-secondary text-muted-foreground' },
  premium: { label: 'Премиум',  color: 'bg-primary/15 text-primary' },
  pro:     { label: 'Профи',    color: 'bg-foreground/10 text-foreground' },
};

export const SITE_LEAD_STATUS = {
  new:       { label: 'Новая',       color: 'bg-primary/10 text-primary',           dot: 'bg-primary' },
  processed: { label: 'Обработана',  color: 'bg-emerald-100 text-emerald-700',       dot: 'bg-emerald-500' },
  rejected:  { label: 'Отклонена',   color: 'bg-secondary text-muted-foreground',    dot: 'bg-muted-foreground' },
};

export const SOURCE_COLORS = ['bg-primary', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500'];

export const ACTION_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  register:       { label: 'Регистрация',     color: 'text-emerald-600 bg-emerald-100', icon: 'UserPlus' },
  login:          { label: 'Вход',            color: 'text-blue-600 bg-blue-100',       icon: 'LogIn' },
  generate_site:  { label: 'Генерация сайта', color: 'text-primary bg-primary/10',     icon: 'Sparkles' },
  create_project: { label: 'Новый проект',    color: 'text-violet-600 bg-violet-100',  icon: 'Layers' },
  change_plan:    { label: 'Смена тарифа',    color: 'text-amber-600 bg-amber-100',    icon: 'CreditCard' },
  block_user:     { label: 'Блокировка',      color: 'text-rose-600 bg-rose-100',      icon: 'Ban' },
  unblock_user:   { label: 'Разблокировка',   color: 'text-emerald-600 bg-emerald-100',icon: 'Unlock' },
  delete_user:    { label: 'Удаление',        color: 'text-red-600 bg-red-100',        icon: 'Trash2' },
  submit_lead:    { label: 'Заявка с сайта',  color: 'text-teal-600 bg-teal-100',      icon: 'Inbox' },
};

export const NOTIF_ICONS: Record<string, string> = {
  change_plan: 'CreditCard', block_user: 'Ban', unblock_user: 'Unlock',
  delete_user: 'Trash2', register: 'UserPlus', submit_lead: 'Inbox',
};
