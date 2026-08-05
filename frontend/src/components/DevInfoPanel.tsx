import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Extract React Fiber from a DOM node */
function getFiberFromElement(element: HTMLElement): any {
    const key = Object.keys(element).find((k) => k.startsWith('__reactFiber$'));
    return key ? (element as any)[key] : null;
}

/** Collect ALL function component names from the Fiber tree (unfiltered) */
function getAllComponentNames(fiberNode: any): string[] {
    const names: string[] = [];
    let node = fiberNode;
    while (node) {
        if (typeof node.type === 'function') {
            const name = node.type.displayName || node.type.name;
            if (name && name.length > 1) names.push(name);
        }
        node = node.return;
    }
    return names;
}

/** Find the nearest "real" component name — skip minified names and known wrappers */
function findBestComponentName(names: string[]): string {
    const skip = new Set([
        'ProtectedRoute', 'AdminRoute', 'HashRouter', 'BrowserRouter',
        'Router', 'Routes', 'Route', 'Navigate', 'Outlet', 'Toaster',
        'Modal', 'Dialog', 'Transition', 'Popover', 'Menu', 'Fragment',
        'Suspense', 'Provider', 'Consumer', 'ForwardRef', 'Memo',
    ]);
    for (const n of names) {
        if (n.length <= 2) continue;             // skip minified (e.g. C3, W2)
        if (/^[a-z]/.test(n)) continue;           // skip lowercase (html-like)
        if (skip.has(n)) continue;                // skip known wrappers
        return n;
    }
    return names[0] || '(desconhecido)';
}

// ─── URL-based page detection & Configs (Adjust for your project) ────────────

const ROUTE_TO_PAGE: Record<string, { page: string; file: string }> = {
    '/dashboard': { page: 'Dashboard', file: 'src/pages/Dashboard.tsx' },
    '/vehicles': { page: 'Vehicles', file: 'src/pages/Vehicles.tsx' },
    '/drivers': { page: 'Drivers', file: 'src/pages/Drivers.tsx' },
    '/tracking': { page: 'Tracking', file: 'src/pages/Tracking.tsx' },
    '/cargo': { page: 'Cargo', file: 'src/pages/Cargo.tsx' },
    '/reports': { page: 'Reports', file: 'src/pages/Reports.tsx' },
    '/settings': { page: 'Settings', file: 'src/pages/Settings.tsx' },
    '/login': { page: 'Login', file: 'src/pages/Login.tsx' },
    '/driver/dashboard': { page: 'DriverDashboard', file: 'src/pages/driver/DriverDashboard.tsx' },
};

// Map component names to their literal file paths
const COMPONENT_FILE_MAP: Record<string, string> = {
    MainLayout: 'src/components/layout/MainLayout.tsx',
    DriverLayout: 'src/components/layout/DriverLayout.tsx',
    Topbar: 'src/components/layout/Topbar.tsx',
    VehicleModal: 'src/components/vehicles/VehicleModal.tsx',
    DriverModal: 'src/components/drivers/DriverModal.tsx',
    RefuelingModal: 'src/components/driver/RefuelingModal.tsx',
};

function getCurrentPage(): { page: string; file: string } {
    const path = window.location.pathname || '/';
    const route = Object.keys(ROUTE_TO_PAGE).find((r) => path.startsWith(r));
    return route ? ROUTE_TO_PAGE[route] : { page: path, file: 'src/App.tsx' };
}

function getFileForComponent(name: string): string {
    return COMPONENT_FILE_MAP[name] || getCurrentPage().file;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DevInfoPanel() {
    const { user } = useAuthStore();
    const [inspectMode, setInspectMode] = useState(false);
    const [highlight, setHighlight] = useState<DOMRect | null>(null);
    const [tooltipInfo, setTooltipInfo] = useState<{ component: string; file: string; element: string } | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const [copied, setCopied] = useState(false);
    const currentTarget = useRef<HTMLElement | null>(null);

    // Ativa o modo de inspeção com Ctrl+Shift+F7
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'F7') {
                e.preventDefault();
                
                setInspectMode((prev) => {
                    if (prev) { setHighlight(null); setTooltipInfo(null); currentTarget.current = null; }
                    return !prev;
                });
            }
            if (e.key === 'Escape' && inspectMode) {
                setInspectMode(false);
                setHighlight(null);
                setTooltipInfo(null);
                currentTarget.current = null;
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [inspectMode, user]);

    // Bloqueia eventos nativos e copia a referência ao clicar
    useEffect(() => {
        if (!inspectMode) return;

        const blockEvent = (e: Event) => {
            if ((e.target as HTMLElement)?.closest?.('[data-devinfo-overlay]')) return;
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            if (e.type === 'click') {
                const el = currentTarget.current;
                if (!el) return;

                // Detecta o Componente a partir do React Fiber
                const fiber = getFiberFromElement(el);
                const allNames = fiber ? getAllComponentNames(fiber) : [];
                const componentName = findBestComponentName(allNames);

                // Detecta a página e arquivos
                const { page, file: pageFile } = getCurrentPage();
                const componentFile = getFileForComponent(componentName);

                const tag = el.tagName.toLowerCase();
                const elType = el.getAttribute('type');
                const elId = el.getAttribute('id');
                const elName = el.getAttribute('name');
                const placeholder = el.getAttribute('placeholder');
                const label = placeholder || el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent?.trim().slice(0, 40) || '';

                let desc = '';
                if (['input', 'textarea', 'select'].includes(tag)) desc = `Campo — "${label}"`;
                else if (tag === 'button') desc = `Botão — "${label}"`;
                else if (tag === 'a') desc = `Link — "${label}"`;
                else desc = `Elemento <${tag}> — "${label}"`;

                let attrs = `tag \`<${tag}>\``;
                if (elType) attrs += `, type="${elType}"`;
                if (elName) attrs += `, name="${elName}"`;
                if (elId) attrs += `, id="${elId}"`;

                const text = `No componente \`${componentName}\` (Página: \`${page}\`), preciso que você altere o seguinte elemento:
- Descrição visual: ${desc}
- Atributos técnicos: ${attrs}
- Arquivo do componente: \`${componentFile}\`
- Arquivo da página: \`${pageFile}\`

A alteração que eu quero fazer é: `;

                navigator.clipboard.writeText(text).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                });
            }
        };

        const events = ['click', 'mousedown', 'pointerdown', 'focusin', 'submit'];
        events.forEach((ev) => window.addEventListener(ev, blockEvent, true));
        return () => { events.forEach((ev) => window.removeEventListener(ev, blockEvent, true)); };
    }, [inspectMode]);

    // Rastreamento do mouse para destacar o elemento alvo em tela
    useEffect(() => {
        if (!inspectMode) return;

        const onMouseMove = (e: MouseEvent) => {
            const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
            if (!el || el.closest('[data-devinfo-overlay]')) { setHighlight(null); setTooltipInfo(null); return; }

            currentTarget.current = el;
            setHighlight(el.getBoundingClientRect());
            setTooltipPos({ x: e.clientX, y: e.clientY });

            const fiber = getFiberFromElement(el);
            const allNames = fiber ? getAllComponentNames(fiber) : [];
            const componentName = findBestComponentName(allNames);
            const componentFile = getFileForComponent(componentName);
            const tag = el.tagName.toLowerCase();
            const label = el.getAttribute('placeholder') || el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent?.trim().slice(0, 30) || '';

            let elementDesc = tag;
            const elType = el.getAttribute('type');
            if (elType) elementDesc += `[type="${elType}"]`;
            const elId = el.getAttribute('id');
            if (elId) elementDesc += `#${elId}`;

            setTooltipInfo({ component: componentName, file: componentFile, element: `<${elementDesc}> "${label}"` });
        };

        window.addEventListener('mousemove', onMouseMove, true);
        return () => window.removeEventListener('mousemove', onMouseMove, true);
    }, [inspectMode]);

    if (!inspectMode) return null;

    return (
        <>
            <style>{`* { cursor: crosshair !important; }`}</style>

            {highlight && (
                <div data-devinfo-overlay style={{
                    position: 'fixed', left: highlight.left - 2, top: highlight.top - 2,
                    width: highlight.width + 4, height: highlight.height + 4,
                    border: '2px solid #3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.08)',
                    borderRadius: 4, pointerEvents: 'none', zIndex: 99998, transition: 'all 0.05s ease-out',
                }} />
            )}

            {tooltipInfo && (
                <div data-devinfo-overlay style={{
                    position: 'fixed',
                    left: Math.min(tooltipPos.x + 14, window.innerWidth - 380),
                    top: Math.min(tooltipPos.y + 18, window.innerHeight - 110),
                    zIndex: 99999, background: '#0f172a', color: '#f1f5f9',
                    padding: '8px 12px', borderRadius: 8, fontSize: 12, fontFamily: 'monospace',
                    maxWidth: 360, pointerEvents: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', lineHeight: 1.5,
                }}>
                    <div style={{ fontWeight: 700, color: '#60a5fa', marginBottom: 2 }}>⚛ {tooltipInfo.component}</div>
                    <div style={{ color: '#94a3b8', fontSize: 10, marginBottom: 4 }}>📁 {tooltipInfo.file}</div>
                    <div style={{ color: '#e2e8f0' }}>{tooltipInfo.element}</div>
                </div>
            )}

            {copied && (
                <div data-devinfo-overlay style={{
                    position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
                    zIndex: 99999, background: '#16a34a', color: '#fff', padding: '10px 20px',
                    borderRadius: 10, fontSize: 13, fontWeight: 700, boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                }}>
                    ✓ Copiado para a área de transferência!
                </div>
            )}

            <div data-devinfo-overlay style={{
                position: 'fixed', top: 8, right: 8, zIndex: 99999, background: '#1e40af', color: '#fff',
                padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700, fontFamily: 'monospace',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)', opacity: 0.9,
            }}>
                Inspecionando React (Esc para sair)
            </div>
        </>
    );
}
