import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		screens: {
			'xs': '480px',
			'sm': '640px',
			'md': '768px',
			'lg': '1024px',
			'xl': '1280px',
			'2xl': '1536px',
		},
		container: {
			center: true,
			padding: {
				DEFAULT: '1rem',
				sm: '1.5rem',
				lg: '2rem'
			},
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			// ──────────────────────────────────────────────────────────────────
			//  ШКАЛЫ ДИЗАЙН-СИСТЕМЫ
			//  Раньше ни одна из них не была задана — проект брал умолчания
			//  Tailwind. Из-за этого «произвольное значение» вроде text-[11px]
			//  было не нарушением, а единственным способом получить нужный
			//  размер. Теперь шкалы объявлены явно и ими можно пользоваться.
			// ──────────────────────────────────────────────────────────────────

			// Отступы: сетка 4px. Все отступы (p/m/gap/space) переведены на неё —
			// 441 место в волне 2. Полушаги 0.5/1.5/2.5/3.5 остались в шкале, но
			// уже НЕ как шаг отступа, а для двух других задач:
			//   • размеры мелких элементов (h-1.5 у точки-индикатора, w-3.5 у иконки);
			//   • оптическая подгонка (mt-0.5 у иконки рядом с текстом, -top-0.5
			//     у счётчика на кнопке) — это поправка на глаз, а не шаг сетки,
			//     и загонять её в 4px значит разъехать вёрстку, а не выровнять её.
			spacing: {
				px: '1px',
				0: '0px',
				1: '4px',   2: '8px',   3: '12px',  4: '16px',
				5: '20px',  6: '24px',  7: '28px',  8: '32px',
				9: '36px',  10: '40px', 11: '44px', 12: '48px',
				// 13 нет в стандартной шкале Tailwind: класс sm:h-13 в проекте
				// не работал НИКОГДА — высота просто не применялась.
				13: '52px',
				14: '56px', 16: '64px', 20: '80px', 24: '96px',
				28: '112px', 32: '128px', 40: '160px', 44: '176px',
				48: '192px', 52: '208px', 56: '224px', 60: '240px',
				64: '256px', 72: '288px', 80: '320px',
				/** @deprecated вне сетки 4px — переносится в волне 2 */
				0.5: '2px',
				/** @deprecated вне сетки 4px — переносится в волне 2 */
				1.5: '6px',
				/** @deprecated вне сетки 4px — переносится в волне 2 */
				2.5: '10px',
				/** @deprecated вне сетки 4px — переносится в волне 2 */
				3.5: '14px',
			},

			// Типографика. Целевая шкала из задания — 12/14/16/20/24/32/40.
			// ВАЖНО про порядок работ: в проекте 12 живых имён размеров, а в шкале
			// 7 ступеней. Натянуть 12 имён на 7 ступеней можно только сдвинув всю
			// лестницу вверх — я попробовал, и на тарифах заголовок разъехался на
			// три строки, утащив карточки за первый экран. Поэтому шкала заводится
			// здесь как СПРАВОЧНИК (ступени 20/24/32/40 уже на месте), значения имён
			// пока сохраняют нынешний вид, а в волне 2 разметка переезжает на
			// канонические имена — и только после этого лишние имена уходят.
			// Межстрочный интервал привязан к размеру, отдельный leading-* не нужен.
			fontSize: {
				// Ступени ниже основной шкалы — микро-подписи, для которых 12px велик:
				// счётчики в кружках 14-16px и подписи осей графиков. Две ступени вместо
				// шести произвольных значений (8/9/10/10.5/11/11.5px), что были раньше.
				'3xs': ['10px', { lineHeight: '12px' }],
				'2xs': ['11px', { lineHeight: '16px' }],
				xs:    ['12px', { lineHeight: '16px' }],   // ступень шкалы
				sm:    ['14px', { lineHeight: '20px' }],   // ступень шкалы
				base:  ['16px', { lineHeight: '24px' }],   // ступень шкалы
				/** @deprecated не на шкале — в волне 2 переедет на text-xl (20px) */
				lg:    ['18px', { lineHeight: '28px' }],
				xl:    ['20px', { lineHeight: '28px' }],   // ступень шкалы
				'2xl': ['24px', { lineHeight: '32px' }],   // ступень шкалы
				/** @deprecated не на шкале — в волне 2 переедет на text-3xl (32px) */
				'3xl': ['30px', { lineHeight: '36px' }],
				'4xl': ['32px', { lineHeight: '40px' }],   // ступень шкалы (было 36px)
				'5xl': ['40px', { lineHeight: '48px' }],   // ступень шкалы (было 48px)
				// Витринные размеры — только герой лендинга, вне основной шкалы.
				'6xl': ['60px', { lineHeight: '1.05' }],
				'7xl': ['72px', { lineHeight: '1.02' }],
				'8xl': ['96px', { lineHeight: '1' }],
			},

			// Радиусы: всё от одной базы --radius, чтобы профиль мог менять
			// геометрию продукта одной переменной.
			borderRadius: {
				none: '0px',
				// DEFAULT обязателен: без него перестают работать голый `rounded`
				// и частичные `rounded-t` / `rounded-bl` — а их в проекте 15.
				DEFAULT: 'calc(var(--radius) - 2px)',
				sm:  'calc(var(--radius) - 4px)',
				md:  'calc(var(--radius) - 2px)',
				lg:  'var(--radius)',
				xl:  'calc(var(--radius) + 4px)',
				'2xl': 'calc(var(--radius) + 8px)',
				'3xl': 'calc(var(--radius) + 16px)',
				full: '9999px',
			},

			// Тени: три ступени подъёма. xl/2xl оставлены до волны 3 — на них
			// завязаны модалки и выпадающие списки.
			boxShadow: {
				sm: '0 1px 2px 0 hsl(var(--shadow-color) / 0.06), 0 1px 3px 0 hsl(var(--shadow-color) / 0.05)',
				md: '0 2px 4px -1px hsl(var(--shadow-color) / 0.08), 0 4px 12px -2px hsl(var(--shadow-color) / 0.08)',
				lg: '0 8px 16px -4px hsl(var(--shadow-color) / 0.10), 0 20px 40px -8px hsl(var(--shadow-color) / 0.12)',
				/** @deprecated сверх трёх ступеней — оверлеи переедут на lg в волне 3 */
				xl: '0 12px 24px -8px hsl(var(--shadow-color) / 0.12), 0 32px 64px -12px hsl(var(--shadow-color) / 0.16)',
				/** @deprecated сверх трёх ступеней — оверлеи переедут на lg в волне 3 */
				'2xl': '0 16px 32px -12px hsl(var(--shadow-color) / 0.14), 0 48px 96px -16px hsl(var(--shadow-color) / 0.20)',
				none: 'none',
			},

			// Слои. Именованная шкала вместо «пробьюсь числом побольше»: до неё в
			// проекте сосуществовали z-50, z-[60], z-[100], z-[200] и z-[9999].
			//
			// ВАЖНО про порядок sticky и dropdown. В распространённой схеме sticky
			// ставят ВЫШЕ выпадающих списков (1100 против 1000). Здесь так нельзя:
			// выпадающее меню пользователя открывается из липкой шапки, а Radix
			// выносит его порталом в body — то есть оно становится соседом шапки,
			// а не её потомком. При sticky > dropdown меню уезжает ПОД шапку.
			// Поэтому липкое — ниже выпадающего.
			zIndex: {
				behind:   '-10',   // декоративный фон под содержимым
				base:     '0',
				raised:   '10',    // приподнятый элемент внутри секции
				sticky:   '900',   // липкие шапки, нижняя панель, кнопка чата
				dropdown: '1000',  // выпадающие меню, селекты, поповеры
				overlay:  '1200',  // затемняющая подложка модального окна
				modal:    '1300',  // само модальное окно
				tooltip:  '1350',  // подсказка обязана быть видна и поверх модалки
				toast:    '1400',  // уведомления и ссылка «перейти к содержимому»
				shield:   '1500',  // прозрачный щит на время перетаскивания
			},

			transitionDuration: {
				fast: '120ms',
				base: '200ms',
				slow: '320ms',
			},
			transitionTimingFunction: {
				out: 'cubic-bezier(.22, 1, .36, 1)',
			},
			fontFamily: {
				// Переменная стоит первой, чтобы дизайн-профиль мог подменить
				// шрифт. Пока профиль не выбран, она пуста и берётся Unbounded/Inter.
				display: ['var(--font-display)', 'Unbounded', 'Inter', 'system-ui', 'sans-serif'],
				sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'fade-in': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				'scale-in': {
					'0%': { opacity: '0', transform: 'scale(0.95)' },
					'100%': { opacity: '1', transform: 'scale(1)' }
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-18px)' }
				},
				'glow': {
					'0%, 100%': { opacity: '0.9' },
					'50%': { opacity: '1' }
				},
				'blink': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0' }
				},
				'slide-up': {
					'0%': { opacity: '0', transform: 'translateY(12px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'pulse-ring': {
					'0%': { transform: 'scale(1)', opacity: '0.8' },
					'100%': { transform: 'scale(1.6)', opacity: '0' }
				},
				'marquee': {
					'0%': { transform: 'translateX(0%)' },
					'100%': { transform: 'translateX(-50%)' }
				},
				'bounce-x': {
					'0%, 100%': { transform: 'translateX(0)' },
					'50%': { transform: 'translateX(6px)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.7s ease-out forwards',
				'scale-in': 'scale-in 0.5s ease-out forwards',
				'float': 'float 5s ease-in-out infinite',
				'glow': 'glow 3s ease-in-out infinite',
				'slide-up': 'slide-up 0.6s ease-out forwards',
				'pulse-ring': 'pulse-ring 1.5s ease-out infinite',
				'marquee': 'marquee 22s linear infinite',
				'bounce-x': 'bounce-x 1s ease-in-out infinite',
				'blink': 'blink 1s step-end infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;