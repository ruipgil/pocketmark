var gulp = require("gulp"),
	clean = require("gulp-clean"),
	es = require("event-stream"),
	rseq = require("run-sequence"),
	react = require("gulp-react"),
	zip = require("gulp-zip");

var folder = {
	libs: "./build/chrome/libs/",
	js: "./build/chrome/js/",
	html: "./build/chrome/",
	css: "./build/chrome/css/",
	img: "./build/chrome/img/"
};

gulp.task("clean", function() {
	return gulp.src("./build", { read:false })
		.pipe(clean());
});

gulp.task("chrome", function() {
	return es.merge(
		gulp.src("./bower_components/async/lib/async.js").pipe(gulp.dest("./build/chrome/libs/")),
		gulp.src("./bower_components/pocketapi/pocket.js").pipe(gulp.dest("./build/chrome/libs/")),
		gulp.src("./bower_components/bootstrap/dist/js/bootstrap.min.js").pipe(gulp.dest("./build/chrome/libs/")),
		gulp.src("./bower_components/react/react.js").pipe(gulp.dest("./build/chrome/libs/")),
		gulp.src("./bower_components/jquery/dist/jquery.min.js").pipe(gulp.dest("./build/chrome/libs/")),

		gulp.src("./js/**/*.jsx").pipe(react()).pipe(gulp.dest("./build/chrome/js/")),
		gulp.src("./js/**/*.js").pipe(gulp.dest("./build/chrome/js/")),
		gulp.src("./vendor/chrome/**/*").pipe(gulp.dest("./build/chrome/js/")),
		gulp.src("./html/**/*").pipe(gulp.dest("./build/chrome/")),
		gulp.src("./css/**/*").pipe(gulp.dest("./build/chrome/css/")),

		gulp.src("./bower_components/pocketapi/pocket.js").pipe(gulp.dest("./build/chrome/libs/pocketapi.js")),
		gulp.src("./bower_components/async/lib/async.js").pipe(gulp.dest("./build/chrome/libs/")),
		gulp.src("./img/**/*").pipe(gulp.dest("./build/chrome/img/")),
		gulp.src("./bower_components/bootstrap/dist/css/bootstrap.min.css").pipe(gulp.dest("./build/chrome/css/")),

		gulp.src("./vendor/chrome/manifest.json").pipe(gulp.dest("./build/chrome/"))
	);
});

/*gulp.task("firefox", function() {});

gulp.task("safari", function() {});*/

gulp.task("default", function(callback) {
	rseq("clean", ["chrome"], callback);
});

gulp.task("watch", function() {
	var watcher = gulp.watch(["./js/**/*", "./img/**/*", "./css/**/*", "./vendor/**/*", "./html/**/*"], ["default"]);
	watcher.on('change', function(event) {
		console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
	});
});

gulp.task("chrome-dist", function() {
	gulp.src("./build/chrome/**/*")
		.pipe(zip("chrome-extension-v"+chrome.version+".zip"))
		.pipe(gulp.dest("./dist/chrome"));
});
/*
gulp.task("firefox-dist", function() {});

gulp.task("safari-dist", function() {});*/
