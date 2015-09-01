
exports.spin = function (context) {

    const DOM_DELEGATOR = require("dom-delegator");


    var Page = function () {
        var self = this;
        
        function initEventDelegator () {
            
            var eventBus = new window.EventEmitter();

            var delegator = DOM_DELEGATOR();
            delegator.addGlobalEventListener("click", function (event) {

                var elm = $(event.target);
                var actionTarget = elm.attr("data-component-action-target");

                if (!actionTarget) return;

                var action = {
                    elm: elm,
                    href: elm.attr("data-component-action-href"),
                    target: actionTarget,
                    activeClass: elm.attr("data-component-action-active-class")
                };

                eventBus.emit("action", action);
                return;
            });
            
            return eventBus;
        }

        function hookActions () {
            var actions = [];
            $("[data-component-action-target]").each(function () {
                var elm = $(this);
                var action = {
                    elm: elm,
                    href: elm.attr("data-component-action-href"),
                    target: elm.attr("data-component-action-target"),
                    activeClass: elm.attr("data-component-action-active-class")
                };
                if (typeof action.href === "undefined") {
                    action.href = elm.attr("href");
                    elm.attr("data-component-action-href", action.href);
                    elm.click(function (argument) {
                        // Prevent page from navigating away.
                        // Events get acted on in the delegator.
                        return false;
                    });
                }
                actions.push(action);
            });
            return actions;
        }

        function scanAnchors () {
            var anchors = {};
            $("[data-component-anchor-id]").each(function () {
                var anchor = $(this);
                anchors[anchor.attr("data-component-anchor-id")] = {
                    elm: anchor
                };
            });
            return anchors;
        }


        var delegator = initEventDelegator();

        var actions = hookActions();
//console.log("actions", actions);

        var anchors = scanAnchors();
//console.log("anchors", anchors);

        delegator.on("action", function (action) {
            if (action.href) {
                context.setPath(action.href);
            }
        });

		context.on("changed:path", function (path) {
            window.Promise.all(Object.keys(anchors).map(function (name) {
                if (!context.anchors[name]) {
                    return window.Promise.resolve();
                }
                return context.anchors[name](context).then(function (data) {

                    var anchor = anchors[name];
                    // TODO: Allow for various renderers.
                    anchor.elm.html(data.html);
                });
            })).catch(function (err) {
                console.error("Error rendering page", err.stack);
            });
		});
    }

    return new Page(context);
}
