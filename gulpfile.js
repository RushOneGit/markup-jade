var autoPrefixBrowserList = ['last 2 version'];
var gulp                  = require('gulp');
var gutil                 = require('gulp-util');
var concat                = require('gulp-concat');
var sass                  = require('gulp-sass');
var sourceMaps            = require('gulp-sourcemaps');
var imagemin              = require('gulp-imagemin');
var browserSync           = require('browser-sync');
var autoprefixer          = require('gulp-autoprefixer');
var gulpSequence          = require('gulp-sequence').use(gulp);
var shell                 = require('gulp-shell');
var plumber               = require('gulp-plumber');
var gcmq                  = require('gulp-group-css-media-queries');
var csscomb               = require('gulp-csscomb');
var jadeInheritance       = require('gulp-jade-inheritance');
var jade                  = require('gulp-jade');
var changed               = require('gulp-changed');
var cached                = require('gulp-cached');
var filter                = require('gulp-filter');
var spritesmith           = require('gulp.spritesmith');
var svgmin                = require('gulp-svgmin');


gulp.task('browserSync', function() {
	browserSync({
		server: {
			baseDir: "app/",
			directory: true
		},
		options: {
			reloadDelay: 250
		},

		notify: true
	});
});


gulp.task('sprite', function() {
	var spriteData = 
		gulp.src('app/images/sprite/*.*') // путь, откуда берем картинки для спрайта
			.pipe(spritesmith({
					imgName: '../images/sprite.png',
					cssName: 'sprite.css',
			}));

	spriteData.img.pipe(gulp.dest('app/images/')); // путь, куда сохраняем картинку
	spriteData.css.pipe(gulp.dest('app/css/')); // путь, куда сохраняем стили
});

gulp.task('images', function(tmp) {
	gulp.src(['dist/images/*.jpg', 'dist/images/*.png', 'dist/images/*.svg'])
		.pipe(plumber())
		.pipe(svgmin({
			plugins: [{
					removeDoctype: false
				}, {
					removeComments: false
				}, {
				cleanupNumericValues: {
					floatPrecision: 2
				}
				}, {
				convertColors: {
					names2hex: false,
					rgb2hex: false
				}
				}]
		}))
		.pipe(imagemin({ optimizationLevel: 3, progressive: true, interlaced: true }))
		.pipe(gulp.dest('dist/images'));
});

gulp.task('images-deploy', function() {
	gulp.src(['app/images/**/*', '!app/images/README'])
		.pipe(plumber())
		.pipe(gulp.dest('dist/images'));
});

gulp.task('js', function() {
	return gulp.src('app/js/**/*.js')
		.pipe(plumber())
		.on('error', gutil.log)
		.pipe(gulp.dest('app/js'))
		.pipe(browserSync.reload({stream: true}));
});

gulp.task('js-deploy', function() {
	return gulp.src('app/js/**/*.js')
		.pipe(plumber())
		.pipe(gulp.dest('dist/js'));
});

gulp.task('scss', function() {
	return gulp.src('app/scss/style.scss')
		.pipe(plumber({
			errorHandler: function (err) {
				console.log(err);
				this.emit('end');
			}
		}))
		.pipe(sourceMaps.init())
		.pipe(sass({
			errLogToConsole: true,
			includePaths: [
				'app/scss/'
			]
		}))
		.pipe(autoprefixer({
			browsers: autoPrefixBrowserList,
			cascade:  true
		}))
		.on('error', gutil.log)
		.pipe(gcmq())
		.pipe(sourceMaps.write())
		.pipe(gulp.dest('app/css'))
		.pipe(browserSync.reload({stream: true}));
});

gulp.task('css-deploy', function() {
	return gulp.src('app/scss/style.scss')
		.pipe(plumber())
		.pipe(sass({
			includePaths: [
				'app/styles/scss',
			]
		}))
		.pipe(autoprefixer({
			browsers: autoPrefixBrowserList,
			cascade:  true
		}))
		.pipe(gcmq())
		.pipe(csscomb())
		.pipe(concat('style.css'))
		.pipe(gulp.dest('dist/css'));
});

gulp.task('jade', function() {
	gulp.src('app/jade/**/*.jade')
		.pipe(plumber())
		.pipe(cached('jade'))
		.pipe(changed('app', {extension: '.html'}))
		.pipe(jadeInheritance({basedir: 'app/jade'}))
		.pipe(filter(function (file) {
			return !/\/_/.test(file.path) && !/^_/.test(file.relative);
		}))
		.pipe(jade({
			pretty: true
		}))
		.on('error', gutil.log)
		.pipe(gulp.dest('app'))
		.pipe(browserSync.reload({stream: true}));
});

gulp.task('html', function() {
	return gulp.src('app/*.html')
		.pipe(plumber())
		.pipe(browserSync.reload({stream: true}))
		.on('error', gutil.log);
});

gulp.task('html-deploy', function() {
	gulp.src('app/*.html')
		.pipe(plumber())
		.pipe(gulp.dest('dist'));

	gulp.src('app/*.html')
		.pipe(plumber())
		.pipe(gulp.dest('dist'));

	gulp.src('app/.*')
		.pipe(plumber())
		.pipe(gulp.dest('dist'));

	gulp.src('app/fonts/**/*')
		.pipe(plumber())
		.pipe(gulp.dest('dist/fonts'));

	gulp.src('app/scss/**/*')
		.pipe(plumber())
		.pipe(gulp.dest('dist/scss'));
});

gulp.task('clean', function() {
	return shell.task([
		'rm -rf dist'
	]);
});

gulp.task('scaffold', function() {
		return shell.task([
			'mkdir dist',
			'mkdir dist/fonts',
			'mkdir dist/images',
			'mkdir dist/js',
			'mkdir dist/css'
		]
	);
});

gulp.task('default', ['browserSync', 'js', 'scss', 'jade'], function() {
	gulp.watch('app/js/**/**', ['js']);
	gulp.watch('app/scss/**', ['scss']);
	gulp.watch('app/jade/**/**', ['jade']);
});

gulp.task('deploy', gulpSequence('clean', 'scaffold', ['js-deploy', 'css-deploy', 'images-deploy'], 'html-deploy', 'images'));
