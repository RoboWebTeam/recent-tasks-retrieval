import { Link } from 'react-router-dom';
import { ARTICLES } from '@/data/blog';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

const CATEGORIES = ['Все', ...Array.from(new Set(ARTICLES.map(a => a.category)))];

export default function Blog() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="font-display font-black text-xl text-primary">Roboweb</Link>
          <Button size="sm" className="rounded-full font-semibold" asChild>
            <Link to="/register">Создать сайт</Link>
          </Button>
        </div>
      </header>

      <main className="container py-12 md:py-20">
        {/* Hero */}
        <div className="max-w-2xl mb-12 md:mb-16">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
            <Icon name="ArrowLeft" size={16} /> На главную
          </Link>
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary mb-3">Блог</span>
          <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl tracking-tight leading-tight">
            Всё об AI‑разработке сайтов
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Статьи, инструкции и кейсы о том, как создавать сайты быстро и без лишних затрат с помощью Roboweb.
          </p>
        </div>

        {/* Articles grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ARTICLES.map((article, i) => (
            <Link
              key={article.slug}
              to={`/blog/${article.slug}`}
              className="group flex flex-col rounded-3xl border border-border bg-card overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
            >
              {/* Card top color bar */}
              <div className={`h-2 w-full ${i % 5 === 0 ? 'bg-gradient-to-r from-primary to-violet-500' : i % 5 === 1 ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : i % 5 === 2 ? 'bg-gradient-to-r from-rose-500 to-pink-500' : i % 5 === 3 ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gradient-to-r from-cyan-400 to-sky-500'}`} />
              <div className="flex flex-col flex-1 p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{article.category}</span>
                  <span className="text-xs text-muted-foreground">{article.readTime} чтения</span>
                </div>
                <h2 className="font-display font-bold text-lg leading-snug group-hover:text-primary transition-colors flex-1">
                  {article.title}
                </h2>
                <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{article.description}</p>
                <div className="mt-5 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Icon name="Calendar" size={12} />{article.date}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:gap-2 transition-all">
                    Читать <Icon name="ArrowRight" size={13} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 rounded-3xl bg-gradient-to-r from-primary to-[hsl(250,90%,60%)] p-8 md:p-12 text-center text-white">
          <h2 className="font-display font-black text-3xl md:text-4xl mb-3">Готовы создать свой сайт?</h2>
          <p className="text-white/80 text-lg mb-8">Попробуйте Roboweb бесплатно — первый сайт за несколько минут</p>
          <Button size="lg" className="rounded-full bg-white text-primary hover:bg-white/90 font-semibold px-10 h-13 text-base shadow-xl" asChild>
            <Link to="/register">Создать сайт бесплатно <Icon name="ArrowRight" size={18} className="ml-1" /></Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
