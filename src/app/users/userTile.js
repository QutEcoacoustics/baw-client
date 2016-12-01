angular
    .module("bawApp.users.userTile", [])
    .controller("UserTileController", [
        "$scope", "moment", "conf.paths", "UserProfile",
        function ($scope, moment, paths, UserProfile) {
            var $ctrl = this;
            let userKey, dateKey;

            this.defaultUserImage = paths.site.assets.users.defaultImageAbsolute;
            this.userProfile = null;
            this.friendlyDate = null;
            this.show = false;

            $scope.$watch(
                (scope) => scope.$ctrl.resource,
                function () {
                    if (!$ctrl.resource) {
                        $ctrl.show = false;
                        return;
                    }

                    if(!$ctrl.resource[userKey] || $ctrl.resource[dateKey]) {
                        $ctrl.show = false;
                        return;
                    }

                    // update the user profile
                    UserProfile
                        .getUserForMetadataTile($ctrl.resource[userKey])
                        .then((result) => {
                            $ctrl.userProfile = result.data.data[0];
                            $ctrl.show = true;
                        });

                    // update the friendly date
                    $ctrl.friendlyDate = moment($ctrl.resource[dateKey]).fromNow();
                });

            this.$onInit = function () {
                let created = this.mode === "created",
                    modified = this.mode === "modified";

                if (!!(created ^ modified) === false) { // jshint ignore:line
                    throw new Error("The `mode` attribute must be set to `created` or `modified`");
                }

                userKey = created ?  "creatorId" : "updaterId";
                dateKey = created ?  "createdAt" : "updatedAt";
            };
        }])
    .component("userTile", {
        bindings: {
            resource: "<",
            mode: "@",
            skinny: "@"
        },
        controller: "UserTileController",
        templateUrl: ["conf.paths", function (paths) {
            return paths.site.files.users.userTile;
        }],
        transclude: true
    });
