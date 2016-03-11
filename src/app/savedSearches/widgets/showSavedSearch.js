class ShowSavedSearchController {
    constructor(SavedSearchService) {
        //let controller = this;
        
    }
}

angular
    .module("bawApp.savedSearches.widgets.show", [])
    .controller("ShowSavedSearchController",
        [
            "SavedSearch",
            ShowSavedSearchController
        ])
    .component("showSavedSearch", {
        bindings: {
           savedSearch: "=savedSearch"
        },
        controller: "ShowSavedSearchController",
        templateUrl: ["conf.paths", function (paths) {
            return paths.site.files.savedSearches.show;
        }]
    });

