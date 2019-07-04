var csSamples = angular.module("bawApp.citizenScience.csSamples", ["bawApp.citizenScience.common"]);


/**
 * Manages the queue of dataset items that will be shown to citizen science users
 */
csSamples.factory("CsSamples", [
    "DatasetItem",
    "ProgressEvent",
    "AudioRecording",
    "annotationLibraryCommon",
    function CsSamples(DatasetItem, ProgressEvent, AudioRecording, libraryCommon) {

        var self = this;

        /**
         * CurrentIndex hold the current page number (0-indexed) and item is current item within the current page (0-indexed)
         * Pages is an array of arrays of dataset items.
         * currentIndex.page refers to the array index in the outer array
         * currentIndex.item refers to the array index in the inner array
         */
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
                // first page has not been loaded yet - currentPage is still set to initialization value
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
         * or if there is no next item, returns false.
         * This is basically incrementing the currentIndex.page, but with handling when
         * we get to the end of the page (end of one of the inner arrays of self.pages)
         */
        self.nextItemIndexes = function () {

            // there is no current item, so we don't want to go to the next.
            if (!self.currentItem) {
                return false;
            }

            // we are at the end of the last item of the last page, so there is no next item index
            if (self.currentIndex.item === self.currentPageLength() - 1 && self.currentIndex.page === self.pages.length - 1) {
                return false;
            }

            // increment assuming that there is another item on this page
            var nextItemIndex = self.currentIndex.item + 1;
            var nextPageIndex = self.currentIndex.page;

            // check if we passed the end of the page and go to next page if necessary
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
                // the pagenumber to send with the request, based on incrementing the page
                // number of the last page we currently have.
                 nextPageNum = self.pages[self.pages.length - 1].meta.paging.page + 1;
                if (self.pages[self.pages.length - 1].meta.paging.maxPage < nextPageNum) {
                    // we have reached the last page already
                    return false;
                }
            } else {
                nextPageNum = 1;
            }

            DatasetItem.datasetItems(self.datasetId, nextPageNum).then(x => {

                // this should always be the same
                self.totalItems = x.data.meta.paging.total;

                if (x.data.data.length > 0) {
                    self.pages[nextPageNum - 1] = x.data;
                    if (thenSelectNewItem) {
                        self.currentIndex.page = nextPageNum - 1;
                        self.currentIndex.item = 0;
                        self.setCurrentItem();
                    }

                    var associationData = {
                        annotations: x.data.data,
                        annotationIds: x.data.data.map((dsi) => dsi.id),
                        recordingIds: x.data.data.map((dsi) => dsi.audioRecordingId)

                    };

                    // this adds associated records to the data
                    return libraryCommon.getSiteMediaAndProject(associationData).then((y) => {

                        // todo: generalise the annotationLibraryCommon naming to be general
                        // currently we are piggybacking on annotationLibrary logic, which does
                        // almost exactly what we need but for AudioEvents instead of DatasetItems
                        y.annotations.forEach((datasetItem) => {

                            datasetItem.start = new Date(datasetItem.audioRecording.recordedDate.getTime() + datasetItem.startTimeSeconds * 1000);
                            datasetItem.end = new Date(datasetItem.audioRecording.recordedDate.getTime() + datasetItem.endTimeSeconds * 1000);

                        });

                    });


                } else {
                    console.warn("Empty page of dataset items returned");
                }

            });

        };


        self.publicFunctions = {

            /**
             * Make a request for a specific dataset item. When the response comes,
             * make that item the current item, empty the list, then request a page to append.
             * Note: the specified item is not added to the pages/items lists. It only exists in currentItem.
             * @param datasetItemId
             * @return Promise that returns the dataset item
             */
            selectById : function (datasetItemId) {
                return DatasetItem.datasetItem(self.datasetId, datasetItemId).then(x => {
                    // todo: need something to stop this being called twice before response comes
                    self.resetlist();
                    self.currentItem = x.data.data[0];
                    self.addAudioRecordingFields([self.currentItem]);
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
                console.log("moved to next page of dataset items: ", debug_message);

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
            },

            totalItems: function () {
                return self.totalItems;
            }

        };

        return self.publicFunctions;

    }]);
