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
            function (d3, roundDate) {
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

                    static updateResolutionScaleCeiling(availableResolutions, resolutionScale)
                    {
                        resolutionScale.domain(availableResolutions)
                            .range([
                                availableResolutions[0] || 0,
                                ...availableResolutions
                            ]);
                    }

                    static updateResolutionScaleMidpoint(availableResolutions, resolutionScale)
                    {
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
                     * @param dataFunctions
                     * @param tileCache
                     * @param resolutionScale
                     * @param resolution
                     * @param visibleExtent
                     * @param category
                     * @param items
                     * @returns {*}
                     */
                    filterTiles(tileSizeSeconds, resolution, items, visibleExtent, category) {
                        var filterPaddingMs = tileSizeSeconds * msInS;
                        // item filter
                        // pad the filtering extent with tileSize so that recordings that have
                        // duration < tileSize aren't filtered out prematurely
                        var fExtent = [(+visibleExtent[0]) - filterPaddingMs, (+visibleExtent[1]) + filterPaddingMs],
                            f = this.isItemVisible.bind(this, fExtent),
                            g = this.isInCategory.bind(this, category),
                            h = TilingFunctions.and.bind(this, g, f);

                        // tile filter
                        var l = this.isTileVisible.bind(this, visibleExtent);

                        let self = this;
                        return items
                            .filter(h)
                            .reduce(function (previous, current) {
                                let selectedResolution = self.resolutionScale(resolution),
                                    tiles = self.generateTiles(current, selectedResolution);

                                let filteredTiles = tiles.filter(l);
                                return previous.concat(filteredTiles);
                            }, [])
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
                     * @param source
                     * @param i
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
                            niceHigh = new Date(+roundDate.ceil(idealTileSizeSeconds, high) - idealTileSizeSeconds),
                            offset = niceLow;

                        // use d3's in built range functionality to generate steps
                        var tiles = [];
                        while (offset < niceHigh) {
                            // d3's offset floor's the input! FFS!
                            //var nextOffset = d3.time.second.offset(offset, idealTileSizeSeconds);
                            var nextOffset = new Date(+offset + (idealTileSizeSeconds * msInS));
                            var item = {
                                //audioNavigationUrl: getNavigateUrl(source, offset),
                                key: offset.toISOString() + this.dataFunctions.getId(source),
                                offset: offset,
                                offsetEnd: nextOffset,
                                resolution,
                                source,
                                tileImageUrl: "",
                                zoomStyleImage: this.zoomStyleTiles
                            };
                            item.tileImageUrl = this.getTileImage(item);
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
