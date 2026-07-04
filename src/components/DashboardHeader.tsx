import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { getStoredUser, clearSession, getRemainingRequests, LOW_BALANCE_THRESHOLD, type User } from '@/lib/auth';
import { getLang, tr, type Lang } from '@/lib/i18n';
import LangSwitcher from '@/components/LangSwitcher';

function Avatar({ user }: { user: User }) {
  const initials = user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm shrink-0">
      {initials}
    </div>
  );
}

type NavId = 'projects' | 'plan' | 'profile' | 'analytics' | 'leads' | 'files' | 'domain';

interface DashboardHeaderProps {
  active: NavId;
  leadsCount?: number;
}

export default function DashboardHeader({ active, leadsCount = 0 }: DashboardHeaderProps) {
  const lang: Lang = getLang();
  const user = getStoredUser();
  const handleLogout = () => { clearSession(); window.location.href = '/'; };
  const remaining = getRemainingRequests(user);
  const lowBalance = remaining !== null && remaining <= LOW_BALANCE_THRESHOLD;

  const mainNav = [
    ['projects', tr('myProjects', lang), 'Layers', '/dashboard'] as const,
    ['plan', tr('plan', lang), 'CreditCard', '/dashboard?tab=plan'] as const,
    ['profile', tr('profile', lang), 'User', '/dashboard?tab=profile'] as const,
  ];
  const extraNav = [
    ['analytics', lang === 'ru' ? 'Аналитика' : 'Analytics', 'BarChart2', '/analytics', 0] as const,
    ['leads', lang === 'ru' ? 'Заявки' : 'Leads', 'Inbox', '/leads', leadsCount] as const,
    ['files', lang === 'ru' ? 'Мои файлы' : 'My files', 'FolderOpen', '/files', 0] as const,
    ['domain', lang === 'ru' ? 'Домен' : 'Domain', 'Link', '/settings/domain', 0] as const,
  ];

  return (
    <header className="border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-30 shadow-sm">
      <div className="container flex items-center justify-between py-3.5">
        <Link to="/" className="flex items-center gap-2 font-display font-extrabold text-lg">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-foreground shrink-0">
            <Icon name="Bot" size={17} />
          </span>
          Roboweb
        </Link>

        <nav className="hidden sm:flex items-center gap-1">
          {mainNav.map(([id, label, icon, href]) => (
            <Link
              key={id}
              to={href}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors relative ${
                active === id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <Icon name={icon} size={15} />{label}
              {id === 'plan' && lowBalance && (
                <span className={`absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ${remaining! <= 0 ? 'bg-destructive' : 'bg-amber-500'} ${active === id ? 'ring-2 ring-primary' : ''}`} />
              )}
            </Link>
          ))}
          {extraNav.map(([id, label, icon, href, count]) => (
            <Link
              key={id}
              to={href}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors relative ${
                active === id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <Icon name={icon} size={15} />{label}
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
                  {count}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LangSwitcher lang={lang} />
          {user && <Avatar user={user} />}
          <Button variant="ghost" size="sm" onClick={handleLogout} className="rounded-xl text-muted-foreground hover:text-foreground hidden sm:flex">
            <Icon name="LogOut" size={16} />
          </Button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="sm:hidden flex border-t border-border overflow-x-auto">
        {mainNav.map(([id, label, icon, href]) => (
          <Link
            key={id}
            to={href}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors shrink-0 relative ${
              active === id ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Icon name={icon} size={18} />
            {id === 'plan' && lowBalance && (
              <span className={`absolute top-1.5 left-1/2 translate-x-2 -translate-y-0.5 h-2.5 w-2.5 rounded-full ${remaining! <= 0 ? 'bg-destructive' : 'bg-amber-500'}`} />
            )}
            {label}
          </Link>
        ))}
        {extraNav.map(([id, label, icon, href, count]) => (
          <Link
            key={id}
            to={href}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors shrink-0 relative ${
              active === id ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Icon name={icon} size={18} />
            {count > 0 && (
              <span className="absolute top-1.5 left-1/2 translate-x-1 -translate-y-0.5 h-3.5 w-3.5 bg-primary text-primary-foreground text-[8px] font-bold rounded-full flex items-center justify-center">
                {count}
              </span>
            )}
            {label}
          </Link>
        ))}
      </div>
    </header>
  );
}