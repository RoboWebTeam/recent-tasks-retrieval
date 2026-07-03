import { useState } from 'react';
import Icon from '@/components/ui/icon';

const SERVER_IP = '185.230.209.10';
const CNAME_VALUE = 'cname.roboweb.site';

// Официальные разделы поддержки (главные страницы — реже меняют адрес, чем ссылки на конкретные статьи)
const REGISTRAR_LINKS: Record<string, string> = {
  'Reg.ru': 'https://www.reg.ru/support/',
  'RuCenter (Nic.ru)': 'https://www.nic.ru/help/',
  Timeweb: 'https://timeweb.com/ru/docs/',
  Yandex: 'https://yandex.ru/support/domain/',
  GoDaddy: 'https://www.godaddy.com/help',
  Namecheap: 'https://www.namecheap.com/support/',
  Cloudflare: 'https://developers.cloudflare.com/dns/',
  Beget: 'https://beget.com/ru/kb/',
};

export { REGISTRAR_LINKS };

interface RegistrarGuide {
  name: string;
  icon: string;
  steps: string[];
  stepsEn: string[];
}

const REGISTRAR_GUIDES: RegistrarGuide[] = [
  {
    name: 'Reg.ru',
    icon: 'Globe',
    steps: [
      'Войдите в личный кабинет на reg.ru',
      'Откройте раздел «Домены» → выберите ваш домен',
      'Перейдите в «Управление DNS-записями»',
      'Добавьте A-запись и CNAME-запись из таблицы выше',
      'Сохраните изменения — DNS обновится в течение часа',
    ],
    stepsEn: [
      'Sign in to your reg.ru account',
      'Open "Domains" → select your domain',
      'Go to "DNS records management"',
      'Add the A record and CNAME record from the table above',
      'Save changes — DNS updates within an hour',
    ],
  },
  {
    name: 'RuCenter (Nic.ru)',
    icon: 'Globe',
    steps: [
      'Войдите в личный кабинет на nic.ru',
      'Выберите домен в списке услуг',
      'Откройте «Услуги DNS-хостинга» → «Настроить»',
      'Добавьте A-запись и CNAME-запись из таблицы выше',
      'Сохраните — изменения применятся до 24 часов',
    ],
    stepsEn: [
      'Sign in to your nic.ru account',
      'Select your domain from services list',
      'Open "DNS hosting services" → "Configure"',
      'Add the A record and CNAME record from the table above',
      'Save — changes apply within 24 hours',
    ],
  },
  {
    name: 'Timeweb',
    icon: 'Globe',
    steps: [
      'Войдите в личный кабинет Timeweb',
      'Раздел «Домены» → выберите домен → «DNS-записи»',
      'Добавьте A-запись и CNAME-запись из таблицы выше',
      'Сохраните — обновление занимает до нескольких часов',
    ],
    stepsEn: [
      'Sign in to your Timeweb account',
      '"Domains" → select domain → "DNS records"',
      'Add the A record and CNAME record from the table above',
      'Save — update takes up to a few hours',
    ],
  },
  {
    name: 'Yandex',
    icon: 'Globe',
    steps: [
      'Войдите в Яндекс 360 / Коннект, раздел «Домены»',
      'Выберите домен → «Настройки DNS»',
      'Добавьте A-запись и CNAME-запись из таблицы выше',
      'Сохраните изменения',
    ],
    stepsEn: [
      'Sign in to Yandex 360 / Connect, "Domains" section',
      'Select domain → "DNS settings"',
      'Add the A record and CNAME record from the table above',
      'Save changes',
    ],
  },
  {
    name: 'GoDaddy',
    icon: 'Globe',
    steps: [
      'Sign in to your GoDaddy account',
      'Go to "My Products" → your domain → "DNS"',
      'Add the A record and CNAME record from the table above',
      'Save — propagation can take up to 48 hours',
    ],
    stepsEn: [
      'Sign in to your GoDaddy account',
      'Go to "My Products" → your domain → "DNS"',
      'Add the A record and CNAME record from the table above',
      'Save — propagation can take up to 48 hours',
    ],
  },
  {
    name: 'Namecheap',
    icon: 'Globe',
    steps: [
      'Войдите в аккаунт Namecheap',
      '«Domain List» → «Manage» рядом с доменом',
      'Вкладка «Advanced DNS»',
      'Добавьте A-запись и CNAME-запись из таблицы выше',
      'Сохраните изменения',
    ],
    stepsEn: [
      'Sign in to your Namecheap account',
      '"Domain List" → "Manage" next to the domain',
      'Open the "Advanced DNS" tab',
      'Add the A record and CNAME record from the table above',
      'Save changes',
    ],
  },
  {
    name: 'Cloudflare',
    icon: 'Globe',
    steps: [
      'Войдите в дашборд Cloudflare',
      'Выберите домен → раздел «DNS» → «Records»',
      'Добавьте A-запись и CNAME-запись из таблицы выше',
      'Отключите проксирование (серое облако) для этих записей',
    ],
    stepsEn: [
      'Sign in to your Cloudflare dashboard',
      'Select domain → "DNS" → "Records"',
      'Add the A record and CNAME record from the table above',
      'Disable proxying (grey cloud) for these records',
    ],
  },
  {
    name: 'Beget',
    icon: 'Globe',
    steps: [
      'Войдите в панель управления Beget',
      'Раздел «Домены» → выберите домен → «DNS-записи»',
      'Добавьте A-запись и CNAME-запись из таблицы выше',
      'Сохраните изменения',
    ],
    stepsEn: [
      'Sign in to your Beget control panel',
      '"Domains" → select domain → "DNS records"',
      'Add the A record and CNAME record from the table above',
      'Save changes',
    ],
  },
];

interface DomainInfoCardsProps {
  isRu: boolean;
}

export function DomainInfoCards({ isRu }: DomainInfoCardsProps) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
      {[
        { icon: 'Shield', title: isRu ? 'SSL бесплатно' : 'Free SSL', desc: isRu ? 'HTTPS сертификат активируется автоматически' : 'HTTPS certificate activates automatically' },
        { icon: 'Zap', title: isRu ? 'CDN и кэш' : 'CDN & Cache', desc: isRu ? 'Быстрая загрузка по всему миру' : 'Fast loading worldwide' },
        { icon: 'RefreshCw', title: isRu ? 'Обновление' : 'Updates', desc: isRu ? 'Сайт обновляется мгновенно' : 'Site updates instantly' },
        { icon: 'Search', title: isRu ? 'Лучше для SEO' : 'Better for SEO', desc: isRu ? 'Свой домен индексируется в Яндекс и Google — в отличие от адреса на roboweb.site' : 'Your domain gets indexed by Yandex & Google — unlike a roboweb.site address' },
      ].map(item => (
        <div key={item.title} className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
            <Icon name={item.icon} size={16} />
          </div>
          <p className="font-semibold text-sm">{item.title}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
        </div>
      ))}
    </div>
  );
}

export function DomainRegistrarGuides({ isRu }: DomainInfoCardsProps) {
  const [active, setActive] = useState<string | null>(null);
  const activeGuide = REGISTRAR_GUIDES.find(r => r.name === active);

  return (
    <div className="bg-card border border-border rounded-2xl p-5 mt-8">
      <p className="text-sm font-semibold mb-1">
        {isRu ? 'Инструкции для популярных регистраторов' : 'Instructions for popular registrars'}
      </p>
      <p className="text-xs text-muted-foreground mb-3">
        {isRu ? 'Выберите своего регистратора — покажем пошаговую инструкцию' : 'Pick your registrar — we\'ll show a step-by-step guide'}
      </p>
      <div className="flex flex-wrap gap-2">
        {REGISTRAR_GUIDES.map(r => (
          <button
            key={r.name}
            onClick={() => setActive(active === r.name ? null : r.name)}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
              active === r.name
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border bg-secondary hover:bg-background hover:border-primary/40 text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon name={r.icon} size={11} />
            {r.name}
          </button>
        ))}
      </div>

      {activeGuide && (
        <div className="mt-4 rounded-xl bg-secondary/50 p-4">
          <ol className="space-y-2">
            {(isRu ? activeGuide.steps : activeGuide.stepsEn).map((step, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-primary/10 text-primary text-[11px] font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-foreground">{step}</span>
              </li>
            ))}
          </ol>
          {REGISTRAR_LINKS[activeGuide.name] && (
            <a
              href={REGISTRAR_LINKS[activeGuide.name]}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-primary hover:underline"
            >
              <Icon name="ExternalLink" size={12} />
              {isRu ? `Официальная поддержка ${activeGuide.name}` : `${activeGuide.name} official support`}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export { SERVER_IP, CNAME_VALUE };