import { apiUrl } from '@/lib/apiConfig';

export const GET_LEADS_URL    = apiUrl('get-leads');
export const MANAGE_USER_URL  = apiUrl('manage-user');
export const ANALYTICS_URL    = apiUrl('analytics');
export const SITE_LEADS_URL   = apiUrl('site-leads');
export const ACTIVITY_LOG_URL = apiUrl('activity-log');
export const PLAN_PRICING_URL = apiUrl('plan-pricing');
export const SUPPORT_CHAT_URL = apiUrl('support-chat');
export const AI_BALANCE_URL   = apiUrl('ai-balance');

export function unwrap(raw: Record<string, unknown>): Record<string, unknown> {
  if (raw.body !== undefined) {
    return typeof raw.body === 'string' ? JSON.parse(raw.body) : raw.body as Record<string, unknown>;
  }
  return raw;
}

export interface Lead { id: number; email: string; created_at: string; }

export interface PlanPrice { plan_code: string; requests: number; price: number; }

export interface User {
  id: number; email: string; name: string; plan: string;
  created_at: string; projects_count: number; blocked: boolean;
}

export interface SiteLead {
  id: number; name: string; phone: string; email: string;
  message: string; site: string; date: string; status: 'new' | 'processed' | 'rejected';
}

export interface AiBalance {
  total_credits: number; total_usage: number; remaining: number; low_balance: boolean;
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

export interface SupportConversation {
  id: number; visitor_id: string; user_id: number | null;
  name: string; email: string; status: 'open' | 'closed';
  unread_by_admin: boolean; created_at: string; last_message_at: string;
}

export interface SupportMessage {
  id: number; sender: 'visitor' | 'admin'; text: string; created_at: string;
  file_url?: string | null; file_type?: string | null; file_name?: string | null;
}

export interface QuickReply {
  id: number; title: string; text: string;
}

export interface AutoReplySettings {
  enabled: boolean; text: string; start_hour: number; end_hour: number;
}

export interface UserProjectSummary {
  id: number; title: string; status: string; slug: string | null;
}

export interface UserProject {
  id: number; title: string; description: string; status: string;
  slug: string | null; created_at: string | null; updated_at: string | null;
}

export interface UserOrder {
  order_number: string; order_type: string; plan: string | null; energy_amount: number | null;
  billing_period: string | null; amount: number; status: string;
  created_at: string | null; paid_at: string | null;
}

export interface UserDomain {
  id: number; domain: string; status: string; is_primary: boolean;
  ssl_status: string; project_id: number | null;
  created_at: string | null; verified_at: string | null;
}

export interface UserSiteLead {
  id: number; name: string; phone: string; email: string;
  message: string; site: string; status: 'new' | 'processed' | 'rejected';
  created_at: string | null;
}

export interface UserDetails {
  user: {
    id: number; email: string; name: string; plan: string;
    created_at: string | null; blocked: boolean; blocked_at: string | null;
    requests_used: number; requests_limit: number;
    requests_reset_at: string | null; energy_balance: number;
  };
  projects: UserProject[];
  orders: UserOrder[];
  domains: UserDomain[];
  site_leads: UserSiteLead[];
}

export const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  free:     { label: 'Пробный',        color: 'bg-secondary text-muted-foreground' },
  premium:  { label: 'Премиум',        color: 'bg-primary/15 text-primary' },
  pro_60:   { label: 'Профи 60',       color: 'bg-foreground/10 text-foreground' },
  pro_80:   { label: 'Профи 80',       color: 'bg-foreground/10 text-foreground' },
  pro_200:  { label: 'Профи 200',      color: 'bg-foreground/10 text-foreground' },
  pro_400:  { label: 'Профи 400',      color: 'bg-foreground/10 text-foreground' },
  pro_800:  { label: 'Профи 800',      color: 'bg-foreground/10 text-foreground' },
};

export const SITE_LEAD_STATUS = {
  new:       { label: 'Новая',       color: 'bg-primary/10 text-primary',           dot: 'bg-primary' },
  processed: { label: 'Обработана',  color: 'bg-emerald-100 text-emerald-700',       dot: 'bg-emerald-500' },
  rejected:  { label: 'Отклонена',   color: 'bg-secondary text-muted-foreground',    dot: 'bg-muted-foreground' },
};

export const PROJECT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft:     { label: 'Черновик',     color: 'text-muted-foreground bg-secondary' },
  building:  { label: 'Строится',     color: 'text-amber-700 bg-amber-100' },
  published: { label: 'Опубликован',  color: 'text-emerald-700 bg-emerald-100' },
};

export const ORDER_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:  { label: 'В обработке', color: 'text-amber-600 bg-amber-100' },
  paid:     { label: 'Оплачено',    color: 'text-emerald-600 bg-emerald-100' },
  canceled: { label: 'Отменено',    color: 'text-destructive bg-destructive/10' },
};

export const DOMAIN_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Ожидает DNS', color: 'text-amber-600 bg-amber-100' },
  active:  { label: 'Подключён',   color: 'text-emerald-600 bg-emerald-100' },
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