import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { getArticle, ARTICLES } from '@/data/blog';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

export default function Article() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const article = slug ? getArticle(slug) : null;

  useEffect(() => {
    if (!article) navigate('/blog');
    window.scrollTo(0, 0);
  }, [slug]);

  if (!article) return null;

  const related = ARTICLES.filter(a => a.slug !== slug).slice(0, 3);

  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      if (line.startsWith('## ')) return <h2 key={i} className="mt-10 mb-4 font-display font-black text-2xl sm:text-3xl tracking-tight">{line.replace('## ', '')}</h2>;
      if (line.startsWith('### ')) return <h3 key={i} className="mt-7 mb-3 font-display font-bold text-xl">{line.replace('### ', '')}</h3>;
      if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="mt-4 font-semibold text-foreground">{line.replace(/\*\*/g, '')}</p>;
      if (line.startsWith('- ')) return <li key={i} className="ml-5 mt-1 list-disc text-muted-foreground">{line.replace('- ', '')}</li>;
      if (line.startsWith('| ')) return null;
      if (line.startsWith('|---')) return null;
      if (line.trim() === '') return <div key={i} className="h-2" />;

      const formatted = line
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>');

      return <p key={i} className="mt-4 text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center gap-4">
          <Link to="/" className="font-display font-black text-xl text-primary">Roboweb</Link>
          <span className="text-muted-foreground">/</span>
          <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Блог</Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm text-foreground truncate max-w-xs">{article.title}</span>
        </div>
      </header>

      <main className="container max-w-3xl py-12 md:py-20">
        {/* Back */}
        <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
          <Icon name="ArrowLeft" size={16} /> Все статьи
        </Link>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{article.category}</span>
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

        {/* CTA */}
        <div className="mt-16 rounded-3xl bg-gradient-to-r from-primary to-[hsl(250,90%,60%)] p-8 text-center text-white">
          <h3 className="font-display font-black text-2xl mb-2">Попробуй Roboweb бесплатно</h3>
          <p className="text-white/80 mb-6">Создай свой первый сайт за несколько минут — без технических знаний</p>
          <Button size="lg" className="rounded-full bg-white text-primary hover:bg-white/90 font-semibold px-8" asChild>
            <Link to="/register">Создать сайт бесплатно <Icon name="ArrowRight" size={18} className="ml-1" /></Link>
          </Button>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="font-display font-black text-2xl mb-6">Читайте также</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {related.map(a => (
                <Link key={a.slug} to={`/blog/${a.slug}`} className="group block rounded-2xl border border-border bg-card p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                  <span className="text-xs font-semibold text-primary">{a.category}</span>
                  <h3 className="mt-2 font-display font-bold text-sm leading-snug group-hover:text-primary transition-colors">{a.title}</h3>
                  <span className="mt-3 text-xs text-muted-foreground">{a.readTime} чтения</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}