{{-- Movies index page — extends the master Blade layout --}}
@extends('layouts.app')

@section('title', 'My Movie Collection')

@section('content')

{{-- Movie Grid — populated by JavaScript --}}
<div class="movie-grid" id="movieGrid"></div>
<div class="pagination-bar" id="paginationBar"></div>

{{-- Add / Edit Movie Modal --}}
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
                    <label for="poster">Poster Image</label>
                    <input
                        type="file"
                        id="poster"
                        name="poster"
                        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    >
                </div>

                <div class="form-group">
                    <label for="trailer_url">Trailer URL</label>
                    <input
                        type="text"
                        id="trailer_url"
                        name="trailer_url"
                        placeholder="https://youtube.com/watch?v=..."
                    >
                </div>

                <div class="form-group">
                    <label for="rating">Rating (1-10)</label>
                    <input type="number" id="rating" name="rating" min="1" max="10">
                </div>

                <div class="form-group">
                    <label for="notes">Notes</label>
                    <textarea id="notes" name="notes" rows="2" placeholder="Your notes about this film..."></textarea>
                </div>

                <div class="form-group checkbox-group">
                    <input type="checkbox" id="watched" name="watched" value="1">
                    <label for="watched">I have watched this film</label>
                </div>

                {{-- Server-side validation error messages --}}
                <div id="serverErrors" class="server-errors" style="display:none;"></div>

                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" id="cancelModalBtn">Cancel</button>
                    <button type="submit" class="btn btn-primary" id="saveBtn">Save Film</button>
                </div>

            </form>
        </div>
    </div>
</div>

{{-- Movie Detail Side Panel --}}
<div class="detail-panel" id="detailPanel">
    <button class="close-panel-btn" id="closePanelBtn">&times;</button>
    <div class="detail-content" id="detailContent"></div>
</div>

<div class="panel-overlay" id="panelOverlay"></div>

@endsection
