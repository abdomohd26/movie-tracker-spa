<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="description" content="Track your movie collection — add, edit, search and manage films with OMDb integration.">
    <title>@yield('title', 'My Movie Collection')</title>
    <link rel="stylesheet" href="{{ asset('css/style.css') }}">
</head>
<body>

    {{-- Header included via Blade partial --}}
    @include('partials.header')

    <main class="main-content">
        @yield('content')
    </main>

    {{-- Footer included via Blade partial --}}
    @include('partials.footer')

    {{-- JavaScript files --}}
    <script src="{{ asset('js/API_Ops.js') }}"></script>
    <script src="{{ asset('js/edit.js') }}"></script>
    <script src="{{ asset('js/app.js') }}"></script>
</body>
</html>
