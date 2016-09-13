angular
    .module("bawApp.directives.angular-ui.bootstrap.datepicker.dateRangeValidator", [])
    .service("bawDateRangeCache", [
        "$timeout",
        function ($timeout) {
            let minDateControls = new Set(),
                maxDateControls = new Set();

            let revalidating = false;


            /**
             * For the model to update by simulating a user entering a value.
             * The problem with the standard $validate function is that it assigns
             * `undefined` to the model value if validation fails. We DON'T want that
             * ... we just want to update the validation state
             * @param ngModel
             */
            function forceUpdate(ngModel) {
                ngModel.$$lastCommittedViewValue = null;
                ngModel.$commitViewValue(ngModel.$viewValue);
            }

            function revalidateAll() {
                if (!revalidating) {
                    revalidating = true;
                    $timeout(() => {
                        minDateControls.forEach(forceUpdate);
                        maxDateControls.forEach(forceUpdate);
                        revalidating = false;
                    });
                }
            }

            return {
                addMinDateControl(control) {
                    minDateControls.add(control);
                },
                addMaxDateControl(control) {
                    maxDateControls.add(control);
                },
                revalidateMinDateControls(m, v) {
                    revalidateAll();
                },
                revalidateMaxDateControls(m, v) {
                    revalidateAll();
                }
            };
        }
    ])
    .directive("bawMinDate", [
            "$parse",
            "bawDateRangeCache",
            function ($parse, bawDateRangeCache) {
                return {
                    scope: false,
                    restrict: "A",
                    require: ["ngModel", "^^form"],
                    link: function (scope, element, attributes, [ngModel, FormController]) {

                        let expression = $parse(attributes.bawMinDate);

                        bawDateRangeCache.addMinDateControl(ngModel);

                        ngModel.$validators.minDate = function (modelValue, viewValue) {
                            // if its not a date we don't care
                            // leave other validators to parse date validity or requiredness
                            let value = modelValue,
                                result = false;

                            if (!angular.isDate(value) || isNaN(value)) {
                                result = true;
                            }
                            else {
                                let minDate = expression(scope);

                                // we don't want the validator to check when the limit is missing
                                if (!minDate) {
                                    result = true;
                                }
                                else if (value >= minDate) {
                                    result = true;
                                }
                            }

                            // trigger a validation for the other half of the range controls
                            bawDateRangeCache.revalidateMaxDateControls(modelValue, viewValue);

                            return result;
                        };
                    }
                };
            }
        ]
    )
    .directive("bawMaxDate", [
            "$parse",
            "bawDateRangeCache",
            function ($parse, bawDateRangeCache) {
                return {
                    scope: false,
                    restrict: "A",
                    require: ["ngModel", "^^form"],
                    link: function (scope, element, attributes, [ngModel, FormController]) {

                        let expression = $parse(attributes.bawMaxDate);

                        bawDateRangeCache.addMaxDateControl(ngModel);

                        ngModel.$validators.maxDate = function (modelValue, viewValue) {
                            // if its not a date we don't care
                            // leave other validators to parse date validity or requiredness
                            let value = modelValue,
                                result = false;

                            if (!angular.isDate(value) || isNaN(value)) {
                                result = true;
                            }
                            else {
                                let maxDate = expression(scope);

                                // we don't want the validator to check when the limit is missing
                                if (!maxDate) {
                                    result = true;
                                }
                                else if (value <= maxDate) {
                                    result = true;
                                }
                            }

                            // trigger a validation for the other half of the range controls
                            bawDateRangeCache.revalidateMinDateControls(modelValue, viewValue);

                            return result;
                        };


                    }
                };
            }
        ]
    );

