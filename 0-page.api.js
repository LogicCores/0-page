
// TODO: Load adapters as needed on demand

exports.adapters = {
    firewidgets: require("./for/firewidgets"),
    page: require("./for/page")
}


var Context = exports.Context = function () {
    var self = this;

    var state = {
        path: null
    };
    
    self.setPath = function (path) {
    	try {
            if (state.path !== path) {
                state.path = path;
                self.emit("changed:path", path);
            }
    	} catch (err) {
    		console.error("page changed error:", err.stack);
    	}
    }

    self.getPath = function () {
        return state.path;
    }
}
Context.prototype = Object.create(window.EventEmitter.prototype);
