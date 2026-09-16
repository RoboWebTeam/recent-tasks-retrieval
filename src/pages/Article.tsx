import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getArticle, ARTICLES } from '@/data/blog';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { setSeo, setArticleJsonLd } from '@/lib/seo';
import { getLang, tr } from '@/lib/i18n';
import { SiteFooter } from '@/components/SiteFooter';
import ArticleBody from '@/components/blog/ArticleBody';

/** «June 10, 2026» → «2026-06-10». В разметку статьи уходила русская строка «10 июня 2026»,
 *  а datePublished и article:published_time поиск понимает только в ISO-формате. */
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const isoDate = (en: string) => {
  const m = /^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/.exec(en.trim());
  const month = m ? MONTHS.indexOf(m[1].toLowerCase()) + 1 : 0;
  return m && month ? `${m[3]}-${String(month).padStart(2, '0')}-${m[2].padStart(2, '0')}` : en;
};

export default function Article() {
  const lang = getLang();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const article = slug ? getArticle(slug) : null;
  const [readProgress, setReadProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const el = document.documentElement;
      const scrollTop = el.scrollTop || document.body.scrollTop;
      const scrollHeight = el.scrollHeight - el.clientHeight;
      setReadProgress(scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!article) { navigate('/blog'); return; }
    window.scrollTo(0, 0);
    setReadProgress(0);
    setSeo({
      title: article.title[lang],
      description: article.description[lang],
      image: article.cover,
      url: `/blog/${article.slug}`,
      type: 'article',
      publishedTime: isoDate(article.date.en),
      keywords: `${article.category[lang]}, AI websites, Roboweb, ${article.title[lang].toLowerCase()}`,
    });
    setArticleJsonLd({ title: article.title[lang], description: article.description[lang], date: isoDate(article.date.en), cover: article.cover, slug: article.slug });
  }, [slug, article]);

  if (!article) return null;

  const currentIdx = ARTICLES.findIndex(a => a.slug === slug);
  const prevArticle = currentIdx > 0 ? ARTICLES[currentIdx - 1] : null;
  const nextArticle = currentIdx < ARTICLES.length - 1 ? ARTICLES[currentIdx + 1] : null;
  const related = ARTICLES.filter(a => a.slug !== slug && a.category[lang] === article.category[lang]).slice(0, 3);
  const fallbackRelated = related.length > 0 ? related : ARTICLES.filter(a => a.slug !== slug).slice(0, 3);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: article.title[lang], url });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Первые статьи начинаются с «## Заголовок» — повтор H1 сразу под ним. Для поиска это второй
  // заголовок с тем же текстом, для читателя — дубль; убираем только точное совпадение.
  const body = article.content[lang].replace(/^\s*## (.+)\n+/, (m, h: string) => (h.trim() === article.title[lang].trim() ? '' : m));

  return (
    <div className="min-h-screen bg-background">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-toast h-1 bg-border">
        <div
          className="h-full bg-gradient-to-r from-primary to-violet-500 transition-all duration-100"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-sticky border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <Link to="/" className="font-display font-bold text-lg text-primary shrink-0">Roboweb</Link>
            <span className="text-muted-foreground shrink-0">/</span>
            <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0">{tr('blogLabel', lang)}</Link>
            <span className="text-muted-foreground shrink-0 hidden sm:inline">/</span>
            <span className="text-sm text-foreground truncate hidden sm:inline">{article.title[lang]}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground hidden sm:inline">{readProgress}%</span>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-xl border border-border hover:bg-secondary transition-colors"
            >
              <Icon name={copied ? 'Check' : 'Share2'} size={14} />
              <span className="hidden sm:inline">{copied ? tr('articleCopied', lang) : tr('articleShare', lang)}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="container max-w-3xl py-12 md:py-20">
        {/* Back */}
        <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
          <Icon name="ArrowLeft" size={16} /> {tr('articleBack', lang)}
        </Link>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Link
            to={`/blog?cat=${encodeURIComponent(article.category[lang])}`}
            className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors max-w-full truncate"
          >
            {article.category[lang]}
          </Link>
          <span className="text-sm text-muted-foreground flex items-center gap-2">
            <Icon name="Calendar" size={14} />{article.date[lang]}
          </span>
          <span className="text-sm text-muted-foreground flex items-center gap-2">
            <Icon name="Clock" size={14} />{article.readTime[lang]} {tr('blogReadTime', lang)}
          </span>
        </div>

        {/* Title */}
        <h1 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-tight leading-tight mb-6 break-words">
          {article.title[lang]}
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground mb-8 border-l-4 border-primary/40 pl-4 break-words">
          {article.description[lang]}
        </p>

        {/* Cover */}
        <div className="rounded-2xl overflow-hidden mb-10 aspect-video bg-muted">
          <img src={article.cover} alt={article.title[lang]} className="w-full h-full object-cover" />
        </div>

        {/* Content */}
        <article className="prose-custom">
          <ArticleBody content={body} />
        </article>

        {/* Share bottom */}
        <div className="mt-10 pt-8 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground mb-1">{tr('articleShareTitle', lang)}</p>
            <p className="text-xs text-muted-foreground">{tr('articleShareDesc', lang)}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Icon name={copied ? 'Check' : 'Share2'} size={15} />
              {copied ? tr('articleCopied', lang) : tr('articleShare', lang)}
            </button>
            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(article.title[lang])}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2AABEE] text-white text-sm font-semibold hover:bg-[#2AABEE]/90 transition-colors"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="white"><path d="M5.5 11.5L17 7L14 18L10.5 14.5L8 16.5L8.5 13L14 9.5L8 12.5L5.5 11.5Z"/></svg>
              Telegram
            </a>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-3xl bg-gradient-to-r from-primary to-[hsl(250,90%,60%)] p-8 text-center text-white">
          <h3 className="font-display font-bold text-2xl mb-2">{tr('blogCtaTitle', lang)}</h3>
          <p className="text-white/80 mb-6">{tr('blogCtaDesc', lang)}</p>
          <Button size="lg" className="rounded-full bg-white text-primary hover:bg-white/90 font-semibold px-8" asChild>
            <Link to="/register">{tr('blogCtaBtn', lang)} <Icon name="ArrowRight" size={18} className="ml-1" /></Link>
          </Button>
        </div>

        {/* Prev / Next navigation */}
        {(prevArticle || nextArticle) && (
          <div className="mt-10 grid sm:grid-cols-2 gap-4">
            {prevArticle ? (
              <Link to={`/blog/${prevArticle.slug}`} className="group flex flex-col gap-2 p-4 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all">
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Icon name="ArrowLeft" size={13} /> {lang === 'ru' ? 'Предыдущая' : 'Previous'}
                </span>
                <span className="font-display font-bold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2 break-words">{prevArticle.title[lang]}</span>
              </Link>
            ) : <div />}
            {nextArticle && (
              <Link to={`/blog/${nextArticle.slug}`} className="group flex flex-col gap-2 p-4 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all text-right">
                <span className="flex items-center gap-2 text-xs text-muted-foreground justify-end">
                  {lang === 'ru' ? 'Следующая' : 'Next'} <Icon name="ArrowRight" size={13} />
                </span>
                <span className="font-display font-bold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2 break-words">{nextArticle.title[lang]}</span>
              </Link>
            )}
          </div>
        )}

        {/* Related */}
        {fallbackRelated.length > 0 && (
          <div className="mt-14">
            <h2 className="font-display font-bold text-2xl mb-6">
              {related.length > 0
                ? (lang === 'ru' ? 'Похожие статьи' : 'Related articles')
                : (lang === 'ru' ? 'Читайте также' : 'Read also')}
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {fallbackRelated.map(a => (
                <Link key={a.slug} to={`/blog/${a.slug}`} className="group block rounded-2xl border border-border bg-card overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                  <div className="h-32 overflow-hidden bg-muted">
                    <img src={a.cover} alt={a.title[lang]} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-4">
                    <span className="text-xs font-semibold text-primary truncate block">{a.category[lang]}</span>
                    <h3 className="mt-2 font-display font-bold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2 break-words">{a.title[lang]}</h3>
                    <span className="mt-2 text-xs text-muted-foreground">{a.readTime[lang]} {tr('blogReadTime', lang)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <SiteFooter lang={lang} />
    </div>
  );
}