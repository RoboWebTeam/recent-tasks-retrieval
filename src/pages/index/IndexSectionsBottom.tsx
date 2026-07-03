import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { ARTICLES } from '@/data/blog';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { type Lang } from '@/lib/i18n';
import { L, getNAV, getPLANS, getFAQ } from './indexData';
import { Reveal, EmailForm } from './IndexShared';

interface Props { lang: Lang; }

export function IndexSectionsBottom({ lang }: Props) {
  const NAV   = getNAV(lang);
  const PLANS = getPLANS(lang);
  const FAQ   = getFAQ(lang);

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
          <div className="mt-10 md:mt-14 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 max-w-7xl mx-auto">
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
                        <Icon name="Check" size={14} className="text-[hsl(88,60%,40%)] shrink-0" />
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

      {/* FOOTER */}
      <footer className="border-t border-border bg-background">
        <div className="container py-10 md:py-14 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">
          <div className="col-span-2 md:col-span-1">
            <a href="#" className="flex items-center gap-2 font-display font-extrabold text-lg md:text-xl">
              <span className="grid h-8 w-8 md:h-9 md:w-9 place-items-center rounded-xl bg-primary text-primary-foreground shrink-0">
                <Icon name="Bot" size={18} />
              </span>
              Roboweb
            </a>
            <p className="mt-3 text-sm text-muted-foreground">{L.footer.desc[lang]}</p>
          </div>
          <div>
            <h4 className="font-display font-bold mb-3 md:mb-4 text-sm md:text-base">{L.footer.nav[lang]}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {NAV.map((n) => (
                <li key={n.href}>
                  {n.href.startsWith('/') && !n.href.startsWith('/#')
                    ? <Link to={n.href} className="hover:text-foreground transition-colors">{n.label}</Link>
                    : <a href={n.href} className="hover:text-foreground transition-colors">{n.label}</a>}
                </li>
              ))}
            </ul>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <h4 className="font-display font-bold mb-3 md:mb-4 text-sm md:text-base">{L.footer.contacts[lang]}</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Icon name="Mail" size={15} className="text-primary shrink-0" />
                <a href="mailto:roboweb.site@yandex.ru" className="hover:text-foreground transition-colors break-all">
                  roboweb.site@yandex.ru
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Icon name="Phone" size={15} className="text-primary shrink-0" />
                <a href="tel:+79331770086" className="hover:text-foreground transition-colors">
                  8 (933) 177-00-86
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Icon name="MessageCircle" size={15} className="text-primary shrink-0" /> Telegram
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold mb-3 md:mb-4 text-sm md:text-base">{L.footer.social[lang]}</h4>
            <div className="flex gap-2 md:gap-3">
              {['Send', 'Youtube', 'Instagram'].map((s) => (
                <a key={s} href="#"
                  className="grid h-9 w-9 md:h-10 md:w-10 place-items-center rounded-xl border border-border text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all hover:scale-110">
                  <Icon name={s} size={16} />
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-border py-5 text-center text-xs sm:text-sm text-muted-foreground px-4 space-y-1">
          <p>© 2026 Roboweb. {L.footer.copy[lang]}</p>
          <p className="text-[11px] sm:text-xs text-muted-foreground/70">
            ИП Аракелов Станислав Владиславович · ОГРНИП 324508100357892 · ИНН 501210007760
          </p>
        </div>
      </footer>
    </>
  );
}