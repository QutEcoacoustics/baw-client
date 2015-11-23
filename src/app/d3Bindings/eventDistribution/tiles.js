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
                    constructor(dataFunctions, yScale, xScale, tileCache, resolutionScale, tileWidthPixels) {
                        this.dataFunctions = dataFunctions;
                        this.yScale = yScale;
                        this.xScale = xScale;
                        this.tileCache = tileCache;
                        this.resolutionScale = resolutionScale;
                        this.tileWidthPixels = tileWidthPixels;

                    }


                    static and(a, b, d) {
                        return a(d) && b(d);
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
                            f = this.isItemVisible.bind(null, this.dataFunctions.getLow, this.dataFunctions.getHigh, fExtent),
                            g = this.isInCategory.bind(null, this.dataFunctions.getCategory, category),
                            h = TilingFunctions.and.bind(null, g, f);

                        // tile filter
                        var l = this.isTileVisible.bind(null, visibleExtent);

                        return items
                            .filter(h)
                            .reduce(function (previous, current) {
                                let selectedResolution = this.resolutionScale(resolution),
                                    tiles = this.generateTiles(this.tileCache, current, selectedResolution);

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



                    getTileImage(category, tileSizeSeconds, tile) {
                        var url = this.dataFunctions.getTileUrl(tile.offset,
                            category,
                            tileSizeSeconds,
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

                    isInCategory(getCategory, category, d) {
                        return getCategory(d) === category;
                    }

                    isItemVisible(dataFunctions, filterExtent, item) {
                        return dataFunctions.getLow(item) < filterExtent[1] &&
                            dataFunctions.getHigh(item) >= filterExtent[0];
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
                                zoomStyleImage: true
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
