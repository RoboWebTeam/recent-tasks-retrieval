import {defineConfig} from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import {componentTagger} from "pp-tagger";

// DDoS Guard требует двусторонний app-level keepalive чаще 30s.
// Сервер: text-frame {type:'ping'} каждые 5-9s (рандом — чтобы DDoS Guard
// не триггерился на одинаковые интервалы; Vite-клиент игнорирует, case "ping": break;).
// Клиент: server.hmr.timeout = 7000 ниже понижает pingInterval @vite/client до 7s.
const hmrKeepalive = {
    name: 'hmr-ws-keepalive',
    configureServer(server: any) {
        let timer: ReturnType<typeof setTimeout> | null = null;
        const tick = () => {
            server.ws?.send({type: 'ping'});
            timer = setTimeout(tick, 5000 + Math.floor(Math.random() * 4000));
        };
        timer = setTimeout(tick, 5000 + Math.floor(Math.random() * 4000));
        server.httpServer?.on('close', () => {
            if (timer) clearTimeout(timer);
        });
    },
};

// https://vitejs.dev/config/
export default defineConfig(({mode}) => ({
    plugins: [
        react(),
        hmrKeepalive,
        mode === 'development' &&
        componentTagger(),
    ].filter(Boolean),
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        host: '0.0.0.0',
        // По умолчанию 5173; можно переопределить через PORT (нужно для авто-порта дев-инструментов,
        // если 5173 занят). На прод-сборку не влияет — она отдаётся через nginx.
        port: Number(process.env.PORT) || 5173,
        allowedHosts: true,
        // Локальная разработка: проксируем запросы фронта /api/* на backend (deploy/server.py
        // на :8000), чтобы вход, генерация и SSE-стриминг работали end-to-end без CORS.
        // В проде этим занимается nginx (см. deploy/nginx.conf); в браузере адреса те же /api/*.
        proxy: {
            '/api': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
        },
        hmr: {
            overlay: false, // Disables the error overlay if you only want console errors
            timeout: 7000, // pingInterval @vite/client — нужен <30s для DDoS Guard
        }
    },
}));
