/**
 * Paidia shell router — auto-picks /m/ or /desk/ from device type.
 * Optional sticky override: localStorage paidia.shell = 'm' | 'desk'
 * (set only by the PC / Phone buttons).
 */
(function (global) {
  'use strict';

  const KEY = 'paidia.shell';
  const BOOT_KEY = 'paidia.bootSession';

  function override() {
    try {
      const v = String(localStorage.getItem(KEY) || '').toLowerCase();
      if (v === 'm' || v === 'mobile') return 'm';
      if (v === 'desk' || v === 'desktop' || v === 'pc') return 'desk';
    } catch (e) {}
    return null;
  }

  function setOverride(shell) {
    try {
      if (shell === 'm' || shell === 'desk') localStorage.setItem(KEY, shell);
      else localStorage.removeItem(KEY);
    } catch (e) {}
  }

  function clearOverride() {
    try { localStorage.removeItem(KEY); } catch (e) {}
  }

  /** Classify hardware/input — not just current window width. */
  function deviceKind() {
    const ua = String(navigator.userAgent || navigator.vendor || '');
    let coarse = false;
    let fine = false;
    let noHover = false;
    let wide = false;
    let narrow = false;
    try {
      coarse = window.matchMedia('(pointer:coarse)').matches;
      fine = window.matchMedia('(pointer:fine)').matches;
      noHover = window.matchMedia('(hover:none)').matches;
      wide = window.matchMedia('(min-width:1024px)').matches;
      narrow = window.matchMedia('(max-width:1023px)').matches;
    } catch (e) {}

    // Explicit phone UAs → mobile shell
    if (/iPhone|iPod|Windows Phone|IEMobile|BlackBerry|webOS/i.test(ua)) return 'phone';
    if (/Android/i.test(ua) && /Mobile/i.test(ua)) return 'phone';

    // Tablets → mobile shell (touch-first UI)
    if (/iPad/i.test(ua)) return 'tablet';
    if (/Android/i.test(ua) && !/Mobile/i.test(ua)) return 'tablet';
    if (/Tablet|Silk|Kindle/i.test(ua)) return 'tablet';
    // iPadOS 13+ may report as Mac — coarse/no-hover distinguishes
    if (/Macintosh/i.test(ua) && coarse && noHover && navigator.maxTouchPoints > 1) return 'tablet';

    // Touch-primary devices without desktop UA
    if (coarse && noHover && !fine) return wide ? 'tablet' : 'phone';

    // Desktop / laptop
    if (/Windows NT|CrOS|Linux x86_64|Linux amd64/i.test(ua) && !coarse) return 'desktop';
    if (/Macintosh/i.test(ua) && fine && !coarse) return 'desktop';
    if (fine && wide) return 'desktop';
    if (fine && !narrow && !coarse) return 'desktop';

    return wide ? 'desktop' : 'phone';
  }

  /** Device-based shell only (ignores sticky override). */
  function detectFromDevice() {
    return deviceKind() === 'desktop' ? 'desk' : 'm';
  }

  /** Shell for navigation: sticky override if set, else device type. */
  function detect() {
    const forced = override();
    if (forced) return forced;
    return detectFromDevice();
  }

  function pathFor(shell) {
    return shell === 'desk' ? '/desk/' : '/m/';
  }

  function currentShellFromPath() {
    const p = String(location.pathname || '');
    if (p === '/desk' || p.indexOf('/desk/') === 0) return 'desk';
    if (p === '/m' || p.indexOf('/m/') === 0) return 'm';
    return null;
  }

  function lock(shell) {
    const s = shell === 'desk' ? 'desk' : 'm';
    global.__PAIDIA_SHELL__ = s;
    try {
      document.documentElement.dataset.shell = s;
      document.body && document.body.setAttribute('data-shell', s);
      document.body && document.body.classList.add('shell-' + s, 'paidia-shell');
    } catch (e) {}
    return s;
  }

  function stashBootSession(data) {
    try {
      sessionStorage.setItem(BOOT_KEY, JSON.stringify(data == null ? null : data));
    } catch (e) {}
  }

  function takeBootSession() {
    try {
      const raw = sessionStorage.getItem(BOOT_KEY);
      sessionStorage.removeItem(BOOT_KEY);
      if (!raw || raw === 'null') return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function go(shell, { replace } = { replace: true }) {
    const s = shell === 'desk' ? 'desk' : 'm';
    const target = pathFor(s) + (location.search || '') + (location.hash || '');
    const here = currentShellFromPath();
    if (here === s) {
      lock(s);
      return false;
    }
    global.dispatchEvent(new Event('paidia:shell-switch'));
    if (replace) location.replace(target);
    else location.assign(target);
    return true;
  }

  function routeAfterAuth(bootData) {
    if (bootData) stashBootSession(bootData);
    let intended=null;
    try{intended=sessionStorage.getItem('paidia.intendedDestination');sessionStorage.removeItem('paidia.intendedDestination');}catch{}
    if(intended&&/^\/(desk|m)\/(?:[?#]|$)/.test(intended)){location.replace(intended);return true;}
    const s = detect();
    lock(s);
    return go(s, { replace: true });
  }

  /**
   * If this page's shell does not match the device (and no manual override),
   * jump to the correct site immediately.
   */
  function autoCorrectToDevice() {
    const forced = override();
    const here = currentShellFromPath();
    if (here) lock(here);
    // Explicit override (PC/Phone button) wins — stay put.
    if (forced) return false;
    // On a shell URL that disagrees with hardware, bounce.
    if (here) {
      const want = detectFromDevice();
      if (here !== want) return go(want, { replace: true });
      return false;
    }
    return false;
  }

  function ensureOnShellPage() {
    const here = currentShellFromPath();
    if (here) {
      lock(here);
      return here;
    }
    return null;
  }

  global.PaidiaShell = {
    KEY,
    detect,
    detectFromDevice,
    deviceKind,
    override,
    setOverride,
    clearOverride,
    pathFor,
    currentShellFromPath,
    lock,
    go,
    routeAfterAuth,
    autoCorrectToDevice,
    stashBootSession,
    takeBootSession,
    ensureOnShellPage,
  };
})(typeof window !== 'undefined' ? window : globalThis);
