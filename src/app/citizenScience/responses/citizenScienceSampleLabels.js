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
         * updates the value of a labelId applied to a sampleId as either true or false
         * @param labelId int; may be omitted if it is a binary (only one label) task.
         * @param value int [0,1]
         */
        self.setValue = function (value, labelId) {

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
         * Looks up the data to see if there is a boolean value stored for a given sampleId and labelId
         * and if so, returns it.
         * @param sampleId. If omitted, will use the current sample if available
         * @param labelId
         * @returns {boolean}
         */
        self.getValue = function (labelId) {

            if (labelId === undefined && self.labels.length === 1) {
                labelId = 1;
            }
            return self.data.labels.has(labelId);
        };

        self.functions = {

            init : self.init,
            getValue : self.getValue,
            setValue : self.setValue,
            setValueBinary : self.setValueBinary,

            /**
             * sends the response to the server using the questionResponse service
             */
            sendResponse : function (notes, userNotes) {

                if (self.data.datasetItemId) {
                    // convert labels to data json
                    // just an array of label ids
                    self.data.data = {"labelIds": [...self.data.labels]};
                    // json object with status for all positive labels
                    self.data.data.labels = self.labels.reduce(function (map, obj, idx, src) {
                        if (self.data.labels.has(obj.id)) {
                            map.push(obj.name);
                        }
                        return map;
                    },[]);
                    if (notes) {
                        self.data.data.notes = notes;
                    }
                    if (userNotes) {
                        self.data.data.userNotes = userNotes;
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
            },

            getLabels: function () { return self.labels; }

        };

        return self.functions;

    }]);



