/**
 * Script síncrono injetado no topo do <body> para aplicar `data-theme`
 * no <html> ANTES do hydrate do React — evita flash de tema errado ao
 * carregar a página.
 *
 * Lê, em ordem de prioridade:
 *   1. localStorage.veritas-theme
 *   2. Cookie `veritas-theme` (útil em SSR futuramente)
 *   3. Default: 'system' (CSS @media prefers-color-scheme decide)
 */

const script = `(function(){try{var c=document.cookie.match(/(?:^|;\\s*)veritas-theme=([^;]+)/);var s=localStorage.getItem('veritas-theme')||(c&&c[1])||'system';if(s!=='light'&&s!=='dark'&&s!=='system')s='system';document.documentElement.setAttribute('data-theme',s);}catch(e){document.documentElement.setAttribute('data-theme','system');}})();`

export default function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />
}
