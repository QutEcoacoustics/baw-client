var csSamples = angular.module("bawApp.citizenScience.csSamples", ["bawApp.citizenScience.common"]);


/**
 * Manages the queue of dataset items that will be shown to citizen science users
 */
csSamples.factory("CsSamples", [
    "CitizenScienceCommon",
    "$http",
    "DatasetItem",
    function CsSamples(CitizenScienceCommon, $http, DatasetItem) {

        var self = this;
        self.useLocalData = true;
        self.sheets_api_url = "http://" + window.location.hostname + ":8081";
        self.local_api_url = "/public/citizen_science";

        // the dataset id for this citizen science project
        // todo: integrate with settings for cs project
        self.datasetId = 3;

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
         */
        self.setCurrentItem = function () {
            if (self.currentIndex.page < self.pages.length &&
                self.currentIndex.page > -1 &&
                self.currentIndex.item > -1 &&
                self.currentIndex.item < self.currentPageLength()) {
                self.currentItem = self.pages[self.currentIndex.page].data[self.currentIndex.item];
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
         * Constructs a url for the request by concatenating the arguments, joined by "/"
         * and appending to the relevant baseURL. Allows experimenting with different sources
         * for the data without changing everything
         * @returns {string|*}
         */
        self.apiUrl = function () {
            // convert to array
            var base_url, url;
            if (self.useLocalData) {
                base_url = self.local_api_url;
            } else {
                base_url = self.sheets_api_url;
            }
            var args = Array.prototype.slice.call(arguments);

            url = [base_url].concat(args).join("/");

            if (self.useLocalData) {
                url = url + ".json";
            }

            return url;
        };




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
                }
                self.setCurrentItem();
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

            init : function () {
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

            },

            nextItemAvailable : function () {
                var nextIndex = self.nextItemIndexes();
                return Boolean(nextIndex);
            },

            /**
             * Gets all labels associated with the specified citizen science project
             * @param project string
             */
            getLabels: function (project) {
                var response = $http.get(self.apiUrl(
                    "labels",
                    project
                ));

                return response.then(function (response) {
                    var labels = [];
                    if (Array.isArray(response.data)) {
                        labels = response.data;
                    }

                    return labels;
                });
            },

            /**
             * Gets all settings associated with the specified citizen science project
             * @param project string
             * @returns {HttpPromise}
             */
            getSettings: function (project) {
                return $http.get(self.apiUrl(
                    "settings",
                    project
                ));
            },

            currentItem: function () {
                return self.currentItem;
            }

        };

        return self.publicFunctions;

    }]);


