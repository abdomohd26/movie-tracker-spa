
<header class="main-header">
    <div class="header-container">
        <div class="logo">MovieDb</div>

        <div class="toolbar-filters">
            <div class="search-container">
                <input type="text" id="searchInput" placeholder="Search movies by title...">
            </div>
            <select id="genreFilter" class="filter-select">
                <option value="">All Genres</option>
            </select>
            <select id="statusFilter" class="filter-select">
                <option value="">All Status</option>
                <option value="1">Watched</option>
                <option value="0">Not Watched</option>
            </select>
            <select id="pageSizeFilter" class="filter-select page-size-select">
                <option value="5" selected>5 per page</option>
                <option value="10">10 per page</option>
                <option value="15">15 per page</option>
            </select>
        </div>

        <nav class="nav-actions">
            <button class="btn btn-primary" id="openAddModalBtn">+ Add Film</button>
        </nav>
    </div>
</header>
<?php /**PATH C:\xampp\htdocs\movie-tracker-spa_1\movie-tracker-spa\resources\views/partials/header.blade.php ENDPATH**/ ?>