angular
    .module("bawApp.services.core.lodash", [])
    .provider("_", function () {

                  // TODO: is there a better way to load lodash without requiring it be attached to window?
                  var _ = window._;

                  this.$get = [function lodashFactory() {
                      return _;
                  }];
              });