var csApiMock = angular.module("bawApp.citizenScience.csApiMock", ["bawApp.citizenScience.common"]);


/**
 * Mocks the api responses for citizenScienceProjects that
 * will eventually go on the server
 */





sampleLabels.factory("CsApi", [
    "CitizenScienceCommon",
    "$http",
    function CsApi(CitizenScienceCommon, $http) {

        var self = this;

        self.useLocalData = true;

        self.sheets_api_url = "http://" + window.location.hostname + ":8081";
        self.local_api_url = "/public/citizen_science";


        /**
         * Constructs a url for the request by concatenating the arguments, joined by "/"
         * and appending to the relevant baseURL
         * @returns {string|*}
         */
        self.apiUrl = function () {
            // convert to array
            var base_url, url;
            if (self.useLocalData) {
                base_url = self.local_api_url;
            } else {
                base_url = self.sheets_api_url;
            }
            var args = Array.prototype.slice.call(arguments);

            url = [base_url].concat(args).join("/");

            if (self.useLocalData) {
                url = url + ".json";
            }

            return url;
        };

        self.publicFunctions = {



        getSamples : function () {
            if ($scope.samples.length === 0) {

                var url = self.functions.apiUrl(
                    "samples",
                    $scope.csProject,
                    UserProfile.profile.userName);
                //TODO: error handling
                $http.get(url).then(function (response) {
                    var samples = response.data;
                    $scope.samples = samples;
                    $scope.currentSampleNum = 0;
                });
            }
        }

    };

        return publicFunctions;



    }]);


