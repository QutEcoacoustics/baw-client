angular
    .module("bawApp.models.site", [])
    .factory(
    "baw.models.Site",
    [
        "baw.models.associations",
        "baw.models.ApiBase",
        "conf.paths",
        "$url",
        function (associations, ApiBase, paths, $url) {

            class Site extends ApiBase {
                constructor(resource) {
                    super(resource);

                    this.createdAt = new Date(resource.createdAt);
                    this.updatedAt = new Date(resource.updatedAt);

                }

                get url() {
                    // site url
                    // there are some sites in the database that have been orphaned
                    // in this case we can't provide a url to the site because the main website
                    // does not have a flat path for site access (i.e. requires a project id for the url)
                    if (this.projects && this.projects.length !== 0) {
                        return this.projects.map(this.urlWithProject, this);
                    }
                    else {
                        return null;
                    }
                }

                urlWithProject(project) {
                    if (project && project.id) {
                        return $url.formatUri(paths.api.links.siteAbsolute,
                            {
                                projectId: project.id,
                                siteId: this.id
                            });
                    }
                }
            }

            return Site;
        }]);
