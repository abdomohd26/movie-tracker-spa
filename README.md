# 🎬 Movie Tracker — Laravel MVC

A movie tracking application built with **Laravel 11** following the MVC architectural pattern. Features include full CRUD operations, OMDb API integration, client-side and server-side validation, Blade master layout, and automated tests.

---

## 📦 Prerequisites

- **PHP** >= 8.2
- **Composer**
- **MySQL** (via XAMPP or standalone)
- **Git**

---

## 🚀 Setup Instructions

Open a terminal in the project directory and run these commands **in order**:

### 1. Install Dependencies

```bash
composer install
```

### 2. Configure Environment

```bash
cp .env.example .env
php artisan key:generate
```

### 3. Create Database

Create a MySQL database named `movie_tracker` (or update `.env` with your database credentials).

### 4. Run Migrations

```bash
php artisan migrate
```

### 5. Start the Development Server

```bash
php artisan serve
```

Visit: [http://localhost:8000](http://localhost:8000)

---

## 🧪 Running Tests

```bash
php artisan test
```

Tests use an in-memory SQLite database, so no database setup is needed for testing.

---

## 📁 Project Structure

```
app/
├── Http/Controllers/
│   ├── Controller.php          # Base controller
│   ├── MovieController.php     # Movie CRUD with server-side validation
│   └── OmdbController.php      # OMDb API integration controller
├── Models/
│   └── Movie.php               # Movie model with query scopes
├── Providers/
│   └── AppServiceProvider.php
└── Services/
    └── OmdbService.php         # OMDb API service class

resources/views/
├── layouts/
│   └── app.blade.php           # Master Blade layout
├── partials/
│   ├── header.blade.php        # Header partial
│   └── footer.blade.php        # Footer partial
└── movies/
    └── index.blade.php         # Main movie page

database/
├── migrations/                 # Laravel migrations
├── seeders/
└── database.sqlite             # SQLite database backup

tests/
├── Feature/
│   └── MovieCrudTest.php       # Feature tests (HTTP endpoints)
└── Unit/
    └── MovieValidationTest.php # Unit tests (validation rules)

routes/
├── web.php                     # Web routes (Movie CRUD)
└── api.php                     # API routes (OMDb integration)
```

---

## 🔑 Features

- **Laravel MVC Architecture** — Models, Controllers, Blade Views
- **Database Migrations** — Schema defined via Laravel migrations
- **Server-side Validation** — Laravel validation rules (required, max, min, url, etc.)
- **Client-side Validation** — JavaScript validation retained from Assignment 1
- **Master Blade Layout** — `layouts/app.blade.php` with header & footer partials
- **OMDb API Integration** — Service class with API key stored in `.env`
- **Automated Tests** — 6 test functions (3 Feature + 3 Unit) using PHPUnit

---

## 📩 Team Members

See `Team_Members.txt` for full team details.
