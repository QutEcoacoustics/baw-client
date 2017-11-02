var sampleLabels = angular.module("bawApp.citizenScience.sampleLabels", ["bawApp.citizenScience.common"]);

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
    function SampleLabels(CitizenScienceCommon, $http) {

        var self = this;

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

        /**
         * stringifies the object that acts as a join between samples and labels
         * Then stores that json string in local storage
         */
        self.writeToStorage = function () {
            var value = JSON.stringify(self.data);
            localStorage.setItem(self.localStorageKey, value);
            console.log("saved responses: ", value + "ok");
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

            // var url = CitizenScienceCommon.apiUrl("setLabels",
            //     self.csProject,
            //     sample.name,
            //     sample.recordingId,
            //     sample.startOffset,
            //     CitizenScienceCommon.labelsAsString(tags));
            // $http.get(url).then(function (response) {
            //     console.log(response.data);
            // });

        };


        self.functions = {

            init : self.init,

            /**
             * Looks up the data to see if there is a boolean value stored for a given sampleId and labelId
             * and if so, returns it.
             * @param sampleId
             * @param labelId
             * @returns {boolean}
             */
            getValue : function (sampleId, labelId) {

                if (self.data[sampleId] !== undefined) {
                    if (self.data[sampleId][labelId] !== undefined) {
                        return self.data[sampleId][labelId].value;
                    }
                }
                return false;
            },

            /**
             * updates the value of a labelId applied to a sampleId as either true or false
             * @param sampleId int
             * @param labelId int; if omitted, we are not applying a label but noting that the sample has been viewed
             * @param value int [0,1]
             */
            setValue : function (sampleId, labelId, value) {

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
                //self.submitResponse(sampleId, labelId, value);

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

            }





        };

        return self.functions;

    }]);



