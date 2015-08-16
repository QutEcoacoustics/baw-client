/**
 * http://www.hunlock.com/blogs/Totally_Pwn_CSS_with_Javascript
 */
(function (window, undefined) {
    /**
     * Retrieves the desired rule from the documents stylesheets
     * @param ruleName
     * @param {string=} deleteFlag
     * @returns {boolean}
     */
    function getCSSRule(ruleName, deleteFlag) {
        ruleName = ruleName.toLowerCase();
        if (document.styleSheets) {
            for (var i = 0; i < document.styleSheets.length; i++) {
                var styleSheet = document.styleSheets[i];

                var cssRules;

                if (styleSheet.cssRules) {
                    cssRules = styleSheet.cssRules;
                } else {
                    cssRules = styleSheet.rules;
                }
                if (cssRules && cssRules.length > 0) {
                    for (var j = 0; j < cssRules.length; j++) {
                        var rule = cssRules[j];
                        var selector = rule.hasOwnProperty("selectorText") ? rule.selectorText.toLowerCase().trim() : "";
                        //console.log(selector);
                        if (selector === ruleName) {
                            if (deleteFlag === "delete") {
                                if (styleSheet.cssRules) {
                                    styleSheet.deleteRule(j);
                                } else {
                                    styleSheet.removeRule(j);
                                }
                                return true;
                            } else {
                                return rule;
                            }
                        }
                    }
                }

            }
        }
        return false;
    }

    function killCSSRule(ruleName) {
        return getCSSRule(ruleName, "delete");
    }

    function addCSSRule(ruleName) {
        if (document.styleSheets) {
            if (!getCSSRule(ruleName)) {
                if (document.styleSheets[0].addRule) {
                    document.styleSheets[0].addRule(ruleName, null, 0);
                } else {
                    document.styleSheets[0].insertRule(ruleName, " { }", 0);
                }
            }
        }
        return getCSSRule(ruleName);
    }

    if (window.cssRules) {
        throw "cssRules already defined globally, will not overwrite";
    }
    else {
        window.cssRules = {
            getCssRule: getCSSRule,
            killCssRule: killCSSRule,
            addCssRule: addCSSRule
        };
    }

})(window);
