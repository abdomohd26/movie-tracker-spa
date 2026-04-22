document.addEventListener("DOMContentLoaded", () => {
  let movies = [];
  let currentEditingMovie = null;
  let searchDebounceId = null;
  let genreOptionsLoaded = false;
  let currentPage = 1;
  let pageSize = 5;
  let totalPages = 1;
  let totalItems = 0;

  const movieGrid = document.getElementById("movieGrid");
  const paginationBar = document.getElementById("paginationBar");
  const searchInput = document.getElementById("searchInput");
  const genreFilter = document.getElementById("genreFilter");
  const statusFilter = document.getElementById("statusFilter");
  const pageSizeFilter = document.getElementById("pageSizeFilter");

  const modal = document.getElementById("addMovieModal");
  const openBtn = document.getElementById("openAddModalBtn");
  const closeBtn = document.getElementById("closeModalBtn");
  const cancelBtn = document.getElementById("cancelModalBtn");
  const movieForm = document.getElementById("movieForm");
  const movieIdInput = document.getElementById("movieId");
  const modalTitle = document.getElementById("modalTitle");
  const saveBtn = document.getElementById("saveBtn");
  const posterInput = document.getElementById("poster");
  const omdbPosterInput = document.getElementById("omdbPosterPath");

  const detailPanel = document.getElementById("detailPanel");
  const panelOverlay = document.getElementById("panelOverlay");
  const detailContent = document.getElementById("detailContent");

  const apiUrl = "../backend/DB_Ops.php";
  const allowedPosterTypes = ["image/jpeg", "image/png", "image/webp"];
  const maxPosterSizeBytes = 2 * 1024 * 1024;
  const posterPlaceholder =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 450'><rect width='300' height='450' fill='%23222228'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23a0a0a0' font-family='Arial' font-size='22'>No Poster</text></svg>";
  const apiPosterCache = new Map();

  const escapeHtml = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

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

  const isUploadedPoster = (posterPath) =>
    /^(\.\.\/)?uploads\//i.test(String(posterPath ?? "").trim());

  const isRemotePoster = (posterPath) =>
    /^https?:\/\//i.test(String(posterPath ?? "").trim());

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

  async function resolveApiPoster(movie) {
    const title = String(movie.title ?? "").trim();
    const year = String(movie.release_year ?? "").trim();
    const cacheKey = `${title.toLowerCase()}::${year}`;

    if (!title) {
      return "";
    }

    if (apiPosterCache.has(cacheKey)) {
      return apiPosterCache.get(cacheKey);
    }

    try {
      const results = await window.omdbApi.searchMovies(title);
      const exactMatch =
        results.find(
          (item) =>
            String(item.title ?? "").trim().toLowerCase() === title.toLowerCase() &&
            String(item.release_year ?? "") === year
        ) ||
        results.find((item) => String(item.release_year ?? "") === year) ||
        results[0];

      const posterUrl = String(exactMatch?.poster_url ?? "").trim();
      apiPosterCache.set(cacheKey, posterUrl);
      return posterUrl;
    } catch (error) {
      console.error("Could not resolve OMDb poster:", error);
      apiPosterCache.set(cacheKey, "");
      return "";
    }
  }

  async function decorateMovie(movie) {
    const storedPosterPath = String(movie.poster_path ?? "").trim();
    let apiPosterUrl = "";
    let customPosterUrl = "";

    if (isUploadedPoster(storedPosterPath)) {
      customPosterUrl = getPosterUrl(storedPosterPath);
      apiPosterUrl = await resolveApiPoster(movie);
    } else if (isRemotePoster(storedPosterPath)) {
      apiPosterUrl = storedPosterPath;
    } else {
      apiPosterUrl = await resolveApiPoster(movie);
    }

    return {
      ...movie,
      apiPosterUrl,
      customPosterUrl,
    };
  }

  function populateGenreFilter(genres) {
    const currentValue = genreFilter.value;
    genreFilter.innerHTML = '<option value="">All Genres</option>';

    (genres || []).forEach((genre) => {
      genreFilter.insertAdjacentHTML(
        "beforeend",
        `<option value="${escapeHtml(genre)}">${escapeHtml(genre)}</option>`
      );
    });

    genreFilter.value = currentValue;
    genreOptionsLoaded = true;
  }

  function getFilters() {
    return {
      search: searchInput.value.trim(),
      genre: genreFilter.value.trim(),
      watched: statusFilter.value === "" ? "" : statusFilter.value.trim(),
      page: currentPage,
      per_page: pageSize,
    };
  }

  async function loadMovies(filters = getFilters(), options = {}) {
    const params = new URLSearchParams();

    if (filters.search) {
      params.set("search", filters.search);
    }

    if (filters.genre) {
      params.set("genre", filters.genre);
    }

    if (filters.watched !== "" && filters.watched !== null && filters.watched !== undefined) {
      params.set("watched", filters.watched);
    }

    params.set("page", String(filters.page ?? currentPage));
    params.set("per_page", String(filters.per_page ?? pageSize));

    try {
      const response = await fetch(`${apiUrl}?${params.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Unable to load movies.");
      }

      if (!genreOptionsLoaded || options.refreshGenres) {
        populateGenreFilter(result.genres || []);
      }

      currentPage = Number(result.pagination?.page ?? 1);
      pageSize = Number(result.pagination?.per_page ?? pageSize);
      totalPages = Number(result.pagination?.total_pages ?? 1);
      totalItems = Number(result.pagination?.total_items ?? (result.data || []).length);
      pageSizeFilter.value = String(pageSize);
      movies = await Promise.all((result.data || []).map(decorateMovie));
      renderMovies(movies);
    } catch (error) {
      console.error("Could not fetch movies:", error);
      movieGrid.innerHTML = `<p class="empty">${escapeHtml(error.message || "Error loading movies from database.")}</p>`;
      paginationBar.innerHTML = "";
    }
  }

  function renderMovies(data) {
    if (!data.length) {
      movieGrid.innerHTML = "<p class='empty'>No movies found.</p>";
      renderPagination();
      return;
    }

    movieGrid.innerHTML = data
      .map((movie) => {
        const mainPoster = movie.apiPosterUrl || movie.customPosterUrl || posterPlaceholder;
        const customPosterHtml = movie.customPosterUrl
          ? `<div class="card-poster-side"><img class="card-poster-custom" src="${escapeHtml(movie.customPosterUrl)}" alt="${escapeHtml(movie.title)} custom poster"></div>`
          : "";

        return `
          <div class="movie-card" data-id="${movie.id}">
            <div class="card-poster ${movie.customPosterUrl ? "has-custom-poster" : ""}">
              <img class="card-poster-main" src="${escapeHtml(mainPoster)}" alt="${escapeHtml(movie.title)}">
              ${customPosterHtml}
            </div>
            <div class="card-info">
              <h3>${escapeHtml(movie.title)}</h3>
              <p class="meta">${escapeHtml(movie.release_year)} &middot; ${escapeHtml(movie.genre || "")}</p>
              <div class="status ${movie.watched == 1 ? "watched" : ""}">
                ${movie.watched == 1 ? "Watched" : "Not Watched"}
              </div>
            </div>
          </div>
        `;
      })
      .join("");

    document.querySelectorAll(".movie-card").forEach((card) => {
      card.addEventListener("click", () => {
        const id = card.getAttribute("data-id");
        const movie = movies.find((item) => item.id == id);
        if (movie) {
          openMovieDetails(movie);
        }
      });
    });

    renderPagination();
  }

  function renderPagination() {
    if (totalItems <= pageSize || totalPages <= 1) {
      paginationBar.innerHTML = "";
      return;
    }

    const buttons = [];
    buttons.push(
      `<button class="pagination-btn" ${currentPage === 1 ? "disabled" : ""} data-page="${currentPage - 1}">Prev</button>`
    );

    for (let page = 1; page <= totalPages; page += 1) {
      buttons.push(
        `<button class="pagination-btn ${page === currentPage ? "active" : ""}" data-page="${page}">${page}</button>`
      );
    }

    buttons.push(
      `<button class="pagination-btn" ${currentPage === totalPages ? "disabled" : ""} data-page="${currentPage + 1}">Next</button>`
    );

    paginationBar.innerHTML = `
      ${buttons.join("")}
      <div class="pagination-summary">Showing ${Math.min((currentPage - 1) * pageSize + 1, totalItems)}-${Math.min(currentPage * pageSize, totalItems)} of ${totalItems} movies</div>
    `;

    paginationBar.querySelectorAll(".pagination-btn[data-page]").forEach((button) => {
      button.addEventListener("click", () => {
        if (button.disabled) {
          return;
        }

        currentPage = Number(button.getAttribute("data-page")) || 1;
        loadMovies(getFilters());
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
  }

  window.moviePosterUI = {
    setMovie(movie) {
      if (!omdbPosterInput) {
        return;
      }

      omdbPosterInput.value = isRemotePoster(movie?.poster_path) ? String(movie.poster_path) : "";
    },
    setApiPoster(url) {
      if (omdbPosterInput) {
        omdbPosterInput.value = url || "";
      }
    },
    reset() {
      if (omdbPosterInput) {
        omdbPosterInput.value = "";
      }
    },
  };

  function resetForm() {
    movieForm.reset();
    movieIdInput.value = "";
    currentEditingMovie = null;
    modalTitle.textContent = "Add New Film";
    saveBtn.textContent = "Save Film";
    posterInput.required = false;
    posterInput.disabled = false;
    window.moviePosterUI?.reset();
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const movieId = movieIdInput.value.trim();
    const posterFile = posterInput.files[0] ?? null;
    if (!validatePosterFile(posterFile)) {
      return;
    }

    const payload = {
      title: document.getElementById("title").value.trim(),
      release_year: parseInt(document.getElementById("release_year").value, 10) || null,
      duration_minutes: parseInt(document.getElementById("duration_minutes").value, 10) || null,
      genre: document.getElementById("genre").value.trim(),
      description: document.getElementById("description").value.trim(),
      poster_path: omdbPosterInput?.value.trim() || "",
      trailer_url: document.getElementById("trailer_url").value.trim(),
      rating: parseInt(document.getElementById("rating").value, 10) || null,
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

      success = await updateMovie(parseInt(movieId, 10), payload, posterFile);
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
      } catch (error) {
        console.error(error);
        alert("Could not save movie. Please try again.");
      }
    }

    if (success) {
      await loadMovies(getFilters());
      modal.classList.remove("active");
      resetForm();
      closePanel();
    }
  }

  function openMovieDetails(movie) {
    const mainPoster = movie.apiPosterUrl || movie.customPosterUrl || posterPlaceholder;
    const customPosterHtml = movie.customPosterUrl
      ? `
        <div class="detail-custom-poster-wrap">
          <span class="detail-custom-label">Custom Poster</span>
          <img class="detail-custom-poster" src="${escapeHtml(movie.customPosterUrl)}" alt="${escapeHtml(movie.title)} custom poster">
        </div>
      `
      : "";

    const trailerHtml = movie.trailer_url
      ? `
        <div class="detail-trailer-row">
          <span class="detail-trailer-label">Trailer</span>
          <a class="detail-link" href="${escapeHtml(movie.trailer_url)}" target="_blank" rel="noopener noreferrer">Watch trailer</a>
        </div>
      `
      : "";

    const ratingHtml = movie.rating
      ? `<div class="detail-block"><strong>Rating:</strong> ${escapeHtml(movie.rating)}/10</div>`
      : "";

    const notesHtml = movie.notes
      ? `<div class="detail-block"><strong>Notes:</strong> ${escapeHtml(movie.notes)}</div>`
      : "";

    detailContent.innerHTML = `
      <div class="detail-poster-stack">
        <img class="detail-poster" src="${escapeHtml(mainPoster)}" alt="${escapeHtml(movie.title)}">
        ${customPosterHtml}
      </div>
      <h2>${escapeHtml(movie.title)}</h2>
      <p class="detail-meta">${escapeHtml(movie.release_year)} &middot; ${escapeHtml(movie.genre || "Unknown")} &middot; ${escapeHtml(movie.duration_minutes)} min</p>
      <p class="detail-description">${escapeHtml(movie.description || "No description available.")}</p>
      <div class="detail-block"><strong>Status:</strong> ${movie.watched == 1 ? "Watched" : "Not Watched"}</div>
      ${trailerHtml}
      ${ratingHtml}
      ${notesHtml}
    `;

    detailPanel.classList.add("active");
    panelOverlay.classList.add("active");

    renderDetailActions(
      movie,
      (selectedMovie) => {
        closePanel();
        currentEditingMovie = selectedMovie;
        openEditModal(selectedMovie);
      },
      async (selectedMovie) => {
        const success = await deleteMovie(selectedMovie.id, selectedMovie.title);
        if (success) {
          await loadMovies(getFilters());
          closePanel();
        }
      }
    );
  }

  function closePanel() {
    detailPanel.classList.remove("active");
    panelOverlay.classList.remove("active");
  }

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

  movieForm.addEventListener("submit", handleSubmit);

  posterInput.addEventListener("change", () => {
    validatePosterFile(posterInput.files[0] ?? null);
  });

  searchInput.addEventListener("input", () => {
    clearTimeout(searchDebounceId);
    currentPage = 1;
    searchDebounceId = setTimeout(() => loadMovies(getFilters()), 250);
  });

  genreFilter.addEventListener("change", () => {
    currentPage = 1;
    loadMovies(getFilters());
  });

  statusFilter.addEventListener("change", () => {
    currentPage = 1;
    loadMovies(getFilters());
  });

  pageSizeFilter.addEventListener("change", () => {
    pageSize = Number(pageSizeFilter.value) || 5;
    currentPage = 1;
    loadMovies(getFilters());
  });

  document.getElementById("closePanelBtn").addEventListener("click", closePanel);
  panelOverlay.addEventListener("click", closePanel);

  loadMovies({}, { refreshGenres: true });
});
