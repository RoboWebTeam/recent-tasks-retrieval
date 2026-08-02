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
    "slug": "pochemu-ai-luchshe-frilanserov",
    "cover": "https://s3-nl.hostkey.com/robo/demo/119fb9a0-189b-42d4-b25a-50d014970fd6.jpg",
    "category": {
      "ru": "Бизнес и ROI",
      "en": "Business & ROI"
    },
    "title": {
      "ru": "ИИ-команда против фрилансеров: экономика для бизнеса",
      "en": "AI Team vs Freelancers: The Business Case for Owners"
    },
    "description": {
      "ru": "Разбираем, почему ИИ-команда RoboWeb обходится бизнесу дешевле и быстрее фрилансеров, а код остаётся вашим активом.",
      "en": "Why an AI team ships faster and cheaper than freelancers, with fixed pricing and code that stays your own asset."
    },
    "date": {
      "ru": "10 июня 2026",
      "en": "June 10, 2026"
    },
    "readTime": {
      "ru": "5 мин",
      "en": "5 min"
    }
  },
  {
    "slug": "kak-sozdat-sajt-za-5-minut",
    "cover": "https://s3-nl.hostkey.com/robo/demo/08ca2384-7d8f-4aec-826e-e0d57ef5fc9e.jpg",
    "category": {
      "ru": "Запуск продукта",
      "en": "Product launch"
    },
    "title": {
      "ru": "От идеи до рабочего продукта за день: пошагово",
      "en": "From Idea to a Working Product in a Day: Step by Step"
    },
    "description": {
      "ru": "Пошаговый разбор, как за день запустить продукт с бэкендом и базой, опубликовать его и забрать код в свой репозиторий.",
      "en": "A step-by-step look at launching a product with a backend and database in a day, publishing it, and owning the code."
    },
    "date": {
      "ru": "12 июня 2026",
      "en": "June 12, 2026"
    },
    "readTime": {
      "ru": "4 мин",
      "en": "4 min"
    }
  },
  {
    "slug": "preimushchestva-ai-sajtov",
    "cover": "https://s3-nl.hostkey.com/robo/demo/9cc14c55-085e-48e2-9ae1-6623505e8aa2.jpg",
    "category": {
      "ru": "Бизнес и ROI",
      "en": "Business & ROI"
    },
    "title": {
      "ru": "7 деловых выгод фуллстек-продукта на ИИ",
      "en": "7 Business Wins of an AI-Built Full-Stack Product"
    },
    "description": {
      "ru": "Скорость запуска, экономика без штата разработчиков, владение кодом как активом и контроль над данными — разбираем по пунктам.",
      "en": "Launch speed, no dev payroll, code you own as an asset, and full control over your data — broken down point by point."
    },
    "date": {
      "ru": "14 июня 2026",
      "en": "June 14, 2026"
    },
    "readTime": {
      "ru": "6 мин",
      "en": "6 min"
    }
  }
];
