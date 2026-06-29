import { type Lang } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { L, getFEATURES, getCOMPARE, getTRUST, getSTEPS, getMARQUEE } from './indexData';
import { Reveal, EmailForm } from './IndexShared';

interface Props { lang: Lang; }

export function IndexSectionsTop({ lang }: Props) {
  const FEATURES      = getFEATURES(lang);
  const COMPARE       = getCOMPARE(lang);
  const TRUST         = getTRUST(lang);
  const STEPS         = getSTEPS(lang);
  const MARQUEE_ITEMS = getMARQUEE(lang);

  return (
    <>
      {/* MARQUEE */}
      <div className="overflow-hidden border-y border-border bg-secondary/40 py-3.5">
        <div className="flex animate-marquee whitespace-nowrap gap-8">
          {MARQUEE_ITEMS.map((item, i) => (
            <span key={i} className="text-sm font-semibold text-muted-foreground">{item}</span>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section id="features" className="py-16 md:py-24">
        <div className="container">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto px-2">
              <span className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary">{L.nav.features[lang]}</span>
              <h2 className="mt-3 font-display font-black text-3xl sm:text-4xl md:text-5xl tracking-tight">
                {L.features.title[lang]}
              </h2>
              <p className="mt-4 text-muted-foreground text-base sm:text-lg">
                {L.features.desc[lang]}
              </p>
            </div>
          </Reveal>
          <div className="mt-10 md:mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 70}>
                <div className="group h-full rounded-2xl md:rounded-3xl border border-border bg-card p-5 md:p-7 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30 cursor-default">
                  <span className="grid h-10 w-10 md:h-12 md:w-12 place-items-center rounded-xl md:rounded-2xl bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110">
                    <Icon name={f.icon} size={20} />
                  </span>
                  <h3 className="mt-4 font-display font-bold text-lg md:text-xl">{f.title}</h3>
                  <p className="mt-2 text-muted-foreground text-sm md:text-base">{f.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST STATS */}
      <section className="py-12 md:py-16 bg-foreground text-background">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {TRUST.map((t, i) => (
              <Reveal key={t.label} delay={i * 80}>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-white/10 mb-3 mx-auto">
                    <Icon name={t.icon} size={22} className="text-accent" />
                  </div>
                  <div className="font-display font-black text-2xl sm:text-3xl text-white">{t.value}</div>
                  <div className="text-sm text-background/60 mt-1">{t.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARE TABLE */}
      <section className="py-16 md:py-24">
        <div className="container">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto px-2 mb-10 md:mb-14">
              <span className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary">{L.compare.label[lang]}</span>
              <h2 className="mt-3 font-display font-black text-3xl sm:text-4xl md:text-5xl tracking-tight">
                {L.compare.title[lang]}
              </h2>
              <p className="mt-4 text-muted-foreground text-base sm:text-lg">
                {L.compare.desc[lang]}
              </p>
            </div>
          </Reveal>
          <Reveal>
            <div className="overflow-x-auto rounded-2xl md:rounded-3xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left p-4 md:p-5 font-display font-bold text-base">{lang === 'ru' ? 'Критерий' : 'Criteria'}</th>
                    <th className="p-4 md:p-5 font-display font-bold text-base">
                      <span className="inline-flex items-center gap-1.5 text-primary">
                        <Icon name="Bot" size={15} /> Roboweb
                      </span>
                    </th>
                    <th className="p-4 md:p-5 font-display font-bold text-base text-muted-foreground">{lang === 'ru' ? 'Агентство' : 'Agency'}</th>
                    <th className="p-4 md:p-5 font-display font-bold text-base text-muted-foreground">{lang === 'ru' ? 'Фрилансер' : 'Freelancer'}</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE.map((row, i) => (
                    <tr key={row.label} className={`border-b border-border last:border-0 ${i % 2 === 0 ? 'bg-card' : 'bg-secondary/20'}`}>
                      <td className="p-4 md:p-5 font-medium text-muted-foreground">{row.label}</td>
                      <td className="p-4 md:p-5 text-center">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-primary bg-primary/10 rounded-full px-3 py-1 text-xs">
                          <Icon name="CheckCircle" size={13} />{row.roboweb}
                        </span>
                      </td>
                      <td className="p-4 md:p-5 text-center text-muted-foreground">{row.agency}</td>
                      <td className="p-4 md:p-5 text-center text-muted-foreground">{row.freelancer}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA 1 */}
      <section className="py-12 bg-primary/5 border-y border-primary/10">
        <Reveal>
          <div className="container text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">{L.cta1.label[lang]}</p>
            <h3 className="font-display font-black text-2xl sm:text-3xl md:text-4xl tracking-tight mb-2">
              {L.cta1.title[lang]} <span className="text-gradient">{L.cta1.accent[lang]}</span>
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">{L.cta1.desc[lang]}</p>
            <EmailForm placeholder={L.cta1.input[lang]} btnText={L.cta1.btn[lang]} />
          </div>
        </Reveal>
      </section>

      {/* PROCESS */}
      <section id="process" className="py-16 md:py-24 bg-foreground text-background relative overflow-hidden">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-80 w-[40rem] rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
        <div className="container relative">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto px-2">
              <span className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-accent">{L.process.label[lang]}</span>
              <h2 className="mt-3 font-display font-black text-3xl sm:text-4xl md:text-5xl tracking-tight">
                {L.process.title[lang]}
              </h2>
            </div>
          </Reveal>
          <div className="mt-10 md:mt-14 grid sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 120}>
                <div className="relative rounded-2xl md:rounded-3xl border border-white/10 bg-white/5 p-5 md:p-7 h-full backdrop-blur group hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                  <div className="font-display font-black text-4xl md:text-5xl text-accent/90 group-hover:text-accent transition-colors">{s.n}</div>
                  <h3 className="mt-3 md:mt-4 font-display font-bold text-lg md:text-xl">{s.title}</h3>
                  <p className="mt-2 text-background/70 text-sm md:text-base">{s.text}</p>
                  {i < STEPS.length - 1 && (
                    <div className="absolute -right-3 top-1/2 -translate-y-1/2 hidden md:block z-10">
                      <Icon name="ChevronRight" size={20} className="text-white/30" />
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
