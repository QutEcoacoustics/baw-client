angular
    .module("bawApp.models.userProfile", [])
    .factory(
    "baw.models.UserProfile",
    [
        "baw.models.associations",
        "baw.models.ApiBase",
        "conf.paths",
        "$url",
        function (associations, ApiBase, paths, $url) {

            class UserProfile extends ApiBase {
                constructor(resource, defaultProfile) {
                    if (!defaultProfile) {
                        throw new Error("A default profile must be supplied");
                    }

                    if (!resource) {
                        resource = defaultProfile;
                    }

                    super(resource);

                    this.preferences = this.preferences || {};

                    // ensure preferences are always updated
                    this.preferences = Object.assign({}, defaultProfile.preferences, this.preferences);

                    this.imageUrls = this.imageUrls.reduce((s, c) => {
                        c.url = paths.api.root + c.url;
                        s[c.size] = c;
                        return s;
                    }, {});
                }

                get url() {
                    // user profile url
                    return $url.formatUri(
                        paths.api.links.userAccountsAbsolute,
                        {userId: this.id}
                    );
                }

                get isAdmin() {
                    // HACK: `rolesMask` is not available in current version of API but
                    // currently only the `admin` user can be an admin, so...
                    // Related to: https://github.com/QutBioacoustics/baw-server/issues/235
                    return this.rolesMask === 1 || /^admin$/i.test(this.userName);
                }
            }

            return UserProfile;
        }]);