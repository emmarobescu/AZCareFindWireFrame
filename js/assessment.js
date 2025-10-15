document.addEventListener("DOMContentLoaded", () => {
  const steps = document.querySelectorAll(".question-step");
  const nextBtn = document.querySelector(".next-btn");
  const backBtn = document.querySelector(".back-btn");
  const progressBar = document.getElementById("progress-bar");
  const startBtn = document.getElementById("startAssessmentBtn");
  const navButtons = document.getElementById("navButtons");
  const resultsDiv = document.getElementById("results");
  let currentStep = 0;

  // ---- Show a specific step ----
  function showStep(i) {
    steps.forEach((s, idx) => s.classList.toggle("active", idx === i));
    progressBar.style.width = `${((i) / (steps.length - 1)) * 100}%`;

    // Hide nav buttons on intro (step 0)
    if (i === 0) {
      navButtons.style.display = "none";
    } else {
      navButtons.style.display = "flex";
    }
  }

 if (startBtn) {
  startBtn.addEventListener("click", () => {
    console.log("Start Assessment clicked"); // debug check in console
    currentStep = 1;
    showStep(currentStep);
  });
   
  // ---- Next Button ----
  nextBtn.addEventListener("click", () => {
    if (currentStep < steps.length - 1) {
      currentStep++;
      showStep(currentStep);
    } else {
      calculateResults();
    }
  });

  // ---- Back Button ----
  backBtn.addEventListener("click", () => {
    if (currentStep > 0) {
      currentStep--;
      showStep(currentStep);
    }
  });

  // ---- Calculate Score and Show Result ----
  function calculateResults() {
    const getScore = (name) => {
      const inputs = document.querySelectorAll(`[name="${name}"]:checked`);
      let total = 0;
      inputs.forEach(i => total += parseFloat(i.value));
      return total;
    };

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

    document.getElementById("assessmentBox").style.display = "none";
    resultsDiv.style.display = "block";
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
  }

  // ---- Initialize ----
  showStep(currentStep);
});
