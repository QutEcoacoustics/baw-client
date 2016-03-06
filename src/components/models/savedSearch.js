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
                            maximumDate: null
                        };

                        this.basicFilter = basicFilterBase;
                    }
                }

                get friendlyUpdated() {
                    var lastUpdate = this.createdAt;

                    return moment(lastUpdate).fromNow();
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
                            q = q.eq("projects.id", filter.projectId);
                        }
                        
                        if (filter.siteIds.length > 0) {
                            q = q.in("siteId", filter.siteIds);
                        }
                        
                        if (filter.minimumDate) {
                            q = q.gt("recordedDate", filter.minimumDate);
                        }

                        if (filter.maximumDate) {
                            // NB: recordedEndDate does not currently exist.
                            q = q.lt("recordedEndDate", filter.maximumDate);
                        }

                        return q;
                    });

                    this._storedQuery = query.toJSON();
                }

                get storedQuery() {
                    return this._storedQuery;
                }

                set storedQuery(value) {
                    // TODO: querybuilder validate
                    this._storedQuery = value;
                }

            }

            return SavedSearch;
        }]);
