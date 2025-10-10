document.addEventListener("DOMContentLoaded", () => {
  console.log("Filters.js loaded successfully");

  const searchBtn = document.querySelector(".search-btn");
  if (!window.map) {
    console.warn("Map not found");
    return;
  }

  if (searchBtn) {
    searchBtn.addEventListener("click", () => {
      alert("Search button working!");
    });
  }
});
