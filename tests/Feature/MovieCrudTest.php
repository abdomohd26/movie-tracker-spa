<?php

namespace Tests\Feature;

use App\Models\Movie;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Feature tests — test HTTP endpoints end-to-end.
 *
 * These tests verify that submitting forms, receiving responses,
 * and asserting database records work correctly.
 */
class MovieCrudTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Feature Test 1: Creating a movie via POST stores it in the database.
     *
     * This test sends a POST request with valid movie data,
     * verifies a successful JSON response, and asserts
     * that the record was actually created in the database.
     */
    public function test_can_create_movie_via_post(): void
    {
        $movieData = [
            'title'            => 'The Shawshank Redemption',
            'genre'            => 'Drama',
            'release_year'     => 1994,
            'duration_minutes' => 142,
            'description'      => 'Two imprisoned men bond over a number of years.',
            'rating'           => 9,
            'watched'          => true,
        ];

        $response = $this->postJson('/movies', $movieData);

        // Assert successful creation response
        $response->assertStatus(201)
                 ->assertJson([
                     'success' => true,
                     'message' => 'Movie created',
                 ])
                 ->assertJsonPath('data.title', 'The Shawshank Redemption');

        // Assert the record exists in the database
        $this->assertDatabaseHas('movies', [
            'title'        => 'The Shawshank Redemption',
            'genre'        => 'Drama',
            'release_year' => 1994,
        ]);
    }

    /**
     * Feature Test 2: Store endpoint requires title (server-side validation).
     *
     * This test sends a POST request without a title and verifies
     * that Laravel's server-side validation rejects it with a 422 status.
     */
    public function test_store_requires_title_validation(): void
    {
        $movieData = [
            // 'title' is intentionally missing
            'genre'            => 'Action',
            'release_year'     => 2023,
            'duration_minutes' => 120,
        ];

        $response = $this->postJson('/movies', $movieData);

        // Assert validation error (422 Unprocessable Entity)
        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['title']);

        // Assert no movie was created
        $this->assertDatabaseCount('movies', 0);
    }

    /**
     * Feature Test 3: Can delete a movie via DELETE endpoint.
     */
    public function test_can_delete_movie(): void
    {
        $movie = Movie::create([
            'title'            => 'Movie To Delete',
            'genre'            => 'Horror',
            'release_year'     => 2020,
            'duration_minutes' => 90,
            'watched'          => false,
        ]);

        $response = $this->deleteJson("/movies/{$movie->id}");

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'message' => 'Movie deleted',
                 ]);

        $this->assertDatabaseMissing('movies', ['id' => $movie->id]);
    }
}
