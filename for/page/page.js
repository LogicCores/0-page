
exports.spin = function (context) {

    const PAGE = require("page");

    var Page = function () {
        var self = this;
    
        self._path = null;
    
        PAGE('*', function load(ctx) {
        	try {
                if (self._path !== ctx.path) {
                    self._path = ctx.path;
                    self.emit("changed:path", ctx.path);
                }
        	} catch (err) {
        		console.error("page changed error:", err.stack);
        	}
        });
    
        // Wait for listeners to attach
        setTimeout(function () {
            PAGE({
            	popstate: false,
            	click: false
            });
        }, 0);
    }
    Page.prototype = Object.create(window.EventEmitter.prototype);
    Page.prototype.navigateTo = function (path) {
        PAGE.show(path);
    }

    return new Page(context);
}
