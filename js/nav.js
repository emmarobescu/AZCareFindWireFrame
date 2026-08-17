// js/nav.js
// Shared mobile hamburger-menu behavior for the main site navigation.
// Toggles the collapsed .nav-links panel and keeps the button's
// aria-expanded state (and icon animation) in sync.
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');

  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  // Closing the menu after a link is tapped keeps it from staying
  // open when the next page loads.
  links.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
});
