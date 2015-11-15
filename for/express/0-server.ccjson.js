
exports.forLib = function (LIB) {
    var ccjson = this;

    return LIB.Promise.resolve({
        forConfig: function (defaultConfig) {

            var Entity = function (instanceConfig) {
                var self = this;

                var config = {};
                LIB._.merge(config, defaultConfig);
                LIB._.merge(config, instanceConfig);
                config = ccjson.attachDetachedFunctions(config);

                var context = config.context();

                var api = {
                    contextForUri: function (uri) {

                        var originalUri = uri;

                        return LIB.Promise.promisify(function (callback) {
                            // We strip all allowed extensions if present.
                            // The extensions serve the page in alternative formats.
                            uri = uri.replace(/(\.md)?\.html?$/, "");
                            var lookupPath = uri;
                            if (/\/$/.test(uri)) {
                                uri += "index";
                            }

                            var baseUri = LIB.path.dirname(uri);
                            var filename = LIB.path.basename(uri);
                    
                            // TODO: Refactor to 'cores/overlay'
                            function locateSkinFile (baseUri, filename, callback) {
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
                                        return locateSkinFile(parentBaseUri, filename, callback);
                                    });
                                });
                            }

                            // TODO: Refactor to 'cores/overlay'
                            function locatePageFile (baseUri, filename, callback) {
                                var path = LIB.path.join(config.pages.basePath, baseUri, filename);
                                return LIB.fs.exists(path, function (exists) {
                                    if (exists) {
                                        return callback(null, LIB.path.join(baseUri, filename));
                                    }
                                    // If the exact path is not found we check for an index file.
                                    path = LIB.path.join(config.pages.basePath, baseUri, "Index.md");
                                    return LIB.fs.exists(path, function (exists) {
                                        if (exists) {
                                            return callback(null, LIB.path.join(baseUri, "Index.md"));
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
                                        return locatePageFile(parentBaseUri, filename, callback);
                                    });
                                });
                            }

                            return locateSkinFile(
                                baseUri,
                                filename + ".htm" + (/\/index$/.test(originalUri) ? "l":""),
                                function (err, skinUri) {
                                    if (err) {
                                        // If skin is not found we assume its not a valid page url
                                        return callback(null, null);
                                    }

                                    return locatePageFile(
                                        baseUri,
                                        filename + ".md",
                                        function (err, pageUri) {
                                            if (
                                                err &&
                                                err.code === 404 &&
                                                config.pages.defaultPath
                                            ) {
                                                err = null;
                                                pageUri = config.pages.defaultPath;
                                            }

                                            if (err) {
                                                // If page is not found we assume its not a valid page url
                                                return callback(null, null);
                                            }

                                            pageUri = pageUri || "/";

                                            var baseUrlParts = LIB.url.parse(config.pages.baseUrl);

                                            function getClientContext () {
                                                var clientContext = config.client.context;
                                                Object.keys(clientContext).forEach(function (name) {
                                                    if (typeof clientContext[name] === "function") {
                                                        clientContext[name] = clientContext[name]();
                                                    }
                                                });
                                                return clientContext;
                                            }

                                            // TODO: Refactor to '../../0-server.api.js' just like context in '../../0-window.api.js'
                                            return callback(null, {
                                                "skin": {
                                                    "host": {
                                                        "baseUrl": config.pages.baseUrl,
                                                        "path": skinUri
                                                    },
                                                    "data": {
                                                        "componentsPath": LIB.path.join(config.skin.basePath, "components.json"),
                                                        "path": LIB.path.join(config.skin.basePath, skinUri)
                                                    }
                                                },
                                                "page": {
                                                    "lookup": {
                                                        "path": lookupPath
                                                    },
                                                    "host": {
                                                        "baseUrl": config.pages.baseUrl,
                                                        "path": originalUri,
                                                        "url": config.pages.baseUrl + originalUri
                                                    },
                                                    "data": {
                                                        "basePath": config.pages.basePath,
                                                        "path": pageUri,
                                                        "realpath": LIB.path.join(config.pages.basePath, pageUri)
                                                    }
                                                },
                                                "clientContext": getClientContext()
                                            });
                                        }
                                    );
                                }
                            );
                        })();
                    }
                };

                context.setAdapterAPI(api);
                context.setAspectConfig({
                    baseUrl: config.pages.baseUrl
                });
            }
            Entity.prototype.config = defaultConfig;


            return Entity;
        }
    });
}
