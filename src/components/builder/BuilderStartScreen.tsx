import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { RoboMark } from '@/components/Logo';
import type { Lang } from '@/lib/i18n';
import { PRODUCT_TYPES, BUILDER_TEMPLATES, type ProductType } from './builderTemplates';

/** Стартовый экран редактора — первое, что видит клиент в пустом проекте.
 *
 *  Раньше здесь было одно приветственное сообщение, поэтому редактор читался как «чат для
 *  сайтика»: люди писали «сайт для кофейни» и никогда не узнавали, что тут же собирается
 *  магазин с корзиной, портал с кабинетом или рабочая панель с таблицами. Экран построен в
 *  дизайн-языке лендинга (Unbounded в заголовках, индиго-градиент, стекло, свечение) и на тех
 *  же бизнес-задачах, что показаны в портфолио, — обещание с лендинга и то, что человек видит
 *  внутри, должны совпадать. */
export default function BuilderStartScreen({
  lang, productType, onProductType, onPick, disabled,
}: {
  lang: Lang;
  productType: ProductType | '';
  onProductType: (t: ProductType | '') => void;
  onPick: (prompt: string, type: ProductType) => void;
  disabled?: boolean;
}) {
  const ru = lang === 'ru';
  // По умолчанию открыта та же категория, что выбрана типом проекта — экран сразу показывает
  // примеры именно того класса продукта, который человек собирается делать.
  const [tab, setTab] = useState<ProductType>(productType || 'store');
  const templates = BUILDER_TEMPLATES.filter(t => t.type === tab);

  return (
    <div className="pt-1 pb-2">
      {/* Обещание — то же, что на лендинге: команда разработки, которая не спит */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.09] via-transparent to-[hsl(258,76%,64%)]/[0.09] px-4 py-4">
        <span
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full bg-primary/25 blur-3xl breathe"
        />
        <div className="relative flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-[hsl(258,76%,64%)] text-white shadow-lg shadow-primary/30">
            <RoboMark size={19} className="text-white [&_path]:fill-current [&_rect]:fill-current" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-[15px] font-bold leading-snug text-foreground">
              {ru ? 'Ваша команда разработки на связи' : 'Your dev team is online'}
            </h2>
            <p className="mt-1 text-[13px] leading-[1.55] text-muted-foreground">
              {ru
                ? 'Опишите задачу — и агенты соберут её параллельно: дизайн, вёрстку, базу данных, аккаунты и серверную логику. Не только лендинг: магазин с корзиной, портал с кабинетом, рабочая панель с таблицами.'
                : 'Describe the job — agents build it in parallel: design, markup, database, accounts and server logic. Not just a landing: a store with a cart, a portal with accounts, a working dashboard with tables.'}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              {(ru
                ? ['Работает 24/7', 'Код ваш', 'Реальная база данных']
                : ['Runs 24/7', 'You own the code', 'Real database']
              ).map(chip => (
                <span
                  key={chip}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-background/70 px-2 py-0.5 text-[10.5px] font-semibold text-muted-foreground"
                >
                  <Icon name="Check" size={10} className="text-primary" />
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Что собираем — выбор класса продукта. Он реально меняет генерацию:
          включает многоэкранность, корзину, аккаунты и таблицы данных. */}
      <p className="mt-5 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {ru ? 'Что собираем' : 'What are we building'}
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        {PRODUCT_TYPES.map(p => {
          const active = productType === p.id;
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={active}
              onClick={() => { onProductType(active ? '' : p.id); setTab(p.id); }}
              className={`lift group rounded-xl border p-2.5 text-left transition-colors ${
                active
                  ? 'border-primary bg-primary/10 shadow-sm shadow-primary/20'
                  : 'border-border bg-secondary/50 hover:border-primary/40 hover:bg-secondary'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span
                  className={`ico grid h-6 w-6 shrink-0 place-items-center rounded-lg transition-colors ${
                    active ? 'bg-primary text-primary-foreground' : 'bg-background text-primary'
                  }`}
                >
                  <Icon name={p.icon} fallback="Square" size={12} />
                </span>
                <span className="font-display text-[12.5px] font-bold leading-tight text-foreground">
                  {ru ? p.label.ru : p.label.en}
                </span>
              </span>
              <span className="mt-1 block text-[11px] leading-snug text-muted-foreground">
                {ru ? p.hint.ru : p.hint.en}
              </span>
            </button>
          );
        })}
      </div>

      {/* Примеры — те же бизнес-решения, что в портфолио на лендинге. Клик = сразу сборка. */}
      <div className="mt-5 mb-2 flex items-baseline justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {ru ? 'Готовые примеры' : 'Ready examples'}
        </p>
        <span className="text-[10.5px] text-muted-foreground">
          {ru ? 'клик — и собираем' : 'click to build'}
        </span>
      </div>

      <div className="mb-2 flex gap-1 overflow-x-auto no-scrollbar">
        {PRODUCT_TYPES.map(p => (
          <button
            key={p.id}
            type="button"
            onClick={() => setTab(p.id)}
            className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[11.5px] font-semibold transition-colors ${
              tab === p.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            {ru ? p.label.ru : p.label.en}
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        {templates.map((t, i) => (
          <button
            key={t.title.en}
            type="button"
            disabled={disabled}
            onClick={() => onPick(ru ? t.prompt.ru : t.prompt.en, t.type)}
            style={{ animationDelay: `${i * 45}ms` }}
            className="at-in glow-hover group flex w-full items-center gap-2.5 rounded-xl border border-border bg-secondary/50 px-2.5 py-2.5 text-left transition-colors hover:border-primary/50 hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary/15 to-[hsl(258,76%,64%)]/15 text-primary">
              <Icon name={t.icon} fallback="Square" size={14} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12.5px] font-semibold text-foreground">
                {ru ? t.title.ru : t.title.en}
              </span>
              <span className="block truncate text-[11px] text-muted-foreground">
                {ru ? t.sub.ru : t.sub.en}
              </span>
            </span>
            <Icon
              name="ArrowRight"
              size={14}
              className="shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
            />
          </button>
        ))}
      </div>

      <p className="mt-3 text-center text-[11px] text-muted-foreground">
        {ru
          ? 'Или просто опишите свой проект в поле ниже — своими словами.'
          : 'Or just describe your own project in the field below — in your own words.'}
      </p>
    </div>
  );
}
