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
                (scope) => scope.resource,
                () => {
                    // update the user profile

                    // update the friendly date
                    self.friendlyDate = moment(self.resource[self]).fromNow()
                });


            UserProfile.get.then(() => {
                self.userPprofile = UserProfile.profile;
            });

            this.$onInit = function () {
                let created = this.mode === "created",
                    modified = this.mode === "modified";

                if (!!(created ^ modified) === false) { // jshint ignore:line
                    throw new Error("The `mode` attribute must be set to `created` or `modified`");
                }

                userKey = this.mode + "Id";
                userKey = created ? ;
            };

        }])
    .component("userTile", {
        bindings: {
            resource: "<",
            mode: "@",
        },
        controller: "UserTileController",
        templateUrl: ["conf.paths", function (paths) {
            return paths.site.files.users.userTile;
        }]
    });