// js/sidebar.js
document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.map-container');
  const filterBtn = document.getElementById('open-filter');
  const infoBtn = document.getElementById('open-info');

  // ---- Filter button toggle ----
  if (container && filterBtn) {
    filterBtn.addEventListener('click', () => {
      const isOpen = container.classList.toggle('sidebar-open');
      // close info if filter opens
      if (isOpen) container.classList.remove('info-open');
      filterBtn.classList.toggle('active', isOpen);
      infoBtn?.classList.remove('active');
    });
  }

  // ---- Info button toggle ----
  if (container && infoBtn) {
    infoBtn.addEventListener('click', () => {
      const isOpen = container.classList.toggle('info-open');
      // close filter if info opens
      if (isOpen) container.classList.remove('sidebar-open');
      infoBtn.classList.toggle('active', isOpen);
      filterBtn?.classList.remove('active');
    });
  }
});
