document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.map-container');
  const filterBtn = document.getElementById('open-filter'); // first icon

  if (container && filterBtn) {
    filterBtn.addEventListener('click', () => {
      const isOpen = container.classList.toggle('sidebar-open');
      filterBtn.classList.toggle('active', isOpen); // only affects filter icon
    });
  }
});
