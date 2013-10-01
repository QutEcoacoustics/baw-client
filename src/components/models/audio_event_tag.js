(function (undefined) {
    var baw = window.baw = window.baw || {};

    baw.AudioEventTag = function AudioEventTag(obj) {

//        var localId = typeof(localIdOrResource) === "number" ? localIdOrResource : undefined;
//        var obj;
//        if (localIdOrResource instanceof Object && localIdOrResource.constructor.name == "Resource") {
//            obj = localIdOrResource;
//        }

        if (!(this instanceof AudioEventTag)) {
            throw new Error("Constructor called as a function");
        }
        
        angular.extend(this, obj);

        this.createdAt = this.createdAt && new Date(this.createdAt) || Date.now() ;
        this.updatedAt = this.updatedAt && new Date(this.updatedAt) || Date.now();

        if (!angular.isNumber(this.tagId)) {
            throw "An AudioEventTag requires a number for property tagId";
        }

    };
})();