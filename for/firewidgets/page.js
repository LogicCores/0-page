
exports.spin = function (context) {

    var Page = function () {
        var self = this;

		context.on("changed:path", function (path) {

console.log("SCAN FIREWIDGETS AFTER PATH CHANGE", path);

		});
    }

    return new Page(context);
}
