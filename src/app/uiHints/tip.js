angular
    .module("bawApp.uiHints.helpTip", [])
    .component("helpTip", {
        bindings: {
        },
        transclude: true,
        controller: function () {

            this.$onChanges = function (changes) {
            };
        },
        template: `
<small>
    <i class="fa fa-info-circle text-info"></i>
    <span ng-transclude>
    
    </span>
</small>
`
    });
