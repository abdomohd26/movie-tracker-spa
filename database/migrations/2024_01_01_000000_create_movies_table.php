<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Database migration for the movies table.
 * Replaces the raw SQL schema (schema.sql) with a Laravel migration.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('movies', function (Blueprint $table) {
            $table->id();
            $table->string('title', 255);
            $table->text('description')->nullable();
            $table->string('genre', 100)->nullable();
            $table->integer('release_year')->nullable();
            $table->integer('duration_minutes')->nullable();
            $table->string('director', 255)->nullable();
            $table->text('cast')->nullable();
            $table->string('language', 50)->nullable();
            $table->string('country', 100)->nullable();
            $table->text('poster_path')->nullable();
            $table->text('trailer_url')->nullable();
            $table->integer('rating')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('watched')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('movies');
    }
};
