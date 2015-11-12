
exports.forLib = function (LIB) {
    
    var exports = {};

    exports.forContexts = function (contexts) {
    
        var exports = {};
    
        var Context = exports.Context = function (defaults) {
            var self = this;
        
            var state = LIB._.extend({
            }, defaults || {});

            self.config = defaults;

            self.getBaseUrl = function () {
                return state.baseUrl;
            }

            self.getBasePath = function () {
                return state.baseUrl.replace(/^https?:\/\/[^\/]+/, "");
            }

        }
        Context.prototype = Object.create(LIB.EventEmitter.prototype);
        Context.prototype.contexts = contexts;

        return exports;
    }

    // TODO: Load adapters as needed on demand

    exports.adapters = {
    };

    return exports;
}
