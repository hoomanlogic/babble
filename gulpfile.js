var gulp = require('gulp');
var less = require('gulp-less');
var concat = require('gulp-concat');
var minifyCSS = require('gulp-minify-css');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var plumber = require('gulp-plumber');
var gutil = require('gulp-util');
var shell = require('gulp-shell');

var onError = function (err) {  
    gutil.beep();
    console.log(err);
};

var buildPaths = ['src/*.js'];

// TASK: Build
gulp.task('build', ['test','build-full','build-min','build-less'], function () {
    return gulp.src(buildPaths)
        .pipe(plumber({
            errorHandler: onError
        }));
});

// TASK: Test
gulp.task('test', function () {
    return gulp.src('')
        .pipe(shell('mocha test'));
});

gulp.task('build-full', function () {
    return gulp.src(buildPaths)
        .pipe(plumber({
            errorHandler: onError
        }))
        .pipe(concat('babble.js'))
        .pipe(gulp.dest('dist'))
        .pipe(gulp.dest('demo/js'))
});

gulp.task('build-min', function () {
    return gulp.src(buildPaths)
        .pipe(plumber({
            errorHandler: onError
        }))
        .pipe(rename(function (path) {
            path.basename += '.min';
        }))
        .pipe(uglify())
        .pipe(gulp.dest('dist'))
        .pipe(concat('babble.min.js'))
        .pipe(gulp.dest('dist'))
        .pipe(gulp.dest('demo/js'))
});

// TASK: Compile LESS source
gulp.task('build-less', function () {
    return gulp.src(['demo/less/boilerstrapalize.less', 'demo/less/main.less'])
        .pipe(plumber({
            errorHandler: onError
        }))
        .pipe(concat('style.css'))
        .pipe(less())
        .pipe(gulp.dest('demo/css'))
        .pipe(rename(function (path) {
            path.basename += '.min';
        }))
        .pipe(minifyCSS())
        .pipe(gulp.dest('demo/css'))
        .pipe(gulp.dest('../pages/babble/css'));
});

// TASK: Sync GitHub Pages
gulp.task('sync-gh-page', function () {
    return gulp.src(['demo/index.html'])
        .pipe(gulp.dest('../pages/babble'));
});

gulp.task('sync-gh-page-js', function () {
    return gulp.src(['demo/js/*.js'])
        .pipe(gulp.dest('../pages/babble/js'));
});

gulp.task('sync-gh-page-css', function () {
    return gulp.src(['demo/css/*.css'])
        .pipe(gulp.dest('../pages/babble/css'));
});

gulp.task('sync-gh-page-media', function () {
    return gulp.src(['demo/media/**'])
        .pipe(gulp.dest('../pages/babble/media'));
});

// TASK: Watch Files
gulp.task('watch', function () {

    // Watch for updates to javascript
    var jsWatcher = gulp.watch(buildPaths, ['build-full', 'build-min']);
    jsWatcher.on('change', function (event) {
        console.log('File ' + event.path + ' was ' + event.type + ', running task...');
    });
    
    // Watch for updates to test files
    var testWatcher = gulp.watch('test/test.js', ['test']);
    jsWatcher.on('change', function (event) {
        console.log('File ' + event.path + ' was ' + event.type + ', running task...');
    });
    
    // Watch for updates to LESS files
    var demoWatcher = gulp.watch(['demo/less/*.less'], ['build-less']);
    jsWatcher.on('change', function (event) {
        console.log('File ' + event.path + ' was ' + event.type + ', running task...');
    });
    
    // Watch for updates to demo page
    var demoWatcher = gulp.watch(['demo/index.html', 'demo/js/*.js', 'demo/css/*.css', 'demo/media/***'], ['sync-gh-page', 'sync-gh-page-js', 'sync-gh-page-css', 'sync-gh-page-media']);
    jsWatcher.on('change', function (event) {
        console.log('File ' + event.path + ' was ' + event.type + ', running task...');
    });
});