/**
 * Main Application JS — Movie Tracker
 * Adapted for Laravel routes with CSRF token support.
 * Client-side validation logic retained from Assignment 1.
 */

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

  // Laravel route URLs
  const apiUrl = "/";
  const movieUrl = "/movies";
  const allowedPosterTypes = ["image/jpeg", "image/png", "image/webp"];
  const maxPosterSizeBytes = 2 * 1024 * 1024;
  const posterPlaceholder =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 450'><rect width='300' height='450' fill='%23222228'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23a0a0a0' font-family='Arial' font-size='22'>No Poster</text></svg>";
  const apiPosterCache = new Map();

  const getCsrfToken = () => {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute("content") : "";
  };

  const escHtml = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const getPosterUrl = (posterPath) => {
    const p = String(posterPath ?? "").trim();
    if (!p) return posterPlaceholder;
    if (/^https?:\/\//i.test(p) || p.startsWith("data:")) return p;
    if (p.startsWith("../") || p.startsWith("./")) return p;
    return `/${p.replace(/^\/+/, "")}`;
  };

  const isUploadedPoster = (p) => /^(\.\.\/)?uploads\//i.test(String(p ?? "").trim());
  const isRemotePoster = (p) => /^https?:\/\//i.test(String(p ?? "").trim());

  /* ---- Client-side validation (retained from Assignment 1) ---- */
  const validatePosterFile = (file) => {
    if (!file) return true;
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
    if (!title) return "";
    if (apiPosterCache.has(cacheKey)) return apiPosterCache.get(cacheKey);
    try {
      const results = await window.omdbApi.searchMovies(title);
      const match =
        results.find((i) => String(i.title ?? "").trim().toLowerCase() === title.toLowerCase() && String(i.release_year ?? "") === year) ||
        results.find((i) => String(i.release_year ?? "") === year) ||
        results[0];
      const url = String(match?.poster_url ?? "").trim();
      apiPosterCache.set(cacheKey, url);
      return url;
    } catch (e) {
      apiPosterCache.set(cacheKey, "");
      return "";
    }
  }

  async function decorateMovie(movie) {
    const stored = String(movie.poster_path ?? "").trim();
    let apiPosterUrl = "", customPosterUrl = "";
    if (isUploadedPoster(stored)) {
      customPosterUrl = getPosterUrl(stored);
      apiPosterUrl = await resolveApiPoster(movie);
    } else if (isRemotePoster(stored)) {
      apiPosterUrl = stored;
    } else {
      apiPosterUrl = await resolveApiPoster(movie);
    }
    return { ...movie, apiPosterUrl, customPosterUrl };
  }

  function populateGenreFilter(genres) {
    const cur = genreFilter.value;
    genreFilter.innerHTML = '<option value="">All Genres</option>';
    (genres || []).forEach((g) => {
      genreFilter.insertAdjacentHTML("beforeend", `<option value="${escHtml(g)}">${escHtml(g)}</option>`);
    });
    genreFilter.value = cur;
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
    if (filters.search) params.set("search", filters.search);
    if (filters.genre) params.set("genre", filters.genre);
    if (filters.watched !== "" && filters.watched !== null && filters.watched !== undefined) params.set("watched", filters.watched);
    params.set("page", String(filters.page ?? currentPage));
    params.set("per_page", String(filters.per_page ?? pageSize));

    try {
      const response = await fetch(`${apiUrl}?${params.toString()}`, {
        headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message || "Unable to load movies.");
      if (!genreOptionsLoaded || options.refreshGenres) populateGenreFilter(result.genres || []);
      currentPage = Number(result.pagination?.page ?? 1);
      pageSize = Number(result.pagination?.per_page ?? pageSize);
      totalPages = Number(result.pagination?.total_pages ?? 1);
      totalItems = Number(result.pagination?.total_items ?? (result.data || []).length);
      pageSizeFilter.value = String(pageSize);
      movies = await Promise.all((result.data || []).map(decorateMovie));
      renderMovies(movies);
    } catch (error) {
      movieGrid.innerHTML = `<p class="empty">${escHtml(error.message || "Error loading movies.")}</p>`;
      paginationBar.innerHTML = "";
    }
  }

  function renderMovies(data) {
    if (!data.length) {
      movieGrid.innerHTML = "<p class='empty'>No movies found.</p>";
      renderPagination();
      return;
    }
    movieGrid.innerHTML = data.map((movie) => {
      const mainPoster = movie.apiPosterUrl || movie.customPosterUrl || posterPlaceholder;
      const customHtml = movie.customPosterUrl
        ? `<div class="card-poster-side"><img class="card-poster-custom" src="${escHtml(movie.customPosterUrl)}" alt="${escHtml(movie.title)} custom poster"></div>` : "";
      return `
        <div class="movie-card" data-id="${movie.id}">
          <div class="card-poster ${movie.customPosterUrl ? "has-custom-poster" : ""}">
            <img class="card-poster-main" src="${escHtml(mainPoster)}" alt="${escHtml(movie.title)}">
            ${customHtml}
          </div>
          <div class="card-info">
            <h3>${escHtml(movie.title)}</h3>
            <p class="meta">${escHtml(movie.release_year)} &middot; ${escHtml(movie.genre || "")}</p>
            <div class="status ${movie.watched == 1 ? "watched" : ""}">${movie.watched == 1 ? "Watched" : "Not Watched"}</div>
          </div>
        </div>`;
    }).join("");

    document.querySelectorAll(".movie-card").forEach((card) => {
      card.addEventListener("click", () => {
        const m = movies.find((i) => i.id == card.getAttribute("data-id"));
        if (m) openMovieDetails(m);
      });
    });
    renderPagination();
  }

  function renderPagination() {
    if (totalItems <= pageSize || totalPages <= 1) { paginationBar.innerHTML = ""; return; }
    const btns = [];
    btns.push(`<button class="pagination-btn" ${currentPage === 1 ? "disabled" : ""} data-page="${currentPage - 1}">Prev</button>`);
    for (let p = 1; p <= totalPages; p++) btns.push(`<button class="pagination-btn ${p === currentPage ? "active" : ""}" data-page="${p}">${p}</button>`);
    btns.push(`<button class="pagination-btn" ${currentPage === totalPages ? "disabled" : ""} data-page="${currentPage + 1}">Next</button>`);
    paginationBar.innerHTML = `${btns.join("")}<div class="pagination-summary">Showing ${Math.min((currentPage-1)*pageSize+1,totalItems)}-${Math.min(currentPage*pageSize,totalItems)} of ${totalItems} movies</div>`;
    paginationBar.querySelectorAll(".pagination-btn[data-page]").forEach((b) => {
      b.addEventListener("click", () => { if (!b.disabled) { currentPage = Number(b.getAttribute("data-page"))||1; loadMovies(getFilters()); window.scrollTo({top:0,behavior:"smooth"}); } });
    });
  }

  window.moviePosterUI = {
    setMovie(movie) { if (omdbPosterInput) omdbPosterInput.value = isRemotePoster(movie?.poster_path) ? String(movie.poster_path) : ""; },
    setApiPoster(url) { if (omdbPosterInput) omdbPosterInput.value = url || ""; },
    reset() { if (omdbPosterInput) omdbPosterInput.value = ""; },
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
    const errBox = document.getElementById("serverErrors");
    if (errBox) errBox.style.display = "none";
  }

  /* ---- Client-side validation before submit ---- */
  function validateForm() {
    const title = document.getElementById("title").value.trim();
    const genre = document.getElementById("genre").value.trim();
    const year = document.getElementById("release_year").value.trim();
    const dur = document.getElementById("duration_minutes").value.trim();
    const rating = document.getElementById("rating").value.trim();
    const trailer = document.getElementById("trailer_url").value.trim();

    if (!title) { alert("Title is required."); return false; }
    if (!genre) { alert("Genre is required."); return false; }
    if (!year || parseInt(year) < 1888) { alert("Release year must be 1888 or later."); return false; }
    if (!dur || parseInt(dur) < 1) { alert("Duration must be at least 1 minute."); return false; }
    if (rating && (parseInt(rating) < 1 || parseInt(rating) > 10)) { alert("Rating must be between 1 and 10."); return false; }
    if (trailer && !/^https?:\/\/.+/i.test(trailer)) { alert("Trailer URL must be a valid URL."); return false; }
    return true;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    // Client-side validation
    if (!validateForm()) return;

    const movieId = movieIdInput.value.trim();
    const posterFile = posterInput.files[0] ?? null;
    if (!validatePosterFile(posterFile)) return;

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
        if (noChanges) { alert("No changes made."); return; }
      }
      success = await updateMovie(parseInt(movieId, 10), payload, posterFile);
    } else {
      try {
        const formData = new FormData();
        formData.append("_token", getCsrfToken());
        Object.entries(payload).forEach(([key, value]) => {
          if (value !== null && value !== "") formData.append(key, value);
        });
        if (posterFile) formData.append("poster", posterFile);

        const response = await fetch(movieUrl, {
          method: "POST",
          headers: { "X-CSRF-TOKEN": getCsrfToken(), Accept: "application/json" },
          body: formData,
        });
        const result = await response.json();
        if (result.success) {
          alert(result.message || "Movie created");
          success = true;
        } else {
          if (result.errors) displayServerErrors(result.errors);
          alert(result.message || "Unable to save movie.");
        }
      } catch (error) {
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
    const customHtml = movie.customPosterUrl
      ? `<div class="detail-custom-poster-wrap"><span class="detail-custom-label">Custom Poster</span><img class="detail-custom-poster" src="${escHtml(movie.customPosterUrl)}" alt="${escHtml(movie.title)} custom poster"></div>` : "";
    const trailerHtml = movie.trailer_url
      ? `<div class="detail-trailer-row"><span class="detail-trailer-label">Trailer</span><a class="detail-link" href="${escHtml(movie.trailer_url)}" target="_blank" rel="noopener noreferrer">Watch trailer</a></div>` : "";
    const ratingHtml = movie.rating ? `<div class="detail-block"><strong>Rating:</strong> ${escHtml(movie.rating)}/10</div>` : "";
    const notesHtml = movie.notes ? `<div class="detail-block"><strong>Notes:</strong> ${escHtml(movie.notes)}</div>` : "";

    detailContent.innerHTML = `
      <div class="detail-poster-stack"><img class="detail-poster" src="${escHtml(mainPoster)}" alt="${escHtml(movie.title)}">${customHtml}</div>
      <h2>${escHtml(movie.title)}</h2>
      <p class="detail-meta">${escHtml(movie.release_year)} &middot; ${escHtml(movie.genre || "Unknown")} &middot; ${escHtml(movie.duration_minutes)} min</p>
      <p class="detail-description">${escHtml(movie.description || "No description available.")}</p>
      <div class="detail-block"><strong>Status:</strong> ${movie.watched == 1 ? "Watched" : "Not Watched"}</div>
      ${trailerHtml}${ratingHtml}${notesHtml}`;

    detailPanel.classList.add("active");
    panelOverlay.classList.add("active");
    renderDetailActions(movie,
      (m) => { closePanel(); currentEditingMovie = m; openEditModal(m); },
      async (m) => { const ok = await deleteMovie(m.id, m.title); if (ok) { await loadMovies(getFilters()); closePanel(); } }
    );
  }

  function closePanel() {
    detailPanel.classList.remove("active");
    panelOverlay.classList.remove("active");
  }

  openBtn.addEventListener("click", () => { resetForm(); modal.classList.add("active"); });
  closeBtn.addEventListener("click", () => { modal.classList.remove("active"); resetForm(); });
  cancelBtn.addEventListener("click", () => { modal.classList.remove("active"); resetForm(); });
  movieForm.addEventListener("submit", handleSubmit);
  posterInput.addEventListener("change", () => { validatePosterFile(posterInput.files[0] ?? null); });
  searchInput.addEventListener("input", () => { clearTimeout(searchDebounceId); currentPage = 1; searchDebounceId = setTimeout(() => loadMovies(getFilters()), 250); });
  genreFilter.addEventListener("change", () => { currentPage = 1; loadMovies(getFilters()); });
  statusFilter.addEventListener("change", () => { currentPage = 1; loadMovies(getFilters()); });
  pageSizeFilter.addEventListener("change", () => { pageSize = Number(pageSizeFilter.value) || 5; currentPage = 1; loadMovies(getFilters()); });
  document.getElementById("closePanelBtn").addEventListener("click", closePanel);
  panelOverlay.addEventListener("click", closePanel);

  loadMovies({}, { refreshGenres: true });
});
