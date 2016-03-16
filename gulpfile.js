///// Gulp Dependencies /////
var gulp = require('gulp');
var	sass = require('gulp-sass');
var concat = require('gulp-concat');
var cleanCSS = require('gulp-clean-css');
var rename = require('gulp-rename');
var spawn = require('child_process').spawn;
var node, env = {};

////// Build Tasks ///////
gulp.task('build-sass', function () {
	gulp.src('./scss/*.scss')
		.pipe(sass().on('error', sass.logError))
		.pipe(gulp.dest('./scss/temp'))							//build them here first
		.pipe(concat('main.css'))								//concat them all
		.pipe(gulp.dest('./public/css'))
		.pipe(cleanCSS())										//minify
		.pipe(rename('main.min.css'))
		.pipe(gulp.dest('./public/css'));						//dump it here
});

////// Run Server Task ///////
gulp.task('server', function() {
	if(node) node.kill();
	node = spawn('node', ['app.js'], {env: env, stdio: 'inherit'});		//command, file, options
});

////// Watch Tasks //////
gulp.task('watch-sass', ['build-sass'], function () {
	gulp.watch('./scss/*.scss', ['build-sass']);
});

gulp.task('watch-server', ['server'], function () {
	gulp.watch('./routes/**/*.js', ['server']);
	gulp.watch('./libs/**/*.js', ['server']);
	gulp.watch(['./utils/**/*.js', '!./.obc-cache/**'], ['server']);
	gulp.watch('./setup.js', ['server']);
	gulp.watch('./app.js', ['server']);
});

////// Tasks //////
gulp.task('default', ['watch-sass', 'watch-server']);
