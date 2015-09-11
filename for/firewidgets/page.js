
exports.spin = function (context) {

    const DOM_DELEGATOR = require("dom-delegator");


    var Page = function () {
        var self = this;
        
        var rootElm = $("body");
        
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
            $("[data-component-action-target]", rootElm).each(function () {
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

        function hookViews () {
            var views = {};
            $('[data-component-view]', rootElm).each(function () {
    			var elm = $(this);
    			// We ignore views that are within components
    			if (typeof elm.attr("data-component-section") !== "undefined") return;
    			var name = elm.attr("data-component-view");
    			var visibility = elm.attr("data-component-view-visibility") || null;

                if (!views[name]) {
                    views[name] = [];
                }
    			views[name].push({
    			    elm: elm,
    			    hide: function () {
            			if (visibility === "hidden") {
            				elm.css("visibility", "hidden");
            			} else {
            				elm.addClass("hidden");
            			}
    			    },
    			    show: function () {
            			if (visibility === "hidden") {
            				elm.css("visibility", "");
            			} else {
            				elm.removeClass("hidden");
            			}
    			    }
    			});
    		});
    		return views;
        }

        function scanAnchors () {
            var anchors = {};
            $("[data-component-anchor-id]", rootElm).each(function () {
                var anchor = $(this);
                anchors[anchor.attr("data-component-anchor-id")] = {
                    elm: anchor
                };
            });
            return anchors;
        }


        var delegator = initEventDelegator();
        var actions = hookActions();
        var declaredViews = hookViews();


        function showViews (views) {
            views = views || [];
            var viewsByName = {};
            views.forEach(function (view) {
                viewsByName[view] = true;
            });

            Object.keys(declaredViews).forEach(function (name) {
                declaredViews[name].forEach(function (declaredView) {
                    if (viewsByName[name]) {
                        declaredView.show();
                    } else {
                        declaredView.hide();
                    }
                });
            });
        }


        var anchors = scanAnchors();

        delegator.on("action", function (action) {
            if (action.href && action.href !== "#") {
                context.setPath(action.href);
            } else
            if (
                action.target &&
                /^action:/.test(action.target) &&
                context.actions
            ) {
                var name = action.target.replace(/^action:/, "");
                if (context.actions[name]) {

                    context.actions[name](context).catch(function (err) {
                        console.error("Error calling action '" + name + "'", err.stack);
                    });
                }
            }
        });

		context.on("changed:views", function (views) {
		    showViews(views);
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
