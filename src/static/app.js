document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants section
        const participants = details.participants || [];
        let participantsHTML = `<div class="participants"><h5>Participants</h5>`;
        if (participants.length) {
          participantsHTML += `<ul class="participants-list">` + participants.map(p => `
            <li class="participant-item">
              <span class="participant-email">${p}</span>
              <button class="remove-btn" data-activity="${name}" data-email="${p}" aria-label="Remove ${p}">&times;</button>
            </li>
          `).join("") + `</ul>`;
        } else {
          participantsHTML += `<p class="no-participants">No participants yet</p>`;
        }
        participantsHTML += `</div>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p class="availability"><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        activitiesList.appendChild(activityCard);

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
        messageDiv.className = "success message";
        signupForm.reset();

        // Update the activity card in-place so the UI reflects the new participant
        const cards = activitiesList.querySelectorAll('.activity-card');
        let targetCard = null;
        cards.forEach(c => {
          const hdr = c.querySelector('h4');
          if (hdr && hdr.textContent === activity) targetCard = c;
        });

        if (targetCard) {
          const participantsDiv = targetCard.querySelector('.participants');
          if (participantsDiv) {
            // remove placeholder if present
            const noP = participantsDiv.querySelector('.no-participants');
            if (noP) noP.remove();

            let ul = participantsDiv.querySelector('.participants-list');
            const newLi = `\n              <li class="participant-item">\n                <span class="participant-email">${email}</span>\n                <button class="remove-btn" data-activity="${activity}" data-email="${email}" aria-label="Remove ${email}">&times;</button>\n              </li>\n            `;

            if (ul) {
              ul.insertAdjacentHTML('beforeend', newLi);
            } else {
              ul = document.createElement('ul');
              ul.className = 'participants-list';
              ul.innerHTML = newLi;
              participantsDiv.appendChild(ul);
            }
          }

          // decrement availability number shown
          const availabilityEl = targetCard.querySelector('.availability');
          if (availabilityEl) {
            const text = availabilityEl.textContent || '';
            const match = text.match(/(\d+) spots left/);
            if (match) {
              const current = parseInt(match[1], 10);
              availabilityEl.innerHTML = `<strong>Availability:</strong> ${Math.max(0, current - 1)} spots left`;
            }
          }
        }
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error message";
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

  // Delegate click for remove buttons
  activitiesList.addEventListener('click', async (e) => {
    const btn = e.target.closest('.remove-btn');
    if (!btn) return;

    const activity = btn.dataset.activity;
    const email = btn.dataset.email;
    const card = btn.closest('.activity-card');
    const messageDiv = document.getElementById('message');

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
        { method: 'DELETE' }
      );

      const result = await response.json();

      if (response.ok) {
        // remove the participant item from the list
        const li = btn.closest('li');
        const ul = li && li.parentElement;
        if (li) li.remove();

        // if list empty, show no-participants message
        if (ul && ul.querySelectorAll('li').length === 0) {
          const participantsDiv = card.querySelector('.participants');
          participantsDiv.querySelector('.participants-list')?.remove();
          const noP = document.createElement('p');
          noP.className = 'no-participants';
          noP.textContent = 'No participants yet';
          participantsDiv.appendChild(noP);
        }

        // increment availability number shown
        const availabilityEl = card.querySelector('.availability');
        if (availabilityEl) {
          const text = availabilityEl.textContent || '';
          const match = text.match(/(\d+) spots left/);
          if (match) {
            const current = parseInt(match[1], 10);
            availabilityEl.innerHTML = `<strong>Availability:</strong> ${current + 1} spots left`;
          }
        }

        messageDiv.textContent = result.message || 'Participant removed';
        messageDiv.className = 'success message';
      } else {
        messageDiv.textContent = result.detail || 'Failed to remove participant';
        messageDiv.className = 'error message';
      }

      messageDiv.classList.remove('hidden');
      setTimeout(() => messageDiv.classList.add('hidden'), 4000);
    } catch (err) {
      messageDiv.textContent = 'Failed to remove participant. Try again.';
      messageDiv.className = 'error message';
      messageDiv.classList.remove('hidden');
      console.error('Error removing participant:', err);
    }
  });
});
