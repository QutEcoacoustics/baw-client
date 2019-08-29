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
         *
         */
        self.resetlist = function () {
            self.currentItemIndex = -1;
            self.items = [];
        };
        self.resetlist();
        self.currentItem = null;


        /**
         * Increment the current item index and set the current item property
         * If there is no next item, request a page
         * If we are near the last item, request a page.
         */
        self.nextItem = function () {

            var nextItemIndex = self.nextItemIndex();
            if (nextItemIndex === false) {
                self.requestPageOfItems(true);
                return;
            }

            self.currentItemIndex = nextItemIndex;
            self.currentItem = self.items[self.currentItemIndex];

            var distanceFromEnd = self.items.length - self.currentItemIndex;
            // request a new page when we are on the 2nd last item. Gives enough time to load everything if we are
            // advancing very fast.
            if (distanceFromEnd <= 2) {
                self.requestPageOfItems(false);
            }

        };


        /**
         * The index of the next item.
         * @return Integer or false if no next item
         */
        self.nextItemIndex = function () {

            // this is the last item index so there is no next item index
            if (self.currentItemIndex >= self.items.length - 1 || self.items.length === 0) {
                return false;
            }
            return self.currentItemIndex + 1;

        };


        /**
         * Append the items in the new page to the list of items,
         * but remove duplicates. We expect some duplicates since we are requesting the first page of unseen data
         * every time but doing it in anticipation. So we would get [a,b,c,d] then when we are at c, we request a page
         * and get [c,d,e,f]. We need to remove the first 2 items before concatenating.
         * @param newItems array of DatasetItems
         * @returns Array of DatasetItems - the filtered array with existing items removed.
         *
         */
        self.mergeNewPage = function (newItems, index) {


            // check for overlap starting from two items ago
            var fromIndex = Math.max(index - 2, 0);

            var unseenExistingItemIds = self.items.slice(fromIndex).map(item => item.id);

            // for each of the last few items, search the array of new items for it and remove it if found.
            unseenExistingItemIds.forEach(id => {
                var newItemIndex = newItems.findIndex(x => x.id === id);
                if (newItemIndex >= 0) {
                    newItems.splice(newItemIndex,1);
                }
            });

            self.items = self.items.concat(newItems);

            return newItems;

        };


        /**
         * Adds a new page of items to the list of pages. Adds associated metadata to those items.
         * @param thenSelectNewItem boolean; if true will update the current item to be the first item
         * in the new page of items
         */
        self.requestPageOfItems = function (thenSelectNewItem = false) {

            if (!self.datasetId) {
                return;
            }

            // items are ordered by least viewed. Therefore, we always want page 1.
            var nextPageNum = 1;

            var currentIndex = self.currentItemIndex;

            DatasetItem.datasetItems(self.datasetId, nextPageNum).then(x => {

                // this should always be the same
                self.totalItems = x.data.meta.paging.total;

                if (x.data.data.length > 0) {

                    var newItems = self.mergeNewPage(x.data.data, currentIndex);

                    if (thenSelectNewItem) {
                        self.nextItem();
                    }

                    self.addAssociations(newItems);

                } else {
                    console.warn("Empty page of dataset items returned");
                }

            });

        };


        /**
         * Adds the associated models to the dataset item
         * - AudioRecording, Site, Project?, Media
         * @param items
         */
        self.addAssociations = function (items) {

            var associationData = {
                annotations: items,
                annotationIds: items.map((dsi) => dsi.id),
                recordingIds: items.map((dsi) => dsi.audioRecordingId)

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
            nextItem : self.nextItem,

            nextItemAvailable : function () {
                var nextIndex = self.nextItemIndex();
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
