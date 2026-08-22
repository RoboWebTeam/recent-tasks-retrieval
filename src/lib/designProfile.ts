/**
 * Переключатель дизайн-профиля · Roboweb
 *
 * Копия общего набора ~/Downloads/design-lab/kit/profile-switch.js
 * с типами под TS. Правки — сначала в наборе, потом сюда.
 *
 * Ванильный, без зависимостей — подключается в любой проект
 * (React, Next, статика). Панель показывается только по
 * ?design=1 и живёт вне дерева приложения.
 *
 *   import { initProfiles } from "./profile-switch.js";
 *   initProfiles();                       // все восемь
 *   initProfiles(["pult", "bumaga"]);     // только нужные
 */

export type ProfileId =
  | "kabinet" | "pult" | "shtab" | "kartoteka"
  | "myagkiy" | "bumaga" | "tablo" | "tseh";

type Profile = { id: ProfileId; name: string; hint: string; fonts?: string };

export const PROFILES: Profile[] = [
  { id: "kabinet",   name: "Кабинет",     hint: "как сейчас · строка 44px" },
  { id: "pult",      name: "Пульт",       hint: "строка 32px · без скруглений",
    fonts: "family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600" },
  { id: "shtab",     name: "Штаб",        hint: "терминал · предельная плотность",
    fonts: "family=IBM+Plex+Mono:wght@400;500;600" },
  { id: "kartoteka", name: "Картотека",   hint: "воздух · только линии",
    fonts: "family=Commissioner:wght@400;500;600;700" },
  { id: "myagkiy",   name: "Мягкий свет", hint: "карточки · крупный радиус",
    fonts: "family=Onest:wght@400;500;600;700" },
  { id: "bumaga",    name: "Бумага",      hint: "документ · сериф",
    fonts: "family=Spectral:wght@400;600&family=Onest:wght@400;500;600" },
  { id: "tablo",     name: "Табло",       hint: "крупные числа · плитки",
    fonts: "family=Unbounded:wght@400;600&family=Onest:wght@400;500;600" },
  { id: "tseh",      name: "Ночной цех",  hint: "тёплая темнота · сигнальный",
    fonts: "family=Oswald:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500" },
];

const KEY = "rw-design-profile";
const loaded = new Set();

/** Шрифты профиля тянутся только при выборе — прод за них не платит. */
function ensureFonts(spec?: string) {
  if (!spec || loaded.has(spec)) return;
  loaded.add(spec);
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = `https://fonts.googleapis.com/css2?${spec}&display=swap`;
  document.head.appendChild(l);
}

export function applyProfile(id: ProfileId) {
  const p = PROFILES.find((x) => x.id === id) || PROFILES[0];
  ensureFonts(p.fonts);
  if (p.id === "kabinet") delete document.documentElement.dataset.profile;
  else document.documentElement.dataset.profile = p.id;
  try { localStorage.setItem(KEY, p.id); } catch { /* приватный режим */ }
}

export function savedProfile(): ProfileId {
  try {
    const v = localStorage.getItem(KEY);
    if (PROFILES.some((p) => p.id === v)) return v as ProfileId;
  } catch { /* нет доступа к хранилищу */ }
  return "kabinet";
}

export function initProfiles(only?: ProfileId[]) {
  const list = only ? PROFILES.filter((p) => only.includes(p.id)) : PROFILES;
  const current = savedProfile();

  // Выбранный профиль применяется всегда — иначе он слетал бы
  // при каждой перезагрузке без ?design=1 в адресе.
  if (current !== "kabinet") applyProfile(current);
  if (new URLSearchParams(location.search).get("design") !== "1") return;

  const bar = document.createElement("div");
  bar.setAttribute("role", "group");
  bar.setAttribute("aria-label", "Дизайн-профиль");
  bar.style.cssText =
    "position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:99999;" +
    "display:flex;gap:4px;padding:5px;border-radius:10px;background:rgba(14,18,24,.94);" +
    "box-shadow:0 8px 30px -8px rgba(0,0,0,.6);backdrop-filter:blur(8px);" +
    "font-family:system-ui,sans-serif;max-width:calc(100vw - 24px);overflow-x:auto";

  const paint = () => {
    const active = savedProfile();
    bar.querySelectorAll("button").forEach((b) => {
      const on = b.dataset.id === active;
      b.setAttribute("aria-pressed", String(on));
      b.style.background = on ? "#fff" : "transparent";
      b.style.color = on ? "#0e1218" : "#c9d6e2";
    });
  };

  list.forEach((p) => {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.id = p.id;
    b.title = p.hint;
    b.textContent = p.name;
    b.style.cssText =
      "border:0;border-radius:7px;padding:7px 12px;cursor:pointer;font-family:inherit;" +
      "font-size:13px;font-weight:600;line-height:1.2;white-space:nowrap;transition:background .12s";
    b.addEventListener("click", () => { applyProfile(p.id); paint(); });
    bar.appendChild(b);
  });

  document.body.appendChild(bar);
  paint();
}
