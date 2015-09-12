
// TODO: Load adapters as needed on demand

exports.adapters = {
    firewidgets: require("./for/firewidgets"),
    page: require("./for/page")
}

exports.forContexts = function (contexts) {

    var exports = {};
    
    var Context = exports.Context = function (defaults) {
        var self = this;
    
        var state = {
            baseUrl: null,
            path: null,
            views: []
        };
        window._.merge(state, window._.cloneDeep(defaults));
    

        self.getBaseUrl = function () {
            return state.baseUrl;
        }
    
        self.getBasePath = function () {
            return state.baseUrl.replace(/^https?:\/\/[^\/]+/, "");
        }
    
        self.setPath = function (path, forceNotify) {
            if (state.path !== path || forceNotify) {
                state.path = path;
                self.emit("changed:path", path);
            }
        }

        self.resolveUri = function (uri) {
            if (/https?:\/\//.test(uri)) {
                return uri;
            }
            if (/\//.test(uri)) {
                // Absolute path relative to base
                return state.baseUrl + uri;
            }
            // Path relative to current page
            return state.baseUrl + state.path.replace(/\/[^\/]+$/, "") + "/" + uri;
        }

        self.setViews = function (views) {
            if (!window._.isEqual(state.views, views)) {
                state.views = views;
                self.emit("changed:views", views);
            }
        }

        self.getPath = function () {
            return state.path;
        }
    
        self.redirectTo = function (uri) {
            // TODO: Keep track of where we are so we can re-init our
            //       state when we come back.

            var url = self.resolveUri(uri);
/*
            if (/^\//.test(url)) {
                var windowOrigin = window.location.origin || (window.location.protocol + "//" + window.location.host);
                url = windowOrigin + url;
            }
*/
            // TODO: Don't do this here. Let `window` adapter handle it.
            window.location.href = url;
        }
    }
    Context.prototype = Object.create(window.EventEmitter.prototype);
    Context.prototype.contexts = contexts;

    return exports;
}
