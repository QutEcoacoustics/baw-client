/**
 * Created by Anthony on 19/11/2014.
 */
angular.module("bawApp.demo.rendering", [])
.controller(
    "RenderingCtrl",
    [
        "$scope",
        function($scope) {

            $scope.loadStatic = function() {
                $scope.staticSrc = "assets/temp/eabad986-56d9-47b5-bec6-47458ffd3eae_101023-0000.ACI-ENT-EVN.png"
            };

            var min = 0,
                max = 1435,
                basePath =  "assets/temp/tiles/tile_{0}.png";
            //. "C:\Program Files\ImageMagick-6.9.0-Q16\convert.exe" -crop 1435x1@ .\eabad986-56d9-47b5-bec6-47458ffd3eae_101023-0000.ACI-ENT-EVN-trimmed72.png  tiles/tile_%d.png
            $scope.loadTiles = function() {
                $scope.tiles = [];
                for (i = min; i < max; i++) {
                    $scope.tiles[i] = basePath.format(i);
                }
            }
        }
    ]
);