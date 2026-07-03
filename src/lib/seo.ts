const BASE_URL = 'https://roboweb.site';
const DEFAULT_IMAGE = 'https://cdn.poehali.dev/projects/a4107a6b-2fca-459b-a931-acd33e9eb6c0/files/4ad7a664-b53c-40fe-8519-d34d7d589413.jpg';

interface SeoMeta {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  keywords?: string;
}

export function setSeo({ title, description, image, url, type = 'website', publishedTime, keywords }: SeoMeta) {
  const fullTitle = title.includes('Roboweb') ? title : `${title} | Roboweb`;
  const img = image || DEFAULT_IMAGE;
  const canonical = url ? `${BASE_URL}${url}` : BASE_URL;

  document.title = fullTitle;
  setMeta('description', description);
  setMeta('keywords', keywords || '');
  setLink('canonical', canonical);

  setOg('title', fullTitle);
  setOg('description', description);
  setOg('image', img);
  setOg('url', canonical);
  setOg('type', type);
  setOg('site_name', 'Roboweb');
  setOg('locale', 'ru_RU');
  if (publishedTime) setOg('article:published_time', publishedTime);

  setTwitter('title', fullTitle);
  setTwitter('description', description);
  setTwitter('image', img);
  setTwitter('card', 'summary_large_image');
}

function setMeta(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) { el = document.createElement('meta'); el.name = name; document.head.appendChild(el); }
  el.content = content;
}

function setOg(property: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[property="og:${property}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute('property', `og:${property}`); document.head.appendChild(el); }
  el.content = content;
}

function setTwitter(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="twitter:${name}"]`);
  if (!el) { el = document.createElement('meta'); el.name = `twitter:${name}`; document.head.appendChild(el); }
  el.content = content;
}

function setLink(rel: string, href: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) { el = document.createElement('link'); el.rel = rel; document.head.appendChild(el); }
  el.href = href;
}

export function setArticleJsonLd(article: { title: string; description: string; date: string; cover: string; slug: string }) {
  const id = 'article-jsonld';
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) { el = document.createElement('script'); el.id = id; el.type = 'application/ld+json'; document.head.appendChild(el); }
  el.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    image: article.cover,
    datePublished: article.date,
    url: `${BASE_URL}/blog/${article.slug}`,
    publisher: {
      '@type': 'Organization',
      name: 'Roboweb',
      logo: { '@type': 'ImageObject', url: `${BASE_URL}/favicon.svg` }
    },
    author: { '@type': 'Organization', name: 'Roboweb' }
  });
}

export function setBlogJsonLd() {
  const id = 'blog-jsonld';
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) { el = document.createElement('script'); el.id = id; el.type = 'application/ld+json'; document.head.appendChild(el); }
  el.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Блог Roboweb',
    description: 'Статьи об AI-разработке сайтов, советы для бизнеса и кейсы',
    url: `${BASE_URL}/blog`,
    publisher: { '@type': 'Organization', name: 'Roboweb', url: BASE_URL }
  });
}