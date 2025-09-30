document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.map-container');
  const toggleBtn = document.getElementById('open-filter');

  if (container && toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      container.classList.toggle('sidebar-open');
    });
  }
});
