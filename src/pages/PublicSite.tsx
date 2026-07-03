import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { PUBLIC_SITE_URL } from '@/lib/auth';

export default function PublicSite() {
  const { slug } = useParams<{ slug: string }>();
  const [html, setHtml] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);

    fetch(`${PUBLIC_SITE_URL}?slug=${encodeURIComponent(slug)}`)
      .then(r => r.json())
      .then(raw => {
        const data = raw.body !== undefined
          ? (typeof raw.body === 'string' ? JSON.parse(raw.body) : raw.body)
          : raw;
        if (data.error || !data.html) {
          setNotFound(true);
          return;
        }
        setHtml(data.html);
        setTitle(data.title || '');
        document.title = data.title || 'Roboweb';
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Icon name="Loader" size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background text-center px-4">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-secondary text-muted-foreground">
          <Icon name="FileQuestion" size={28} />
        </div>
        <div>
          <h1 className="font-display font-bold text-xl mb-1">Сайт не найден</h1>
          <p className="text-muted-foreground text-sm">Возможно, он ещё не опубликован или ссылка неверна</p>
        </div>
        <Link to="/" className="text-primary text-sm font-medium hover:underline">
          На главную Roboweb
        </Link>
      </div>
    );
  }

  return (
    <iframe
      title={title || 'site'}
      srcDoc={html}
      className="w-full h-screen border-0"
      sandbox="allow-scripts allow-forms allow-popups allow-same-origin"
    />
  );
}
