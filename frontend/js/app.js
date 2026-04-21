document.addEventListener("DOMContentLoaded", () => {
  let movies = [];
  let currentEditingMovie = null;
  const movieGrid = document.getElementById("movieGrid");
  const searchInput = document.getElementById("searchInput");

  const modal = document.getElementById("addMovieModal");
  const openBtn = document.getElementById("openAddModalBtn");
  const closeBtn = document.getElementById("closeModalBtn");
  const cancelBtn = document.getElementById("cancelModalBtn");
  const movieForm = document.getElementById("movieForm");
  const movieIdInput = document.getElementById("movieId");
  const modalTitle = document.getElementById("modalTitle");
  const saveBtn = document.getElementById("saveBtn");
  const posterInput = document.getElementById("poster");

  const detailPanel = document.getElementById("detailPanel");
  const panelOverlay = document.getElementById("panelOverlay");
  const detailContent = document.getElementById("detailContent");

  const apiUrl = "../backend/DB_Ops.php";
  const allowedPosterTypes = ["image/jpeg", "image/png", "image/webp"];
  const maxPosterSizeBytes = 2 * 1024 * 1024;
  const posterPlaceholder =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 450'><rect width='300' height='450' fill='%23222228'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23a0a0a0' font-family='Arial' font-size='22'>No Poster</text></svg>";

  const getPosterUrl = (posterPath) => {
    const normalizedPath = String(posterPath ?? "").trim();

    if (!normalizedPath) {
      return posterPlaceholder;
    }

    if (/^https?:\/\//i.test(normalizedPath) || normalizedPath.startsWith("data:")) {
      return normalizedPath;
    }

    if (normalizedPath.startsWith("../") || normalizedPath.startsWith("./")) {
      return normalizedPath;
    }

    return `../${normalizedPath.replace(/^\/+/, "")}`;
  };

  const resetForm = () => {
    movieForm.reset();
    movieIdInput.value = "";
    currentEditingMovie = null;
    modalTitle.textContent = "Add New Film";
    saveBtn.textContent = "Save Film";
    posterInput.required = false;
    posterInput.disabled = false;
  };

  const validatePosterFile = (file) => {
    if (!file) {
      return true;
    }

    if (!allowedPosterTypes.includes(file.type)) {
      alert("Poster must be a JPG, PNG, or WEBP image.");
      posterInput.value = "";
      return false;
    }

    if (file.size > maxPosterSizeBytes) {
      alert("Poster image must be 2MB or smaller.");
      posterInput.value = "";
      return false;
    }

    return true;
  };

  posterInput.addEventListener("change", () => {
    validatePosterFile(posterInput.files[0] ?? null);
  });

  openBtn.addEventListener("click", () => {
    resetForm();
    modal.classList.add("active");
  });

  closeBtn.addEventListener("click", () => {
    modal.classList.remove("active");
    resetForm();
  });

  cancelBtn.addEventListener("click", () => {
    modal.classList.remove("active");
    resetForm();
  });

  const loadMovies = async () => {
    try {
      const response = await fetch(apiUrl + "?action=getMovies");
      const result = await response.json();

      if (result.success) {
        movies = result.data;
        renderMovies(movies);
      }
    } catch (err) {
      console.error("Could not fetch movies:", err);
      movieGrid.innerHTML = "<p>Error loading movies from database.</p>";
    }
  };

  searchInput.addEventListener("input", (e) => {
    const value = e.target.value.toLowerCase();
    const filteredMovies = movies.filter((movie) =>
      movie.title.toLowerCase().includes(value)
    );
    renderMovies(filteredMovies);
  });

  const renderMovies = (data) => {
    if (!data.length) {
      movieGrid.innerHTML = "<p class='empty'>No movies found.</p>";
      return;
    }

    movieGrid.innerHTML = data
      .map(
        (movie) => `
        <div class="movie-card" data-id="${movie.id}">
            <div class="card-poster">
                <img src="${getPosterUrl(movie.poster_path)}" alt="${movie.title}">
            </div>
            <div class="card-info">
                <h3>${movie.title}</h3>
                <p class="meta">${movie.release_year} • ${movie.genre || ""}</p>
                <div class="status ${movie.watched == 1 ? "watched" : ""}">
                    ${movie.watched == 1 ? "✔ Watched" : "Not Watched"}
                </div>
            </div>
        </div>
    `
      )
      .join("");

    setTimeout(() => {
      document.querySelectorAll(".movie-card").forEach((card) => {
        card.addEventListener("click", () => {
          const id = card.getAttribute("data-id");
          const movie = movies.find((m) => m.id == id);
          if (movie) openMovieDetails(movie);
        });
      });
    }, 0);
  };

  movieForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const movieId = movieIdInput.value.trim();
    const posterFile = posterInput.files[0] ?? null;
    if (!validatePosterFile(posterFile)) {
      return;
    }
    const payload = {
      title: document.getElementById("title").value.trim(),
      release_year: parseInt(document.getElementById("release_year").value) || null,
      duration_minutes: parseInt(document.getElementById("duration_minutes").value) || null,
      genre: document.getElementById("genre").value.trim(),
      description: document.getElementById("description").value.trim(),
      poster_path: document.getElementById("omdbPosterPath")?.value.trim() || "",
      trailer_url: document.getElementById("trailer_url").value.trim(),
      rating: parseInt(document.getElementById("rating").value) || null,
      notes: document.getElementById("notes").value.trim(),
      watched: document.getElementById("watched").checked ? 1 : 0,
    };

    let success = false;

    if (movieId) {
      if (currentEditingMovie) {
        const noChanges =
          String(currentEditingMovie.title ?? "") === payload.title &&
          String(currentEditingMovie.release_year ?? "") === String(payload.release_year ?? "") &&
          String(currentEditingMovie.duration_minutes ?? "") === String(payload.duration_minutes ?? "") &&
          String(currentEditingMovie.genre ?? "") === payload.genre &&
          String(currentEditingMovie.description ?? "") === payload.description &&
          String(currentEditingMovie.trailer_url ?? "") === payload.trailer_url &&
          String(currentEditingMovie.rating ?? "") === String(payload.rating ?? "") &&
          String(currentEditingMovie.notes ?? "") === payload.notes &&
          Number(currentEditingMovie.watched ?? 0) === Number(payload.watched ?? 0) &&
          !posterFile;

        if (noChanges) {
          alert("No changes made.");
          return;
        }
      }

      success = await updateMovie(parseInt(movieId), payload);
    } else {
      try {
        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (value !== null && value !== "") {
            formData.append(key, value);
          }
        });

        if (posterFile) {
          formData.append("poster", posterFile);
        }

        const response = await fetch(apiUrl, {
          method: "POST",
          body: formData,
        });
        const result = await response.json();
        if (result.success) {
          alert(result.message || "Movie created");
          success = true;
        } else {
          alert(result.message || "Unable to save movie.");
        }
      } catch (err) {
        console.error(err);
        alert("Could not save movie. Please try again.");
      }
    }

    if (success) {
      await loadMovies();
      modal.classList.remove("active");
      resetForm();
      closePanel();
    }
  });

  function openMovieDetails(movie) {
    const trailerHtml = movie.trailer_url
      ? `<div class="detail-trailer-row">
          <span class="detail-trailer-label">Trailer</span>
          <a class="detail-link" href="${movie.trailer_url}" target="_blank" rel="noopener noreferrer">Watch trailer</a>
        </div>`
      : "";

    detailContent.innerHTML = `
        <img class="detail-poster" src="${getPosterUrl(movie.poster_path)}" alt="${movie.title}" />
        <h2>${movie.title}</h2>
        <p class="detail-meta">
        ${movie.release_year} • ${movie.genre || "Unknown"} • 
        ${movie.duration_minutes} min
        </p>
        <p style="margin-top: 1rem; line-height: 1.5;">
        ${movie.description || "No description available."}
        </p>
        <div style="margin-top: 1rem;">
        <strong>Status:</strong>
        ${movie.watched == 1 ? "✔ Watched" : "Not Watched"}
        </div>
        ${trailerHtml}
        ${movie.rating ? `<div style="margin-top: 0.5rem;"><strong>Rating:</strong> ${movie.rating}/10</div>` : ""}
        ${movie.notes ? `<div style="margin-top: 0.5rem;"><strong>Notes:</strong> ${movie.notes}</div>` : ""}
    `;

    detailPanel.classList.add("active");
    panelOverlay.classList.add("active");

    renderDetailActions(
      movie,
      (movie) => {
        closePanel();
        currentEditingMovie = movie;
        openEditModal(movie);
      },
      async (movie) => {
        const success = await deleteMovie(movie.id, movie.title);
        if (success) {
          await loadMovies();
          closePanel();
        }
      }
    );
  }

  document.getElementById("closePanelBtn").addEventListener("click", closePanel);
  panelOverlay.addEventListener("click", closePanel);

  function closePanel() {
    detailPanel.classList.remove("active");
    panelOverlay.classList.remove("active");
  }

  loadMovies();
});
