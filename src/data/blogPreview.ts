import type { Loc } from './blog';

// Лёгкое превью для блока «Блог» на лендинге — без тяжёлого контента статей,
// чтобы полный blog.ts не попадал в главный бандл. Держать синхронно с blog.ts (первые 3).
export interface ArticlePreview {
  slug: string;
  cover: string;
  category: Loc;
  title: Loc;
  description: Loc;
  date: Loc;
  readTime: Loc;
}

export const BLOG_PREVIEW: ArticlePreview[] = [
  {
    "slug": "kak-opisat-produkt-dlya-ii-komandy",
    "cover": "https://roboweb.dev/demo/ai-landing.jpg",
    "category": {
      "ru": "Запуск продукта",
      "en": "Product launch"
    },
    "title": {
      "ru": "Как описать продукт для ИИ-команды: бриф из пяти блоков",
      "en": "How to Brief an AI Dev Team: Five Parts of a Good Product Description"
    },
    "description": {
      "ru": "Бриф для ИИ-команды из пяти блоков: задача, пользователи, действия, данные и тип продукта. Слабая и сильная формулировка и что проверить в первом превью.",
      "en": "A five-part brief for an AI dev team: goal, users, actions, data and product type. Includes a weak vs strong example and a first-preview checklist."
    },
    "date": {
      "ru": "16 сентября 2026",
      "en": "September 16, 2026"
    },
    "readTime": {
      "ru": "7 мин",
      "en": "7 min"
    }
  },
  {
    "slug": "zapret-vhoda-cherez-inostrannye-servisy-199-fz",
    "cover": "https://s3-nl.hostkey.com/robo/demo/119fb9a0-189b-42d4-b25a-50d014970fd6.jpg",
    "category": {
      "ru": "Право и требования",
      "en": "Law & compliance"
    },
    "title": {
      "ru": "Запрет входа через Google и Telegram: что меняет 199-ФЗ",
      "en": "Russia Bans Sign-In via Foreign Services: What Law 199-FZ Changes"
    },
    "description": {
      "ru": "С 7 июля 2026 года по 199-ФЗ штрафуют за доступ после авторизации через иностранные сервисы. Разрешённые способы входа, штрафы и самоаудит проекта.",
      "en": "Since July 7, 2026, Russia's Law 199-FZ fines granting access after sign-in via foreign services. Allowed methods, fines and a quick self-audit."
    },
    "date": {
      "ru": "16 сентября 2026",
      "en": "September 16, 2026"
    },
    "readTime": {
      "ru": "7 мин",
      "en": "6 min"
    }
  },
  {
    "slug": "iz-chego-skladyvaetsya-stoimost-razrabotki",
    "cover": "https://roboweb.dev/demo/fintech.jpg",
    "category": {
      "ru": "Бизнес и ROI",
      "en": "Business & ROI"
    },
    "title": {
      "ru": "Из чего складывается стоимость разработки веб-продукта",
      "en": "What Really Drives the Cost of Building a Web Product"
    },
    "description": {
      "ru": "Из каких работ состоит цена веб-продукта, что сильнее всего её двигает, какие расходы не видны в смете и как ИИ-сборка меняет структуру затрат.",
      "en": "The work behind a web product's price, the decisions that move it most, costs a quote leaves out, and how AI-assisted building changes the math."
    },
    "date": {
      "ru": "16 сентября 2026",
      "en": "September 16, 2026"
    },
    "readTime": {
      "ru": "7 мин",
      "en": "6 min"
    }
  }
];
