var sampleLabels = angular.module("bawApp.citizenScience.sampleLabels",
["bawApp.citizenScience.common", "baw"]);

/**
 *  Keeps track of the labels applied to the current sample.
 */
sampleLabels.factory("SampleLabels", [
    "$http",
    "QuestionResponse",
    function SampleLabels($http, QuestionResponse) {

        var self = this;

        self.question = {
            allowEmpty: true,
            allowMulti: true,
            labels: [],
            fields: []
        };

        self.data = {
            labels: {},
            fields: {},
            hasResponse: false
        };



        /**
         * happens once when the questions are loaded by the citizen science study controller
         * @param questionid int
         * @param studyId int
         */
        self.init = function (question = false, studyId = false) {

            if (studyId !== false) {
                self.data.studyId = studyId;
            }
            if (question !== false) {

                // TODO: update to handle multiple questions

                self.data.questionId = question.id;

                self.question.labels =  question.questionData.labels;

                // set defaults
                if (question.questionData.hasOwnProperty("allowEmpty")) {
                    self.question.allowEmpty = question.questionData.allowEmpty;
                }

                if (question.questionData.hasOwnProperty("allowMulti")) {
                    self.question.allowMulti = question.questionData.allowMulti;
                }
                if (question.questionData.labels.length === 1) {
                    // for binary yes/no there is only one label, therefore no multi select
                    self.question.allowMulti = false;
                }

                // if label ids are not supplied, add them in.
                if (!self.question.labels.every(l => l.hasOwnProperty("id"))) {

                    // if only some but not all label ids are supplied, error
                    if (self.question.labels.some(l => l.hasOwnProperty("id"))) {
                        console.error("Invalid question data: Some but not all labels have ids");
                    }

                    self.question.labels = self.question.labels.map((l,i) => {
                        l.id = i+1;
                        return(l);
                    });

                }

                if (question.questionData.hasOwnProperty("fields")) {
                    // this holds field definitions, including field type
                    self.question.fields = question.questionData.fields;
                }

            }

            return self.data;

        };



        /**
         * updates the labels object to set the value for the given key
         * @param value String
         * @param labelId Int
         */
        self.setValue = function (value, labelId) {

            if (labelId === undefined && self.question.labels.length === 1) {
                labelId = 1;
            }

            if (labelId !== undefined) {
                self.data.hasResponse = true;
                if (value === "yes" && !self.question.allowMulti) {
                    self.data.labels = {};
                }

                self.data.labels[labelId] = value;


            } else {
                console.warn("Label id not defined");
            }

        };


        /**
         * Looks up the data to see if there is a value stored for a given labelId
         * and if so, returns it, else returns "empty"
         * @param labelId Int
         * @returns {string}
         */
        self.getValue = function (labelId) {

            if (labelId === undefined && self.question.labels.length === 1) {
                labelId = 1;
            }

            if (self.data.labels.hasOwnProperty(labelId)) {
                return self.data.labels[labelId];
            } else {
                return "empty";
            }

        };


        self.functions = {

            init : self.init,
            getValue : self.getValue,
            setValue : self.setValue,

            /**
             * sends the response to the server using the questionResponse service
             * @param notes string optional; message about the state when the response was submitted, e.g. autoplay on
             * @param userNotes string optional; message that the user entered
             */
            sendResponse : function (notes = false) {


                if (self.data.datasetItemId) {

                    // convert labels to data json
                    // just an array of label ids
                    var userResponseData = {"labelIds": Object.keys(self.data.labels)};
                    // json object with status for all non-empty labels
                    userResponseData.labels = self.data.labels;
                    if (notes) {
                        userResponseData.notes = notes;
                    }

                    Object.assign(userResponseData, self.data.fields);

                    QuestionResponse.createQuestionResponse(self.data.questionId, self.data.datasetItemId, self.data.studyId, userResponseData);
                }

            },

            /**
             * empties the data and updates the datasetItemId
             * @param newDatasetItemId
             */
            reset : function (newDatasetItemId) {

                self.data.datasetItemId = newDatasetItemId;
                self.data.labels = {};
                self.data.fields = {};
                self.question.fields.forEach(f => self.data.fields[f.name] = "");
                // hasResponse will be stay true if a value has been added and then removed
                // until this init function is called.
                self.data.hasResponse = false;

            },

            /**
             * Returns whether any responses have been recorded for the current dataset item and question
             * @param sampleId
             */
            hasResponse : function () {
                return self.data.hasResponse;
            },


            allowEmpty : function () {
                return self.question.allowEmpty;
            },

            question: self.question,
            data: self.data
        };

        return self.functions;

    }]);



