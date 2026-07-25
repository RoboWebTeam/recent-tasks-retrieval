import { type Lang, setLang } from '@/lib/i18n';

interface Props {
  lang: Lang;
  dark?: boolean;
  onSwitch?: (l: Lang) => void; // без перезагрузки страницы
}

export default function LangSwitcher({ lang, dark = false, onSwitch }: Props) {
  const handleClick = (l: Lang) => {
    if (l === lang) return;
    if (onSwitch) {
      // Мгновенное переключение без reload
      setLang(l);
      onSwitch(l);
    } else {
      setLang(l); // с reload (для других страниц)
    }
  };

  return (
    <div role="group" aria-label={lang === 'ru' ? 'Язык интерфейса' : 'Interface language'} className={`flex items-center gap-0.5 rounded-lg p-0.5 ${dark ? 'bg-white/10' : 'bg-secondary'}`}>
      {(['ru', 'en'] as Lang[]).map(l => (
        <button
          key={l}
          onClick={() => handleClick(l)}
          aria-pressed={lang === l}
          aria-label={l === 'ru' ? 'Переключить на русский' : 'Switch to English'}
          className={`min-h-[32px] px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide transition-all ${
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