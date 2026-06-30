import { useState, useEffect } from 'react';
import { getLang, type Lang } from '@/lib/i18n';
import DemoModal from '@/components/DemoModal';
import { IndexNav, IndexHero } from './index/IndexHero';
import { IndexSections } from './index/IndexSections';
import { getCHAT_STEPS, L } from './index/indexData';

const Index = () => {
  const [lang, setLangState] = useState<Lang>(getLang());
  const [demoOpen, setDemoOpen] = useState(false);
  const [chatStep, setChatStep] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [progress, setProgress] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [wordIdx, setWordIdx] = useState(0);

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

  // Смена слов каждые 2.5 секунды
  useEffect(() => {
    const t = setInterval(() => {
      setWordIdx(i => (i + 1) % typedWords.length);
    }, 2500);
    return () => clearInterval(t);
  }, [typedWords.length]);

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
      <IndexNav
        lang={lang}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        onLangSwitch={handleLangSwitch}
      />
      <IndexHero
        lang={lang}
        wordIdx={wordIdx}
        chatStep={chatStep}
        isTyping={isTyping}
        progress={progress}
        chatSteps={CHAT_STEPS}
        onDemoOpen={() => setDemoOpen(true)}
      />
      <IndexSections lang={lang} />
      <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} lang={lang} />
    </div>
  );
};

export default Index;