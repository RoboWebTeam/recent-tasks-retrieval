import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ARTICLES } from '@/data/blog';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { setSeo, setBlogJsonLd } from '@/lib/seo';

const ALL = 'Все';
const CATEGORIES = [ALL, ...Array.from(new Set(ARTICLES.map(a => a.category)))];

export default function Blog() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(ALL);

  useEffect(() => {
    setSeo({
      title: 'Блог о AI-разработке сайтов — Roboweb',
      description: 'Статьи, инструкции и кейсы о том, как создавать сайты быстро и без лишних затрат с помощью Roboweb.',
      url: '/blog',
      keywords: 'блог о сайтах, AI разработка, создать сайт быстро, конструктор сайтов',
    });
    setBlogJsonLd();
  }, []);

  const filtered = useMemo(() => {
    return ARTICLES.filter(a => {
      const matchCat = category === ALL || a.category === category;
      const q = search.toLowerCase();
      const matchSearch = !q || a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) || a.category.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [search, category]);

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
        <div className="max-w-2xl mb-10">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
            <Icon name="ArrowLeft" size={16} /> На главную
          </Link>
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary mb-3">Блог</span>
          <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl tracking-tight leading-tight">
            Всё об AI‑разработке сайтов
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Статьи, инструкции и кейсы о том, как создавать сайты быстро и без лишних затрат.
          </p>
        </div>

        {/* Search + filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1 max-w-sm">
            <Icon name="Search" size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск по статьям…"
              className="pl-9 h-10 rounded-xl"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <Icon name="X" size={14} />
              </button>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${category === cat ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/40'}`}
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
        </div>

        {/* Results count */}
        {(search || category !== ALL) && (
          <p className="text-sm text-muted-foreground mb-5">
            {filtered.length === 0
              ? 'Ничего не найдено'
              : `Найдено ${filtered.length} ${filtered.length === 1 ? 'статья' : filtered.length < 5 ? 'статьи' : 'статей'}`}
            {search && <span> по запросу «<span className="font-semibold text-foreground">{search}</span>»</span>}
          </p>
        )}

        {/* Articles grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-3xl bg-secondary border border-border mb-4">
              <Icon name="Search" size={28} className="text-muted-foreground/40" />
            </div>
            <p className="font-semibold text-foreground mb-2">Статей не найдено</p>
            <p className="text-sm text-muted-foreground mb-5">Попробуйте другой запрос или выберите другую категорию</p>
            <button onClick={() => { setSearch(''); setCategory(ALL); }} className="text-sm text-primary hover:underline">
              Сбросить фильтры
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((article) => (
              <Link
                key={article.slug}
                to={`/blog/${article.slug}`}
                className="group flex flex-col rounded-3xl border border-border bg-card overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="relative h-44 overflow-hidden bg-muted">
                  <img src={article.cover} alt={article.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                  <span className="absolute top-3 left-3 rounded-full bg-black/50 backdrop-blur px-2.5 py-1 text-[10px] font-semibold text-white">
                    {article.readTime} чтения
                  </span>
                </div>
                <div className="flex flex-col flex-1 p-6">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary w-fit mb-3">{article.category}</span>
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
        )}

        {/* Bottom CTA */}
        <div className="mt-20 rounded-3xl bg-gradient-to-r from-primary to-[hsl(250,90%,60%)] p-8 md:p-12 text-center text-white">
          <h2 className="font-display font-black text-3xl md:text-4xl mb-3">Готовы создать свой сайт?</h2>
          <p className="text-white/80 text-lg mb-8">Попробуйте Roboweb бесплатно — первый сайт за несколько минут</p>
          <Button size="lg" className="rounded-full bg-white text-primary hover:bg-white/90 font-semibold px-10 text-base shadow-xl" asChild>
            <Link to="/register">Создать сайт бесплатно <Icon name="ArrowRight" size={18} className="ml-1" /></Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
