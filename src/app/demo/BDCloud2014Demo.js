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
                var url =  paths.api.root + "/audio_recordings/"+id+"/analysis.png?analysis_id=Towsey.Acoustic&file_name="+file;
                    $scope.demoData.push({
                    date: date,
                    url: url,
                    title: title
                });
            }

            $scope.showBackups = function showBackups() {
                var find = "EVN.png", replace = "EVN.BACKUP.png";
                if (!$scope.backups) {
                    var t = find;
                    find = replace;
                    replace = t;
                }

                $scope.demoData.map(function (dd) {
                   dd.url =  dd.url.replace(find, replace);
                });
            };


            d(187684, "4c77b524-1857-4550-afaa-c0ebe5e3960a_101013-0000.ACI-ENT-EVN.png", "13/10/2010 00:00", "NE");
            d(188238, "eabad986-56d9-47b5-bec6-47458ffd3eae_101023-0000.ACI-ENT-EVN.png", "23/10/2010 00:00", "NE");
            d(188239, "6ed4473f-e046-4da9-96d4-6e0181793583_101022-0000.ACI-ENT-EVN.png", "22/10/2010 00:00", "NE");
            d(188244, "e2b8901f-c1bb-4b8c-8df3-97e54fe6d311_101021-0000.ACI-ENT-EVN.png", "21/10/2010 00:00", "NE");
            d(188245, "98dff100-60b6-48f6-9d13-ae7dd58551ef_101020-0000.ACI-ENT-EVN.png", "20/10/2010 00:00", "NE");
            d(188246, "ecc70b52-79f6-42c0-822a-983ab4bcd1e6_101019-0000.ACI-ENT-EVN.png", "19/10/2010 00:00", "NE");
            d(188258, "50e8047f-089b-47e9-91b0-4b480c516a55_101015-0000.ACI-ENT-EVN.png", "15/10/2010 00:00", "NE");
            d(188251, "34955471-15d0-4dfd-9701-09cef9d88f46_101018-0000.ACI-ENT-EVN.png", "18/10/2010 00:00", "NE");
            d(188252, "bf15a9b5-d5a8-40c9-8830-49289a633692_101017-0000.ACI-ENT-EVN.png", "17/10/2010 00:00", "NE");
            d(188257, "3117ff2a-6d6f-4e21-bb50-c126e9b1f98e_101016-0000.ACI-ENT-EVN.png", "16/10/2010 00:00", "NE");
            d(188263, "b03685fe-6ad5-4776-90b7-e2c271dad3fb_101014-0000.ACI-ENT-EVN.png", "14/10/2010 00:00", "NE");
            d(188292, "7a667c05-825e-4870-bc4b-9cec98024f5a_101013-0000.ACI-ENT-EVN.png", "13/10/2010 00:00", "SE");
            d(188293, "b562c8cd-86ba-479e-b499-423f5d68a847_101014-0000.ACI-ENT-EVN.png", "14/10/2010 00:00", "SE");
            d(188294, "d9eb5507-3a52-4069-a6b3-d8ce0a084f17_101015-0000.ACI-ENT-EVN.png", "15/10/2010 00:00", "SE");
            d(188295, "418b1c47-d001-4e6e-9dbe-5fe8c728a35d_101016-0000.ACI-ENT-EVN.png", "16/10/2010 00:00", "SE");
            d(188300, "0f2720f2-0caa-460a-8410-df24b9318814_101017-0000.ACI-ENT-EVN.png", "17/10/2010 00:00", "SE");
            d(188301, "eb543e20-7840-44ba-9dfa-6d38aa509b3c_101018-0000.ACI-ENT-EVN.png", "18/10/2010 00:00", "SE");
            d(188302, "aa772d98-0e22-4a89-9f42-700ba0bf71c4_101019-0000.ACI-ENT-EVN.png", "19/10/2010 00:00", "SE");
            d(188303, "afed4809-6f59-4e54-8fb5-3c011dd36e33_101020-0000.ACI-ENT-EVN.png", "20/10/2010 00:00", "SE");
            d(188304, "66fc4c46-aff7-48f2-ab94-2da026025bd7_101021-0000.ACI-ENT-EVN.png", "21/10/2010 00:00", "SE");
            d(188305, "1ebac1ce-02c1-4678-99b6-8b34739dd18f_101022-0000.ACI-ENT-EVN.png", "22/10/2010 00:00", "SE");
            d(188308, "429921ab-880c-40ad-bc73-fac5ea8a1d7a_101023-0000.ACI-ENT-EVN.png", "23/10/2010 00:00", "SE");
            d(194268, "c5df61e0-dc9c-47c0-b159-87172f369c7c_101023-0000.ACI-ENT-EVN.png", "23/10/2010 00:00", "SE Frog Pond");
            d(194270, "e9cb7c3a-7625-41be-a7bc-7d0aded4f2c8_101022-0000.ACI-ENT-EVN.png", "22/10/2010 00:00", "SE Frog Pond");
            d(194274, "5fc5b91b-19df-49f4-9334-59ea388ce270_101021-0000.ACI-ENT-EVN.png", "21/10/2010 00:00", "SE Frog Pond");
            d(194279, "d52fb98d-ff9b-493e-b7a1-13a7158c7e2a_101020-0000.ACI-ENT-EVN.png", "20/10/2010 00:00", "SE Frog Pond");
            d(194280, "10deef30-403b-4059-9e37-882eca06d002_101019-0000.ACI-ENT-EVN.png", "19/10/2010 00:00", "SE Frog Pond");
            d(194285, "588293a7-69e6-45e7-88cc-eef0aa2f2870_101018-0000.ACI-ENT-EVN.png", "18/10/2010 00:00", "SE Frog Pond");
            d(194287, "d6ab80a4-4bd5-45c7-a4f9-6af9aa0d9dc6_101017-0000.ACI-ENT-EVN.png", "17/10/2010 00:00", "SE Frog Pond");
            d(194291, "3a8d816f-02f4-4cb7-8c8f-3b1a3ccbbdc9_101016-0000.ACI-ENT-EVN.png", "16/10/2010 00:00", "SE Frog Pond");
            d(194295, "cf581eb9-4f05-438b-984c-e4b24aab5c87_101015-0000.ACI-ENT-EVN.png", "15/10/2010 00:00", "SE Frog Pond");
            d(194297, "23e73d8a-6a02-40c1-92cb-9d7fc1089ee9_101014-0000.ACI-ENT-EVN.png", "14/10/2010 00:00", "SE Frog Pond");
            d(194302, "8c06aa3a-1946-48f7-abf4-10b0b32fcb14_101013-0000.ACI-ENT-EVN.png", "13/10/2010 00:00", "SE Frog Pond");

        }
    ]
);
