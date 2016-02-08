/* jshint -W100 */
/**
 * Created by Anthony on 23/11/2015.
 */


angular
    .module("bawApp.d3.eventDistribution.distributionTilingFunctions", [])
    .factory(
        "distributionTilingFunctions",
        [
            "d3",
            "roundDate",
            "rbush",
            function (d3, roundDate, rbush) {
                const msInS = 1e3;

                class TilingFunctions {
                    constructor(dataFunctions, yScale, xScale, tileCache, resolutionScale, tileWidthPixels, zoomStyleTiles) {
                        for (var argument of arguments) {
                            if (argument === undefined || argument === null) {
                                throw new Error("A supplied argument was null or undefined");
                            }
                        }

                        this.dataFunctions = dataFunctions;
                        this.yScale = yScale;
                        this.xScale = xScale;
                        this.tileCache = tileCache;
                        this.resolutionScale = resolutionScale;
                        this.tileWidthPixels = tileWidthPixels;
                        this.zoomStyleTiles = zoomStyleTiles === true;

                        // set up methods that need special binding
                        // TODO: this could be fixed by not using an ES6 class
                        // or with ES6 fields
                        this.getTileGTranslation = this.getTileGTranslation.bind(this);
                        this.getTileLeft = this.getTileLeft.bind(this);

                    }


                    static and(a, b, d) {
                        return a(d) && b(d);
                    }

                    static updateResolutionScaleCeiling(availableResolutions, resolutionScale) {
                        resolutionScale.domain(availableResolutions)
                            .range([
                                availableResolutions[0] || 0,
                                ...availableResolutions
                            ]);
                    }

                    static updateResolutionScaleMidpoint(availableResolutions, resolutionScale) {
                        let midpoints = availableResolutions
                            .map((x, i, array) => (((x - array[i - 1]) / 2) + array[i - 1]) || array[0]);

                        resolutionScale.domain(midpoints)
                            .range([
                                availableResolutions[0] || 0,
                                ...availableResolutions
                            ]);
                    }

                    static tileKey(tile) {
                        return tile.key;
                    }


                    /**
                     * Filter items and return tiles for that item
                     * @param tileSizeSeconds
                     * @param resolution
                     * @param visibleExtent
                     * @param category
                     * @param items
                     * @returns {Tile[]}
                     */
                    filterTiles(tileSizeSeconds, resolution, items, visibleExtent, category) {
                        var filterPaddingMs = tileSizeSeconds * msInS;

                        // item filter
                        // pad the filtering extent with tileSize so that recordings that have
                        // duration < tileSize aren't filtered out prematurely
                        var fExtent = [(+visibleExtent[0]) - filterPaddingMs, (+visibleExtent[1]) + filterPaddingMs];
                        let tilingFunctions = this;

                        var f = this.isItemVisible.bind(this, fExtent),
                            g = this.isInCategory.bind(this, category),
                            h = TilingFunctions.and.bind(this, g, f);

                        // tile filter
                        //var l = this.isTileVisible.bind(this, visibleExtent);

                        return items
                            .filter(h)
                            .reduce(function (previous, current) {
                                let selectedResolution = tilingFunctions.resolutionScale(resolution);

                                //let tiles = self.generateTiles(current, selectedResolution);
                                //let filteredTiles = tiles.filter(l);

                                let filteredTiles = tilingFunctions.generateTilesRTree(current, selectedResolution, visibleExtent);

                                return previous.concat(filteredTiles);
                            }, [])
                            .sort(this.sortTiles);

                    }

                    /**
                     * Filter items and return tiles for that item
                     * @param tileSizeSeconds
                     * @param resolution
                     * @param visibleExtent
                     * @param category
                     * @param {rbush} itemsTree
                     * @returns {Tile[]}
                     */
                    filterTilesRTree(tileSizeSeconds, resolution, itemsTree, visibleExtent, category) {
                        var filterPaddingMs = tileSizeSeconds * msInS;

                        // item filter
                        // pad the filtering extent with tileSize so that recordings that have
                        // duration < tileSize aren't filtered out prematurely
                        var searchExtent0 = (+visibleExtent[0]) - filterPaddingMs,
                            searchExtent1 = (+visibleExtent[1]) + filterPaddingMs;

                        var tilingFunctions = this;


                        var tileFilter = function (previous, current) {
                            var selectedResolution = tilingFunctions.resolutionScale(resolution);

                            var filteredTiles = tilingFunctions.generateTilesRTree(current, selectedResolution, visibleExtent);

                            return previous.concat(filteredTiles);
                        };

                        return itemsTree
                            .search([searchExtent0, category, searchExtent1, category])
                            .reduce(tileFilter, [])
                            .sort(this.sortTiles);
                    }

                    /**
                     * Generate the tiles - but do not eagerly cache!
                     * Also do not store tiles on item.
                     * Too many tiles.
                     * @param tileCache {WeakMap<item, Map<resolution, tiles>>} - the tile cache is a WeakMap of Maps
                     */
                    generateTiles(item, resolution) {
                        // get resolution map
                        let resolutionCache = this.tileCache.get(item);

                        if (resolutionCache) {
                            // get tiles
                            let cachedTiles = resolutionCache.get(resolution);

                            if (cachedTiles) {
                                return cachedTiles;
                            }
                        }
                        else {
                            // create a new holder
                            resolutionCache = new Map();
                            this.tileCache.set(item, resolutionCache);
                        }

                        let tiles = this.splitIntoTiles(item, resolution);
                        resolutionCache.set(resolution, tiles);

                        return tiles;
                    }

                    /**
                     * Generate the tiles - but do not eagerly cache!
                     * Also do not store tiles on item.
                     * Too many tiles.
                     * This implementation uses an R*-Tree
                     * https://github.com/mourner/rbush
                     *
                     * @param tileCache {WeakMap<item, RTree<resolution×tiles>>} - the tile cache is a WeakMap of Maps
                     */
                    generateTilesRTree(item, resolution, visibleExtent) {
                        //console.timeStamp("Begin resolution " + resolution);

                        // get rtree of resolution×tiles
                        let resolutionTree = this.tileCache.get(item);

                        // do new tiles need to be generated?
                        let needsGeneration = false;

                        if (resolutionTree) {
                            // check: have tiles been generated for *current* resolution
                            needsGeneration = !item.tileCacheTracker.has(resolution);
                        }
                        else {
                            // create a new holder
                            // the max node value was chosen based off informal experimentation
                            // it is a compromise between search speed and load speed
                            resolutionTree = rbush(200, [".offset", ".resolution", ".offsetEnd", ".resolution"]);
                            this.tileCache.set(item, resolutionTree);

                            item.tileCacheTracker = new Set();
                            needsGeneration = true;
                        }

                        if (needsGeneration) {

                            let tiles = this.splitIntoTiles(item, resolution);

                            //console.time("rbush:load");
                            resolutionTree.load(tiles);
                            //console.timeEnd("rbush:load");

                            // register that we have cached tiles at this resolution
                            item.tileCacheTracker.add(resolution);
                        }

                        //console.time("rbush:search");
                        let tiles = resolutionTree.search([visibleExtent[0], resolution, visibleExtent[1], resolution]);
                        //console.timeEnd("rbush:search");
                        return tiles;
                    }

                    /**
                     * Get the best number of tiles for a given width.
                     * @param width
                     * @param tileWidthPixels
                     */
                    getTileCountForWidth(width, tileWidthPixels) {
                        return width / tileWidthPixels;
                    }

                    /**
                     * Get the best number of tiles for a given width.
                     * @param width
                     * @param tileWidthPixels
                     */
                    getTileCountForWidthRounded(width, tileWidthPixels) {
                        // round high so that we always have enough tiles
                        // to fill a surface
                        return Math.ceil(width / tileWidthPixels);
                    }

                    getTileImage(tile) {
                        var url = this.dataFunctions.getTileUrl(tile.offset,
                            this.tileWidthPixels,
                            tile);

                        return url || "";
                    }

                    getTileLeft(tile, i) {
                        return this.xScale(tile.offset);
                    }


                    getOffsetDate(d) {
                        return d.offset.toLocaleDateString();
                    }

                    getOffsetTime(d) {
                        return d.offset.toLocaleTimeString();
                    }


                    getTileGTranslation(tile, i) {
                        return [this.getTileLeft(tile, i), 0];
                    }

                    isInCategory(category, d) {
                        return this.dataFunctions.getCategory(d) === category;
                    }

                    isItemVisible(filterExtent, item) {
                        return this.dataFunctions.getLow(item) < filterExtent[1] &&
                            this.dataFunctions.getHigh(item) >= filterExtent[0];
                    }

                    /**
                     * Select tiles that are the correct size and
                     * have the bounds within the provided visible extent.
                     * @param visibleExtent {number[]}
                     * @param tileSizeSeconds {number}
                     * @param d - a tile item
                     * @returns {boolean}
                     */
                    isTileVisible(visibleExtent, d) {
                        return d &&
                            d.offset < visibleExtent[1] &&
                            d.offsetEnd >= visibleExtent[0];
                    }

                    /**
                     * Order tiles based on their date. This allows elements to be painted in the
                     * DOM in the right order
                     * @param tileA
                     * @param tileB
                     */
                    sortTiles(tileA, tileB) {
                        return tileA.offset - tileB.offset;
                    }

                    /**
                     * Generate the tiles to show on the fly.
                     * These tiles should NOT contain references to other objects.
                     * WARNING: this function has been optimized for speed in V8's JS engine
                     * WARNING: modify with extreme care
                     * @param source
                     * @param resolution
                     * @returns {Array}
                     */
                    splitIntoTiles(source, resolution) {
                        let idealTileSizeSeconds = resolution * this.tileWidthPixels;

                        // coerce just in case (d3 does this internally)
                        let low = new Date(this.dataFunctions.getLow(source)),
                            high = new Date(this.dataFunctions.getHigh(source));

                        // round down to the lower unit of time, determined by `tileSizeSeconds`
                        var niceLow = roundDate.floor(idealTileSizeSeconds, low),
                        // subtract a 'tile' otherwise we generate one too many
                            niceHigh = +(new Date(+roundDate.ceil(idealTileSizeSeconds, high) - idealTileSizeSeconds)),
                            offset = +niceLow;

                        // use d3's in built range functionality to generate steps
                        var tiles = [], tilingFunctions = this;
                        while (offset < niceHigh) {
                            // d3's offset floor's the input! FFS!
                            //var nextOffset = d3.time.second.offset(offset, idealTileSizeSeconds);
                            var nextOffset = offset + (idealTileSizeSeconds * msInS);
                            var item = {
                                //audioNavigationUrl: getNavigateUrl(source, offset),
                                key: offset + "_" + this.dataFunctions.getId(source),
                                offset: new Date(offset),
                                offsetEnd: new Date(nextOffset),
                                resolution,
                                source,
                                zoomStyleImage: this.zoomStyleTiles,
                                // delay generation of url
                                // url extremely expensive
                                // beside, only need to generate width/tileSize urls at a time
                                /* jshint loopfunc:true */
                                get tileImageUrl() {
                                    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get#Smart_self-overwriting_lazy_getters
                                    delete this.tileImageUrl;
                                    //noinspection JSUnresolvedVariable
                                    this.tileImageUrl = tilingFunctions.getTileImage(this);

                                    return this.tileImageUrl;
                                }
                            };
                            tiles.push(item);
                            offset = nextOffset;
                        }

                        return tiles;
                    }
                }

                return TilingFunctions;
            }
        ]
    );
