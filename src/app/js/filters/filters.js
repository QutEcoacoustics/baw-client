'strict';

/* http://docs.angularjs.org/#!angular.filter */
(function() {
    var bawfs = angular.module('bawApp.filters', []);

    /*
     http://stackoverflow.com/questions/11873570/angularjs-for-loop-with-numbers-ranges

     <div ng-repeat="n in [] | range:100">
     do something
     </div>
     */
    bawfs.filter('range', function() {
        return function(input, total) {
            total = parseInt(total);
            for (var i=0; i<total; i++) {
                input.push(i);
            }
            return input;
        };
    });

    bawfs.filter('boolToWords', function(){
        return function(text,truePhrase, falsePhrase){
            var value = JSON.parse(text);
            if (value) {
                return truePhrase || "";
            }
            else {
                return falsePhrase || "";
            }
        }
    });

    /**
     * moment js adapters
     *
     * requires momentjs
     */
    bawfs.filter('moment', function() {
       return function(input, method) {

           if (input) {
               var restOfArguments = Array.prototype.slice.call(arguments, 2, arguments.length);

               var  m = moment(input);
               return m[method].apply(m, restOfArguments);

           }

           return "";
       }
    });


    /**
     * Format a given value to the with the site's default timespan formatter
     * assumes input is in seconds
     */
    bawfs.filter('formatTimeSpan', function() {
        return function(input) {

            if (input) {
                return baw.secondsToDurationFormat(input);
            }
            else {
                return '';
            }

        }
    });


    /**
     * Output a tag name when given an ID
     */
    bawfs.filter('tagName', ['Tag', function(Tag) {
        return function(input) {

            var id = parseInt(input, 10);

            if (id && !isNaN(id)) {
                var tag = Tag.resolve(id);

                if (tag) {
                    return tag.text;
                }

                return "";
            }
            else {
                return "";
            }
        }
    }]);

})();
