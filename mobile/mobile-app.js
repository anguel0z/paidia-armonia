/**
 * Mobile shell — phone/tablet only presentation helpers.
 * Layout authority: mobile/m-ui.css (+ mobile.css for chrome/dock).
 */
(function () {
  'use strict';
  document.documentElement.dataset.shell = 'm';
  window.__PAIDIA_SHELL__ = 'm';

  function enhance() {
    document.body.classList.add('shell-m', 'layout-mobile', 'paidia-shell');
    document.body.classList.remove('layout-desktop');
    document.body.setAttribute('data-shell', 'm');
    /* Switch-to-PC control in header tools if missing */
    if (!document.getElementById('shellSwitchPc')) {
      const tools = document.getElementById('topTools');
      if (tools) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'shellSwitchPc';
        btn.className = 'topbtn shell-switch';
        btn.textContent = 'PC';
        btn.title = 'Desktop-Ansicht';
        btn.onclick = () => {
          if (window.PaidiaShell) {
            window.PaidiaShell.setOverride('desk');
            window.PaidiaShell.go('desk');
          }
        };
        tools.appendChild(btn);
      }
    }
    // Staff dock: Home / Plan / Lager / Liste / Mehr (hide secondary from primary row)
    document.querySelectorAll('nav.dock[data-staff-dock] button[data-tab]').forEach((b) => {
      const tab = b.dataset.tab;
      if (['gallery', 'talk', 'book', 'kids', 'pocket', 'personnel', 'school', 'rules', 'admin'].includes(tab)) {
        b.classList.add('dock-secondary');
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enhance);
  else enhance();
  window.addEventListener('paidia:rendered', enhance);

  // Device mismatch: phone must stay on /m/ unless user forced PC.
  try {
    if (window.PaidiaShell && typeof window.PaidiaShell.autoCorrectToDevice === 'function') {
      window.PaidiaShell.autoCorrectToDevice();
    }
  } catch (e) {}
})();
