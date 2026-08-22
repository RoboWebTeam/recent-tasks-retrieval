import * as React from 'react';
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
// Дизайн-профили: ядро студии + адаптер под Tailwind-токены проекта.
import './styles/design-profiles.css'
import './styles/profile-adapter.css'
import { initProfiles } from './lib/designProfile'

// Профиль ставится до рендера — иначе на первом кадре мелькает прежняя геометрия.
initProfiles();

createRoot(document.getElementById("root")!).render(<App />);