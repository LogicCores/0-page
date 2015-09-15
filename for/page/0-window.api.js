
exports.forLib = function (LIB) {
    
    var exports = {};
    
    exports.spin = function (context) {
    
        const PAGE = require("page");
    
        var Page = function () {
            var self = this;
    
            var basePath = context.getBasePath();
            
            var initNotified = false;
    
            // TODO: Make history survive page loads
    
            var currentPath = null;
            PAGE('*', function load(ctx) {
                var forceNotify = !initNotified;
                initNotified = true;
    
                var path = ctx.path.replace(/\?.*$/, "");
                // TODO: Use 'PAGE.base()'
                path = path.replace(new RegExp(basePath.replace(/\//g, "\\/")), "");
                currentPath = path;
    
                // TODO: Track query.
                if (
                    path === "/" &&
                    context.getPath() &&
                    context.getPath() !== "/"
                ) {
                    // When loading root page, navigate to default page if set
                    context.setPath(context.getPath(), forceNotify);
                } else {
                    context.setPath(path, forceNotify);
                }
            });
    
    		context.on("changed:path", function (path) {
                PAGE.show(basePath + path);
    		});
    
            // Wait for listeners to attach
            setTimeout(function () {
                PAGE({
                	popstate: true,
                	click: false
                });
            }, 0);
        }
    
        return new Page(context);
    }

    return exports;
}
