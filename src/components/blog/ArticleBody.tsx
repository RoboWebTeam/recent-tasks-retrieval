import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

/** Текст статьи блога из упрощённой разметки.
 *
 *  Прежний разбор шёл построчно и молча терял половину разметки: таблицы выбрасывал целиком,
 *  ссылки `[текст](адрес)` показывал как есть, жирный внутри пунктов списка выводил звёздочками,
 *  а пункты рисовал отдельными `<li>` без `<ul>`. Главное для поиска — в блоге не было ни одной
 *  перелинковки: ссылка на соседнюю статью или на тарифы просто не могла отобразиться.
 *
 *  Поддерживается: `## `, `### `, абзацы, `- ` и `1. ` списки, `> ` цитаты, таблицы `| a | b |`,
 *  внутри строк — `**жирный**`, `*курсив*`, `[текст](/путь)` и `[текст](https://…)`. */

const INLINE_SRC = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)\s]+)\)/.source;

function inline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  // Своё выражение на каждый вызов: у глобального RegExp общий lastIndex, и вложенный вызов
  // (ссылка внутри жирного) сбрасывал его внешнему циклу — страница зависала навсегда.
  const re = new RegExp(INLINE_SRC, 'g');
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const key = `${m.index}`;
    if (m[1] !== undefined) {
      parts.push(<strong key={key} className="font-semibold text-foreground">{inline(m[1])}</strong>);
    } else if (m[2] !== undefined) {
      parts.push(<em key={key}>{m[2]}</em>);
    } else {
      const [label, href] = [m[3], m[4]];
      const cls = 'font-medium text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary';
      // Внутренние ссылки — через роутер: переход без перезагрузки, а в пререндере это обычный <a href>.
      parts.push(
        href.startsWith('/')
          ? <Link key={key} to={href} className={cls}>{label}</Link>
          : <a key={key} href={href} target="_blank" rel="noopener noreferrer" className={cls}>{label}</a>,
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

const cells = (row: string) => row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
const isTableSeparator = (row: string) => /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/.test(row.trim());

export default function ArticleBody({ content }: { content: string }) {
  const lines = content.split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;

  const collect = (test: (l: string) => boolean) => {
    const out: string[] = [];
    while (i < lines.length && test(lines[i])) out.push(lines[i++]);
    return out;
  };

  while (i < lines.length) {
    const line = lines[i];
    const key = blocks.length;

    if (line.trim() === '') { i++; continue; }

    if (line.startsWith('### ')) {
      blocks.push(<h3 key={key} className="mt-8 mb-2 font-display font-bold text-lg sm:text-xl break-words">{inline(line.slice(4))}</h3>);
      i++; continue;
    }
    if (line.startsWith('## ')) {
      blocks.push(<h2 key={key} className="mt-10 mb-3 font-display font-bold text-xl sm:text-2xl md:text-3xl tracking-tight break-words">{inline(line.slice(3))}</h2>);
      i++; continue;
    }

    if (line.startsWith('- ')) {
      const items = collect(l => l.startsWith('- '));
      blocks.push(
        <ul key={key} className="mt-4 ml-5 list-disc space-y-2 text-muted-foreground marker:text-primary/60">
          {items.map((it, j) => <li key={j} className="pl-1 leading-relaxed break-words">{inline(it.slice(2))}</li>)}
        </ul>,
      );
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      const items = collect(l => /^\d+\.\s/.test(l));
      blocks.push(
        <ol key={key} className="mt-4 ml-5 list-decimal space-y-2 text-muted-foreground marker:font-semibold marker:text-primary">
          {items.map((it, j) => <li key={j} className="pl-1 leading-relaxed break-words">{inline(it.replace(/^\d+\.\s/, ''))}</li>)}
        </ol>,
      );
      continue;
    }

    if (line.startsWith('> ')) {
      const quote = collect(l => l.startsWith('> ')).map(l => l.slice(2));
      blocks.push(
        <blockquote key={key} className="mt-6 rounded-r-xl border-l-4 border-primary/50 bg-primary/5 px-5 py-4 text-foreground leading-relaxed break-words">
          {quote.map((q, j) => <p key={j} className={j ? 'mt-2' : ''}>{inline(q)}</p>)}
        </blockquote>,
      );
      continue;
    }

    if (line.trim().startsWith('|')) {
      const rows = collect(l => l.trim().startsWith('|'));
      const hasHead = rows.length > 1 && isTableSeparator(rows[1]);
      const head = hasHead ? cells(rows[0]) : null;
      const body = (hasHead ? rows.slice(2) : rows).filter(r => !isTableSeparator(r)).map(cells);
      blocks.push(
        <div key={key} className="mt-6 overflow-x-auto rounded-2xl border border-border">
          {/* У статьи общий word-break: break-word — в узкой ячейке он рвёт слово посередине
              («Тестировани е»). В таблице переносим по слогам, а если не влезает — прокрутка. */}
          <table className="w-full min-w-[32rem] border-collapse text-sm break-normal hyphens-auto">
            {head && (
              <thead className="bg-secondary/60">
                <tr>{head.map((h, j) => <th key={j} className="px-4 py-3 text-left font-semibold text-foreground">{inline(h)}</th>)}</tr>
              </thead>
            )}
            <tbody>
              {body.map((r, j) => (
                <tr key={j} className="border-t border-border">
                  {r.map((c, k) => <td key={k} className="px-4 py-3 align-top text-muted-foreground">{inline(c)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    // Строка целиком жирная — подзаголовок-акцент, как в первых статьях блога.
    if (/^\*\*[^*]+\*\*$/.test(line.trim())) {
      blocks.push(<p key={key} className="mt-6 font-semibold text-foreground break-words">{line.trim().slice(2, -2)}</p>);
      i++; continue;
    }

    blocks.push(<p key={key} className="mt-4 text-muted-foreground leading-relaxed break-words">{inline(line)}</p>);
    i++;
  }

  return <>{blocks}</>;
}
