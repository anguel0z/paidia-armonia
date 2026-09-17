/**
 * Desktop shell — PC / wide aspect presentation helpers.
 */
(function () {
  'use strict';
  document.documentElement.dataset.shell = 'desk';
  window.__PAIDIA_SHELL__ = 'desk';

  function railWidth() {
    if (window.matchMedia('(max-width:900px)').matches) return '72px';
    if (window.matchMedia('(max-width:1100px)').matches) return '200px';
    return '220px';
  }

  function enhance() {
    document.body.classList.add('shell-desk', 'layout-desktop');
    document.body.classList.remove('layout-mobile');
    document.documentElement.style.setProperty('--rail-w', railWidth());
    if (!document.getElementById('shellSwitchMobile')) {
      const tools = document.getElementById('topCore') || document.getElementById('topTools');
      if (tools) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'shellSwitchMobile';
        btn.className = 'topbtn shell-switch';
        btn.textContent = 'Phone';
        btn.title = 'Mobile-Ansicht';
        btn.onclick = () => {
          if (window.PaidiaShell) {
            window.PaidiaShell.setOverride('m');
            window.PaidiaShell.go('m');
          }
        };
        tools.appendChild(btn);
      }
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enhance);
  else enhance();
  window.addEventListener('paidia:rendered', enhance);
  window.addEventListener('resize', enhance, { passive: true });
})();
