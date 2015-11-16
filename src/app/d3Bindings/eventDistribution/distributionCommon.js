/**
 * Created by Anthony.
 *
 * Provides methods common to the distribution controls.
 */
angular
    .module("bawApp.d3.eventDistribution.distributionCommon", [])
    .factory(
        "distributionCommon",
        [
            "d3",
            function (d3) {

                /**
                 * Order tiles based on their date. This allows elements to be painted in the
                 * DOM in the right order
                 * @param tileA
                 * @param tileB
                 */
                function sortTiles(tileA, tileB) {
                    return tileA.offset - tileB.offset;
                }

                return {
                    and(a, b, d) {
                        return a(d) && b(d);
                    },

                    isInCategory(getCategory, category, d) {
                        return getCategory(d) === category;
                    },

                    isItemVisible(getLow, getHigh, filterExtent, d) {
                        return getLow(d) < filterExtent[1] &&
                            getHigh(d) >= filterExtent[0];
                    },

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
                    },
                    sortTiles

                };
            }
        ]
    );
