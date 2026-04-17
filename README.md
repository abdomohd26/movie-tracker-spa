# 🎬 Movie Tracker SPA — Setup Guide

This guide will help you run the project locally and test all backend APIs.

---

## 📦 Prerequisites

Make sure you have installed:

* **XAMPP** (or WAMP) — [Watch this setup tutorial](https://www.youtube.com/live/zwFYqyonsOk?si=y-c8mToRUZjQSWMn)
* **Git**
* **Postman**
* **Visual Studio Code**

---

## 🚀 Step 1 — Clone the Repository

Open terminal and run:

```bash
cd C:\xampp\htdocs
git clone https://github.com/abdomohd26/movie-tracker-spa
```

👉 Make sure the project folder is inside:

```
htdocs/movie-tracker-spa
```

---

## 🖥️ Step 2 — Open Project

* Open **Visual Studio Code**
* Click **File → Open Folder**
* Select:

```
movie-tracker-spa
```

---

## 🟢 Step 3 — Start Server

Open **XAMPP Control Panel** and start:

* ✅ Apache
* ✅ MySQL

---

## 🗄️ Step 4 — Import Database

1. Go to:

```
http://localhost/phpmyadmin
```

2. Create database:

```
movie_tracker
```

3. Import the SQL file (if provided)
   OR run the schema manually.

---

## 📡 Step 5 — Import Postman Collection

1. Open **Postman**
2. Click **Import**
3. Select file:

```
Movie_Tracker.postman_collection.json
```

---

## 🧪 Step 6 — Test API Endpoints

Base URL:

```
http://localhost/movie-tracker-spa/backend/DB_Ops.php
```

---

### ✅ 1. GET — Get All Movies
### ✅ 2. POST — Add Movie
### ✅ 3. PUT — Update Movie
### ✅ 4. DELETE — Delete Movie



## ⚠️ Notes
* There is **success** example in each endpoint
* All requests use **JSON body**



## 📩 If you face issues

* Check Apache & MySQL are running
* Verify correct folder inside `htdocs`
* Check database name (`movie_tracker`)
* Confirm Postman headers

---

Good luck 🚀
