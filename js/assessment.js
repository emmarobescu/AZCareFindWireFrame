document.addEventListener("DOMContentLoaded", () => {
  // Cache frequently used DOM elements so they can be reused efficiently throughout the script
  const steps = document.querySelectorAll(".question-step");
  const nextBtn = document.querySelector(".next-btn");
  const backBtn = document.querySelector(".back-btn");
  const progressBar = document.getElementById("progress-bar");
  const startBtn = document.getElementById("startAssessmentBtn");
  const navButtons = document.getElementById("navButtons");
  const resultsDiv = document.getElementById("results");

  // Tracks which assessment screen is currently being displayed
  let currentStep = 0;

  /* ========================= STEP DISPLAY LOGIC ========================= */

  // Shows one step at a time, updates the progress bar,
  // and controls whether navigation buttons should be visible
  function showStep(i) {
    steps.forEach((s, idx) => s.classList.toggle("active", idx === i));

    // Progress bar width is calculated as a percentage of completed steps
    progressBar.style.width = `${(i / (steps.length - 1)) * 100}%`;

    // Hide navigation buttons on the intro screen and show them on all question steps
    navButtons.style.display = i === 0 ? "none" : "flex";

    // Recheck whether the current step is complete enough to allow the user to continue
    validateStep();
  }

  /* ========================= STEP VALIDATION ========================= */

  // Enables or disables the Next button based on whether the current question has valid input
  function validateStep() {
    const activeStep = steps[currentStep];
    if (!activeStep) return;

    // Select all relevant input types in the current step
    const inputs = activeStep.querySelectorAll(
      'input[type="radio"], input[type="checkbox"], input[type="text"]'
    );

    const hasInputs = inputs.length > 0;
    let valid = true;

    // A step is considered valid if at least one option is selected
    // or, for text inputs, if the field is not empty
    if (hasInputs) {
      valid = Array.from(inputs).some((input) => {
        if (input.type === "text") return input.value.trim() !== "";
        return input.checked;
      });
    }

    // Update button state and styling to reflect whether the user can continue
    nextBtn.disabled = !valid;
    nextBtn.style.opacity = valid ? "1" : "0.5";
    nextBtn.style.cursor = valid ? "pointer" : "not-allowed";
  }

  /* ========================= NAVIGATION CONTROLS ========================= */

  // Starts the assessment by moving the user from the intro screen to the first question
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      currentStep = 1;
      showStep(currentStep);
    });
  }

  // Advances to the next step if the current step is valid
  // If the user is on the final step, calculate and display results instead
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (nextBtn.disabled) return;

      if (currentStep < steps.length - 1) {
        currentStep++;
        showStep(currentStep);
      } else {
        calculateResults();
      }
    });
  }

  // Returns to the previous step without clearing the user's existing selections
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      if (currentStep > 0) {
        currentStep--;
        showStep(currentStep);
      }
    });
  }

  // Revalidates the current step whenever the user changes input
  document.addEventListener("input", validateStep);

  /* ========================= SCORING + RESULTS LOGIC ========================= */

  // Calculates the weighted care recommendation based on user responses
  function calculateResults() {
    // Helper function:
    // sums all checked values for a given input group
    // This supports both radio buttons and multi-select checkboxes
    const getScore = (name) => {
      const inputs = document.querySelectorAll(`[name="${name}"]:checked`);
      let total = 0;

      inputs.forEach((i) => {
        total += parseFloat(i.value);
      });

      return total;
    };

    // Total score combines all major categories related to care needs
    const total =
      getScore("daily") +
      getScore("memory") +
      getScore("mobility") +
      getScore("meds") +
      getScore("behavior") +
      getScore("toileting") +
      getScore("medical");

    // These category-specific scores are separated because they influence special-case recommendations
    const memoryScore = getScore("memory");
    const behaviorScore = getScore("behavior");

    /* Rule-based recommendation system:
       assigns a care level by comparing category scores and total support needs.
       This decision structure helps translate survey responses into a more practical
       placement recommendation for the user. */
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

    // Retrieve supporting user preferences to display alongside the recommendation
    const location = document.getElementById("location").value || "N/A";
    const budget = document.querySelector("[name='budget']:checked")?.value || "N/A";

    // Remove the original multi-step assessment interface once results are ready
    const oldFrame = document.querySelector(".assessment-frame");
    if (oldFrame) oldFrame.remove();

    // Display the final recommendation summary
    resultsDiv.style.display = "block";
    resultsDiv.innerHTML = `
      <div class="assessment-frame">
        <div class="assessment-inner result-inner">
          <h2 class="assessment-title">Recommended Care Level</h2>
          <p class="result-text"><strong>${careLevel}</strong></p>
          <p class="result-sub"><strong>Estimated Budget:</strong> $${budget}/month</p>
          <p class="result-sub"><strong>Preferred Location:</strong> ${location}</p>
          <button class="start-btn" onclick="window.location.href='map.html?level=${encodeURIComponent(
            careLevel
          )}&location=${encodeURIComponent(location)}'">
            View Matching Homes
          </button>
        </div>
      </div>
    `;
  }

  // Initialize the interface by showing the intro step on page load
  showStep(currentStep);
});
