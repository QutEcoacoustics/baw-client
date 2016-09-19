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
                onRouteChangeSuccess(null, $route.current, null, null);
            });

            this.title = "";
            this.links = omnipresentLinks;
            this.activeResource = null;
            this.icon = null;
            this.actionItemsTemplate = null;

            $rootScope.$on("$routeChangeSuccess", onRouteChangeSuccess);
            $rootScope.$watch(
                () => ActiveResource.resource,
                () => controller.activeResource = ActiveResource.get()
            );

            function onRouteChangeSuccess(event, current, previous, rejection) {
                // reset the active resource
                ActiveResource.set(null);

                controller.title = current.$$route.title;
                controller.icon = current.$$route.icon;
                controller.actionItemsTemplate = current.$$route.actionsTemplateUrl;

                let currentLink = {title: controller.title, href: $location.$$path, icon: controller.icon};
                let extraLinks = current.$$route.secondaryNavigation || [];
                let contextualLinks = extraLinks.concat(currentLink).map((link, index) => {
                    link.indentation = index;
                    return link;
                });

                let omniLinks = omnipresentLinks
                    .filter((link) => !link.condition || link.condition.call(link, userModel))
                    .map(link => {
                        link.href = _.isFunction(link.href) ? link.href.call(link, userModel) : link.href;
                        return link;
                    });


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
                    if (renderer.source) {
                        renderer.source.content.remove();
                        renderer.source.scope.$destroy();
                        renderer.source = null;
                    }
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
