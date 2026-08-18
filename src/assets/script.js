// ============================================
// SUNSUVIN — shared behavior
// ============================================

// --- Mobile nav toggle ---
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const isOpen = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }
});

// ============================================
// GAS backend endpoint.
// Replace this with your deployed Web App URL
// after following DEPLOY_INSTRUCTIONS.md
// ============================================
const SUNSUVIN_ENDPOINT = 'https://script.google.com/macros/s/AKfycbyDokbo9HBgaAZcUfws-FbilHkJf342kcHFWO3TZiA3eAZrdtzr6ll0SLNmEh3e3R25RA/exec';

async function handleMentorshipForm(form, statusEl) {
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  payload.page = window.location.pathname;
  payload.submittedAt = new Date().toISOString();

  const submitBtn = form.querySelector('button[type="submit"]');
  const originalLabel = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending…';
  statusEl.className = 'form-status';
  statusEl.textContent = '';

  if (SUNSUVIN_ENDPOINT.includes('PASTE_YOUR')) {
    // Backend not configured yet — fail loudly rather than pretend success.
    statusEl.textContent = 'Form backend not connected yet. See DEPLOY_INSTRUCTIONS.md.';
    statusEl.className = 'form-status error';
    submitBtn.disabled = false;
    submitBtn.textContent = originalLabel;
    return;
  }

  try {
    // Apps Script web apps don't reliably support CORS preflight with
    // custom headers, so we send as text/plain and parse JSON server-side.
    const res = await fetch(SUNSUVIN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('Request failed: ' + res.status);

    statusEl.textContent = "Thank you — we've received your request and will reach out within 2 business days.";
    statusEl.className = 'form-status success';
    form.reset();
  } catch (err) {
    statusEl.textContent = 'Something went wrong sending your request. Please email us directly instead.';
    statusEl.className = 'form-status error';
    console.error('Sunsuvin form error:', err);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalLabel;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('mentorship-form');
  const statusEl = document.getElementById('form-status');
  if (form && statusEl) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      handleMentorshipForm(form, statusEl);
    });
  }
});
