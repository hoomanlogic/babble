var gulp = require('gulp');
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
gulp.task('build', ['test'], function () {
    return gulp.src(buildPaths)
        .pipe(plumber({
            errorHandler: onError
        }))
        .pipe(rename(function (path) {
            path.basename += '.min';
        }))
        .pipe(uglify())
        .pipe(gulp.dest('dist'))
		.pipe(gulp.dest('../pages/babble/dist'));
});
gulp.task('test', function () {
    return gulp.src('')
        .pipe(shell('mocha test'));
});

gulp.task('watch', function () {

    // Watch for updates to javascript
    var jsWatcher = gulp.watch(buildPaths, ['build']);
    jsWatcher.on('change', function (event) {
        console.log('File ' + event.path + ' was ' + event.type + ', running task...');
    });
    
    // Watch for updates to test files
    var testWatcher = gulp.watch('test/test.js', ['test']);
    jsWatcher.on('change', function (event) {
        console.log('File ' + event.path + ' was ' + event.type + ', running task...');
    });
});