<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as the OMDb API. API keys are stored in .env and accessed via config().
    |
    */

    'omdb' => [
        'key' => env('OMDB_API_KEY', ''),
        'base_url' => 'https://www.omdbapi.com/',
    ],

];
