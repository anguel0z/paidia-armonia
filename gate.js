/* Instant login shell — runs before the heavy app so PIN entry always works. */
(function () {
  const STAFF = [
    { id: 'e1', name: 'Dora', role: 'Betreuerin', color: '#9bc4b0' },
    { id: 'e2', name: 'Karin', role: 'Betreuerin', color: '#7a9eaa' },
    { id: 'e3', name: 'Dimitris', role: 'Betreuer', color: '#c5ddd0' },
    { id: 'e4', name: 'Angelos', role: 'Betreuer', color: '#a8c5b8' },
    { id: 'e5', name: 'Claudio', role: 'Betreuer', color: '#8fb0a0' },
    { id: 'e6', name: 'Löhri', role: 'Betreuer', color: '#d4c4a0' },
    { id: 'e7', name: 'Amalia', role: 'Betreuerin', color: '#b8c9a8' },
    { id: 'e8', name: 'Zoi', role: 'Leitung', color: '#2f5a63' },
  ];
  const CHILDREN = [
    { id: 'k1', name: 'Simon', color: '#9bc4b0' },
    { id: 'k2', name: 'Kai', color: '#7a9eaa' },
    { id: 'k3', name: 'Vincent', color: '#c5ddd0' },
    { id: 'k4', name: 'Julian klein', color: '#a8c5b8' },
    { id: 'k5', name: 'Julian groß', color: '#8fb0a0' },
    { id: 'k6', name: 'Lea', color: '#d4c4a0' },
    { id: 'k7', name: 'Valeria', color: '#b8c9a8' },
    { id: 'k8', name: 'Jule', color: '#6b9a88' },
    { id: 'k9', name: 'Samantha', color: '#5a8a7a' },
    { id: 'k10', name: 'Lilly', color: '#7a9eaa' },
    { id: 'k11', name: 'Zoitsa', color: '#c48a1a' },
    { id: 'k12', name: 'Leonie', color: '#2f5a63' },
  ];

  const gate = document.getElementById('gate');
  const body = document.getElementById('gateBody');
  if (!gate || !body) return;

  let lang = localStorage.getItem('paidia.lang') || 'de';
  let bootSettled = false;
  // Fallback for the first paint, before build.json lands. Keep in step with
  // build.json on every release — it is what shows if the fetch fails.
  const APP_BUILD = {
    version: 175,
    label: 'v175',
    changed: {
      de: 'Lager + Zo-Ai Design-Polish (Fokus, Chips, Senden klar)',
      el: 'Αποθήκη + Zo-Ai polish (focus, chips, καθαρό Αποστολή)',
    },
  };
  const SW_BUILD_KEY = 'paidia.swBuild';
  const BUILD_RELOAD_KEY = 'paidia.buildReload';

  function fetchTimeout(resource, options, ms) {
    const controller = new AbortController();
    const kill = setTimeout(() => controller.abort(), ms);
    return fetch(resource, Object.assign({}, options || {}, { signal: controller.signal }))
      .finally(() => clearTimeout(kill));
  }

  function withDeadline(promise, ms) {
    return Promise.race([
      promise,
      new Promise((resolve) => setTimeout(resolve, ms)),
    ]);
  }

  // A long-lived installed PWA can still start from an older HTML shell. Check
  // the tiny network manifest before booting, clear only Paidia caches, and do
  // one cache-busted navigation. The session marker prevents reload loops.
  // Hard timeout: a hung build.json fetch must never block login forever.
  async function refreshStaleShell() {
    try {
      const response = await fetchTimeout('build.json?boot=' + Date.now(), { cache: 'no-store' }, 2500);
      const remote = response.ok ? await response.json() : null;
      if (!remote || !Number.isFinite(Number(remote.version)) || Number(remote.version) === Number(APP_BUILD.version)) return false;
      const target = String(remote.version);
      if ('caches' in window) {
        await withDeadline((async () => {
          const keys = await caches.keys();
          await Promise.all(keys.filter((key) => key.startsWith('paidia-v')).map((key) => caches.delete(key)));
        })(), 1500);
      }
      if (sessionStorage.getItem(BUILD_RELOAD_KEY) !== target) {
        sessionStorage.setItem(BUILD_RELOAD_KEY, target);
        const url = new URL(location.href);
        url.searchParams.set('release', target);
        location.replace(url.href);
        return true;
      }
      Object.assign(APP_BUILD, remote);
    } catch (error) {
      /* Offline / timed-out boot continues from the installed shell. */
    }
    return false;
  }

  // Drop caches belonging to older builds. Deliberately does NOT unregister the
  // service worker and does NOT reload: unregistering forced a re-register on
  // the next paint, which fired `updatefound`, which reloaded, which
  // re-registered — the loop that made the app reload on top of itself.
  // Versioned ?v= URLs already guarantee a release is picked up.
  async function purgeStaleShell() {
    const target = String(APP_BUILD.version);
    let stored = '';
    try { stored = localStorage.getItem(SW_BUILD_KEY) || ''; } catch (e) {}
    if (stored === target) return false;
    try {
      if ('caches' in window) {
        await withDeadline((async () => {
          const keys = await caches.keys();
          await Promise.all(
            keys.filter((k) => k !== 'paidia-v' + target).map((k) => caches.delete(k))
          );
        })(), 1500);
      }
      localStorage.setItem(SW_BUILD_KEY, target);
    } catch (e) {}
    return false;
  }

  async function ensureServiceWorker() {
    if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
    try {
      const reg = await navigator.serviceWorker.register('./sw.js?v=' + APP_BUILD.version, { scope: './' });
      if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      // Hand over to the new worker, but never reload the page for it. The next
      // navigation picks up the new build via its ?v= URL, and reloading here is
      // what produced the loop.
      reg.addEventListener('updatefound', () => {
        const worker = reg.installing;
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed') worker.postMessage({ type: 'SKIP_WAITING' });
        });
      });
    } catch (e) {}
  }
  const copy = {
    de: {
      brand: 'Gemeinsam durch den Tag',
      title: 'Armonia Thassos',
      who: 'Wer bist du?',
      staff: 'Personal',
      staffSub: 'Team-Anmeldung',
      child: 'Kinder',
      childSub: 'Kinder-Anmeldung',
      childInstall: 'App aufs Handy: iPhone → Teilen → Zum Home-Bildschirm · Android → Menü → App installieren',
      pick: 'Profil wählen',
      pin: 'PIN eingeben',
      login: 'Anmelden',
      back: '← Zurück',
      pinFallback: 'Oder PIN',
      bioFace: 'Face ID',
      bioFinger: 'Fingerabdruck',
      bioPasskey: 'Biometrie',
      bioHint: 'Schnelle Anmeldung auf diesem Gerät',
      bioFail: 'Biometrie fehlgeschlagen — PIN nutzen',
      bioUnavailable: 'Biometrie hier nicht verfügbar (HTTPS + Face ID / Fingerabdruck nötig)',
      bioSetupNeeded: 'Zuerst mit PIN anmelden, dann unter Profil Face ID einrichten',
      wrong: 'Falsche PIN',
      locked: (m) => `Gesperrt · noch ${m} Min.`,
      attempts: (n) => `Noch ${n} Versuche`,
      unavailable: 'Anmeldung nicht möglich',
      loading: 'Anmelden…',
      hint: 'PIN tippen oder die 6 Ziffern antippen.',
      forgot: 'PIN vergessen?',
      resetTitle: 'PIN per E-Mail ändern',
      resetSub: 'Wir senden einen einmaligen Link an deine hinterlegte Adresse.',
      email: 'E-Mail-Adresse',
      sendLink: 'Link senden',
      linkSent: 'Wenn die E-Mail zu diesem Profil gehört, wurde ein Link gesendet. Prüfe auch Spam.',
      newPin: 'Neue PIN (4–6 Ziffern)',
      confirmPin: 'PIN bestätigen',
      changePin: 'PIN speichern',
      pinChanged: 'PIN geändert — bitte neu anmelden.',
      invalidReset: 'Link ungültig oder PINs stimmen nicht.',
      needEmail: 'Bitte E-Mail eingeben.',
      storageFail: 'PIN konnte nicht gespeichert werden. Bitte Admin informieren.',
      resetUnavailable: 'E-Mail-Reset ist nicht eingerichtet. Bitte Admin fragen — PIN ändern geht nach Login unter Profil.',
      resetAskAdmin: 'E-Mail-Reset ist nicht eingerichtet. Ein Admin kann dir nach der Anmeldung unter Profil → PIN helfen, oder der E-Mail-Versand muss eingerichtet werden.',
      resetNeedProfileEmail: 'Nutze die E-Mail, die für dieses Profil gespeichert ist.',
      resetBackPin: '← Zurück zur PIN',
      rememberMe: 'Angemeldet bleiben',
      otherPerson: 'Andere Person',
      loadingBoot: 'Laden…',
    },
    el: {
      brand: 'Μαζί μέσα στην ημέρα',
      title: 'Armonia Thassos',
      who: 'Ποιος/ποια είσαι;',
      staff: 'Προσωπικό',
      staffSub: 'Είσοδος ομάδας',
      child: 'Παιδιά',
      childSub: 'Είσοδος παιδιών',
      childInstall: 'App στο κινητό: iPhone → Κοινή χρήση → Στην οθόνη Αφετηρίας · Android → Μενού → Εγκατάσταση εφαρμογής',
      pick: 'Επίλεξε προφίλ',
      pin: 'Βάλε PIN',
      login: 'Είσοδος',
      back: '← Πίσω',
      pinFallback: 'Ή PIN',
      bioFace: 'Face ID',
      bioFinger: 'Δακτυλικό αποτύπωμα',
      bioPasskey: 'Βιομετρικά',
      bioHint: 'Γρήγορη είσοδος σε αυτή τη συσκευή',
      bioFail: 'Αποτυχία βιομετρικών — χρησιμοποίησε PIN',
      bioUnavailable: 'Τα βιομετρικά δεν είναι διαθέσιμα (HTTPS + Face ID / δακτυλικό)',
      bioSetupNeeded: 'Πρώτα είσοδος με PIN, μετά Face ID από το Προφίλ',
      wrong: 'Λάθος PIN',
      locked: (m) => `Κλείδωμα · ακόμη ${m} λεπτά`,
      attempts: (n) => `Ακόμη ${n} προσπάθειες`,
      unavailable: 'Η είσοδος δεν είναι διαθέσιμη',
      loading: 'Σύνδεση…',
      hint: 'Πληκτρολόγησε ή πάτα τα 6 ψηφία.',
      forgot: 'Ξέχασες το PIN;',
      resetTitle: 'Αλλαγή PIN με email',
      resetSub: 'Στέλνουμε μοναδικό σύνδεσμο στο email του προφίλ.',
      email: 'Διεύθυνση email',
      sendLink: 'Αποστολή συνδέσμου',
      linkSent: 'Αν το email ανήκει σε αυτό το προφίλ, στάλθηκε σύνδεσμος. Έλεγξε και τα ανεπιθύμητα.',
      newPin: 'Νέο PIN (4–6 ψηφία)',
      confirmPin: 'Επιβεβαίωση PIN',
      changePin: 'Αποθήκευση PIN',
      pinChanged: 'Το PIN άλλαξε — συνδέσου ξανά.',
      invalidReset: 'Άκυρος σύνδεσμος ή τα PIN δεν ταιριάζουν.',
      needEmail: 'Βάλε το email.',
      storageFail: 'Το PIN δεν αποθηκεύτηκε. Ενημέρωσε τον admin.',
      resetUnavailable: 'Η αλλαγή PIN με email δεν είναι ρυθμισμένη. Ρώτα admin — μετά τη σύνδεση αλλάζει από Προφίλ → PIN.',
      resetAskAdmin: 'Η αλλαγή PIN με email δεν είναι ρυθμισμένη. Ένας admin μπορεί να βοηθήσει μετά τη σύνδεση στο Προφίλ → PIN, ή πρέπει να ρυθμιστεί η αποστολή email.',
      resetNeedProfileEmail: 'Χρησιμοποίησε το email που είναι αποθηκευμένο σε αυτό το προφίλ.',
      resetBackPin: '← Πίσω στο PIN',
      rememberMe: 'Να με θυμάσαι',
      otherPerson: 'Άλλο άτομο',
      loadingBoot: 'Φόρτωση…',
    },
  };
  const t = (key) => copy[lang][key];
  const esc = (value) => String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  const safeColor = (value) => /^#[0-9a-fA-F]{3,8}$/.test(String(value || '')) ? String(value) : '#94a3b8';
  const initials = (name) => String(name || '?').split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase();

  const LAST_MODE_KEY = 'paidia.lastMode';
  const LAST_PROFILE_KEY = 'paidia.lastProfileId';
  const REMEMBER_KEY = 'paidia.rememberMe';
  const DEVICE_KEY = 'paidia.device';

  function gateDeviceId() {
    try {
      let id = localStorage.getItem(DEVICE_KEY);
      if (!id || !/^dev-[A-Za-z0-9_-]{4,48}$/.test(id)) {
        id = 'dev-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
        localStorage.setItem(DEVICE_KEY, id);
      }
      return id;
    } catch (e) { return ''; }
  }

  function readLastProfile() {
    try {
      const mode = localStorage.getItem(LAST_MODE_KEY);
      const id = localStorage.getItem(LAST_PROFILE_KEY);
      if (!mode || !id) return null;
      const list = mode === 'child' ? CHILDREN : STAFF;
      const who = list.find((p) => p.id === id);
      return who ? { who, mode } : null;
    } catch (e) { return null; }
  }
  function writeLastProfile(mode, profileId) {
    try {
      localStorage.setItem(LAST_MODE_KEY, mode);
      localStorage.setItem(LAST_PROFILE_KEY, profileId);
    } catch (e) {}
  }
  function clearLastProfile() {
    try {
      localStorage.removeItem(LAST_MODE_KEY);
      localStorage.removeItem(LAST_PROFILE_KEY);
    } catch (e) {}
  }
  function rememberChecked() {
    try { return localStorage.getItem(REMEMBER_KEY) === '1'; } catch (e) { return false; }
  }
  function setRememberChecked(on) {
    try { localStorage.setItem(REMEMBER_KEY, on ? '1' : '0'); } catch (e) {}
  }
  function preloadApp() {
    if (document.querySelector('link[data-paidia-preload], script[data-paidia-app]')) return;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'script';
    link.href = 'app.js?v=' + APP_BUILD.version;
    link.dataset.paidiaPreload = '1';
    document.head.appendChild(link);
  }

  function loadApp() {
    window.__paidiaAuthed = true;
    if (document.querySelector('script[data-paidia-app]')) return;
    if (!document.querySelector('script[data-paidia-page-tips]')) {
      const tips = document.createElement('script');
      tips.src = 'page-tips.js?v=' + APP_BUILD.version;
      tips.dataset.paidiaPageTips = '1';
      document.body.appendChild(tips);
    }
    if (!document.querySelector('script[data-paidia-zoai-tips]')) {
      const ztips = document.createElement('script');
      ztips.src = 'zoai-tips.js?v=' + APP_BUILD.version;
      ztips.dataset.paidiaZoaiTips = '1';
      document.body.appendChild(ztips);
    }
    const script = document.createElement('script');
    script.src = 'app.js?v=' + APP_BUILD.version;
    script.defer = true;
    script.dataset.paidiaApp = '1';
    script.onerror = () => {
      window.__paidiaAuthed = false;
      bootSettled = false;
      const last = readLastProfile();
      if (last) renderPin(last.who, last.mode);
      else renderEntrance();
      const status = body.querySelector('.gate-status, #bootStatus');
      if (status) {
        status.textContent = lang === 'el' ? 'Φόρτωση απέτυχε — δοκίμασε ξανά' : 'Laden fehlgeschlagen — bitte neu versuchen';
      }
    };
    document.body.appendChild(script);
  }

  function langSwitch() {
    return `<div class="gate-lang">
      <button type="button" class="${lang === 'de' ? 'on' : ''}" data-l="de">Deutsch</button>
      <button type="button" class="${lang === 'el' ? 'on' : ''}" data-l="el">Ελληνικά</button>
    </div>`;
  }

  function wireLang() {
    body.querySelectorAll('.gate-lang button').forEach((button) => {
      button.onclick = () => {
        lang = button.dataset.l;
        localStorage.setItem('paidia.lang', lang);
        document.documentElement.lang = lang;
        renderEntrance();
      };
    });
  }

  function gateBuildHtml() {
    const note = (APP_BUILD.changed && (APP_BUILD.changed[lang] || APP_BUILD.changed.de)) || '';
    return `<div class="gate-build" role="status"><b>${esc(APP_BUILD.label)}</b><span>${esc(note)}</span></div>`;
  }

  function gateLandmarkHtml() {
    return `<aside class="gate-landmark" aria-hidden="true">
      <div class="gate-landmark-top"><span class="gate-landmark-mark">A</span><span>Armonia Thassos</span></div>
      <div class="gate-landmark-message"><small>THASSOS · GREECE</small><strong>${esc(t('brand'))}</strong></div>
      <div class="gate-landmark-line"></div>
    </aside>`;
  }

  function paintGate(view, content) {
    body.dataset.gateView = view;
    body.innerHTML = `${gateLandmarkHtml()}<main class="gate-main">${content}</main>`;
  }

  function renderEntrance() {
    paintGate('entrance', `
      ${langSwitch()}
      <div class="gate-head">
        <div class="mark" aria-hidden="true">A</div>
        <div class="brand-kicker">${t('brand')}</div>
        <h2>${t('title')}</h2>
        <p>${t('who')}</p>
      </div>
      <div class="profiles" style="grid-template-columns:1fr">
        <button class="profile gate-mode-card" type="button" data-mode="staff">
          <div class="pa gate-mode-icon" aria-hidden="true"><svg class="ui-ico"><use href="#u-person"/></svg></div>
          <div class="gate-mode-copy"><div class="pn">${t('staff')}</div><div class="pr">${t('staffSub')}</div></div>
          <span class="gate-mode-arrow" aria-hidden="true">→</span>
        </button>
        <button class="profile gate-mode-card" type="button" data-mode="child">
          <div class="pa gate-mode-icon child" aria-hidden="true"><svg class="ui-ico"><use href="#u-sparkle"/></svg></div>
          <div class="gate-mode-copy"><div class="pn">${t('child')}</div><div class="pr">${t('childSub')}</div></div>
          <span class="gate-mode-arrow" aria-hidden="true">→</span>
        </button>
      </div>
      ${gateBuildHtml()}`);
    wireLang();
    body.querySelectorAll('[data-mode]').forEach((button) => {
      button.onclick = () => renderProfiles(button.dataset.mode);
    });
    fetch('build.json?v=' + APP_BUILD.version, { cache: 'no-store' }).then((r) => r.ok ? r.json() : null).then((data) => {
      if (!data || !data.label) return;
      Object.assign(APP_BUILD, data);
      const el = body.querySelector('.gate-build');
      if (el) {
        const n = (APP_BUILD.changed && (APP_BUILD.changed[lang] || APP_BUILD.changed.de)) || '';
        el.innerHTML = `<b>${esc(APP_BUILD.label)}</b><span>${esc(n)}</span>`;
      }
    }).catch(() => {});
  }

  function renderProfiles(mode) {
    const people = mode === 'child' ? CHILDREN : STAFF;
    paintGate('profiles', `
      ${langSwitch()}
      <div class="gate-head">
        <div class="mark">${mode === 'child' ? 'K' : 'A'}</div>
        <div class="brand-kicker">Armonia Thassos</div>
        <h2>${mode === 'child' ? t('child') : t('staff')}</h2>
        <p>${t('pick')}</p>
      </div>
      ${mode === 'child' ? `<p class="muted" style="font-size:12px;line-height:1.4;margin:0 0 12px">${esc(t('childInstall'))}</p>` : ''}
      <div class="profiles">
        ${people.map((person) => `
          <button class="profile" type="button" data-p="${person.id}">
            <div class="pa" style="background:${safeColor(person.color)}">${initials(person.name)}</div>
            <div class="pn">${esc(person.name)}</div>
            <div class="pr">${esc(person.role || '')}</div>
          </button>`).join('')}
      </div>
      <div class="gate-footer-row"><button class="gate-back" type="button" id="gHome">${t('back')}</button>${gateBuildHtml()}</div>`);
    wireLang();
    body.querySelector('#gHome').onclick = renderEntrance;
    body.querySelectorAll('[data-p]').forEach((button) => {
      const person = people.find((item) => item.id === button.dataset.p);
      button.onclick = () => renderPin(person, mode);
    });
  }

  function biometricLabel() {
    const ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod/i.test(ua)) return t('bioFace');
    if (/Android/i.test(ua)) return t('bioFinger');
    if (/Macintosh|Mac OS/i.test(ua)) return t('bioFace');
    if (/Windows/i.test(ua)) return 'Windows Hello';
    return t('bioPasskey');
  }

  function passkeyCapable() {
    return window.isSecureContext && !!window.PublicKeyCredential && !!navigator.credentials;
  }

  const b64ToBytes = (value) => {
    const base64 = String(value).replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(String(value).length / 4) * 4, '=');
    return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  };
  const bytesToB64 = (value) => {
    if (value === null || value === undefined) return null;
    const bytes = new Uint8Array(value);
    let binary = '';
    bytes.forEach((b) => { binary += String.fromCharCode(b); });
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  function decodePublicKeyOptions(options) {
    const out = structuredClone(options);
    out.challenge = b64ToBytes(out.challenge);
    if (out.user?.id) out.user.id = b64ToBytes(out.user.id);
    for (const key of ['allowCredentials', 'excludeCredentials']) {
      if (out[key]) out[key] = out[key].map((c) => ({ ...c, id: b64ToBytes(c.id) }));
    }
    return out;
  }
  function publicKeyCredentialJSON(credential) {
    const response = credential.response;
    const value = {
      id: credential.id,
      rawId: bytesToB64(credential.rawId),
      type: credential.type,
      authenticatorAttachment: credential.authenticatorAttachment || null,
      clientExtensionResults: credential.getClientExtensionResults?.() || {},
      response: { clientDataJSON: bytesToB64(response.clientDataJSON) },
    };
    if (response.attestationObject) value.response.attestationObject = bytesToB64(response.attestationObject);
    if (response.authenticatorData) value.response.authenticatorData = bytesToB64(response.authenticatorData);
    if (response.signature) value.response.signature = bytesToB64(response.signature);
    if ('userHandle' in response) value.response.userHandle = bytesToB64(response.userHandle);
    if (response.getTransports) value.response.transports = response.getTransports();
    return value;
  }

  async function passkeyApi(path, payload) {
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({ error: 'Invalid server response' }));
    if (!response.ok) {
      const error = new Error(data.error || 'Passkey request failed');
      error.status = response.status;
      error.code = data.code;
      if (data.retryAfter != null) error.retryAfter = data.retryAfter;
      throw error;
    }
    return data;
  }

  function renderPin(who, mode) {
    if (!who || !who.id) {
      renderEntrance();
      return;
    }
    let buf = '';
    let busy = false;
    let succeeded = false;
    try {
    paintGate('pin', `
      <div class="gate-pin">
        <div class="gate-pin-identity">
          <div class="pa" style="background:${safeColor(who.color)}">${initials(who.name)}</div>
          <div><h3>${esc(who.name)}</h3><div class="sub">${who.role ? esc(who.role) + ' · ' : ''}${t('pin')}</div></div>
        </div>
        <button class="passkey-btn primary-bio" id="gPasskey" type="button" hidden>🔐 <span><b>${esc(biometricLabel())}</b><span class="pk-sub">${esc(t('bioHint'))}</span></span></button>
        <div class="pin-divider" id="gPinDivider" hidden>${t('pinFallback')}</div>
        <div class="pindots" id="gpd"></div>
        <input class="pin-field" id="gPinInput" type="password" inputmode="numeric" pattern="[0-9]*"
          maxlength="6" autocomplete="one-time-code" enterkeyhint="done" aria-label="PIN" value="">
        <div id="gpErr" style="min-height:18px;color:#f87171;font-size:12.5px" role="alert"></div>
        <div class="pinpad" id="gPinpad" role="group" aria-label="PIN">
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button type="button" data-k="${n}">${n}</button>`).join('')}
          <button type="button" data-k="del" aria-label="Backspace">⌫</button>
          <button type="button" data-k="0">0</button>
          <button type="button" data-k="clr" aria-label="Clear">C</button>
        </div>
        <label class="gate-remember" for="gRemember">
          <input type="checkbox" id="gRemember" ${rememberChecked()?'checked':''}
            aria-describedby="gRememberHint">
          <span id="gRememberHint">${esc(t('rememberMe'))}</span>
        </label>
        <button class="btn gate-login-submit" id="gLogin" type="button">${t('login')}</button>
        <div class="gate-pin-links">
          <button class="gate-forgot" id="gForgot" type="button">${t('forgot')}</button>
          <button class="gate-back" type="button" id="gBack">${t('back')}</button>
          <button class="gate-back" type="button" id="gOther">${t('otherPerson')}</button>
        </div>
      </div>
      ${gateBuildHtml()}`);
    } catch (error) {
      try { renderEntrance(); } catch (e) {}
      return;
    }

    const input = body.querySelector('#gPinInput');
    const errorEl = body.querySelector('#gpErr');
    const loginBtn = body.querySelector('#gLogin');
    const pad = body.querySelector('#gPinpad');
    if (!input || !loginBtn || !pad) {
      try { renderEntrance(); } catch (e) {}
      return;
    }
    const setErr = (msg) => { if (errorEl) errorEl.textContent = msg || ''; };
    const draw = () => {
      const dots = body.querySelector('#gpd');
      if (dots) {
        dots.innerHTML = [0, 1, 2, 3, 4, 5]
          .map((i) => `<i class="${i < buf.length ? 'f' : ''}${busy && i < buf.length ? ' busy' : ''}"></i>`).join('');
      }
      if (input && input.value !== buf) input.value = buf;
    };
    draw();

    const setControlsEnabled = (enabled) => {
      if (loginBtn) loginBtn.disabled = !enabled;
      if (input) input.disabled = !enabled;
      if (pad) pad.querySelectorAll('button').forEach((b) => { b.disabled = !enabled; });
      const pk = body.querySelector('#gPasskey');
      if (pk) pk.disabled = !enabled;
    };

    const showPasskey = () => {
      const button = body.querySelector('#gPasskey');
      const divider = body.querySelector('#gPinDivider');
      if (!button || !divider) return;
      button.hidden = false;
      button.classList.add('on');
      divider.hidden = false;
      divider.style.display = 'flex';
    };
    if (passkeyCapable()) {
      showPasskey();
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.().then((available) => {
        if (available) showPasskey();
      }).catch(() => {});
    }

    const finish = async () => {
      if (busy || succeeded) return;
      if (buf.length < 4) {
        setErr(t('wrong'));
        return;
      }
      busy = true;
      setControlsEnabled(false);
      if (loginBtn) loginBtn.textContent = t('loading');
      setErr('');
      draw();
      try {
        const remember = !!(body.querySelector('#gRemember') || {}).checked;
        setRememberChecked(remember);
        const response = await fetchTimeout('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ mode, profileId: who.id, pin: buf, remember, deviceId: gateDeviceId() }),
        }, 8000);
        const raw = await response.text();
        let data = {};
        try { data = JSON.parse(raw); } catch (error) {
          setErr(t('unavailable'));
          buf = '';
          return;
        }
        if (!response.ok) {
          if (response.status === 429) {
            const minutes = Math.max(1, Math.ceil((Number(data.retryAfter) || 900) / 60));
            setErr(t('locked')(minutes));
          } else if (response.status === 401 && Number.isInteger(data.attemptsRemaining)) {
            setErr(t('attempts')(data.attemptsRemaining));
          } else {
            setErr(response.status === 401 ? t('wrong') : t('unavailable'));
          }
          buf = '';
          return;
        }
        succeeded = true;
        window.__paidiaAuthed = true;
        if (remember) writeLastProfile(mode, who.id);
        else clearLastProfile();
        window.__paidiaBootSession = data;
        try {
          loadApp();
          armAppTakeoverWatchdog(10000);
        } catch (error) {
          location.replace('/?in=' + Date.now());
        }
        return;
      } catch (error) {
        setErr(t('unavailable'));
        buf = '';
      } finally {
        if (!succeeded) {
          busy = false;
          if (loginBtn) loginBtn.textContent = t('login');
          setControlsEnabled(true);
          draw();
          try { input.focus(); } catch (error) {}
        }
      }
    };

    const finishPasskey = async () => {
      if (busy || succeeded || !passkeyCapable()) return;
      busy = true;
      setControlsEnabled(false);
      setErr('');
      try {
        const options = await passkeyApi('/api/auth/passkey/login/options', { mode, profileId: who.id });
        const publicKey = decodePublicKeyOptions(options.publicKey);
        const credential = await navigator.credentials.get({ publicKey });
        const remember = !!(body.querySelector('#gRemember') || {}).checked;
        setRememberChecked(remember);
        const pkData = await passkeyApi('/api/auth/passkey/login/verify', {
          ceremonyId: options.ceremonyId,
          credential: publicKeyCredentialJSON(credential),
          remember,
          deviceId: gateDeviceId(),
        });
        succeeded = true;
        window.__paidiaAuthed = true;
        if (remember) writeLastProfile(mode, who.id);
        else clearLastProfile();
        window.__paidiaBootSession = pkData;
        try {
          loadApp();
          armAppTakeoverWatchdog(10000);
        } catch (error) {
          location.replace('/?in=' + Date.now());
        }
        return;
      } catch (error) {
        if (error.code === 'locked' || error.status === 429) {
          const minutes = Math.max(1, Math.ceil((Number(error.retryAfter) || 900) / 60));
          setErr(t('locked')(minutes));
        } else if (error.name === 'NotAllowedError') setErr(t('bioFail'));
        else if (error.code === 'no_passkey') setErr(t('bioSetupNeeded'));
        else if (error.code === 'passkey_unavailable' || error.code === 'configuration') setErr(t('bioUnavailable'));
        else setErr(t('bioFail'));
      } finally {
        if (!succeeded) {
          busy = false;
          setControlsEnabled(true);
        }
      }
    };

    const push = (key) => {
      if (busy || succeeded) return;
      if (key === 'del') buf = buf.slice(0, -1);
      else if (key === 'clr') buf = '';
      else if (/^\d$/.test(key) && buf.length < 6) buf += key;
      draw();
      if (buf.length === 6) finish();
    };

    preloadApp();
    const backBtn = body.querySelector('#gBack');
    if (backBtn) backBtn.onclick = () => renderProfiles(mode);
    const otherBtn = body.querySelector('#gOther');
    if (otherBtn) otherBtn.onclick = () => { clearLastProfile(); renderEntrance(); };
    const rem = body.querySelector('#gRemember');
    if (rem) rem.onchange = () => setRememberChecked(rem.checked);
    const forgotBtn = body.querySelector('#gForgot');
    if (forgotBtn) forgotBtn.onclick = () => renderResetRequest(who, mode);
    const pkBtn = body.querySelector('#gPasskey');
    if (pkBtn) pkBtn.onclick = finishPasskey;
    pad.onclick = (event) => {
      const button = event.target.closest('button[data-k]');
      if (!button || button.disabled) return;
      event.preventDefault();
      push(button.dataset.k);
    };
    loginBtn.onclick = finish;
    input.addEventListener('input', () => {
      if (busy || succeeded) return;
      buf = String(input.value || '').replace(/\D/g, '').slice(0, 6);
      draw();
      if (buf.length === 6) finish();
    });
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && buf.length >= 4) {
        event.preventDefault();
        finish();
      }
    });
    setTimeout(() => input.focus(), 30);
  }

  function setGateStatus(el, message, kind) {
    if (!el) return;
    el.className = 'gate-status' + (kind ? ' ' + kind : '');
    el.textContent = message || '';
  }

  function renderResetRequest(who, mode) {
    paintGate('reset', `
      <div class="gate-pin gate-reset">
        <div class="gate-mail-hero" aria-hidden="true">
          <div class="gate-mail-mark">A</div>
          <div class="gate-mail-eyebrow">Armonia Thassos</div>
          <h3>${t('resetTitle')}</h3>
          <p id="resetHeroSub">${t('resetNeedProfileEmail')}</p>
        </div>
        <div class="pa" style="background:${safeColor(who.color)};margin:14px auto 0">${initials(who.name)}</div>
        <div class="sub" style="margin-top:8px">${esc(who.name)}</div>
        <div id="resetFormBlock">
          <label class="gate-field"><span>${t('email')}</span>
            <input type="email" id="resetEmail" autocomplete="email" inputmode="email" placeholder="name@example.com"></label>
          <div class="gate-status" id="resetStatus" role="status" aria-live="polite"></div>
          <button class="btn" id="resetSend" type="button">${t('sendLink')}</button>
        </div>
        <button class="gate-back" type="button" id="resetBack">${t('resetBackPin')}</button>
      </div>${gateBuildHtml()}`);
    const status = body.querySelector('#resetStatus');
    const button = body.querySelector('#resetSend');
    const formBlock = body.querySelector('#resetFormBlock');
    const heroSub = body.querySelector('#resetHeroSub');
    body.querySelector('#resetBack').onclick = () => renderPin(who, mode);

    const showUnavailable = () => {
      if (heroSub) heroSub.textContent = t('resetAskAdmin');
      if (formBlock) {
        formBlock.innerHTML = `<div class="gate-status error" role="status">${esc(t('resetUnavailable'))}</div>`;
      }
    };

    fetch('/api/auth/health', { credentials: 'same-origin' }).then((r) => r.json()).then((health) => {
      if (health?.pinResetReady === false || health?.emailConfigured === false) {
        showUnavailable();
      }
    }).catch(() => {
      // Fail closed: never pretend a link was emailed when health is unknown.
      showUnavailable();
    });
    if (button) button.onclick = async () => {
      const emailEl = body.querySelector('#resetEmail');
      const email = (emailEl && emailEl.value || '').trim();
      if (!email) { setGateStatus(status, t('needEmail'), 'error'); return; }
      button.disabled = true;
      setGateStatus(status, lang === 'el' ? 'Αποστολή…' : 'Senden…', '');
      try {
        const response = await fetch('/api/auth/request-reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ profileId: who.id, email }),
        });
        const data = await response.json().catch(() => ({}));
        if (response.status === 503 || data.code === 'reset_unavailable') {
          showUnavailable();
          return;
        }
        if (!response.ok) throw new Error(String(response.status));
        setGateStatus(status, t('linkSent'), 'success');
      } catch (error) {
        setGateStatus(status, t('unavailable'), 'error');
      } finally {
        if (button && !button.dataset.locked) button.disabled = false;
      }
    };
    setTimeout(() => body.querySelector('#resetEmail')?.focus(), 40);
  }

  function renderResetForm(token) {
    // Strip token from URL immediately so it does not linger in history/referrers.
    try { history.replaceState({}, '', location.pathname + location.hash); } catch (error) {}
    paintGate('reset', `
      <div class="gate-pin gate-reset">
        <div class="gate-mail-hero" aria-hidden="true">
          <div class="gate-mail-mark">A</div>
          <div class="gate-mail-eyebrow">Armonia Thassos · PIN</div>
          <h3>${t('resetTitle')}</h3>
          <p>${lang === 'el' ? 'Ο σύνδεσμος ισχύει 30 λεπτά.' : 'Der Link gilt 30 Minuten.'}</p>
        </div>
        <label class="gate-field"><span>${t('newPin')}</span>
          <input type="password" id="newPin" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="new-password"></label>
        <label class="gate-field"><span>${t('confirmPin')}</span>
          <input type="password" id="confirmPin" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="new-password"></label>
        <div class="gate-status" id="changeStatus" role="status" aria-live="polite"></div>
        <button class="btn" id="changePin" type="button">${t('changePin')}</button>
        <button class="gate-back" type="button" id="resetHome">${t('back')}</button>
      </div>${gateBuildHtml()}`);
    body.querySelector('#resetHome').onclick = () => renderEntrance();
    body.querySelector('#changePin').onclick = async () => {
      const pin = body.querySelector('#newPin').value;
      const confirmPin = body.querySelector('#confirmPin').value;
      const status = body.querySelector('#changeStatus');
      const button = body.querySelector('#changePin');
      if (!/^\d{4,6}$/.test(pin) || pin !== confirmPin) {
        setGateStatus(status, t('invalidReset'), 'error');
        return;
      }
      button.disabled = true;
      try {
        const response = await fetch('/api/auth/reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ token, pin, confirmPin }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          if (response.status === 507 || data.code === 'storage') {
            setGateStatus(status, t('storageFail'), 'error');
            return;
          }
          throw new Error(data.code || String(response.status));
        }
        setGateStatus(status, t('pinChanged'), 'success');
        setTimeout(() => renderEntrance(), 900);
      } catch (error) {
        setGateStatus(status, t('invalidReset'), 'error');
      } finally {
        button.disabled = false;
      }
    };
  }

  async function recoverBrokenClient() {
    try {
      if ('caches' in window) {
        const keys = await withDeadline(caches.keys(), 1500);
        if (Array.isArray(keys)) {
          await withDeadline(Promise.all(keys.map((k) => caches.delete(k))), 2000);
        }
      }
    } catch (e) { /* continue */ }
    try {
      if ('serviceWorker' in navigator) {
        const regs = await withDeadline(navigator.serviceWorker.getRegistrations(), 1500);
        if (Array.isArray(regs)) {
          await withDeadline(Promise.all(regs.map((r) => r.unregister())), 2000);
        }
      }
    } catch (e) { /* continue */ }
    try {
      sessionStorage.removeItem(BUILD_RELOAD_KEY);
      localStorage.removeItem(SW_BUILD_KEY);
    } catch (e) {}
    const url = new URL(location.href);
    url.searchParams.set('fresh', String(Date.now()));
    location.replace(url.href);
  }

  function armAppTakeoverWatchdog(ms) {
    const deadline = Math.max(4000, Number(ms) || 10000);
    setTimeout(() => {
      if (!document.body.classList.contains('auth-pending')) return;
      if (!gate.classList.contains('on')) return;
      // App bundle never closed the gate — restore a usable login shell.
      window.__paidiaAuthed = false;
      try { delete window.__paidiaBootSession; } catch (e) {}
      const last = readLastProfile();
      if (last) renderPin(last.who, last.mode);
      else renderEntrance();
      const status = body.querySelector('.gate-status, #bootStatus, #gpErr');
      if (status) {
        status.textContent = lang === 'el'
          ? 'Φόρτωση κόλλησε — δοκίμασε ξανά ή καθάρισε cache'
          : 'Laden hing — bitte erneut oder Cache leeren';
      }
      let recover = body.querySelector('#gRecover');
      if (!recover) {
        recover = document.createElement('button');
        recover.type = 'button';
        recover.id = 'gRecover';
        recover.className = 'btn sec';
        recover.style.marginTop = '12px';
        recover.textContent = lang === 'el' ? 'Καθαρισμός cache & επαναφόρτωση' : 'Cache leeren & neu laden';
        recover.onclick = () => { recover.disabled = true; recoverBrokenClient(); };
        const pin = body.querySelector('.gate-pin, .gate-main, .gate-entrance');
        (pin || body).appendChild(recover);
      }
    }, deadline);
  }

  async function start() {
    document.documentElement.lang = lang;
    gate.classList.add('on');
    document.body.classList.add('auth-pending');

    const resetToken = new URLSearchParams(location.search).get('reset');
    if (resetToken) {
      bootSettled = true;
      renderResetForm(resetToken);
      ensureServiceWorker();
      return;
    }

    // Paint login UI IMMEDIATELY — never leave static "Laden…" waiting on
    // build.json / session / SW. Network runs in the background afterward.
    bootSettled = true;
    try {
      const last = readLastProfile();
      if (last) renderPin(last.who, last.mode);
      else renderEntrance();
    } catch (error) {
      try { renderEntrance(); } catch (e) {}
    }

    try {
      if (await refreshStaleShell()) return;
    } catch (error) { /* continue */ }

    try { await withDeadline(purgeStaleShell(), 1200); } catch (error) { /* continue */ }
    ensureServiceWorker();

    try {
      const response = await fetchTimeout('/api/auth/session', {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
      }, 2000);
      const raw = await response.text();
      let data = {};
      try { data = JSON.parse(raw); } catch (error) { data = {}; }
      if (response.ok && data.authenticated) {
        window.__paidiaBootSession = data;
        if (data.remember && data.profileId && data.mode) writeLastProfile(data.mode, data.profileId);
        else if (!data.remember) clearLastProfile();
        const status = body.querySelector('.gate-status, #bootStatus, #gpErr');
        if (status) {
          status.textContent = lang === 'el' ? 'Συνεδρία…' : 'Sitzung wird geladen…';
        }
        loadApp();
        armAppTakeoverWatchdog(10000);
        return;
      }
    } catch (error) {
      /* stay on login UI already painted */
    }
  }

  window.PaidiaGate = { start, loadApp, renderResetForm, renderResetRequest };
  start();
})();
