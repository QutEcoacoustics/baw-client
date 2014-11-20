/**
 * Created by Anthony on 19/11/2014.
 */
angular.module("bawApp.demo.rendering", [])
    .controller(
    "RenderingCtrl",
    [
        "$scope",
        "$http",
        "$q",
        "d3",
        "$document",
        function ($scope, $http, $q, d3, $document) {

            $scope.loadStatic = function () {
                $scope.staticSrc = "assets/temp/eabad986-56d9-47b5-bec6-47458ffd3eae_101023-0000.ACI-ENT-EVN.png"
            };

            var csvFiles = [
                "assets/temp/eabad986-56d9-47b5-bec6-47458ffd3eae_101023-0000_Towsey.Acoustic.ACI.csv",
                "assets/temp/eabad986-56d9-47b5-bec6-47458ffd3eae_101023-0000_Towsey.Acoustic.ENT.csv",
                "assets/temp/eabad986-56d9-47b5-bec6-47458ffd3eae_101023-0000_Towsey.Acoustic.EVN.csv"
            ];
            $scope.render = function () {
                console.log("loading csv");
                var requests = csvFiles.map(function (path) {
                    return $http.get(path);
                });
                var promise = $q.all(requests);
                return promise.then(
                    parseCsv,
                    function () {
                        console.error("An error occurred downloading the CSV", arguments);
                    }
                );
            };
            function parseCsv(responses) {
                console.log("parsing csv", performance.now());

                var data = responses.map(function (response) {
                    return d3.csv.parseRows(response.data);
                });

                renderCsv(data);
            }

            function renderCsv(data) {
                console.log("rendering csv");

                // ALL OF THIS DIRECT CANVAS MANIPULATION
                // SHOULD BE REFACTORED INTO A DIRECTIVE!
                // set dimensions
                var canvas = $document[0].querySelector("#demoCanvas");

                var channel0 = data[0],
                    channel1 = data[1],
                    channel2 = data[2],
                    width = channel0.length,
                    height = channel0[0].length;

                // resize the canvas
                // one day long
                canvas.width = 1440;
                canvas.height = height;

                var context = canvas.getContext('2d'),
                    imageData = context.getImageData(0, 0, width, height),
                    imgData = imageData.data;

                // set up normalisation
                var rMin = 0.4, // ACI
                    rMax = 0.7,
                    rDelta = rMax - rMin,
                    gMin = 0.0, // ENT
                    gMax = 0.6,
                    gDelta = gMax - gMin,
                    bMin = 0.0, // EVN
                    bMax = 2.0,
                    bDelta = bMax - bMin;

                // tight loop
                // x == 1, ignore header
                for (var x = 1; x < width; x++) {
                    for (var y = 0; y < height; y++) {

                        // image data is a 1-dim array of values
                        // each pixel is defined as 4 elements
                        // RGBA format
                        // Rows come first
                        // ignore header for x
                        var index = ((y * width) + (x-1)) * 4;

                        // normalise values
                        var r = (+(channel0[x][height - y - 1]) - rMin) / rDelta,
                            g = (+(channel1[x][height - y - 1]) - gMin) / gDelta,
                            b = (+(channel2[x][height - y - 1]) - bMin) / bDelta;

                        //console.debug(r,g,b);
                        imgData[index] = Math.min(Math.max(r * 256, 0), 0xff); // red
                        imgData[++index] = Math.min(Math.max(g * 256, 0), 0xff); // green
                        imgData[++index] = Math.min(Math.max(b * 256, 0), 0xff); // blue
                        imgData[++index] = 255; // alpha
                    }
                }

                context.putImageData(imageData, 0, 0);
                console.debug("Done", performance.now())
            }

            var min = 0,
                max = 1435,
                basePath = "assets/temp/tiles/tile_{0}.png";
            //. "C:\Program Files\ImageMagick-6.9.0-Q16\convert.exe" -crop 1435x1@ .\eabad986-56d9-47b5-bec6-47458ffd3eae_101023-0000.ACI-ENT-EVN-trimmed72.png  tiles/tile_%d.png
            $scope.loadTiles = function () {
                $scope.tiles = [];
                for (var i = min; i < max; i++) {
                    $scope.tiles[i] = basePath.format(i);
                }
            };

            //. "C:\Program Files\ImageMagick-6.9.0-Q16\convert.exe" -crop 60x256 .\eabad986-56d9-47b5-bec6-47458ffd3eae_101023-0000.ACI-ENT-EVN-trimmed72.png -background red -extent 60x256 tiles2/tile_%d.png
            var min60 = 0,
                max60 = 1440,
                basePath60 = "assets/temp/tiles2/tile_{0}.png";
            //. "C:\Program Files\ImageMagick-6.9.0-Q16\convert.exe" -crop 1435x1@ .\eabad986-56d9-47b5-bec6-47458ffd3eae_101023-0000.ACI-ENT-EVN-trimmed72.png  tiles/tile_%d.png
            $scope.loadTiles60 = function () {
                $scope.tiles60 = [];
                for (var i = min60; i < max60; i++) {
                    // i == minute of day
                    if (i % 60) {
                        var hour = Math.floor(i / 60);
                        $scope.tiles60[hour] = basePath60.format(hour);
                    }
                }
            };
        }
    ]
);