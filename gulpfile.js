var browserify = require("browserify");
var buffer = require("vinyl-buffer");
var clean = require("gulp-clean");
var del = require("del");
var gulp = require("gulp");
var gutil = require("gulp-util");
var inject = require("gulp-inject");
var liveServer = require("live-server");
var path = require("path");
var print = require("gulp-print");
var rename = require("gulp-rename");
var rev = require("gulp-rev");
var runSequence = require("run-sequence");
var source = require("vinyl-source-stream");
var sourcemaps = require('gulp-sourcemaps');
var tsify = require("tsify");
var uglify = require("gulp-uglify");

function logError(err) {
    gutil.log(gutil.colors.red(err.message))
}

gulp.task("browserify:app", function () {
    del.sync("src/bundles/app*.js*");
    return bundle("src/main.ts", {
            debug: true
        }).external("vue")
        .plugin(tsify)
        .bundle()
        .on("error", function (err) {
            logError(err);
        })
        .pipe(source("app.js"))
        .pipe(buffer())
        .pipe(sourcemaps.init({
            loadMaps: true
        }))
        .pipe(uglify())
        .pipe(rename("app.min.js"))
        .pipe(rev())
        .pipe(sourcemaps.write("./"))
        .pipe(gulp.dest("src/bundles"));
});

gulp.task("browserify:vendor", function () {
    del.sync("src/bundles/vendor*.js*");
    return browserify().require("vue")
        .bundle()
        .on("error", function (err) {
            logError(err);
        })
        .pipe(source("vendor.js"))
        .pipe(buffer())
        .pipe(uglify())
        .pipe(rename("vendor.min.js"))
        .pipe(rev())
        .pipe(gulp.dest("src/bundles"));
});

gulp.task("browserify", ["browserify:app", "browserify:vendor"]);

gulp.task("inject", function () {
    var sources = gulp.src(["bundles/vendor-*.js", "bundles/app-*.min.js"], {
        read: false,
        cwd: path.join(__dirname, "src")
    });
    sources.pipe(print());
    return gulp.src("./src/index.html").pipe(inject(sources)).pipe(gulp.dest("src"));
});

gulp.task("watch", function (cb) {
    return gulp.watch("src/*.ts", function (event) {
        gutil.log(gutil.colors.red("watched event " + event.type + " for " + event.path));
        runSequence(
            "browserify:app",
            "inject");
    });
});

gulp.task("clean", function () {
    return gulp.src('src/bundles', {
            read: false
        })
        .pipe(clean());
});

gulp.task("serve", function (cb) {
    liveServer.start({
        root: "src"
    });
});

gulp.task("dev", function (cb) {
    runSequence(
        "clean", 
        "browserify:app",
        "browserify:vendor",        
        "inject", 
        [
            "watch",
            "serve"
        ],
        cb);
});