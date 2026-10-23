/* Tvardi Therapeutics (Nasdaq: TVRD) IR banner — Concept C, motif /
 * dark + investor email sign-up — 300x600, 4-slide carousel
 *
 * Standard HTML5-ad clickTag pattern: ad servers (GAM, DV360, StackAdapt,
 * etc.) look for a top-level `clickTag` variable and rewrite it at
 * trafficking time. Keep it exactly as a plain global var assignment —
 * don't wrap it in a function or bundle it — or most exchanges' macro
 * scanners won't find it.
 */
var clickTag = "https://ir-landing-concepts-tvard.netlify.app/";

// Where the in-banner email sign-up is sent. Set this to the IR
// team's list endpoint (Mailchimp/HubSpot/Klaviyo form action, a
// Netlify/Zapier webhook, etc.). The email is POSTed as a normal
// form field named "email", plus "source=tvrd-banner-300x600".
// While it's left empty, submitting opens the landing page's "Investor
// alerts" section (id="alerts", "Receive Tvardi press releases, clinical
// milestones, and SEC filings") in a new tab; its "Sign up for alerts"
// button links to the official IR site. That page has no email form and
// reads no ?email= param, so the address is deliberately NOT appended to
// the URL (it would only leak into server logs). The address is NOT
// captured until SIGNUP_ENDPOINT is set.
var SIGNUP_ENDPOINT = "";
var SIGNUP_FALLBACK_URL = clickTag.replace(/\/?$/, '/') + "#alerts";

(function () {
  var banner = document.getElementById('banner');
  var form = document.getElementById('signup');
  var emailInput = document.getElementById('signup-email');
  var msg = document.getElementById('signup-msg');
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('.dot'));
  var prevBtn = document.getElementById('arrow-prev');
  var nextBtn = document.getElementById('arrow-next');

  var current = 0;
  var AUTO_MS = 4500;
  // Ad specs (Google Ads HTML5, IAB LEAN) cap animation at 30s: rotate
  // for 6 transitions (~27s) — 1,2,3,4,1,2 — and make the 6th a return
  // to slide 1, which stays up as the end frame. Manual controls still
  // work afterwards (user-initiated), but auto-rotation never restarts.
  var MAX_AUTO = 6;
  var autoCount = 0;
  var timer = null;

  function goTo(index) {
    index = (index + slides.length) % slides.length;
    if (index === current) return;
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = index;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  function autoStep() {
    autoCount++;
    if (autoCount >= MAX_AUTO) {
      clearInterval(timer);
      timer = null;
      goTo(0);
      return;
    }
    next();
  }

  function restartAuto() {
    if (timer) clearInterval(timer);
    timer = null;
    if (autoCount >= MAX_AUTO) return;
    timer = setInterval(autoStep, AUTO_MS);
  }

  // Manual controls stop propagation so they don't also fire the
  // whole-banner click-through below.
  dots.forEach(function (dot, i) {
    dot.addEventListener('click', function (e) {
      e.stopPropagation();
      goTo(i);
      restartAuto();
    });
  });
  nextBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    next();
    restartAuto();
  });
  prevBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    prev();
    restartAuto();
  });

  // Pause the auto-rotation while a desktop viewer is interacting with it.
  // Also hold it while the email field has focus, so the slides don't
  // keep flipping behind someone mid-typing (mobile has no mouseleave).
  var typing = false;
  function pause() { if (timer) clearInterval(timer); }
  banner.addEventListener('mouseenter', pause);
  banner.addEventListener('mouseleave', function () { if (!typing) restartAuto(); });
  emailInput.addEventListener('focus', function () { typing = true; pause(); });
  emailInput.addEventListener('blur', function () { typing = false; });

  // ── In-banner email sign-up ────────────────────────────────────
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function showError(text) {
    form.classList.remove('is-error');
    void form.offsetWidth; // restart the shake animation
    form.classList.add('is-error');
    msg.textContent = text;
  }
  function showDone() {
    form.classList.remove('is-error', 'is-sending');
    form.classList.add('is-done');
    document.getElementById('signup-done').setAttribute('aria-hidden', 'false');
    emailInput.blur();
  }

  emailInput.addEventListener('input', function () {
    if (form.classList.contains('is-error')) {
      form.classList.remove('is-error');
    }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = emailInput.value.trim();
    if (!EMAIL_RE.test(email)) {
      showError('Please enter a valid email address');
      emailInput.focus();
      return;
    }

    if (!SIGNUP_ENDPOINT) {
      // No list endpoint yet: the address isn't captured here, so don't
      // claim a subscription. Point the visitor at the tab just opened.
      document.getElementById('signup-done-text').textContent =
        'Continue to investor alerts in the new tab.';
      window.open(SIGNUP_FALLBACK_URL, '_blank');
      showDone();
      return;
    }

    form.classList.add('is-sending');
    var body = new URLSearchParams({ email: email, source: 'tvrd-banner-300x600' });
    // no-cors: most list providers' form endpoints don't send CORS
    // headers, and the banner only needs the request delivered.
    fetch(SIGNUP_ENDPOINT, { method: 'POST', mode: 'no-cors', body: body })
      .then(showDone)
      .catch(function () {
        form.classList.remove('is-sending');
        showError('Something went wrong — please try again');
      });
  });

  // Clicks anywhere else on the creative go to the single clickTag URL;
  // the sign-up form and carousel controls are excluded.
  banner.addEventListener('click', function (e) {
    if (e.target.closest('#signup, .dot, .nav-arrow')) return;
    window.open(clickTag, '_blank');
  });

  // Fire the entrance sequence + start the carousel once the layout has
  // actually painted, not just on script execution — avoids the stagger
  // jumping straight to its end state on a slow/cold iframe load.
  function goLive() {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        banner.classList.add('is-live');
        slides[0].classList.add('active');
        restartAuto();
      });
    });
  }
  if (document.readyState === 'complete') goLive();
  else window.addEventListener('load', goLive);

  // Impression pixel goes here once this is served through an ad server —
  // e.g. new Image().src = 'https://your-tracker/impression?...';
})();
