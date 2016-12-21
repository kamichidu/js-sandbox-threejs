import gulp from 'gulp';
import webpack from 'webpack-stream';

gulp.task('build:static', ['build:vendor'], () => {
    gulp.src('./src/main/static/**/*')
        .pipe(gulp.dest('./dist/'))
    ;
});
gulp.task('build:vendor', () => {
    gulp.src('./node_modules/sanitize.css/sanitize.css')
        .pipe(gulp.dest('./dist/vendor/css/'))
    ;
});
gulp.task('build:js', () => {
    const wpConfig= require('./webpack.config.js');

    gulp.src('./src/main/js/**/*')
        .pipe(webpack(wpConfig))
        .pipe(gulp.dest('./dist/assets/js/'))
    ;
});
gulp.task('build', ['build:static', 'build:js']);

gulp.task('watch', ['build'], () => {
    gulp.watch('./src/main/static/**/*', ['build:static']);
});

gulp.task('default', ['build']);
