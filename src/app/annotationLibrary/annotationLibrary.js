angular.module('bawApp.annotationLibrary', ['bawApp.configuration'])

    .controller('AnnotationLibraryCtrl', ['$scope', '$location', '$resource', '$routeParams', 'AudioEvent',
        function ($scope, $location, $resource, $routeParams, AudioEvent) {

            $scope.filterSettings = {
                tagsPartial: null,
                reference: null,
                annotationDuration: null,
                freqMin: null,
                freqMax: null,
                page: null,
                items: null
            };

            $scope.setFilter = function setFilter() {
                $location.path('/library').search($scope.createQuery($scope.filterSettings));
            };
            $scope.loadFilter = function loadFilter() {
                $scope.filterSettings = $scope.createQuery($routeParams);
                $scope.library = AudioEvent.library($scope.filterSettings);
            };
            $scope.createQuery = function createQuery(params) {
                var hash = {};
                for (var key in params) {
                    if (params.hasOwnProperty(key)) {
                        var value = params[key];
                        if (value !== undefined && value !== null && (typeof(value) === "string" ? value.length > 0 : true)) {
                            hash[key] = value;
                        }
                    }
                }
                console.log(hash);
                return hash;
            };
            $scope.calcOffsetStart = function calcOffsetStart(startOffset) {
                return Math.floor(startOffset / 30) * 30;
            };
            $scope.calcOffsetEnd = function calcOffsetEnd(startOffset) {
                return  (Math.floor(startOffset / 30) * 30) + 30;
            };
            $scope.loadFilter();
        }]);