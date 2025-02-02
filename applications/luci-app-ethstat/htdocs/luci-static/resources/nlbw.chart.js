(function () {
    var p = this,
        l = p.Chart,
        e = function (a) {
            this.canvas = a.canvas;
            this.ctx = a;
            var b = function (a, b) {
                return a["offset" + b] ? a["offset" + b] : document.defaultView.getComputedStyle(a).getPropertyValue(b);
            };
            this.width = b(a.canvas, "Width") || a.canvas.width;
            this.height = b(a.canvas, "Height") || a.canvas.height;
            this.width = a.canvas.width;
            this.height = a.canvas.height;
            this.aspectRatio = this.width / this.height;
            d.retinaScale(this);
            return this;
        };
    e.defaults = {
        global: {
            animation: !0,
            animationSteps: 60,
            animationEasing: "easeOutQuart",
            showScale: !0,
            scaleOverride: !1,
            scaleSteps: null,
            scaleStepWidth: null,
            scaleStartValue: null,
            scaleLineColor: "rgba(0,0,0,.1)",
            scaleLineWidth: 1,
            scaleShowLabels: !0,
            scaleLabel: "<%=value%>",
            scaleIntegersOnly: !0,
            scaleBeginAtZero: !1,
            scaleFontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
            scaleFontSize: 12,
            scaleFontStyle: "normal",
            scaleFontColor: "#666",
            responsive: !1,
            maintainAspectRatio: !0,
            showTooltips: !0,
            customTooltips: !1,
            tooltipEvents: ["mousemove", "touchstart", "touchmove", "mouseout"],
            tooltipFillColor: "rgba(0,0,0,0.8)",
            tooltipFontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
            tooltipFontSize: 14,
            tooltipFontStyle: "normal",
            tooltipFontColor: "#fff",
            tooltipTitleFontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
            tooltipTitleFontSize: 14,
            tooltipTitleFontStyle: "bold",
            tooltipTitleFontColor: "#fff",
            tooltipTitleTemplate: "<%= label%>",
            tooltipYPadding: 6,
            tooltipXPadding: 6,
            tooltipCaretSize: 8,
            tooltipCornerRadius: 6,
            tooltipXOffset: 10,
            tooltipTemplate: "<%if (label){%><%=label%>: <%}%><%= value %>",
            multiTooltipTemplate: "<%= value %>",
            multiTooltipKeyBackground: "#fff",
            segmentColorDefault: "#A6CEE3 #1F78B4 #B2DF8A #33A02C #FB9A99 #E31A1C #FDBF6F #FF7F00 #CAB2D6 #6A3D9A #B4B482 #B15928".split(" "),
            segmentHighlightColorDefaults: "#CEF6FF #47A0DC #DAFFB2 #5BC854 #FFC2C1 #FF4244 #FFE797 #FFA728 #F2DAFE #9265C2 #DCDCAA #D98150".split(" "),
            onAnimationProgress: function () {},
            onAnimationComplete: function () {},
        },
    };
    e.types = {};
    var d = (e.helpers = {}),
        k = (d.each = function (a, b, c) {
            var f = Array.prototype.slice.call(arguments, 3);
            if (a)
                if (a.length === +a.length) {
                    var d;
                    for (d = 0; d < a.length; d++) b.apply(c, [a[d], d].concat(f));
                } else for (d in a) b.apply(c, [a[d], d].concat(f));
        }),
        h = (d.clone = function (a) {
            var b = {};
            k(a, function (c, f) {
                a.hasOwnProperty(f) && (b[f] = c);
            });
            return b;
        }),
        r = (d.extend = function (a) {
            k(Array.prototype.slice.call(arguments, 1), function (b) {
                k(b, function (c, f) {
                    b.hasOwnProperty(f) && (a[f] = c);
                });
            });
            return a;
        }),
        I = (d.merge = function (a, b) {
            var c = Array.prototype.slice.call(arguments, 0);
            c.unshift({});
            return r.apply(null, c);
        }),
        J = (d.indexOf = function (a, b) {
            if (Array.prototype.indexOf) return a.indexOf(b);
            for (var c = 0; c < a.length; c++) if (a[c] === b) return c;
            return -1;
        });
    d.where = function (a, b) {
        var c = [];
        d.each(a, function (a) {
            b(a) && c.push(a);
        });
        return c;
    };
    d.findNextWhere = function (a, b, c) {
        c || (c = -1);
        for (c += 1; c < a.length; c++) {
            var f = a[c];
            if (b(f)) return f;
        }
    };
    d.findPreviousWhere = function (a, b, c) {
        c || (c = a.length);
        for (--c; 0 <= c; c--) {
            var f = a[c];
            if (b(f)) return f;
        }
    };
    var D = (d.inherits = function (a) {
            var b = this,
                c =
                    a && a.hasOwnProperty("constructor")
                        ? a.constructor
                        : function () {
                              return b.apply(this, arguments);
                          },
                f = function () {
                    this.constructor = c;
                };
            f.prototype = b.prototype;
            c.prototype = new f();
            c.extend = D;
            a && r(c.prototype, a);
            c.__super__ = b.prototype;
            return c;
        }),
        A = (d.noop = function () {}),
        K = (d.uid = (function () {
            var a = 0;
            return function () {
                return "chart-" + a++;
            };
        })()),
        L = (d.warn = function (a) {
            window.console && "function" === typeof window.console.warn && console.warn(a);
        }),
        M = (d.amd = "function" === typeof define && define.amd),
        u = (d.isNumber = function (a) {
            return !isNaN(parseFloat(a)) && isFinite(a);
        }),
        y = (d.max = function (a) {
            return Math.max.apply(Math, a);
        }),
        w = (d.min = function (a) {
            return Math.min.apply(Math, a);
        });
    d.cap = function (a, b, c) {
        if (u(b)) {
            if (a > b) return b;
        } else if (u(c) && a < c) return c;
        return a;
    };
    var E = (d.getDecimalPlaces = function (a) {
            if (0 !== a % 1 && u(a)) {
                a = a.toString();
                if (0 > a.indexOf("e-")) return a.split(".")[1].length;
                if (0 > a.indexOf(".")) return parseInt(a.split("e-")[1]);
                a = a.split(".")[1].split("e-");
                return a[0].length + parseInt(a[1]);
            }
            return 0;
        }),
        B = (d.radians = function (a) {
            return (Math.PI / 180) * a;
        });
    d.getAngleFromPoint = function (a, b) {
        var c = b.x - a.x,
            f = b.y - a.y,
            d = Math.sqrt(c * c + f * f),
            m = 2 * Math.PI + Math.atan2(f, c);
        0 > c && 0 > f && (m += 2 * Math.PI);
        return { angle: m, distance: d };
    };
    var F = (d.aliasPixel = function (a) {
        return 0 === a % 2 ? 0 : 0.5;
    });
    d.splineCurve = function (a, b, c, f) {
        var d = Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2)),
            m = Math.sqrt(Math.pow(c.x - b.x, 2) + Math.pow(c.y - b.y, 2)),
            g = (f * d) / (d + m);
        f = (f * m) / (d + m);
        return { inner: { x: b.x - g * (c.x - a.x), y: b.y - g * (c.y - a.y) }, outer: { x: b.x + f * (c.x - a.x), y: b.y + f * (c.y - a.y) } };
    };
    var N = (d.calculateOrderOfMagnitude = function (a) {
        return Math.floor(Math.log(a) / Math.LN10);
    });
    d.calculateScaleRange = function (a, b, c, f, d) {
        b = Math.floor(b / (1.5 * c));
        c = 2 >= b;
        var m = [];
        k(a, function (a) {
            null == a || m.push(a);
        });
        var g = w(m),
            e = y(m);
        e === g && ((e += 0.5), 0.5 <= g && !f ? (g -= 0.5) : (e += 0.5));
        a = N(Math.abs(e - g));
        f = f ? 0 : Math.floor(g / (1 * Math.pow(10, a))) * Math.pow(10, a);
        for (var e = Math.ceil(e / (1 * Math.pow(10, a))) * Math.pow(10, a) - f, g = Math.pow(10, a), n = Math.round(e / g); (n > b || 2 * n < b) && !c; )
            if (n > b) (g *= 2), (n = Math.round(e / g)), 0 !== n % 1 && (c = !0);
            else if (d && 0 <= a)
                if (0 === (g / 2) % 1) (g /= 2), (n = Math.round(e / g));
                else break;
            else (g /= 2), (n = Math.round(e / g));
        c && ((n = 2), (g = e / n));
        return { steps: n, stepValue: g, min: f, max: f + n * g };
    };
    var t = (d.template = function (a, b) {
        if (a instanceof Function) return a(b);
        var c = {},
            c = /\W/.test(a)
                ? new Function(
                      "obj",
                      "var p=[],print=function(){p.push.apply(p,arguments);};with(obj){p.push('" +
                          a
                              .replace(/[\r\t\n]/g, " ")
                              .split("<%")
                              .join("\t")
                              .replace(/((^|%>)[^\t]*)'/g, "$1\r")
                              .replace(/\t=(.*?)%>/g, "',$1,'")
                              .split("\t")
                              .join("');")
                              .split("%>")
                              .join("p.push('")
                              .split("\r")
                              .join("\\'") +
                          "');}return p.join('');"
                  )
                : (c[a] = c[a]);
        return b ? c(b) : c;
    });
    d.generateLabels = function (a, b, c, f) {
        var d = Array(b);
        a &&
            k(d, function (b, e) {
                d[e] = t(a, { value: c + f * (e + 1) });
            });
        return d;
    };
    var x = (d.easingEffects = {
            linear: function (a) {
                return a;
            },
            easeInQuad: function (a) {
                return a * a;
            },
            easeOutQuad: function (a) {
                return -1 * a * (a - 2);
            },
            easeInOutQuad: function (a) {
                return 1 > (a /= 0.5) ? 0.5 * a * a : -0.5 * (--a * (a - 2) - 1);
            },
            easeInCubic: function (a) {
                return a * a * a;
            },
            easeOutCubic: function (a) {
                return 1 * ((a = a / 1 - 1) * a * a + 1);
            },
            easeInOutCubic: function (a) {
                return 1 > (a /= 0.5) ? 0.5 * a * a * a : 0.5 * ((a -= 2) * a * a + 2);
            },
            easeInQuart: function (a) {
                return a * a * a * a;
            },
            easeOutQuart: function (a) {
                return -1 * ((a = a / 1 - 1) * a * a * a - 1);
            },
            easeInOutQuart: function (a) {
                return 1 > (a /= 0.5) ? 0.5 * a * a * a * a : -0.5 * ((a -= 2) * a * a * a - 2);
            },
            easeInQuint: function (a) {
                return 1 * (a /= 1) * a * a * a * a;
            },
            easeOutQuint: function (a) {
                return 1 * ((a = a / 1 - 1) * a * a * a * a + 1);
            },
            easeInOutQuint: function (a) {
                return 1 > (a /= 0.5) ? 0.5 * a * a * a * a * a : 0.5 * ((a -= 2) * a * a * a * a + 2);
            },
            easeInSine: function (a) {
                return -1 * Math.cos((a / 1) * (Math.PI / 2)) + 1;
            },
            easeOutSine: function (a) {
                return 1 * Math.sin((a / 1) * (Math.PI / 2));
            },
            easeInOutSine: function (a) {
                return -0.5 * (Math.cos((Math.PI * a) / 1) - 1);
            },
            easeInExpo: function (a) {
                return 0 === a ? 1 : 1 * Math.pow(2, 10 * (a / 1 - 1));
            },
            easeOutExpo: function (a) {
                return 1 === a ? 1 : 1 * (-Math.pow(2, (-10 * a) / 1) + 1);
            },
            easeInOutExpo: function (a) {
                return 0 === a ? 0 : 1 === a ? 1 : 1 > (a /= 0.5) ? 0.5 * Math.pow(2, 10 * (a - 1)) : 0.5 * (-Math.pow(2, -10 * --a) + 2);
            },
            easeInCirc: function (a) {
                return 1 <= a ? a : -1 * (Math.sqrt(1 - (a /= 1) * a) - 1);
            },
            easeOutCirc: function (a) {
                return 1 * Math.sqrt(1 - (a = a / 1 - 1) * a);
            },
            easeInOutCirc: function (a) {
                return 1 > (a /= 0.5) ? -0.5 * (Math.sqrt(1 - a * a) - 1) : 0.5 * (Math.sqrt(1 - (a -= 2) * a) + 1);
            },
            easeInElastic: function (a) {
                var b = 1.70158,
                    c = 0,
                    f = 1;
                if (0 === a) return 0;
                if (1 == (a /= 1)) return 1;
                c || (c = 0.3);
                f < Math.abs(1) ? ((f = 1), (b = c / 4)) : (b = (c / (2 * Math.PI)) * Math.asin(1 / f));
                return -(f * Math.pow(2, 10 * --a) * Math.sin((2 * (1 * a - b) * Math.PI) / c));
            },
            easeOutElastic: function (a) {
                var b = 1.70158,
                    c = 0,
                    f = 1;
                if (0 === a) return 0;
                if (1 == (a /= 1)) return 1;
                c || (c = 0.3);
                f < Math.abs(1) ? ((f = 1), (b = c / 4)) : (b = (c / (2 * Math.PI)) * Math.asin(1 / f));
                return f * Math.pow(2, -10 * a) * Math.sin((2 * (1 * a - b) * Math.PI) / c) + 1;
            },
            easeInOutElastic: function (a) {
                var b = 1.70158,
                    c = 0,
                    f = 1;
                if (0 === a) return 0;
                if (2 == (a /= 0.5)) return 1;
                c || (c = 0.3 * 1.5);
                f < Math.abs(1) ? ((f = 1), (b = c / 4)) : (b = (c / (2 * Math.PI)) * Math.asin(1 / f));
                return 1 > a ? -0.5 * f * Math.pow(2, 10 * --a) * Math.sin((2 * (1 * a - b) * Math.PI) / c) : f * Math.pow(2, -10 * --a) * Math.sin((2 * (1 * a - b) * Math.PI) / c) * 0.5 + 1;
            },
            easeInBack: function (a) {
                return 1 * (a /= 1) * a * (2.70158 * a - 1.70158);
            },
            easeOutBack: function (a) {
                return 1 * ((a = a / 1 - 1) * a * (2.70158 * a + 1.70158) + 1);
            },
            easeInOutBack: function (a) {
                var b = 1.70158;
                return 1 > (a /= 0.5) ? 0.5 * a * a * (((b *= 1.525) + 1) * a - b) : 0.5 * ((a -= 2) * a * (((b *= 1.525) + 1) * a + b) + 2);
            },
            easeInBounce: function (a) {
                return 1 - x.easeOutBounce(1 - a);
            },
            easeOutBounce: function (a) {
                return (a /= 1) < 1 / 2.75 ? 7.5625 * a * a : a < 2 / 2.75 ? 1 * (7.5625 * (a -= 1.5 / 2.75) * a + 0.75) : a < 2.5 / 2.75 ? 1 * (7.5625 * (a -= 2.25 / 2.75) * a + 0.9375) : 1 * (7.5625 * (a -= 2.625 / 2.75) * a + 0.984375);
            },
            easeInOutBounce: function (a) {
                return 0.5 > a ? 0.5 * x.easeInBounce(2 * a) : 0.5 * x.easeOutBounce(2 * a - 1) + 0.5;
            },
        }),
        G = (d.requestAnimFrame = (function () {
            return (
                window.requestAnimationFrame ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                window.oRequestAnimationFrame ||
                window.msRequestAnimationFrame ||
                function (a) {
                    return window.setTimeout(a, 1e3 / 60);
                }
            );
        })());
    d.cancelAnimFrame = (function () {
        return (
            window.cancelAnimationFrame ||
            window.webkitCancelAnimationFrame ||
            window.mozCancelAnimationFrame ||
            window.oCancelAnimationFrame ||
            window.msCancelAnimationFrame ||
            function (a) {
                return window.clearTimeout(a, 1e3 / 60);
            }
        );
    })();
    d.animationLoop = function (a, b, c, f, d, e) {
        var g = 0,
            k = x[c] || x.linear,
            n = function () {
                g++;
                var c = g / b,
                    h = k(c);
                a.call(e, h, c, g);
                f.call(e, h, c);
                g < b ? (e.animationFrame = G(n)) : d.apply(e);
            };
        G(n);
    };
    d.getRelativePosition = function (a) {
        var b;
        b = a.originalEvent || a;
        var c = (a.currentTarget || a.srcElement).getBoundingClientRect();
        b.touches ? ((a = b.touches[0].clientX - c.left), (b = b.touches[0].clientY - c.top)) : ((a = b.clientX - c.left), (b = b.clientY - c.top));
        return { x: a, y: b };
    };
    var O = (d.addEvent = function (a, b, c) {
            a.addEventListener ? a.addEventListener(b, c) : a.attachEvent ? a.attachEvent("on" + b, c) : (a["on" + b] = c);
        }),
        P = (d.removeEvent = function (a, b, c) {
            a.removeEventListener ? a.removeEventListener(b, c, !1) : a.detachEvent ? a.detachEvent("on" + b, c) : (a["on" + b] = A);
        });
    d.bindEvents = function (a, b, c) {
        a.events || (a.events = {});
        k(b, function (b) {
            a.events[b] = function () {
                c.apply(a, arguments);
            };
            O(a.chart.canvas, b, a.events[b]);
        });
    };
    var Q = (d.unbindEvents = function (a, b) {
            k(b, function (b, f) {
                P(a.chart.canvas, f, b);
            });
        }),
        R = (d.getMaximumWidth = function (a) {
            a = a.parentNode;
            var b = parseInt(z(a, "padding-left")) + parseInt(z(a, "padding-right"));
            return a ? a.clientWidth - b : 0;
        }),
        S = (d.getMaximumHeight = function (a) {
            a = a.parentNode;
            var b = parseInt(z(a, "padding-bottom")) + parseInt(z(a, "padding-top"));
            return a ? a.clientHeight - b : 0;
        }),
        z = (d.getStyle = function (a, b) {
            return a.currentStyle ? a.currentStyle[b] : document.defaultView.getComputedStyle(a, null).getPropertyValue(b);
        });
    d.getMaximumSize = d.getMaximumWidth;
    var T = (d.retinaScale = function (a) {
            var b = a.ctx,
                c = a.canvas.width;
            a = a.canvas.height;
            window.devicePixelRatio &&
                ((b.canvas.style.width = c + "px"),
                (b.canvas.style.height = a + "px"),
                (b.canvas.height = a * window.devicePixelRatio),
                (b.canvas.width = c * window.devicePixelRatio),
                b.scale(window.devicePixelRatio, window.devicePixelRatio));
        }),
        U = (d.clear = function (a) {
            a.ctx.clearRect(0, 0, a.width, a.height);
        }),
        v = (d.fontString = function (a, b, c) {
            return b + " " + a + "px " + c;
        }),
        C = (d.longestText = function (a, b, c) {
            a.font = b;
            var f = 0;
            k(c, function (b) {
                b = a.measureText(b).width;
                f = b > f ? b : f;
            });
            return f;
        }),
        H = (d.drawRoundedRectangle = function (a, b, c, f, d, e) {
            a.beginPath();
            a.moveTo(b + e, c);
            a.lineTo(b + f - e, c);
            a.quadraticCurveTo(b + f, c, b + f, c + e);
            a.lineTo(b + f, c + d - e);
            a.quadraticCurveTo(b + f, c + d, b + f - e, c + d);
            a.lineTo(b + e, c + d);
            a.quadraticCurveTo(b, c + d, b, c + d - e);
            a.lineTo(b, c + e);
            a.quadraticCurveTo(b, c, b + e, c);
            a.closePath();
        });
    e.instances = {};
    e.Type = function (a, b, c) {
        this.options = b;
        this.chart = c;
        this.id = K();
        e.instances[this.id] = this;
        b.responsive && this.resize();
        this.initialize.call(this, a);
    };
    r(e.Type.prototype, {
        initialize: function () {
            return this;
        },
        clear: function () {
            U(this.chart);
            return this;
        },
        stop: function () {
            e.animationService.cancelAnimation(this);
            return this;
        },
        resize: function (a) {
            this.stop();
            var b = this.chart.canvas,
                c = R(this.chart.canvas),
                f = this.options.maintainAspectRatio ? c / this.chart.aspectRatio : S(this.chart.canvas);
            b.width = this.chart.width = c;
            b.height = this.chart.height = f;
            T(this.chart);
            "function" === typeof a && a.apply(this, Array.prototype.slice.call(arguments, 1));
            return this;
        },
        reflow: A,
        render: function (a) {
            a && this.reflow();
            this.options.animation && !a
                ? ((a = new e.Animation()),
                  (a.numSteps = this.options.animationSteps),
                  (a.easing = this.options.animationEasing),
                  (a.render = function (a, c) {
                      var f = c.currentStep / c.numSteps,
                          e = (0, d.easingEffects[c.easing])(f);
                      a.draw(e, f, c.currentStep);
                  }),
                  (a.onAnimationProgress = this.options.onAnimationProgress),
                  (a.onAnimationComplete = this.options.onAnimationComplete),
                  e.animationService.addAnimation(this, a))
                : (this.draw(), this.options.onAnimationComplete.call(this));
            return this;
        },
        generateLegend: function () {
            return t(this.options.legendTemplate, this);
        },
        destroy: function () {
            this.clear();
            Q(this, this.events);
            var a = this.chart.canvas;
            a.width = this.chart.width;
            a.height = this.chart.height;
            a.style.removeProperty ? (a.style.removeProperty("width"), a.style.removeProperty("height")) : (a.style.removeAttribute("width"), a.style.removeAttribute("height"));
            delete e.instances[this.id];
        },
        showTooltip: function (a, b) {
            "undefined" === typeof this.activeElements && (this.activeElements = []);
            if (
                function (a) {
                    var b = !1;
                    if (a.length !== this.activeElements.length) return (b = !0);
                    k(
                        a,
                        function (a, c) {
                            a !== this.activeElements[c] && (b = !0);
                        },
                        this
                    );
                    return b;
                }.call(this, a) ||
                b
            ) {
                this.activeElements = a;
                this.draw();
                this.options.customTooltips && this.options.customTooltips(!1);
                if (0 < a.length)
                    if (this.datasets && 1 < this.datasets.length) {
                        for (var c, f, q = this.datasets.length - 1; 0 <= q && ((c = this.datasets[q].points || this.datasets[q].bars || this.datasets[q].segments), (f = J(c, a[0])), -1 === f); q--);
                        var m = [],
                            g = [];
                        c = function (a) {
                            var b = [],
                                c,
                                e = [],
                                q = [],
                                k,
                                h,
                                l;
                            d.each(this.datasets, function (a) {
                                c = a.points || a.bars || a.segments;
                                c[f] && c[f].hasValue() && b.push(c[f]);
                            });
                            d.each(
                                b,
                                function (a) {
                                    e.push(a.x);
                                    q.push(a.y);
                                    m.push(d.template(this.options.multiTooltipTemplate, a));
                                    g.push({ fill: a._saved.fillColor || a.fillColor, stroke: a._saved.strokeColor || a.strokeColor });
                                },
                                this
                            );
                            l = w(q);
                            k = y(q);
                            h = w(e);
                            a = y(e);
                            return { x: h > this.chart.width / 2 ? h : a, y: (l + k) / 2 };
                        }.call(this, f);
                        new e.MultiTooltip({
                            x: c.x,
                            y: c.y,
                            xPadding: this.options.tooltipXPadding,
                            yPadding: this.options.tooltipYPadding,
                            xOffset: this.options.tooltipXOffset,
                            fillColor: this.options.tooltipFillColor,
                            textColor: this.options.tooltipFontColor,
                            fontFamily: this.options.tooltipFontFamily,
                            fontStyle: this.options.tooltipFontStyle,
                            fontSize: this.options.tooltipFontSize,
                            titleTextColor: this.options.tooltipTitleFontColor,
                            titleFontFamily: this.options.tooltipTitleFontFamily,
                            titleFontStyle: this.options.tooltipTitleFontStyle,
                            titleFontSize: this.options.tooltipTitleFontSize,
                            cornerRadius: this.options.tooltipCornerRadius,
                            labels: m,
                            legendColors: g,
                            legendColorBackground: this.options.multiTooltipKeyBackground,
                            title: t(this.options.tooltipTitleTemplate, a[0]),
                            chart: this.chart,
                            ctx: this.chart.ctx,
                            custom: this.options.customTooltips,
                        }).draw();
                    } else
                        k(
                            a,
                            function (a) {
                                var b = a.tooltipPosition();
                                new e.Tooltip({
                                    x: Math.round(b.x),
                                    y: Math.round(b.y),
                                    xPadding: this.options.tooltipXPadding,
                                    yPadding: this.options.tooltipYPadding,
                                    fillColor: this.options.tooltipFillColor,
                                    textColor: this.options.tooltipFontColor,
                                    fontFamily: this.options.tooltipFontFamily,
                                    fontStyle: this.options.tooltipFontStyle,
                                    fontSize: this.options.tooltipFontSize,
                                    caretHeight: this.options.tooltipCaretSize,
                                    cornerRadius: this.options.tooltipCornerRadius,
                                    text: t(this.options.tooltipTemplate, a),
                                    chart: this.chart,
                                    custom: this.options.customTooltips,
                                }).draw();
                            },
                            this
                        );
                return this;
            }
        },
        toBase64Image: function () {
            return this.chart.canvas.toDataURL.apply(this.chart.canvas, arguments);
        },
    });
    e.Type.extend = function (a) {
        var b = this,
            c = function () {
                return b.apply(this, arguments);
            };
        c.prototype = h(b.prototype);
        r(c.prototype, a);
        c.extend = e.Type.extend;
        if (a.name || b.prototype.name) {
            var f = a.name || b.prototype.name,
                d = e.defaults[b.prototype.name] ? h(e.defaults[b.prototype.name]) : {};
            e.defaults[f] = r(d, a.defaults);
            e.types[f] = c;
            e.prototype[f] = function (a, b) {
                var d = I(e.defaults.global, e.defaults[f], b || {});
                return new c(a, d, this);
            };
        } else L("Name not provided for this chart, so it hasn't been registered");
        return b;
    };
    e.Element = function (a) {
        r(this, a);
        this.initialize.apply(this, arguments);
        this.save();
    };
    r(e.Element.prototype, {
        initialize: function () {},
        restore: function (a) {
            a
                ? k(
                      a,
                      function (a) {
                          this[a] = this._saved[a];
                      },
                      this
                  )
                : r(this, this._saved);
            return this;
        },
        save: function () {
            this._saved = h(this);
            delete this._saved._saved;
            return this;
        },
        update: function (a) {
            k(
                a,
                function (a, c) {
                    this._saved[c] = this[c];
                    this[c] = a;
                },
                this
            );
            return this;
        },
        transition: function (a, b) {
            k(
                a,
                function (a, f) {
                    this[f] = (a - this._saved[f]) * b + this._saved[f];
                },
                this
            );
            return this;
        },
        tooltipPosition: function () {
            return { x: this.x, y: this.y };
        },
        hasValue: function () {
            return u(this.value);
        },
    });
    e.Element.extend = D;
    e.Point = e.Element.extend({
        display: !0,
        inRange: function (a, b) {
            return Math.pow(a - this.x, 2) + Math.pow(b - this.y, 2) < Math.pow(this.hitDetectionRadius + this.radius, 2);
        },
        draw: function () {
            if (this.display) {
                var a = this.ctx;
                a.beginPath();
                a.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
                a.closePath();
                a.strokeStyle = this.strokeColor;
                a.lineWidth = this.strokeWidth;
                a.fillStyle = this.fillColor;
                a.fill();
                a.stroke();
            }
        },
    });
    e.Arc = e.Element.extend({
        inRange: function (a, b) {
            var c = d.getAngleFromPoint(this, { x: a, y: b }),
                f = c.angle % (2 * Math.PI),
                e = (2 * Math.PI + this.startAngle) % (2 * Math.PI),
                m = (2 * Math.PI + this.endAngle) % (2 * Math.PI) || 360,
                c = c.distance >= this.innerRadius && c.distance <= this.outerRadius;
            return (m < e ? f <= m || f >= e : f >= e && f <= m) && c;
        },
        tooltipPosition: function () {
            var a = this.startAngle + (this.endAngle - this.startAngle) / 2,
                b = (this.outerRadius - this.innerRadius) / 2 + this.innerRadius;
            return { x: this.x + Math.cos(a) * b, y: this.y + Math.sin(a) * b };
        },
        draw: function (a) {
            a = this.ctx;
            a.beginPath();
            a.arc(this.x, this.y, 0 > this.outerRadius ? 0 : this.outerRadius, this.startAngle, this.endAngle);
            a.arc(this.x, this.y, 0 > this.innerRadius ? 0 : this.innerRadius, this.endAngle, this.startAngle, !0);
            a.closePath();
            a.strokeStyle = this.strokeColor;
            a.lineWidth = this.strokeWidth;
            a.fillStyle = this.fillColor;
            a.fill();
            a.lineJoin = "bevel";
            this.showStroke && a.stroke();
        },
    });
    e.Rectangle = e.Element.extend({
        draw: function () {
            var a = this.ctx,
                b = this.width / 2,
                c = this.x - b,
                b = this.x + b,
                f = this.base - (this.base - this.y),
                d = this.strokeWidth / 2;
            this.showStroke && ((c += d), (b -= d), (f += d));
            a.beginPath();
            a.fillStyle = this.fillColor;
            a.strokeStyle = this.strokeColor;
            a.lineWidth = this.strokeWidth;
            a.moveTo(c, this.base);
            a.lineTo(c, f);
            a.lineTo(b, f);
            a.lineTo(b, this.base);
            a.fill();
            this.showStroke && a.stroke();
        },
        height: function () {
            return this.base - this.y;
        },
        inRange: function (a, b) {
            return a >= this.x - this.width / 2 && a <= this.x + this.width / 2 && b >= this.y && b <= this.base;
        },
    });
    e.Animation = e.Element.extend({ currentStep: null, numSteps: 60, easing: "", render: null, onAnimationProgress: null, onAnimationComplete: null });
    e.Tooltip = e.Element.extend({
        draw: function () {
            var a = this.chart.ctx;
            a.font = v(this.fontSize, this.fontStyle, this.fontFamily);
            this.xAlign = "center";
            this.yAlign = "above";
            var b = (this.caretPadding = 2),
                c = a.measureText(this.text).width + 2 * this.xPadding,
                f = this.fontSize + 2 * this.yPadding,
                d = f + this.caretHeight + b;
            this.x + c / 2 > this.chart.width ? (this.xAlign = "left") : 0 > this.x - c / 2 && (this.xAlign = "right");
            0 > this.y - d && (this.yAlign = "below");
            var e = this.x - c / 2,
                d = this.y - d;
            a.fillStyle = this.fillColor;
            if (this.custom) this.custom(this);
            else {
                switch (this.yAlign) {
                    case "above":
                        a.beginPath();
                        a.moveTo(this.x, this.y - b);
                        a.lineTo(this.x + this.caretHeight, this.y - (b + this.caretHeight));
                        a.lineTo(this.x - this.caretHeight, this.y - (b + this.caretHeight));
                        a.closePath();
                        a.fill();
                        break;
                    case "below":
                        (d = this.y + b + this.caretHeight),
                            a.beginPath(),
                            a.moveTo(this.x, this.y + b),
                            a.lineTo(this.x + this.caretHeight, this.y + b + this.caretHeight),
                            a.lineTo(this.x - this.caretHeight, this.y + b + this.caretHeight),
                            a.closePath(),
                            a.fill();
                }
                switch (this.xAlign) {
                    case "left":
                        e = this.x - c + (this.cornerRadius + this.caretHeight);
                        break;
                    case "right":
                        e = this.x - (this.cornerRadius + this.caretHeight);
                }
                H(a, e, d, c, f, this.cornerRadius);
                a.fill();
                a.fillStyle = this.textColor;
                a.textAlign = "center";
                a.textBaseline = "middle";
                a.fillText(this.text, e + c / 2, d + f / 2);
            }
        },
    });
    e.MultiTooltip = e.Element.extend({
        initialize: function () {
            this.font = v(this.fontSize, this.fontStyle, this.fontFamily);
            this.titleFont = v(this.titleFontSize, this.titleFontStyle, this.titleFontFamily);
            this.titleHeight = this.title ? 1.5 * this.titleFontSize : 0;
            this.height = this.labels.length * this.fontSize + (this.fontSize / 2) * (this.labels.length - 1) + 2 * this.yPadding + this.titleHeight;
            this.ctx.font = this.titleFont;
            var a = this.ctx.measureText(this.title).width,
                b = C(this.ctx, this.font, this.labels) + this.fontSize + 3;
            this.width = y([b, a]) + 2 * this.xPadding;
            a = this.height / 2;
            0 > this.y - a ? (this.y = a) : this.y + a > this.chart.height && (this.y = this.chart.height - a);
            this.x = this.x > this.chart.width / 2 ? this.x - (this.xOffset + this.width) : this.x + this.xOffset;
        },
        getLineHeight: function (a) {
            var b = this.y - this.height / 2 + this.yPadding;
            return 0 === a ? b + this.titleHeight / 3 : b + (1.5 * this.fontSize * (a - 1) + this.fontSize / 2) + this.titleHeight;
        },
        draw: function () {
            if (this.custom) this.custom(this);
            else {
                H(this.ctx, this.x, this.y - this.height / 2, this.width, this.height, this.cornerRadius);
                var a = this.ctx;
                a.fillStyle = this.fillColor;
                a.fill();
                a.closePath();
                a.textAlign = "left";
                a.textBaseline = "middle";
                a.fillStyle = this.titleTextColor;
                a.font = this.titleFont;
                a.fillText(this.title, this.x + this.xPadding, this.getLineHeight(0));
                a.font = this.font;
                d.each(
                    this.labels,
                    function (b, c) {
                        a.fillStyle = this.textColor;
                        a.fillText(b, this.x + this.xPadding + this.fontSize + 3, this.getLineHeight(c + 1));
                        a.fillStyle = this.legendColorBackground;
                        a.fillRect(this.x + this.xPadding, this.getLineHeight(c + 1) - this.fontSize / 2, this.fontSize, this.fontSize);
                        a.fillStyle = this.legendColors[c].fill;
                        a.fillRect(this.x + this.xPadding, this.getLineHeight(c + 1) - this.fontSize / 2, this.fontSize, this.fontSize);
                    },
                    this
                );
            }
        },
    });
    e.Scale = e.Element.extend({
        initialize: function () {
            this.fit();
        },
        buildYLabels: function () {
            this.yLabels = [];
            for (var a = E(this.stepValue), b = 0; b <= this.steps; b++) this.yLabels.push(t(this.templateString, { value: (this.min + b * this.stepValue).toFixed(a) }));
            this.yLabelWidth = this.display && this.showLabels ? C(this.ctx, this.font, this.yLabels) + 10 : 0;
        },
        addXLabel: function (a) {
            this.xLabels.push(a);
            this.valuesCount++;
            this.fit();
        },
        removeXLabel: function () {
            this.xLabels.shift();
            this.valuesCount--;
            this.fit();
        },
        fit: function () {
            this.startPoint = this.display ? this.fontSize : 0;
            this.endPoint = this.display ? this.height - 1.5 * this.fontSize - 5 : this.height;
            this.startPoint += this.padding;
            var a = (this.endPoint -= this.padding),
                b = this.endPoint - this.startPoint,
                c;
            this.calculateYRange(b);
            this.buildYLabels();
            for (this.calculateXLabelRotation(); b > this.endPoint - this.startPoint; )
                (b = this.endPoint - this.startPoint), (c = this.yLabelWidth), this.calculateYRange(b), this.buildYLabels(), c < this.yLabelWidth && ((this.endPoint = a), this.calculateXLabelRotation());
        },
        calculateXLabelRotation: function () {
            this.ctx.font = this.font;
            var a = this.ctx.measureText(this.xLabels[0]).width,
                b;
            this.xScalePaddingRight = this.ctx.measureText(this.xLabels[this.xLabels.length - 1]).width / 2 + 3;
            this.xScalePaddingLeft = a / 2 > this.yLabelWidth ? a / 2 : this.yLabelWidth;
            this.xLabelRotation = 0;
            if (this.display) {
                var c = C(this.ctx, this.font, this.xLabels),
                    f;
                this.xLabelWidth = c;
                for (var d = Math.floor(this.calculateX(1) - this.calculateX(0)) - 6; (this.xLabelWidth > d && 0 === this.xLabelRotation) || (this.xLabelWidth > d && 90 >= this.xLabelRotation && 0 < this.xLabelRotation); )
                    (f = Math.cos(B(this.xLabelRotation))),
                        (b = f * a),
                        b + this.fontSize / 2 > this.yLabelWidth && (this.xScalePaddingLeft = b + this.fontSize / 2),
                        (this.xScalePaddingRight = this.fontSize / 2),
                        this.xLabelRotation++,
                        (this.xLabelWidth = f * c);
                0 < this.xLabelRotation && (this.endPoint -= Math.sin(B(this.xLabelRotation)) * c + 3);
            } else (this.xLabelWidth = 0), (this.xScalePaddingLeft = this.xScalePaddingRight = this.padding);
        },
        calculateYRange: A,
        drawingArea: function () {
            return this.startPoint - this.endPoint;
        },
        calculateY: function (a) {
            var b = this.drawingArea() / (this.min - this.max);
            return this.endPoint - b * (a - this.min);
        },
        calculateX: function (a) {
            var b = (this.width - (this.xScalePaddingLeft + this.xScalePaddingRight)) / Math.max(this.valuesCount - (this.offsetGridLines ? 0 : 1), 1);
            a = b * a + this.xScalePaddingLeft;
            this.offsetGridLines && (a += b / 2);
            return Math.round(a);
        },
        update: function (a) {
            d.extend(this, a);
            this.fit();
        },
        draw: function () {
            var a = this.ctx,
                b = (this.endPoint - this.startPoint) / this.steps,
                c = Math.round(this.xScalePaddingLeft);
            this.display &&
                ((a.fillStyle = this.textColor),
                (a.font = this.font),
                k(
                    this.yLabels,
                    function (f, e) {
                        var k = this.endPoint - b * e,
                            g = Math.round(k),
                            h = this.showHorizontalLines;
                        a.textAlign = "right";
                        a.textBaseline = "middle";
                        this.showLabels && a.fillText(f, c - 10, k);
                        0 !== e || h || (h = !0);
                        h && a.beginPath();
                        0 < e ? ((a.lineWidth = this.gridLineWidth), (a.strokeStyle = this.gridLineColor)) : ((a.lineWidth = this.lineWidth), (a.strokeStyle = this.lineColor));
                        g += d.aliasPixel(a.lineWidth);
                        h && (a.moveTo(c, g), a.lineTo(this.width, g), a.stroke(), a.closePath());
                        a.lineWidth = this.lineWidth;
                        a.strokeStyle = this.lineColor;
                        a.beginPath();
                        a.moveTo(c - 5, g);
                        a.lineTo(c, g);
                        a.stroke();
                        a.closePath();
                    },
                    this
                ),
                k(
                    this.xLabels,
                    function (b, c) {
                        var d = this.calculateX(c) + F(this.lineWidth),
                            e = this.calculateX(c - (this.offsetGridLines ? 0.5 : 0)) + F(this.lineWidth),
                            k = 0 < this.xLabelRotation,
                            h = this.showVerticalLines;
                        0 !== c || h || (h = !0);
                        h && a.beginPath();
                        0 < c ? ((a.lineWidth = this.gridLineWidth), (a.strokeStyle = this.gridLineColor)) : ((a.lineWidth = this.lineWidth), (a.strokeStyle = this.lineColor));
                        h && (a.moveTo(e, this.endPoint), a.lineTo(e, this.startPoint - 3), a.stroke(), a.closePath());
                        a.lineWidth = this.lineWidth;
                        a.strokeStyle = this.lineColor;
                        a.beginPath();
                        a.moveTo(e, this.endPoint);
                        a.lineTo(e, this.endPoint + 5);
                        a.stroke();
                        a.closePath();
                        a.save();
                        a.translate(d, k ? this.endPoint + 12 : this.endPoint + 8);
                        a.rotate(-1 * B(this.xLabelRotation));
                        a.font = this.font;
                        a.textAlign = k ? "right" : "center";
                        a.textBaseline = k ? "middle" : "top";
                        a.fillText(b, 0, 0);
                        a.restore();
                    },
                    this
                ));
        },
    });
    e.RadialScale = e.Element.extend({
        initialize: function () {
            this.size = w([this.height, this.width]);
            this.drawingArea = this.display ? this.size / 2 - (this.fontSize / 2 + this.backdropPaddingY) : this.size / 2;
        },
        calculateCenterOffset: function (a) {
            return (this.drawingArea / (this.max - this.min)) * (a - this.min);
        },
        update: function () {
            this.lineArc ? (this.drawingArea = this.display ? this.size / 2 - (this.fontSize / 2 + this.backdropPaddingY) : this.size / 2) : this.setScaleSize();
            this.buildYLabels();
        },
        buildYLabels: function () {
            this.yLabels = [];
            for (var a = E(this.stepValue), b = 0; b <= this.steps; b++) this.yLabels.push(t(this.templateString, { value: (this.min + b * this.stepValue).toFixed(a) }));
        },
        getCircumference: function () {
            return (2 * Math.PI) / this.valuesCount;
        },
        setScaleSize: function () {
            var a = w([this.height / 2 - this.pointLabelFontSize - 5, this.width / 2]),
                b,
                c,
                d,
                e = this.width,
                k,
                g = 0,
                h;
            this.ctx.font = v(this.pointLabelFontSize, this.pointLabelFontStyle, this.pointLabelFontFamily);
            for (c = 0; c < this.valuesCount; c++)
                (b = this.getPointPosition(c, a)),
                    (d = this.ctx.measureText(t(this.templateString, { value: this.labels[c] })).width + 5),
                    0 === c || c === this.valuesCount / 2
                        ? ((d /= 2), b.x + d > e && ((e = b.x + d), (k = c)), b.x - d < g && ((g = b.x - d), (h = c)))
                        : c < this.valuesCount / 2
                        ? b.x + d > e && ((e = b.x + d), (k = c))
                        : c > this.valuesCount / 2 && b.x - d < g && ((g = b.x - d), (h = c));
            b = g;
            e = Math.ceil(e - this.width);
            k = this.getIndexAngle(k);
            h = this.getIndexAngle(h);
            k = e / Math.sin(k + Math.PI / 2);
            h = b / Math.sin(h + Math.PI / 2);
            k = u(k) ? k : 0;
            h = u(h) ? h : 0;
            this.drawingArea = a - (h + k) / 2;
            this.setCenterPoint(h, k);
        },
        setCenterPoint: function (a, b) {
            this.xCenter = (a + this.drawingArea + (this.width - b - this.drawingArea)) / 2;
            this.yCenter = this.height / 2;
        },
        getIndexAngle: function (a) {
            return ((2 * Math.PI) / this.valuesCount) * a - Math.PI / 2;
        },
        getPointPosition: function (a, b) {
            var c = this.getIndexAngle(a);
            return { x: Math.cos(c) * b + this.xCenter, y: Math.sin(c) * b + this.yCenter };
        },
        draw: function () {
            if (this.display) {
                var a = this.ctx;
                k(
                    this.yLabels,
                    function (b, c) {
                        if (0 < c) {
                            var d = (this.drawingArea / this.steps) * c,
                                e = this.yCenter - d;
                            if (0 < this.lineWidth) {
                                a.strokeStyle = this.lineColor;
                                a.lineWidth = this.lineWidth;
                                if (this.lineArc) a.beginPath(), a.arc(this.xCenter, this.yCenter, d, 0, 2 * Math.PI);
                                else {
                                    a.beginPath();
                                    for (var f = 0; f < this.valuesCount; f++) (d = this.getPointPosition(f, this.calculateCenterOffset(this.min + c * this.stepValue))), 0 === f ? a.moveTo(d.x, d.y) : a.lineTo(d.x, d.y);
                                }
                                a.closePath();
                                a.stroke();
                            }
                            this.showLabels &&
                                ((a.font = v(this.fontSize, this.fontStyle, this.fontFamily)),
                                this.showLabelBackdrop &&
                                    ((d = a.measureText(b).width),
                                    (a.fillStyle = this.backdropColor),
                                    a.fillRect(this.xCenter - d / 2 - this.backdropPaddingX, e - this.fontSize / 2 - this.backdropPaddingY, d + 2 * this.backdropPaddingX, this.fontSize + 2 * this.backdropPaddingY)),
                                (a.textAlign = "center"),
                                (a.textBaseline = "middle"),
                                (a.fillStyle = this.fontColor),
                                a.fillText(b, this.xCenter, e));
                        }
                    },
                    this
                );
                if (!this.lineArc) {
                    a.lineWidth = this.angleLineWidth;
                    a.strokeStyle = this.angleLineColor;
                    for (var b = this.valuesCount - 1; 0 <= b; b--) {
                        var c = null,
                            d = null;
                        0 < this.angleLineWidth && ((c = this.calculateCenterOffset(this.max)), (d = this.getPointPosition(b, c)), a.beginPath(), a.moveTo(this.xCenter, this.yCenter), a.lineTo(d.x, d.y), a.stroke(), a.closePath());
                        if (this.backgroundColors && this.backgroundColors.length == this.valuesCount) {
                            null == c && (c = this.calculateCenterOffset(this.max));
                            null == d && (d = this.getPointPosition(b, c));
                            var e = this.getPointPosition(0 === b ? this.valuesCount - 1 : b - 1, c),
                                h = this.getPointPosition(b === this.valuesCount - 1 ? 0 : b + 1, c),
                                c = (e.x + d.x) / 2,
                                e = (e.y + d.y) / 2,
                                g = (d.x + h.x) / 2,
                                h = (d.y + h.y) / 2;
                            a.beginPath();
                            a.moveTo(this.xCenter, this.yCenter);
                            a.lineTo(c, e);
                            a.lineTo(d.x, d.y);
                            a.lineTo(g, h);
                            a.fillStyle = this.backgroundColors[b];
                            a.fill();
                            a.closePath();
                        }
                        d = this.getPointPosition(b, this.calculateCenterOffset(this.max) + 5);
                        a.font = v(this.pointLabelFontSize, this.pointLabelFontStyle, this.pointLabelFontFamily);
                        a.fillStyle = this.pointLabelFontColor;
                        e = this.labels.length;
                        c = this.labels.length / 2;
                        g = c / 2;
                        h = b < g || b > e - g;
                        e = b === g || b === e - g;
                        a.textAlign = 0 === b ? "center" : b === c ? "center" : b < c ? "left" : "right";
                        a.textBaseline = e ? "middle" : h ? "bottom" : "top";
                        a.fillText(this.labels[b], d.x, d.y);
                    }
                }
            }
        },
    });
    e.animationService = {
        frameDuration: 17,
        animations: [],
        dropFrames: 0,
        addAnimation: function (a, b) {
            for (var c = 0; c < this.animations.length; ++c)
                if (this.animations[c].chartInstance === a) {
                    this.animations[c].animationObject = b;
                    return;
                }
            this.animations.push({ chartInstance: a, animationObject: b });
            1 == this.animations.length && d.requestAnimFrame.call(window, this.digestWrapper);
        },
        cancelAnimation: function (a) {
            var b = d.findNextWhere(this.animations, function (b) {
                return b.chartInstance === a;
            });
            b && this.animations.splice(b, 1);
        },
        digestWrapper: function () {
            e.animationService.startDigest.call(e.animationService);
        },
        startDigest: function () {
            var a = Date.now(),
                b = 0;
            1 < this.dropFrames && ((b = Math.floor(this.dropFrames)), (this.dropFrames -= b));
            for (var c = 0; c < this.animations.length; c++)
                null === this.animations[c].animationObject.currentStep && (this.animations[c].animationObject.currentStep = 0),
                    (this.animations[c].animationObject.currentStep += 1 + b),
                    this.animations[c].animationObject.currentStep > this.animations[c].animationObject.numSteps && (this.animations[c].animationObject.currentStep = this.animations[c].animationObject.numSteps),
                    this.animations[c].animationObject.render(this.animations[c].chartInstance, this.animations[c].animationObject),
                    this.animations[c].animationObject.currentStep == this.animations[c].animationObject.numSteps &&
                        (this.animations[c].animationObject.onAnimationComplete.call(this.animations[c].chartInstance), this.animations.splice(c, 1), c--);
            a = (Date.now() - a - this.frameDuration) / this.frameDuration;
            1 < a && (this.dropFrames += a);
            0 < this.animations.length && d.requestAnimFrame.call(window, this.digestWrapper);
        },
    };
    d.addEvent(
        window,
        "resize",
        (function () {
            var a;
            return function () {
                clearTimeout(a);
                a = setTimeout(function () {
                    k(e.instances, function (a) {
                        a.options.responsive && a.resize(a.render, !0);
                    });
                }, 50);
            };
        })()
    );
    M
        ? define(function () {
              return e;
          })
        : "object" === typeof module && module.exports && (module.exports = e);
    p.Chart = e;
    e.noConflict = function () {
        p.Chart = l;
        return e;
    };
}.call(this));
(function () {
    var p = this.Chart,
        l = p.helpers,
        e = {
            segmentShowStroke: !0,
            segmentStrokeColor: "#fff",
            segmentStrokeWidth: 2,
            percentageInnerCutout: 50,
            animationSteps: 100,
            animationEasing: "easeOutBounce",
            animateRotate: !0,
            animateScale: !1,
            legendTemplate:
                '<ul class="<%=name.toLowerCase()%>-legend"><% for (var i=0; i<segments.length; i++){%><li><span style="background-color:<%=segments[i].fillColor%>"><%if(segments[i].label){%><%=segments[i].label%><%}%></span></li><%}%></ul>',
        };
    p.Type.extend({
        name: "Doughnut",
        defaults: e,
        initialize: function (d) {
            this.segments = [];
            this.outerRadius = (l.min([this.chart.width, this.chart.height]) - this.options.segmentStrokeWidth / 2) / 2;
            this.SegmentArc = p.Arc.extend({ ctx: this.chart.ctx, x: this.chart.width / 2, y: this.chart.height / 2 });
            this.options.showTooltips &&
                l.bindEvents(this, this.options.tooltipEvents, function (d) {
                    d = "mouseout" !== d.type ? this.getSegmentsAtEvent(d) : [];
                    l.each(this.segments, function (d) {
                        d.restore(["fillColor"]);
                    });
                    l.each(d, function (d) {
                        d.fillColor = d.highlightColor;
                    });
                    this.showTooltip(d);
                });
            this.calculateTotal(d);
            l.each(
                d,
                function (e, h) {
                    e.color || (e.color = "hsl(" + (360 * h) / d.length + ", 100%, 50%)");
                    this.addData(e, h, !0);
                },
                this
            );
            this.render();
        },
        getSegmentsAtEvent: function (d) {
            var e = [],
                h = l.getRelativePosition(d);
            l.each(
                this.segments,
                function (d) {
                    d.inRange(h.x, h.y) && e.push(d);
                },
                this
            );
            return e;
        },
        addData: function (d, e, h) {
            e = void 0 !== e ? e : this.segments.length;
            "undefined" === typeof d.color &&
                ((d.color = p.defaults.global.segmentColorDefault[e % p.defaults.global.segmentColorDefault.length]),
                (d.highlight = p.defaults.global.segmentHighlightColorDefaults[e % p.defaults.global.segmentHighlightColorDefaults.length]));
            this.segments.splice(
                e,
                0,
                new this.SegmentArc({
                    value: d.value,
                    outerRadius: this.options.animateScale ? 0 : this.outerRadius,
                    innerRadius: this.options.animateScale ? 0 : (this.outerRadius / 100) * this.options.percentageInnerCutout,
                    fillColor: d.color,
                    highlightColor: d.highlight || d.color,
                    showStroke: this.options.segmentShowStroke,
                    strokeWidth: this.options.segmentStrokeWidth,
                    strokeColor: this.options.segmentStrokeColor,
                    startAngle: 1.5 * Math.PI,
                    circumference: this.options.animateRotate ? 0 : this.calculateCircumference(d.value),
                    label: d.label,
                })
            );
            h || (this.reflow(), this.update());
        },
        calculateCircumference: function (d) {
            return 0 < this.total ? (d / this.total) * Math.PI * 2 : 0;
        },
        calculateTotal: function (d) {
            this.total = 0;
            l.each(
                d,
                function (d) {
                    this.total += Math.abs(d.value);
                },
                this
            );
        },
        update: function () {
            this.calculateTotal(this.segments);
            l.each(this.activeElements, function (d) {
                d.restore(["fillColor"]);
            });
            l.each(this.segments, function (d) {
                d.save();
            });
            this.render();
        },
        removeData: function (d) {
            d = l.isNumber(d) ? d : this.segments.length - 1;
            this.segments.splice(d, 1);
            this.reflow();
            this.update();
        },
        reflow: function () {
            l.extend(this.SegmentArc.prototype, { x: this.chart.width / 2, y: this.chart.height / 2 });
            this.outerRadius = (l.min([this.chart.width, this.chart.height]) - this.options.segmentStrokeWidth / 2) / 2;
            l.each(
                this.segments,
                function (d) {
                    d.update({ outerRadius: this.outerRadius, innerRadius: (this.outerRadius / 100) * this.options.percentageInnerCutout });
                },
                this
            );
        },
        draw: function (d) {
            var e = d ? d : 1;
            this.clear();
            l.each(
                this.segments,
                function (d, l) {
                    d.transition({ circumference: this.calculateCircumference(d.value), outerRadius: this.outerRadius, innerRadius: (this.outerRadius / 100) * this.options.percentageInnerCutout }, e);
                    d.endAngle = d.startAngle + d.circumference;
                    d.draw();
                    0 === l && (d.startAngle = 1.5 * Math.PI);
                    l < this.segments.length - 1 && (this.segments[l + 1].startAngle = d.endAngle);
                },
                this
            );
        },
    });
    p.types.Doughnut.extend({ name: "Pie", defaults: l.merge(e, { percentageInnerCutout: 0 }) });
}.call(this));
