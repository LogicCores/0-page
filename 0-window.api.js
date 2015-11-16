
exports.forLib = function (LIB) {
    
    var exports = {};

    // TODO: Load adapters as needed on demand
    
    exports.adapters = {
        firewidgets: require("./for/firewidgets/0-window.api").forLib(LIB),
        page: require("./for/page/0-window.api").forLib(LIB)
    }
    
    exports.forContexts = function (contexts) {
    
        var exports = {};
        
        var Context = exports.Context = function (defaults) {
            var self = this;
        
            var state = {
                baseUrl: null,
                nextPath: null,     // The next path we should be transitioning to as soon as possible
                path: null,         // The current path
                views: [],
                isAnimatingDeferred: null
            };
            LIB._.merge(state, LIB._.cloneDeep(defaults));

            self.config = defaults;


            self.getBaseUrl = function () {
                return state.baseUrl;
            }
        
            self.getBasePath = function () {
                return state.baseUrl.replace(/^https?:\/\/[^\/]+/, "");
            }

            self.setPath = function (path, forceNotify) {
                if (state.path !== path || forceNotify) {
                    if (state.isAnimatingDeferred) {
                        // We wait until the previous page has finished animating.
                        state.nextPath = path;
                    } else {
                        // The previous page has already finished animating
                        // or this is the first time so we can switch right away.
                        state.nextPath = null;
                        state.path = path;
                        state.isAnimatingDeferred = LIB.Promise.defer();
                        state.isAnimatingDeferred.promise.timeout(15 * 1000).catch(LIB.Promise.TimeoutError, function (err) {
                            console.error("Page took too long to render!");
                        }).then(function () {
console.log("PAGE IS ALL ANIMATED!!!!!");

                            state.isAnimatingDeferred = null;
                            if (state.nextPath) {
console.log("SET NEXT PATH:::", state.nextPath);
                                self.setPath(state.nextPath);
                            }
                        });
                        self.emit("changed:path", path);
                    }
                }
            }

            self.notifyPageAnimated = function () {
                if (!state.isAnimatingDeferred) {
                    throw new Error("There is no rendered page pending animation!");
                }
                state.isAnimatingDeferred.resolve();
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
                if (!LIB._.isEqual(state.views, views)) {
                    state.views = views;
                    self.emit("changed:views", views);
                }
            }
    
            self.getPath = function (options) {
                options = options || {};
                var parts = state.path.split("#");
                var path = "";
                if (options.path !== false) {
                    path = parts[0];
                }
                if (
                    options.hash === true &&
                    parts[1]
                ) {
                    path += "#" + parts[1];
                }
                return path;
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
        Context.prototype = Object.create(LIB.EventEmitter.prototype);
        Context.prototype.contexts = contexts;
    
        return exports;
    }

    return exports;
}
