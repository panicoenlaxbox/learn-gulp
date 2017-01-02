var browserify = require("browserify");
var buffer = require("vinyl-buffer");
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
var taskListing = require("gulp-task-listing");
var watchify = require("watchify");
var assign = require("lodash.assign");
var gulpif = require("gulp-if");
var util = require("util");
var babelify = require("babelify");

var b;
var watch = false;
var production = process.env.NODE_ENV === "production";

function bundle() {
    var file = "src/js/main.js";
    b = browserify(file, {
        debug: true
    });
    if (watch) {
        var options = assign({}, {
            debug: true,
            cache: {},
            packageCache: {},
            plugin: [watchify]
        });
        b = watchify(browserify(file, options));
        b.on("update", _bundle);
        b.on("log", gutil.log);
    }
    b
        .transform("babelify", {
            presets: ["es2015"]
        })
        .external("angular")
        .external("jquery");
    return _bundle();
}

function _bundle() {
    return b
        .bundle()
        .on("error", function (err) {
            gutil.log(gutil.colors.red(err.message));
        })
        .pipe(source("app.js"))
        .pipe(buffer())
        .pipe(sourcemaps.init({
            loadMaps: true
        }))
        .pipe(uglify())
        .pipe(rename("app.min.js"))
        .pipe(gulpif(production, rev()))
        .pipe(sourcemaps.write("."))
        .pipe(gulp.dest("src/bundles"));
}

gulp.task("browserify:app", function () {
    del.sync("src/bundles/app*.js");
    return bundle();
});

gulp.task("browserify:vendor", function () {
    del.sync("src/bundles/vendor*.js");
    return browserify()
        .require("angular")
        .require("jquery")
        .bundle()
        .on("error", function (err) {
            gutil.log("browserify:vendor", gutil.colors.red(err.message));
        })
        .pipe(source("vendor.js"))
        .pipe(buffer())
        .pipe(uglify())
        .pipe(rename("vendor.min.js"))
        .pipe(gulpif(production, rev()))
        .pipe(gulp.dest("src/bundles"));
});

gulp.task("browserify", ["browserify:app", "browserify:vendor"]);

gulp.task("inject", function () {
    var sources = gulp.src(["src/bundles/vendor*.js", "src/bundles/app*.js"], {
        read: false
    });
    sources.pipe(print());
    return gulp.src("src/index.html").pipe(inject(sources, {
        relative: true
    })).pipe(gulp.dest("src"));
});

gulp.task("serve", function () {
    liveServer.start({
        root: "src"
    });
});

gulp.task("dev", function (cb) {
    watch = true;
    runSequence(
        "browserify",
        "inject",
        "serve",
        cb);
});

gulp.task("help", taskListing);

gulp.task("default", ["help"]);