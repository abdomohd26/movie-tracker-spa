<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="<?php echo e(csrf_token()); ?>">
    <meta name="description" content="Track your movie collection — add, edit, search and manage films with OMDb integration.">
    <title><?php echo $__env->yieldContent('title', 'My Movie Collection'); ?></title>
    <link rel="stylesheet" href="<?php echo e(asset('css/style.css')); ?>">
</head>
<body>

    
    <?php echo $__env->make('partials.header', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>

    <main class="main-content">
        <?php echo $__env->yieldContent('content'); ?>
    </main>

    
    <?php echo $__env->make('partials.footer', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>

    
    <script src="<?php echo e(asset('js/API_Ops.js')); ?>"></script>
    <script src="<?php echo e(asset('js/edit.js')); ?>"></script>
    <script src="<?php echo e(asset('js/app.js')); ?>"></script>
</body>
</html>
<?php /**PATH C:\xampp\htdocs\movie-tracker-spa_1\movie-tracker-spa\resources\views/layouts/app.blade.php ENDPATH**/ ?>