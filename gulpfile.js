var gulp = require("gulp");
var browserify = require("browserify");
var source = require("vinyl-source-stream");
var buffer = require("vinyl-buffer");
var uglify = require("gulp-uglify");
var debug = require("gulp-debug");
var clean = require("gulp-clean");
var runSequence = require("run-sequence");
var liveServer = require("live-server");
var sourcemaps = require('gulp-sourcemaps');
var tsify = require("tsify");
var gutil = require("gulp-util");
var rename = require("gulp-rename");
var rev = require("gulp-rev");
var inject = require("gulp-inject");
var print = require("gulp-print");
var path = require("path");
var del = require("del");

gulp.task("browserify:app", function () {
    del.sync("src/bundles/app*.js*");
    return browserify("src/main.ts", {
            debug: true
        }).external("vue")
        .plugin(tsify)
        .bundle()
        .on("error", function (err) {
            gutil.log("browserify:app", gutil.colors.red(err.message))
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
            gutil.log("browserify:vendor", gutil.colors.red(err.message))
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