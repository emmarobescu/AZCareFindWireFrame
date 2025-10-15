document.addEventListener("DOMContentLoaded", () => {
  const steps = document.querySelectorAll(".step");
  const nextBtns = document.querySelectorAll(".next-btn");
  const backBtns = document.querySelectorAll(".back-btn");
  const progressBar = document.getElementById("progress-bar");
  const form = document.getElementById("assessment-form");
  const resultsDiv = document.getElementById("results");
  let currentStep = 0;

  function showStep(i) {
    steps.forEach((s, idx) => s.classList.toggle("active", idx === i));
    const percent = ((i + 1) / steps.length) * 100;
    progressBar.style.width = `${percent}%`;
  }

  nextBtns.forEach(btn => btn.addEventListener("click", () => {
    if (currentStep < steps.length - 1) {
      currentStep++;
      showStep(currentStep);
    }
  }));

  backBtns.forEach(btn => btn.addEventListener("click", () => {
    if (currentStep > 0) {
      currentStep--;
      showStep(currentStep);
    }
  }));

  // Helper to get total score from all numeric inputs
  function getScore(name) {
    const radios = document.querySelectorAll(`[name="${name}"]:checked`);
    const checks = document.querySelectorAll(`[name="${name}"]:checked`);
    let total = 0;
    radios.forEach(r => total += parseFloat(r.value));
    checks.forEach(c => total += parseFloat(c.value));
    return total;
  }

  document.getElementById("submit-btn").addEventListener("click", e => {
    e.preventDefault();

    const total =
      getScore("daily") +
      getScore("memory") +
      getScore("mobility") +
      getScore("meds") +
      getScore("behavior") +
      getScore("toileting") +
      getScore("medical");

    const memoryScore = getScore("memory");
    const behaviorScore = getScore("behavior");

    let careLevel = "";
    if (memoryScore >= 10 && total >= 20) {
      careLevel = "Memory Care";
    } else if (behaviorScore >= 8 && memoryScore < 10) {
      careLevel = "Behavioral Health Residential";
    } else if (total <= 5) {
      careLevel = "Supervisory Care";
    } else if (total <= 15) {
      careLevel = "Personal Care";
    } else {
      careLevel = "Directed Care";
    }

    const location = document.getElementById("location").value || "N/A";
    const budget = document.querySelector("[name='budget']:checked")?.value || "N/A";

    resultsDiv.innerHTML = `
      <div class="result-box">
        <h2>Recommended Care Level: ${careLevel}</h2>
        <p><strong>Estimated Budget:</strong> $${budget}/month</p>
        <p><strong>Preferred Location:</strong> ${location}</p>
        <button onclick="window.location.href='map.html?level=${encodeURIComponent(careLevel)}&location=${encodeURIComponent(location)}'">
          View Matching Homes
        </button>
      </div>
    `;

    form.style.display = "none";
  });

  showStep(currentStep);
});
