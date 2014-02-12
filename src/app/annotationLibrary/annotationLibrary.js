angular.module('bawApp.annotationLibrary', ['bawApp.configuration'])

    .controller('AnnotationLibraryCtrl', ['$scope', '$location', '$resource', '$routeParams', 'AudioEvent',
        function ($scope, $location, $resource, $routeParams, AudioEvent) {

            $scope.filterSettings = {
                tagsPartial: $routeParams.tagsPartial,
                reference: $routeParams.reference,
                duration: $routeParams.duration,
                freqMin: $routeParams.freqMin,
                freqMax: $routeParams.freqMax,
                page: $routeParams.page,
                items: $routeParams.items
            };

            $scope.setFilter = function setFilter() {
                // update the url from the filter settings
                var newUrl = '/library?' + baw.angularCopies.toKeyValue($scope.filterSettings);
                if ($scope.filterSettings.tagsPartial !== undefined) {
                    newUrl = newUrl + '&tags_partial=' + $scope.filterSettings.tagsPartial;
                }
                console.log(newUrl);
                //$location.path(newUrl);
                // get the results from the server
                $scope.library = AudioEvent.library($scope.filterSettings);
            };

            $scope.setFilter();
        }]);