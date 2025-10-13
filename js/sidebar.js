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
    if (isOpen) {
      container.classList.remove('sidebar-open');
      // Reset info panel to default state
      document.getElementById('info-default').style.display = 'block';
      document.getElementById('facility-details').style.display = 'none';
    }
    infoBtn.classList.toggle('active', isOpen);
    filterBtn?.classList.remove('active');
  });
}
});
