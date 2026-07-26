import { useState } from 'react';
import Icon from '@/components/ui/icon';
import type { Lang } from '@/lib/i18n';
import { PRODUCT_TYPES, BUILDER_TEMPLATES, type ProductType } from './builderTemplates';

/** Витрина в области превью, пока проект ещё не собран.
 *
 *  Раньше здесь была почти пустая тёмная область с иконкой — самая большая часть экрана ничего
 *  не говорила о продукте. Теперь тут те же работы, что показаны в портфолио на лендинге, с
 *  настоящими мокапами: клиент видит, что редактор собирает не только страницы, и запускает
 *  любую из них одним кликом. */
export default function BuilderShowcase({
  lang, onPick, disabled,
}: {
  lang: Lang;
  onPick: (prompt: string, type: ProductType) => void;
  disabled?: boolean;
}) {
  const ru = lang === 'ru';
  const [filter, setFilter] = useState<ProductType | 'all'>('all');
  const items = BUILDER_TEMPLATES.filter(t => t.img && (filter === 'all' || t.type === filter));

  return (
    <div className="relative flex-1 overflow-y-auto">
      {/* Амбиентные пятна — та же атмосфера, что на главной */}
      <span aria-hidden className="pointer-events-none absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-primary/15 blur-3xl breathe" />
      <span aria-hidden className="pointer-events-none absolute top-40 right-8 h-64 w-64 rounded-full bg-[hsl(258,76%,64%)]/12 blur-3xl breathe" style={{ animationDelay: '2.5s' }} />

      <div className="relative mx-auto w-full max-w-5xl px-6 py-10">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
            <Icon name="Sparkles" size={11} />
            {ru ? 'Что умеет ваша команда' : 'What your team can build'}
          </span>
          <h2 className="font-display mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-foreground text-balance">
            {ru ? 'Не только сайты — рабочие продукты' : 'Not just sites — working products'}
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
            {ru
              ? 'Магазины с корзиной и заказами, порталы с кабинетами, панели с таблицами и доступами. Выберите пример — и команда соберёт такой же под вашу задачу.'
              : 'Stores with carts and orders, portals with user accounts, dashboards with tables and access control. Pick an example — the team will build the same for your case.'}
          </p>
        </div>

        {/* Фильтр по классу продукта */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5">
          {([
            { id: 'all' as const, label: ru ? 'Все' : 'All' },
            ...PRODUCT_TYPES.map(p => ({ id: p.id, label: ru ? p.label.ru : p.label.en })),
          ]).map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                filter === id
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                  : 'border border-border bg-card/60 text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((t, i) => (
            <button
              key={t.title.en}
              type="button"
              disabled={disabled}
              onClick={() => onPick(ru ? t.prompt.ru : t.prompt.en, t.type)}
              style={{ animationDelay: `${i * 55}ms` }}
              className="at-in lift group overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm transition-colors hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="relative block aspect-[16/10] overflow-hidden bg-secondary">
                <img
                  src={t.img}
                  alt=""
                  width={640}
                  height={400}
                  loading="lazy"
                  className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
                />
                {/* Затемнение снизу — чтобы подпись «Собрать такой» читалась на любой картинке */}
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <span className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-2 items-center justify-center gap-1.5 pb-3 text-xs font-semibold text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <Icon name="Sparkles" size={12} />
                  {ru ? 'Собрать такой' : 'Build this'}
                </span>
              </span>
              <span className="block p-3.5">
                <span className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-primary">
                  <Icon name={t.icon} fallback="Square" size={11} />
                  {ru
                    ? PRODUCT_TYPES.find(p => p.id === t.type)!.label.ru
                    : PRODUCT_TYPES.find(p => p.id === t.type)!.label.en}
                </span>
                <span className="font-display mt-1 block truncate text-[15px] font-bold text-foreground">
                  {ru ? t.title.ru : t.title.en}
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {ru ? t.sub.ru : t.sub.en}
                </span>
              </span>
            </button>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {ru
            ? 'Свою задачу опишите в чате слева — команда соберёт проект под неё.'
            : 'Describe your own job in the chat on the left — the team will build for it.'}
        </p>
      </div>
    </div>
  );
}
