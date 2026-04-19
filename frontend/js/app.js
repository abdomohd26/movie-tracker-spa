document.addEventListener("DOMContentLoaded", () => {
  let movies = [];
  const movieGrid = document.getElementById("movieGrid");
  const searchInput = document.getElementById("searchInput");

  const modal = document.getElementById("addMovieModal");
  const openBtn = document.getElementById("openAddModalBtn");
  const closeBtn = document.getElementById("closeModalBtn");
  const cancelBtn = document.getElementById("cancelModalBtn");

  const detailPanel = document.getElementById("detailPanel");
  const panelOverlay = document.getElementById("panelOverlay");
  const detailContent = document.getElementById("detailContent");

  openBtn.addEventListener("click", () => {
    modal.classList.add("active");
  });

  closeBtn.addEventListener("click", () => {
    modal.classList.remove("active");
  });

  cancelBtn.addEventListener("click", () => {
    modal.classList.remove("active");
  });

  const loadMovies = async () => {
    try {
      const response = await fetch("../backend/DB_Ops.php?action=getMovies");
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
      movie.title.toLowerCase().includes(value),
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
                <img src="${movie.poster_path}" 
                     alt="${movie.title}">
            </div>

            <div class="card-info">
                <h3>${movie.title}</h3>
                <p class="meta">${movie.release_year} • ${movie.genre || ""}</p>
                
                <div class="status ${movie.watched == 1 ? "watched" : ""}">
                    ${movie.watched == 1 ? "✔ Watched" : "Not Watched"}
                </div>
            </div>
        </div>
    `,
      )
      .join("");

    setTimeout(() => {
      document.querySelectorAll(".movie-card").forEach((card) => {
        card.addEventListener("click", () => {
          const id = card.getAttribute("data-id");
          const movie = movies.find((m) => m.id == id);

          openMovieDetails(movie);
        });
      });
    }, 0);
  };

  document.getElementById("movieForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const form = document.getElementById("movieForm");
    const formData = new FormData(form);

    formData.set("watched", document.getElementById("watched").checked ? 1 : 0);

    try {
      const response = await fetch("../backend/DB_Ops.php", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        await loadMovies();
        modal.classList.remove("active");
        form.reset();
      } else {
        alert(result.message);
      }
    } catch (err) {
      console.error(err);
    }
  });

  function openMovieDetails(movie) {
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
    `;

    detailPanel.classList.add("active");
    panelOverlay.classList.add("active");
  }

  document
    .getElementById("closePanelBtn")
    .addEventListener("click", closePanel);
  panelOverlay.addEventListener("click", closePanel);

  function closePanel() {
    detailPanel.classList.remove("active");
    panelOverlay.classList.remove("active");
  }

  loadMovies();
});
