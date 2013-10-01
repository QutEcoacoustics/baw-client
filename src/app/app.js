/* A spot for the app to put stuff globally */
var baw = window.baw = baw || window.baw || {};
baw.exports = {};

/**
 * Helper function to add a bunch of common routes for a page
 * @param resourceName
 * @param singularResourceName
 * @param id
 * @param controllerMany
 * @param controllerOne
 * @return {*|Object}
 */
function whenDefaults(resourceName, singularResourceName, id, controllerMany, controllerOne) {

    // for a resource, there are three views:
    //  - a list (possibly with delete/edit links),
    //  - an item edit (for creating and editing),
    //  -  a details/show (for showing item info read-only, in a good-looking format)

    // more info on anchors:
    // https://github.com/angular/angular.js/issues/352#issuecomment-1270847

    // routes
    var pathList = "/" + resourceName;
    var pathShow = pathList + "/" + id;
    var pathEdit = pathShow + "/:editing";
    //var pathNew = pathList + '/new';

    // assets
    var assetList = "/assets/" + resourceName + "_list.html";
    var assetDetails = "/assets/" + singularResourceName + "_details.html";

    return this
        // list
        .when(pathList, {templateUrl: assetList, controller: controllerMany})
        // manage
        //.fluidIf(addManageView, function () {
        //    this.when(listPath, {templateUrl: assetManage, controller: controllerMany})
        //})
        // create
        //.when(pathNew, {templateUrl: assetDetails, controller: controllerOne})
        // edit
        .when(pathEdit, {templateUrl: assetDetails, controller: controllerOne})
        // details
        .when(pathShow, {templateUrl: assetDetails, controller: controllerOne})
        ;
}

var app = angular.module('baw',
        [
            'ngRoute',
            'ngResource',
            'ui.utils', /* angular-ui project */

            'bawApp.configuration', /* a mapping of all static path configurations
                                        and a module that contains all app configuration */
            'url',      /* a custom uri formatter */

            'templates-app', /* these are the precompiled templates */
            'templates-common',

            'bawApp.directives', /* our directives.js  */
            'bawApp.filters', /* our filters.js     */
            'bawApp.services', /* our services.js    */

            'http-auth-interceptor', /* the auth module    */
            'angular-auth', /* the auth module    */
            'rails', /* a module designed to rewrite object keys on JSON objects */

            'bawApp.accounts',
            'bawApp.annotationViewer',
            'bawApp.audioEvents',
            'bawApp.bookmarks',
            'bawApp.error',
            'bawApp.home',
            'bawApp.listen',
            'bawApp.login',
            'bawApp.navigation',
            'bawApp.photos',
            'bawApp.projects',
            'bawApp.recordInformation',
            'bawApp.recordings',
            'bawApp.search',
            'bawApp.tags',
            'bawApp.users'
        ])

    .config(['$routeProvider', '$locationProvider', '$httpProvider', 'conf.paths', function ($routeProvider, $locationProvider, $httpProvider, paths) {
        $routeProvider.whenDefaults = whenDefaults;
        $routeProvider.fluidIf = baw.fluidIf;

        // routes
        $routeProvider.
            when('/home', {templateUrl: '/assets/home.html', controller: 'HomeCtrl'}).

            whenDefaults("projects", "project", ":projectId", 'ProjectsCtrl', 'ProjectCtrl').
            whenDefaults("sites", "site", ":siteId", 'SitesCtrl', 'SiteCtrl').
            whenDefaults("photos", "photo", ":photoId", 'PhotosCtrl', 'PhotoCtrl').
            whenDefaults("bookmarks", "bookmark", ":bookmarkId", 'BookmarksCtrl', 'BookmarkCtrl').
            whenDefaults("searches", "search", ":searchId", 'SearchesCtrl', 'SearchCtrl').
            whenDefaults("tags", "tag", ":tagId", 'TagsCtrl', 'TagCtrl').
            whenDefaults("audioEvents", "audioEvent", ":audioEventId", 'AudioEventsCtrl', 'AudioEventCtrl').
            whenDefaults("users", "user", ":userId", 'UsersCtrl', 'UserCtrl').

            when('/recordings', {templateUrl: '/assets/recordings.html', controller: 'RecordingsCtrl' }).
            when('/recordings/:recordingId', {templateUrl: '/assets/recording.html', controller: 'RecordingCtrl' }).

            when('/listen', {templateUrl: paths.site.files.listen, controller: 'ListenCtrl'}).
            when('/listen/:recordingId', {templateUrl: paths.site.files.listen, controller: 'ListenCtrl'}).
            //when('/listen/:recordingId/start=:start/end=:end', {templateUrl: paths.site.files.listen, controller: 'ListenCtrl'}).

            when('/accounts', {templateUrl: '/assets/accounts_sign_in.html', controller: 'AccountsCtrl'}).
            when('/accounts/:action', {templateUrl: '/assets/accounts_sign_in.html', controller: 'AccountsCtrl'}).

            when('/attribution', {templateUrl: '/assets/attributions.html'}).

            // experiments
            when('/experiments/:experiment', {templateUrl: '/assets/experiment_base.html', controller: 'ExperimentsCtrl'}).


            // missing route page
            when('/', {templateUrl: paths.site.files.home, controller: 'HomeCtrl'}).
            when('/404', {templateUrl: paths.site.files.error404, controller: 'ErrorCtrl'}).
            when('/404?path=:errorPath', {templateUrl: paths.site.files.error404, controller: 'ErrorCtrl'}).
            otherwise({
                redirectTo: function (params, location, search) {
                    return '/404?path=' + location;
                }
            });

        // location config
        $locationProvider.html5Mode(true);

        // http default configuration
        $httpProvider.defaults.withCredentials = true;
    }])


    .run(['$rootScope', '$location', '$route', '$http', 'AudioEvent', function ($rootScope, $location, $route, $http, AudioEvent) {
        baw.exports.print = $rootScope.print = function () {
            var seen = [];
            var badKeys = ["$digest", "$$watchers", "$$childHead", "$$childTail", "$$listeners", "$$nextSibling", "$$prevSibling", "$root", "this", "$parent"];
            var str = JSON.stringify(this,
                function (key, val) {
                    if (badKeys.indexOf(key) >= 0) {
                        return "[Can't do that]";
                    }
                    if (typeof val == "object") {
                        if (seen.indexOf(val) >= 0) {
                            return "";
                        }
                        seen.push(val);
                    }
                    return val;
                }, 4);
            return str;
        };
        $rootScope.showOrHideDebugInfo = false;


        // http://www.yearofmoo.com/2012/10/more-angularjs-magic-to-supercharge-your-webapp.html#apply-digest-and-phase
        $rootScope.$safeApply = function ($scope, fn) {
            $scope = $scope || $rootScope;
            fn = fn || function () {
            };

            if ($scope.$$phase) {
                fn();
            }
            else {
                $scope.$apply(fn);
            }
        };

        $rootScope.$safeApply2 = function (fn) {
            var $scope = this || $rootScope;
            fn = fn || function () {
            };

            if ($scope.$$phase) {
                fn();
            }
            else {
                $scope.$apply(fn);
            }
        };

        $rootScope.$on("$routeChangeError", function (event, current, previous, rejection) {
            console.warn("route changing has failed... handle me some how", rejection);
            //change this code to handle the error somehow
            //$location.path('/404/' + $location.path);
//            alert("ROUTE CHANGE ERROR: " + rejection);
//            $scope.alertType = "alert-error";
//            $scope.alertMessage = "Failed to change routes :(";
//            $scope.active = "";
            $location.path('/404?path=');
        });

        // reload a view and controller (shortcut for full page refresh)
        $rootScope.$reloadView = function () {
            $route.reload();
        };

        // STANDARD DATE FORMAT
        $rootScope.dateOptions = {
            changeMonth: true,
            changeYear: true,
            dateFormat: "yy-mm-dd",
            duration: "fast",
            yearRange: "1800:3000"

        };

        // storage of auth_token
        $rootScope.authorisationToken = null;

        $rootScope.authTokenParams = function () {
            if ($rootScope.authorisationToken) {
                return {
                    auth_token: $rootScope.authorisationToken
                };
            }
            return {};
        };
        $rootScope.authTokenQuery = function () {
            return baw.angularCopies.toKeyValue($rootScope.authTokenParams());
        };

        $rootScope.loggedIn = false;

        $rootScope.$watch('userData', function () {
            var token = $rootScope.authorisationToken,
                userData = $rootScope.userData;
            $rootScope.loggedIn = (token && userData) ? true : false;

        });

        $rootScope.downloadAnnotationLink = AudioEvent.csvLink();

    }])

    .controller('AppCtrl',
        ['$scope', '$location',
            function AppCtrl($scope, $location) {

            }]);
