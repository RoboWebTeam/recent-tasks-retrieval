import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { getLang, tr } from '@/lib/i18n';

type Step = 'input' | 'dns' | 'verify' | 'done';
type DomainStatus = 'idle' | 'checking' | 'success' | 'error';

export default function DomainSettings() {
  const lang = getLang();
  const isRu = lang === 'ru';

  const [step, setStep] = useState<Step>('input');
  const [domain, setDomain] = useState('');
  const [domainError, setDomainError] = useState('');
  const [status, setStatus] = useState<DomainStatus>('idle');
  const [copiedRow, setCopiedRow] = useState<string | null>(null);

  const SERVER_IP = '185.230.209.10';
  const CNAME_VALUE = 'cname.roboweb.site';

  const validateDomain = (val: string) => {
    const re = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    return re.test(val.trim().replace(/^https?:\/\//, '').replace(/\/$/, ''));
  };

  const cleanDomain = (val: string) =>
    val.trim().replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();

  const handleSubmit = () => {
    const clean = cleanDomain(domain);
    if (!validateDomain(clean)) {
      setDomainError(tr('errorDomain', lang));
      return;
    }
    setDomainError('');
    setDomain(clean);
    setStep('dns');
  };

  const handleVerify = () => {
    setStatus('checking');
    setTimeout(() => {
      setStatus('success');
      setStep('done');
    }, 2500);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRow(key);
    setTimeout(() => setCopiedRow(null), 2000);
  };

  const dnsRows = [
    {
      key: 'a',
      type: 'A',
      host: '@',
      value: SERVER_IP,
      ttl: '3600',
      desc: isRu ? 'Для корневого домена (example.ru)' : 'For root domain (example.com)',
    },
    {
      key: 'cname',
      type: 'CNAME',
      host: 'www',
      value: CNAME_VALUE,
      ttl: '3600',
      desc: isRu ? 'Для www (www.example.ru)' : 'For www (www.example.com)',
    },
  ];

  const registrars = [
    { name: 'Reg.ru', url: 'https://www.reg.ru/support/hosting-and-domains/dns-i-nastroika-domenov/kak-izmenit-dns-zapisi-dlya-domena' },
    { name: 'RuCenter', url: 'https://www.nic.ru/help/dns-nastrojka_7402.html' },
    { name: 'Timeweb', url: 'https://timeweb.com/ru/docs/domain/kak-nastroit-dns-zapisi-domena' },
    { name: 'GoDaddy', url: 'https://www.godaddy.com/help/add-an-a-record-19238' },
    { name: 'Namecheap', url: 'https://www.namecheap.com/support/knowledgebase/article.aspx/434/2237/how-do-i-set-up-host-records-for-a-domain' },
    { name: 'Cloudflare', url: 'https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card shadow-sm">
        <div className="container flex h-14 items-center gap-3">
          <Link to="/dashboard" className="grid h-7 w-7 place-items-center rounded-xl hover:bg-secondary transition-colors text-muted-foreground">
            <Icon name="ArrowLeft" size={16} />
          </Link>
          <Link to="/" className="flex items-center gap-2 font-display font-extrabold text-base">
            <span className="grid h-7 w-7 place-items-center rounded-xl bg-primary text-primary-foreground shrink-0">
              <Icon name="Bot" size={14} />
            </span>
            <span className="hidden sm:block">Roboweb</span>
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium text-foreground">
            {isRu ? 'Подключение домена' : 'Domain Settings'}
          </span>
        </div>
      </header>

      <main className="container max-w-2xl py-10 md:py-16">

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-10">
          {[
            { id: 'input', label: isRu ? 'Домен' : 'Domain' },
            { id: 'dns', label: 'DNS' },
            { id: 'verify', label: isRu ? 'Проверка' : 'Verify' },
            { id: 'done', label: isRu ? 'Готово' : 'Done' },
          ].map((s, i, arr) => {
            const steps: Step[] = ['input', 'dns', 'verify', 'done'];
            const currentIdx = steps.indexOf(step);
            const sIdx = steps.indexOf(s.id as Step);
            const isActive = s.id === step;
            const isDone = sIdx < currentIdx;
            return (
              <div key={s.id} className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-2 shrink-0">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isDone ? 'bg-emerald-500 text-white' :
                    isActive ? 'bg-primary text-primary-foreground' :
                    'bg-secondary text-muted-foreground border border-border'
                  }`}>
                    {isDone ? <Icon name="Check" size={13} /> : i + 1}
                  </div>
                  <span className={`text-sm font-medium hidden sm:block ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {s.label}
                  </span>
                </div>
                {i < arr.length - 1 && (
                  <div className={`flex-1 h-px mx-1 ${isDone ? 'bg-emerald-400' : 'bg-border'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* STEP 1 — Input domain */}
        {step === 'input' && (
          <div className="space-y-6">
            <div>
              <h1 className="font-display font-black text-3xl mb-2">
                {isRu ? 'Укажите ваш домен' : 'Enter your domain'}
              </h1>
              <p className="text-muted-foreground">
                {isRu
                  ? 'Введите доменное имя, которое хотите привязать к сайту. Домен должен быть уже зарегистрирован.'
                  : 'Enter the domain name you want to connect to your site. The domain must already be registered.'}
              </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <label className="text-sm font-semibold block">
                {isRu ? 'Доменное имя' : 'Domain name'}
              </label>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Icon name="Globe" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={domain}
                    onChange={e => { setDomain(e.target.value); setDomainError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    placeholder="mysite.ru"
                    className="h-11 rounded-xl pl-9"
                  />
                </div>
                <Button onClick={handleSubmit} className="h-11 rounded-xl px-6 font-semibold">
                  {isRu ? 'Продолжить' : 'Continue'}
                  <Icon name="ArrowRight" size={15} className="ml-1.5" />
                </Button>
              </div>
              {domainError && (
                <p className="text-sm text-destructive flex items-center gap-1.5">
                  <Icon name="AlertCircle" size={14} /> {domainError}
                </p>
              )}
            </div>

            {/* Info */}
            <div className="grid sm:grid-cols-3 gap-3">
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
          </div>
        )}

        {/* STEP 2 — DNS records */}
        {step === 'dns' && (
          <div className="space-y-6">
            <div>
              <h1 className="font-display font-black text-3xl mb-2">
                {isRu ? 'Настройте DNS-записи' : 'Configure DNS records'}
              </h1>
              <p className="text-muted-foreground">
                {isRu
                  ? `Добавьте следующие записи в DNS-настройках вашего регистратора для домена `
                  : `Add the following records to your registrar's DNS settings for `}
                <span className="font-semibold text-foreground">{domain}</span>
              </p>
            </div>

            {/* DNS table */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-secondary/50">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {isRu ? 'DNS-записи для добавления' : 'DNS records to add'}
                </p>
              </div>
              <div className="divide-y divide-border">
                {dnsRows.map(row => (
                  <div key={row.key} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">{row.desc}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: isRu ? 'Тип' : 'Type', value: row.type },
                        { label: isRu ? 'Хост / Имя' : 'Host / Name', value: row.host },
                        { label: isRu ? 'Значение' : 'Value', value: row.value },
                        { label: 'TTL', value: row.ttl },
                      ].map(cell => (
                        <div key={cell.label} className="bg-secondary/50 rounded-xl p-2.5">
                          <p className="text-[10px] text-muted-foreground mb-1 font-medium uppercase tracking-wide">{cell.label}</p>
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs font-mono font-semibold text-foreground truncate">{cell.value}</p>
                            {(cell.label === (isRu ? 'Значение' : 'Value') || cell.label === (isRu ? 'Тип' : 'Type')) && (
                              <button
                                onClick={() => copyToClipboard(cell.value, `${row.key}-${cell.label}`)}
                                className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                              >
                                <Icon name={copiedRow === `${row.key}-${cell.label}` ? 'Check' : 'Copy'} size={11} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Warning */}
            <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <Icon name="Clock" size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  {isRu ? 'DNS обновляется до 48 часов' : 'DNS propagation takes up to 48 hours'}
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  {isRu
                    ? 'После добавления записей подождите от нескольких минут до 48 часов. Обычно изменения применяются за 15–30 минут.'
                    : 'After adding records, wait from a few minutes to 48 hours. Changes usually apply within 15–30 minutes.'}
                </p>
              </div>
            </div>

            {/* Registrar links */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <p className="text-sm font-semibold mb-3">
                {isRu ? 'Инструкции для популярных регистраторов' : 'Instructions for popular registrars'}
              </p>
              <div className="flex flex-wrap gap-2">
                {registrars.map(r => (
                  <a key={r.name} href={r.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-border bg-secondary hover:bg-background hover:border-primary/40 transition-all text-muted-foreground hover:text-foreground">
                    <Icon name="ExternalLink" size={11} />
                    {r.name}
                  </a>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('input')} className="h-11 rounded-xl">
                <Icon name="ArrowLeft" size={15} className="mr-1.5" />
                {isRu ? 'Назад' : 'Back'}
              </Button>
              <Button onClick={() => setStep('verify')} className="h-11 rounded-xl flex-1 font-semibold">
                {isRu ? 'Я добавил записи — проверить' : 'I added records — verify'}
                <Icon name="ArrowRight" size={15} className="ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3 — Verify */}
        {step === 'verify' && (
          <div className="space-y-6">
            <div>
              <h1 className="font-display font-black text-3xl mb-2">
                {isRu ? 'Проверка подключения' : 'Verifying connection'}
              </h1>
              <p className="text-muted-foreground">
                {isRu
                  ? `Проверяем DNS-записи для домена `
                  : `Checking DNS records for `}
                <span className="font-semibold text-foreground">{domain}</span>
              </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-5">
              {status === 'idle' && (
                <>
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary mx-auto">
                    <Icon name="Search" size={28} />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">
                      {isRu ? 'Готовы к проверке?' : 'Ready to verify?'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isRu
                        ? 'Убедитесь, что DNS-записи добавлены, и нажмите кнопку ниже.'
                        : 'Make sure the DNS records are added and click the button below.'}
                    </p>
                  </div>
                </>
              )}
              {status === 'checking' && (
                <>
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary mx-auto">
                    <Icon name="Loader" size={28} className="animate-spin" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">
                      {isRu ? 'Проверяем DNS...' : 'Checking DNS...'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isRu ? 'Это займёт несколько секунд' : 'This will take a few seconds'}
                    </p>
                  </div>
                </>
              )}
              {status === 'error' && (
                <>
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-destructive/10 text-destructive mx-auto">
                    <Icon name="AlertCircle" size={28} />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">
                      {isRu ? 'Записи не найдены' : 'Records not found'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isRu
                        ? 'DNS-записи ещё не применились. Подождите немного и попробуйте снова.'
                        : 'DNS records haven\'t propagated yet. Wait a bit and try again.'}
                    </p>
                  </div>
                </>
              )}

              <div className="space-y-2">
                {[
                  { label: isRu ? 'A-запись' : 'A record', value: SERVER_IP, icon: 'Globe' },
                  { label: 'CNAME (www)', value: CNAME_VALUE, icon: 'Link' },
                  { label: 'SSL', value: isRu ? 'Автоматически' : 'Automatic', icon: 'Lock' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between px-4 py-2.5 bg-secondary/50 rounded-xl">
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Icon name={item.icon} size={14} className="text-muted-foreground" />
                      {item.label}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{item.value}</span>
                      {status === 'checking' && <Icon name="Loader" size={12} className="animate-spin text-primary" />}
                      {status === 'success' && <Icon name="CheckCircle" size={13} className="text-emerald-500" />}
                      {status === 'error' && <Icon name="XCircle" size={13} className="text-destructive" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('dns')} className="h-11 rounded-xl">
                <Icon name="ArrowLeft" size={15} className="mr-1.5" />
                {isRu ? 'Назад' : 'Back'}
              </Button>
              <Button onClick={handleVerify} disabled={status === 'checking'} className="h-11 rounded-xl flex-1 font-semibold">
                {status === 'checking'
                  ? <><Icon name="Loader" size={15} className="mr-1.5 animate-spin" />{isRu ? 'Проверяем...' : 'Checking...'}</>
                  : <><Icon name="Search" size={15} className="mr-1.5" />{isRu ? 'Проверить подключение' : 'Check connection'}</>}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4 — Done */}
        {step === 'done' && (
          <div className="space-y-6 text-center">
            <div className="py-8">
              <div className="grid h-20 w-20 place-items-center rounded-3xl bg-emerald-100 text-emerald-600 mx-auto mb-6">
                <Icon name="CheckCircle" size={36} />
              </div>
              <h1 className="font-display font-black text-3xl mb-3">
                {isRu ? 'Домен подключён!' : 'Domain connected!'}
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                {isRu
                  ? `Домен `
                  : `Domain `}
                <span className="font-semibold text-foreground">{domain}</span>
                {isRu
                  ? ` успешно привязан к вашему сайту. SSL-сертификат активируется в течение нескольких минут.`
                  : ` has been successfully connected to your site. SSL certificate will activate within a few minutes.`}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 text-left">
              {[
                { icon: 'Globe', label: isRu ? 'Ваш домен' : 'Your domain', value: domain },
                { icon: 'Lock', label: 'SSL', value: 'Let\'s Encrypt · Активен' },
                { icon: 'Zap', label: 'CDN', value: isRu ? 'Включён' : 'Enabled' },
                { icon: 'RefreshCw', label: isRu ? 'Автообновление' : 'Auto-renewal', value: isRu ? 'Каждые 90 дней' : 'Every 90 days' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3 bg-card border border-border rounded-2xl p-4">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-100 text-emerald-600 shrink-0">
                    <Icon name={item.icon} size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-semibold text-foreground truncate">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button variant="outline" asChild className="h-11 rounded-xl flex-1">
                <a href={`https://${domain}`} target="_blank" rel="noopener noreferrer">
                  <Icon name="ExternalLink" size={15} className="mr-1.5" />
                  {isRu ? 'Открыть сайт' : 'Open site'}
                </a>
              </Button>
              <Button asChild className="h-11 rounded-xl flex-1 font-semibold">
                <Link to="/dashboard">
                  <Icon name="LayoutDashboard" size={15} className="mr-1.5" />
                  {isRu ? 'В личный кабинет' : 'Go to dashboard'}
                </Link>
              </Button>
            </div>

            <button onClick={() => { setStep('input'); setDomain(''); setStatus('idle'); }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
              {isRu ? 'Подключить другой домен' : 'Connect another domain'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}