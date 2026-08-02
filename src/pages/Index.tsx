import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getLang, type Lang } from '@/lib/i18n';
import Icon from '@/components/ui/icon';
import DemoModal from '@/components/DemoModal';
import { IndexNav, IndexHero } from './index/IndexHero';
import { IndexSections } from './index/IndexSections';
import { getCHAT_STEPS, L } from './index/indexData';
import { setSeo } from '@/lib/seo';

const Index = () => {
  const [lang, setLangState] = useState<Lang>(getLang());
  // Главная раньше жила на статичных мета-тегах из index.html и на каноническом адресе,
  // который был жёстко прибит к «/» для ВСЕХ страниц сайта.
  useEffect(() => {
    setSeo(lang === 'ru' ? {
      title: 'Создать сайт с ИИ за минуты — фуллстек и код в GitHub',
      description: 'ИИ соберёт рабочий сайт по описанию на русском: база данных, формы, каталог, корзина, личные кабинеты. Код Next.js — в ваш GitHub. Бесплатный старт, карта не нужна.',
      url: '/',
    } : {
      title: 'Build a fullstack site with AI in minutes — code in GitHub',
      description: 'Describe your idea and get a working site with a database, forms, catalog, cart and user accounts. Export Next.js code to your own GitHub. Free to start, no card needed.',
      url: '/',
    });
  }, [lang]);
  const [demoOpen, setDemoOpen] = useState(false);
  const [chatStep, setChatStep] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [progress, setProgress] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [wordIdx, setWordIdx] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);

  const CHAT_STEPS = getCHAT_STEPS(lang);
  const typedWords = L.hero.words[lang] as unknown as string[];

  const handleLangSwitch = (l: Lang) => {
    setLangState(l);
    setChatStep(0);
    setProgress(0);
    setWordIdx(0);
  };

  // Chat animation loop
  useEffect(() => {
    if (chatStep >= CHAT_STEPS.length) {
      const t = setTimeout(() => {
        setChatStep(0);
        setProgress(0);
        setIsTyping(false);
      }, 3000);
      return () => clearTimeout(t);
    }
    const step = CHAT_STEPS[chatStep];
    setIsTyping(step.who === 'bot');
    const delay = chatStep === 0 ? 600 : 1500;
    const t = setTimeout(() => {
      setIsTyping(false);
      if (step.progress !== undefined) setProgress(step.progress);
      if ((step as { done?: boolean }).done) setProgress(100);
      setChatStep(s => s + 1);
    }, chatStep === 0 ? delay : delay + 800);
    return () => clearTimeout(t);
  }, [chatStep]);

  // Typewriter effect
  useEffect(() => {
    const full = typedWords[wordIdx];
    const typeSpeed = isDeleting ? 35 : 65;
    const pauseDelay = 1600;
    const t = setTimeout(() => {
      if (!isDeleting) {
        const next = full.slice(0, typedText.length + 1);
        setTypedText(next);
        if (next === full) setTimeout(() => setIsDeleting(true), pauseDelay);
      } else {
        const next = typedText.slice(0, -1);
        setTypedText(next);
        if (next === '') {
          setIsDeleting(false);
          setWordIdx(i => (i + 1) % typedWords.length);
        }
      }
    }, typeSpeed);
    return () => clearTimeout(t);
  }, [typedText, isDeleting, wordIdx, typedWords]);

  // Липкий нижний CTA для мобилы + полоса прогресса чтения страницы
  useEffect(() => {
    const onScroll = () => {
      setShowSticky(window.scrollY > 620);
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      setScrollPct(max > 0 ? Math.min(100, (el.scrollTop / max) * 100) : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock scroll on mobile menu
  useEffect(() => {
    if (menuOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (scrollY) window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [menuOpen]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:font-semibold focus:text-primary-foreground focus:shadow-lg"
      >
        {lang === 'ru' ? 'К содержимому' : 'Skip to content'}
      </a>
      {/* Полоса прогресса чтения */}
      <div className="rw-progress" style={{ width: `${scrollPct}%` }} aria-hidden="true" />
      <IndexNav
        lang={lang}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        onLangSwitch={handleLangSwitch}
      />
      <main id="main">
        <IndexHero
          lang={lang}
          typedText={typedText}
          chatStep={chatStep}
          isTyping={isTyping}
          progress={progress}
          chatSteps={CHAT_STEPS}
          onDemoOpen={() => setDemoOpen(true)}
        />
        <IndexSections lang={lang} />
      </main>

      {/* Липкий мобильный CTA */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 px-4 py-3 backdrop-blur-xl transition-transform duration-300 sm:hidden ${showSticky ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
      >
        <Link
          to="/register"
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/25"
        >
          {lang === 'ru' ? 'Собрать проект бесплатно' : 'Build your project free'}
          <Icon name="ArrowRight" size={17} />
        </Link>
      </div>

      <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} lang={lang} />
    </div>
  );
};

export default Index;