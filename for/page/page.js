
exports.spin = function (context) {

    const PAGE = require("page");

    var Page = function () {
        var self = this;

        PAGE('*', function load(ctx) {
            context.setPath(ctx.path);
        });

		context.on("changed:path", function (path) {
            PAGE.show(path);
		});

        // Wait for listeners to attach
        setTimeout(function () {
            PAGE({
            	popstate: false,
            	click: false
            });
        }, 0);
    }

    return new Page(context);
}
