angular
    .module("bawApp.services.resultPager", [])
    .factory(
        "ResultPager",
        [
            "lodash",
            "$q",
            "$http",
            "QueryBuilder",
            /**
             * Designed to page through result sets from the baw API.
             */
                function (_, $q, $http, QueryBuilder) {

                function skip() {
                    throw new Error("Not Implemented");
                }

                function take() {
                    throw new Error("Not Implemented");
                }


                function loadAll(currentResponse) {
                    //console.log("ME!", arguments);

                    // fail early with original result
                    if (!currentResponse || currentResponse.status !== 200) {
                        return currentResponse;
                    }

                    // if no paging, then ignore, not our business
                    if (!currentResponse.data ||
                        !currentResponse.data.meta ||
                        !currentResponse.data.meta.paging ||
                        currentResponse.data.meta.maxPage === 1) {
                        return currentResponse;
                    }

                    // otherwise there are pages to load!
                    let meta = currentResponse.data.meta,
                        pageCount = meta.paging.maxPage,
                        currentPageIndex = meta.paging.page,
                        itemsPerPage = meta.paging.items,
                        sorting = meta.sorting;

                    let pagedLoader = $q.when(currentResponse),
                        pages = new Array(pageCount);

                    pages[currentPageIndex - 1] = currentResponse;
                    for (let pageIndex of _.range(1, pageCount + 1)) {
                        // skip the current page
                        if (pageIndex === currentPageIndex) {
                            continue;
                        }

                        let newConfig = Object.assign({}, currentResponse.config);

                        // update url or filter params
                        // HACK: string compare for filter endpoint is dodgy
                        if (newConfig.method === "POST" && newConfig.data && newConfig.url.indexOf("/filter") > 0) {
                            // load query
                            var data = typeof newConfig.data  === "string" ? JSON.parse(newConfig.data) : newConfig.data;
                            let query = QueryBuilder.load(data);

                            query = query.page({page: pageIndex, items: itemsPerPage});

                            if (sorting) {
                                query = query.sort(sorting);
                            }

                            newConfig.data = query.toJSON();
                        }
                        else {
                            let pageParams = QueryBuilder.create(function (baseQuery) { // jshint ignore:line
                                let q = baseQuery.page({page: pageIndex, items: itemsPerPage});

                                if (sorting) {
                                    q = q.sort(sorting);
                                }

                                return q;
                            }).toQueryString();

                            // merge
                            newConfig.params = newConfig.params || {};
                            Object.assign(newConfig.params, pageParams);
                        }

                        // add to the sequence of promises
                        pagedLoader = pagedLoader.then(() => { // jshint ignore:line
                            // repeat original request but with a different page
                            //console.debug("http:", pageIndex, newConfig.url, newConfig.params, newConfig.data);
                            return $http(newConfig);
                        })
                            .then((response) => { // jshint ignore:line
                                // accumulate each response
                                //console.debug("response,", pageIndex);
                                // pages are 1-indexed
                                pages[pageIndex - 1] = response;
                            })
                        ;
                    }
                    pagedLoader = pagedLoader.then(function finish() {
                        var responses = pages;
                        //console.debug("final", responses);
                        return {
                            responses,
                            data: {data: _.flatten(responses.map(r => (r && r.data) && r.data.data || []))}
                        };
                    });

                    return pagedLoader;
                }

                return {
                    skip,
                    take,
                    loadAll
                };
            }
        ]);