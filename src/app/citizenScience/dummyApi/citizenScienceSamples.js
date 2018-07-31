var csSamples = angular.module("bawApp.citizenScience.csSamples", ["bawApp.citizenScience.common"]);


/**
 * Manages the queue of dataset items that will be shown to citizen science users
 */
csSamples.factory("CsSamples", [
    "CitizenScienceCommon",
    "$http",
    "DatasetItem",
    function CsSamples(CitizenScienceCommon, $http, DatasetItem) {

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


        // will store a list of dataset items
        self.items = [];

        // Populate self.items with dataset items
        DatasetItem.datasetItems(3).then(x => {
            console.log("page of items loaded", x);
            self.items = self.items.concat(x.data.data);
            self.publicFunctions.isReady = true;
        });


        /**
         * Adds previous and next items to the current dataset item
         * so that back and forward links can be easily added.
         * @param itemNum
         * @returns {*}
         */
        self.setupSample = function (itemNum) {

            if (itemNum <= -1) {
                return false;
            }

            var item = self.items[itemNum];

            if (itemNum > 0) {
                item.previousSampleId = self.items[itemNum - 1].id;
            } else {
                item.previousSampleId = null;
            }
            if (itemNum < self.items.length-1) {
                item.nextSampleId = self.items[itemNum + 1].id;
            } else {
                item.nextSampleId = null;
            }

            return item;

        };

        self.publicFunctions = {

            /**
             * Gets the media data for the specified sample
             *
             * @param datasetItemId
             */
            getSample : function (datasetItemId) {

                // find the sample within the current list of samples
                var itemNum = self.items.findIndex(item => item.id === parseInt(datasetItemId));
                return self.setupSample(itemNum);

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
            },

            isReady: false

        };

        return self.publicFunctions;

    }]);


