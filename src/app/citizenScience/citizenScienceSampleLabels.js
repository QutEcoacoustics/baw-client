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
        self.init = function (citizenScienceProject, samples, labels) {

            self.localStorageKey = citizenScienceProject + "_sampleLabels";

            var data = localStorage.getItem(self.localStorageKey);

            if (data !== null) {
                self.data = JSON.parse(data);
            } else {
                self.data = {};
            }

            self.samples = samples;
            self.labels = labels;
            self.csProject = citizenScienceProject;

            return self.data;

        };

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
             * @param labelId int
             * @param value int [0,1]
             */
            setValue : function (sampleId, labelId, value) {

                if (self.data[sampleId] === undefined) {
                    self.data[sampleId] = {};
                }


                if (self.data[sampleId][labelId] === undefined) {
                    self.data[sampleId][labelId] = {};
                }

                self.data[sampleId][labelId].value = value;
                self.data[sampleId][labelId].timestamp = new Date();

                self.writeToStorage();
                self.submitResponse(sampleId, labelId, value);

            },

            getLablesForSample : function (sampleId) {

                if (typeof(self.data[sampleId]) !== "object") {
                    self.data[sampleId] = {};
                }

                return self.data[sampleId];

            }





        };

        return self.functions;

    }]);



