var gulp = require('gulp');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');

gulp.task('package', function() {
    return gulp.src('./src/**/*.js')
        .pipe(concat('trak.js'))
        .pipe(gulp.dest('./build'));
});

gulp.task('default', function() {
    return gulp.src('./src/**/*.js')
        .pipe(concat('trak.js'))
        .pipe(gulp.dest('./build'))
        .pipe(rename({suffix: '.min'}))
        .pipe(uglify())
        .pipe(gulp.dest('./build'));
});