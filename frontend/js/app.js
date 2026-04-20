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

  const detailPanel = document.getElementById("detailPanel");
  const panelOverlay = document.getElementById("panelOverlay");
  const detailContent = document.getElementById("detailContent");

  const apiUrl = "../backend/DB_Ops.php";

  const resetForm = () => {
    movieForm.reset();
    movieIdInput.value = "";
    currentEditingMovie = null;
    modalTitle.textContent = "Add New Film";
    saveBtn.textContent = "Save Film";
  };

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
                <img src="${movie.poster_path}" alt="${movie.title}">
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
    const payload = {
      title: document.getElementById("title").value.trim(),
      release_year: parseInt(document.getElementById("release_year").value) || null,
      duration_minutes: parseInt(document.getElementById("duration_minutes").value) || null,
      genre: document.getElementById("genre").value.trim(),
      description: document.getElementById("description").value.trim(),
      poster_path: document.getElementById("poster_path").value.trim(),
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
          String(currentEditingMovie.poster_path ?? "") === payload.poster_path &&
          String(currentEditingMovie.trailer_url ?? "") === payload.trailer_url &&
          String(currentEditingMovie.rating ?? "") === String(payload.rating ?? "") &&
          String(currentEditingMovie.notes ?? "") === payload.notes &&
          Number(currentEditingMovie.watched ?? 0) === Number(payload.watched ?? 0);

        if (noChanges) {
          alert("No changes made.");
          return;
        }
      }

      success = await updateMovie(parseInt(movieId), payload);
    } else {
      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=UTF-8" },
          body: JSON.stringify(payload),
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
        <img class="detail-poster" src="${movie.poster_path}" />
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
