
// TODO: Load adapters as needed on demand

exports.adapters = {
    firewidgets: require("./for/firewidgets"),
    page: require("./for/page")
}


var Context = exports.Context = function (defaults) {
    var self = this;

    var state = window._.extend({
        baseUrl: null,
        path: null,
        views: []
    }, defaults || {});


    self.setBaseUrl = function (baseUrl) {
        state.baseUrl = baseUrl;
    }

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

    self.setViews = function (views) {
        if (!window._.isEqual(state.views, views)) {
            state.views = views;
            self.emit("changed:views", views);
        }
    }

    self.getPath = function () {
        return state.path;
    }

    self.redirectTo = function (url) {
        // TODO: Keep track of where we are so we can re-init our
        //       state when we come back.

        if (/^\//.test(url)) {
            var windowOrigin = window.location.origin || (window.location.protocol + "//" + window.location.host);
            url = windowOrigin + url;
        }

        // TODO: Don't do this here. Let `window` adapter handle it.
        window.location.href = url;
    }
}
Context.prototype = Object.create(window.EventEmitter.prototype);
