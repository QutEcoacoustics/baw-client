angular.module('bawApp.photos', [])

    .controller('PhotosCtrl', ['$scope', '$resource', 'Photo',
        function PhotosCtrl($scope, $resource, Photo) {
            $scope.photosResource = $resource('/photos', {});
            $scope.photos = $scope.photosResource.query();

            $scope.links = function (key) {
                return PhotosCtrl.linkList(this.photo.id)[key];
            };
        }])

    .controller('PhotoCtrl', ['$scope', '$resource', '$routeParams', 'Photo',

        function PhotoCtrl($scope, $resource, $routeParams, Photo) {

            var photoResource = Photo;
            var routeArgs = {photoId: $routeParams.photoId};

            $scope.editing = $routeParams.editing === "edit";

            $scope.photo = photoResource.get(routeArgs, function () {
                $scope.links = PhotosCtrl.linkList($scope.photo.id);

                $scope.original = angular.copy($scope.project);

            });

            $scope.links = {};

            $scope.delete = function () {
                var doit = confirm("Are you sure you want to delete this photo (id {0})?".format(this.project.id));
                if (doit) {
                    photoResource.remove();
                }
            };

            $scope.reset = function () {
                if ($scope.editing) {
                    $scope.project = angular.copy($scope.original);
                }
            };

            $scope.update = function updateProject() {
                if ($scope.editing) {
                    // do not send back the full object for update
                    var p = { "photo": {} };
//            p.project.name = $scope.project.name;
//            p.project.urn = $scope.project.urn;
//            p.project.description = $scope.project.description;
//            p.project.notes = $scope.project.notes;
//
//            p.project.siteIds = $scope.siteIds;

                    photoResource.update(routeArgs, p, function () {
                        $scope.original = angular.copy($scope.site);
                        var msg = "Photo details updated successfully.";
                        console.log(msg);
                        alert(msg);
                    }, function () {
                        var msg = "There was a problem updating the photo details. Please check for errors and try again.";
                        console.log(msg);
                        alert(msg);
                    });
                }
            };
        }
    ]);

