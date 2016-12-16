angular
    .module("bawApp.uiHints.ribbon", [])
    .component("ribbon", {
        bindings: {
            type: "@",
            tooltip: "<",
        },
        transclude: true,
        controller: function () {

            this.$onChanges = function (changes) {
                switch (this.type) {
                    case "new":
                        this.class = "success";
                        this.text = "New";
                        this.tooltip = "This is a new feature!";
                        break;
                    case "beta":
                        this.class = "info";
                        this.text = "Beta";
                        this.tooltip = "This feature is still being tested - it may not work correctly";
                        break;
                    case "building":
                        this.class = "building";
                        this.text = "\xa0";
                        this.tooltip = "This feature is still being built and is not yet available";
                        break;
                    default:
                        this.class = this.type;
                        this.text = " ";
                        this.tooltip = this.tooltip;
                        break;
                }
            };
        },
        template: `<div class="ribbon" ng-class="$ctrl.class" 
            uib-tooltip="{{ $ctrl.tooltip }}" tooltip-placement="top-right">
            <ng-transclude>{{ $ctrl.text }}</ng-transclude>
        </div>
`
    });

