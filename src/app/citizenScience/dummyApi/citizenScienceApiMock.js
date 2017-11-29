var csApiMock = angular.module("bawApp.citizenScience.csApiMock", ["bawApp.citizenScience.common"]);


/**
 * Mocks the api responses for citizenScienceProjects that
 * will eventually go on the server
 */


csApiMock.factory("CsApi", [
    "CitizenScienceCommon",
    "$http",
    function CsApi(CitizenScienceCommon, $http) {

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
             * Gets the media data for the specified sample
             * For now, (because the API is not actually functional), we request all samples as a big
             * json dump, then filter to get the specified sample.
             *
             * Inject the previous and next sample id into the sample we will return, which is what the
             * Api will probably do for us in the future.
             *
             * @param datasetItemId
             */
            getSample : function (datasetItemId) {

                    var url = self.apiUrl(
                        "samples",
                        "ebb",
                        "phil");
                    //TODO: error handling
                    return $http.get(url).then(function (response) {

                        // mock version returns all samples. Then we search then here to get the right one
                        var itemNum = response.data.findIndex(item => item.id === datasetItemId);

                        if (itemNum === -1) {
                            return {};
                        }

                        var item = response.data[itemNum];
                        if (itemNum > 0) {
                            item.previousSampleId = response.data[itemNum - 1].id;
                        } else {
                            item.previousSampleId = null;
                        }
                        if (itemNum < response.data.length-1) {
                            item.nextSampleId = response.data[itemNum + 1].id;
                        } else {
                            item.nextSampleId = null;
                        }

                        return item;
                    });
            },
            /**
             * Gets the identifier for the next sample
             * to be used for navigation.
             * @param datasetItemId int
             */
            getNextSample : function (datasetItemId) {
                var url = self.apiUrl(
                    "nextSample",
                    "ebb");
                return $http.get(url).then(function (response) {
                    return response.data;
                });

            },
            /**
             * Gets the identifier for the previous sample,
             * to be used for navigation
             * @param datasetItemId int
             */
            getPrevousSample : function (datasetItemId) {
                var url = self.apiUrl(
                    "previousSample",
                    "ebb");
                return $http.get(url).then(function (response) {
                    return response.data;
                });

            },

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

            /**
             * Gets all settings associated with the specified citizen science project
             * @param project string
             * @returns {HttpPromise}
             */
            getSettings: function (project) {
                return $http.get(self.apiUrl(
                    "settings",
                    project
                ));
            }

        };

        return self.publicFunctions;

    }]);


