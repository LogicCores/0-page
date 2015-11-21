
exports.forLib = function (LIB) {

    const PAGE = require("../../../../lib/firewidgets-for-zerosystem/window.page");

    var exports = {};

    exports.spin = function (context) {
    
        const DOM_DELEGATOR = require("dom-delegator");
    
    
        var Page = function () {
            var self = this;
            
            var rootElm = LIB.$("body");
            
            function initEventDelegator () {
                
                var eventBus = new LIB.EventEmitter();
    
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
                LIB.$("[data-component-action-target]", rootElm).each(function () {
                    var elm = LIB.$(this);
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
                LIB.$('[data-component-view]', rootElm).each(function () {
        			var elm = LIB.$(this);
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
                    var anchor = LIB.$(this);
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
                    var href = action.href;
                    var basePath = context.getBasePath();
                    if (action.href.substring(0, basePath.length) === basePath) {
                        href = href.substring(basePath.length);
                    }
                    context.setPath(href);
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
            
            
            function augmentInternalLinks (domNode, anchorName) {

                // Update internal links in loaded page to point to our anchor if not specifically set.
                $("a[href]", domNode).each(function () {
                    var elm = $(this);
                    var href = elm.attr("href");
                    if (!/^\//.test(href)) return;
                    if (elm.attr("data-component-action-target")) return;
                    elm.attr("data-component-action-target", "anchor:" + anchorName);
                    elm.attr("data-component-action-href", href);
                    elm.click(function (argument) {
                        // Prevent page from navigating away.
                        // Events get acted on in the delegator.
                        return false;
                    });
                });
            }

			context.contexts.component.on("rendered:component", function (component) {
			    var anchor = component.getPageContext().anchor;
			    if (!anchor) return;
			    augmentInternalLinks(component.getDomNode(), anchor);
			});


    		context.on("changed:views", function (views) {
    		    showViews(views);
    		});

            var lastPath = null;
    		context.on("changed:path", function (path) {

                // If only the hash has changed we do not re-render the page.
                if (
                    lastPath &&
                    lastPath.replace(/#.*$/, "") === path.replace(/#.*$/, "")
                ) {
                    // Ignore page change event as only hash has changed.
                    return;
                }
                lastPath = path;

                LIB.Promise.all(Object.keys(anchors).map(function (name) {
                    if (!context.anchors[name]) {
                        return window.Promise.resolve();
                    }
                    return context.anchors[name](context).then(function (data) {

                        var anchor = anchors[name];

                        var subComponents = [];

                        if (data.chscript) {

                            // NOTE: This will render a vtree to the page and leave it up to
                            //       the container to to look for sub components to render.

                            var template = new context.contexts.adapters.template["virtual-dom"].Template(
                                path,
                                data.chscript
                            );
                            template.renderTo(anchor.elm, {
                                "$anchors": function (name) {
                                    subComponents.push(name);
                                    return null;
                                }
                            });

                        } else
                        if (typeof data.html === "string") {
                            anchor.elm.html(data.html);
                        } else {
                            // TODO: Patch instead of clearing previous content.
                            anchor.elm.html("");
                            $(data.html).appendTo(anchor.elm);
                        }

                        augmentInternalLinks(anchor.elm, name);

                        context.emit("rendered", {
                            path: path,
                            anchor: name,
                            domNode: anchor.elm,
                            subComponents: subComponents
                        });

                        return null;
                    });
                })).catch(function (err) {
                    console.error("Error rendering page", err.stack);
                });
    		});
    		
    		

        	var cachedPageContent = {};

    		self.loadPageContentForContext = function (pageContext) {
    		    var contexts = context.contexts;

    		    // There are two ways to load pages.
    		    // 1) The optimized way using the PINF loader which loads a script file.
    		    // 2) The fallback approach which loads a HTML file and extracts the page component from it.
    		    
    		    function loadPINFBundle () {
    		        
    		        
    		    }

    		    function loadPlainHTML () {

    				var uri = context.getBaseUrl() + pageContext.getPath() + ".md.htm";

    				if (
    					context.config.alwaysReload === false &&
    					cachedPageContent[uri]
    				) {
                        // TODO: Optionally initiate fetch or HEAD and update page if changed.
    					return LIB.Promise.resolve(cachedPageContent[uri]);
    				}

    				function fetchPageContent () {

    					return contexts.adapters.fetch.window.fetch(uri).then(function(response) {
    						if (response.status !== 200) {
    							var err = new Error("Error fetching page content");
    							err.code = response.status;
    							throw err;
    						}
    						return response.text();
    					}).then(function (html) {
    						return html;
    					});
    				}
    
    				// TODO: Cache page objects including new context from initContainerContext() below and just
    				//       detach/re-attach when navigating in cached mode.
    				return fetchPageContent().then(function (html) {
    
    					// TODO: Remove this once scripts are cached more intelligently in nested contexts.
    					contexts.component.resetComponentScripts();
    
     					return contexts.adapters.component.firewidgets.liftComponentsForPageFragment(
    						context,
    						html
    					).then(function (htmlish) {

    					    if (typeof htmlish.getLayout === "function") {
    					        // We got a chscript which we can pass along directly.
    							return {
    								chscript: htmlish.getLayout()
    							};
    					    }

    					    // We got something that will generate HTML.
    					    // TODO: Convert to chscript or render directly.

    						function getHTML (htmlish) {
    							if (typeof htmlish === "string") {
    								return htmlish || "";
    							} else
    							if (typeof htmlish === "function") {
    								return htmlish() || "";
    							} else {
    								console.error("htmlish", htmlish);
    								throw new Error("Unknown factory for htmlish!");
    							}
    						}
    						
    						// Disable all page scripts thare are still left.
    						// TODO: Enable running of page scripts for script tags that have a contract for a runtime declared.
    						// @source http://stackoverflow.com/a/9899441/330439
    						function removeScripts (text) {
    							var SCRIPT_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
    							while (SCRIPT_REGEX.test(text)) {
    							    text = text.replace(SCRIPT_REGEX, "");
    							}
    							return text;
    						}
    
    						var html = getHTML(htmlish);
    						html = removeScripts(html);
    
    						return {
    							html: html
    						};
    					});
    				}).then(function (response) {
    
    					cachedPageContent[uri] = response;
    					return response;
    				}).catch(function (err) {
    					console.error("Error fetching page content", err);
    					return {
    						html: "Got error status: " + err.code
    					};
    				});
    		    }

    		    return loadPlainHTML();
			}
        }

        return new Page(context);
    }
    
    return exports;
}    
