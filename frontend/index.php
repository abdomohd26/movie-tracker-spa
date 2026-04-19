<?php include 'header.php'; ?>

<div class="movie-grid" id="movieGrid"></div>

<div class="modal-overlay" id="addMovieModal">
    <div class="modal-content">
        <div class="modal-header">
            <h2 id="modalTitle">Add New Film</h2>
            <button class="close-btn" id="closeModalBtn">&times;</button>
        </div>
        <div class="modal-body">
            <form id="movieForm">

                <input type="hidden" id="movieId" name="movieId">
                
                <div class="form-group">
                    <label for="title">Title *</label>
                    <input type="text" id="title" name="title" required>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="release_year">Release Year *</label>
                        <input type="number" id="release_year" name="release_year" required min="1888">
                    </div>

                    <div class="form-group">
                        <label for="duration_minutes">Duration (mins) *</label>
                        <input type="number" id="duration_minutes" name="duration_minutes" required min="1">
                    </div>
                </div>

                <div class="form-group">
                    <label for="genre">Genre *</label>
                    <input type="text" id="genre" name="genre" required>
                </div>

                <div class="form-group">
                    <label for="description">Description</label>
                    <textarea id="description" name="description" rows="3"></textarea>
                </div>

                <div class="form-group">
                    <label for="poster_path">Poster Image URL</label>
                    <input
                        type="text"
                        id="poster_path"
                        name="poster_path"
                        placeholder="https://example.com/image.jpg"
                    >
                </div>

                <div class="form-group checkbox-group">
                    <input type="checkbox" id="watched" name="watched" value="1">
                    <label for="watched">I have watched this film</label>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" id="cancelModalBtn">Cancel</button>
                    <button type="submit" class="btn btn-primary" id="saveBtn">Save Film</button>
                </div>

            </form>
        </div>
    </div>
</div>


<div class="detail-panel" id="detailPanel">
    <button class="close-panel-btn" id="closePanelBtn">&times;</button>
    <div class="detail-content" id="detailContent">
        </div>
</div>

<div class="panel-overlay" id="panelOverlay"></div>

<?php include 'footer.php'; ?>