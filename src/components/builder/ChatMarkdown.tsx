import { type ReactNode } from 'react';

/**
 * Лёгкий безопасный markdown-рендерер для чата редактора — в стиле Claude Code.
 * Поддерживает: заголовки (##, ###), **жирный**, `инлайн-код`, [ссылки](url),
 * маркированные (- / • / *) и нумерованные (1.) списки, абзацы, эмодзи.
 * Никакого dangerouslySetInnerHTML — всё собирается из React-узлов (безопасно от XSS).
 * Единый размер текста 14px, обычное начертание — как во всём чате.
 */

// Разбирает инлайн-разметку строки: **жирный**, `код`, [ссылка](url).
function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('**')) {
      nodes.push(<strong key={key++} className="font-semibold text-foreground">{tok.slice(2, -2)}</strong>);
    } else if (tok.startsWith('`')) {
      nodes.push(
        <code key={key++} className="font-mono text-[13px] bg-secondary/80 border border-border/60 rounded px-1 py-[1px] text-foreground whitespace-nowrap">
          {tok.slice(1, -1)}
        </code>,
      );
    } else {
      const mm = /\[([^\]]+)\]\(([^)\s]+)\)/.exec(tok);
      if (mm) {
        nodes.push(
          <a key={key++} href={mm[2]} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2 hover:text-primary/80">
            {mm[1]}
          </a>,
        );
      } else {
        nodes.push(tok);
      }
    }
    last = re.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

type Block =
  | { type: 'h'; level: number; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] };

function parseBlocks(src: string): Block[] {
  const lines = src.replace(/\r/g, '').split('\n');
  const blocks: Block[] = [];
  let i = 0;
  const isSpecial = (l: string) => /^(#{1,3})\s+|^\s*[-*•]\s+|^\s*\d+\.\s+/.test(l);
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) { blocks.push({ type: 'h', level: h[1].length, text: h[2].trim() }); i++; continue; }
    if (/^\s*[-*•]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*•]\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*[-*•]\s+/, '')); i++; }
      blocks.push({ type: 'ul', items }); continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*\d+\.\s+/, '')); i++; }
      blocks.push({ type: 'ol', items }); continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !isSpecial(lines[i])) { para.push(lines[i].trim()); i++; }
    blocks.push({ type: 'p', text: para.join(' ') });
  }
  return blocks;
}

export default function ChatMarkdown({ text, className = '' }: { text: string; className?: string }) {
  const blocks = parseBlocks(text || '');
  return (
    <div className={`space-y-2.5 text-[14px] leading-[1.6] text-foreground ${className}`}>
      {blocks.map((b, idx) => {
        if (b.type === 'h') {
          return <p key={idx} className="text-[14px] font-semibold text-foreground pt-1 first:pt-0">{renderInline(b.text)}</p>;
        }
        if (b.type === 'ul') {
          return (
            <ul key={idx} className="space-y-0.5">
              {b.items.map((it, j) => (
                <li key={j} className="flex gap-1.5">
                  <span className="text-primary shrink-0 leading-[1.5]">•</span>
                  <span className="leading-[1.5]">{renderInline(it)}</span>
                </li>
              ))}
            </ul>
          );
        }
        if (b.type === 'ol') {
          return (
            <ol key={idx} className="space-y-0.5">
              {b.items.map((it, j) => (
                <li key={j} className="flex gap-1.5">
                  <span className="text-muted-foreground shrink-0 tabular-nums leading-[1.5]">{j + 1}.</span>
                  <span className="leading-[1.5]">{renderInline(it)}</span>
                </li>
              ))}
            </ol>
          );
        }
        return <p key={idx}>{renderInline(b.text)}</p>;
      })}
    </div>
  );
}
