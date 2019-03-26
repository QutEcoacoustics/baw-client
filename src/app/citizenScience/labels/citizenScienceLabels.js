var csLabels = angular.module("bawApp.citizenScience.csLabels", ["bawApp.citizenScience.common"]);


/**
 * Manages the data for labels that will be applied to cs samples
 */
csLabels.factory("CsLabels", [
    "CitizenScienceCommon",
    "$http",
    function CsLabels(CitizenScienceCommon, $http) {

        var self = this;
        self.useLocalData = true;
        self.sheets_api_url = "http://" + window.location.hostname + ":8081";
        self.local_api_url = "/public/citizen_science";


        /**
         * Constructs a url for the request by concatenating the arguments, joined by "/"
         * and appending to the relevant baseURL. Allows experimenting with different sources
         * for the data without changing everything
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


            /**
             * Gets all labels associated with the specified citizen science project
             * @param project string
             */
            getLabels: function (project) {
                var response = $http.get(self.apiUrl(
                    "labels",
                    project
                ));

                return response.then(function (response) {
                    var labels = [];
                    if (Array.isArray(response.data)) {
                        labels = response.data;
                    }

                    return labels;
                });
            },

        };

        return self.publicFunctions;

    }]);


