//function TagModel() {
//    var self = this;
////    var to = function (value) {
////        return ko.asyncComputedObservable(function() {
////            return value() + "px";
////        });
////    };
//
//    self.left = ko.observable(0);
//    self.top = ko.observable(0);
//    self.width = ko.observable(0);
//    self.height = ko.observable(0);
//};
//
//function TaggerModel(valueAcessor) {
////    // ensure we are working with a single target
////    if (target.length !== 1) {
////        throw new Error("only made to work with one element");
////    }
//
//    var self = this;
//
//    self.tags = ko.observableArray();
//    var aChildTag = ko.observable();
//
//    self.clear = function() {
//        self.tags.removeAll();
//    };
//
//    //self.dirtyFlag = ko.dirtyFlag(self);
//    self.somethingChanged = ko.computed(function () {
//        self.tags();
//        aChildTag();
//    }).extend({ throttle: 1500 });
//
////    var getV = function () {
////        return self;
////        //return ko.utils.unwrapObservable(valueAcessor());
////    };
//    var update = function(bounds) {
//        var t = self;
//        var old = ko.utils.arrayFirst(t.tags(), function(item) {
//            return item.id === bounds.id;
//        });
//
//        if (old) {
//            // update it
//            old.top = bounds.top;
//            old.left = bounds.left;
//            old.width = bounds.width;
//            old.height = bounds.height;
//        }
//
//        aChildTag.valueHasMutated();
//
//    };
//
//    self.newBox = function(tag, bounds) {
//        console.info("eventMap.newBox");
//        var t = self;
//        t.tags.push(bounds);
//    };
//
//    self.boxChanged = function(tag, bounds) {
//        console.info("eventMap." + arguments.callee.caller.name);
//        update(bounds);
//    };
//
//    self.brs = function boxResizing(t, b) {self.boxChanged(t, b);};
//    self.brsd = function boxResized(t, b) {self.boxChanged(t, b);};
//    self.bmv = function boxMoving(t, b) {self.boxChanged(t, b);};
//    self.bmvd = function boxMoved(t, b) { self.boxChanged(t, b); };
//
//    self.removeBox = function (tag, bounds) {
//        console.info("eventMap.boxDeleted");
//        var t = self;
//        var removed = t.tags.remove(function (item) {
//            return item.id === bounds.id;
//        });
//
//        if (!removed) {
//            console.error("nothing removed!");
//        }
//    };
//
//
//}
//
//function unwrapDrawABoxInput(valueAcessor) {
//    var val = valueAcessor();
//
//    if ((ko.isObservable(val))) {
//        val = {
//            data: val,
//            tagLimit: undefined,
//            showOnlt: undefined
//        };
//    }
//    else {
//        if (val === undefined ||
//            val.data == undefined ||
//            !ko.isObservable(val.data)) {
//            throw new Error("The drawabox binding is meant to work with a base observeable");
//        }
//    }
//    tagLimit = val.maxBoxes;
//
//    return val;
//}
//
//ko.bindingHandlers.drawabox = {
//    //  element — The DOM element involved in this binding
//    //  valueAccessor — A JavaScript function that you can call to get the current model
//    //      property that is involved in this binding. Call this without passing any parameters
//    //      (i.e., call valueAccessor()) to get the current model property value.
//    //  allBindingsAccessor — A JavaScript function that you can call to get all the model
//    //      properties bound to this DOM element. Like valueAccessor, call it without any parameters to get the
//    //      current bound model properties.
//    //  viewModel — The view model object that was passed to ko.applyBindings. Inside a nested binding
//    //      context, this parameter will be set to the current data item (e.g., inside a with: person binding,
//    //      viewModel will be set to person).
//    init: function (element, valueAcessor, allBindingsAcessor, viewModel) {
//        // This will be called when the binding is first applied to an element
//        // Set up any initial state, event handlers, etc. here
//
//        var $ele = $(element);
//        if (!$ele.is("div")) {
//            throw new Error("The drawabox binding must be applied to a div");
//        }
//
//        var val = unwrapDrawABoxInput(valueAcessor);
//
//        // the viewModel for the tagger
//        var tm = new TaggerModel(valueAcessor);
//
//        // now setup element to work with draw a box
//        var options = {
//            maxBoxes: val.tagLimit,
//            newBox: tm.newBox,
//            boxResizing: tm.brs,
//            boxResized: tm.brsd,
//            boxMoving: tm.bmv,
//            boxMoved: tm.bmvd,
//            boxDeleted: tm.removeBox,
//            boxSelected: function (tag, bounds) {
//                console.info("eventMap.boxSelected");
//            },
//            showOnly: val.showOnly
//        };
//        $ele.drawabox(options);
//
//        val(tm);
//        return { 'controlsDescendantBindings': true };
//    },
//    update: function (element, valueAcessor, allBindingsAcessor, viewModel) {
//        // This will be called once when the binding is first applied to an element,
//        // and again whenever the associated observable changes value.
//        // Update the DOM element based on the supplied values here.
//
//        var $ele = $(element);
//        var value = unwrapDrawABoxInput(valueAcessor);
//    }
//};
//
//ko.bindingHandlers.showabox = {
//    init: function (element, valueAcessor, allBindingsAcessor, viewModel) {
//        // This will be called when the binding is first applied to an element
//        // Set up any initial state, event handlers, etc. here
//
//        // wrap value accessor
//        var newAcessor = function() {
//            var v = unwrapDrawABoxInput(valueAcessor);
//            v.showOnly = true;
//            return v;
//        };
//        return ko.bindingHandlers.drawabox.init(element, newAcessor, allBindingsAcessor, viewModel);
//    },
//    update: ko.bindingHandlers.drawabox.update
//};
//
//
//
