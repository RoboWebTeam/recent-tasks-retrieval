import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/icon';

interface Props {
  open: boolean;
  onClose: () => void;
  lang: 'ru' | 'en';
}

const SCRIPT_RU = [
  { time: 2,  type: 'user', text: 'Привет! Мне нужен лендинг для кофейни «Brew & Co». Тёплые тона, современно и уютно.' },
  { time: 5,  type: 'bot',  text: 'Отлично! Анализирую нишу и подбираю стиль ☕' },
  { time: 8,  type: 'progress', value: 18, label: 'Генерирую структуру' },
  { time: 11, type: 'bot',  text: '✅ Структура:\n🏠 Герой с фото и CTA\n🍰 Меню по категориям\n⏱ Онлайн-заказ\n⭐ Отзывы гостей\n📍 Контакты и карта' },
  { time: 15, type: 'progress', value: 38, label: 'Рисую дизайн' },
  { time: 18, type: 'bot',  text: '🎨 Применяю: тёплые amber/stone тона, шрифт Playfair Display, живые фото еды' },
  { time: 22, type: 'progress', value: 60, label: 'Пишу продающие тексты' },
  { time: 25, type: 'bot',  text: '✍️ Тексты готовы! SEO-заголовки, описания блюд, призывы к действию' },
  { time: 29, type: 'progress', value: 78, label: 'Добавляю анимации' },
  { time: 32, type: 'user', text: 'Добавь акцию: кофе + десерт = 350₽!' },
  { time: 35, type: 'bot',  text: '⚡ Готово! Баннер с акцией добавлен в Hero и в меню — с обратным отсчётом!' },
  { time: 38, type: 'progress', value: 92, label: 'Финальная сборка' },
  { time: 41, type: 'progress', value: 100, label: 'Публикую сайт' },
  { time: 43, type: 'done', text: '🚀 Сайт «Brew & Co» опубликован!\nbrewco.roboweb.site\n\n⏱ 47 секунд · 📱 Адаптивный · ✅ SEO' },
];

const SCRIPT_EN = [
  { time: 2,  type: 'user', text: 'Hi! I need a landing for coffee shop "Brew & Co". Warm tones, modern & cozy.' },
  { time: 5,  type: 'bot',  text: 'Great! Analyzing niche and picking style ☕' },
  { time: 8,  type: 'progress', value: 18, label: 'Generating structure' },
  { time: 11, type: 'bot',  text: '✅ Structure:\n🏠 Hero with photo & CTA\n🍰 Menu by category\n⏱ Online ordering\n⭐ Guest reviews\n📍 Contacts & map' },
  { time: 15, type: 'progress', value: 38, label: 'Designing layout' },
  { time: 18, type: 'bot',  text: '🎨 Applying: warm amber/stone tones, Playfair Display font, live food photos' },
  { time: 22, type: 'progress', value: 60, label: 'Writing copy' },
  { time: 25, type: 'bot',  text: '✍️ Copy ready! SEO headlines, dish descriptions, CTAs' },
  { time: 29, type: 'progress', value: 78, label: 'Adding animations' },
  { time: 32, type: 'user', text: 'Add a promo: coffee + dessert = $4.5!' },
  { time: 35, type: 'bot',  text: '⚡ Done! Promo banner added to Hero and menu — with countdown timer!' },
  { time: 38, type: 'progress', value: 92, label: 'Final build' },
  { time: 41, type: 'progress', value: 100, label: 'Publishing site' },
  { time: 43, type: 'done', text: '🚀 "Brew & Co" site is live!\nbrewco.roboweb.site\n\n⏱ 47 sec · 📱 Responsive · ✅ SEO' },
];

// Секции сайта кофейни — отрисовываются последовательно
const SECTIONS = [
  'nav',       // 0%
  'hero',      // 18%
  'promo',     // 38%
  'menu',      // 60%
  'reviews',   // 78%
  'contacts',  // 92%
  'published', // 100%
];

function getSectionIdx(p: number) {
  if (p >= 100) return 6;
  if (p >= 92)  return 5;
  if (p >= 78)  return 4;
  if (p >= 60)  return 3;
  if (p >= 38)  return 2;
  if (p >= 18)  return 1;
  return 0;
}

// Живой превью сайта кофейни
function SitePreview({ progress, lang }: { progress: number; lang: 'ru' | 'en' }) {
  const sec = getSectionIdx(progress);
  const isRu = lang === 'ru';

  return (
    <div className="h-full w-full overflow-y-auto bg-[#faf8f5] text-[#1a1a1a] font-sans select-none"
      style={{ fontFamily: 'Georgia, serif' }}>

      {/* NAV — появляется сразу */}
      {sec >= 0 && (
        <nav className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-white/95 backdrop-blur border-b border-amber-100 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="text-xl">☕</span>
            <span className="font-bold text-lg text-amber-900">Brew & Co</span>
          </div>
          <div className="hidden sm:flex gap-5 text-sm text-stone-500">
            {(isRu ? ['Меню', 'Доставка', 'О нас', 'Контакты'] : ['Menu', 'Delivery', 'About', 'Contacts']).map(l => (
              <span key={l} className="hover:text-amber-700 cursor-pointer transition-colors">{l}</span>
            ))}
          </div>
          <button className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-4 py-2 rounded-full transition-colors">
            {isRu ? 'Заказать' : 'Order'}
          </button>
        </nav>
      )}

      {/* HERO */}
      {sec >= 1 && (
        <div className="relative bg-gradient-to-br from-amber-50 via-orange-50 to-stone-100 px-6 pt-10 pb-12 overflow-hidden animate-fade-in">
          {/* Декоративные круги */}
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-amber-200/50 blur-2xl" />
          <div className="absolute -bottom-4 -left-4 h-32 w-32 rounded-full bg-orange-200/40 blur-xl" />
          <div className="relative flex flex-col sm:flex-row items-center gap-8">
            <div className="flex-1">
              <span className="inline-block bg-amber-100 text-amber-700 text-xs font-semibold rounded-full px-3 py-1 mb-3">
                {isRu ? '☕ Лучшая кофейня 2025' : '☕ Best coffee 2025'}
              </span>
              <h1 className="text-3xl sm:text-4xl font-bold text-amber-950 leading-tight mb-3">
                {isRu ? 'Вкус, который\nостаётся с тобой' : 'Taste that\nstays with you'}
              </h1>
              <p className="text-stone-500 text-sm mb-5 leading-relaxed">
                {isRu ? 'Авторский кофе, домашняя выпечка и тёплая атмосфера. Работаем с 8:00 до 22:00.' : 'Specialty coffee, homemade pastries and warm atmosphere. Open 8am–10pm.'}
              </p>
              <div className="flex gap-3 flex-wrap">
                <button className="bg-amber-500 text-white font-semibold px-5 py-2.5 rounded-full text-sm shadow-md shadow-amber-200 hover:bg-amber-600 transition-colors">
                  {isRu ? 'Смотреть меню' : 'View menu'}
                </button>
                <button className="border border-amber-300 text-amber-800 font-semibold px-5 py-2.5 rounded-full text-sm hover:bg-amber-50 transition-colors">
                  {isRu ? 'Онлайн-заказ' : 'Order online'}
                </button>
              </div>
              <div className="flex gap-5 mt-5 text-sm text-stone-500">
                <div><span className="font-bold text-amber-900 text-lg">4.9</span> ⭐</div>
                <div><span className="font-bold text-amber-900 text-lg">1200+</span> {isRu ? 'гостей' : 'guests'}</div>
                <div><span className="font-bold text-amber-900 text-lg">47</span> {isRu ? 'блюд' : 'dishes'}</div>
              </div>
            </div>
            {/* Fake coffee image */}
            <div className="relative shrink-0">
              <div className="h-36 w-36 sm:h-44 sm:w-44 rounded-3xl bg-gradient-to-br from-amber-300 to-orange-400 shadow-xl flex items-center justify-center text-6xl rotate-3">
                ☕
              </div>
              <div className="absolute -bottom-2 -right-2 bg-white rounded-2xl px-3 py-1.5 shadow-lg text-xs font-semibold text-amber-800">
                {isRu ? '✨ Сезонное меню' : '✨ Seasonal menu'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PROMO BANNER */}
      {sec >= 2 && (
        <div className="mx-4 my-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-4 text-white flex items-center justify-between shadow-lg animate-fade-in">
          <div>
            <div className="text-xs font-semibold opacity-80 mb-0.5">🔥 {isRu ? 'Акция дня' : 'Deal of the day'}</div>
            <div className="font-bold text-lg">{isRu ? 'Кофе + десерт = 350 ₽' : 'Coffee + dessert = $4.5'}</div>
            <div className="text-xs opacity-75 mt-0.5">{isRu ? 'Только сегодня · осталось 4:23:11' : 'Today only · 4:23:11 left'}</div>
          </div>
          <button className="bg-white text-amber-600 font-bold text-sm px-4 py-2 rounded-full shrink-0">
            {isRu ? 'Забрать' : 'Claim'}
          </button>
        </div>
      )}

      {/* MENU */}
      {sec >= 3 && (
        <div className="px-4 py-6 animate-fade-in">
          <h2 className="text-xl font-bold text-amber-950 mb-1">{isRu ? 'Наше меню' : 'Our menu'}</h2>
          <p className="text-stone-400 text-sm mb-4">{isRu ? 'Свежее каждый день' : 'Fresh every day'}</p>
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {(isRu ? ['☕ Кофе', '🍰 Выпечка', '🥗 Завтраки', '🧃 Напитки'] : ['☕ Coffee', '🍰 Pastry', '🥗 Breakfast', '🧃 Drinks']).map((cat, i) => (
              <button key={cat} className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${i === 0 ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                {cat}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(isRu ? [
              { emoji: '☕', name: 'Капучино', desc: 'двойной эспрессо', price: '180 ₽' },
              { emoji: '🍰', name: 'Тирамису', desc: 'домашний рецепт', price: '220 ₽' },
              { emoji: '🫐', name: 'Латте черника', desc: 'сезонный', price: '210 ₽' },
              { emoji: '🥐', name: 'Круассан', desc: 'с маслом', price: '120 ₽' },
            ] : [
              { emoji: '☕', name: 'Cappuccino', desc: 'double espresso', price: '$3.5' },
              { emoji: '🍰', name: 'Tiramisu', desc: 'homemade recipe', price: '$4.5' },
              { emoji: '🫐', name: 'Blueberry Latte', desc: 'seasonal', price: '$4' },
              { emoji: '🥐', name: 'Croissant', desc: 'with butter', price: '$2.5' },
            ]).map(item => (
              <div key={item.name} className="bg-white rounded-2xl p-3 shadow-sm border border-amber-50 hover:shadow-md transition-shadow">
                <div className="text-2xl mb-2">{item.emoji}</div>
                <div className="font-semibold text-sm text-stone-800">{item.name}</div>
                <div className="text-xs text-stone-400 mb-2">{item.desc}</div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-600">{item.price}</span>
                  <button className="bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full hover:bg-amber-500 hover:text-white transition-colors">+</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REVIEWS */}
      {sec >= 4 && (
        <div className="px-4 py-5 bg-amber-50/60 animate-fade-in">
          <h2 className="text-xl font-bold text-amber-950 mb-1">{isRu ? '⭐ Отзывы' : '⭐ Reviews'}</h2>
          <p className="text-stone-400 text-sm mb-4">4.9 / 5 · {isRu ? '1 200+ отзывов' : '1,200+ reviews'}</p>
          <div className="space-y-3">
            {(isRu ? [
              { name: 'Анна К.', text: 'Лучший капучино в городе! Атмосфера невероятная, приду снова.', stars: 5 },
              { name: 'Дмитрий', text: 'Заказывал онлайн — всё быстро и вкусно. Тирамису просто 🔥', stars: 5 },
            ] : [
              { name: 'Anna K.', text: 'Best cappuccino in the city! Amazing atmosphere, will come again.', stars: 5 },
              { name: 'David M.', text: 'Ordered online — fast and delicious. Tiramisu is 🔥', stars: 5 },
            ]).map(r => (
              <div key={r.name} className="bg-white rounded-2xl p-4 shadow-sm border border-amber-50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-full bg-amber-200 flex items-center justify-center text-sm font-bold text-amber-800">
                    {r.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-stone-800">{r.name}</div>
                    <div className="text-xs text-amber-400">{'★'.repeat(r.stars)}</div>
                  </div>
                </div>
                <p className="text-sm text-stone-600">{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTACTS */}
      {sec >= 5 && (
        <div className="px-4 py-5 animate-fade-in">
          <h2 className="text-xl font-bold text-amber-950 mb-4">{isRu ? '📍 Как нас найти' : '📍 Find us'}</h2>
          <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl p-4 mb-3">
            <div className="text-sm font-semibold text-amber-900 mb-1">📍 {isRu ? 'ул. Кофейная, 12' : '12 Coffee Street'}</div>
            <div className="text-xs text-stone-500">{isRu ? 'Пн–Вс · 8:00–22:00' : 'Mon–Sun · 8am–10pm'}</div>
            <div className="text-xs text-stone-500">📞 +7 999 123-45-67</div>
          </div>
          <div className="rounded-2xl overflow-hidden border border-amber-100" style={{height:'80px', background:'linear-gradient(135deg,#fef3c7,#fed7aa)'}}>
            <div className="h-full flex items-center justify-center text-amber-500 text-sm font-medium gap-2">
              🗺️ {isRu ? 'Открыть карту' : 'Open map'}
            </div>
          </div>
        </div>
      )}

      {/* PUBLISHED badge */}
      {sec >= 6 && (
        <div className="px-4 pb-6 animate-fade-in">
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 text-center">
            <div className="text-2xl mb-2">🚀</div>
            <div className="font-bold text-emerald-800 text-sm mb-1">
              {isRu ? 'Сайт опубликован!' : 'Site published!'}
            </div>
            <div className="text-xs text-emerald-600 font-mono">brewco.roboweb.site</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DemoModal({ open, onClose, lang }: Props) {
  const SCRIPT = lang === 'ru' ? SCRIPT_RU : SCRIPT_EN;
  const TOTAL = 47;

  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [visibleSteps, setVisibleSteps] = useState<typeof SCRIPT>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const reset = () => {
    setElapsed(0); setRunning(false); setFinished(false);
    setProgress(0); setProgressLabel(''); setVisibleSteps([]);
  };

  useEffect(() => {
    if (open) { reset(); setTimeout(() => setRunning(true), 500); }
    else reset();
  }, [open]);

  useEffect(() => {
    if (!running || finished) return;
    intervalRef.current = setInterval(() => {
      setElapsed(e => {
        const next = +(e + 0.1).toFixed(1);
        if (next >= TOTAL) { setFinished(true); setRunning(false); clearInterval(intervalRef.current!); return TOTAL; }
        return next;
      });
    }, 100);
    return () => clearInterval(intervalRef.current!);
  }, [running, finished]);

  useEffect(() => {
    const steps = SCRIPT.filter(s => s.time <= elapsed && s.type !== 'progress');
    setVisibleSteps(prev => steps.length > prev.length ? steps : prev);
    const lp = [...SCRIPT].reverse().find(s => s.type === 'progress' && s.time <= elapsed) as { value?: number; label?: string } | undefined;
    if (lp) { setProgress(lp.value ?? 0); setProgressLabel(lp.label ?? ''); }
  }, [elapsed]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [visibleSteps]);

  if (!open) return null;

  const pct = Math.min((elapsed / TOTAL) * 100, 100);
  const timeLeft = Math.max(0, TOTAL - elapsed).toFixed(1);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-slate-200"
        style={{ maxHeight: '92vh', background: '#f8fafc' }}>

        {/* TOP BAR — светлый macOS-стиль */}
        <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <div className="h-3 w-3 rounded-full bg-[#28c840]" />
            </div>
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1.5">
              <Icon name="Globe" size={12} className="text-slate-400" />
              <span className="text-slate-500 text-xs font-mono">roboweb.site</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {running && (
              <div className="flex items-center gap-1.5 bg-blue-50 text-blue-600 text-xs font-semibold px-3 py-1 rounded-full">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                {lang === 'ru' ? 'Создаю' : 'Building'} {timeLeft}s
              </div>
            )}
            {finished && (
              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 text-xs font-semibold px-3 py-1 rounded-full">
                <Icon name="CheckCircle" size={13} />
                {lang === 'ru' ? '47 сек — рекорд!' : '47 sec — record!'}
              </div>
            )}
            <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
              <Icon name="X" size={15} />
            </button>
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div className="h-1 bg-slate-100 shrink-0">
          <div className="h-full bg-gradient-to-r from-blue-500 via-primary to-amber-400 transition-all duration-100 rounded-full"
            style={{ width: `${pct}%` }} />
        </div>

        {/* MAIN */}
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* LEFT — Chat (светлая версия) */}
          <div className="flex flex-col w-[300px] lg:w-[340px] shrink-0 border-r border-slate-100 bg-white">

            {/* Chat header */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-100 shrink-0 bg-gradient-to-r from-primary/5 to-blue-50">
              <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-primary text-white shrink-0 shadow-sm">
                <Icon name="Bot" size={17} />
                <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800">Roboweb AI</div>
                <div className="text-xs text-emerald-500 font-semibold">● {lang === 'ru' ? 'онлайн' : 'online'}</div>
              </div>
              {running && (
                <div className="ml-auto flex gap-1">
                  {[0,1,2].map(i => (
                    <span key={i} className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce"
                      style={{animationDelay:`${i*0.15}s`}} />
                  ))}
                </div>
              )}
            </div>

            {/* Messages */}
            <div ref={chatRef} className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-0 bg-slate-50/50">
              {/* Welcome */}
              <div className="flex gap-2 justify-start animate-fade-in">
                <div className="grid h-6 w-6 place-items-center rounded-full bg-primary text-white shrink-0 mt-0.5 text-xs">
                  <Icon name="Bot" size={12} />
                </div>
                <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-white border border-slate-100 shadow-sm px-3.5 py-2.5 text-xs text-slate-700 leading-relaxed">
                  {lang === 'ru' ? '👋 Привет! Опишите ваш сайт — и я создам его за 47 секунд.' : '👋 Hi! Describe your site — I\'ll build it in 47 seconds.'}
                </div>
              </div>

              {visibleSteps.filter(s => s.type === 'user' || s.type === 'bot' || s.type === 'done').map((step, i) => (
                <div key={i} className={`flex gap-2 ${step.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                  {step.type !== 'user' && (
                    <div className="grid h-6 w-6 place-items-center rounded-full bg-primary text-white shrink-0 mt-0.5">
                      <Icon name="Bot" size={12} />
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-2xl text-xs leading-relaxed whitespace-pre-line px-3.5 py-2.5 ${
                    step.type === 'user'
                      ? 'bg-primary text-white rounded-br-sm shadow-sm'
                      : step.type === 'done'
                        ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 text-emerald-800 font-semibold rounded-bl-sm'
                        : 'bg-white border border-slate-100 shadow-sm text-slate-700 rounded-bl-sm'
                  }`}>
                    {step.text}
                  </div>
                  {step.type === 'user' && (
                    <div className="grid h-6 w-6 place-items-center rounded-full bg-slate-200 text-slate-600 text-xs font-bold shrink-0 mt-0.5">
                      U
                    </div>
                  )}
                </div>
              ))}

              {running && (
                <div className="flex gap-2 justify-start">
                  <div className="grid h-6 w-6 place-items-center rounded-full bg-primary text-white shrink-0 mt-0.5">
                    <Icon name="Bot" size={12} />
                  </div>
                  <div className="bg-white border border-slate-100 shadow-sm rounded-2xl rounded-bl-sm px-3.5 py-2.5 flex items-center gap-1">
                    {[0,1,2].map(i => (
                      <span key={i} className="h-1.5 w-1.5 rounded-full bg-slate-300 animate-bounce"
                        style={{animationDelay:`${i*0.2}s`}} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Progress */}
            {progress > 0 && (
              <div className="px-4 py-3 border-t border-slate-100 bg-white shrink-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-500">{progressLabel}</span>
                  <span className="text-xs font-bold text-primary">{progress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary to-amber-400 transition-all duration-700"
                    style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {/* Input decorative */}
            <div className="p-3 border-t border-slate-100 bg-white shrink-0">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2">
                <span className="text-xs text-slate-300 flex-1">{lang === 'ru' ? 'Опишите ваш сайт…' : 'Describe your website…'}</span>
                <div className="grid h-6 w-6 place-items-center rounded-lg bg-primary/20 text-primary">
                  <Icon name="Send" size={11} />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Live site preview */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {/* Browser bar */}
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-1.5 flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5">
                {progress >= 100 ? (
                  <Icon name="Lock" size={11} className="text-emerald-500 shrink-0" />
                ) : (
                  <Icon name="Globe" size={11} className="text-slate-300 shrink-0" />
                )}
                <span className="text-xs font-mono text-slate-400 truncate">
                  {progress >= 100 ? 'https://brewco.roboweb.site' : 'brewco.roboweb.site'}
                </span>
                {progress >= 100 && (
                  <span className="ml-auto bg-emerald-100 text-emerald-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                    LIVE
                  </span>
                )}
              </div>
              <div className="flex gap-1.5 shrink-0">
                {['Monitor','Smartphone'].map((d, i) => (
                  <div key={d} className={`grid h-6 w-6 place-items-center rounded-md text-xs ${i===0?'bg-slate-200 text-slate-600':'text-slate-300'}`}>
                    <Icon name={d} size={12} />
                  </div>
                ))}
              </div>
            </div>

            {/* Site */}
            <div className="flex-1 overflow-hidden min-h-0">
              {progress === 0 ? (
                <div className="h-full bg-slate-50 flex flex-col items-center justify-center gap-3">
                  <div className="h-16 w-16 rounded-2xl bg-slate-100 border border-slate-200 grid place-items-center">
                    <Icon name="Globe" size={28} className="text-slate-300" />
                  </div>
                  <p className="text-slate-400 text-sm">{lang === 'ru' ? 'Начните диалог — сайт появится здесь' : 'Start the chat — site will appear here'}</p>
                </div>
              ) : (
                <SitePreview progress={progress} lang={lang} />
              )}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        {finished && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-white shrink-0 animate-fade-in">
            <div className="text-sm text-slate-500">
              🎉 {lang === 'ru' ? 'Сайт создан за 47 секунд. Попробуйте сами!' : 'Site built in 47 seconds. Try it yourself!'}
            </div>
            <div className="flex gap-2">
              <button onClick={reset} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors px-3 py-1.5 rounded-xl hover:bg-slate-100">
                <Icon name="RotateCcw" size={13} /> {lang === 'ru' ? 'Ещё раз' : 'Replay'}
              </button>
              <a href="/register" className="flex items-center gap-1.5 text-xs font-semibold bg-primary text-white rounded-full px-5 py-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                {lang === 'ru' ? 'Создать свой сайт' : 'Create my site'}
                <Icon name="ArrowRight" size={13} />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
