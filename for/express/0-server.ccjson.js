
exports.forLib = function (LIB) {
    var ccjson = this;
    
    const URL = require("url");

    return LIB.Promise.resolve({
        forConfig: function (defaultConfig) {

            var Entity = function (instanceConfig) {
                var self = this;

                self.AspectInstance = function (aspectConfig) {

                    var config = {};
                    LIB._.merge(config, defaultConfig);
                    LIB._.merge(config, instanceConfig);
                    LIB._.merge(config, aspectConfig);

                    var context = {
                        contextForUri: function (uri) {

                            var originalUri = uri;

                            return LIB.Promise.promisify(function (callback) {

                                var htmRequested = /\.html?$/.test(uri);
                                if (!htmRequested) {
                                    uri += ".htm" + (/\/index$/.test(uri) ? "l":"");
                                }
                                var baseUri = LIB.path.dirname(uri);
                                var filename = LIB.path.basename(uri);
                        
                                // TODO: Refactor to 'cores/overlay'
                                function locateFile (baseUri, filename, callback) {
                                    var path = LIB.path.join(config.skin.basePath, baseUri, filename);
                                    return LIB.fs.exists(path, function (exists) {
                                        if (exists) {
                                            return callback(null, LIB.path.join(baseUri, filename));
                                        }
                                        // If the exact path is not found we check for an index file.
                                        path = LIB.path.join(config.skin.basePath, baseUri, "index.html");
                                        return LIB.fs.exists(path, function (exists) {
                                            if (exists) {
                                                return callback(null, LIB.path.join(baseUri, "index.html"));
                                            }
                                            // The original path nor index file was found so we fall back
                                            // to the file of the parent secion and let the
                                            // client load the correct page content based on
                                            // window.location.pathname
                                            var parentBaseUri = LIB.path.dirname(baseUri);
                                            if (parentBaseUri === baseUri) {
                                                var err = new Error("No file found for uri: " + uri);
                                                err.code = 404;
                                                return callback(err);
                                            }
                                            return locateFile(parentBaseUri, filename, callback);
                                        });
                                    });
                                }

                                return locateFile(baseUri, filename, function (err, uri) {
                                    if (err) return callback(err);
                                    
                                    var baseUrlParts = URL.parse(config.pages.baseUrl);

                                    return callback(null, {
                                        "skin": {
                                            "host": {
                                                "baseUrl": config.pages.baseUrl,
                                                "path": uri
                                            },
                                            "data": {
                                                "componentsPath": LIB.path.join(config.skin.basePath, "components.json"),
                                                "path": LIB.path.join(config.skin.basePath, uri)
                                            }
                                        },
                                        "page": {
                                            "host": {
                                                "baseUrl": config.pages.baseUrl,
                                                "path": originalUri,
                                                "url": config.pages.baseUrl + originalUri
                                            },
                                            "data": {
                                                "path": LIB.path.join(config.pages.basePath, originalUri)
                                            }
                                        },
                                        "clientContext": config.client.context
                                    });
                                });
                            })();
                        }
                    };

                    return LIB.Promise.resolve({
                        app: function () {

                            return LIB.Promise.resolve(
                                ccjson.makeDetachedFunction(
                                    function (req, res, next) {
                                        if (
                                            config.request &&
                                            config.request.contextAlias
                                        ) {
                                            if (!req.context) {
                                                req.context = {};
                                            }
                                            req.context[config.request.contextAlias] = context;
                                        }
                                        return next();
                                    }
                                )
                            );
                        }
                    });
                }
            }
            Entity.prototype.config = defaultConfig;

            return Entity;
        }
    });
}
