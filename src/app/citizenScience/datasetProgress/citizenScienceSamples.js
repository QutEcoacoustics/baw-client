var csSamples = angular.module("bawApp.citizenScience.csSamples", ["bawApp.citizenScience.common"]);


/**
 * Manages the queue of dataset items that will be shown to citizen science users
 */
csSamples.factory("CsSamples", [
    "CitizenScienceCommon",
    "DatasetItem",
    "ProgressEvent",
    "AudioRecording",
    function CsSamples(CitizenScienceCommon, DatasetItem, ProgressEvent, AudioRecording) {

        var self = this;

        self.resetlist = function () {
            self.currentIndex = { page: -1, item: -1};
            self.pages = [];
        };
        self.resetlist();

        /**
         * Returns the number of items in the current page, or 0 if the indexes
         * are out of bounds
         * @return {number}
         */
        self.currentPageLength = function () {
            if (self.currentIndex.page < 0) {
                return 0;
            } else if (self.pages.length < self.currentIndex.page + 1) {
                // current page doesn't exit yet
                return 0;
            } else {
                return self.pages[self.currentIndex.page].data.length;
            }
        };


        /**
         * Sets the currentItem property based on the current item indexes,
         * with some checks to see if they are not out of bounds
         * Sends a "viewed" progress event to the server
         */
        self.setCurrentItem = function () {
            if (self.currentIndex.page < self.pages.length &&
                self.currentIndex.page > -1 &&
                self.currentIndex.item > -1 &&
                self.currentIndex.item < self.currentPageLength()) {
                self.currentItem = self.pages[self.currentIndex.page].data[self.currentIndex.item];
                ProgressEvent.createProgressEvent(self.currentItem.id, "viewed");
                // check if there is another item after this, and if so, go to it.
                if (!self.nextItemIndexes()) {
                    self.requestPageOfItems(false);
                }
            } else {
                self.currentItem = false;
            }
        };


        /**
         * Returns the page number and item number of the next item
         * or if there is no next item, returns false
         */
        self.nextItemIndexes = function () {

            if (!self.currentItem) {
                return false;
            }
            if (self.currentIndex.item === self.currentPageLength() - 1 && self.currentIndex.page === self.pages.length - 1) {
                return false;
            }

            var nextItemIndex = self.currentIndex.item + 1;
            var nextPageIndex = self.currentIndex.page;

            // go to next page if necessary
            if(self.currentPageLength() < nextItemIndex + 1) {
                nextPageIndex = nextPageIndex+ 1;
                nextItemIndex = 0;
            }

            return {page: nextPageIndex, item: nextItemIndex};

        };

        self.setCurrentItem();

        /**
         * Adds a new page of items to the list of pages
         * @param thenSelectNewItem boolean; if true will update the current item to be the first item
         * in the new page of items
         */
        self.requestPageOfItems = function (thenSelectNewItem = false) {
            var nextPageNum;
            if (self.pages.length > 0) {
                 nextPageNum = self.pages[self.pages.length - 1].meta.paging.page + 1;
                if (self.pages[self.pages.length - 1].meta.paging.maxPage < nextPageNum) {
                    // we have reached the last page already
                    return false;
                }
            } else {
                nextPageNum = 1;
            }

            DatasetItem.datasetItems(self.datasetId, nextPageNum).then(x => {
                // todo: handle when result comes back as length 0
                console.log("page of items loaded", x);
                self.pages[nextPageNum - 1] = x.data;
                if (thenSelectNewItem) {
                    self.currentIndex.page = nextPageNum - 1;
                    self.currentIndex.item = 0;
                    self.setCurrentItem();
                }

                self.addAudioRecordingFields(x.data.data);

            });

        };



        /**
         * Adds AudioRecording object to each dataset item, which lets us know the site id and UTC start time of the item
         * @param datasetItems
         */
        self.addAudioRecordingFields = function (datasetItems) {

            var recordingIds = datasetItems.map(x => x.audioRecordingId);
            // unique values
            recordingIds = [...new Set(recordingIds)];

            AudioRecording.getRecordingsForLibrary(recordingIds).then(x => {

                var audioRecordings = x.data.data;

                datasetItems.forEach(datasetItem => {
                    var audioRecording = audioRecordings.find(ar => ar.id === datasetItem.audioRecordingId);
                    datasetItem.audioRecording = audioRecording;
                });

            });

        };


        self.publicFunctions = {

            /**
             * make a request for a specific dataset item. When the response comes,
             * make that item the current item, empty the list, then request a page to append
             * @param datasetItemId
             * @return Promise that returns the dataset item
             */
            selectById : function (datasetItemId) {
                return DatasetItem.datasetItem(self.datasetId, datasetItemId).then(x => {
                    // todo: need something to stop this being called twice before response comes
                    self.resetlist();
                    self.currentItem = x.data.data[0];
                    self.requestPageOfItems(false);
                    return x.data.data[0];
                });
            },

            init : function (datasetId) {
                self.datasetId = datasetId;
                self.requestPageOfItems(true);
            },

            /**
             * Increments the currentItemIndex and requests a new page if we are at the end of the current page
             * If called while the currentItemIndex is the last item, this does function does nothing
             */
            nextItem : function () {

                var nextIndex = self.nextItemIndexes();
                if (nextIndex) {
                    self.currentIndex.page = nextIndex.page;
                    self.currentIndex.item = nextIndex.item;
                    self.setCurrentItem();
                } else {
                    // there is no next item so request a new page and go to the first item of it
                    self.requestPageOfItems(true);
                }

                // note: indexes are 0-indexed, paging is 1-indexed
                var debug_message = {currentIndex: self.currentIndex, currentPageMeta: self.pages[self.pages.length - 1].meta.paging};
                console.log("moved to next page: ", debug_message);

            },

            nextItemAvailable : function () {
                var nextIndex = self.nextItemIndexes();
                return Boolean(nextIndex);
            },

            currentItem: function () {
                return self.currentItem;
            },

            onPlayed: function () {
                ProgressEvent.createProgressEvent(self.currentItem.id, "played");
            }

        };

        return self.publicFunctions;

    }]);
