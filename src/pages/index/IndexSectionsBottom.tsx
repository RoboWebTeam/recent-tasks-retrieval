import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { ARTICLES } from '@/data/blog';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { type Lang } from '@/lib/i18n';
import { L, getPLANS, getFAQ } from './indexData';
import { Reveal, EmailForm } from './IndexShared';
import { SiteFooter } from '@/components/SiteFooter';
import { PLAN_PRICING_URL, FALLBACK_PRO_PLANS, PRO_PLAN_DETAILS, getProRequestsLabel, type ProPlanOption } from '@/data/proPlans';

interface Props { lang: Lang; }

export function IndexSectionsBottom({ lang }: Props) {
  const PLANS = getPLANS(lang);
  const FAQ   = getFAQ(lang);
  const [proPlans, setProPlans] = useState<ProPlanOption[]>(FALLBACK_PRO_PLANS);
  const [proIndex, setProIndex] = useState(0);
  const selectedPro = proPlans[proIndex] ?? proPlans[0];

  useEffect(() => {
    fetch(PLAN_PRICING_URL)
      .then(r => r.json())
      .then(raw => {
        const d = raw.body !== undefined ? (typeof raw.body === 'string' ? JSON.parse(raw.body) : raw.body) : raw;
        if (Array.isArray(d.plans) && d.plans.length > 0) setProPlans(d.plans);
      })
      .catch(() => {/* остаёмся на резервных ценах */});
  }, []);

  return (
    <>
      {/* PRICING */}
      <section id="pricing" className="py-16 md:py-24 bg-secondary/50">
        <div className="container">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto px-2">
              <span className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary">{L.pricing.label[lang]}</span>
              <h2 className="mt-3 font-display font-black text-3xl sm:text-4xl md:text-5xl tracking-tight">
                {L.pricing.title[lang]}
              </h2>
              <p className="mt-4 text-muted-foreground text-base sm:text-lg">
                {L.pricing.desc[lang]}
              </p>
            </div>
          </Reveal>
          <div className="mt-10 md:mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
            {PLANS.map((p, i) => (
              <Reveal key={`${p.name}-${p.tag}`} delay={i * 100}>
                <div className={`relative h-full rounded-2xl md:rounded-3xl border p-6 md:p-8 transition-all duration-300 hover:shadow-xl flex flex-col ${
                  p.hot ? 'border-primary bg-card shadow-2xl shadow-primary/15' : 'border-border bg-card'
                }`}>
                  {p.badge && (
                    <span className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-bold whitespace-nowrap ${
                      p.hot ? 'bg-primary text-primary-foreground animate-glow' : 'bg-secondary text-muted-foreground border border-border'
                    }`}>
                      {p.hot ? '✦ ' : ''}{p.badge}
                    </span>
                  )}
                  <div>
                    <h3 className="font-display font-bold text-xl md:text-2xl">{p.name}</h3>
                    <div className="mt-2 flex items-end gap-1 flex-wrap">
                      <span className="font-display font-black text-2xl md:text-3xl">{p.price}</span>
                      {p.note && <span className="mb-0.5 text-sm text-muted-foreground">{p.note}</span>}
                    </div>
                    <span className="inline-block mt-2 rounded-full bg-primary/10 text-primary text-xs font-semibold px-3 py-1">
                      {p.tag}
                    </span>
                  </div>
                  <ul className="mt-5 space-y-2 flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm">
                        <Icon name="Check" size={14} className="text-[hsl(195,46%,40%)] shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button asChild className={`mt-6 w-full rounded-full font-semibold transition-all hover:scale-105 ${p.hot ? 'shadow-lg shadow-primary/20' : 'bg-foreground hover:bg-foreground/90'}`}>
                    <Link to="/pricing">{p.cta}</Link>
                  </Button>
                </div>
              </Reveal>
            ))}
            <Reveal delay={PLANS.length * 100}>
              <div className="relative h-full rounded-2xl md:rounded-3xl border border-border bg-card p-6 md:p-8 transition-all duration-300 hover:shadow-xl flex flex-col">
                <div>
                  <h3 className="font-display font-bold text-xl md:text-2xl">{lang === 'ru' ? 'Профи' : 'Pro'}</h3>
                  <div className="mt-2 flex items-end gap-1 flex-wrap">
                    <span className="font-display font-black text-2xl md:text-3xl">{selectedPro.price.toLocaleString()} ₽</span>
                    <span className="mb-0.5 text-sm text-muted-foreground">{lang === 'ru' ? 'в месяц' : 'per month'}</span>
                  </div>
                  <span className="inline-block mt-2 rounded-full bg-primary/10 text-primary text-xs font-semibold px-3 py-1">
                    {getProRequestsLabel(selectedPro.requests, lang)}
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {proPlans.map((p, i) => (
                      <button
                        key={p.plan_code}
                        onClick={() => setProIndex(i)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          proIndex === i ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {p.requests}
                      </button>
                    ))}
                  </div>
                </div>
                <ul className="mt-5 space-y-2 flex-1">
                  {(lang === 'ru'
                    ? ['Приоритетная поддержка', 'Все возможности Премиум', 'Облачный хостинг']
                    : ['Priority support', 'All Premium features', 'Cloud hosting']
                  ).map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <Icon name="Check" size={14} className="text-[hsl(195,46%,40%)] shrink-0" />
                      {f}
                    </li>
                  ))}
                  {(PRO_PLAN_DETAILS[selectedPro.plan_code]?.[lang] ?? []).map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <Icon name="Check" size={14} className="text-[hsl(195,46%,40%)] shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-6 w-full rounded-full font-semibold transition-all hover:scale-105 bg-foreground hover:bg-foreground/90">
                  <Link to="/pricing">{lang === 'ru' ? 'Выбрать Профи' : 'Choose Pro'}</Link>
                </Button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* CTA 3 */}
      <section id="register" className="py-16 md:py-24">
        <div className="container px-4 sm:px-6">
          <Reveal>
            <div className="relative overflow-hidden rounded-2xl md:rounded-[2.5rem] bg-foreground text-background p-8 sm:p-10 md:p-16 text-center">
              <div className="absolute -top-16 -left-16 h-64 w-64 rounded-full bg-primary/40 blur-3xl animate-glow" />
              <div className="absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-accent/40 blur-3xl animate-glow" style={{animationDelay:'1s'}} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-4 py-1.5 text-sm font-medium mb-5">
                  <Icon name="Gift" size={15} /> {L.cta3.badge[lang]}
                </div>
                <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl tracking-tight">
                  {L.cta3.title[lang]}
                </h2>
                <p className="mt-4 text-background/70 text-base sm:text-lg max-w-xl mx-auto">
                  {L.cta3.desc[lang]}
                </p>
                <div className="mt-6 md:mt-8">
                  <EmailForm dark placeholder={L.cta3.input[lang]} btnText={L.cta3.btn[lang]} />
                </div>
                <p className="mt-4 text-xs text-background/40">
                  {L.cta3.privacy[lang]}
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 md:py-24 bg-secondary/50">
        <div className="container max-w-3xl">
          <Reveal>
            <div className="text-center px-2">
              <span className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary">FAQ</span>
              <h2 className="mt-3 font-display font-black text-3xl sm:text-4xl md:text-5xl tracking-tight">
                {L.faq.title[lang]}
              </h2>
            </div>
          </Reveal>
          <Reveal>
            <Accordion type="single" collapsible className="mt-8 md:mt-10 space-y-3">
              {FAQ.map((f, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="rounded-2xl border border-border bg-card px-4 sm:px-6">
                  <AccordionTrigger className="text-left font-display font-semibold text-base sm:text-lg hover:no-underline py-4 sm:py-5">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm sm:text-base">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
          <Reveal>
            <div className="mt-12 rounded-2xl md:rounded-3xl border border-primary/20 bg-primary/5 p-6 sm:p-8 text-center">
              <Icon name="MessageCircle" size={32} className="text-primary mx-auto mb-3" />
              <h3 className="font-display font-bold text-xl sm:text-2xl mb-2">{L.faq.ctaTitle[lang]}</h3>
              <p className="text-muted-foreground text-sm sm:text-base mb-5">{L.faq.ctaDesc[lang]}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button className="rounded-full font-semibold px-6" asChild>
                  <a href="mailto:roboweb.site@yandex.ru">
                    <Icon name="Mail" size={16} className="mr-2" />
                    {L.faq.mail[lang]}
                  </a>
                </Button>
                <Button variant="outline" className="rounded-full font-semibold px-6" asChild>
                  <a href="https://t.me/roboweb" target="_blank" rel="noopener noreferrer">
                    <Icon name="Send" size={16} className="mr-2" />
                    {L.faq.tg[lang]}
                  </a>
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* BLOG */}
      <section className="py-16 md:py-24 bg-secondary/40">
        <div className="container">
          <Reveal>
            <div className="flex items-end justify-between mb-10 md:mb-14 gap-4">
              <div>
                <span className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary">Блог</span>
                <h2 className="mt-3 font-display font-black text-3xl sm:text-4xl md:text-5xl tracking-tight">
                  Всё об AI‑разработке
                </h2>
              </div>
              <Link to="/blog" className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline shrink-0">
                Все статьи <Icon name="ArrowRight" size={16} />
              </Link>
            </div>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ARTICLES.slice(0, 3).map((article, i) => (
              <Reveal key={article.slug} delay={i * 70}>
                <Link
                  to={`/blog/${article.slug}`}
                  className="group flex flex-col h-full rounded-2xl md:rounded-3xl border border-border bg-card overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="relative h-40 overflow-hidden bg-muted">
                    <img src={article.cover} alt={article.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="flex flex-col flex-1 p-5 md:p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{article.category}</span>
                      <span className="text-xs text-muted-foreground">{article.readTime} чтения</span>
                    </div>
                    <h3 className="font-display font-bold text-lg leading-snug group-hover:text-primary transition-colors flex-1">
                      {article.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{article.description}</p>
                    <div className="mt-5 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{article.date}</span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:gap-2 transition-all">
                        Читать <Icon name="ArrowRight" size={13} />
                      </span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
          <div className="mt-8 text-center sm:hidden">
            <Link to="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
              Все статьи <Icon name="ArrowRight" size={16} />
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter lang={lang} />
    </>
  );
}