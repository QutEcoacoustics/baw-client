angular
    .module("bawApp.models.project", [])
    .factory(
    "baw.models.Project",
    [
        "baw.models.associations",
        "baw.models.ApiBase",
        "conf.paths",
        "$url",
        function (associations, ApiBase, paths, $url) {

            class Project extends ApiBase {
                constructor(resource) {
                    super(resource);


                    this.createdAt = new Date(resource.createdAt);
                    this.updatedAt = new Date(resource.updatedAt);
                }

                get url() {
                    // project view url
                    return $url.formatUri(
                        paths.api.links.projectAbsolute,
                        {projectId: this.id}
                    );
                }
            }

            return Project;
        }]);
