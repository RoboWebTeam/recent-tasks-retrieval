import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getArticle, ARTICLES } from '@/data/blog';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { setSeo, setArticleJsonLd } from '@/lib/seo';

export default function Article() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const article = slug ? getArticle(slug) : null;
  const [readProgress, setReadProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  // Прогресс-бар чтения
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
      title: article.title,
      description: article.description,
      image: article.cover,
      url: `/blog/${article.slug}`,
      type: 'article',
      publishedTime: article.date,
      keywords: `${article.category}, AI сайты, Roboweb, ${article.title.toLowerCase()}`,
    });
    setArticleJsonLd(article);
  }, [slug, article]);

  if (!article) return null;

  const currentIdx = ARTICLES.findIndex(a => a.slug === slug);
  const prevArticle = currentIdx > 0 ? ARTICLES[currentIdx - 1] : null;
  const nextArticle = currentIdx < ARTICLES.length - 1 ? ARTICLES[currentIdx + 1] : null;
  const related = ARTICLES.filter(a => a.slug !== slug && a.category === article.category).slice(0, 3);
  const fallbackRelated = related.length > 0 ? related : ARTICLES.filter(a => a.slug !== slug).slice(0, 3);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: article.title, url });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      if (line.startsWith('## ')) return <h2 key={i} className="mt-10 mb-4 font-display font-black text-2xl sm:text-3xl tracking-tight">{line.replace('## ', '')}</h2>;
      if (line.startsWith('### ')) return <h3 key={i} className="mt-7 mb-3 font-display font-bold text-xl">{line.replace('### ', '')}</h3>;
      if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="mt-4 font-semibold text-foreground">{line.replace(/\*\*/g, '')}</p>;
      if (line.startsWith('- ')) return <li key={i} className="ml-5 mt-1 list-disc text-muted-foreground">{line.replace('- ', '')}</li>;
      if (line.startsWith('| ') || line.startsWith('|---')) return null;
      if (line.trim() === '') return <div key={i} className="h-2" />;
      const formatted = line
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>');
      return <p key={i} className="mt-4 text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Прогресс-бар чтения */}
      <div className="fixed top-0 left-0 right-0 z-[100] h-1 bg-border">
        <div
          className="h-full bg-gradient-to-r from-primary to-violet-500 transition-all duration-100"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <Link to="/" className="font-display font-black text-lg text-primary shrink-0">Roboweb</Link>
            <span className="text-muted-foreground shrink-0">/</span>
            <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0">Блог</Link>
            <span className="text-muted-foreground shrink-0 hidden sm:inline">/</span>
            <span className="text-sm text-foreground truncate hidden sm:inline">{article.title}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Прогресс в заголовке */}
            <span className="text-xs text-muted-foreground hidden sm:inline">{readProgress}%</span>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border border-border hover:bg-secondary transition-colors"
            >
              <Icon name={copied ? 'Check' : 'Share2'} size={14} />
              <span className="hidden sm:inline">{copied ? 'Скопировано!' : 'Поделиться'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="container max-w-3xl py-12 md:py-20">
        {/* Back */}
        <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
          <Icon name="ArrowLeft" size={16} /> Все статьи
        </Link>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Link
            to={`/blog?cat=${encodeURIComponent(article.category)}`}
            className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
          >
            {article.category}
          </Link>
          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Icon name="Calendar" size={14} />{article.date}
          </span>
          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Icon name="Clock" size={14} />{article.readTime} чтения
          </span>
        </div>

        {/* Title */}
        <h1 className="font-display font-black text-3xl sm:text-4xl md:text-5xl tracking-tight leading-tight mb-6">
          {article.title}
        </h1>

        <p className="text-lg text-muted-foreground mb-8 border-l-4 border-primary/40 pl-4">
          {article.description}
        </p>

        {/* Cover */}
        <div className="rounded-2xl overflow-hidden mb-10 aspect-video bg-muted">
          <img src={article.cover} alt={article.title} className="w-full h-full object-cover" />
        </div>

        {/* Content */}
        <article className="prose-custom">
          {renderContent(article.content)}
        </article>

        {/* Share bottom */}
        <div className="mt-10 pt-8 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground mb-1">Понравилась статья?</p>
            <p className="text-xs text-muted-foreground">Поделитесь с коллегами и друзьями</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Icon name={copied ? 'Check' : 'Share2'} size={15} />
              {copied ? 'Скопировано!' : 'Поделиться'}
            </button>
            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(article.title)}`}
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
          <h3 className="font-display font-black text-2xl mb-2">Попробуй Roboweb бесплатно</h3>
          <p className="text-white/80 mb-6">Создай свой первый сайт за несколько минут — без технических знаний</p>
          <Button size="lg" className="rounded-full bg-white text-primary hover:bg-white/90 font-semibold px-8" asChild>
            <Link to="/register">Создать сайт бесплатно <Icon name="ArrowRight" size={18} className="ml-1" /></Link>
          </Button>
        </div>

        {/* Prev / Next navigation */}
        {(prevArticle || nextArticle) && (
          <div className="mt-10 grid sm:grid-cols-2 gap-4">
            {prevArticle ? (
              <Link to={`/blog/${prevArticle.slug}`} className="group flex flex-col gap-2 p-4 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Icon name="ArrowLeft" size={13} /> Предыдущая
                </span>
                <span className="font-display font-bold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">{prevArticle.title}</span>
              </Link>
            ) : <div />}
            {nextArticle && (
              <Link to={`/blog/${nextArticle.slug}`} className="group flex flex-col gap-2 p-4 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all text-right">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground justify-end">
                  Следующая <Icon name="ArrowRight" size={13} />
                </span>
                <span className="font-display font-bold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">{nextArticle.title}</span>
              </Link>
            )}
          </div>
        )}

        {/* Related */}
        {fallbackRelated.length > 0 && (
          <div className="mt-14">
            <h2 className="font-display font-black text-2xl mb-6">
              {related.length > 0 ? 'Похожие статьи' : 'Читайте также'}
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {fallbackRelated.map(a => (
                <Link key={a.slug} to={`/blog/${a.slug}`} className="group block rounded-2xl border border-border bg-card overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                  <div className="h-32 overflow-hidden bg-muted">
                    <img src={a.cover} alt={a.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-4">
                    <span className="text-xs font-semibold text-primary">{a.category}</span>
                    <h3 className="mt-1.5 font-display font-bold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">{a.title}</h3>
                    <span className="mt-2 text-xs text-muted-foreground">{a.readTime} чтения</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
