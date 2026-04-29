/**
 * Edit / Delete / Detail Actions — Movie Tracker
 * Contains update, delete, and detail-panel action functions.
 * Works with Laravel routes and CSRF token support.
 */

/**
 * Get the CSRF token from the meta tag.
 */
function getCSRF() {
  const meta = document.querySelector('meta[name="csrf-token"]');
  return meta ? meta.getAttribute("content") : "";
}

/**
 * Display server-side validation errors returned by Laravel.
 */
function displayServerErrors(errors) {
  const errBox = document.getElementById("serverErrors");
  if (!errBox) return;

  if (!errors || Object.keys(errors).length === 0) {
    errBox.style.display = "none";
    return;
  }

  const messages = Object.values(errors).flat();
  errBox.innerHTML =
    "<ul>" + messages.map((m) => `<li>${m}</li>`).join("") + "</ul>";
  errBox.style.display = "block";
}

/**
 * Update an existing movie via PUT request.
 * Uses FormData for file uploads with method spoofing.
 *
 * @param {number} id        - Movie ID
 * @param {object} payload   - Movie data fields
 * @param {File|null} posterFile - Optional poster image file
 * @returns {boolean} true if successful
 */
async function updateMovie(id, payload, posterFile) {
  try {
    const formData = new FormData();
    formData.append("_token", getCSRF());
    formData.append("_method", "PUT"); // Laravel method spoofing

    Object.entries(payload).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, value);
      }
    });

    if (posterFile) {
      formData.append("poster", posterFile);
    }

    const response = await fetch(`/movies/${id}`, {
      method: "POST", // POST with _method=PUT for FormData
      headers: {
        "X-CSRF-TOKEN": getCSRF(),
        Accept: "application/json",
      },
      body: formData,
    });

    const result = await response.json();

    if (result.success) {
      alert(result.message || "Movie updated");
      return true;
    } else {
      if (result.errors) displayServerErrors(result.errors);
      alert(result.message || "Unable to update movie.");
      return false;
    }
  } catch (error) {
    alert("Could not update movie. Please try again.");
    return false;
  }
}

/**
 * Delete a movie via DELETE request.
 *
 * @param {number} id    - Movie ID
 * @param {string} title - Movie title (for confirmation dialog)
 * @returns {boolean} true if deleted
 */
async function deleteMovie(id, title) {
  if (!confirm(`Are you sure you want to delete "${title}"?`)) {
    return false;
  }

  try {
    const response = await fetch(`/movies/${id}`, {
      method: "DELETE",
      headers: {
        "X-CSRF-TOKEN": getCSRF(),
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (result.success) {
      alert(result.message || "Movie deleted");
      return true;
    } else {
      alert(result.message || "Unable to delete movie.");
      return false;
    }
  } catch (error) {
    alert("Could not delete movie. Please try again.");
    return false;
  }
}

/**
 * Open the edit modal pre-filled with movie data.
 *
 * @param {object} movie - The movie object to edit
 */
function openEditModal(movie) {
  const movieIdInput = document.getElementById("movieId");
  const modalTitle = document.getElementById("modalTitle");
  const saveBtn = document.getElementById("saveBtn");
  const modal = document.getElementById("addMovieModal");

  if (!movieIdInput || !modal) return;

  movieIdInput.value = movie.id;
  modalTitle.textContent = "Edit Film";
  saveBtn.textContent = "Update Film";

  // Fill form fields
  const fillInput = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.value = value ?? "";
  };

  fillInput("title", movie.title);
  fillInput("release_year", movie.release_year);
  fillInput("duration_minutes", movie.duration_minutes);
  fillInput("genre", movie.genre);
  fillInput("description", movie.description);
  fillInput("trailer_url", movie.trailer_url);
  fillInput("rating", movie.rating);
  fillInput("notes", movie.notes);

  const watchedCheckbox = document.getElementById("watched");
  if (watchedCheckbox) watchedCheckbox.checked = movie.watched == 1;

  // Set poster path if available
  if (window.moviePosterUI) {
    window.moviePosterUI.setMovie(movie);
  }

  // Clear server errors
  const errBox = document.getElementById("serverErrors");
  if (errBox) errBox.style.display = "none";

  modal.classList.add("active");
}

/**
 * Render Edit and Delete action buttons in the detail panel.
 *
 * @param {object}   movie          - The movie object
 * @param {function} onEdit         - Callback when Edit is clicked
 * @param {function} onDelete       - Callback when Delete is clicked
 */
function renderDetailActions(movie, onEdit, onDelete) {
  const detailContent = document.getElementById("detailContent");
  if (!detailContent) return;

  // Remove any existing action buttons
  const existing = detailContent.querySelector(".detail-actions");
  if (existing) existing.remove();

  const actionsDiv = document.createElement("div");
  actionsDiv.className = "detail-actions";

  const editBtn = document.createElement("button");
  editBtn.className = "btn btn-primary";
  editBtn.textContent = "Edit";
  editBtn.addEventListener("click", () => onEdit(movie));

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "btn btn-danger";
  deleteBtn.textContent = "Delete";
  deleteBtn.addEventListener("click", () => onDelete(movie));

  actionsDiv.appendChild(editBtn);
  actionsDiv.appendChild(deleteBtn);
  detailContent.appendChild(actionsDiv);
}
