
// --------------------------------------
// Setup
// --------------------------------------

var gulp            = require( 'gulp' );
var fs              = require( 'fs' );
var path            = require( 'path' );
var bower           = require( 'main-bower-files' );
var sprite          = require( 'css-sprite' ).stream;
var jadeInheritance = require('gulp-jade-inheritance');
var jade            = require( 'gulp-jade' );
var neat            = require( 'node-neat' ).includePaths;
var plugins         = require( 'gulp-load-plugins' )();
var locals          = require( './locals.json' );
var filter          = require( 'gulp-filter' );
var runSequence     = require('run-sequence');
var exec            = require('child_process').exec;


var paths = {
    src: './src/',
    dest: './public/',
    bower: './bower_components/',
    templates: './public/'
};

var libraries = null;


// --------------------------------------
// Helpers
// --------------------------------------

var handleError = function( error ) {
    console.log( error.toString() );
    this.emit( 'end' );
};


// --------------------------------------
// Default / Build Tasks
// --------------------------------------

gulp.task( 'default', [ 'templates', 'images', 'scripts', 'styles', 'fonts', 'watch' ] );

gulp.task( 'build', function(callback) {
    runSequence('templates', 'images', 'scripts', 'styles', 'fonts', 'merge', callback );
});

gulp.task('app', function(callback) {
    runSequence('cordova', 'deploy', callback );
});


// --------------------------------------
// Watch Task
// --------------------------------------


gulp.task( 'watch', function() {
    plugins.livereload.listen();
    gulp.watch( paths.src + 'scripts/**/*.js', [ 'scripts' ]);
    gulp.watch( paths.src + 'scripts/app/views/**/*.jade', [ 'scripts' ]);
    gulp.watch( paths.src + 'templates/**/*.jade', [ 'templates' ]);
    gulp.watch( paths.src + 'styles/**/*.scss', [ 'styles' ] );
    gulp.watch( paths.src + 'images/**/*.{jpg,jpeg,gif,png,svg,ico}', [ 'images' ] );
    gulp.watch( paths.src + 'font/**/*.{ttf,woff,woff2,eof,svg}', [ 'fonts' ] );

} );


// --------------------------------------
// Fonts Task
// --------------------------------------

gulp.task( 'fonts', function() {

    var files = [
        paths.src + 'fonts/*.{ttf,woff,woff2,eof,svg}',
    ];
    gulp.src( files )
      .pipe( gulp.dest( paths.dest + 'fonts' ) );

} );


// --------------------------------------
//  Images Task
// --------------------------------------


gulp.task( 'images', function() {

    var files = [
        paths.src + 'images/*.{jpg,png,gif,jpeg,ico}'
    ];
    gulp.src( files ).pipe( gulp.dest( paths.dest + 'images' ) );

} );



// --------------------------------------
// Styles Task
// --------------------------------------

gulp.task( 'styles', function() {

    var libraries = bower();
    var maps = [];
    libraries = libraries.filter( function( file ) {
        if ( path.extname( file ) === '.map' ) {
            maps.push( file );
            return false;
        }
        return ( path.extname( file ) === '.css' );
    } );

    libraries = gulp.src( libraries );

    libraries.pipe( gulp.dest( paths.dest + 'styles') )

    var vendor = gulp.src(paths.src + 'styles/*.css')

    var app = gulp.src( paths.src + 'styles/*.scss' )
        .pipe( plugins.sass( {
            errLogToConsole: true,
        }))

    plugins.merge( vendor, app )
        .pipe( plugins.concat( 'styles.css' ) )
        .pipe( gulp.dest( paths.dest + 'styles' ) )


} );


// --------------------------------------
// Scripts Task
// --------------------------------------

gulp.task( 'scripts', function() {

    // Library Files
    libraries = bower();
    var maps = [];
    libraries = libraries.filter( function( file ) {
        if ( path.extname( file ) === '.map' ) {
            maps.push( file );
            return false;
        }
        return ( path.extname( file ) === '.js' );
    } );
    libraries = gulp.src( libraries );

    // Move any .map files to destination
    gulp.src( maps ).pipe( gulp.dest( paths.dest + 'scripts' ) );

    var svgInject = function( content ) {
        var self = this;
        var svgs = content.match( /xlink:href="(.*?)"/gi );
        if ( svgs ) {
            for ( var i = 0, len = svgs.length; i < len; i++ ) {
                var path = svgs[ i ].replace( /"/gi, '' ).replace( /xlink:href=/, '' );

                if ( fs.existsSync( './src' + path ) ) {
                    var $ = cheerio.load( fs.readFileSync( './src' + path, 'utf8' ) );
                    var attrs = 'height width x y id'.split( ' ' );
                    var $svg = $( 'svg' );
                    attrs.forEach( function( attr ) {
                        $svg = $svg.removeAttr( attr );
                    });
                    content = content.replace( '<use xlink:href="' + path + '"></use>' , $.html( $svg ) );
                } else {
                    var file = self.fname.replace( '.html', '.jade' );
                    console.error( colors.yellow( 'Read File Warning1:' ), colors.blue( path ), 'in:', colors.green( file ) );
                }
            }
        }
        return content;
    };

    // Template Files
    return gulp.src( paths.src + 'scripts/app/views/**/*.jade' )
        .pipe( plugins.jade( { pretty: true, doctype: 'html' } ) )
        .pipe( plugins.change( svgInject ) )
        .pipe( plugins.angularTemplatecache( 'templates.js', {
            root: '/views/',
            templateHeader: "window.angular.module('<%= module %>', []).run(['$templateCache', function($templateCache) {"
        }))
        .pipe( gulp.dest( './public/'));

   


});

gulp.task( 'merge', function() {
     // Application Files
    var application = gulp.src( [
        paths.src + 'scripts/vendor/**/*.js',
        paths.dest + 'templates.js',
        paths.src + 'scripts/app/**/*.js',
    ] );

    return plugins.merge( libraries, application )
        .pipe( plugins.concat( 'all.js' ) )
        .pipe( gulp.dest( paths.dest + 'scripts' ) )
        .pipe( plugins.livereload( { auto: false } ) );
});



// --------------------------------------
// Templates Task
// --------------------------------------

gulp.task( 'templates', function() {

    gulp.src(paths.src + 'templates/*.jade')
      .pipe(jadeInheritance({basedir: paths.src + 'templates'}))
      .pipe(filter(function (file) {
          return !/\/_/.test(file.path) && !/^_/.test(file.relative);
      }))
      .pipe(jade({
        locals: locals,
        pretty: true
      }))
      .pipe(gulp.dest(paths.templates));

});

// --------------------------------------
// Cordova Task
// --------------------------------------

gulp.task( 'cordova', function() {

    return gulp.src([paths.dest +'**/*']).pipe(gulp.dest('cordova-app/www'));

});

gulp.task( 'deploy', function() {
    var cordovaRoot = './cordova-app';
    var platforms = ['ios', 'android'];

    var command = '';
    command += 'cd ' + cordovaRoot;
    platforms.map(function(platform){
        command += ' && ';
        command += 'cordova prepare '+ platform +' && ';
        command += 'cordova compile '+ platform +' && ';
        command += 'cordova build '+ platform +' && ';
        command += 'cordova run '+ platform +'';
    });

    return exec(command, function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
    });

});