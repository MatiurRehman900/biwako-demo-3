/*
  Simple client-side i18n integration for the static site.
  - Uses JSON translation files stored under /data/i18n/{lang}.json
  - Adds support for <span data-i18n="key"></span> and attributes via data-i18n-attr
  - Persists selection in localStorage (key: "site_lang")
  - Works with server-side navigation (multi-page site)
*/

;(function () {
  const STORAGE_KEY = 'site_lang';
  const DEFAULT_LANG = 'en';
  const SUPPORTED_LANGS = ['en', 'ru'/*, 'ja'*/];

  function getSavedLang() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED_LANGS.includes(saved)) return saved;
    } catch (e) {
      // ignore
    }
    return null;
  }

  function saveLang(lang) {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      // ignore
    }
  }

  function getLangFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const lang = params.get('lang');
    if (lang && SUPPORTED_LANGS.includes(lang)) return lang;
    return null;
  }

  function getInitialLang() {
    const urlLang = getLangFromUrl();
    if (urlLang) return urlLang;
    const saved = getSavedLang();
    if (saved) return saved;
    const browser = (navigator.language || navigator.userLanguage || '').slice(0, 2);
    if (SUPPORTED_LANGS.includes(browser)) return browser;
    return DEFAULT_LANG;
  }

  function isSameOrigin(url) {
    try {
      const parsed = new URL(url, window.location.href);
      return parsed.origin === window.location.origin;
    } catch (e) {
      return false;
    }
  }

  async function loadMessages(lang) {
    const depth = window.location.pathname.split('/').filter(Boolean).length;
    const prefix = depth > 1 ? '../'.repeat(depth - 1) : '';
    const path = `${prefix}data/i18n/${lang}.json`;
    try {
      const res = await fetch(path, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Failed to load ${path}`);
      return res.json();
    } catch (err) {
      console.error('[i18n] Could not load translations', err);
      return {};
    }
  }

  function applyText(el, value) {
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.value = value;
      return;
    }
    el.textContent = value;
  }

  function applyTranslations(translations) {
    const nodes = document.querySelectorAll('[data-i18n]');
    nodes.forEach((node) => {
      const key = node.getAttribute('data-i18n');
      if (!key) return;
      const value = translations[key];
      if (typeof value === 'undefined') return;
      const attr = node.getAttribute('data-i18n-attr');
      if (attr) {
        const parts = attr.split(',').map((p) => p.trim()).filter(Boolean);
        parts.forEach((part) => {
          if (part === 'text') {
            applyText(node, value);
          } else {
            node.setAttribute(part, value);
          }
        });
      } else {
        applyText(node, value);
      }
    });

    const htmlNodes = document.querySelectorAll('[data-i18n-html]');
    htmlNodes.forEach((node) => {
      const key = node.getAttribute('data-i18n-html');
      if (!key) return;
      const value = translations[key];
      if (typeof value === 'undefined') return;
      node.innerHTML = value;
    });
  }

  function setHtmlLang(lang) {
    document.documentElement.lang = lang;
  }

  const LANG_META = {
    en: { flag: 'gb', label: 'English' },
    ru: { flag: 'ru', label: 'Русский' },
    // ja: { flag: 'jp', label: '日本語' },
  };

  function buildLangPicker(lang) {
    const container = document.getElementById('languageSelect');
    if (!container) return;

    function switchLang(selected) {
      if (!SUPPORTED_LANGS.includes(selected) || selected === lang) return;
      saveLang(selected);
      const url = new URL(window.location.href);
      url.searchParams.set('lang', selected);
      window.location.href = url.toString();
    }

    const { flag, label } = LANG_META[lang];
    container.innerHTML = `
      <div class="lang-picker">
        <button type="button" class="lang-picker-btn" aria-haspopup="listbox" aria-expanded="false">
          <span class="flag-icon flag-icon-${flag}"></span>
          <span class="lang-picker-label">${label}</span>
          <span class="lang-picker-arrow">&#9660;</span>
        </button>
      </div>`;

    const menu = document.createElement('ul');
    menu.className = 'lang-picker-menu';
    menu.setAttribute('role', 'listbox');
    menu.innerHTML = SUPPORTED_LANGS.map(l => `
      <li class="lang-picker-item${l === lang ? ' active' : ''}" data-lang="${l}" role="option">
        <span class="flag-icon flag-icon-${LANG_META[l].flag}"></span>
        <span>${LANG_META[l].label}</span>
      </li>`).join('');
    document.body.appendChild(menu);

    const btn = container.querySelector('.lang-picker-btn');

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = btn.getAttribute('aria-expanded') === 'true';
      if (!open) {
        const rect = btn.getBoundingClientRect();
        menu.style.top = (rect.bottom + 4) + 'px';
        menu.style.right = (window.innerWidth - rect.right) + 'px';
      }
      btn.setAttribute('aria-expanded', String(!open));
      menu.classList.toggle('open', !open);
    });

    menu.querySelectorAll('.lang-picker-item').forEach(item => {
      item.addEventListener('click', () => switchLang(item.dataset.lang));
    });

    document.addEventListener('click', () => {
      btn.setAttribute('aria-expanded', 'false');
      menu.classList.remove('open');
    });
  }

  async function init() {
    const lang = getInitialLang();
    setHtmlLang(lang);
    const messages = await loadMessages(lang);
    applyTranslations(messages);
    buildLangPicker(lang);
    window.__SITE_LANG = lang;
    window.__I18N_MESSAGES = messages;
    document.dispatchEvent(new Event('i18nReady'));
  }

  document.addEventListener('DOMContentLoaded', init);
})();
