import { type Lang, setLang } from '@/lib/i18n';

interface Props {
  lang: Lang;
  dark?: boolean;
}

export default function LangSwitcher({ lang, dark = false }: Props) {
  return (
    <div className={`flex items-center gap-0.5 rounded-lg p-0.5 ${dark ? 'bg-white/10' : 'bg-secondary'}`}>
      {(['ru', 'en'] as Lang[]).map(l => (
        <button
          key={l}
          onClick={() => l !== lang && setLang(l)}
          className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide transition-all ${
            lang === l
              ? dark
                ? 'bg-white text-black'
                : 'bg-primary text-primary-foreground shadow-sm'
              : dark
                ? 'text-white/60 hover:text-white'
                : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
