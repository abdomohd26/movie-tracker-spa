/**
 * Member 6: Third-Party API (OMDb)
 * Sends AJAX requests to backend/API_Ops.php only; the OMDb key never reaches JS.
 */

window.omdbApi = (() => {
  const apiUrl = "../backend/API_Ops.php";

  const parseJsonResponse = async (response) => {
    const payload = await response.json().catch(() => ({}));

    if (!response.ok || payload.success === false) {
      throw new Error(payload.message || "Unable to fetch movie data right now.");
    }

    return payload;
  };

  const searchMovies = async (query) => {
    const response = await fetch(
      `${apiUrl}?action=search&query=${encodeURIComponent(query)}`,
      { headers: { Accept: "application/json" } }
    );

    const payload = await parseJsonResponse(response);
    return payload.data || payload.movies || [];
  };

  const getMovieDetails = async (imdbId) => {
    const response = await fetch(
      `${apiUrl}?action=details&imdb_id=${encodeURIComponent(imdbId)}`,
      { headers: { Accept: "application/json" } }
    );

    const payload = await parseJsonResponse(response);
    return payload.data || payload.movie || null;
  };

  return { searchMovies, getMovieDetails };
})();

document.addEventListener("DOMContentLoaded", () => {
  const movieForm = document.getElementById("movieForm");
  const modalBody = document.querySelector("#addMovieModal .modal-body");

  if (!movieForm || !modalBody || !window.omdbApi) {
    return;
  }

  const omdbTools = document.createElement("div");
  omdbTools.className = "form-group omdb-tools";
  omdbTools.innerHTML = `
    <label for="omdbSearchInput">Search OMDb</label>
    <div class="omdb-search-row">
      <input type="text" id="omdbSearchInput" placeholder="Search by movie title...">
      <button type="button" class="btn btn-secondary" id="omdbSearchBtn">Search</button>
    </div>
    <p class="omdb-message" id="omdbMessage" aria-live="polite"></p>
    <div class="omdb-results" id="omdbResults"></div>
    <input type="hidden" id="omdbPosterPath" name="poster_path">
  `;

  movieForm.insertAdjacentElement("afterbegin", omdbTools);

  const searchInput = document.getElementById("omdbSearchInput");
  const searchBtn = document.getElementById("omdbSearchBtn");
  const message = document.getElementById("omdbMessage");
  const results = document.getElementById("omdbResults");

  const setMessage = (text, isError = false) => {
    message.textContent = text;
    message.classList.toggle("omdb-error", isError);
  };

  const escapeHtml = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const fillInput = (id, value) => {
    const input = document.getElementById(id);
    if (input && value !== null && value !== undefined) {
      input.value = value;
    }
  };

  const applyMovieDetails = (movie) => {
    if (!movie) {
      return;
    }

    fillInput("title", movie.title);
    fillInput("release_year", movie.release_year);
    fillInput("duration_minutes", movie.duration_minutes);
    fillInput("genre", movie.genre);
    fillInput("description", movie.description);
    fillInput("omdbPosterPath", movie.poster_url);
    fillInput("trailer_url", movie.trailer_url);
    fillInput("rating", movie.rating);

    const notesInput = document.getElementById("notes");
    if (notesInput) {
      const castLine = Array.isArray(movie.cast) && movie.cast.length
        ? `Cast: ${movie.cast.join(", ")}`
        : "";
      const countryLine = movie.country ? `Country: ${movie.country}` : "";
      const languageLine = movie.language ? `Language: ${movie.language}` : "";
      notesInput.value = [castLine, countryLine, languageLine].filter(Boolean).join("\n");
    }

    setMessage("Movie details added to the form.");
  };

  const renderResults = (movies) => {
    if (!movies.length) {
      results.innerHTML = "";
      setMessage("No matching movies found.", true);
      return;
    }

    results.innerHTML = movies
      .slice(0, 6)
      .map(
        (movie) => `
          <button type="button" class="omdb-result" data-imdb-id="${escapeHtml(movie.imdb_id)}">
            ${movie.poster_url ? `<img src="${escapeHtml(movie.poster_url)}" alt="">` : ""}
            <span>
              <strong>${escapeHtml(movie.title)}</strong>
              <small>${escapeHtml(movie.release_year || "Unknown year")}</small>
            </span>
          </button>
        `
      )
      .join("");

    results.querySelectorAll(".omdb-result").forEach((button) => {
      button.addEventListener("click", async () => {
        const imdbId = button.getAttribute("data-imdb-id");
        setMessage("Loading movie details...");

        try {
          const movie = await window.omdbApi.getMovieDetails(imdbId);
          applyMovieDetails(movie);
        } catch (error) {
          setMessage(error.message, true);
        }
      });
    });
  };

  const runSearch = async () => {
    const query = searchInput.value.trim();

    if (query.length < 2) {
      setMessage("Type at least 2 characters.", true);
      return;
    }

    searchBtn.disabled = true;
    setMessage("Searching OMDb...");
    results.innerHTML = "";

    try {
      const movies = await window.omdbApi.searchMovies(query);
      renderResults(movies);
    } catch (error) {
      setMessage(error.message, true);
    } finally {
      searchBtn.disabled = false;
    }
  };

  searchBtn.addEventListener("click", runSearch);
  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      runSearch();
    }
  });
});
