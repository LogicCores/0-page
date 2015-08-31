
exports.spin = function (context) {

    const PAGE = require("page");

    var Page = function () {
        var self = this;

        PAGE('*', function load(ctx) {
            context.setPath(ctx.path);
        });
    
        // Wait for listeners to attach
        setTimeout(function () {
            PAGE({
            	popstate: false,
            	click: false
            });
        }, 0);
    }
    Page.prototype.navigateTo = function (path) {
        PAGE.show(path);
    }

    return new Page(context);
}
