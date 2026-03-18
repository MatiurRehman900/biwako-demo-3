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
  const SUPPORTED_LANGS = ['en', 'ru', 'ja'];

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
    const path = `data/i18n/${lang}.json`;
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
  }

  function setHtmlLang(lang) {
    document.documentElement.lang = lang;
  }

  function setDropdownLabel(lang, translations) {
    const btn = document.getElementById('langDropdownButton');
    if (!btn) return;
    const label = translations['lang.label'] || 'Language';
    const nameKey = `lang.${lang === 'en' ? 'english' : lang === 'ru' ? 'russian' : 'japanese'}`;
    const name = translations[nameKey] || lang;
    btn.textContent = `${label}: ${name}`;
  }

  function initDropdown(lang, translations) {
    const menu = document.querySelectorAll('.lang-select');
    menu.forEach((item) => {
      item.addEventListener('click', (event) => {
        event.preventDefault();
        const selected = item.getAttribute('data-lang');
        if (!selected || !SUPPORTED_LANGS.includes(selected)) return;
        if (selected === lang) return;
        saveLang(selected);
        const url = new URL(window.location.href);
        url.searchParams.set('lang', selected);
        window.location.href = url.toString();
      });
    });
  }

  async function init() {
    const lang = getInitialLang();
    setHtmlLang(lang);
    const messages = await loadMessages(lang);
    applyTranslations(messages);
    setDropdownLabel(lang, messages);
    initDropdown(lang, messages);
    window.__SITE_LANG = lang;
    window.__I18N_MESSAGES = messages;
    document.dispatchEvent(new Event('i18nReady'));
  }

  document.addEventListener('DOMContentLoaded', init);
})();
