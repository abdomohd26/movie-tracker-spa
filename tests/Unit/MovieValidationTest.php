<?php

namespace Tests\Unit;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Unit tests — test isolated validation logic.
 */
class MovieValidationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Unit Test: Rating must be between 1 and 10.
     *
     * Tests that the server-side validation rule rejects
     * a rating value outside the allowed range.
     */
    public function test_movie_rating_must_be_between_1_and_10(): void
    {
        // Rating too high (11)
        $response = $this->postJson('/movies', [
            'title'            => 'Test Movie',
            'genre'            => 'Comedy',
            'release_year'     => 2023,
            'duration_minutes' => 90,
            'rating'           => 11,
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['rating']);

        // Rating too low (0)
        $response = $this->postJson('/movies', [
            'title'            => 'Test Movie',
            'genre'            => 'Comedy',
            'release_year'     => 2023,
            'duration_minutes' => 90,
            'rating'           => 0,
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['rating']);
    }

    /**
     * Unit Test: Release year must be 1888 or later.
     */
    public function test_release_year_must_be_valid(): void
    {
        $response = $this->postJson('/movies', [
            'title'            => 'Test Movie',
            'genre'            => 'Drama',
            'release_year'     => 1800,
            'duration_minutes' => 90,
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['release_year']);
    }

    /**
     * Unit Test: Trailer URL must be a valid URL if provided.
     */
    public function test_trailer_url_must_be_valid_url(): void
    {
        $response = $this->postJson('/movies', [
            'title'            => 'Test Movie',
            'genre'            => 'Action',
            'release_year'     => 2023,
            'duration_minutes' => 120,
            'trailer_url'      => 'not-a-url',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['trailer_url']);
    }
}
