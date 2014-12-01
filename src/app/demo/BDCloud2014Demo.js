angular.module("bawApp.demo.bdCloud2014", [])
    .controller("BdCloud2014Ctrl",
    ["$scope",
        "$http",
        "$q",
        "d3",
        "$document",
        "conf.paths",
        function ($scope, $http, $q, d3, $document, paths) {
            $scope.demoData = [];


            function d(id, file, date, title) {
                var url =  paths.api.root + "/audio_recordings/"+id+"/analysis.png?analysis_id=towsey.acoustic&file_name="+file;

                $scope.demoData.push({
                    date: date,
                    url: url,
                    title: title
                });
            }

            $scope.showBackups = function showBackups() {
                var find = "evn.png", replace = "evn.BACKUP.png";
                if (!$scope.backups) {
                    var t = find;
                    find = replace;
                    replace = t;
                }

                $scope.demoData.map(function (dd) {
                   dd.url =  dd.url.replace(find, replace);
                });
            };


            d(234234, "eabad986-56d9-47b5-bec6-47458ffd3eae_101023-0000.aci-ent-evn.png", new Date(), "Test message");
            d(234234, "eabad986-56d9-47b5-bec6-47458ffd3eae_101023-0000.aci-ent-evn.png", new Date(), "Test message");
            d(234234, "eabad986-56d9-47b5-bec6-47458ffd3eae_101023-0000.aci-ent-evn.png", new Date(), "Test message");
            d(234234, "eabad986-56d9-47b5-bec6-47458ffd3eae_101023-0000.aci-ent-evn.png", new Date(), "Test message");
            d(234234, "eabad986-56d9-47b5-bec6-47458ffd3eae_101023-0000.aci-ent-evn.png", new Date(), "Test message");
            d(234234, "eabad986-56d9-47b5-bec6-47458ffd3eae_101023-0000.aci-ent-evn.png", new Date(), "Test message");
            d(234234, "eabad986-56d9-47b5-bec6-47458ffd3eae_101023-0000.aci-ent-evn.png", new Date(), "Test message");
            d(234234, "eabad986-56d9-47b5-bec6-47458ffd3eae_101023-0000.aci-ent-evn.png", new Date(), "Test message");
            d(234234, "eabad986-56d9-47b5-bec6-47458ffd3eae_101023-0000.aci-ent-evn.png", new Date(), "Test message");
            d(234234, "eabad986-56d9-47b5-bec6-47458ffd3eae_101023-0000.aci-ent-evn.png", new Date(), "Test message");
            d(234234, "eabad986-56d9-47b5-bec6-47458ffd3eae_101023-0000.aci-ent-evn.png", new Date(), "Test message");
            d(234234, "eabad986-56d9-47b5-bec6-47458ffd3eae_101023-0000.aci-ent-evn.png", new Date(), "Test message");
            d(234234, "eabad986-56d9-47b5-bec6-47458ffd3eae_101023-0000.aci-ent-evn.png", new Date(), "Test message");
            d(234234, "eabad986-56d9-47b5-bec6-47458ffd3eae_101023-0000.aci-ent-evn.png", new Date(), "Test message");
            d(234234, "eabad986-56d9-47b5-bec6-47458ffd3eae_101023-0000.aci-ent-evn.png", new Date(), "Test message");
            d(234234, "eabad986-56d9-47b5-bec6-47458ffd3eae_101023-0000.aci-ent-evn.png", new Date(), "Test message");
            d(234234, "eabad986-56d9-47b5-bec6-47458ffd3eae_101023-0000.aci-ent-evn.png", new Date(), "Test message");
            d(234234, "eabad986-56d9-47b5-bec6-47458ffd3eae_101023-0000.aci-ent-evn.png", new Date(), "Test message");
            d(234234, "eabad986-56d9-47b5-bec6-47458ffd3eae_101023-0000.aci-ent-evn.png", new Date(), "Test message");
            d(234234, "eabad986-56d9-47b5-bec6-47458ffd3eae_101023-0000.aci-ent-evn.png", new Date(), "Test message");
            d(234234, "eabad986-56d9-47b5-bec6-47458ffd3eae_101023-0000.aci-ent-evn.png", new Date(), "Test message");
            d(234234, "eabad986-56d9-47b5-bec6-47458ffd3eae_101023-0000.aci-ent-evn.png", new Date(), "Test message");
            d(234234, "eabad986-56d9-47b5-bec6-47458ffd3eae_101023-0000.aci-ent-evn.png", new Date(), "Test message");
            d(234234, "eabad986-56d9-47b5-bec6-47458ffd3eae_101023-0000.aci-ent-evn.png", new Date(), "Test message");
            d(234234, "eabad986-56d9-47b5-bec6-47458ffd3eae_101023-0000.aci-ent-evn.png", new Date(), "Test message");
            d(234234, "eabad986-56d9-47b5-bec6-47458ffd3eae_101023-0000.aci-ent-evn.png", new Date(), "Test message");
            d(234234, "eabad986-56d9-47b5-bec6-47458ffd3eae_101023-0000.aci-ent-evn.png", new Date(), "Test message");
            d(234234, "eabad986-56d9-47b5-bec6-47458ffd3eae_101023-0000.aci-ent-evn.png", new Date(), "Test message");
            d(234234, "eabad986-56d9-47b5-bec6-47458ffd3eae_101023-0000.aci-ent-evn.png", new Date(), "Test message");
            d(234234, "eabad986-56d9-47b5-bec6-47458ffd3eae_101023-0000.aci-ent-evn.png", new Date(), "Test message");
            d(234234, "eabad986-56d9-47b5-bec6-47458ffd3eae_101023-0000.aci-ent-evn.png", new Date(), "Test message");
        }
    ]
);
