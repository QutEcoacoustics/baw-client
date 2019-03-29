var sampleLabels = angular.module("bawApp.citizenScience.sampleLabels",
["bawApp.citizenScience.common", "baw"]);

/**
 *  Keeps track of the labels applied to the current sample.
 *  Sends as a data for a questionResponse in the following structure
 *  {
 *  'labelsIds': [1,3,4,7]
 *  }
 *
 *
 */
sampleLabels.factory("SampleLabels", [
    "CitizenScienceCommon",
    "$http",
    "QuestionResponse",
    function SampleLabels(CitizenScienceCommon, $http, QuestionResponse) {

        var self = this;

        // the data for questionResponses. Each question will have a unique key
        self.data = {};
        self.hasResponse = false;



        /**
         * happens once when the questions are loaded by the citizen science study controller
         * @param questionid int
         * @param studyId int
         */
        self.init = function (questionId = false, studyId = false) {

            if (studyId !== false) {
                self.data.studyId = studyId;
            }
            if (questionId !== false) {
                self.data.questionId = questionId;
            }

            return self.data;

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
            getValue : function (labelId) {

                return self.data.labels.has(labelId);

            },

            /**
             * updates the value of a labelId applied to a sampleId as either true or false
             * @param sampleId int; if null, will use the current sample id
             * @param labelId int; if omitted, we are not applying a label but noting that the sample has been viewed
             * @param value int [0,1]
             */
            setValue : function (labelId, value) {

                if (labelId !== undefined) {
                    self.hasResponse = true;
                    if (value) {
                        self.data.labels.add(labelId);
                    } else {
                        self.data.labels.delete(labelId);
                    }
                }

            },

            /**
             * sends the response to the server using the questionResponse service
             */
            sendResponse : function (notes) {

                if (self.data.datasetItemId) {
                    // convert labels to data json
                    self.data.data = {"labels": [...self.data.labels]};
                    if (notes) {
                        self.data.data.notes = notes;
                    }
                    QuestionResponse.createQuestionResponse(self.data.questionId, self.data.datasetItemId, self.data.studyId, self.data.data);
                }

            },

            /**
             * empties the data and updates the datasetItemId
             * @param newDatasetItemId
             */
            reset : function (newDatasetItemId) {

                self.data.datasetItemId = newDatasetItemId;
                self.data.labels = new Set();
                // hasResponse will be stay true if a value has been added and then removed
                // until this init function is called.
                self.hasResponse = false;

            },

            /**
             * returns an object that holds all the labels that have been applied to
             * the given sample and their values. (if a label has been removed then it will be stored
             * as false. If it has never been applied, it will not be present).
             * @param sampleId
             * @returns {*}
             */
            getLabelsForSample : function () {

                return [...self.data.labels];
            },

            /**
             * Returns whether any responses have been recorded for the current dataset item and question
             * @param sampleId
             */
            hasResponse : function () {
                return self.hasResponse;
            }

        };

        return self.functions;

    }]);



