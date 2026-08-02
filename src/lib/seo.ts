const BASE_URL = 'https://roboweb.dev';
const DEFAULT_IMAGE = 'https://s3-nl.hostkey.com/robo/demo/4ad7a664-b53c-40fe-8519-d34d7d589413.jpg';

interface SeoMeta {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  keywords?: string;
  /** Страница не для поиска (вход, статусы заказа, копия проекта на чужом домене). */
  noindex?: boolean;
}

export function setSeo({ title, description, image, url, type = 'website', publishedTime, keywords, noindex }: SeoMeta) {
  const fullTitle = title.includes('Roboweb') ? title : `${title} | Roboweb`;
  const img = image || DEFAULT_IMAGE;
  // Самоссылочный канонический адрес по умолчанию. Раньше страницы без явного url объявляли
  // канонической версией главную — то есть сами просили поисковик себя не индексировать.
  const canonical = url ? `${BASE_URL}${url}` : `${BASE_URL}${window.location.pathname}`;

  document.title = fullTitle;
  // Флаг индексации выставляем на КАЖДОЙ странице. Иначе noindex, поставленный на одной
  // странице, оставался висеть при переходе внутри приложения и уводил из поиска следующую.
  setMeta('robots', noindex ? 'noindex, follow' : 'index, follow');
  setMeta('description', description);
  setMeta('keywords', keywords || '');
  // Страница «не найдено» не должна объявлять канонический адрес: её собственного адреса не
  // существует, а указывать чужой — значит склеивать с ним ошибку.
  if (noindex && !url) {
    document.querySelector('link[rel="canonical"]')?.remove();
  } else {
    setLink('canonical', canonical);
  }

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

export function setNoIndex() {
  // follow, а не nofollow: страницу в поиск не пускаем, но ссылочный вес по внутренним ссылкам
  // ходить должен — иначе разделы, доступные только отсюда, выпадают из обхода.
  setMeta('robots', 'noindex, follow');
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
    description: 'Статьи об AI-разработке проектов, советы для бизнеса и кейсы',
    url: `${BASE_URL}/blog`,
    publisher: { '@type': 'Organization', name: 'Roboweb', url: BASE_URL }
  });
}