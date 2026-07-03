import Icon from '@/components/ui/icon';

const REGISTRAR_LINKS: Record<string, string> = {
  'Reg.ru': 'https://www.reg.ru/support/hosting-and-domains/dns-i-nastroika-domenov/kak-izmenit-dns-zapisi-dlya-domena',
  'RuCenter (Nic.ru)': 'https://www.nic.ru/help/dns-nastrojka_7402.html',
  Timeweb: 'https://timeweb.com/ru/docs/domain/kak-nastroit-dns-zapisi-domena',
  Yandex: 'https://yandex.ru/support/domain/setting-up-servers.html',
  GoDaddy: 'https://www.godaddy.com/help/add-an-a-record-19238',
  Namecheap: 'https://www.namecheap.com/support/knowledgebase/article.aspx/434/2237/how-do-i-set-up-host-records-for-a-domain',
  Cloudflare: 'https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/',
  Beget: 'https://beget.com/ru/kb/how-to/domains/upravlenie-dns-zapisyami',
};

const REGISTRARS_FALLBACK = [
  { name: 'Reg.ru', url: REGISTRAR_LINKS['Reg.ru'] },
  { name: 'RuCenter (Nic.ru)', url: REGISTRAR_LINKS['RuCenter (Nic.ru)'] },
  { name: 'Timeweb', url: REGISTRAR_LINKS.Timeweb },
  { name: 'GoDaddy', url: REGISTRAR_LINKS.GoDaddy },
  { name: 'Namecheap', url: REGISTRAR_LINKS.Namecheap },
  { name: 'Cloudflare', url: REGISTRAR_LINKS.Cloudflare },
];

export { REGISTRAR_LINKS };

interface DomainInfoCardsProps {
  isRu: boolean;
}

export function DomainInfoCards({ isRu }: DomainInfoCardsProps) {
  return (
    <div className="grid sm:grid-cols-3 gap-3 mb-8">
      {[
        { icon: 'Shield', title: isRu ? 'SSL бесплатно' : 'Free SSL', desc: isRu ? 'HTTPS сертификат активируется автоматически' : 'HTTPS certificate activates automatically' },
        { icon: 'Zap', title: isRu ? 'CDN и кэш' : 'CDN & Cache', desc: isRu ? 'Быстрая загрузка по всему миру' : 'Fast loading worldwide' },
        { icon: 'RefreshCw', title: isRu ? 'Обновление' : 'Updates', desc: isRu ? 'Сайт обновляется мгновенно' : 'Site updates instantly' },
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
  return (
    <div className="bg-card border border-border rounded-2xl p-5 mt-8">
      <p className="text-sm font-semibold mb-3">
        {isRu ? 'Инструкции для популярных регистраторов' : 'Instructions for popular registrars'}
      </p>
      <div className="flex flex-wrap gap-2">
        {REGISTRARS_FALLBACK.map(r => (
          <a key={r.name} href={r.url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-border bg-secondary hover:bg-background hover:border-primary/40 transition-all text-muted-foreground hover:text-foreground">
            <Icon name="ExternalLink" size={11} />
            {r.name}
          </a>
        ))}
      </div>
    </div>
  );
}
