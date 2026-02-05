document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // helper: generate initials from email local-part
  function getInitials(email) {
    if (!email) return "";
    const name = email.split("@")[0].replace(/[\W_]+/g, " ").trim();
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return email.slice(0, 2).toUpperCase();
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  // Function to handle participant deletion
  async function handleDeleteParticipant(event) {
    event.preventDefault();
    const activityName = event.target.dataset.activity;
    const email = event.target.dataset.email;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        fetchActivities();
      } else {
        const result = await response.json();
        alert(result.detail || "Failed to unregister participant");
        console.error("Error unregistering participant:", result);
      }
    } catch (error) {
      alert("Failed to unregister participant. Please try again.");
      console.error("Error unregistering participant:", error);
    }
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Reset activity select options
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - (details.participants?.length || 0);

        // build participants markup
        let participantsMarkup = "";
        if (details.participants && details.participants.length > 0) {
          participantsMarkup = `<div class="participants-section"><h5>Participants</h5><ul class="participants-list">` +
            details.participants.map(p => `<li><span class="participant-badge">${getInitials(p)}</span><span class="participant-name">${p}</span></li>`).join("") +
            `</ul></div>`;
        } else {
          participantsMarkup = `<div class="participants-section"><h5>Participants</h5><p class="empty">No participants yet</p></div>`;
        }

        if (details.participants && details.participants.length > 0) {
          participantsMarkup = `<div class="participants-section"><h5>Participants</h5><ul class="participants-list">` +
            details.participants.map(p => `
              <li>
                <span class="participant-badge">${getInitials(p)}</span>
                <span class="participant-name">${p}</span>
                <button class="delete-participant-btn" data-activity="${name}" data-email="${p}" title="Remove participant">✕</button>
              </li>
            `).join("") +
            `</ul></div>`;
        } else {
          participantsMarkup = `<div class="participants-section"><h5>Participants</h5><p class="empty">No participants yet</p></div>`;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsMarkup}
        `;

        activitiesList.appendChild(activityCard);

        // Add event listeners for delete buttons
        const deleteButtons = activityCard.querySelectorAll(".delete-participant-btn");
        deleteButtons.forEach(btn => {
          btn.addEventListener("click", handleDeleteParticipant);
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
