/**
 * This service is designed to work with a set of objects returned from
 * a chatty API. Its purpose is to link resources to their parent objects
 * which are stored in separate collections. It does this by using a
 * graph of associations to dynamically make a function that will traverse
 * that graph to look for matches and attach them to the host object.
 */
angular
    .module("bawApp.models.associations", [])
    .factory(
        "baw.models.ApiBase",
        [
            function () {
                class ApiBase {

                    constructor(resource) {
                        Object.assign(this, resource);
                    }

                    static make(resource) {
                        //noinspection JSValidateTypes
                        if (this === window) {
                            throw new Error("This static method must be called with a bound this");
                        }

                        return new this(resource);
                    }

                    /**
                     * This function generates a converter for models to use.constructor
                     * This provided models with a function to convert API responses
                     * into DS objects.
                     *
                     * TODO: remove the need to return the FULL APi object
                     * @returns {}
                     * @param response
                     */
                    static makeFromApi(response) {
                        //noinspection JSValidateTypes
                        if (this === window) {
                            throw new Error("This static method must be called with a bound this");
                        }

                        var items = [];
                        if (angular.isArray(response.data.data)) {
                            //noinspection JSUnresolvedVariable
                            items = response.data.data.map(this.make, this);
                        } else {
                            //noinspection JSUnresolvedFunction
                            items[0] = this.make(response.data.data);
                        }

                        response.data.data = items;

                        return response;
                    }
                }

                return ApiBase;
            }
        ])
    .factory(
        "baw.models.ModelUnavailable",
        [
            "baw.models.ApiBase",
            function (ApiBase) {
                class ModelUnavailable extends ApiBase {

                    constructor(error) {
                        super();

                        this.error = error;
                    }
                }

                return ModelUnavailable;
            }
        ])
    .filter("modelAvailable",
        [
            "baw.models.ModelUnavailable",
            function (ModelUnavailable) {
                return function(models) {
                    return models.filter(x => !(x instanceof ModelUnavailable));
                };
            }
        ])
    .factory(
        "baw.models.associations",
        [
            "casingTransformers",
            "baw.models.ApiBase",
            "baw.models.ModelUnavailable",
            function (casingTransformers, ApiBase, ModelUnavailable) {
                const parentRelationSuffix = "Id",
                    pluralitySuffix = "s",
                    parentManyRelationSuffix = "Id" + pluralitySuffix,
                    id = "id",
                    arityMany = Symbol("many"),
                //arityOne = Symbol("one"),
                    unavailable = "This parent resource is unavailable.";

                function many(name) {
                    return {
                        name,
                        arity: arityMany
                    };
                }

                var associations = new Map([
                    [
                        "Tag", {
                        parents: null, children: [many("Tagging")]
                    }],
                    [
                        "Tagging", {
                        parents: ["Tag", "AudioEvent"], children: null
                    }],
                    [
                        "AudioEvent", {
                        parents: ["AudioRecording"], children: [many("Tagging")]
                    }],
                    [
                        "AudioRecording", {
                        // we don't have a nice way to fit the media association in,
                        // we don't need it at the moment
                        parents: ["Site"], children: [many("AudioEvent"), many("Bookmark") /*, "Media" */]
                    }],
                    [
                        "Site", {
                        parents: [many("Project")], children: [many("AudioRecording")]
                    }],
                    [
                        "Project", {
                        parents: null, children: [many("Site")]
                    }],
                    [
                        "Media", {
                        parents: ["AudioRecording"], children: null
                    }],
                    [
                        "Bookmark", {
                        parents: ["AudioRecording", "User"], children: null
                    }],
                    [
                        "User", {
                        parents: null, children: [many("Bookmark")]
                    }]
                ]);


                function chainToString(chain) {
                    return chain.reduce((s, c) => s + "->" + c, "");
                }

                return {
                    generateLinker,
                    arrayToMap,
                    makeFromApi (Type) {
                        return function (resource) {
                            return ApiBase.makeFromApi.call(Type, resource);
                        };
                    }
                };

                /**
                 * This function determines if there is a way to link
                 * a child to a parent node. If there is, it returns a function
                 * that will do the linking.
                 */
                function generateLinker(child, parent) {

                    if (!associations.has(child)) {
                        throw new Error("Child must be one of the known associations");
                    }

                    if (!associations.has(parent)) {
                        throw new Error("Parent must be one of the known associations");
                    }

                    // traverse the nodes
                    var chains = [[child]];
                    searchGraph(child, parent, chains);

                    // select the shortest path
                    var {index} = chains.reduce(({length, index}, current, currentIndex) => {
                        if (current && current.length < length) {
                            length = current.length;
                            index = currentIndex;
                        }
                        return {length, index};
                    }, {length: +Infinity, index: -1});

                    var chain = chains[index],
                        correctCase = chain.map(key => key[0].toLowerCase() + key.slice(1));

                    console.debug("associations:generateLinker:", chainToString(chain));

                    // now make an optimised function to execute it
                    return function (target, associationCollections) {
                        var currentTargets = [target];
                        for (let c = 1; c < chain.length; c++) {
                            let association = chain[c],
                            // check if the current target could have many parents or children
                                manyTargets = isManyAssociation(associations.get(chain[c - 1]), association),
                                targetIdName = correctCase[c] + (manyTargets ? parentManyRelationSuffix : parentRelationSuffix),
                                targetName = correctCase[c] + (manyTargets ? pluralitySuffix : "");

                            // get the collection appropriate for the first association
                            let possibleParentObjects = associationCollections[association];

                            // when following many arity associations, there may be more than one
                            // target that needs to be worked on
                            let realAssociations = [];
                            for (let d = 0; d < currentTargets.length; d++) {
                                let currentTarget = currentTargets[d];

                                if (currentTarget instanceof ModelUnavailable) {
                                    // we can't follow the chain of a missing association
                                    continue;
                                }

                                console.assert(currentTarget, "currentTarget should not be null!");

                                // deal with the case of targets already having associations set
                                if (currentTarget[targetName] instanceof Object) {
                                    realAssociations = currentTarget[targetName];
                                    console.assert(manyTargets ? realAssociations instanceof Array : true, "Discovered associations should be an array");
                                }
                                else {
                                    // get the parent id from the child
                                    let associationIds = [];
                                    if (manyTargets) {
                                        associationIds = currentTarget[targetIdName];
                                    }
                                    else {
                                        associationIds[0] = currentTarget[targetIdName];
                                    }

                                    // ensure we were able to get Ids
                                    let idsValid = associationIds.every(x => x !== undefined);
                                    if (!idsValid) {
                                        throw new Error("Unable to link to associations because their ids are invalid or missing");
                                    }

                                    // get correct parent object
                                    // assume es6 map
                                    realAssociations = associationIds.map(Map.prototype.get, possibleParentObjects);

                                    // handle the cases of missing associations
                                    // this can sometimes happen when certain associations are
                                    // filtered out from a dataset for security reasons
                                    realAssociations = realAssociations.map(
                                        x => x === undefined ? new ModelUnavailable(unavailable) : x);

                                    // assign to child
                                    currentTarget[targetName] = manyTargets ? realAssociations : realAssociations[0];
                                }
                            }

                            // nest into parent(s)
                            currentTargets = realAssociations;
                        }

                        // return our amped up child
                        return target;
                    };

                    function isManyAssociation(previousAssociation, currentAssociation) {
                        let p = previousAssociation.parents || [],
                            c = previousAssociation.children || [];

                        let a = p.concat(c).find(x => x.name === currentAssociation);
                        if (!a) {
                            return false;
                        }

                        return a.arity === arityMany;
                    }
                }

                /**
                 * Recursive graph search.
                 *
                 * Can search up and down graphs.
                 * Does not allow revisiting a node.
                 *
                 * @param current
                 * @param rootParent
                 * @param chains
                 * @param {int} currentChain
                 */
                function searchGraph(current, rootParent, chains, currentChain = 0) {
                    if (!chains[currentChain]) {
                        chains[currentChain] = [];
                    }

                    if (current === rootParent) {
                        // end of chain, success
                        return true;
                    }

                    let {parents, children} = associations.get(current);

                    let nodesToVisit = (parents || []).concat(children || []);

                    for (var i = 0; i < nodesToVisit.length; i++) {
                        var n = nodesToVisit[i];
                        let thisNode = n instanceof Object ? n.name : n;

                        // prevent cyclic loops
                        // if the new node has already been visited,
                        // do not visit again
                        if (chains[currentChain] && chains[currentChain].includes(thisNode)) {
                            continue;
                        }

                        // each node represents a different path to follow.
                        // follow each and aggregate
                        let chainCopy = Array.from(chains[currentChain]);

                        // add in current node
                        chainCopy.push(thisNode);

                        let chainIndex = chains.push(chainCopy) - 1;

                        // recursive call
                        searchGraph(thisNode, rootParent, chains, chainIndex);
                    }

                    // based on the recursive nature of the above, the current chain
                    // should always be deprecated
                    // either it is valid/invalid (and the function has exited already)
                    // or recursion that followed a different path has rendered this path obsolete
                    chains[currentChain] = undefined;
                }

                /**
                 * Converts a collection of restful objects,
                 * where they follow the convention of always having a unique and identifying
                 * `id` field into an es6 Map.
                 */
                function arrayToMap(items) {
                    return new Map(
                        [for (item of items) [item[id], item]]
                    );
                }

            }
        ]
    );
