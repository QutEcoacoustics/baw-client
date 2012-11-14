'use strict';

/* App Module */

var bawApp = angular.module('baw',
        [
            'ngResource',
            'ui.directives', /* angular-ui project */
            'ui.filters', /* angular-ui project */
            'bawApp.directives'     /* our directives.js  */
        ],
        function ($routeProvider, $locationProvider) {

            // routes
            $routeProvider.
                when('/home', {templateUrl: '/assets/home.html', controller: HomeCtrl}).

                when('/projects', {templateUrl: '/assets/projects_index.html', controller: ProjectCtrl}).
                when('/projects/manage', {templateUrl: '/assets/projects_manage.html', controller: ProjectsManagerCtrl}).
                when('/projects/:projectId', {templateUrl: '/assets/project_details.html', controller: ProjectsCtrl}).

                when('/sites', {templateUrl: '/assets/sites.html', controller: SitesCtrl }).
                when('/sites/:siteId', {templateUrl: '/assets/site.html', controller: SiteCtrl }).

                when('/photos', {templateUrl: '/assets/photos.html', controller: PhotosCtrl }).
                when('/photos/:photoId', {templateUrl: '/assets/photo.html', controller: PhotoCtrl }).

                when('/recordings', {templateUrl: '/assets/recordings.html', controller: RecordingsCtrl }).
                when('/recordings/:recordingId', {templateUrl: '/assets/recording.html', controller: RecordingCtrl }).

                when('/listen', {templateUrl: '/assets/listen.html', controller: ListenCtrl}).
                when('/listen/:recordingId', {templateUrl: '/assets/listen.html', controller: ListenCtrl}).

                //when('/phones/:phoneId', {templateUrl: 'partials/phone-detail.html', controller: PhoneDetailCtrl}).
                otherwise({redirectTo: '/home'});

            // location config
            $locationProvider.html5Mode(true);


        })
        .run(function ($rootScope) {
            $rootScope.print = function () {
                var seen = [];
                var badKeys = ["$digest", "$$watchers", "$$childHead", "$$childTail", "$$listeners", "$$nextSibling", "$$prevSibling", "$root", "this", "$parent"];
                var str = JSON.stringify(this,
                    (function (key, val) {
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
                    }), 4);
                return str;
            };
            $rootScope.showOrHideDebugInfo = false;
        })
    ;
