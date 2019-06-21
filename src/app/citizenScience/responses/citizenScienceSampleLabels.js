var sampleLabels = angular.module("bawApp.citizenScience.sampleLabels",
["bawApp.citizenScience.common", "baw"]);

/**
 *  Keeps track of the labels applied to the current sample.
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
        self.allowEmpty = true;
        self.allowMulti = true;
        self.labels = false;


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
                self.data.questionId = question.id;
                self.labels =  question.questionData.labels;

                if (question.questionData.hasOwnProperty("allowEmpty")) {
                    self.allowEmpty = question.questionData.allowEmpty;
                }

                if (question.questionData.hasOwnProperty("allowMulti")) {
                    self.allowMulti = question.questionData.allowMulti;
                }
                if (question.questionData.labels.length === 1) {
                    // for binary yes/no there is only one label, therefore no multi select
                    self.allowMulti = false;
                }

                // if label ids are not supplied, add them in.
                if (!self.labels.every(l => l.hasOwnProperty("id"))) {

                    // if only some but not all label ids are supplied, error
                    if (self.labels.some(l => l.hasOwnProperty("id"))) {
                        console.error("Invalid question data: Some but not all labels have ids");
                    }

                    self.labels = self.labels.map((l,i) => {
                        l.id = i+1;
                        return(l);
                    });

                }

            }

            return self.data;

        };


        /**
         * adds or removes a label id from the list of true labels ids. This is now deprecated and
         * here only for reference, since we now allow 'yes' and 'maybe' for a label.
         * @param labelId int; may be omitted if it is a binary (only one label) task.
         * @param value int [0,1]
         */
        self.setValueOld = function (value, labelId) {

            if (labelId === undefined && self.labels.length === 1) {
                labelId = 1;
            }

            if (labelId !== undefined) {
                self.hasResponse = true;
                if (value) {
                    if (!self.allowMulti) {
                        self.data.labels.clear();
                    }
                    self.data.labels.add(labelId);
                } else {
                    self.data.labels.delete(labelId);
                }
            } else {
                console.warn("Label id not defined");
            }

        };


        /**
         * updates the
         * @param value String
         * @param labelId Int
         */
        self.setValue = function (value, labelId) {

            if (labelId === undefined && self.labels.length === 1) {
                labelId = 1;
            }

            if (labelId !== undefined) {
                self.hasResponse = true;
                if (value === "yes" && !self.allowMulti) {
                    self.data.labels = {};
                }

                self.data.labels[labelId] = value;


            } else {
                console.warn("Label id not defined");
            }

        };


        /**
         * Looks up the data to see if there is a boolean value stored for a given labelId
         * and if so, returns it.
         * @param labelId
         * @returns {boolean}
         */
        self.getValueOld = function (labelId) {

            if (labelId === undefined && self.labels.length === 1) {
                labelId = 1;
            }
            return self.data.labels.has(labelId);
        };

        /**
         * Looks up the data to see if there is a value stored for a given labelId
         * and if so, returns it, else returns "empty"
         * @param labelId Int
         * @returns {string}
         */
        self.getValue = function (labelId) {

            if (labelId === undefined && self.labels.length === 1) {
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
            setValueBinary : self.setValueBinary,

            /**
             * sends the response to the server using the questionResponse service
             * @param notes string optional; message about the state when the response was submitted, e.g. autoplay on
             * @param userNotes string optional; message that the user entered
             */
            sendResponse : function (notes, userNotes) {


                if (self.data.datasetItemId) {

                    // convert labels to data json
                    // just an array of label ids
                    var userResponseData = {"labelIds": Object.keys(self.data.labels)};
                    // json object with status for all non-empty labels
                    userResponseData.labels = self.data.labels;
                    if (notes) {
                        userResponseData.notes = notes;
                    }
                    if (userNotes) {
                        userResponseData.userNotes = userNotes;
                    }
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
            },

            allowEmpty : function () {
                return self.allowEmpty;
            },

            getLabels: function () { return self.labels; }

        };

        return self.functions;

    }]);



