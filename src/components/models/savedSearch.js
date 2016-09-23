angular
    .module("bawApp.models.savedSearch", [])
    .factory("baw.models.SavedSearch", [
        "baw.models.associations",
        "baw.models.ApiBase",
        "conf.paths",
        "$url",
        "humanize-duration",
        "moment",
        "QueryBuilder",
        function (associations, ApiBase, paths, $url, humanizeDuration, moment, QueryBuilder) {

            /**
             * Represents a saved filter and its settings.
             * The storedQuery is a QueryBuilder filter as an object.
             * The storedQuery is executed against AudioRecordings
             */
            class SavedSearch extends ApiBase {
                constructor(resource) {
                    //let model = this;

                    super(resource);

                    this._storedQuery = {};

                    this.id = this.id || null;
                    this.name = this.name || null;
                    this.description = this.description || null;
                    this.storedQuery = this.storedQuery || {};
                    this.projectIds = this.projectIds || null;
                    this.analysisJobIds = this.analysisJobIds || null;

                    // client only fields


                    if (resource) {
                        this.basicFilter = undefined;
                    }
                    else {
                        // only when new'ed on client side

                        // ensure properties added here are taken care of
                        // in `updateQueryFromBasicFilter` as well.
                        let basicFilterBase = {
                            projectId: null,
                            siteIds: [],
                            minimumDate: null,
                            maximumDate: null,
                            siteCount: null
                        };

                        this.basicFilter = basicFilterBase;
                    }
                }

                get friendlyUpdated() {
                    var lastUpdate = this.createdAt;

                    return moment(lastUpdate).fromNow();
                }



                generateSuggestedName(projects, sites) {
                    if (!this.basicFilter) {
                        return undefined;
                    }

                    let project = projects.find(p => p.id === this.basicFilter.projectId);

                    let projectName = !!project ? project.name : "(no project)";

                    let chosenSites = sites.filter(s => this.basicFilter.siteIds.indexOf(s.id) >=0).map(s => s.name);

                    let siteName = "(no sites)";
                    if (sites && this.basicFilter.siteIds.length > 0) {
                        if (this.basicFilter.siteIds.length === sites.length) {
                            siteName = "All sites";
                        }
                        else if(this.basicFilter.siteIds.length === 1) {
                            siteName = chosenSites + " site only";
                        }
                        else {
                            siteName = "Sites " + chosenSites.join(", ");
                        }
                    }

                    let dates = "",
                        min = moment(this.basicFilter.minimumDate).format("YYYY-MMM-DD"),
                        max = moment(this.basicFilter.maximumDate).format("YYYY-MMM-DD");
                    if (this.basicFilter.minimumDate && this.basicFilter.maximumDate) {
                        dates = ` between ${min} and ${max}`;
                    }
                    else if (this.basicFilter.minimumDate) {
                        dates = ` ending after ${min}`;
                    }
                    else if (this.basicFilter.maximumDate) {
                        dates = ` starting before ${max}`;
                    }

                    return `${siteName} in ${projectName}${dates}`;
                }

                /**
                 * Convert basic filter object graph into a
                 * QueryBuilder query. Presently needs to be called
                 * manually since es6 proxies don't exist :-(
                 */
                updateQueryFromBasicFilter() {
                    let filter = this.basicFilter;

                    // query executed against audio recordings
                    var query = QueryBuilder.create(function(baseQuery) {
                        let q = baseQuery;

                        if (filter.projectId) {
                            q = q.equal("projects.id", filter.projectId);
                        }

                        if (filter.siteIds.length > 0) {
                            if (filter.siteIds.length === filter.siteCount) {
                                // optimization, if all sites selected, just don't filter on sites
                            }
                            else {
                                q = q.in("siteId", filter.siteIds);
                            }
                        }

                        if (filter.minimumDate) {
                            q = q.greaterThanOrEqual("recordedDate", filter.minimumDate);
                        }

                        if (filter.maximumDate) {
                            // NB: recordedEndDate does not currently exist.
                            q = q.lessThanOrEqual("recordedEndDate", filter.maximumDate);
                        }

                        return q;
                    });

                    this._storedQuery = query.toJSON().filter;
                }

                get storedQuery() {
                    return this._storedQuery;
                }

                set storedQuery(value) {
                    // TODO: querybuilder validate
                    this._storedQuery = value;
                }

                toJSON() {
                    return {
                        name: this.name,
                        description: this.description,
                        storedQuery: this.storedQuery
                    };
                }

            }

            return SavedSearch;
        }]);
