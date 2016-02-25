class ListSavedSearchesController {
    constructor(SavedSearchService) {
        let controller = this;
        this.savedSearches = null;

        //this.selectedSavedSearch = null;

        // download saved searches
        SavedSearchService
            .query()
            .then(function (response) {
                controller.savedSearches = response.data.data;
            });
    }

    get savedSearchesExist() {
        return this.savedSearches !== null && this.savedSearches.length !== 0;
    }
}

angular
    .module("bawApp.savedSearches.widgets.list", [])
    .controller("ListSavedSearchesController",
        [
            "SavedSearch",
            ListSavedSearchesController
        ])
    .component("listSavedSearches", {
        bindings: {
            selectedSavedSearch: "=selected"
        },
        controller: "ListSavedSearchesController",
        templateUrl: ["conf.paths", function (paths) {
            return paths.site.files.savedSearches.list;
        }]
    });

