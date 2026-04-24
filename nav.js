const mobileNavToggle = document.getElementById('mobile-nav-toggle');
const mobileNavPanel = document.getElementById('mobile-nav-panel');
const mobileNavOverlay = document.getElementById('mobile-nav-overlay');

const closeMobileNav = () => {
  if (!mobileNavPanel || !mobileNavOverlay || !mobileNavToggle) return;
  mobileNavPanel.classList.remove('open');
  mobileNavOverlay.classList.remove('open');
  mobileNavToggle.classList.remove('open');
  mobileNavToggle.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('mobile-nav-open');
};

const openMobileNav = () => {
  if (!mobileNavPanel || !mobileNavOverlay || !mobileNavToggle) return;
  mobileNavPanel.classList.add('open');
  mobileNavOverlay.classList.add('open');
  mobileNavToggle.classList.add('open');
  mobileNavToggle.setAttribute('aria-expanded', 'true');
  document.body.classList.add('mobile-nav-open');
};

const toggleMobileNav = () => {
  if (!mobileNavPanel || !mobileNavOverlay || !mobileNavToggle) return;
  if (mobileNavPanel.classList.contains('open')) {
    closeMobileNav();
  } else {
    openMobileNav();
  }
};

if (mobileNavToggle && mobileNavPanel && mobileNavOverlay) {
  mobileNavToggle.addEventListener('click', toggleMobileNav);
  mobileNavOverlay.addEventListener('click', closeMobileNav);
  mobileNavPanel.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMobileNav);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && mobileNavPanel.classList.contains('open')) {
      closeMobileNav();
    }
  });
}
