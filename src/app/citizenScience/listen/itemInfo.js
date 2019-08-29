angular.module("bawApp.citizenScience.itemInfo", ["bawApp.components.onboarding"])
    .component("itemInfo", {
        templateUrl: "citizenScience/listen/itemInfo.tpl.html",
        controller: [
            "$scope", "moment", "conf.constants", "onboardingService",
            function ($scope, moment, constants, onboardingService) {

                var self = this;

                $scope.ready = false;
                $scope.dateString = null;
                $scope.projectList = [];
                $scope.site = null;
                $scope.datasetItemId = null;

                $scope.$watch(() => self.sample.item, (newVal) => {

                    if (self.sample.item && self.sample.item.hasOwnProperty("start")) {
                        $scope.ready = true;
                        $scope.dateString = moment(self.sample.item.start).format(constants.localization.dateTimeFormat);
                        $scope.projectList = self.sample.item.audioRecording.site.projects.filter(p => p.hasOwnProperty("name")).map(p => p.name);
                        $scope.site = self.sample.item.audioRecording.site.name;
                    }

                });

                onboardingService.addSteps({
                    element: "item-info",
                    intro: "The date, time and location information",
                    order: 2.5
                });

            }],
        bindings: {
            sample:"<"
        }
    });