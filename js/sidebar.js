document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.map-container');
  const filterBtn = document.getElementById('open-filter'); // first icon

  if (container && filterBtn) {
    filterBtn.addEventListener('click', () => {
      const isOpen = container.classList.toggle('sidebar-open');
      filterBtn.classList.toggle('active', isOpen); // only affects filter icon
    });
  }
  // Info toggle
  if (container && infoBtn) {
    infoBtn.addEventListener('click', () => {
      const isOpen = container.classList.toggle('info-open');
      container.classList.remove('sidebar-open');
      infoBtn.classList.toggle('active', isOpen);
    });
  }
});
