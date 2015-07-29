/**
 * Angular module generator
 *
 */
'use strict';

var fs = require('fs');

var moduleName = process.argv[2];

var moduleCamelCase = camelCase(moduleName);
var moduleHungarianCase = hungarianCase(moduleName);
var moduleInstallPath = __dirname + '/src/scripts/app/';
var modulePath = moduleInstallPath + moduleName;

var controllersNamespace = moduleName + ".controllers.";
var servicesNamespace = moduleName + ".services.";
var directivesNamespace = moduleName + ".directives.";
var filtersNamespace = moduleName + ".filters.";

//Detemine if folder with name exists.
if ( fs.existsSync(modulePath) ) {
    //Exit
    console.error("Module directory ("+moduleName+") already exists!");
} else {

    //Continue to create the folders and init files.
    try {
        //Create module folder.
        fs.mkdirSync(modulePath);

        //Create services/controllers/directives/filters
        fs.mkdirSync(modulePath + '/services');
        fs.mkdirSync(modulePath + '/controllers');
        fs.mkdirSync(modulePath + '/directives');
        fs.mkdirSync(modulePath + '/filters');

        //Create the index.js
        writeModuleFile(modulePath + '/index.js', getModuleTemplate(moduleName));

    } catch ( e ) {
        //Remove any folders that were actually created.
        if ( fs.existsSync(modulePath) ) {
            fs.rmdir(modulePath);
        }
        console.error(e.getMessage());
        return 0;
    }

    console.log(moduleName + " has successfully been created!");
}

//After module already exists. Create controllers/services/directives/filters, if given.
var createFlag = process.argv[3];
var coreModuleName = process.argv[4];

try {
    switch( createFlag ) {
        case "-c":
            if ( !fs.existsSync(modulePath + '/controllers') ) { fs.mkdirSync(modulePath + '/controllers'); }
            writeModuleFile(modulePath + '/controllers/'+coreModuleName+'.js', getControllerTemplate(controllersNamespace, coreModuleName));
            console.log("Controller "+hungarianCase(coreModuleName)+"Ctrl created!");
            break;
        case "-s":
            if ( !fs.existsSync(modulePath + '/services') ) { fs.mkdirSync(modulePath + '/services'); }
            writeModuleFile(modulePath + '/services/'+coreModuleName+'.js', getServiceTemplate(servicesNamespace, coreModuleName));
            console.log("Service "+hungarianCase(coreModuleName)+" created!");
            break;
        case "-d":
            if ( !fs.existsSync(modulePath + '/directives') ) { fs.mkdirSync(modulePath + '/directives'); }
            writeModuleFile(modulePath + '/directives/'+coreModuleName+'.js', getDirectiveTemplate(directivesNamespace, coreModuleName));
            console.log("Directive "+camelCase(coreModuleName)+" created!");
            break;
        case "-f":
            if ( !fs.existsSync(modulePath + '/filters') ) { fs.mkdirSync(modulePath + '/filters'); }
            writeModuleFile(modulePath + '/filters/'+coreModuleName+'.js', getFilterTemplate(filtersNamespace, coreModuleName));
            console.log("Filter "+hungarianCase(coreModuleName)+" created!");
            break;
    }
} catch ( e ) {
    console.error(e.getMessage());
    return 0;
}

return 0;

function camelCase(input) {
    return input.toLowerCase().replace(/_(.)/g, function(match, group1) {
        return group1.toUpperCase();
    });
}

function hungarianCase( input ) {
    var result = input.toLowerCase().replace(/_(.)/g, function(match, group1) {
        return group1.toUpperCase();
    });

    return result[0].toUpperCase() + result.substr(1);
}

//controller, service, directive, filter...
function writeModuleFile(path, template) {
    fs.writeFile(path, template, function( err ) {
        if ( err ) throw err;
    });
}

function getModuleTemplate( moduleName ) {
    var template = "//Bundling "+moduleName+" dependencies.\n window.angular.module('"+moduleName+"', [\n\n]);";
    return template;
}

function getControllerTemplate( namespace, name ) {
    var template = "window.angular.module('"+namespace+name+"', []) \n\
.controller('"+hungarianCase(name)+"Ctrl', [\n\
'$scope', \n\
function( $scope ) { \n\
    //... \n\
}]);";
    return template;
}

function getServiceTemplate( namespace, name ) {
    var template = "window.angular.module('"+namespace+name+"', []) \n\
.factory('"+hungarianCase(name)+"', [\n\
function( ) { \n\
    //... \n\
}]);";
    return template;
}

function getDirectiveTemplate( namespace, name ) {
    var template = "window.angular.module('"+namespace+name+"', []) \n\
.directive('"+camelCase(name)+"', [ \n\
function( ) { \n\
    return { \n\
        template: '<div></div>', \n\
        restrict: 'A', \n\
        link: function( scope, element, attrs ) { \n\
            \n\
        } \n\
    }; \n\
}]);";
    return template;
}

function getFilterTemplate( namespace, name ) {
    var template = "window.angular.module('"+namespace+name+"', []) \n\
.filter('"+camelCase(name)+"', [ \n\
function( ) { \n\
    return function( input ) { \n\
        return input; \n\
    }; \n\
}]);";
    return template;
}
