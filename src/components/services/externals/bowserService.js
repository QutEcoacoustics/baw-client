angular
    .module("bawApp.services.core.bowser", [])
    .provider("bowser", function () {

                  // TODO: is there a better way to load bowser without requiring it be attached to window?
                  var bowser = window.bowser;

                  this.$get = [function bowserFactory() {
                      return bowser;
                  }];
              });