const SECTIONS = [
  'nav',
  'hero',
  'promo',
  'menu',
  'reviews',
  'contacts',
  'published',
];

export function getSectionIdx(p: number) {
  if (p >= 100) return 6;
  if (p >= 92)  return 5;
  if (p >= 78)  return 4;
  if (p >= 60)  return 3;
  if (p >= 38)  return 2;
  if (p >= 18)  return 1;
  return 0;
}

export function DemoSitePreview({ progress, lang }: { progress: number; lang: 'ru' | 'en' }) {
  const sec = getSectionIdx(progress);
  const isRu = lang === 'ru';

  return (
    <div className="h-full w-full overflow-y-auto bg-[#faf8f5] text-[#1a1a1a] font-sans select-none"
      style={{ fontFamily: 'Georgia, serif' }}>

      {sec >= 0 && (
        <nav className="sticky top-0 z-sticky flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3 bg-white/95 backdrop-blur border-b border-warning/30 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="text-xl">☕</span>
            <span className="font-bold text-lg text-warning">Brew & Co</span>
          </div>
          <div className="hidden sm:flex gap-5 text-sm text-stone-500">
            {(isRu ? ['Меню', 'Доставка', 'О нас', 'Контакты'] : ['Menu', 'Delivery', 'About', 'Contacts']).map(l => (
              <span key={l} className="hover:text-warning cursor-pointer transition-colors">{l}</span>
            ))}
          </div>
          <button className="bg-warning hover:bg-warning text-white text-xs font-semibold px-4 py-2 rounded-full transition-colors">
            {isRu ? 'Заказать' : 'Order'}
          </button>
        </nav>
      )}

      {sec >= 1 && (
        <div className="relative bg-gradient-to-br from-amber-50 via-orange-50 to-stone-100 px-3 sm:px-6 pt-6 sm:pt-10 pb-8 sm:pb-12 overflow-hidden animate-fade-in">
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-warning/50 blur-2xl" />
          <div className="absolute -bottom-4 -left-4 h-32 w-32 rounded-full bg-orange-200/40 blur-xl" />
          <div className="relative flex flex-col sm:flex-row items-center gap-8">
            <div className="flex-1">
              <span className="inline-block bg-warning text-warning text-xs font-semibold rounded-full px-3 py-1 mb-3">
                {isRu ? '☕ Лучшая кофейня 2025' : '☕ Best coffee 2025'}
              </span>
              <h1 className="text-3xl sm:text-4xl font-bold text-warning leading-tight mb-3">
                {isRu ? 'Вкус, который\nостаётся с тобой' : 'Taste that\nstays with you'}
              </h1>
              <p className="text-stone-500 text-sm mb-5 leading-relaxed">
                {isRu ? 'Авторский кофе, домашняя выпечка и тёплая атмосфера. Работаем с 8:00 до 22:00.' : 'Specialty coffee, homemade pastries and warm atmosphere. Open 8am–10pm.'}
              </p>
              <div className="flex gap-3 flex-wrap">
                <button className="bg-warning text-white font-semibold px-5 py-3 rounded-full text-sm shadow-md shadow-warning/30 hover:bg-warning transition-colors">
                  {isRu ? 'Смотреть меню' : 'View menu'}
                </button>
                <button className="border border-warning/30 text-warning font-semibold px-5 py-3 rounded-full text-sm hover:bg-warning transition-colors">
                  {isRu ? 'Онлайн-заказ' : 'Order online'}
                </button>
              </div>
              <div className="flex gap-5 mt-5 text-sm text-stone-500">
                <div><span className="font-bold text-warning text-lg">4.9</span> ⭐</div>
                <div><span className="font-bold text-warning text-lg">1200+</span> {isRu ? 'гостей' : 'guests'}</div>
                <div><span className="font-bold text-warning text-lg">47</span> {isRu ? 'блюд' : 'dishes'}</div>
              </div>
            </div>
            <div className="relative shrink-0">
              <div className="h-24 w-24 sm:h-36 sm:w-36 md:h-44 md:w-44 rounded-3xl bg-gradient-to-br from-amber-300 to-orange-400 shadow-xl flex items-center justify-center text-4xl sm:text-6xl rotate-3">
                ☕
              </div>
              <div className="absolute -bottom-2 -right-2 bg-white rounded-2xl px-3 py-2 shadow-lg text-xs font-semibold text-warning">
                {isRu ? '✨ Сезонное меню' : '✨ Seasonal menu'}
              </div>
            </div>
          </div>
        </div>
      )}

      {sec >= 2 && (
        <div className="mx-3 my-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-3 sm:p-4 text-white flex items-center justify-between gap-3 shadow-lg animate-fade-in">
          <div>
            <div className="text-xs font-semibold opacity-80 mb-0.5">🔥 {isRu ? 'Акция дня' : 'Deal of the day'}</div>
            <div className="font-bold text-lg">{isRu ? 'Кофе + десерт = 350 ₽' : 'Coffee + dessert = $4.5'}</div>
            <div className="text-xs opacity-75 mt-0.5">{isRu ? 'Только сегодня · осталось 4:23:11' : 'Today only · 4:23:11 left'}</div>
          </div>
          <button className="bg-white text-warning font-bold text-sm px-4 py-2 rounded-full shrink-0">
            {isRu ? 'Забрать' : 'Claim'}
          </button>
        </div>
      )}

      {sec >= 3 && (
        <div className="px-3 sm:px-4 py-4 sm:py-6 animate-fade-in">
          <h2 className="text-lg sm:text-xl font-bold text-warning mb-1">{isRu ? 'Наше меню' : 'Our menu'}</h2>
          <p className="text-stone-400 text-sm mb-4">{isRu ? 'Свежее каждый день' : 'Fresh every day'}</p>
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {(isRu ? ['☕ Кофе', '🍰 Выпечка', '🥗 Завтраки', '🧃 Напитки'] : ['☕ Coffee', '🍰 Pastry', '🥗 Breakfast', '🧃 Drinks']).map((cat, i) => (
              <button key={cat} className={`shrink-0 text-xs font-semibold px-3 py-2 rounded-full transition-colors ${i === 0 ? 'bg-warning text-white' : 'bg-warning text-warning border border-warning/30'}`}>
                {cat}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-3">
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
              <div key={item.name} className="bg-white rounded-2xl p-3 shadow-sm border border-warning/30 hover:shadow-md transition-shadow">
                <div className="text-2xl mb-2">{item.emoji}</div>
                <div className="font-semibold text-sm text-stone-800">{item.name}</div>
                <div className="text-xs text-stone-400 mb-2">{item.desc}</div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-warning">{item.price}</span>
                  <button className="bg-warning text-warning text-xs font-semibold px-3 py-1 rounded-full hover:bg-warning hover:text-white transition-colors">+</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sec >= 4 && (
        <div className="px-3 sm:px-4 py-4 sm:py-5 bg-warning/60 animate-fade-in">
          <h2 className="text-lg sm:text-xl font-bold text-warning mb-1">{isRu ? '⭐ Отзывы' : '⭐ Reviews'}</h2>
          <p className="text-stone-400 text-sm mb-4">4.9 / 5 · {isRu ? '1 200+ отзывов' : '1,200+ reviews'}</p>
          <div className="space-y-3">
            {(isRu ? [
              { name: 'Анна К.', text: 'Лучший капучино в городе! Атмосфера невероятная, приду снова.', stars: 5 },
              { name: 'Дмитрий', text: 'Заказывал онлайн — всё быстро и вкусно. Тирамису просто 🔥', stars: 5 },
            ] : [
              { name: 'Anna K.', text: 'Best cappuccino in the city! Amazing atmosphere, will come again.', stars: 5 },
              { name: 'David M.', text: 'Ordered online — fast and delicious. Tiramisu is 🔥', stars: 5 },
            ]).map(r => (
              <div key={r.name} className="bg-white rounded-2xl p-4 shadow-sm border border-warning/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-full bg-warning flex items-center justify-center text-sm font-bold text-warning">
                    {r.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-stone-800">{r.name}</div>
                    <div className="text-xs text-warning">{'★'.repeat(r.stars)}</div>
                  </div>
                </div>
                <p className="text-sm text-stone-600">{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {sec >= 5 && (
        <div className="px-3 sm:px-4 py-4 sm:py-5 animate-fade-in">
          <h2 className="text-lg sm:text-xl font-bold text-warning mb-4">{isRu ? '📍 Как нас найти' : '📍 Find us'}</h2>
          <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl p-4 mb-3">
            <div className="text-sm font-semibold text-warning mb-1">📍 {isRu ? 'ул. Кофейная, 12' : '12 Coffee Street'}</div>
            <div className="text-xs text-stone-500">{isRu ? 'Пн–Вс · 8:00–22:00' : 'Mon–Sun · 8am–10pm'}</div>
            <div className="text-xs text-stone-500">📞 +7 999 123-45-67</div>
          </div>
          <div className="rounded-2xl overflow-hidden border border-warning/30" style={{ height: '80px', background: 'linear-gradient(135deg,#fef3c7,#fed7aa)' }}>
            <div className="h-full flex items-center justify-center text-warning text-sm font-medium gap-2">
              🗺️ {isRu ? 'Открыть карту' : 'Open map'}
            </div>
          </div>
        </div>
      )}

      {sec >= 6 && (
        <div className="px-4 pb-6 animate-fade-in">
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-success/30 rounded-2xl p-4 text-center">
            <div className="text-2xl mb-2">🚀</div>
            <div className="font-bold text-success text-sm mb-1">
              {isRu ? 'Проект опубликован!' : 'Site published!'}
            </div>
            <div className="text-xs text-success font-mono">brewco.roboweb.dev</div>
          </div>
        </div>
      )}
    </div>
  );
}