
exports.forLib = function (LIB) {
    
    var exports = {};
    
    exports.spin = function (context) {
    
        const PAGE = require("page");
    
        var Page = function () {
            var self = this;
    
            var basePath = context.getBasePath();
            
            var initNotified = false;
    
            // TODO: Make history survive page loads

            if (
                basePath &&
                basePath !== "/"
            ) {
                PAGE.base(basePath);
            }

            var defaultNavigated = false;
            PAGE('*', function load(ctx) {

                var forceNotify = !initNotified;
                initNotified = true;
                var path = ctx.path.replace(/\?.*$/, "");

                function setPath (path, forceNotify) {
                    defaultNavigated = true;
                    if (
                        path === context.getPath({hash:true}) &&
                        forceNotify !== true
                    ) return;

                    context.setPath(path, forceNotify);
                }

                // TODO: Track query.
                if (
                    path === "/" &&
                    context.getPath({hash:true}) &&
                    context.getPath({hash:true}) !== "/" &&
                    !defaultNavigated
                ) {
                    // When loading root page, navigate to default page if set
                    setPath(context.getPath({hash:true}), forceNotify);
                } else {
                    setPath(path + (ctx.hash?"#"+ctx.hash:""), forceNotify);
                }
            });

    		context.on("changed:path", function (path) {
                if (PAGE.current === path) return;
                PAGE.show(path);
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
