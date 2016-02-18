angular
    .module("bawApp.users.userTile", [])
    .controller("UserTileController", [
        "$scope", "moment", "conf.paths", "UserProfile",
        function ($scope, moment, paths, UserProfile) {
            var self = this;
            let userKey, dateKey;

            this.defaultUserImage = paths.site.assets.users.defaultImageAbsolute;
            this.userProfile = null;
            this.friendlyDate = null;

            $scope.$watch(
                (scope) => scope.$ctrl.resource,
                function () {
                    if (!self.resource) {
                        return;
                    }

                    // update the user profile
                    UserProfile
                        .getUserForMetadataTile(self.resource[userKey])
                        .then((result) => {
                            self.userProfile = result.data.data[0];
                        });

                    // update the friendly date
                    self.friendlyDate = moment(self.resource[dateKey]).fromNow();
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
            mode: "@"
        },
        controller: "UserTileController",
        templateUrl: ["conf.paths", function (paths) {
            return paths.site.files.users.userTile;
        }],
        transclude: true
    });