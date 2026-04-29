<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Movie extends Model
{
    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'title',
        'description',
        'genre',
        'release_year',
        'duration_minutes',
        'director',
        'cast',
        'language',
        'country',
        'poster_path',
        'trailer_url',
        'rating',
        'notes',
        'watched',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'release_year'     => 'integer',
        'duration_minutes' => 'integer',
        'rating'           => 'integer',
        'watched'          => 'boolean',
    ];

    /*
    |--------------------------------------------------------------------------
    | Query Scopes
    |--------------------------------------------------------------------------
    */

    /**
     * Filter movies by title (partial match).
     */
    public function scopeFilterByTitle($query, ?string $title)
    {
        if ($title) {
            $query->where('title', 'LIKE', '%' . $title . '%');
        }

        return $query;
    }

    /**
     * Filter movies by genre (partial match).
     */
    public function scopeFilterByGenre($query, ?string $genre)
    {
        if ($genre) {
            $query->where('genre', 'LIKE', '%' . $genre . '%');
        }

        return $query;
    }

    /**
     * Filter movies by watched status.
     */
    public function scopeFilterByWatched($query, $watched)
    {
        if ($watched !== null && $watched !== '') {
            $query->where('watched', (int) $watched);
        }

        return $query;
    }
}
