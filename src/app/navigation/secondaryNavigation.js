angular
    .module("bawApp.navigation.secondaryNavigation", [])
    .factory("ActiveResource", function () {
        var activeResource = {
            resource: null,
            set(newValue) {
                this.resource = newValue;
            },
            get() {
                return this.resource;
            }
        };

        return activeResource;
    })
    .controller("SecondaryNavigationController", [
        "lodash",
        "$rootScope",
        "$location",
        "$route",
        "conf.paths",
        "ActiveResource",
        "MenuDefinition",
        "UserProfile",
        function (_, $rootScope, $location, $route, paths, ActiveResource, MenuDefinition, UserProfile) {
            var controller = this;

            const omnipresentLinks = MenuDefinition;

            var userModel = null;
            UserProfile.get.then(() => {
                userModel = UserProfile.profile;
                prepareLinks($route.current);
            });

            this.title = "";
            this.links = omnipresentLinks;
            this.activeResource = null;
            this.icon = null;
            this.actionItemsTemplate = null;

            $rootScope.$on("$routeChangeSuccess", onRouteChangeSuccess);
            $rootScope.$watch(
                () => ActiveResource.resource,
                () => {
                    controller.activeResource = ActiveResource.get();
                    prepareLinks($route.current);
                }
            );

            function onRouteChangeSuccess(event, current, previous, rejection) {
                //console.log("routeChangeSuccess", event, current, previous, rejection);

                // reset the active resource
                ActiveResource.set(null);

                prepareLinks(current);
            }

            function prepareLinks(current) {
                controller.title = current.$$route.title;
                controller.icon = current.$$route.icon;
                controller.actionItemsTemplate = current.$$route.actionsTemplateUrl;

                let currentLink = {
                    title: controller.title,
                    href: $location.$$path,
                    icon: controller.icon,
                    indentation: current.$$route.indentation
                };
                let extraLinks = transformLinks(current.$$route.secondaryNavigation || []);

                let contextualLinks = extraLinks.concat(currentLink);
                let omniLinks = transformLinks(omnipresentLinks);

                // insert contextual links under omninode, or stick at bottom
                let parentIndex = omniLinks.findIndex(link => link.href === contextualLinks[0].href);
                if (parentIndex >= 0) {

                    contextualLinks.shift();
                    omniLinks.splice(parentIndex + 1, 0, ...contextualLinks);
                }
                else {
                    omniLinks.push(...contextualLinks);
                }

                controller.links = omniLinks
                    .map(activePath.bind(null, current.$$route));
            }

            // allows for dynamic filtering or generation of links
            let transformLinks = function(links) {
                return links
                    .filter((link) => !link.condition || link.condition.call(link, userModel, controller.activeResource))
                    .map(link => {
                        // copy object so we don't overwrite original values by reference permanently
                        let newLink = Object.assign({}, link);
                        newLink.href = _.isFunction(link.href) ? link.href.call(link, userModel, controller.activeResource) : link.href;
                        newLink.indentation = link.indentation || 0;
                        return newLink;
                    });
            };

            let activePath = function (route, link) {
                link.isActive = route.regexp.test(link.href);
                return link;
            };
        }])
    .component("leftNavBar", {
        controller: "SecondaryNavigationController",
        templateUrl: ["conf.paths", function (paths) {
            return paths.site.files.navigation.left;
        }]
    })
    .component("rightNavBar", {
        controller: "SecondaryNavigationController",
        templateUrl: ["conf.paths", function (paths) {
            return paths.site.files.navigation.right;
        }]
    })
    .directive("layout", [
        "$cacheFactory",
        "$timeout",
        "$rootScope",
        function ($cacheFactory, $timeout, $rootScope) {
            const layoutCacheKey = "layoutCache",
                maxRenderAttempts = 2;

            var layoutCache = $cacheFactory(layoutCacheKey),
                renderers = [];

            function storeLayout(layoutKey, linkArguments) {
                // remove the original layout directive
                linkArguments.element[0].remove();

                layoutCache.put(layoutKey, linkArguments);
            }

            function applyLayout(renderer, renderAttempts = maxRenderAttempts) {
                //console.debug("layoutDirective::link::applyLayout: ", renderer.layoutKey);

                let storedLayout = layoutCache.get(renderer.layoutKey);

                if (storedLayout === undefined) {
                    if (renderAttempts <= 0) {
                        console.warn(
                            `layout rendering failed for layoutKey '${renderer.layoutKey}' after ${maxRenderAttempts} attempts`);
                        return;
                    }

                    // try again next render loop!
                    //console.debug(`The \`layout\` directive has no stored content for the \`render-for\` key
                    // '${renderer.layoutKey}' - trying again`);
                    renderAttempts--;
                    $timeout(applyLayout, 0, true, renderer, renderAttempts);
                    return;
                }

                storedLayout.transclude(function (clone, scope) {
                    renderer.element.append(clone);
                    renderer.source = {content: clone, scope};
                });
            }

            function onRouteChangeStart(event, current, previous, rejection) {
                renderers.forEach((renderer) => {
                    // try a nice cleanup
                    if (renderer.source) {
                        renderer.source.scope.$destroy();
                        renderer.source.content.remove();
                        renderer.source = null;
                    }

                    // unfortunately the above clean does not always work, especially for transcluded elements
                    // that change their definition or insert extra DOM (e.g. ng-if)
                    renderer.element.children().toArray().forEach(element => {
                        element.remove();
                    });
                });

                layoutCache.removeAll();
            }

            function viewContentLoaded() {
                for (let renderer of renderers) {
                    applyLayout(renderer);
                }
            }

            $rootScope.$on("$routeChangeStart", onRouteChangeStart);
            $rootScope.$on("$viewContentLoaded", viewContentLoaded);

            return {
                transclude: true,
                restrict: "EA",
                scope: {
                    contentFor: "@",
                    renderFor: "@"
                },
                link: function (scope, element, attr, ctrl, transclude) {
                    if (attr.contentFor && attr.renderFor) {
                        throw "The `layout` directive cannot have `content-for` and `render-for` attributes set at the same time.";
                    }

                    if (attr.contentFor) {
                        //console.debug("layoutDirective::link::contentFor: ", attr.contentFor);
                        storeLayout(attr.contentFor, {scope, element, attr, ctrl, transclude});
                    }

                    if (attr.renderFor) {
                        //console.debug("layoutDirective::link::renderFor: ", attr.renderFor);
                        renderers.push({layoutKey: attr.renderFor, scope, element, attr, ctrl, transclude});
                    }
                }
            };
        }]);
