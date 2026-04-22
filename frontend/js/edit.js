/**
 * Member 5: AJAX — Edit & Delete Movies
 * Handles updating and removing movies from the database
 */

const movieApiUrl = "../backend/DB_Ops.php";

/**
 * Escape HTML to prevent XSS vulnerabilities
 */
const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

/**
 * Open the modal for editing a movie
 * Prefills the form with the movie's existing data
 */
function openEditModal(movie) {
  const modal = document.getElementById("addMovieModal");
  const movieIdInput = document.getElementById("movieId");
  const modalTitle = document.getElementById("modalTitle");
  const saveBtn = document.getElementById("saveBtn");

  const titleInput = document.getElementById("title");
  const releaseYearInput = document.getElementById("release_year");
  const durationInput = document.getElementById("duration_minutes");
  const genreInput = document.getElementById("genre");
  const descriptionInput = document.getElementById("description");
  const posterInput = document.getElementById("poster");
  const omdbPosterInput = document.getElementById("omdbPosterPath");
  const trailerInput = document.getElementById("trailer_url");
  const ratingInput = document.getElementById("rating");
  const notesInput = document.getElementById("notes");
  const watchedInput = document.getElementById("watched");

  // Prefill the form with movie data
  movieIdInput.value = movie.id ?? "";
  titleInput.value = movie.title ?? "";
  releaseYearInput.value = movie.release_year ?? "";
  durationInput.value = movie.duration_minutes ?? "";
  genreInput.value = movie.genre ?? "";
  descriptionInput.value = movie.description ?? "";
  posterInput.value = "";
  posterInput.required = false;
  posterInput.disabled = false;
  if (omdbPosterInput) {
    omdbPosterInput.value = movie.poster_path ?? "";
  }
  trailerInput.value = movie.trailer_url ?? "";
  ratingInput.value = movie.rating ?? "";
  notesInput.value = movie.notes ?? "";
  watchedInput.checked = Number(movie.watched) === 1;

  // Change modal title and button text
  modalTitle.textContent = "Edit Film";
  saveBtn.textContent = "Update Film";

  window.moviePosterUI?.setMovie(movie);
  modal.classList.add("active");
}

/**
 * Send update request to backend
 * Uses PUT method to update an existing movie
 */
async function updateMovie(movieId, payload, posterFile = null) {
  try {
    const formData = new FormData();
    formData.append("_method", "PUT");
    formData.append("id", movieId);

    Object.entries(payload).forEach(([key, value]) => {
      if (value !== null && value !== "") {
        formData.append(key, value);
      }
    });

    if (posterFile) {
      formData.append("poster", posterFile);
    }

    const response = await fetch(movieApiUrl, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (result.success) {
      alert(result.message || "Movie updated successfully");
      return true;
    } else {
      alert(result.message || "Unable to update movie.");
      return false;
    }
  } catch (err) {
    console.error("Update error:", err);
    alert("Could not update movie. Please try again.");
    return false;
  }
}

/**
 * Send delete request to backend
 * Uses DELETE method to remove a movie from the database
 */
async function deleteMovie(movieId, movieTitle) {
  // Confirm dialog before deleting
  const confirmed = window.confirm(
    `Delete "${movieTitle}"? This action cannot be undone.`
  );

  if (!confirmed) return false;

  try {
    const response = await fetch(movieApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({ _method: "DELETE", id: movieId }),
    });

    const result = await response.json();

    if (result.success) {
      alert(result.message || "Movie deleted successfully");
      return true;
    } else {
      alert(result.message || "Unable to delete movie.");
      return false;
    }
  } catch (err) {
    console.error("Delete error:", err);
    alert("Could not delete movie. Please try again.");
    return false;
  }
}

/**
 * Show edit and delete buttons in the detail panel
 */
function renderDetailActions(movie, onEditClick, onDeleteClick) {
  const detailContent = document.getElementById("detailContent");

  // Create action buttons HTML
  const actionButtonsHtml = `
    <div class="detail-actions">
      <button type="button" class="btn btn-secondary" id="editMovieBtn">Edit</button>
      <button type="button" class="btn btn-danger" id="deleteMovieBtn">Delete</button>
    </div>
  `;

  // Append buttons to detail content
  detailContent.insertAdjacentHTML("beforeend", actionButtonsHtml);

  // Attach event listeners
  const editBtn = document.getElementById("editMovieBtn");
  const deleteBtn = document.getElementById("deleteMovieBtn");

  if (editBtn) {
    editBtn.addEventListener("click", () => onEditClick(movie));
  }

  if (deleteBtn) {
    deleteBtn.addEventListener("click", () => onDeleteClick(movie));
  }
}
