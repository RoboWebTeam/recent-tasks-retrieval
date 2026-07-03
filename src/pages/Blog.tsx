import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ARTICLES } from '@/data/blog';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { setSeo, setBlogJsonLd } from '@/lib/seo';
import { getLang, tr } from '@/lib/i18n';
import { SiteFooter } from '@/components/SiteFooter';

export default function Blog() {
  const lang = getLang();
  const ALL = tr('blogAll', lang);
  const CATEGORIES = [ALL, ...Array.from(new Set(ARTICLES.map(a => a.category)))];
  const [searchParams] = useSearchParams();

  const [category, setCategory] = useState(ALL);

  useEffect(() => {
    const catFromUrl = searchParams.get('cat');
    if (catFromUrl && CATEGORIES.includes(catFromUrl)) {
      setCategory(catFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    setSeo({
      title: tr('blogSeoTitle', lang),
      description: tr('blogSeoDesc', lang),
      url: '/blog',
      keywords: lang === 'ru'
        ? 'блог о сайтах, AI разработка, создать сайт быстро, конструктор сайтов'
        : 'website blog, AI development, build site fast, site builder',
    });
    setBlogJsonLd();
  }, []);

  const isFiltering = category !== ALL;

  const filtered = useMemo(() => {
    return ARTICLES.filter(a => category === ALL || a.category === category);
  }, [category]);

  const featured = !isFiltering ? filtered[0] : null;
  const rest = featured ? filtered.slice(1) : filtered;

  const getArticlesCount = (count: number) => {
    if (lang === 'en') return `${tr('blogFoundCount', lang)} ${count} ${count === 1 ? tr('blogArticles1', lang) : tr('blogArticles5', lang)}`;
    if (count === 1) return `${tr('blogFoundCount', lang)} ${count} ${tr('blogArticles1', lang)}`;
    if (count >= 2 && count <= 4) return `${tr('blogFoundCount', lang)} ${count} ${tr('blogArticles2', lang)}`;
    return `${tr('blogFoundCount', lang)} ${count} ${tr('blogArticles5', lang)}`;
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container flex h-14 sm:h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display font-black text-lg sm:text-xl text-primary">
            <span className="grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-xl bg-primary text-primary-foreground shrink-0">
              <Icon name="Bot" size={18} />
            </span>
            Roboweb
          </Link>
          <Button size="sm" className="rounded-full font-semibold" asChild>
            <Link to="/register">{tr('blogCreate', lang)}</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute -top-24 -left-24 h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -top-10 right-0 h-56 w-56 sm:h-80 sm:w-80 rounded-full bg-[hsl(250,90%,60%)]/10 blur-3xl" />
        <div className="container relative py-10 sm:py-16 md:py-24">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-5 sm:mb-6">
            <Icon name="ArrowLeft" size={16} /> {tr('blogBackHome', lang)}
          </Link>
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-primary mb-3">
              <Icon name="Sparkles" size={13} /> {tr('blogLabel', lang)}
            </span>
            <h1 className="font-display font-black text-3xl sm:text-5xl md:text-6xl tracking-tight leading-[1.05] break-words">
              {tr('blogTitle', lang)}
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl">
              {tr('blogDesc', lang)}
            </p>
          </div>
        </div>
      </section>

      <main className="container py-8 sm:py-12 md:py-16">
        {/* Search + filters */}
        <div className="flex gap-2 flex-wrap sm:overflow-visible overflow-x-auto pb-1 -mx-1 px-1 sm:mx-0 sm:px-0 mb-8 sm:mb-10">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-semibold transition-all max-w-[180px] truncate ${category === cat ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30' : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/40'}`}
            >
              {cat}
              {cat !== ALL && (
                <span className={`ml-1.5 text-[10px] font-bold ${category === cat ? 'opacity-70' : 'opacity-50'}`}>
                  {ARTICLES.filter(a => a.category === cat).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Results count */}
        {isFiltering && filtered.length > 0 && (
          <p className="text-sm text-muted-foreground mb-5">
            {getArticlesCount(filtered.length)}
          </p>
        )}

        {/* Empty state */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-3xl bg-secondary border border-border mb-4">
              <Icon name="Search" size={28} className="text-muted-foreground/40" />
            </div>
            <p className="font-semibold text-foreground mb-2">{tr('blogEmpty', lang)}</p>
            <p className="text-sm text-muted-foreground mb-5">{tr('blogEmptyDesc', lang)}</p>
            <button onClick={() => setCategory(ALL)} className="text-sm text-primary hover:underline">
              {tr('blogReset', lang)}
            </button>
          </div>
        ) : (
          <>
            {/* Featured article */}
            {featured && (
              <Link
                to={`/blog/${featured.slug}`}
                className="group relative flex flex-col md:flex-row mb-8 sm:mb-10 rounded-3xl border border-border bg-card overflow-hidden hover:shadow-2xl hover:border-primary/30 transition-all duration-300"
              >
                <div className="relative w-full md:w-1/2 h-56 sm:h-72 md:h-auto overflow-hidden bg-muted shrink-0">
                  <img src={featured.cover} alt={featured.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0 md:bg-gradient-to-r" />
                  <span className="absolute top-3 left-3 rounded-full bg-primary px-3 py-1 text-[10px] font-bold text-primary-foreground uppercase tracking-wide">
                    {lang === 'ru' ? 'Свежее' : 'Latest'}
                  </span>
                </div>
                <div className="flex flex-col justify-center flex-1 p-6 sm:p-8 md:p-10">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary w-fit mb-3">{featured.category}</span>
                  <h2 className="font-display font-bold text-xl sm:text-2xl md:text-3xl leading-snug group-hover:text-primary transition-colors break-words">
                    {featured.title}
                  </h2>
                  <p className="mt-3 text-sm sm:text-base text-muted-foreground line-clamp-2 sm:line-clamp-3">{featured.description}</p>
                  <div className="mt-5 flex items-center gap-4">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Icon name="Calendar" size={12} />{featured.date}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Icon name="Clock" size={12} />{featured.readTime} {tr('blogReadTime', lang)}
                    </span>
                  </div>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:gap-2.5 transition-all w-fit">
                    {tr('blogRead', lang)} <Icon name="ArrowRight" size={15} />
                  </span>
                </div>
              </Link>
            )}

            {/* Articles grid */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((article) => (
                <Link
                  key={article.slug}
                  to={`/blog/${article.slug}`}
                  className="group flex flex-col rounded-3xl border border-border bg-card overflow-hidden hover:shadow-2xl hover:-translate-y-1 hover:border-primary/30 transition-all duration-300"
                >
                  <div className="relative h-44 sm:h-48 overflow-hidden bg-muted">
                    <img src={article.cover} alt={article.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                    <span className="absolute top-3 left-3 rounded-full bg-black/50 backdrop-blur px-2.5 py-1 text-[10px] font-semibold text-white flex items-center gap-1">
                      <Icon name="Clock" size={10} />{article.readTime} {tr('blogReadTime', lang)}
                    </span>
                  </div>
                  <div className="flex flex-col flex-1 p-5 sm:p-6">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary w-fit max-w-full truncate mb-3">{article.category}</span>
                    <h2 className="font-display font-bold text-base sm:text-lg leading-snug group-hover:text-primary transition-colors flex-1 line-clamp-2 break-words">
                      {article.title}
                    </h2>
                    <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{article.description}</p>
                    <div className="mt-5 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Icon name="Calendar" size={12} />{article.date}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:gap-2 transition-all">
                        {tr('blogRead', lang)} <Icon name="ArrowRight" size={13} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Bottom CTA */}
        <div className="relative overflow-hidden mt-14 sm:mt-20 rounded-3xl bg-gradient-to-br from-primary to-[hsl(250,90%,60%)] p-7 sm:p-10 md:p-14 text-center text-white">
          <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <h2 className="font-display font-black text-2xl sm:text-3xl md:text-4xl mb-3">{tr('blogCtaTitle', lang)}</h2>
            <p className="text-white/80 text-base sm:text-lg mb-8 max-w-lg mx-auto">{tr('blogCtaDesc', lang)}</p>
            <Button size="lg" className="rounded-full bg-white text-primary hover:bg-white/90 font-semibold px-8 sm:px-10 text-base shadow-xl" asChild>
              <Link to="/register">{tr('blogCtaBtn', lang)} <Icon name="ArrowRight" size={18} className="ml-1" /></Link>
            </Button>
          </div>
        </div>
      </main>

      <SiteFooter lang={lang} />
    </div>
  );
}