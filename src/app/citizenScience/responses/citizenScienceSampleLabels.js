var sampleLabels = angular.module("bawApp.citizenScience.sampleLabels",
["bawApp.citizenScience.common", "baw"]);

/**
 *
 *  Handles applying labels to and removing labels from samples
 *  The "join" between labels and samples is stored in JSON in the following structure
 *  {
 *  'sampleId': {
 *    'labelId': {
 *      'value': [1,0],
 *      'timestamp': [timestamp]
 *      }
 *      ...
 *    }
 *    ...
 *  }
 *
 *
 */
sampleLabels.factory("SampleLabels", [
    "CitizenScienceCommon",
    "$http",
    "DatasetItem",
    function SampleLabels(CitizenScienceCommon, $http, DatasetItem) {

        var self = this;

        self.datasetId = 3;

        /**
         * checks the local storage for sampleLabels
         */
        self.init = function (citizenScienceProject) {

            self.localStorageKey = citizenScienceProject + "_sampleLabels";

            var data = localStorage.getItem(self.localStorageKey);

            if (data !== null) {
                self.data = JSON.parse(data);
            } else {
                self.data = {};
            }

            self.csProject = citizenScienceProject;

            return self.data;

        };

        self.currentSampleId = 0;

        /**
         * stringifies the object that acts as a join between samples and labels,
         * then stores that json string in local storage
         */
        self.writeToStorage = function () {
            var value = JSON.stringify(self.data);
            localStorage.setItem(self.localStorageKey, value);
        };


        /**
         * submits all responses to the server
         * will merge with existing responses using timestamp of each response to save the latest
         * @param sampleId
         * @param labelId
         * @param value
         */
        self.submitResponse = function () {

            //TODO

        };


        self.functions = {

            init : self.init,

            /**
             * Looks up the data to see if there is a boolean value stored for a given sampleId and labelId
             * and if so, returns it.
             * @param sampleId. If omitted, will use the current sample if available
             * @param labelId
             * @returns {boolean}
             */
            getValue : function (sampleId, labelId) {

                if (sampleId === null) {
                    sampleId = self.currentSampleId;
                }

                if (self.data[sampleId] !== undefined) {
                    if (self.data[sampleId][labelId] !== undefined) {
                        return self.data[sampleId][labelId].value;
                    }
                }
                return false;
            },

            /**
             * updates the value of a labelId applied to a sampleId as either true or false
             * @param sampleId int; if null, will use the current sample id
             * @param labelId int; if omitted, we are not applying a label but noting that the sample has been viewed
             * @param value int [0,1]
             */
            setValue : function (sampleId, labelId, value) {


                if (sampleId === null) {
                    sampleId = self.currentSampleId;
                }

                if (sampleId <= 0) {
                    console.warn("bad sampleId supplied");
                    return;
                }

                if (self.data[sampleId] === undefined) {
                    self.data[sampleId] = {};
                }

                if (labelId !== undefined) {

                    if (self.data[sampleId][labelId] === undefined) {
                        self.data[sampleId][labelId] = {};
                    }

                    self.data[sampleId][labelId].value = value;
                    self.data[sampleId][labelId].timestamp = new Date();

                }

                self.writeToStorage();
                self.submitResponse(sampleId, labelId, value);

            },

            /**
             * returns an object that holds all the labels that have been applied to
             * the given sample and their values. (if a label has been removed then it will be stored
             * as false. If it has never been applied, it will not be present).
             * @param sampleId
             * @returns {*}
             */
            getLabelsForSample : function (sampleId) {

                if (typeof(self.data[sampleId]) !== "object") {
                    self.data[sampleId] = {};
                }

                return self.data[sampleId];
            },

            /**
             * Returns whether any responses have been recorded for a sample
             * @param sampleId
             */
            hasResponse : function (sampleId = -1) {

                if (sampleId < 0) {
                    sampleId = self.currentSampleId;
                }

                if (!self.data.hasOwnProperty(sampleId)) {
                    return false;
                }

                return (Object.keys(self.data[sampleId]).length > 0);

            },

            /**
             * returns the number of samples that have responses
             * If a sample is viewed, but no labels are applied, an element
             * should be added to the data object as an empty object
             */
            getNumSamplesViewed : function () {
                if (self.data !== undefined) {
                    return Object.keys(self.data).length;
                } else {
                    return 0;
                }

            },

            registerCurrentSampleId : function (currentSampleId) {
                self.currentSampleId = currentSampleId;
            },

            /**
             * Dev function to delete all applied labels
             */
            clearLabels : function () {
                self.data = {};
                self.writeToStorage();
            },

            /**
             * Combines the SampleLabels data with the samples and labels
             * to return the full report of which labels have been applied to which samples
             * @return {{}|*}
             */
            getData : function (labels) {

                var d = self.data;

                var keys = Object.keys(d);

                if (keys.length === 0) {
                    return d;
                }

                var currentKey = -1;

                var addItemDetails = function (response) {

                    var datasetItemId = keys[currentKey];

                    d[datasetItemId] = {
                        "sample" : response.data.data[0],
                        "labels" : JSON.parse(JSON.stringify(d[datasetItemId]))
                    };

                    for (var labelId in d[datasetItemId].labels) {

                        if (d[datasetItemId].labels.hasOwnProperty(labelId)) {

                            d[datasetItemId].labels[labelId] = {
                                "label": labels.find(l => true),
                                "response": JSON.parse(JSON.stringify(d[datasetItemId].labels[labelId]))
                            };

                        }

                    }

                    requestNextItem();


                };

                var requestFailed = function (response) {
                    requestNextItem();
                };

                var requestNextItem = function () {
                    currentKey++;
                    // recurse to do the next dataset item
                    if (currentKey < keys.length) {
                        DatasetItem.datasetItem(self.datasetId, keys[currentKey]).then(addItemDetails, requestFailed);
                    }
                };

                // request the first dataset item and add it to the returned object.
                // when that is finished it will do the next one.
                requestNextItem();


                return d;
            }

        };

        return self.functions;

    }]);



