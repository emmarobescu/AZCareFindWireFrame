// scripts/sidebar.js
window.initSidebar = function initSidebar() {
  const openBtn = document.getElementById("openSignin");     // in the header
  const sidebar = document.getElementById("signinSidebar");
  const overlay = document.getElementById("overlay");
  const closeBtn = document.getElementById("closeSignin");

  const signinButton = document.querySelector(".signin-btn"); // inside sidebar form
  const noAccountPopup = document.getElementById("popupNoAccount");
  const cancelNoAccount = document.getElementById("cancelNoAccount");

  if (!sidebar || !overlay) return; // nothing to init if markup missing

  function toggleSidebar(open) {
    sidebar.classList.toggle("open", open);
    overlay.classList.toggle("active", open);
  }

  // Open sidebar from header button
  openBtn && openBtn.addEventListener("click", () => toggleSidebar(true));

  // Close sidebar
  closeBtn && closeBtn.addEventListener("click", () => toggleSidebar(false));
  overlay.addEventListener("click", () => {
    // close both sidebar and popup if either is open
    sidebar.classList.remove("open");
    noAccountPopup && noAccountPopup.classList.remove("active");
    overlay.classList.remove("active");
  });

  // Sidebar Sign In -> show "Account Not Found" popup (demo behavior)
  if (signinButton && noAccountPopup) {
    signinButton.addEventListener("click", (e) => {
      e.preventDefault();
      sidebar.classList.remove("open");
      overlay.classList.add("active");
      noAccountPopup.classList.add("active");
    });
  }

  // Close "Account Not Found" popup
  if (cancelNoAccount) {
    cancelNoAccount.addEventListener("click", () => {
      noAccountPopup.classList.remove("active");
      overlay.classList.remove("active");
    });
  }
};
