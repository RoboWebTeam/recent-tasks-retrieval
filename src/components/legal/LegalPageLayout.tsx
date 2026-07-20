import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { getLang, tr } from '@/lib/i18n';
import { SiteFooter } from '@/components/SiteFooter';

interface LegalPageLayoutProps {
  title: string;
  updatedAt: string;
  children: ReactNode;
}

/** Единый каркас для страниц юридических документов (оферта, политика конфиденциальности, согласие на ПД). */
export default function LegalPageLayout({ title, updatedAt, children }: LegalPageLayoutProps) {
  const lang = getLang();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container flex h-14 sm:h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg sm:text-xl text-primary">
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

      <main className="container max-w-3xl py-10 md:py-16">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
          <Icon name="ArrowLeft" size={16} /> {lang === 'ru' ? 'На главную' : 'Back home'}
        </Link>

        <h1 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl tracking-tight mb-2">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          {lang === 'ru' ? `Действует с ${updatedAt}` : `Effective from ${updatedAt}`}
        </p>

        <article className="prose-custom space-y-6 text-sm sm:text-base leading-relaxed text-foreground [&_h2]:font-display [&_h2]:font-bold [&_h2]:text-lg [&_h2]:sm:text-xl [&_h2]:mt-8 [&_h2]:mb-3 [&_p]:text-muted-foreground [&_li]:text-muted-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_strong]:text-foreground [&_strong]:font-semibold">
          {children}
        </article>
      </main>

      <SiteFooter lang={lang} />
    </div>
  );
}
