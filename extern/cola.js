(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.cola = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./src/adaptor"));
__export(require("./src/d3adaptor"));
__export(require("./src/descent"));
__export(require("./src/geom"));
__export(require("./src/gridrouter"));
__export(require("./src/handledisconnected"));
__export(require("./src/layout"));
__export(require("./src/layout3d"));
__export(require("./src/linklengths"));
__export(require("./src/powergraph"));
__export(require("./src/pqueue"));
__export(require("./src/rbtree"));
__export(require("./src/rectangle"));
__export(require("./src/shortestpaths"));
__export(require("./src/vpsc"));
__export(require("./src/batch"));

},{"./src/adaptor":2,"./src/batch":3,"./src/d3adaptor":4,"./src/descent":7,"./src/geom":8,"./src/gridrouter":9,"./src/handledisconnected":10,"./src/layout":11,"./src/layout3d":12,"./src/linklengths":13,"./src/powergraph":14,"./src/pqueue":15,"./src/rbtree":16,"./src/rectangle":17,"./src/shortestpaths":18,"./src/vpsc":19}],2:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var layout_1 = require("./layout");
var LayoutAdaptor = (function (_super) {
    __extends(LayoutAdaptor, _super);
    function LayoutAdaptor(options) {
        var _this = _super.call(this) || this;
        var self = _this;
        var o = options;
        if (o.trigger) {
            _this.trigger = o.trigger;
        }
        if (o.kick) {
            _this.kick = o.kick;
        }
        if (o.drag) {
            _this.drag = o.drag;
        }
        if (o.on) {
            _this.on = o.on;
        }
        _this.dragstart = _this.dragStart = layout_1.Layout.dragStart;
        _this.dragend = _this.dragEnd = layout_1.Layout.dragEnd;
        return _this;
    }
    LayoutAdaptor.prototype.trigger = function (e) { };
    ;
    LayoutAdaptor.prototype.kick = function () { };
    ;
    LayoutAdaptor.prototype.drag = function () { };
    ;
    LayoutAdaptor.prototype.on = function (eventType, listener) { return this; };
    ;
    return LayoutAdaptor;
}(layout_1.Layout));
exports.LayoutAdaptor = LayoutAdaptor;
function adaptor(options) {
    return new LayoutAdaptor(options);
}
exports.adaptor = adaptor;

},{"./layout":11}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var layout_1 = require("./layout");
var gridrouter_1 = require("./gridrouter");
function gridify(pgLayout, nudgeGap, margin, groupMargin) {
    pgLayout.cola.start(0, 0, 0, 10, false);
    var gridrouter = route(pgLayout.cola.nodes(), pgLayout.cola.groups(), margin, groupMargin);
    return gridrouter.routeEdges(pgLayout.powerGraph.powerEdges, nudgeGap, function (e) { return e.source.routerNode.id; }, function (e) { return e.target.routerNode.id; });
}
exports.gridify = gridify;
function route(nodes, groups, margin, groupMargin) {
    nodes.forEach(function (d) {
        d.routerNode = {
            name: d.name,
            bounds: d.bounds.inflate(-margin)
        };
    });
    groups.forEach(function (d) {
        d.routerNode = {
            bounds: d.bounds.inflate(-groupMargin),
            children: (typeof d.groups !== 'undefined' ? d.groups.map(function (c) { return nodes.length + c.id; }) : [])
                .concat(typeof d.leaves !== 'undefined' ? d.leaves.map(function (c) { return c.index; }) : [])
        };
    });
    var gridRouterNodes = nodes.concat(groups).map(function (d, i) {
        d.routerNode.id = i;
        return d.routerNode;
    });
    return new gridrouter_1.GridRouter(gridRouterNodes, {
        getChildren: function (v) { return v.children; },
        getBounds: function (v) { return v.bounds; }
    }, margin - groupMargin);
}
function powerGraphGridLayout(graph, size, grouppadding) {
    var powerGraph;
    graph.nodes.forEach(function (v, i) { return v.index = i; });
    new layout_1.Layout()
        .avoidOverlaps(false)
        .nodes(graph.nodes)
        .links(graph.links)
        .powerGraphGroups(function (d) {
        powerGraph = d;
        powerGraph.groups.forEach(function (v) { return v.padding = grouppadding; });
    });
    var n = graph.nodes.length;
    var edges = [];
    var vs = graph.nodes.slice(0);
    vs.forEach(function (v, i) { return v.index = i; });
    powerGraph.groups.forEach(function (g) {
        var sourceInd = g.index = g.id + n;
        vs.push(g);
        if (typeof g.leaves !== 'undefined')
            g.leaves.forEach(function (v) { return edges.push({ source: sourceInd, target: v.index }); });
        if (typeof g.groups !== 'undefined')
            g.groups.forEach(function (gg) { return edges.push({ source: sourceInd, target: gg.id + n }); });
    });
    powerGraph.powerEdges.forEach(function (e) {
        edges.push({ source: e.source.index, target: e.target.index });
    });
    new layout_1.Layout()
        .size(size)
        .nodes(vs)
        .links(edges)
        .avoidOverlaps(false)
        .linkDistance(30)
        .symmetricDiffLinkLengths(5)
        .convergenceThreshold(1e-4)
        .start(100, 0, 0, 0, false);
    return {
        cola: new layout_1.Layout()
            .convergenceThreshold(1e-3)
            .size(size)
            .avoidOverlaps(true)
            .nodes(graph.nodes)
            .links(graph.links)
            .groupCompactness(1e-4)
            .linkDistance(30)
            .symmetricDiffLinkLengths(5)
            .powerGraphGroups(function (d) {
            powerGraph = d;
            powerGraph.groups.forEach(function (v) {
                v.padding = grouppadding;
            });
        }).start(50, 0, 100, 0, false),
        powerGraph: powerGraph
    };
}
exports.powerGraphGridLayout = powerGraphGridLayout;

},{"./gridrouter":9,"./layout":11}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var d3v3 = require("./d3v3adaptor");
var d3v4 = require("./d3v4adaptor");
;
function d3adaptor(d3Context) {
    if (!d3Context || isD3V3(d3Context)) {
        return new d3v3.D3StyleLayoutAdaptor();
    }
    return new d3v4.D3StyleLayoutAdaptor(d3Context);
}
exports.d3adaptor = d3adaptor;
function isD3V3(d3Context) {
    var v3exp = /^3\./;
    return d3Context.version && d3Context.version.match(v3exp) !== null;
}

},{"./d3v3adaptor":5,"./d3v4adaptor":6}],5:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var layout_1 = require("./layout");
var D3StyleLayoutAdaptor = (function (_super) {
    __extends(D3StyleLayoutAdaptor, _super);
    function D3StyleLayoutAdaptor() {
        var _this = _super.call(this) || this;
        _this.event = d3.dispatch(layout_1.EventType[layout_1.EventType.start], layout_1.EventType[layout_1.EventType.tick], layout_1.EventType[layout_1.EventType.end]);
        var d3layout = _this;
        var drag;
        _this.drag = function () {
            if (!drag) {
                var drag = d3.behavior.drag()
                    .origin(layout_1.Layout.dragOrigin)
                    .on("dragstart.d3adaptor", layout_1.Layout.dragStart)
                    .on("drag.d3adaptor", function (d) {
                    layout_1.Layout.drag(d, d3.event);
                    d3layout.resume();
                })
                    .on("dragend.d3adaptor", layout_1.Layout.dragEnd);
            }
            if (!arguments.length)
                return drag;
            this
                .call(drag);
        };
        return _this;
    }
    D3StyleLayoutAdaptor.prototype.trigger = function (e) {
        var d3event = { type: layout_1.EventType[e.type], alpha: e.alpha, stress: e.stress };
        this.event[d3event.type](d3event);
    };
    D3StyleLayoutAdaptor.prototype.kick = function () {
        var _this = this;
        d3.timer(function () { return _super.prototype.tick.call(_this); });
    };
    D3StyleLayoutAdaptor.prototype.on = function (eventType, listener) {
        if (typeof eventType === 'string') {
            this.event.on(eventType, listener);
        }
        else {
            this.event.on(layout_1.EventType[eventType], listener);
        }
        return this;
    };
    return D3StyleLayoutAdaptor;
}(layout_1.Layout));
exports.D3StyleLayoutAdaptor = D3StyleLayoutAdaptor;
function d3adaptor() {
    return new D3StyleLayoutAdaptor();
}
exports.d3adaptor = d3adaptor;

},{"./layout":11}],6:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var layout_1 = require("./layout");
var D3StyleLayoutAdaptor = (function (_super) {
    __extends(D3StyleLayoutAdaptor, _super);
    function D3StyleLayoutAdaptor(d3Context) {
        var _this = _super.call(this) || this;
        _this.d3Context = d3Context;
        _this.event = d3Context.dispatch(layout_1.EventType[layout_1.EventType.start], layout_1.EventType[layout_1.EventType.tick], layout_1.EventType[layout_1.EventType.end]);
        var d3layout = _this;
        var drag;
        _this.drag = function () {
            if (!drag) {
                var drag = d3Context.drag()
                    .subject(layout_1.Layout.dragOrigin)
                    .on("start.d3adaptor", layout_1.Layout.dragStart)
                    .on("drag.d3adaptor", function (d) {
                    layout_1.Layout.drag(d, d3Context.event);
                    d3layout.resume();
                })
                    .on("end.d3adaptor", layout_1.Layout.dragEnd);
            }
            if (!arguments.length)
                return drag;
            arguments[0].call(drag);
        };
        return _this;
    }
    D3StyleLayoutAdaptor.prototype.trigger = function (e) {
        var d3event = { type: layout_1.EventType[e.type], alpha: e.alpha, stress: e.stress };
        this.event.call(d3event.type, d3event);
    };
    D3StyleLayoutAdaptor.prototype.kick = function () {
        var _this = this;
        var t = this.d3Context.timer(function () { return _super.prototype.tick.call(_this) && t.stop(); });
    };
    D3StyleLayoutAdaptor.prototype.on = function (eventType, listener) {
        if (typeof eventType === 'string') {
            this.event.on(eventType, listener);
        }
        else {
            this.event.on(layout_1.EventType[eventType], listener);
        }
        return this;
    };
    return D3StyleLayoutAdaptor;
}(layout_1.Layout));
exports.D3StyleLayoutAdaptor = D3StyleLayoutAdaptor;

},{"./layout":11}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Locks = (function () {
    function Locks() {
        this.locks = {};
    }
    Locks.prototype.add = function (id, x) {
        this.locks[id] = x;
    };
    Locks.prototype.clear = function () {
        this.locks = {};
    };
    Locks.prototype.isEmpty = function () {
        for (var l in this.locks)
            return false;
        return true;
    };
    Locks.prototype.apply = function (f) {
        for (var l in this.locks) {
            f(Number(l), this.locks[l]);
        }
    };
    return Locks;
}());
exports.Locks = Locks;
var Descent = (function () {
    function Descent(x, D, G) {
        if (G === void 0) { G = null; }
        this.D = D;
        this.G = G;
        this.threshold = 0.0001;
        this.numGridSnapNodes = 0;
        this.snapGridSize = 100;
        this.snapStrength = 1000;
        this.scaleSnapByMaxH = false;
        this.random = new PseudoRandom();
        this.project = null;
        this.x = x;
        this.k = x.length;
        var n = this.n = x[0].length;
        this.H = new Array(this.k);
        this.g = new Array(this.k);
        this.Hd = new Array(this.k);
        this.a = new Array(this.k);
        this.b = new Array(this.k);
        this.c = new Array(this.k);
        this.d = new Array(this.k);
        this.e = new Array(this.k);
        this.ia = new Array(this.k);
        this.ib = new Array(this.k);
        this.xtmp = new Array(this.k);
        this.locks = new Locks();
        this.minD = Number.MAX_VALUE;
        var i = n, j;
        while (i--) {
            j = n;
            while (--j > i) {
                var d = D[i][j];
                if (d > 0 && d < this.minD) {
                    this.minD = d;
                }
            }
        }
        if (this.minD === Number.MAX_VALUE)
            this.minD = 1;
        i = this.k;
        while (i--) {
            this.g[i] = new Array(n);
            this.H[i] = new Array(n);
            j = n;
            while (j--) {
                this.H[i][j] = new Array(n);
            }
            this.Hd[i] = new Array(n);
            this.a[i] = new Array(n);
            this.b[i] = new Array(n);
            this.c[i] = new Array(n);
            this.d[i] = new Array(n);
            this.e[i] = new Array(n);
            this.ia[i] = new Array(n);
            this.ib[i] = new Array(n);
            this.xtmp[i] = new Array(n);
        }
    }
    Descent.createSquareMatrix = function (n, f) {
        var M = new Array(n);
        for (var i = 0; i < n; ++i) {
            M[i] = new Array(n);
            for (var j = 0; j < n; ++j) {
                M[i][j] = f(i, j);
            }
        }
        return M;
    };
    Descent.prototype.offsetDir = function () {
        var _this = this;
        var u = new Array(this.k);
        var l = 0;
        for (var i = 0; i < this.k; ++i) {
            var x = u[i] = this.random.getNextBetween(0.01, 1) - 0.5;
            l += x * x;
        }
        l = Math.sqrt(l);
        return u.map(function (x) { return x *= _this.minD / l; });
    };
    Descent.prototype.computeDerivatives = function (x) {
        var _this = this;
        var n = this.n;
        if (n < 1)
            return;
        var i;
        var d = new Array(this.k);
        var d2 = new Array(this.k);
        var Huu = new Array(this.k);
        var maxH = 0;
        for (var u_1 = 0; u_1 < n; ++u_1) {
            for (i = 0; i < this.k; ++i)
                Huu[i] = this.g[i][u_1] = 0;
            for (var v = 0; v < n; ++v) {
                if (u_1 === v)
                    continue;
                var maxDisplaces = n;
                var distanceSquared = 0;
                while (maxDisplaces--) {
                    distanceSquared = 0;
                    for (i = 0; i < this.k; ++i) {
                        var dx_1 = d[i] = x[i][u_1] - x[i][v];
                        distanceSquared += d2[i] = dx_1 * dx_1;
                    }
                    if (distanceSquared > 1e-9)
                        break;
                    var rd = this.offsetDir();
                    for (i = 0; i < this.k; ++i)
                        x[i][v] += rd[i];
                }
                var distance = Math.sqrt(distanceSquared);
                var idealDistance = this.D[u_1][v];
                var weight = this.G != null ? this.G[u_1][v] : 1;
                if (weight > 1 && distance > idealDistance || !isFinite(idealDistance)) {
                    for (i = 0; i < this.k; ++i)
                        this.H[i][u_1][v] = 0;
                    continue;
                }
                if (weight > 1) {
                    weight = 1;
                }
                var idealDistSquared = idealDistance * idealDistance, gs = 2 * weight * (distance - idealDistance) / (idealDistSquared * distance), distanceCubed = distanceSquared * distance, hs = 2 * -weight / (idealDistSquared * distanceCubed);
                if (!isFinite(gs))
                    console.log(gs);
                for (i = 0; i < this.k; ++i) {
                    this.g[i][u_1] += d[i] * gs;
                    Huu[i] -= this.H[i][u_1][v] = hs * (2 * distanceCubed + idealDistance * (d2[i] - distanceSquared));
                }
            }
            for (i = 0; i < this.k; ++i)
                maxH = Math.max(maxH, this.H[i][u_1][u_1] = Huu[i]);
        }
        var r = this.snapGridSize / 2;
        var g = this.snapGridSize;
        var w = this.snapStrength;
        var k = w / (r * r);
        var numNodes = this.numGridSnapNodes;
        for (var u = 0; u < numNodes; ++u) {
            for (i = 0; i < this.k; ++i) {
                var xiu = this.x[i][u];
                var m = xiu / g;
                var f = m % 1;
                var q = m - f;
                var a = Math.abs(f);
                var dx = (a <= 0.5) ? xiu - q * g :
                    (xiu > 0) ? xiu - (q + 1) * g : xiu - (q - 1) * g;
                if (-r < dx && dx <= r) {
                    if (this.scaleSnapByMaxH) {
                        this.g[i][u] += maxH * k * dx;
                        this.H[i][u][u] += maxH * k;
                    }
                    else {
                        this.g[i][u] += k * dx;
                        this.H[i][u][u] += k;
                    }
                }
            }
        }
        if (!this.locks.isEmpty()) {
            this.locks.apply(function (u, p) {
                for (i = 0; i < _this.k; ++i) {
                    _this.H[i][u][u] += maxH;
                    _this.g[i][u] -= maxH * (p[i] - x[i][u]);
                }
            });
        }
    };
    Descent.dotProd = function (a, b) {
        var x = 0, i = a.length;
        while (i--)
            x += a[i] * b[i];
        return x;
    };
    Descent.rightMultiply = function (m, v, r) {
        var i = m.length;
        while (i--)
            r[i] = Descent.dotProd(m[i], v);
    };
    Descent.prototype.computeStepSize = function (d) {
        var numerator = 0, denominator = 0;
        for (var i = 0; i < this.k; ++i) {
            numerator += Descent.dotProd(this.g[i], d[i]);
            Descent.rightMultiply(this.H[i], d[i], this.Hd[i]);
            denominator += Descent.dotProd(d[i], this.Hd[i]);
        }
        if (denominator === 0 || !isFinite(denominator))
            return 0;
        return 1 * numerator / denominator;
    };
    Descent.prototype.reduceStress = function () {
        this.computeDerivatives(this.x);
        var alpha = this.computeStepSize(this.g);
        for (var i = 0; i < this.k; ++i) {
            this.takeDescentStep(this.x[i], this.g[i], alpha);
        }
        return this.computeStress();
    };
    Descent.copy = function (a, b) {
        var m = a.length, n = b[0].length;
        for (var i = 0; i < m; ++i) {
            for (var j = 0; j < n; ++j) {
                b[i][j] = a[i][j];
            }
        }
    };
    Descent.prototype.stepAndProject = function (x0, r, d, stepSize) {
        Descent.copy(x0, r);
        this.takeDescentStep(r[0], d[0], stepSize);
        if (this.project)
            this.project[0](x0[0], x0[1], r[0]);
        this.takeDescentStep(r[1], d[1], stepSize);
        if (this.project)
            this.project[1](r[0], x0[1], r[1]);
        for (var i = 2; i < this.k; i++)
            this.takeDescentStep(r[i], d[i], stepSize);
    };
    Descent.mApply = function (m, n, f) {
        var i = m;
        while (i-- > 0) {
            var j = n;
            while (j-- > 0)
                f(i, j);
        }
    };
    Descent.prototype.matrixApply = function (f) {
        Descent.mApply(this.k, this.n, f);
    };
    Descent.prototype.computeNextPosition = function (x0, r) {
        var _this = this;
        this.computeDerivatives(x0);
        var alpha = this.computeStepSize(this.g);
        this.stepAndProject(x0, r, this.g, alpha);
        if (this.project) {
            this.matrixApply(function (i, j) { return _this.e[i][j] = x0[i][j] - r[i][j]; });
            var beta = this.computeStepSize(this.e);
            beta = Math.max(0.2, Math.min(beta, 1));
            this.stepAndProject(x0, r, this.e, beta);
        }
    };
    Descent.prototype.run = function (iterations) {
        var stress = Number.MAX_VALUE, converged = false;
        while (!converged && iterations-- > 0) {
            var s = this.rungeKutta();
            converged = Math.abs(stress / s - 1) < this.threshold;
            stress = s;
        }
        return stress;
    };
    Descent.prototype.rungeKutta = function () {
        var _this = this;
        this.computeNextPosition(this.x, this.a);
        Descent.mid(this.x, this.a, this.ia);
        this.computeNextPosition(this.ia, this.b);
        Descent.mid(this.x, this.b, this.ib);
        this.computeNextPosition(this.ib, this.c);
        this.computeNextPosition(this.c, this.d);
        var disp = 0;
        this.matrixApply(function (i, j) {
            var x = (_this.a[i][j] + 2.0 * _this.b[i][j] + 2.0 * _this.c[i][j] + _this.d[i][j]) / 6.0, d = _this.x[i][j] - x;
            disp += d * d;
            _this.x[i][j] = x;
        });
        return disp;
    };
    Descent.mid = function (a, b, m) {
        Descent.mApply(a.length, a[0].length, function (i, j) {
            return m[i][j] = a[i][j] + (b[i][j] - a[i][j]) / 2.0;
        });
    };
    Descent.prototype.takeDescentStep = function (x, d, stepSize) {
        for (var i = 0; i < this.n; ++i) {
            x[i] = x[i] - stepSize * d[i];
        }
    };
    Descent.prototype.computeStress = function () {
        var stress = 0;
        for (var u = 0, nMinus1 = this.n - 1; u < nMinus1; ++u) {
            for (var v = u + 1, n = this.n; v < n; ++v) {
                var l = 0;
                for (var i = 0; i < this.k; ++i) {
                    var dx = this.x[i][u] - this.x[i][v];
                    l += dx * dx;
                }
                l = Math.sqrt(l);
                var d = this.D[u][v];
                if (!isFinite(d))
                    continue;
                var rl = d - l;
                var d2 = d * d;
                stress += rl * rl / d2;
            }
        }
        return stress;
    };
    Descent.zeroDistance = 1e-10;
    return Descent;
}());
exports.Descent = Descent;
var PseudoRandom = (function () {
    function PseudoRandom(seed) {
        if (seed === void 0) { seed = 1; }
        this.seed = seed;
        this.a = 214013;
        this.c = 2531011;
        this.m = 2147483648;
        this.range = 32767;
    }
    PseudoRandom.prototype.getNext = function () {
        this.seed = (this.seed * this.a + this.c) % this.m;
        return (this.seed >> 16) / this.range;
    };
    PseudoRandom.prototype.getNextBetween = function (min, max) {
        return min + this.getNext() * (max - min);
    };
    return PseudoRandom;
}());
exports.PseudoRandom = PseudoRandom;

},{}],8:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var rectangle_1 = require("./rectangle");
var Point = (function () {
    function Point() {
    }
    return Point;
}());
exports.Point = Point;
var LineSegment = (function () {
    function LineSegment(x1, y1, x2, y2) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    }
    return LineSegment;
}());
exports.LineSegment = LineSegment;
var PolyPoint = (function (_super) {
    __extends(PolyPoint, _super);
    function PolyPoint() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return PolyPoint;
}(Point));
exports.PolyPoint = PolyPoint;
function isLeft(P0, P1, P2) {
    return (P1.x - P0.x) * (P2.y - P0.y) - (P2.x - P0.x) * (P1.y - P0.y);
}
exports.isLeft = isLeft;
function above(p, vi, vj) {
    return isLeft(p, vi, vj) > 0;
}
function below(p, vi, vj) {
    return isLeft(p, vi, vj) < 0;
}
function ConvexHull(S) {
    var P = S.slice(0).sort(function (a, b) { return a.x !== b.x ? b.x - a.x : b.y - a.y; });
    var n = S.length, i;
    var minmin = 0;
    var xmin = P[0].x;
    for (i = 1; i < n; ++i) {
        if (P[i].x !== xmin)
            break;
    }
    var minmax = i - 1;
    var H = [];
    H.push(P[minmin]);
    if (minmax === n - 1) {
        if (P[minmax].y !== P[minmin].y)
            H.push(P[minmax]);
    }
    else {
        var maxmin, maxmax = n - 1;
        var xmax = P[n - 1].x;
        for (i = n - 2; i >= 0; i--)
            if (P[i].x !== xmax)
                break;
        maxmin = i + 1;
        i = minmax;
        while (++i <= maxmin) {
            if (isLeft(P[minmin], P[maxmin], P[i]) >= 0 && i < maxmin)
                continue;
            while (H.length > 1) {
                if (isLeft(H[H.length - 2], H[H.length - 1], P[i]) > 0)
                    break;
                else
                    H.length -= 1;
            }
            if (i != minmin)
                H.push(P[i]);
        }
        if (maxmax != maxmin)
            H.push(P[maxmax]);
        var bot = H.length;
        i = maxmin;
        while (--i >= minmax) {
            if (isLeft(P[maxmax], P[minmax], P[i]) >= 0 && i > minmax)
                continue;
            while (H.length > bot) {
                if (isLeft(H[H.length - 2], H[H.length - 1], P[i]) > 0)
                    break;
                else
                    H.length -= 1;
            }
            if (i != minmin)
                H.push(P[i]);
        }
    }
    return H;
}
exports.ConvexHull = ConvexHull;
function clockwiseRadialSweep(p, P, f) {
    P.slice(0).sort(function (a, b) { return Math.atan2(a.y - p.y, a.x - p.x) - Math.atan2(b.y - p.y, b.x - p.x); }).forEach(f);
}
exports.clockwiseRadialSweep = clockwiseRadialSweep;
function nextPolyPoint(p, ps) {
    if (p.polyIndex === ps.length - 1)
        return ps[0];
    return ps[p.polyIndex + 1];
}
function prevPolyPoint(p, ps) {
    if (p.polyIndex === 0)
        return ps[ps.length - 1];
    return ps[p.polyIndex - 1];
}
function tangent_PointPolyC(P, V) {
    var Vclosed = V.slice(0);
    Vclosed.push(V[0]);
    return { rtan: Rtangent_PointPolyC(P, Vclosed), ltan: Ltangent_PointPolyC(P, Vclosed) };
}
function Rtangent_PointPolyC(P, V) {
    var n = V.length - 1;
    var a, b, c;
    var upA, dnC;
    if (below(P, V[1], V[0]) && !above(P, V[n - 1], V[0]))
        return 0;
    for (a = 0, b = n;;) {
        if (b - a === 1)
            if (above(P, V[a], V[b]))
                return a;
            else
                return b;
        c = Math.floor((a + b) / 2);
        dnC = below(P, V[c + 1], V[c]);
        if (dnC && !above(P, V[c - 1], V[c]))
            return c;
        upA = above(P, V[a + 1], V[a]);
        if (upA) {
            if (dnC)
                b = c;
            else {
                if (above(P, V[a], V[c]))
                    b = c;
                else
                    a = c;
            }
        }
        else {
            if (!dnC)
                a = c;
            else {
                if (below(P, V[a], V[c]))
                    b = c;
                else
                    a = c;
            }
        }
    }
}
function Ltangent_PointPolyC(P, V) {
    var n = V.length - 1;
    var a, b, c;
    var dnA, dnC;
    if (above(P, V[n - 1], V[0]) && !below(P, V[1], V[0]))
        return 0;
    for (a = 0, b = n;;) {
        if (b - a === 1)
            if (below(P, V[a], V[b]))
                return a;
            else
                return b;
        c = Math.floor((a + b) / 2);
        dnC = below(P, V[c + 1], V[c]);
        if (above(P, V[c - 1], V[c]) && !dnC)
            return c;
        dnA = below(P, V[a + 1], V[a]);
        if (dnA) {
            if (!dnC)
                b = c;
            else {
                if (below(P, V[a], V[c]))
                    b = c;
                else
                    a = c;
            }
        }
        else {
            if (dnC)
                a = c;
            else {
                if (above(P, V[a], V[c]))
                    b = c;
                else
                    a = c;
            }
        }
    }
}
function tangent_PolyPolyC(V, W, t1, t2, cmp1, cmp2) {
    var ix1, ix2;
    ix1 = t1(W[0], V);
    ix2 = t2(V[ix1], W);
    var done = false;
    while (!done) {
        done = true;
        while (true) {
            if (ix1 === V.length - 1)
                ix1 = 0;
            if (cmp1(W[ix2], V[ix1], V[ix1 + 1]))
                break;
            ++ix1;
        }
        while (true) {
            if (ix2 === 0)
                ix2 = W.length - 1;
            if (cmp2(V[ix1], W[ix2], W[ix2 - 1]))
                break;
            --ix2;
            done = false;
        }
    }
    return { t1: ix1, t2: ix2 };
}
exports.tangent_PolyPolyC = tangent_PolyPolyC;
function LRtangent_PolyPolyC(V, W) {
    var rl = RLtangent_PolyPolyC(W, V);
    return { t1: rl.t2, t2: rl.t1 };
}
exports.LRtangent_PolyPolyC = LRtangent_PolyPolyC;
function RLtangent_PolyPolyC(V, W) {
    return tangent_PolyPolyC(V, W, Rtangent_PointPolyC, Ltangent_PointPolyC, above, below);
}
exports.RLtangent_PolyPolyC = RLtangent_PolyPolyC;
function LLtangent_PolyPolyC(V, W) {
    return tangent_PolyPolyC(V, W, Ltangent_PointPolyC, Ltangent_PointPolyC, below, below);
}
exports.LLtangent_PolyPolyC = LLtangent_PolyPolyC;
function RRtangent_PolyPolyC(V, W) {
    return tangent_PolyPolyC(V, W, Rtangent_PointPolyC, Rtangent_PointPolyC, above, above);
}
exports.RRtangent_PolyPolyC = RRtangent_PolyPolyC;
var BiTangent = (function () {
    function BiTangent(t1, t2) {
        this.t1 = t1;
        this.t2 = t2;
    }
    return BiTangent;
}());
exports.BiTangent = BiTangent;
var BiTangents = (function () {
    function BiTangents() {
    }
    return BiTangents;
}());
exports.BiTangents = BiTangents;
var TVGPoint = (function (_super) {
    __extends(TVGPoint, _super);
    function TVGPoint() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return TVGPoint;
}(Point));
exports.TVGPoint = TVGPoint;
var VisibilityVertex = (function () {
    function VisibilityVertex(id, polyid, polyvertid, p) {
        this.id = id;
        this.polyid = polyid;
        this.polyvertid = polyvertid;
        this.p = p;
        p.vv = this;
    }
    return VisibilityVertex;
}());
exports.VisibilityVertex = VisibilityVertex;
var VisibilityEdge = (function () {
    function VisibilityEdge(source, target) {
        this.source = source;
        this.target = target;
    }
    VisibilityEdge.prototype.length = function () {
        var dx = this.source.p.x - this.target.p.x;
        var dy = this.source.p.y - this.target.p.y;
        return Math.sqrt(dx * dx + dy * dy);
    };
    return VisibilityEdge;
}());
exports.VisibilityEdge = VisibilityEdge;
var TangentVisibilityGraph = (function () {
    function TangentVisibilityGraph(P, g0) {
        this.P = P;
        this.V = [];
        this.E = [];
        if (!g0) {
            var n = P.length;
            for (var i = 0; i < n; i++) {
                var p = P[i];
                for (var j = 0; j < p.length; ++j) {
                    var pj = p[j], vv = new VisibilityVertex(this.V.length, i, j, pj);
                    this.V.push(vv);
                    if (j > 0)
                        this.E.push(new VisibilityEdge(p[j - 1].vv, vv));
                }
                if (p.length > 1)
                    this.E.push(new VisibilityEdge(p[0].vv, p[p.length - 1].vv));
            }
            for (var i = 0; i < n - 1; i++) {
                var Pi = P[i];
                for (var j = i + 1; j < n; j++) {
                    var Pj = P[j], t = tangents(Pi, Pj);
                    for (var q in t) {
                        var c = t[q], source = Pi[c.t1], target = Pj[c.t2];
                        this.addEdgeIfVisible(source, target, i, j);
                    }
                }
            }
        }
        else {
            this.V = g0.V.slice(0);
            this.E = g0.E.slice(0);
        }
    }
    TangentVisibilityGraph.prototype.addEdgeIfVisible = function (u, v, i1, i2) {
        if (!this.intersectsPolys(new LineSegment(u.x, u.y, v.x, v.y), i1, i2)) {
            this.E.push(new VisibilityEdge(u.vv, v.vv));
        }
    };
    TangentVisibilityGraph.prototype.addPoint = function (p, i1) {
        var n = this.P.length;
        this.V.push(new VisibilityVertex(this.V.length, n, 0, p));
        for (var i = 0; i < n; ++i) {
            if (i === i1)
                continue;
            var poly = this.P[i], t = tangent_PointPolyC(p, poly);
            this.addEdgeIfVisible(p, poly[t.ltan], i1, i);
            this.addEdgeIfVisible(p, poly[t.rtan], i1, i);
        }
        return p.vv;
    };
    TangentVisibilityGraph.prototype.intersectsPolys = function (l, i1, i2) {
        for (var i = 0, n = this.P.length; i < n; ++i) {
            if (i != i1 && i != i2 && intersects(l, this.P[i]).length > 0) {
                return true;
            }
        }
        return false;
    };
    return TangentVisibilityGraph;
}());
exports.TangentVisibilityGraph = TangentVisibilityGraph;
function intersects(l, P) {
    var ints = [];
    for (var i = 1, n = P.length; i < n; ++i) {
        var int = rectangle_1.Rectangle.lineIntersection(l.x1, l.y1, l.x2, l.y2, P[i - 1].x, P[i - 1].y, P[i].x, P[i].y);
        if (int)
            ints.push(int);
    }
    return ints;
}
function tangents(V, W) {
    var m = V.length - 1, n = W.length - 1;
    var bt = new BiTangents();
    for (var i = 0; i < m; ++i) {
        for (var j = 0; j < n; ++j) {
            var v1 = V[i == 0 ? m - 1 : i - 1];
            var v2 = V[i];
            var v3 = V[i + 1];
            var w1 = W[j == 0 ? n - 1 : j - 1];
            var w2 = W[j];
            var w3 = W[j + 1];
            var v1v2w2 = isLeft(v1, v2, w2);
            var v2w1w2 = isLeft(v2, w1, w2);
            var v2w2w3 = isLeft(v2, w2, w3);
            var w1w2v2 = isLeft(w1, w2, v2);
            var w2v1v2 = isLeft(w2, v1, v2);
            var w2v2v3 = isLeft(w2, v2, v3);
            if (v1v2w2 >= 0 && v2w1w2 >= 0 && v2w2w3 < 0
                && w1w2v2 >= 0 && w2v1v2 >= 0 && w2v2v3 < 0) {
                bt.ll = new BiTangent(i, j);
            }
            else if (v1v2w2 <= 0 && v2w1w2 <= 0 && v2w2w3 > 0
                && w1w2v2 <= 0 && w2v1v2 <= 0 && w2v2v3 > 0) {
                bt.rr = new BiTangent(i, j);
            }
            else if (v1v2w2 <= 0 && v2w1w2 > 0 && v2w2w3 <= 0
                && w1w2v2 >= 0 && w2v1v2 < 0 && w2v2v3 >= 0) {
                bt.rl = new BiTangent(i, j);
            }
            else if (v1v2w2 >= 0 && v2w1w2 < 0 && v2w2w3 >= 0
                && w1w2v2 <= 0 && w2v1v2 > 0 && w2v2v3 <= 0) {
                bt.lr = new BiTangent(i, j);
            }
        }
    }
    return bt;
}
exports.tangents = tangents;
function isPointInsidePoly(p, poly) {
    for (var i = 1, n = poly.length; i < n; ++i)
        if (below(poly[i - 1], poly[i], p))
            return false;
    return true;
}
function isAnyPInQ(p, q) {
    return !p.every(function (v) { return !isPointInsidePoly(v, q); });
}
function polysOverlap(p, q) {
    if (isAnyPInQ(p, q))
        return true;
    if (isAnyPInQ(q, p))
        return true;
    for (var i = 1, n = p.length; i < n; ++i) {
        var v = p[i], u = p[i - 1];
        if (intersects(new LineSegment(u.x, u.y, v.x, v.y), q).length > 0)
            return true;
    }
    return false;
}
exports.polysOverlap = polysOverlap;

},{"./rectangle":17}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rectangle_1 = require("./rectangle");
var vpsc_1 = require("./vpsc");
var shortestpaths_1 = require("./shortestpaths");
var NodeWrapper = (function () {
    function NodeWrapper(id, rect, children) {
        this.id = id;
        this.rect = rect;
        this.children = children;
        this.leaf = typeof children === 'undefined' || children.length === 0;
    }
    return NodeWrapper;
}());
exports.NodeWrapper = NodeWrapper;
var Vert = (function () {
    function Vert(id, x, y, node, line) {
        if (node === void 0) { node = null; }
        if (line === void 0) { line = null; }
        this.id = id;
        this.x = x;
        this.y = y;
        this.node = node;
        this.line = line;
    }
    return Vert;
}());
exports.Vert = Vert;
var LongestCommonSubsequence = (function () {
    function LongestCommonSubsequence(s, t) {
        this.s = s;
        this.t = t;
        var mf = LongestCommonSubsequence.findMatch(s, t);
        var tr = t.slice(0).reverse();
        var mr = LongestCommonSubsequence.findMatch(s, tr);
        if (mf.length >= mr.length) {
            this.length = mf.length;
            this.si = mf.si;
            this.ti = mf.ti;
            this.reversed = false;
        }
        else {
            this.length = mr.length;
            this.si = mr.si;
            this.ti = t.length - mr.ti - mr.length;
            this.reversed = true;
        }
    }
    LongestCommonSubsequence.findMatch = function (s, t) {
        var m = s.length;
        var n = t.length;
        var match = { length: 0, si: -1, ti: -1 };
        var l = new Array(m);
        for (var i = 0; i < m; i++) {
            l[i] = new Array(n);
            for (var j = 0; j < n; j++)
                if (s[i] === t[j]) {
                    var v = l[i][j] = (i === 0 || j === 0) ? 1 : l[i - 1][j - 1] + 1;
                    if (v > match.length) {
                        match.length = v;
                        match.si = i - v + 1;
                        match.ti = j - v + 1;
                    }
                    ;
                }
                else
                    l[i][j] = 0;
        }
        return match;
    };
    LongestCommonSubsequence.prototype.getSequence = function () {
        return this.length >= 0 ? this.s.slice(this.si, this.si + this.length) : [];
    };
    return LongestCommonSubsequence;
}());
exports.LongestCommonSubsequence = LongestCommonSubsequence;
var GridRouter = (function () {
    function GridRouter(originalnodes, accessor, groupPadding) {
        var _this = this;
        if (groupPadding === void 0) { groupPadding = 12; }
        this.originalnodes = originalnodes;
        this.groupPadding = groupPadding;
        this.leaves = null;
        this.nodes = originalnodes.map(function (v, i) { return new NodeWrapper(i, accessor.getBounds(v), accessor.getChildren(v)); });
        this.leaves = this.nodes.filter(function (v) { return v.leaf; });
        this.groups = this.nodes.filter(function (g) { return !g.leaf; });
        this.cols = this.getGridLines('x');
        this.rows = this.getGridLines('y');
        this.groups.forEach(function (v) {
            return v.children.forEach(function (c) { return _this.nodes[c].parent = v; });
        });
        this.root = { children: [] };
        this.nodes.forEach(function (v) {
            if (typeof v.parent === 'undefined') {
                v.parent = _this.root;
                _this.root.children.push(v.id);
            }
            v.ports = [];
        });
        this.backToFront = this.nodes.slice(0);
        this.backToFront.sort(function (x, y) { return _this.getDepth(x) - _this.getDepth(y); });
        var frontToBackGroups = this.backToFront.slice(0).reverse().filter(function (g) { return !g.leaf; });
        frontToBackGroups.forEach(function (v) {
            var r = rectangle_1.Rectangle.empty();
            v.children.forEach(function (c) { return r = r.union(_this.nodes[c].rect); });
            v.rect = r.inflate(_this.groupPadding);
        });
        var colMids = this.midPoints(this.cols.map(function (r) { return r.pos; }));
        var rowMids = this.midPoints(this.rows.map(function (r) { return r.pos; }));
        var rowx = colMids[0], rowX = colMids[colMids.length - 1];
        var coly = rowMids[0], colY = rowMids[rowMids.length - 1];
        var hlines = this.rows.map(function (r) { return ({ x1: rowx, x2: rowX, y1: r.pos, y2: r.pos }); })
            .concat(rowMids.map(function (m) { return ({ x1: rowx, x2: rowX, y1: m, y2: m }); }));
        var vlines = this.cols.map(function (c) { return ({ x1: c.pos, x2: c.pos, y1: coly, y2: colY }); })
            .concat(colMids.map(function (m) { return ({ x1: m, x2: m, y1: coly, y2: colY }); }));
        var lines = hlines.concat(vlines);
        lines.forEach(function (l) { return l.verts = []; });
        this.verts = [];
        this.edges = [];
        hlines.forEach(function (h) {
            return vlines.forEach(function (v) {
                var p = new Vert(_this.verts.length, v.x1, h.y1);
                h.verts.push(p);
                v.verts.push(p);
                _this.verts.push(p);
                var i = _this.backToFront.length;
                while (i-- > 0) {
                    var node = _this.backToFront[i], r = node.rect;
                    var dx = Math.abs(p.x - r.cx()), dy = Math.abs(p.y - r.cy());
                    if (dx < r.width() / 2 && dy < r.height() / 2) {
                        p.node = node;
                        break;
                    }
                }
            });
        });
        lines.forEach(function (l, li) {
            _this.nodes.forEach(function (v, i) {
                v.rect.lineIntersections(l.x1, l.y1, l.x2, l.y2).forEach(function (intersect, j) {
                    var p = new Vert(_this.verts.length, intersect.x, intersect.y, v, l);
                    _this.verts.push(p);
                    l.verts.push(p);
                    v.ports.push(p);
                });
            });
            var isHoriz = Math.abs(l.y1 - l.y2) < 0.1;
            var delta = function (a, b) { return isHoriz ? b.x - a.x : b.y - a.y; };
            l.verts.sort(delta);
            for (var i = 1; i < l.verts.length; i++) {
                var u = l.verts[i - 1], v = l.verts[i];
                if (u.node && u.node === v.node && u.node.leaf)
                    continue;
                _this.edges.push({ source: u.id, target: v.id, length: Math.abs(delta(u, v)) });
            }
        });
    }
    GridRouter.prototype.avg = function (a) { return a.reduce(function (x, y) { return x + y; }) / a.length; };
    GridRouter.prototype.getGridLines = function (axis) {
        var columns = [];
        var ls = this.leaves.slice(0, this.leaves.length);
        while (ls.length > 0) {
            var overlapping = ls.filter(function (v) { return v.rect['overlap' + axis.toUpperCase()](ls[0].rect); });
            var col = {
                nodes: overlapping,
                pos: this.avg(overlapping.map(function (v) { return v.rect['c' + axis](); }))
            };
            columns.push(col);
            col.nodes.forEach(function (v) { return ls.splice(ls.indexOf(v), 1); });
        }
        columns.sort(function (a, b) { return a.pos - b.pos; });
        return columns;
    };
    GridRouter.prototype.getDepth = function (v) {
        var depth = 0;
        while (v.parent !== this.root) {
            depth++;
            v = v.parent;
        }
        return depth;
    };
    GridRouter.prototype.midPoints = function (a) {
        var gap = a[1] - a[0];
        var mids = [a[0] - gap / 2];
        for (var i = 1; i < a.length; i++) {
            mids.push((a[i] + a[i - 1]) / 2);
        }
        mids.push(a[a.length - 1] + gap / 2);
        return mids;
    };
    GridRouter.prototype.findLineage = function (v) {
        var lineage = [v];
        do {
            v = v.parent;
            lineage.push(v);
        } while (v !== this.root);
        return lineage.reverse();
    };
    GridRouter.prototype.findAncestorPathBetween = function (a, b) {
        var aa = this.findLineage(a), ba = this.findLineage(b), i = 0;
        while (aa[i] === ba[i])
            i++;
        return { commonAncestor: aa[i - 1], lineages: aa.slice(i).concat(ba.slice(i)) };
    };
    GridRouter.prototype.siblingObstacles = function (a, b) {
        var _this = this;
        var path = this.findAncestorPathBetween(a, b);
        var lineageLookup = {};
        path.lineages.forEach(function (v) { return lineageLookup[v.id] = {}; });
        var obstacles = path.commonAncestor.children.filter(function (v) { return !(v in lineageLookup); });
        path.lineages
            .filter(function (v) { return v.parent !== path.commonAncestor; })
            .forEach(function (v) { return obstacles = obstacles.concat(v.parent.children.filter(function (c) { return c !== v.id; })); });
        return obstacles.map(function (v) { return _this.nodes[v]; });
    };
    GridRouter.getSegmentSets = function (routes, x, y) {
        var vsegments = [];
        for (var ei = 0; ei < routes.length; ei++) {
            var route = routes[ei];
            for (var si = 0; si < route.length; si++) {
                var s = route[si];
                s.edgeid = ei;
                s.i = si;
                var sdx = s[1][x] - s[0][x];
                if (Math.abs(sdx) < 0.1) {
                    vsegments.push(s);
                }
            }
        }
        vsegments.sort(function (a, b) { return a[0][x] - b[0][x]; });
        var vsegmentsets = [];
        var segmentset = null;
        for (var i = 0; i < vsegments.length; i++) {
            var s = vsegments[i];
            if (!segmentset || Math.abs(s[0][x] - segmentset.pos) > 0.1) {
                segmentset = { pos: s[0][x], segments: [] };
                vsegmentsets.push(segmentset);
            }
            segmentset.segments.push(s);
        }
        return vsegmentsets;
    };
    GridRouter.nudgeSegs = function (x, y, routes, segments, leftOf, gap) {
        var n = segments.length;
        if (n <= 1)
            return;
        var vs = segments.map(function (s) { return new vpsc_1.Variable(s[0][x]); });
        var cs = [];
        for (var i = 0; i < n; i++) {
            for (var j = 0; j < n; j++) {
                if (i === j)
                    continue;
                var s1 = segments[i], s2 = segments[j], e1 = s1.edgeid, e2 = s2.edgeid, lind = -1, rind = -1;
                if (x == 'x') {
                    if (leftOf(e1, e2)) {
                        if (s1[0][y] < s1[1][y]) {
                            lind = j, rind = i;
                        }
                        else {
                            lind = i, rind = j;
                        }
                    }
                }
                else {
                    if (leftOf(e1, e2)) {
                        if (s1[0][y] < s1[1][y]) {
                            lind = i, rind = j;
                        }
                        else {
                            lind = j, rind = i;
                        }
                    }
                }
                if (lind >= 0) {
                    cs.push(new vpsc_1.Constraint(vs[lind], vs[rind], gap));
                }
            }
        }
        var solver = new vpsc_1.Solver(vs, cs);
        solver.solve();
        vs.forEach(function (v, i) {
            var s = segments[i];
            var pos = v.position();
            s[0][x] = s[1][x] = pos;
            var route = routes[s.edgeid];
            if (s.i > 0)
                route[s.i - 1][1][x] = pos;
            if (s.i < route.length - 1)
                route[s.i + 1][0][x] = pos;
        });
    };
    GridRouter.nudgeSegments = function (routes, x, y, leftOf, gap) {
        var vsegmentsets = GridRouter.getSegmentSets(routes, x, y);
        for (var i = 0; i < vsegmentsets.length; i++) {
            var ss = vsegmentsets[i];
            var events = [];
            for (var j = 0; j < ss.segments.length; j++) {
                var s = ss.segments[j];
                events.push({ type: 0, s: s, pos: Math.min(s[0][y], s[1][y]) });
                events.push({ type: 1, s: s, pos: Math.max(s[0][y], s[1][y]) });
            }
            events.sort(function (a, b) { return a.pos - b.pos + a.type - b.type; });
            var open = [];
            var openCount = 0;
            events.forEach(function (e) {
                if (e.type === 0) {
                    open.push(e.s);
                    openCount++;
                }
                else {
                    openCount--;
                }
                if (openCount == 0) {
                    GridRouter.nudgeSegs(x, y, routes, open, leftOf, gap);
                    open = [];
                }
            });
        }
    };
    GridRouter.prototype.routeEdges = function (edges, nudgeGap, source, target) {
        var _this = this;
        var routePaths = edges.map(function (e) { return _this.route(source(e), target(e)); });
        var order = GridRouter.orderEdges(routePaths);
        var routes = routePaths.map(function (e) { return GridRouter.makeSegments(e); });
        GridRouter.nudgeSegments(routes, 'x', 'y', order, nudgeGap);
        GridRouter.nudgeSegments(routes, 'y', 'x', order, nudgeGap);
        GridRouter.unreverseEdges(routes, routePaths);
        return routes;
    };
    GridRouter.unreverseEdges = function (routes, routePaths) {
        routes.forEach(function (segments, i) {
            var path = routePaths[i];
            if (path.reversed) {
                segments.reverse();
                segments.forEach(function (segment) {
                    segment.reverse();
                });
            }
        });
    };
    GridRouter.angleBetween2Lines = function (line1, line2) {
        var angle1 = Math.atan2(line1[0].y - line1[1].y, line1[0].x - line1[1].x);
        var angle2 = Math.atan2(line2[0].y - line2[1].y, line2[0].x - line2[1].x);
        var diff = angle1 - angle2;
        if (diff > Math.PI || diff < -Math.PI) {
            diff = angle2 - angle1;
        }
        return diff;
    };
    GridRouter.isLeft = function (a, b, c) {
        return ((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) <= 0;
    };
    GridRouter.getOrder = function (pairs) {
        var outgoing = {};
        for (var i = 0; i < pairs.length; i++) {
            var p = pairs[i];
            if (typeof outgoing[p.l] === 'undefined')
                outgoing[p.l] = {};
            outgoing[p.l][p.r] = true;
        }
        return function (l, r) { return typeof outgoing[l] !== 'undefined' && outgoing[l][r]; };
    };
    GridRouter.orderEdges = function (edges) {
        var edgeOrder = [];
        for (var i = 0; i < edges.length - 1; i++) {
            for (var j = i + 1; j < edges.length; j++) {
                var e = edges[i], f = edges[j], lcs = new LongestCommonSubsequence(e, f);
                var u, vi, vj;
                if (lcs.length === 0)
                    continue;
                if (lcs.reversed) {
                    f.reverse();
                    f.reversed = true;
                    lcs = new LongestCommonSubsequence(e, f);
                }
                if ((lcs.si <= 0 || lcs.ti <= 0) &&
                    (lcs.si + lcs.length >= e.length || lcs.ti + lcs.length >= f.length)) {
                    edgeOrder.push({ l: i, r: j });
                    continue;
                }
                if (lcs.si + lcs.length >= e.length || lcs.ti + lcs.length >= f.length) {
                    u = e[lcs.si + 1];
                    vj = e[lcs.si - 1];
                    vi = f[lcs.ti - 1];
                }
                else {
                    u = e[lcs.si + lcs.length - 2];
                    vi = e[lcs.si + lcs.length];
                    vj = f[lcs.ti + lcs.length];
                }
                if (GridRouter.isLeft(u, vi, vj)) {
                    edgeOrder.push({ l: j, r: i });
                }
                else {
                    edgeOrder.push({ l: i, r: j });
                }
            }
        }
        return GridRouter.getOrder(edgeOrder);
    };
    GridRouter.makeSegments = function (path) {
        function copyPoint(p) {
            return { x: p.x, y: p.y };
        }
        var isStraight = function (a, b, c) { return Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) < 0.001; };
        var segments = [];
        var a = copyPoint(path[0]);
        for (var i = 1; i < path.length; i++) {
            var b = copyPoint(path[i]), c = i < path.length - 1 ? path[i + 1] : null;
            if (!c || !isStraight(a, b, c)) {
                segments.push([a, b]);
                a = b;
            }
        }
        return segments;
    };
    GridRouter.prototype.route = function (s, t) {
        var _this = this;
        var source = this.nodes[s], target = this.nodes[t];
        this.obstacles = this.siblingObstacles(source, target);
        var obstacleLookup = {};
        this.obstacles.forEach(function (o) { return obstacleLookup[o.id] = o; });
        this.passableEdges = this.edges.filter(function (e) {
            var u = _this.verts[e.source], v = _this.verts[e.target];
            return !(u.node && u.node.id in obstacleLookup
                || v.node && v.node.id in obstacleLookup);
        });
        for (var i = 1; i < source.ports.length; i++) {
            var u = source.ports[0].id;
            var v = source.ports[i].id;
            this.passableEdges.push({
                source: u,
                target: v,
                length: 0
            });
        }
        for (var i = 1; i < target.ports.length; i++) {
            var u = target.ports[0].id;
            var v = target.ports[i].id;
            this.passableEdges.push({
                source: u,
                target: v,
                length: 0
            });
        }
        var getSource = function (e) { return e.source; }, getTarget = function (e) { return e.target; }, getLength = function (e) { return e.length; };
        var shortestPathCalculator = new shortestpaths_1.Calculator(this.verts.length, this.passableEdges, getSource, getTarget, getLength);
        var bendPenalty = function (u, v, w) {
            var a = _this.verts[u], b = _this.verts[v], c = _this.verts[w];
            var dx = Math.abs(c.x - a.x), dy = Math.abs(c.y - a.y);
            if (a.node === source && a.node === b.node || b.node === target && b.node === c.node)
                return 0;
            return dx > 1 && dy > 1 ? 1000 : 0;
        };
        var shortestPath = shortestPathCalculator.PathFromNodeToNodeWithPrevCost(source.ports[0].id, target.ports[0].id, bendPenalty);
        var pathPoints = shortestPath.reverse().map(function (vi) { return _this.verts[vi]; });
        pathPoints.push(this.nodes[target.id].ports[0]);
        return pathPoints.filter(function (v, i) {
            return !(i < pathPoints.length - 1 && pathPoints[i + 1].node === source && v.node === source
                || i > 0 && v.node === target && pathPoints[i - 1].node === target);
        });
    };
    GridRouter.getRoutePath = function (route, cornerradius, arrowwidth, arrowheight) {
        var result = {
            routepath: 'M ' + route[0][0].x + ' ' + route[0][0].y + ' ',
            arrowpath: ''
        };
        if (route.length > 1) {
            for (var i = 0; i < route.length; i++) {
                var li = route[i];
                var x = li[1].x, y = li[1].y;
                var dx = x - li[0].x;
                var dy = y - li[0].y;
                if (i < route.length - 1) {
                    if (Math.abs(dx) > 0) {
                        x -= dx / Math.abs(dx) * cornerradius;
                    }
                    else {
                        y -= dy / Math.abs(dy) * cornerradius;
                    }
                    result.routepath += 'L ' + x + ' ' + y + ' ';
                    var l = route[i + 1];
                    var x0 = l[0].x, y0 = l[0].y;
                    var x1 = l[1].x;
                    var y1 = l[1].y;
                    dx = x1 - x0;
                    dy = y1 - y0;
                    var angle = GridRouter.angleBetween2Lines(li, l) < 0 ? 1 : 0;
                    var x2, y2;
                    if (Math.abs(dx) > 0) {
                        x2 = x0 + dx / Math.abs(dx) * cornerradius;
                        y2 = y0;
                    }
                    else {
                        x2 = x0;
                        y2 = y0 + dy / Math.abs(dy) * cornerradius;
                    }
                    var cx = Math.abs(x2 - x);
                    var cy = Math.abs(y2 - y);
                    result.routepath += 'A ' + cx + ' ' + cy + ' 0 0 ' + angle + ' ' + x2 + ' ' + y2 + ' ';
                }
                else {
                    var arrowtip = [x, y];
                    var arrowcorner1, arrowcorner2;
                    if (Math.abs(dx) > 0) {
                        x -= dx / Math.abs(dx) * arrowheight;
                        arrowcorner1 = [x, y + arrowwidth];
                        arrowcorner2 = [x, y - arrowwidth];
                    }
                    else {
                        y -= dy / Math.abs(dy) * arrowheight;
                        arrowcorner1 = [x + arrowwidth, y];
                        arrowcorner2 = [x - arrowwidth, y];
                    }
                    result.routepath += 'L ' + x + ' ' + y + ' ';
                    if (arrowheight > 0) {
                        result.arrowpath = 'M ' + arrowtip[0] + ' ' + arrowtip[1] + ' L ' + arrowcorner1[0] + ' ' + arrowcorner1[1]
                            + ' L ' + arrowcorner2[0] + ' ' + arrowcorner2[1];
                    }
                }
            }
        }
        else {
            var li = route[0];
            var x = li[1].x, y = li[1].y;
            var dx = x - li[0].x;
            var dy = y - li[0].y;
            var arrowtip = [x, y];
            var arrowcorner1, arrowcorner2;
            if (Math.abs(dx) > 0) {
                x -= dx / Math.abs(dx) * arrowheight;
                arrowcorner1 = [x, y + arrowwidth];
                arrowcorner2 = [x, y - arrowwidth];
            }
            else {
                y -= dy / Math.abs(dy) * arrowheight;
                arrowcorner1 = [x + arrowwidth, y];
                arrowcorner2 = [x - arrowwidth, y];
            }
            result.routepath += 'L ' + x + ' ' + y + ' ';
            if (arrowheight > 0) {
                result.arrowpath = 'M ' + arrowtip[0] + ' ' + arrowtip[1] + ' L ' + arrowcorner1[0] + ' ' + arrowcorner1[1]
                    + ' L ' + arrowcorner2[0] + ' ' + arrowcorner2[1];
            }
        }
        return result;
    };
    return GridRouter;
}());
exports.GridRouter = GridRouter;

},{"./rectangle":17,"./shortestpaths":18,"./vpsc":19}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var packingOptions = {
    PADDING: 10,
    GOLDEN_SECTION: (1 + Math.sqrt(5)) / 2,
    FLOAT_EPSILON: 0.0001,
    MAX_INERATIONS: 100
};
function applyPacking(graphs, w, h, node_size, desired_ratio, centerGraph) {
    if (desired_ratio === void 0) { desired_ratio = 1; }
    if (centerGraph === void 0) { centerGraph = true; }
    var init_x = 0, init_y = 0, svg_width = w, svg_height = h, desired_ratio = typeof desired_ratio !== 'undefined' ? desired_ratio : 1, node_size = typeof node_size !== 'undefined' ? node_size : 0, real_width = 0, real_height = 0, min_width = 0, global_bottom = 0, line = [];
    if (graphs.length == 0)
        return;
    calculate_bb(graphs);
    apply(graphs, desired_ratio);
    if (centerGraph) {
        put_nodes_to_right_positions(graphs);
    }
    function calculate_bb(graphs) {
        graphs.forEach(function (g) {
            calculate_single_bb(g);
        });
        function calculate_single_bb(graph) {
            var min_x = Number.MAX_VALUE, min_y = Number.MAX_VALUE, max_x = 0, max_y = 0;
            graph.array.forEach(function (v) {
                var w = typeof v.width !== 'undefined' ? v.width : node_size;
                var h = typeof v.height !== 'undefined' ? v.height : node_size;
                w /= 2;
                h /= 2;
                max_x = Math.max(v.x + w, max_x);
                min_x = Math.min(v.x - w, min_x);
                max_y = Math.max(v.y + h, max_y);
                min_y = Math.min(v.y - h, min_y);
            });
            graph.width = max_x - min_x;
            graph.height = max_y - min_y;
        }
    }
    function put_nodes_to_right_positions(graphs) {
        graphs.forEach(function (g) {
            var center = { x: 0, y: 0 };
            g.array.forEach(function (node) {
                center.x += node.x;
                center.y += node.y;
            });
            center.x /= g.array.length;
            center.y /= g.array.length;
            var corner = { x: center.x - g.width / 2, y: center.y - g.height / 2 };
            var offset = { x: g.x - corner.x + svg_width / 2 - real_width / 2, y: g.y - corner.y + svg_height / 2 - real_height / 2 };
            g.array.forEach(function (node) {
                node.x += offset.x;
                node.y += offset.y;
            });
        });
    }
    function apply(data, desired_ratio) {
        var curr_best_f = Number.POSITIVE_INFINITY;
        var curr_best = 0;
        data.sort(function (a, b) { return b.height - a.height; });
        min_width = data.reduce(function (a, b) {
            return a.width < b.width ? a.width : b.width;
        });
        var left = x1 = min_width;
        var right = x2 = get_entire_width(data);
        var iterationCounter = 0;
        var f_x1 = Number.MAX_VALUE;
        var f_x2 = Number.MAX_VALUE;
        var flag = -1;
        var dx = Number.MAX_VALUE;
        var df = Number.MAX_VALUE;
        while ((dx > min_width) || df > packingOptions.FLOAT_EPSILON) {
            if (flag != 1) {
                var x1 = right - (right - left) / packingOptions.GOLDEN_SECTION;
                var f_x1 = step(data, x1);
            }
            if (flag != 0) {
                var x2 = left + (right - left) / packingOptions.GOLDEN_SECTION;
                var f_x2 = step(data, x2);
            }
            dx = Math.abs(x1 - x2);
            df = Math.abs(f_x1 - f_x2);
            if (f_x1 < curr_best_f) {
                curr_best_f = f_x1;
                curr_best = x1;
            }
            if (f_x2 < curr_best_f) {
                curr_best_f = f_x2;
                curr_best = x2;
            }
            if (f_x1 > f_x2) {
                left = x1;
                x1 = x2;
                f_x1 = f_x2;
                flag = 1;
            }
            else {
                right = x2;
                x2 = x1;
                f_x2 = f_x1;
                flag = 0;
            }
            if (iterationCounter++ > 100) {
                break;
            }
        }
        step(data, curr_best);
    }
    function step(data, max_width) {
        line = [];
        real_width = 0;
        real_height = 0;
        global_bottom = init_y;
        for (var i = 0; i < data.length; i++) {
            var o = data[i];
            put_rect(o, max_width);
        }
        return Math.abs(get_real_ratio() - desired_ratio);
    }
    function put_rect(rect, max_width) {
        var parent = undefined;
        for (var i = 0; i < line.length; i++) {
            if ((line[i].space_left >= rect.height) && (line[i].x + line[i].width + rect.width + packingOptions.PADDING - max_width) <= packingOptions.FLOAT_EPSILON) {
                parent = line[i];
                break;
            }
        }
        line.push(rect);
        if (parent !== undefined) {
            rect.x = parent.x + parent.width + packingOptions.PADDING;
            rect.y = parent.bottom;
            rect.space_left = rect.height;
            rect.bottom = rect.y;
            parent.space_left -= rect.height + packingOptions.PADDING;
            parent.bottom += rect.height + packingOptions.PADDING;
        }
        else {
            rect.y = global_bottom;
            global_bottom += rect.height + packingOptions.PADDING;
            rect.x = init_x;
            rect.bottom = rect.y;
            rect.space_left = rect.height;
        }
        if (rect.y + rect.height - real_height > -packingOptions.FLOAT_EPSILON)
            real_height = rect.y + rect.height - init_y;
        if (rect.x + rect.width - real_width > -packingOptions.FLOAT_EPSILON)
            real_width = rect.x + rect.width - init_x;
    }
    ;
    function get_entire_width(data) {
        var width = 0;
        data.forEach(function (d) { return width += d.width + packingOptions.PADDING; });
        return width;
    }
    function get_real_ratio() {
        return (real_width / real_height);
    }
}
exports.applyPacking = applyPacking;
function separateGraphs(nodes, links) {
    var marks = {};
    var ways = {};
    var graphs = [];
    var clusters = 0;
    for (var i = 0; i < links.length; i++) {
        var link = links[i];
        var n1 = link.source;
        var n2 = link.target;
        if (ways[n1.index])
            ways[n1.index].push(n2);
        else
            ways[n1.index] = [n2];
        if (ways[n2.index])
            ways[n2.index].push(n1);
        else
            ways[n2.index] = [n1];
    }
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if (marks[node.index])
            continue;
        explore_node(node, true);
    }
    function explore_node(n, is_new) {
        if (marks[n.index] !== undefined)
            return;
        if (is_new) {
            clusters++;
            graphs.push({ array: [] });
        }
        marks[n.index] = clusters;
        graphs[clusters - 1].array.push(n);
        var adjacent = ways[n.index];
        if (!adjacent)
            return;
        for (var j = 0; j < adjacent.length; j++) {
            explore_node(adjacent[j], false);
        }
    }
    return graphs;
}
exports.separateGraphs = separateGraphs;

},{}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var powergraph = require("./powergraph");
var linklengths_1 = require("./linklengths");
var descent_1 = require("./descent");
var rectangle_1 = require("./rectangle");
var shortestpaths_1 = require("./shortestpaths");
var geom_1 = require("./geom");
var handledisconnected_1 = require("./handledisconnected");
var EventType;
(function (EventType) {
    EventType[EventType["start"] = 0] = "start";
    EventType[EventType["tick"] = 1] = "tick";
    EventType[EventType["end"] = 2] = "end";
})(EventType = exports.EventType || (exports.EventType = {}));
;
function isGroup(g) {
    return typeof g.leaves !== 'undefined' || typeof g.groups !== 'undefined';
}
var Layout = (function () {
    function Layout() {
        var _this = this;
        this._canvasSize = [1, 1];
        this._linkDistance = 20;
        this._defaultNodeSize = 10;
        this._linkLengthCalculator = null;
        this._linkType = null;
        this._avoidOverlaps = false;
        this._handleDisconnected = true;
        this._running = false;
        this._nodes = [];
        this._groups = [];
        this._rootGroup = null;
        this._links = [];
        this._constraints = [];
        this._distanceMatrix = null;
        this._descent = null;
        this._directedLinkConstraints = null;
        this._threshold = 0.01;
        this._visibilityGraph = null;
        this._groupCompactness = 1e-6;
        this.event = null;
        this.linkAccessor = {
            getSourceIndex: Layout.getSourceIndex,
            getTargetIndex: Layout.getTargetIndex,
            setLength: Layout.setLinkLength,
            getType: function (l) { return typeof _this._linkType === "function" ? _this._linkType(l) : 0; }
        };
    }
    Layout.prototype.on = function (e, listener) {
        if (!this.event)
            this.event = {};
        if (typeof e === 'string') {
            this.event[EventType[e]] = listener;
        }
        else {
            this.event[e] = listener;
        }
        return this;
    };
    Layout.prototype.trigger = function (e) {
        if (this.event && typeof this.event[e.type] !== 'undefined') {
            this.event[e.type](e);
        }
    };
    Layout.prototype.kick = function () {
        while (!this.tick())
            ;
    };
    Layout.prototype.tick = function () {
        if (this._alpha < this._threshold) {
            this._running = false;
            this.trigger({ type: EventType.end, alpha: this._alpha = 0, stress: this._lastStress });
            return true;
        }
        var n = this._nodes.length, m = this._links.length;
        var o, i;
        this._descent.locks.clear();
        for (i = 0; i < n; ++i) {
            o = this._nodes[i];
            if (o.fixed) {
                if (typeof o.px === 'undefined' || typeof o.py === 'undefined') {
                    o.px = o.x;
                    o.py = o.y;
                }
                var p = [o.px, o.py];
                this._descent.locks.add(i, p);
            }
        }
        var s1 = this._descent.rungeKutta();
        if (s1 === 0) {
            this._alpha = 0;
        }
        else if (typeof this._lastStress !== 'undefined') {
            this._alpha = s1;
        }
        this._lastStress = s1;
        this.updateNodePositions();
        this.trigger({ type: EventType.tick, alpha: this._alpha, stress: this._lastStress });
        return false;
    };
    Layout.prototype.updateNodePositions = function () {
        var x = this._descent.x[0], y = this._descent.x[1];
        var o, i = this._nodes.length;
        while (i--) {
            o = this._nodes[i];
            o.x = x[i];
            o.y = y[i];
        }
    };
    Layout.prototype.nodes = function (v) {
        if (!v) {
            if (this._nodes.length === 0 && this._links.length > 0) {
                var n = 0;
                this._links.forEach(function (l) {
                    n = Math.max(n, l.source, l.target);
                });
                this._nodes = new Array(++n);
                for (var i = 0; i < n; ++i) {
                    this._nodes[i] = {};
                }
            }
            return this._nodes;
        }
        this._nodes = v;
        return this;
    };
    Layout.prototype.groups = function (x) {
        var _this = this;
        if (!x)
            return this._groups;
        this._groups = x;
        this._rootGroup = {};
        this._groups.forEach(function (g) {
            if (typeof g.padding === "undefined")
                g.padding = 1;
            if (typeof g.leaves !== "undefined") {
                g.leaves.forEach(function (v, i) {
                    if (typeof v === 'number')
                        (g.leaves[i] = _this._nodes[v]).parent = g;
                });
            }
            if (typeof g.groups !== "undefined") {
                g.groups.forEach(function (gi, i) {
                    if (typeof gi === 'number')
                        (g.groups[i] = _this._groups[gi]).parent = g;
                });
            }
        });
        this._rootGroup.leaves = this._nodes.filter(function (v) { return typeof v.parent === 'undefined'; });
        this._rootGroup.groups = this._groups.filter(function (g) { return typeof g.parent === 'undefined'; });
        return this;
    };
    Layout.prototype.powerGraphGroups = function (f) {
        var g = powergraph.getGroups(this._nodes, this._links, this.linkAccessor, this._rootGroup);
        this.groups(g.groups);
        f(g);
        return this;
    };
    Layout.prototype.avoidOverlaps = function (v) {
        if (!arguments.length)
            return this._avoidOverlaps;
        this._avoidOverlaps = v;
        return this;
    };
    Layout.prototype.handleDisconnected = function (v) {
        if (!arguments.length)
            return this._handleDisconnected;
        this._handleDisconnected = v;
        return this;
    };
    Layout.prototype.flowLayout = function (axis, minSeparation) {
        if (!arguments.length)
            axis = 'y';
        this._directedLinkConstraints = {
            axis: axis,
            getMinSeparation: typeof minSeparation === 'number' ? function () { return minSeparation; } : minSeparation
        };
        return this;
    };
    Layout.prototype.links = function (x) {
        if (!arguments.length)
            return this._links;
        this._links = x;
        return this;
    };
    Layout.prototype.constraints = function (c) {
        if (!arguments.length)
            return this._constraints;
        this._constraints = c;
        return this;
    };
    Layout.prototype.distanceMatrix = function (d) {
        if (!arguments.length)
            return this._distanceMatrix;
        this._distanceMatrix = d;
        return this;
    };
    Layout.prototype.size = function (x) {
        if (!x)
            return this._canvasSize;
        this._canvasSize = x;
        return this;
    };
    Layout.prototype.defaultNodeSize = function (x) {
        if (!x)
            return this._defaultNodeSize;
        this._defaultNodeSize = x;
        return this;
    };
    Layout.prototype.groupCompactness = function (x) {
        if (!x)
            return this._groupCompactness;
        this._groupCompactness = x;
        return this;
    };
    Layout.prototype.linkDistance = function (x) {
        if (!x) {
            return this._linkDistance;
        }
        this._linkDistance = typeof x === "function" ? x : +x;
        this._linkLengthCalculator = null;
        return this;
    };
    Layout.prototype.linkType = function (f) {
        this._linkType = f;
        return this;
    };
    Layout.prototype.convergenceThreshold = function (x) {
        if (!x)
            return this._threshold;
        this._threshold = typeof x === "function" ? x : +x;
        return this;
    };
    Layout.prototype.alpha = function (x) {
        if (!arguments.length)
            return this._alpha;
        else {
            x = +x;
            if (this._alpha) {
                if (x > 0)
                    this._alpha = x;
                else
                    this._alpha = 0;
            }
            else if (x > 0) {
                if (!this._running) {
                    this._running = true;
                    this.trigger({ type: EventType.start, alpha: this._alpha = x });
                    this.kick();
                }
            }
            return this;
        }
    };
    Layout.prototype.getLinkLength = function (link) {
        return typeof this._linkDistance === "function" ? +(this._linkDistance(link)) : this._linkDistance;
    };
    Layout.setLinkLength = function (link, length) {
        link.length = length;
    };
    Layout.prototype.getLinkType = function (link) {
        return typeof this._linkType === "function" ? this._linkType(link) : 0;
    };
    Layout.prototype.symmetricDiffLinkLengths = function (idealLength, w) {
        var _this = this;
        if (w === void 0) { w = 1; }
        this.linkDistance(function (l) { return idealLength * l.length; });
        this._linkLengthCalculator = function () { return linklengths_1.symmetricDiffLinkLengths(_this._links, _this.linkAccessor, w); };
        return this;
    };
    Layout.prototype.jaccardLinkLengths = function (idealLength, w) {
        var _this = this;
        if (w === void 0) { w = 1; }
        this.linkDistance(function (l) { return idealLength * l.length; });
        this._linkLengthCalculator = function () { return linklengths_1.jaccardLinkLengths(_this._links, _this.linkAccessor, w); };
        return this;
    };
    Layout.prototype.start = function (initialUnconstrainedIterations, initialUserConstraintIterations, initialAllConstraintsIterations, gridSnapIterations, keepRunning, centerGraph) {
        var _this = this;
        if (initialUnconstrainedIterations === void 0) { initialUnconstrainedIterations = 0; }
        if (initialUserConstraintIterations === void 0) { initialUserConstraintIterations = 0; }
        if (initialAllConstraintsIterations === void 0) { initialAllConstraintsIterations = 0; }
        if (gridSnapIterations === void 0) { gridSnapIterations = 0; }
        if (keepRunning === void 0) { keepRunning = true; }
        if (centerGraph === void 0) { centerGraph = true; }
        var i, j, n = this.nodes().length, N = n + 2 * this._groups.length, m = this._links.length, w = this._canvasSize[0], h = this._canvasSize[1];
        var x = new Array(N), y = new Array(N);
        var G = null;
        var ao = this._avoidOverlaps;
        this._nodes.forEach(function (v, i) {
            v.index = i;
            if (typeof v.x === 'undefined') {
                v.x = w / 2, v.y = h / 2;
            }
            x[i] = v.x, y[i] = v.y;
        });
        if (this._linkLengthCalculator)
            this._linkLengthCalculator();
        var distances;
        if (this._distanceMatrix) {
            distances = this._distanceMatrix;
        }
        else {
            distances = (new shortestpaths_1.Calculator(N, this._links, Layout.getSourceIndex, Layout.getTargetIndex, function (l) { return _this.getLinkLength(l); })).DistanceMatrix();
            G = descent_1.Descent.createSquareMatrix(N, function () { return 2; });
            this._links.forEach(function (l) {
                if (typeof l.source == "number")
                    l.source = _this._nodes[l.source];
                if (typeof l.target == "number")
                    l.target = _this._nodes[l.target];
            });
            this._links.forEach(function (e) {
                var u = Layout.getSourceIndex(e), v = Layout.getTargetIndex(e);
                G[u][v] = G[v][u] = e.weight || 1;
            });
        }
        var D = descent_1.Descent.createSquareMatrix(N, function (i, j) {
            return distances[i][j];
        });
        if (this._rootGroup && typeof this._rootGroup.groups !== 'undefined') {
            var i = n;
            var addAttraction = function (i, j, strength, idealDistance) {
                G[i][j] = G[j][i] = strength;
                D[i][j] = D[j][i] = idealDistance;
            };
            this._groups.forEach(function (g) {
                addAttraction(i, i + 1, _this._groupCompactness, 0.1);
                x[i] = 0, y[i++] = 0;
                x[i] = 0, y[i++] = 0;
            });
        }
        else
            this._rootGroup = { leaves: this._nodes, groups: [] };
        var curConstraints = this._constraints || [];
        if (this._directedLinkConstraints) {
            this.linkAccessor.getMinSeparation = this._directedLinkConstraints.getMinSeparation;
            curConstraints = curConstraints.concat(linklengths_1.generateDirectedEdgeConstraints(n, this._links, this._directedLinkConstraints.axis, (this.linkAccessor)));
        }
        this.avoidOverlaps(false);
        this._descent = new descent_1.Descent([x, y], D);
        this._descent.locks.clear();
        for (var i = 0; i < n; ++i) {
            var o = this._nodes[i];
            if (o.fixed) {
                o.px = o.x;
                o.py = o.y;
                var p = [o.x, o.y];
                this._descent.locks.add(i, p);
            }
        }
        this._descent.threshold = this._threshold;
        this.initialLayout(initialUnconstrainedIterations, x, y);
        if (curConstraints.length > 0)
            this._descent.project = new rectangle_1.Projection(this._nodes, this._groups, this._rootGroup, curConstraints).projectFunctions();
        this._descent.run(initialUserConstraintIterations);
        this.separateOverlappingComponents(w, h, centerGraph);
        this.avoidOverlaps(ao);
        if (ao) {
            this._nodes.forEach(function (v, i) { v.x = x[i], v.y = y[i]; });
            this._descent.project = new rectangle_1.Projection(this._nodes, this._groups, this._rootGroup, curConstraints, true).projectFunctions();
            this._nodes.forEach(function (v, i) { x[i] = v.x, y[i] = v.y; });
        }
        this._descent.G = G;
        this._descent.run(initialAllConstraintsIterations);
        if (gridSnapIterations) {
            this._descent.snapStrength = 1000;
            this._descent.snapGridSize = this._nodes[0].width;
            this._descent.numGridSnapNodes = n;
            this._descent.scaleSnapByMaxH = n != N;
            var G0 = descent_1.Descent.createSquareMatrix(N, function (i, j) {
                if (i >= n || j >= n)
                    return G[i][j];
                return 0;
            });
            this._descent.G = G0;
            this._descent.run(gridSnapIterations);
        }
        this.updateNodePositions();
        this.separateOverlappingComponents(w, h, centerGraph);
        return keepRunning ? this.resume() : this;
    };
    Layout.prototype.initialLayout = function (iterations, x, y) {
        if (this._groups.length > 0 && iterations > 0) {
            var n = this._nodes.length;
            var edges = this._links.map(function (e) { return ({ source: e.source.index, target: e.target.index }); });
            var vs = this._nodes.map(function (v) { return ({ index: v.index }); });
            this._groups.forEach(function (g, i) {
                vs.push({ index: g.index = n + i });
            });
            this._groups.forEach(function (g, i) {
                if (typeof g.leaves !== 'undefined')
                    g.leaves.forEach(function (v) { return edges.push({ source: g.index, target: v.index }); });
                if (typeof g.groups !== 'undefined')
                    g.groups.forEach(function (gg) { return edges.push({ source: g.index, target: gg.index }); });
            });
            new Layout()
                .size(this.size())
                .nodes(vs)
                .links(edges)
                .avoidOverlaps(false)
                .linkDistance(this.linkDistance())
                .symmetricDiffLinkLengths(5)
                .convergenceThreshold(1e-4)
                .start(iterations, 0, 0, 0, false);
            this._nodes.forEach(function (v) {
                x[v.index] = vs[v.index].x;
                y[v.index] = vs[v.index].y;
            });
        }
        else {
            this._descent.run(iterations);
        }
    };
    Layout.prototype.separateOverlappingComponents = function (width, height, centerGraph) {
        var _this = this;
        if (centerGraph === void 0) { centerGraph = true; }
        if (!this._distanceMatrix && this._handleDisconnected) {
            var x_1 = this._descent.x[0], y_1 = this._descent.x[1];
            this._nodes.forEach(function (v, i) { v.x = x_1[i], v.y = y_1[i]; });
            var graphs = handledisconnected_1.separateGraphs(this._nodes, this._links);
            handledisconnected_1.applyPacking(graphs, width, height, this._defaultNodeSize, 1, centerGraph);
            this._nodes.forEach(function (v, i) {
                _this._descent.x[0][i] = v.x, _this._descent.x[1][i] = v.y;
                if (v.bounds) {
                    v.bounds.setXCentre(v.x);
                    v.bounds.setYCentre(v.y);
                }
            });
        }
    };
    Layout.prototype.resume = function () {
        return this.alpha(0.1);
    };
    Layout.prototype.stop = function () {
        return this.alpha(0);
    };
    Layout.prototype.prepareEdgeRouting = function (nodeMargin) {
        if (nodeMargin === void 0) { nodeMargin = 0; }
        this._visibilityGraph = new geom_1.TangentVisibilityGraph(this._nodes.map(function (v) {
            return v.bounds.inflate(-nodeMargin).vertices();
        }));
    };
    Layout.prototype.routeEdge = function (edge, ah, draw) {
        if (ah === void 0) { ah = 5; }
        var lineData = [];
        var vg2 = new geom_1.TangentVisibilityGraph(this._visibilityGraph.P, { V: this._visibilityGraph.V, E: this._visibilityGraph.E }), port1 = { x: edge.source.x, y: edge.source.y }, port2 = { x: edge.target.x, y: edge.target.y }, start = vg2.addPoint(port1, edge.source.index), end = vg2.addPoint(port2, edge.target.index);
        vg2.addEdgeIfVisible(port1, port2, edge.source.index, edge.target.index);
        if (typeof draw !== 'undefined') {
            draw(vg2);
        }
        var sourceInd = function (e) { return e.source.id; }, targetInd = function (e) { return e.target.id; }, length = function (e) { return e.length(); }, spCalc = new shortestpaths_1.Calculator(vg2.V.length, vg2.E, sourceInd, targetInd, length), shortestPath = spCalc.PathFromNodeToNode(start.id, end.id);
        if (shortestPath.length === 1 || shortestPath.length === vg2.V.length) {
            var route = rectangle_1.makeEdgeBetween(edge.source.innerBounds, edge.target.innerBounds, ah);
            lineData = [route.sourceIntersection, route.arrowStart];
        }
        else {
            var n = shortestPath.length - 2, p = vg2.V[shortestPath[n]].p, q = vg2.V[shortestPath[0]].p, lineData = [edge.source.innerBounds.rayIntersection(p.x, p.y)];
            for (var i = n; i >= 0; --i)
                lineData.push(vg2.V[shortestPath[i]].p);
            lineData.push(rectangle_1.makeEdgeTo(q, edge.target.innerBounds, ah));
        }
        return lineData;
    };
    Layout.getSourceIndex = function (e) {
        return typeof e.source === 'number' ? e.source : e.source.index;
    };
    Layout.getTargetIndex = function (e) {
        return typeof e.target === 'number' ? e.target : e.target.index;
    };
    Layout.linkId = function (e) {
        return Layout.getSourceIndex(e) + "-" + Layout.getTargetIndex(e);
    };
    Layout.dragStart = function (d) {
        if (isGroup(d)) {
            Layout.storeOffset(d, Layout.dragOrigin(d));
        }
        else {
            Layout.stopNode(d);
            d.fixed |= 2;
        }
    };
    Layout.stopNode = function (v) {
        v.px = v.x;
        v.py = v.y;
    };
    Layout.storeOffset = function (d, origin) {
        if (typeof d.leaves !== 'undefined') {
            d.leaves.forEach(function (v) {
                v.fixed |= 2;
                Layout.stopNode(v);
                v._dragGroupOffsetX = v.x - origin.x;
                v._dragGroupOffsetY = v.y - origin.y;
            });
        }
        if (typeof d.groups !== 'undefined') {
            d.groups.forEach(function (g) { return Layout.storeOffset(g, origin); });
        }
    };
    Layout.dragOrigin = function (d) {
        if (isGroup(d)) {
            return {
                x: d.bounds.cx(),
                y: d.bounds.cy()
            };
        }
        else {
            return d;
        }
    };
    Layout.drag = function (d, position) {
        if (isGroup(d)) {
            if (typeof d.leaves !== 'undefined') {
                d.leaves.forEach(function (v) {
                    d.bounds.setXCentre(position.x);
                    d.bounds.setYCentre(position.y);
                    v.px = v._dragGroupOffsetX + position.x;
                    v.py = v._dragGroupOffsetY + position.y;
                });
            }
            if (typeof d.groups !== 'undefined') {
                d.groups.forEach(function (g) { return Layout.drag(g, position); });
            }
        }
        else {
            d.px = position.x;
            d.py = position.y;
        }
    };
    Layout.dragEnd = function (d) {
        if (isGroup(d)) {
            if (typeof d.leaves !== 'undefined') {
                d.leaves.forEach(function (v) {
                    Layout.dragEnd(v);
                    delete v._dragGroupOffsetX;
                    delete v._dragGroupOffsetY;
                });
            }
            if (typeof d.groups !== 'undefined') {
                d.groups.forEach(Layout.dragEnd);
            }
        }
        else {
            d.fixed &= ~6;
        }
    };
    Layout.mouseOver = function (d) {
        d.fixed |= 4;
        d.px = d.x, d.py = d.y;
    };
    Layout.mouseOut = function (d) {
        d.fixed &= ~4;
    };
    return Layout;
}());
exports.Layout = Layout;

},{"./descent":7,"./geom":8,"./handledisconnected":10,"./linklengths":13,"./powergraph":14,"./rectangle":17,"./shortestpaths":18}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var shortestpaths_1 = require("./shortestpaths");
var descent_1 = require("./descent");
var rectangle_1 = require("./rectangle");
var linklengths_1 = require("./linklengths");
var Link3D = (function () {
    function Link3D(source, target) {
        this.source = source;
        this.target = target;
    }
    Link3D.prototype.actualLength = function (x) {
        var _this = this;
        return Math.sqrt(x.reduce(function (c, v) {
            var dx = v[_this.target] - v[_this.source];
            return c + dx * dx;
        }, 0));
    };
    return Link3D;
}());
exports.Link3D = Link3D;
var Node3D = (function () {
    function Node3D(x, y, z) {
        if (x === void 0) { x = 0; }
        if (y === void 0) { y = 0; }
        if (z === void 0) { z = 0; }
        this.x = x;
        this.y = y;
        this.z = z;
    }
    return Node3D;
}());
exports.Node3D = Node3D;
var Layout3D = (function () {
    function Layout3D(nodes, links, idealLinkLength) {
        var _this = this;
        if (idealLinkLength === void 0) { idealLinkLength = 1; }
        this.nodes = nodes;
        this.links = links;
        this.idealLinkLength = idealLinkLength;
        this.constraints = null;
        this.useJaccardLinkLengths = true;
        this.result = new Array(Layout3D.k);
        for (var i = 0; i < Layout3D.k; ++i) {
            this.result[i] = new Array(nodes.length);
        }
        nodes.forEach(function (v, i) {
            for (var _i = 0, _a = Layout3D.dims; _i < _a.length; _i++) {
                var dim = _a[_i];
                if (typeof v[dim] == 'undefined')
                    v[dim] = Math.random();
            }
            _this.result[0][i] = v.x;
            _this.result[1][i] = v.y;
            _this.result[2][i] = v.z;
        });
    }
    ;
    Layout3D.prototype.linkLength = function (l) {
        return l.actualLength(this.result);
    };
    Layout3D.prototype.start = function (iterations) {
        var _this = this;
        if (iterations === void 0) { iterations = 100; }
        var n = this.nodes.length;
        var linkAccessor = new LinkAccessor();
        if (this.useJaccardLinkLengths)
            linklengths_1.jaccardLinkLengths(this.links, linkAccessor, 1.5);
        this.links.forEach(function (e) { return e.length *= _this.idealLinkLength; });
        var distanceMatrix = (new shortestpaths_1.Calculator(n, this.links, function (e) { return e.source; }, function (e) { return e.target; }, function (e) { return e.length; })).DistanceMatrix();
        var D = descent_1.Descent.createSquareMatrix(n, function (i, j) { return distanceMatrix[i][j]; });
        var G = descent_1.Descent.createSquareMatrix(n, function () { return 2; });
        this.links.forEach(function (_a) {
            var source = _a.source, target = _a.target;
            return G[source][target] = G[target][source] = 1;
        });
        this.descent = new descent_1.Descent(this.result, D);
        this.descent.threshold = 1e-3;
        this.descent.G = G;
        if (this.constraints)
            this.descent.project = new rectangle_1.Projection(this.nodes, null, null, this.constraints).projectFunctions();
        for (var i = 0; i < this.nodes.length; i++) {
            var v = this.nodes[i];
            if (v.fixed) {
                this.descent.locks.add(i, [v.x, v.y, v.z]);
            }
        }
        this.descent.run(iterations);
        return this;
    };
    Layout3D.prototype.tick = function () {
        this.descent.locks.clear();
        for (var i = 0; i < this.nodes.length; i++) {
            var v = this.nodes[i];
            if (v.fixed) {
                this.descent.locks.add(i, [v.x, v.y, v.z]);
            }
        }
        return this.descent.rungeKutta();
    };
    Layout3D.dims = ['x', 'y', 'z'];
    Layout3D.k = Layout3D.dims.length;
    return Layout3D;
}());
exports.Layout3D = Layout3D;
var LinkAccessor = (function () {
    function LinkAccessor() {
    }
    LinkAccessor.prototype.getSourceIndex = function (e) { return e.source; };
    LinkAccessor.prototype.getTargetIndex = function (e) { return e.target; };
    LinkAccessor.prototype.getLength = function (e) { return e.length; };
    LinkAccessor.prototype.setLength = function (e, l) { e.length = l; };
    return LinkAccessor;
}());

},{"./descent":7,"./linklengths":13,"./rectangle":17,"./shortestpaths":18}],13:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function unionCount(a, b) {
    var u = {};
    for (var i in a)
        u[i] = {};
    for (var i in b)
        u[i] = {};
    return Object.keys(u).length;
}
function intersectionCount(a, b) {
    var n = 0;
    for (var i in a)
        if (typeof b[i] !== 'undefined')
            ++n;
    return n;
}
function getNeighbours(links, la) {
    var neighbours = {};
    var addNeighbours = function (u, v) {
        if (typeof neighbours[u] === 'undefined')
            neighbours[u] = {};
        neighbours[u][v] = {};
    };
    links.forEach(function (e) {
        var u = la.getSourceIndex(e), v = la.getTargetIndex(e);
        addNeighbours(u, v);
        addNeighbours(v, u);
    });
    return neighbours;
}
function computeLinkLengths(links, w, f, la) {
    var neighbours = getNeighbours(links, la);
    links.forEach(function (l) {
        var a = neighbours[la.getSourceIndex(l)];
        var b = neighbours[la.getTargetIndex(l)];
        la.setLength(l, 1 + w * f(a, b));
    });
}
function symmetricDiffLinkLengths(links, la, w) {
    if (w === void 0) { w = 1; }
    computeLinkLengths(links, w, function (a, b) { return Math.sqrt(unionCount(a, b) - intersectionCount(a, b)); }, la);
}
exports.symmetricDiffLinkLengths = symmetricDiffLinkLengths;
function jaccardLinkLengths(links, la, w) {
    if (w === void 0) { w = 1; }
    computeLinkLengths(links, w, function (a, b) {
        return Math.min(Object.keys(a).length, Object.keys(b).length) < 1.1 ? 0 : intersectionCount(a, b) / unionCount(a, b);
    }, la);
}
exports.jaccardLinkLengths = jaccardLinkLengths;
function generateDirectedEdgeConstraints(n, links, axis, la) {
    var components = stronglyConnectedComponents(n, links, la);
    var nodes = {};
    components.forEach(function (c, i) {
        return c.forEach(function (v) { return nodes[v] = i; });
    });
    var constraints = [];
    links.forEach(function (l) {
        var ui = la.getSourceIndex(l), vi = la.getTargetIndex(l), u = nodes[ui], v = nodes[vi];
        if (u !== v) {
            constraints.push({
                axis: axis,
                left: ui,
                right: vi,
                gap: la.getMinSeparation(l)
            });
        }
    });
    return constraints;
}
exports.generateDirectedEdgeConstraints = generateDirectedEdgeConstraints;
function stronglyConnectedComponents(numVertices, edges, la) {
    var nodes = [];
    var index = 0;
    var stack = [];
    var components = [];
    function strongConnect(v) {
        v.index = v.lowlink = index++;
        stack.push(v);
        v.onStack = true;
        for (var _i = 0, _a = v.out; _i < _a.length; _i++) {
            var w = _a[_i];
            if (typeof w.index === 'undefined') {
                strongConnect(w);
                v.lowlink = Math.min(v.lowlink, w.lowlink);
            }
            else if (w.onStack) {
                v.lowlink = Math.min(v.lowlink, w.index);
            }
        }
        if (v.lowlink === v.index) {
            var component = [];
            while (stack.length) {
                w = stack.pop();
                w.onStack = false;
                component.push(w);
                if (w === v)
                    break;
            }
            components.push(component.map(function (v) { return v.id; }));
        }
    }
    for (var i = 0; i < numVertices; i++) {
        nodes.push({ id: i, out: [] });
    }
    for (var _i = 0, edges_1 = edges; _i < edges_1.length; _i++) {
        var e = edges_1[_i];
        var v_1 = nodes[la.getSourceIndex(e)], w = nodes[la.getTargetIndex(e)];
        v_1.out.push(w);
    }
    for (var _a = 0, nodes_1 = nodes; _a < nodes_1.length; _a++) {
        var v = nodes_1[_a];
        if (typeof v.index === 'undefined')
            strongConnect(v);
    }
    return components;
}
exports.stronglyConnectedComponents = stronglyConnectedComponents;

},{}],14:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var PowerEdge = (function () {
    function PowerEdge(source, target, type) {
        this.source = source;
        this.target = target;
        this.type = type;
    }
    return PowerEdge;
}());
exports.PowerEdge = PowerEdge;
var Configuration = (function () {
    function Configuration(n, edges, linkAccessor, rootGroup) {
        var _this = this;
        this.linkAccessor = linkAccessor;
        this.modules = new Array(n);
        this.roots = [];
        if (rootGroup) {
            this.initModulesFromGroup(rootGroup);
        }
        else {
            this.roots.push(new ModuleSet());
            for (var i = 0; i < n; ++i)
                this.roots[0].add(this.modules[i] = new Module(i));
        }
        this.R = edges.length;
        edges.forEach(function (e) {
            var s = _this.modules[linkAccessor.getSourceIndex(e)], t = _this.modules[linkAccessor.getTargetIndex(e)], type = linkAccessor.getType(e);
            s.outgoing.add(type, t);
            t.incoming.add(type, s);
        });
    }
    Configuration.prototype.initModulesFromGroup = function (group) {
        var moduleSet = new ModuleSet();
        this.roots.push(moduleSet);
        for (var i = 0; i < group.leaves.length; ++i) {
            var node = group.leaves[i];
            var module = new Module(node.id);
            this.modules[node.id] = module;
            moduleSet.add(module);
        }
        if (group.groups) {
            for (var j = 0; j < group.groups.length; ++j) {
                var child = group.groups[j];
                var definition = {};
                for (var prop in child)
                    if (prop !== "leaves" && prop !== "groups" && child.hasOwnProperty(prop))
                        definition[prop] = child[prop];
                moduleSet.add(new Module(-1 - j, new LinkSets(), new LinkSets(), this.initModulesFromGroup(child), definition));
            }
        }
        return moduleSet;
    };
    Configuration.prototype.merge = function (a, b, k) {
        if (k === void 0) { k = 0; }
        var inInt = a.incoming.intersection(b.incoming), outInt = a.outgoing.intersection(b.outgoing);
        var children = new ModuleSet();
        children.add(a);
        children.add(b);
        var m = new Module(this.modules.length, outInt, inInt, children);
        this.modules.push(m);
        var update = function (s, i, o) {
            s.forAll(function (ms, linktype) {
                ms.forAll(function (n) {
                    var nls = n[i];
                    nls.add(linktype, m);
                    nls.remove(linktype, a);
                    nls.remove(linktype, b);
                    a[o].remove(linktype, n);
                    b[o].remove(linktype, n);
                });
            });
        };
        update(outInt, "incoming", "outgoing");
        update(inInt, "outgoing", "incoming");
        this.R -= inInt.count() + outInt.count();
        this.roots[k].remove(a);
        this.roots[k].remove(b);
        this.roots[k].add(m);
        return m;
    };
    Configuration.prototype.rootMerges = function (k) {
        if (k === void 0) { k = 0; }
        var rs = this.roots[k].modules();
        var n = rs.length;
        var merges = new Array(n * (n - 1));
        var ctr = 0;
        for (var i = 0, i_ = n - 1; i < i_; ++i) {
            for (var j = i + 1; j < n; ++j) {
                var a = rs[i], b = rs[j];
                merges[ctr] = { id: ctr, nEdges: this.nEdges(a, b), a: a, b: b };
                ctr++;
            }
        }
        return merges;
    };
    Configuration.prototype.greedyMerge = function () {
        for (var i = 0; i < this.roots.length; ++i) {
            if (this.roots[i].modules().length < 2)
                continue;
            var ms = this.rootMerges(i).sort(function (a, b) { return a.nEdges == b.nEdges ? a.id - b.id : a.nEdges - b.nEdges; });
            var m = ms[0];
            if (m.nEdges >= this.R)
                continue;
            this.merge(m.a, m.b, i);
            return true;
        }
    };
    Configuration.prototype.nEdges = function (a, b) {
        var inInt = a.incoming.intersection(b.incoming), outInt = a.outgoing.intersection(b.outgoing);
        return this.R - inInt.count() - outInt.count();
    };
    Configuration.prototype.getGroupHierarchy = function (retargetedEdges) {
        var _this = this;
        var groups = [];
        var root = {};
        toGroups(this.roots[0], root, groups);
        var es = this.allEdges();
        es.forEach(function (e) {
            var a = _this.modules[e.source];
            var b = _this.modules[e.target];
            retargetedEdges.push(new PowerEdge(typeof a.gid === "undefined" ? e.source : groups[a.gid], typeof b.gid === "undefined" ? e.target : groups[b.gid], e.type));
        });
        return groups;
    };
    Configuration.prototype.allEdges = function () {
        var es = [];
        Configuration.getEdges(this.roots[0], es);
        return es;
    };
    Configuration.getEdges = function (modules, es) {
        modules.forAll(function (m) {
            m.getEdges(es);
            Configuration.getEdges(m.children, es);
        });
    };
    return Configuration;
}());
exports.Configuration = Configuration;
function toGroups(modules, group, groups) {
    modules.forAll(function (m) {
        if (m.isLeaf()) {
            if (!group.leaves)
                group.leaves = [];
            group.leaves.push(m.id);
        }
        else {
            var g = group;
            m.gid = groups.length;
            if (!m.isIsland() || m.isPredefined()) {
                g = { id: m.gid };
                if (m.isPredefined())
                    for (var prop in m.definition)
                        g[prop] = m.definition[prop];
                if (!group.groups)
                    group.groups = [];
                group.groups.push(m.gid);
                groups.push(g);
            }
            toGroups(m.children, g, groups);
        }
    });
}
var Module = (function () {
    function Module(id, outgoing, incoming, children, definition) {
        if (outgoing === void 0) { outgoing = new LinkSets(); }
        if (incoming === void 0) { incoming = new LinkSets(); }
        if (children === void 0) { children = new ModuleSet(); }
        this.id = id;
        this.outgoing = outgoing;
        this.incoming = incoming;
        this.children = children;
        this.definition = definition;
    }
    Module.prototype.getEdges = function (es) {
        var _this = this;
        this.outgoing.forAll(function (ms, edgetype) {
            ms.forAll(function (target) {
                es.push(new PowerEdge(_this.id, target.id, edgetype));
            });
        });
    };
    Module.prototype.isLeaf = function () {
        return this.children.count() === 0;
    };
    Module.prototype.isIsland = function () {
        return this.outgoing.count() === 0 && this.incoming.count() === 0;
    };
    Module.prototype.isPredefined = function () {
        return typeof this.definition !== "undefined";
    };
    return Module;
}());
exports.Module = Module;
function intersection(m, n) {
    var i = {};
    for (var v in m)
        if (v in n)
            i[v] = m[v];
    return i;
}
var ModuleSet = (function () {
    function ModuleSet() {
        this.table = {};
    }
    ModuleSet.prototype.count = function () {
        return Object.keys(this.table).length;
    };
    ModuleSet.prototype.intersection = function (other) {
        var result = new ModuleSet();
        result.table = intersection(this.table, other.table);
        return result;
    };
    ModuleSet.prototype.intersectionCount = function (other) {
        return this.intersection(other).count();
    };
    ModuleSet.prototype.contains = function (id) {
        return id in this.table;
    };
    ModuleSet.prototype.add = function (m) {
        this.table[m.id] = m;
    };
    ModuleSet.prototype.remove = function (m) {
        delete this.table[m.id];
    };
    ModuleSet.prototype.forAll = function (f) {
        for (var mid in this.table) {
            f(this.table[mid]);
        }
    };
    ModuleSet.prototype.modules = function () {
        var vs = [];
        this.forAll(function (m) {
            if (!m.isPredefined())
                vs.push(m);
        });
        return vs;
    };
    return ModuleSet;
}());
exports.ModuleSet = ModuleSet;
var LinkSets = (function () {
    function LinkSets() {
        this.sets = {};
        this.n = 0;
    }
    LinkSets.prototype.count = function () {
        return this.n;
    };
    LinkSets.prototype.contains = function (id) {
        var result = false;
        this.forAllModules(function (m) {
            if (!result && m.id == id) {
                result = true;
            }
        });
        return result;
    };
    LinkSets.prototype.add = function (linktype, m) {
        var s = linktype in this.sets ? this.sets[linktype] : this.sets[linktype] = new ModuleSet();
        s.add(m);
        ++this.n;
    };
    LinkSets.prototype.remove = function (linktype, m) {
        var ms = this.sets[linktype];
        ms.remove(m);
        if (ms.count() === 0) {
            delete this.sets[linktype];
        }
        --this.n;
    };
    LinkSets.prototype.forAll = function (f) {
        for (var linktype in this.sets) {
            f(this.sets[linktype], Number(linktype));
        }
    };
    LinkSets.prototype.forAllModules = function (f) {
        this.forAll(function (ms, lt) { return ms.forAll(f); });
    };
    LinkSets.prototype.intersection = function (other) {
        var result = new LinkSets();
        this.forAll(function (ms, lt) {
            if (lt in other.sets) {
                var i = ms.intersection(other.sets[lt]), n = i.count();
                if (n > 0) {
                    result.sets[lt] = i;
                    result.n += n;
                }
            }
        });
        return result;
    };
    return LinkSets;
}());
exports.LinkSets = LinkSets;
function intersectionCount(m, n) {
    return Object.keys(intersection(m, n)).length;
}
function getGroups(nodes, links, la, rootGroup) {
    var n = nodes.length, c = new Configuration(n, links, la, rootGroup);
    while (c.greedyMerge())
        ;
    var powerEdges = [];
    var g = c.getGroupHierarchy(powerEdges);
    powerEdges.forEach(function (e) {
        var f = function (end) {
            var g = e[end];
            if (typeof g == "number")
                e[end] = nodes[g];
        };
        f("source");
        f("target");
    });
    return { groups: g, powerEdges: powerEdges };
}
exports.getGroups = getGroups;

},{}],15:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var PairingHeap = (function () {
    function PairingHeap(elem) {
        this.elem = elem;
        this.subheaps = [];
    }
    PairingHeap.prototype.toString = function (selector) {
        var str = "", needComma = false;
        for (var i = 0; i < this.subheaps.length; ++i) {
            var subheap = this.subheaps[i];
            if (!subheap.elem) {
                needComma = false;
                continue;
            }
            if (needComma) {
                str = str + ",";
            }
            str = str + subheap.toString(selector);
            needComma = true;
        }
        if (str !== "") {
            str = "(" + str + ")";
        }
        return (this.elem ? selector(this.elem) : "") + str;
    };
    PairingHeap.prototype.forEach = function (f) {
        if (!this.empty()) {
            f(this.elem, this);
            this.subheaps.forEach(function (s) { return s.forEach(f); });
        }
    };
    PairingHeap.prototype.count = function () {
        return this.empty() ? 0 : 1 + this.subheaps.reduce(function (n, h) {
            return n + h.count();
        }, 0);
    };
    PairingHeap.prototype.min = function () {
        return this.elem;
    };
    PairingHeap.prototype.empty = function () {
        return this.elem == null;
    };
    PairingHeap.prototype.contains = function (h) {
        if (this === h)
            return true;
        for (var i = 0; i < this.subheaps.length; i++) {
            if (this.subheaps[i].contains(h))
                return true;
        }
        return false;
    };
    PairingHeap.prototype.isHeap = function (lessThan) {
        var _this = this;
        return this.subheaps.every(function (h) { return lessThan(_this.elem, h.elem) && h.isHeap(lessThan); });
    };
    PairingHeap.prototype.insert = function (obj, lessThan) {
        return this.merge(new PairingHeap(obj), lessThan);
    };
    PairingHeap.prototype.merge = function (heap2, lessThan) {
        if (this.empty())
            return heap2;
        else if (heap2.empty())
            return this;
        else if (lessThan(this.elem, heap2.elem)) {
            this.subheaps.push(heap2);
            return this;
        }
        else {
            heap2.subheaps.push(this);
            return heap2;
        }
    };
    PairingHeap.prototype.removeMin = function (lessThan) {
        if (this.empty())
            return null;
        else
            return this.mergePairs(lessThan);
    };
    PairingHeap.prototype.mergePairs = function (lessThan) {
        if (this.subheaps.length == 0)
            return new PairingHeap(null);
        else if (this.subheaps.length == 1) {
            return this.subheaps[0];
        }
        else {
            var firstPair = this.subheaps.pop().merge(this.subheaps.pop(), lessThan);
            var remaining = this.mergePairs(lessThan);
            return firstPair.merge(remaining, lessThan);
        }
    };
    PairingHeap.prototype.decreaseKey = function (subheap, newValue, setHeapNode, lessThan) {
        var newHeap = subheap.removeMin(lessThan);
        subheap.elem = newHeap.elem;
        subheap.subheaps = newHeap.subheaps;
        if (setHeapNode !== null && newHeap.elem !== null) {
            setHeapNode(subheap.elem, subheap);
        }
        var pairingNode = new PairingHeap(newValue);
        if (setHeapNode !== null) {
            setHeapNode(newValue, pairingNode);
        }
        return this.merge(pairingNode, lessThan);
    };
    return PairingHeap;
}());
exports.PairingHeap = PairingHeap;
var PriorityQueue = (function () {
    function PriorityQueue(lessThan) {
        this.lessThan = lessThan;
    }
    PriorityQueue.prototype.top = function () {
        if (this.empty()) {
            return null;
        }
        return this.root.elem;
    };
    PriorityQueue.prototype.push = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var pairingNode;
        for (var i = 0, arg; arg = args[i]; ++i) {
            pairingNode = new PairingHeap(arg);
            this.root = this.empty() ?
                pairingNode : this.root.merge(pairingNode, this.lessThan);
        }
        return pairingNode;
    };
    PriorityQueue.prototype.empty = function () {
        return !this.root || !this.root.elem;
    };
    PriorityQueue.prototype.isHeap = function () {
        return this.root.isHeap(this.lessThan);
    };
    PriorityQueue.prototype.forEach = function (f) {
        this.root.forEach(f);
    };
    PriorityQueue.prototype.pop = function () {
        if (this.empty()) {
            return null;
        }
        var obj = this.root.min();
        this.root = this.root.removeMin(this.lessThan);
        return obj;
    };
    PriorityQueue.prototype.reduceKey = function (heapNode, newKey, setHeapNode) {
        if (setHeapNode === void 0) { setHeapNode = null; }
        this.root = this.root.decreaseKey(heapNode, newKey, setHeapNode, this.lessThan);
    };
    PriorityQueue.prototype.toString = function (selector) {
        return this.root.toString(selector);
    };
    PriorityQueue.prototype.count = function () {
        return this.root.count();
    };
    return PriorityQueue;
}());
exports.PriorityQueue = PriorityQueue;

},{}],16:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var TreeBase = (function () {
    function TreeBase() {
        this.findIter = function (data) {
            var res = this._root;
            var iter = this.iterator();
            while (res !== null) {
                var c = this._comparator(data, res.data);
                if (c === 0) {
                    iter._cursor = res;
                    return iter;
                }
                else {
                    iter._ancestors.push(res);
                    res = res.get_child(c > 0);
                }
            }
            return null;
        };
    }
    TreeBase.prototype.clear = function () {
        this._root = null;
        this.size = 0;
    };
    ;
    TreeBase.prototype.find = function (data) {
        var res = this._root;
        while (res !== null) {
            var c = this._comparator(data, res.data);
            if (c === 0) {
                return res.data;
            }
            else {
                res = res.get_child(c > 0);
            }
        }
        return null;
    };
    ;
    TreeBase.prototype.lowerBound = function (data) {
        return this._bound(data, this._comparator);
    };
    ;
    TreeBase.prototype.upperBound = function (data) {
        var cmp = this._comparator;
        function reverse_cmp(a, b) {
            return cmp(b, a);
        }
        return this._bound(data, reverse_cmp);
    };
    ;
    TreeBase.prototype.min = function () {
        var res = this._root;
        if (res === null) {
            return null;
        }
        while (res.left !== null) {
            res = res.left;
        }
        return res.data;
    };
    ;
    TreeBase.prototype.max = function () {
        var res = this._root;
        if (res === null) {
            return null;
        }
        while (res.right !== null) {
            res = res.right;
        }
        return res.data;
    };
    ;
    TreeBase.prototype.iterator = function () {
        return new Iterator(this);
    };
    ;
    TreeBase.prototype.each = function (cb) {
        var it = this.iterator(), data;
        while ((data = it.next()) !== null) {
            cb(data);
        }
    };
    ;
    TreeBase.prototype.reach = function (cb) {
        var it = this.iterator(), data;
        while ((data = it.prev()) !== null) {
            cb(data);
        }
    };
    ;
    TreeBase.prototype._bound = function (data, cmp) {
        var cur = this._root;
        var iter = this.iterator();
        while (cur !== null) {
            var c = this._comparator(data, cur.data);
            if (c === 0) {
                iter._cursor = cur;
                return iter;
            }
            iter._ancestors.push(cur);
            cur = cur.get_child(c > 0);
        }
        for (var i = iter._ancestors.length - 1; i >= 0; --i) {
            cur = iter._ancestors[i];
            if (cmp(data, cur.data) > 0) {
                iter._cursor = cur;
                iter._ancestors.length = i;
                return iter;
            }
        }
        iter._ancestors.length = 0;
        return iter;
    };
    ;
    return TreeBase;
}());
exports.TreeBase = TreeBase;
var Iterator = (function () {
    function Iterator(tree) {
        this._tree = tree;
        this._ancestors = [];
        this._cursor = null;
    }
    Iterator.prototype.data = function () {
        return this._cursor !== null ? this._cursor.data : null;
    };
    ;
    Iterator.prototype.next = function () {
        if (this._cursor === null) {
            var root = this._tree._root;
            if (root !== null) {
                this._minNode(root);
            }
        }
        else {
            if (this._cursor.right === null) {
                var save;
                do {
                    save = this._cursor;
                    if (this._ancestors.length) {
                        this._cursor = this._ancestors.pop();
                    }
                    else {
                        this._cursor = null;
                        break;
                    }
                } while (this._cursor.right === save);
            }
            else {
                this._ancestors.push(this._cursor);
                this._minNode(this._cursor.right);
            }
        }
        return this._cursor !== null ? this._cursor.data : null;
    };
    ;
    Iterator.prototype.prev = function () {
        if (this._cursor === null) {
            var root = this._tree._root;
            if (root !== null) {
                this._maxNode(root);
            }
        }
        else {
            if (this._cursor.left === null) {
                var save;
                do {
                    save = this._cursor;
                    if (this._ancestors.length) {
                        this._cursor = this._ancestors.pop();
                    }
                    else {
                        this._cursor = null;
                        break;
                    }
                } while (this._cursor.left === save);
            }
            else {
                this._ancestors.push(this._cursor);
                this._maxNode(this._cursor.left);
            }
        }
        return this._cursor !== null ? this._cursor.data : null;
    };
    ;
    Iterator.prototype._minNode = function (start) {
        while (start.left !== null) {
            this._ancestors.push(start);
            start = start.left;
        }
        this._cursor = start;
    };
    ;
    Iterator.prototype._maxNode = function (start) {
        while (start.right !== null) {
            this._ancestors.push(start);
            start = start.right;
        }
        this._cursor = start;
    };
    ;
    return Iterator;
}());
exports.Iterator = Iterator;
var Node = (function () {
    function Node(data) {
        this.data = data;
        this.left = null;
        this.right = null;
        this.red = true;
    }
    Node.prototype.get_child = function (dir) {
        return dir ? this.right : this.left;
    };
    ;
    Node.prototype.set_child = function (dir, val) {
        if (dir) {
            this.right = val;
        }
        else {
            this.left = val;
        }
    };
    ;
    return Node;
}());
var RBTree = (function (_super) {
    __extends(RBTree, _super);
    function RBTree(comparator) {
        var _this = _super.call(this) || this;
        _this._root = null;
        _this._comparator = comparator;
        _this.size = 0;
        return _this;
    }
    RBTree.prototype.insert = function (data) {
        var ret = false;
        if (this._root === null) {
            this._root = new Node(data);
            ret = true;
            this.size++;
        }
        else {
            var head = new Node(undefined);
            var dir = false;
            var last = false;
            var gp = null;
            var ggp = head;
            var p = null;
            var node = this._root;
            ggp.right = this._root;
            while (true) {
                if (node === null) {
                    node = new Node(data);
                    p.set_child(dir, node);
                    ret = true;
                    this.size++;
                }
                else if (RBTree.is_red(node.left) && RBTree.is_red(node.right)) {
                    node.red = true;
                    node.left.red = false;
                    node.right.red = false;
                }
                if (RBTree.is_red(node) && RBTree.is_red(p)) {
                    var dir2 = ggp.right === gp;
                    if (node === p.get_child(last)) {
                        ggp.set_child(dir2, RBTree.single_rotate(gp, !last));
                    }
                    else {
                        ggp.set_child(dir2, RBTree.double_rotate(gp, !last));
                    }
                }
                var cmp = this._comparator(node.data, data);
                if (cmp === 0) {
                    break;
                }
                last = dir;
                dir = cmp < 0;
                if (gp !== null) {
                    ggp = gp;
                }
                gp = p;
                p = node;
                node = node.get_child(dir);
            }
            this._root = head.right;
        }
        this._root.red = false;
        return ret;
    };
    ;
    RBTree.prototype.remove = function (data) {
        if (this._root === null) {
            return false;
        }
        var head = new Node(undefined);
        var node = head;
        node.right = this._root;
        var p = null;
        var gp = null;
        var found = null;
        var dir = true;
        while (node.get_child(dir) !== null) {
            var last = dir;
            gp = p;
            p = node;
            node = node.get_child(dir);
            var cmp = this._comparator(data, node.data);
            dir = cmp > 0;
            if (cmp === 0) {
                found = node;
            }
            if (!RBTree.is_red(node) && !RBTree.is_red(node.get_child(dir))) {
                if (RBTree.is_red(node.get_child(!dir))) {
                    var sr = RBTree.single_rotate(node, dir);
                    p.set_child(last, sr);
                    p = sr;
                }
                else if (!RBTree.is_red(node.get_child(!dir))) {
                    var sibling = p.get_child(!last);
                    if (sibling !== null) {
                        if (!RBTree.is_red(sibling.get_child(!last)) && !RBTree.is_red(sibling.get_child(last))) {
                            p.red = false;
                            sibling.red = true;
                            node.red = true;
                        }
                        else {
                            var dir2 = gp.right === p;
                            if (RBTree.is_red(sibling.get_child(last))) {
                                gp.set_child(dir2, RBTree.double_rotate(p, last));
                            }
                            else if (RBTree.is_red(sibling.get_child(!last))) {
                                gp.set_child(dir2, RBTree.single_rotate(p, last));
                            }
                            var gpc = gp.get_child(dir2);
                            gpc.red = true;
                            node.red = true;
                            gpc.left.red = false;
                            gpc.right.red = false;
                        }
                    }
                }
            }
        }
        if (found !== null) {
            found.data = node.data;
            p.set_child(p.right === node, node.get_child(node.left === null));
            this.size--;
        }
        this._root = head.right;
        if (this._root !== null) {
            this._root.red = false;
        }
        return found !== null;
    };
    ;
    RBTree.is_red = function (node) {
        return node !== null && node.red;
    };
    RBTree.single_rotate = function (root, dir) {
        var save = root.get_child(!dir);
        root.set_child(!dir, save.get_child(dir));
        save.set_child(dir, root);
        root.red = true;
        save.red = false;
        return save;
    };
    RBTree.double_rotate = function (root, dir) {
        root.set_child(!dir, RBTree.single_rotate(root.get_child(!dir), !dir));
        return RBTree.single_rotate(root, dir);
    };
    return RBTree;
}(TreeBase));
exports.RBTree = RBTree;

},{}],17:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var vpsc_1 = require("./vpsc");
var rbtree_1 = require("./rbtree");
function computeGroupBounds(g) {
    g.bounds = typeof g.leaves !== "undefined" ?
        g.leaves.reduce(function (r, c) { return c.bounds.union(r); }, Rectangle.empty()) :
        Rectangle.empty();
    if (typeof g.groups !== "undefined")
        g.bounds = g.groups.reduce(function (r, c) { return computeGroupBounds(c).union(r); }, g.bounds);
    g.bounds = g.bounds.inflate(g.padding);
    return g.bounds;
}
exports.computeGroupBounds = computeGroupBounds;
var Rectangle = (function () {
    function Rectangle(x, X, y, Y) {
        this.x = x;
        this.X = X;
        this.y = y;
        this.Y = Y;
    }
    Rectangle.empty = function () { return new Rectangle(Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY); };
    Rectangle.prototype.cx = function () { return (this.x + this.X) / 2; };
    Rectangle.prototype.cy = function () { return (this.y + this.Y) / 2; };
    Rectangle.prototype.overlapX = function (r) {
        var ux = this.cx(), vx = r.cx();
        if (ux <= vx && r.x < this.X)
            return this.X - r.x;
        if (vx <= ux && this.x < r.X)
            return r.X - this.x;
        return 0;
    };
    Rectangle.prototype.overlapY = function (r) {
        var uy = this.cy(), vy = r.cy();
        if (uy <= vy && r.y < this.Y)
            return this.Y - r.y;
        if (vy <= uy && this.y < r.Y)
            return r.Y - this.y;
        return 0;
    };
    Rectangle.prototype.setXCentre = function (cx) {
        var dx = cx - this.cx();
        this.x += dx;
        this.X += dx;
    };
    Rectangle.prototype.setYCentre = function (cy) {
        var dy = cy - this.cy();
        this.y += dy;
        this.Y += dy;
    };
    Rectangle.prototype.width = function () {
        return this.X - this.x;
    };
    Rectangle.prototype.height = function () {
        return this.Y - this.y;
    };
    Rectangle.prototype.union = function (r) {
        return new Rectangle(Math.min(this.x, r.x), Math.max(this.X, r.X), Math.min(this.y, r.y), Math.max(this.Y, r.Y));
    };
    Rectangle.prototype.lineIntersections = function (x1, y1, x2, y2) {
        var sides = [[this.x, this.y, this.X, this.y],
            [this.X, this.y, this.X, this.Y],
            [this.X, this.Y, this.x, this.Y],
            [this.x, this.Y, this.x, this.y]];
        var intersections = [];
        for (var i = 0; i < 4; ++i) {
            var r = Rectangle.lineIntersection(x1, y1, x2, y2, sides[i][0], sides[i][1], sides[i][2], sides[i][3]);
            if (r !== null)
                intersections.push({ x: r.x, y: r.y });
        }
        return intersections;
    };
    Rectangle.prototype.rayIntersection = function (x2, y2) {
        var ints = this.lineIntersections(this.cx(), this.cy(), x2, y2);
        return ints.length > 0 ? ints[0] : null;
    };
    Rectangle.prototype.vertices = function () {
        return [
            { x: this.x, y: this.y },
            { x: this.X, y: this.y },
            { x: this.X, y: this.Y },
            { x: this.x, y: this.Y }
        ];
    };
    Rectangle.lineIntersection = function (x1, y1, x2, y2, x3, y3, x4, y4) {
        var dx12 = x2 - x1, dx34 = x4 - x3, dy12 = y2 - y1, dy34 = y4 - y3, denominator = dy34 * dx12 - dx34 * dy12;
        if (denominator == 0)
            return null;
        var dx31 = x1 - x3, dy31 = y1 - y3, numa = dx34 * dy31 - dy34 * dx31, a = numa / denominator, numb = dx12 * dy31 - dy12 * dx31, b = numb / denominator;
        if (a >= 0 && a <= 1 && b >= 0 && b <= 1) {
            return {
                x: x1 + a * dx12,
                y: y1 + a * dy12
            };
        }
        return null;
    };
    Rectangle.prototype.inflate = function (pad) {
        return new Rectangle(this.x - pad, this.X + pad, this.y - pad, this.Y + pad);
    };
    return Rectangle;
}());
exports.Rectangle = Rectangle;
function makeEdgeBetween(source, target, ah) {
    var si = source.rayIntersection(target.cx(), target.cy()) || { x: source.cx(), y: source.cy() }, ti = target.rayIntersection(source.cx(), source.cy()) || { x: target.cx(), y: target.cy() }, dx = ti.x - si.x, dy = ti.y - si.y, l = Math.sqrt(dx * dx + dy * dy), al = l - ah;
    return {
        sourceIntersection: si,
        targetIntersection: ti,
        arrowStart: { x: si.x + al * dx / l, y: si.y + al * dy / l }
    };
}
exports.makeEdgeBetween = makeEdgeBetween;
function makeEdgeTo(s, target, ah) {
    var ti = target.rayIntersection(s.x, s.y);
    if (!ti)
        ti = { x: target.cx(), y: target.cy() };
    var dx = ti.x - s.x, dy = ti.y - s.y, l = Math.sqrt(dx * dx + dy * dy);
    return { x: ti.x - ah * dx / l, y: ti.y - ah * dy / l };
}
exports.makeEdgeTo = makeEdgeTo;
var Node = (function () {
    function Node(v, r, pos) {
        this.v = v;
        this.r = r;
        this.pos = pos;
        this.prev = makeRBTree();
        this.next = makeRBTree();
    }
    return Node;
}());
var Event = (function () {
    function Event(isOpen, v, pos) {
        this.isOpen = isOpen;
        this.v = v;
        this.pos = pos;
    }
    return Event;
}());
function compareEvents(a, b) {
    if (a.pos > b.pos) {
        return 1;
    }
    if (a.pos < b.pos) {
        return -1;
    }
    if (a.isOpen) {
        return -1;
    }
    if (b.isOpen) {
        return 1;
    }
    return 0;
}
function makeRBTree() {
    return new rbtree_1.RBTree(function (a, b) { return a.pos - b.pos; });
}
var xRect = {
    getCentre: function (r) { return r.cx(); },
    getOpen: function (r) { return r.y; },
    getClose: function (r) { return r.Y; },
    getSize: function (r) { return r.width(); },
    makeRect: function (open, close, center, size) { return new Rectangle(center - size / 2, center + size / 2, open, close); },
    findNeighbours: findXNeighbours
};
var yRect = {
    getCentre: function (r) { return r.cy(); },
    getOpen: function (r) { return r.x; },
    getClose: function (r) { return r.X; },
    getSize: function (r) { return r.height(); },
    makeRect: function (open, close, center, size) { return new Rectangle(open, close, center - size / 2, center + size / 2); },
    findNeighbours: findYNeighbours
};
function generateGroupConstraints(root, f, minSep, isContained) {
    if (isContained === void 0) { isContained = false; }
    var padding = root.padding, gn = typeof root.groups !== 'undefined' ? root.groups.length : 0, ln = typeof root.leaves !== 'undefined' ? root.leaves.length : 0, childConstraints = !gn ? []
        : root.groups.reduce(function (ccs, g) { return ccs.concat(generateGroupConstraints(g, f, minSep, true)); }, []), n = (isContained ? 2 : 0) + ln + gn, vs = new Array(n), rs = new Array(n), i = 0, add = function (r, v) { rs[i] = r; vs[i++] = v; };
    if (isContained) {
        var b = root.bounds, c = f.getCentre(b), s = f.getSize(b) / 2, open = f.getOpen(b), close = f.getClose(b), min = c - s + padding / 2, max = c + s - padding / 2;
        root.minVar.desiredPosition = min;
        add(f.makeRect(open, close, min, padding), root.minVar);
        root.maxVar.desiredPosition = max;
        add(f.makeRect(open, close, max, padding), root.maxVar);
    }
    if (ln)
        root.leaves.forEach(function (l) { return add(l.bounds, l.variable); });
    if (gn)
        root.groups.forEach(function (g) {
            var b = g.bounds;
            add(f.makeRect(f.getOpen(b), f.getClose(b), f.getCentre(b), f.getSize(b)), g.minVar);
        });
    var cs = generateConstraints(rs, vs, f, minSep);
    if (gn) {
        vs.forEach(function (v) { v.cOut = [], v.cIn = []; });
        cs.forEach(function (c) { c.left.cOut.push(c), c.right.cIn.push(c); });
        root.groups.forEach(function (g) {
            var gapAdjustment = (g.padding - f.getSize(g.bounds)) / 2;
            g.minVar.cIn.forEach(function (c) { return c.gap += gapAdjustment; });
            g.minVar.cOut.forEach(function (c) { c.left = g.maxVar; c.gap += gapAdjustment; });
        });
    }
    return childConstraints.concat(cs);
}
function generateConstraints(rs, vars, rect, minSep) {
    var i, n = rs.length;
    var N = 2 * n;
    console.assert(vars.length >= n);
    var events = new Array(N);
    for (i = 0; i < n; ++i) {
        var r = rs[i];
        var v = new Node(vars[i], r, rect.getCentre(r));
        events[i] = new Event(true, v, rect.getOpen(r));
        events[i + n] = new Event(false, v, rect.getClose(r));
    }
    events.sort(compareEvents);
    var cs = new Array();
    var scanline = makeRBTree();
    for (i = 0; i < N; ++i) {
        var e = events[i];
        var v = e.v;
        if (e.isOpen) {
            scanline.insert(v);
            rect.findNeighbours(v, scanline);
        }
        else {
            scanline.remove(v);
            var makeConstraint = function (l, r) {
                var sep = (rect.getSize(l.r) + rect.getSize(r.r)) / 2 + minSep;
                cs.push(new vpsc_1.Constraint(l.v, r.v, sep));
            };
            var visitNeighbours = function (forward, reverse, mkcon) {
                var u, it = v[forward].iterator();
                while ((u = it[forward]()) !== null) {
                    mkcon(u, v);
                    u[reverse].remove(v);
                }
            };
            visitNeighbours("prev", "next", function (u, v) { return makeConstraint(u, v); });
            visitNeighbours("next", "prev", function (u, v) { return makeConstraint(v, u); });
        }
    }
    console.assert(scanline.size === 0);
    return cs;
}
function findXNeighbours(v, scanline) {
    var f = function (forward, reverse) {
        var it = scanline.findIter(v);
        var u;
        while ((u = it[forward]()) !== null) {
            var uovervX = u.r.overlapX(v.r);
            if (uovervX <= 0 || uovervX <= u.r.overlapY(v.r)) {
                v[forward].insert(u);
                u[reverse].insert(v);
            }
            if (uovervX <= 0) {
                break;
            }
        }
    };
    f("next", "prev");
    f("prev", "next");
}
function findYNeighbours(v, scanline) {
    var f = function (forward, reverse) {
        var u = scanline.findIter(v)[forward]();
        if (u !== null && u.r.overlapX(v.r) > 0) {
            v[forward].insert(u);
            u[reverse].insert(v);
        }
    };
    f("next", "prev");
    f("prev", "next");
}
function generateXConstraints(rs, vars) {
    return generateConstraints(rs, vars, xRect, 1e-6);
}
exports.generateXConstraints = generateXConstraints;
function generateYConstraints(rs, vars) {
    return generateConstraints(rs, vars, yRect, 1e-6);
}
exports.generateYConstraints = generateYConstraints;
function generateXGroupConstraints(root) {
    return generateGroupConstraints(root, xRect, 1e-6);
}
exports.generateXGroupConstraints = generateXGroupConstraints;
function generateYGroupConstraints(root) {
    return generateGroupConstraints(root, yRect, 1e-6);
}
exports.generateYGroupConstraints = generateYGroupConstraints;
function removeOverlaps(rs) {
    var vs = rs.map(function (r) { return new vpsc_1.Variable(r.cx()); });
    var cs = generateXConstraints(rs, vs);
    var solver = new vpsc_1.Solver(vs, cs);
    solver.solve();
    vs.forEach(function (v, i) { return rs[i].setXCentre(v.position()); });
    vs = rs.map(function (r) { return new vpsc_1.Variable(r.cy()); });
    cs = generateYConstraints(rs, vs);
    solver = new vpsc_1.Solver(vs, cs);
    solver.solve();
    vs.forEach(function (v, i) { return rs[i].setYCentre(v.position()); });
}
exports.removeOverlaps = removeOverlaps;
var IndexedVariable = (function (_super) {
    __extends(IndexedVariable, _super);
    function IndexedVariable(index, w) {
        var _this = _super.call(this, 0, w) || this;
        _this.index = index;
        return _this;
    }
    return IndexedVariable;
}(vpsc_1.Variable));
exports.IndexedVariable = IndexedVariable;
var Projection = (function () {
    function Projection(nodes, groups, rootGroup, constraints, avoidOverlaps) {
        var _this = this;
        if (rootGroup === void 0) { rootGroup = null; }
        if (constraints === void 0) { constraints = null; }
        if (avoidOverlaps === void 0) { avoidOverlaps = false; }
        this.nodes = nodes;
        this.groups = groups;
        this.rootGroup = rootGroup;
        this.avoidOverlaps = avoidOverlaps;
        this.variables = nodes.map(function (v, i) {
            return v.variable = new IndexedVariable(i, 1);
        });
        if (constraints)
            this.createConstraints(constraints);
        if (avoidOverlaps && rootGroup && typeof rootGroup.groups !== 'undefined') {
            nodes.forEach(function (v) {
                if (!v.width || !v.height) {
                    v.bounds = new Rectangle(v.x, v.x, v.y, v.y);
                    return;
                }
                var w2 = v.width / 2, h2 = v.height / 2;
                v.bounds = new Rectangle(v.x - w2, v.x + w2, v.y - h2, v.y + h2);
            });
            computeGroupBounds(rootGroup);
            var i = nodes.length;
            groups.forEach(function (g) {
                _this.variables[i] = g.minVar = new IndexedVariable(i++, typeof g.stiffness !== "undefined" ? g.stiffness : 0.01);
                _this.variables[i] = g.maxVar = new IndexedVariable(i++, typeof g.stiffness !== "undefined" ? g.stiffness : 0.01);
            });
        }
    }
    Projection.prototype.createSeparation = function (c) {
        return new vpsc_1.Constraint(this.nodes[c.left].variable, this.nodes[c.right].variable, c.gap, typeof c.equality !== "undefined" ? c.equality : false);
    };
    Projection.prototype.makeFeasible = function (c) {
        var _this = this;
        if (!this.avoidOverlaps)
            return;
        var axis = 'x', dim = 'width';
        if (c.axis === 'x')
            axis = 'y', dim = 'height';
        var vs = c.offsets.map(function (o) { return _this.nodes[o.node]; }).sort(function (a, b) { return a[axis] - b[axis]; });
        var p = null;
        vs.forEach(function (v) {
            if (p) {
                var nextPos = p[axis] + p[dim];
                if (nextPos > v[axis]) {
                    v[axis] = nextPos;
                }
            }
            p = v;
        });
    };
    Projection.prototype.createAlignment = function (c) {
        var _this = this;
        var u = this.nodes[c.offsets[0].node].variable;
        this.makeFeasible(c);
        var cs = c.axis === 'x' ? this.xConstraints : this.yConstraints;
        c.offsets.slice(1).forEach(function (o) {
            var v = _this.nodes[o.node].variable;
            cs.push(new vpsc_1.Constraint(u, v, o.offset, true));
        });
    };
    Projection.prototype.createConstraints = function (constraints) {
        var _this = this;
        var isSep = function (c) { return typeof c.type === 'undefined' || c.type === 'separation'; };
        this.xConstraints = constraints
            .filter(function (c) { return c.axis === "x" && isSep(c); })
            .map(function (c) { return _this.createSeparation(c); });
        this.yConstraints = constraints
            .filter(function (c) { return c.axis === "y" && isSep(c); })
            .map(function (c) { return _this.createSeparation(c); });
        constraints
            .filter(function (c) { return c.type === 'alignment'; })
            .forEach(function (c) { return _this.createAlignment(c); });
    };
    Projection.prototype.setupVariablesAndBounds = function (x0, y0, desired, getDesired) {
        this.nodes.forEach(function (v, i) {
            if (v.fixed) {
                v.variable.weight = v.fixedWeight ? v.fixedWeight : 1000;
                desired[i] = getDesired(v);
            }
            else {
                v.variable.weight = 1;
            }
            var w = (v.width || 0) / 2, h = (v.height || 0) / 2;
            var ix = x0[i], iy = y0[i];
            v.bounds = new Rectangle(ix - w, ix + w, iy - h, iy + h);
        });
    };
    Projection.prototype.xProject = function (x0, y0, x) {
        if (!this.rootGroup && !(this.avoidOverlaps || this.xConstraints))
            return;
        this.project(x0, y0, x0, x, function (v) { return v.px; }, this.xConstraints, generateXGroupConstraints, function (v) { return v.bounds.setXCentre(x[v.variable.index] = v.variable.position()); }, function (g) {
            var xmin = x[g.minVar.index] = g.minVar.position();
            var xmax = x[g.maxVar.index] = g.maxVar.position();
            var p2 = g.padding / 2;
            g.bounds.x = xmin - p2;
            g.bounds.X = xmax + p2;
        });
    };
    Projection.prototype.yProject = function (x0, y0, y) {
        if (!this.rootGroup && !this.yConstraints)
            return;
        this.project(x0, y0, y0, y, function (v) { return v.py; }, this.yConstraints, generateYGroupConstraints, function (v) { return v.bounds.setYCentre(y[v.variable.index] = v.variable.position()); }, function (g) {
            var ymin = y[g.minVar.index] = g.minVar.position();
            var ymax = y[g.maxVar.index] = g.maxVar.position();
            var p2 = g.padding / 2;
            g.bounds.y = ymin - p2;
            ;
            g.bounds.Y = ymax + p2;
        });
    };
    Projection.prototype.projectFunctions = function () {
        var _this = this;
        return [
            function (x0, y0, x) { return _this.xProject(x0, y0, x); },
            function (x0, y0, y) { return _this.yProject(x0, y0, y); }
        ];
    };
    Projection.prototype.project = function (x0, y0, start, desired, getDesired, cs, generateConstraints, updateNodeBounds, updateGroupBounds) {
        this.setupVariablesAndBounds(x0, y0, desired, getDesired);
        if (this.rootGroup && this.avoidOverlaps) {
            computeGroupBounds(this.rootGroup);
            cs = cs.concat(generateConstraints(this.rootGroup));
        }
        this.solve(this.variables, cs, start, desired);
        this.nodes.forEach(updateNodeBounds);
        if (this.rootGroup && this.avoidOverlaps) {
            this.groups.forEach(updateGroupBounds);
            computeGroupBounds(this.rootGroup);
        }
    };
    Projection.prototype.solve = function (vs, cs, starting, desired) {
        var solver = new vpsc_1.Solver(vs, cs);
        solver.setStartingPositions(starting);
        solver.setDesiredPositions(desired);
        solver.solve();
    };
    return Projection;
}());
exports.Projection = Projection;

},{"./rbtree":16,"./vpsc":19}],18:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var pqueue_1 = require("./pqueue");
var Neighbour = (function () {
    function Neighbour(id, distance) {
        this.id = id;
        this.distance = distance;
    }
    return Neighbour;
}());
var Node = (function () {
    function Node(id) {
        this.id = id;
        this.neighbours = [];
    }
    return Node;
}());
var QueueEntry = (function () {
    function QueueEntry(node, prev, d) {
        this.node = node;
        this.prev = prev;
        this.d = d;
    }
    return QueueEntry;
}());
var Calculator = (function () {
    function Calculator(n, es, getSourceIndex, getTargetIndex, getLength) {
        this.n = n;
        this.es = es;
        this.neighbours = new Array(this.n);
        var i = this.n;
        while (i--)
            this.neighbours[i] = new Node(i);
        i = this.es.length;
        while (i--) {
            var e = this.es[i];
            var u = getSourceIndex(e), v = getTargetIndex(e);
            var d = getLength(e);
            this.neighbours[u].neighbours.push(new Neighbour(v, d));
            this.neighbours[v].neighbours.push(new Neighbour(u, d));
        }
    }
    Calculator.prototype.DistanceMatrix = function () {
        var D = new Array(this.n);
        for (var i = 0; i < this.n; ++i) {
            D[i] = this.dijkstraNeighbours(i);
        }
        return D;
    };
    Calculator.prototype.DistancesFromNode = function (start) {
        return this.dijkstraNeighbours(start);
    };
    Calculator.prototype.PathFromNodeToNode = function (start, end) {
        return this.dijkstraNeighbours(start, end);
    };
    Calculator.prototype.PathFromNodeToNodeWithPrevCost = function (start, end, prevCost) {
        var q = new pqueue_1.PriorityQueue(function (a, b) { return a.d <= b.d; }), u = this.neighbours[start], qu = new QueueEntry(u, null, 0), visitedFrom = {};
        q.push(qu);
        while (!q.empty()) {
            qu = q.pop();
            u = qu.node;
            if (u.id === end) {
                break;
            }
            var i = u.neighbours.length;
            while (i--) {
                var neighbour = u.neighbours[i], v = this.neighbours[neighbour.id];
                if (qu.prev && v.id === qu.prev.node.id)
                    continue;
                var viduid = v.id + ',' + u.id;
                if (viduid in visitedFrom && visitedFrom[viduid] <= qu.d)
                    continue;
                var cc = qu.prev ? prevCost(qu.prev.node.id, u.id, v.id) : 0, t = qu.d + neighbour.distance + cc;
                visitedFrom[viduid] = t;
                q.push(new QueueEntry(v, qu, t));
            }
        }
        var path = [];
        while (qu.prev) {
            qu = qu.prev;
            path.push(qu.node.id);
        }
        return path;
    };
    Calculator.prototype.dijkstraNeighbours = function (start, dest) {
        if (dest === void 0) { dest = -1; }
        var q = new pqueue_1.PriorityQueue(function (a, b) { return a.d <= b.d; }), i = this.neighbours.length, d = new Array(i);
        while (i--) {
            var node = this.neighbours[i];
            node.d = i === start ? 0 : Number.POSITIVE_INFINITY;
            node.q = q.push(node);
        }
        while (!q.empty()) {
            var u = q.pop();
            d[u.id] = u.d;
            if (u.id === dest) {
                var path = [];
                var v = u;
                while (typeof v.prev !== 'undefined') {
                    path.push(v.prev.id);
                    v = v.prev;
                }
                return path;
            }
            i = u.neighbours.length;
            while (i--) {
                var neighbour = u.neighbours[i];
                var v = this.neighbours[neighbour.id];
                var t = u.d + neighbour.distance;
                if (u.d !== Number.MAX_VALUE && v.d > t) {
                    v.d = t;
                    v.prev = u;
                    q.reduceKey(v.q, v, function (e, q) { return e.q = q; });
                }
            }
        }
        return d;
    };
    return Calculator;
}());
exports.Calculator = Calculator;

},{"./pqueue":15}],19:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var PositionStats = (function () {
    function PositionStats(scale) {
        this.scale = scale;
        this.AB = 0;
        this.AD = 0;
        this.A2 = 0;
    }
    PositionStats.prototype.addVariable = function (v) {
        var ai = this.scale / v.scale;
        var bi = v.offset / v.scale;
        var wi = v.weight;
        this.AB += wi * ai * bi;
        this.AD += wi * ai * v.desiredPosition;
        this.A2 += wi * ai * ai;
    };
    PositionStats.prototype.getPosn = function () {
        return (this.AD - this.AB) / this.A2;
    };
    return PositionStats;
}());
exports.PositionStats = PositionStats;
var Constraint = (function () {
    function Constraint(left, right, gap, equality) {
        if (equality === void 0) { equality = false; }
        this.left = left;
        this.right = right;
        this.gap = gap;
        this.equality = equality;
        this.active = false;
        this.unsatisfiable = false;
        this.left = left;
        this.right = right;
        this.gap = gap;
        this.equality = equality;
    }
    Constraint.prototype.slack = function () {
        return this.unsatisfiable ? Number.MAX_VALUE
            : this.right.scale * this.right.position() - this.gap
                - this.left.scale * this.left.position();
    };
    return Constraint;
}());
exports.Constraint = Constraint;
var Variable = (function () {
    function Variable(desiredPosition, weight, scale) {
        if (weight === void 0) { weight = 1; }
        if (scale === void 0) { scale = 1; }
        this.desiredPosition = desiredPosition;
        this.weight = weight;
        this.scale = scale;
        this.offset = 0;
    }
    Variable.prototype.dfdv = function () {
        return 2.0 * this.weight * (this.position() - this.desiredPosition);
    };
    Variable.prototype.position = function () {
        return (this.block.ps.scale * this.block.posn + this.offset) / this.scale;
    };
    Variable.prototype.visitNeighbours = function (prev, f) {
        var ff = function (c, next) { return c.active && prev !== next && f(c, next); };
        this.cOut.forEach(function (c) { return ff(c, c.right); });
        this.cIn.forEach(function (c) { return ff(c, c.left); });
    };
    return Variable;
}());
exports.Variable = Variable;
var Block = (function () {
    function Block(v) {
        this.vars = [];
        v.offset = 0;
        this.ps = new PositionStats(v.scale);
        this.addVariable(v);
    }
    Block.prototype.addVariable = function (v) {
        v.block = this;
        this.vars.push(v);
        this.ps.addVariable(v);
        this.posn = this.ps.getPosn();
    };
    Block.prototype.updateWeightedPosition = function () {
        this.ps.AB = this.ps.AD = this.ps.A2 = 0;
        for (var i = 0, n = this.vars.length; i < n; ++i)
            this.ps.addVariable(this.vars[i]);
        this.posn = this.ps.getPosn();
    };
    Block.prototype.compute_lm = function (v, u, postAction) {
        var _this = this;
        var dfdv = v.dfdv();
        v.visitNeighbours(u, function (c, next) {
            var _dfdv = _this.compute_lm(next, v, postAction);
            if (next === c.right) {
                dfdv += _dfdv * c.left.scale;
                c.lm = _dfdv;
            }
            else {
                dfdv += _dfdv * c.right.scale;
                c.lm = -_dfdv;
            }
            postAction(c);
        });
        return dfdv / v.scale;
    };
    Block.prototype.populateSplitBlock = function (v, prev) {
        var _this = this;
        v.visitNeighbours(prev, function (c, next) {
            next.offset = v.offset + (next === c.right ? c.gap : -c.gap);
            _this.addVariable(next);
            _this.populateSplitBlock(next, v);
        });
    };
    Block.prototype.traverse = function (visit, acc, v, prev) {
        var _this = this;
        if (v === void 0) { v = this.vars[0]; }
        if (prev === void 0) { prev = null; }
        v.visitNeighbours(prev, function (c, next) {
            acc.push(visit(c));
            _this.traverse(visit, acc, next, v);
        });
    };
    Block.prototype.findMinLM = function () {
        var m = null;
        this.compute_lm(this.vars[0], null, function (c) {
            if (!c.equality && (m === null || c.lm < m.lm))
                m = c;
        });
        return m;
    };
    Block.prototype.findMinLMBetween = function (lv, rv) {
        this.compute_lm(lv, null, function () { });
        var m = null;
        this.findPath(lv, null, rv, function (c, next) {
            if (!c.equality && c.right === next && (m === null || c.lm < m.lm))
                m = c;
        });
        return m;
    };
    Block.prototype.findPath = function (v, prev, to, visit) {
        var _this = this;
        var endFound = false;
        v.visitNeighbours(prev, function (c, next) {
            if (!endFound && (next === to || _this.findPath(next, v, to, visit))) {
                endFound = true;
                visit(c, next);
            }
        });
        return endFound;
    };
    Block.prototype.isActiveDirectedPathBetween = function (u, v) {
        if (u === v)
            return true;
        var i = u.cOut.length;
        while (i--) {
            var c = u.cOut[i];
            if (c.active && this.isActiveDirectedPathBetween(c.right, v))
                return true;
        }
        return false;
    };
    Block.split = function (c) {
        c.active = false;
        return [Block.createSplitBlock(c.left), Block.createSplitBlock(c.right)];
    };
    Block.createSplitBlock = function (startVar) {
        var b = new Block(startVar);
        b.populateSplitBlock(startVar, null);
        return b;
    };
    Block.prototype.splitBetween = function (vl, vr) {
        var c = this.findMinLMBetween(vl, vr);
        if (c !== null) {
            var bs = Block.split(c);
            return { constraint: c, lb: bs[0], rb: bs[1] };
        }
        return null;
    };
    Block.prototype.mergeAcross = function (b, c, dist) {
        c.active = true;
        for (var i = 0, n = b.vars.length; i < n; ++i) {
            var v = b.vars[i];
            v.offset += dist;
            this.addVariable(v);
        }
        this.posn = this.ps.getPosn();
    };
    Block.prototype.cost = function () {
        var sum = 0, i = this.vars.length;
        while (i--) {
            var v = this.vars[i], d = v.position() - v.desiredPosition;
            sum += d * d * v.weight;
        }
        return sum;
    };
    return Block;
}());
exports.Block = Block;
var Blocks = (function () {
    function Blocks(vs) {
        this.vs = vs;
        var n = vs.length;
        this.list = new Array(n);
        while (n--) {
            var b = new Block(vs[n]);
            this.list[n] = b;
            b.blockInd = n;
        }
    }
    Blocks.prototype.cost = function () {
        var sum = 0, i = this.list.length;
        while (i--)
            sum += this.list[i].cost();
        return sum;
    };
    Blocks.prototype.insert = function (b) {
        b.blockInd = this.list.length;
        this.list.push(b);
    };
    Blocks.prototype.remove = function (b) {
        var last = this.list.length - 1;
        var swapBlock = this.list[last];
        this.list.length = last;
        if (b !== swapBlock) {
            this.list[b.blockInd] = swapBlock;
            swapBlock.blockInd = b.blockInd;
        }
    };
    Blocks.prototype.merge = function (c) {
        var l = c.left.block, r = c.right.block;
        var dist = c.right.offset - c.left.offset - c.gap;
        if (l.vars.length < r.vars.length) {
            r.mergeAcross(l, c, dist);
            this.remove(l);
        }
        else {
            l.mergeAcross(r, c, -dist);
            this.remove(r);
        }
    };
    Blocks.prototype.forEach = function (f) {
        this.list.forEach(f);
    };
    Blocks.prototype.updateBlockPositions = function () {
        this.list.forEach(function (b) { return b.updateWeightedPosition(); });
    };
    Blocks.prototype.split = function (inactive) {
        var _this = this;
        this.updateBlockPositions();
        this.list.forEach(function (b) {
            var v = b.findMinLM();
            if (v !== null && v.lm < Solver.LAGRANGIAN_TOLERANCE) {
                b = v.left.block;
                Block.split(v).forEach(function (nb) { return _this.insert(nb); });
                _this.remove(b);
                inactive.push(v);
            }
        });
    };
    return Blocks;
}());
exports.Blocks = Blocks;
var Solver = (function () {
    function Solver(vs, cs) {
        this.vs = vs;
        this.cs = cs;
        this.vs = vs;
        vs.forEach(function (v) {
            v.cIn = [], v.cOut = [];
        });
        this.cs = cs;
        cs.forEach(function (c) {
            c.left.cOut.push(c);
            c.right.cIn.push(c);
        });
        this.inactive = cs.map(function (c) { c.active = false; return c; });
        this.bs = null;
    }
    Solver.prototype.cost = function () {
        return this.bs.cost();
    };
    Solver.prototype.setStartingPositions = function (ps) {
        this.inactive = this.cs.map(function (c) { c.active = false; return c; });
        this.bs = new Blocks(this.vs);
        this.bs.forEach(function (b, i) { return b.posn = ps[i]; });
    };
    Solver.prototype.setDesiredPositions = function (ps) {
        this.vs.forEach(function (v, i) { return v.desiredPosition = ps[i]; });
    };
    Solver.prototype.mostViolated = function () {
        var minSlack = Number.MAX_VALUE, v = null, l = this.inactive, n = l.length, deletePoint = n;
        for (var i = 0; i < n; ++i) {
            var c = l[i];
            if (c.unsatisfiable)
                continue;
            var slack = c.slack();
            if (c.equality || slack < minSlack) {
                minSlack = slack;
                v = c;
                deletePoint = i;
                if (c.equality)
                    break;
            }
        }
        if (deletePoint !== n &&
            (minSlack < Solver.ZERO_UPPERBOUND && !v.active || v.equality)) {
            l[deletePoint] = l[n - 1];
            l.length = n - 1;
        }
        return v;
    };
    Solver.prototype.satisfy = function () {
        if (this.bs == null) {
            this.bs = new Blocks(this.vs);
        }
        this.bs.split(this.inactive);
        var v = null;
        while ((v = this.mostViolated()) && (v.equality || v.slack() < Solver.ZERO_UPPERBOUND && !v.active)) {
            var lb = v.left.block, rb = v.right.block;
            if (lb !== rb) {
                this.bs.merge(v);
            }
            else {
                if (lb.isActiveDirectedPathBetween(v.right, v.left)) {
                    v.unsatisfiable = true;
                    continue;
                }
                var split = lb.splitBetween(v.left, v.right);
                if (split !== null) {
                    this.bs.insert(split.lb);
                    this.bs.insert(split.rb);
                    this.bs.remove(lb);
                    this.inactive.push(split.constraint);
                }
                else {
                    v.unsatisfiable = true;
                    continue;
                }
                if (v.slack() >= 0) {
                    this.inactive.push(v);
                }
                else {
                    this.bs.merge(v);
                }
            }
        }
    };
    Solver.prototype.solve = function () {
        this.satisfy();
        var lastcost = Number.MAX_VALUE, cost = this.bs.cost();
        while (Math.abs(lastcost - cost) > 0.0001) {
            this.satisfy();
            lastcost = cost;
            cost = this.bs.cost();
        }
        return cost;
    };
    Solver.LAGRANGIAN_TOLERANCE = -1e-4;
    Solver.ZERO_UPPERBOUND = -1e-10;
    return Solver;
}());
exports.Solver = Solver;
function removeOverlapInOneDimension(spans, lowerBound, upperBound) {
    var vs = spans.map(function (s) { return new Variable(s.desiredCenter); });
    var cs = [];
    var n = spans.length;
    for (var i = 0; i < n - 1; i++) {
        var left = spans[i], right = spans[i + 1];
        cs.push(new Constraint(vs[i], vs[i + 1], (left.size + right.size) / 2));
    }
    var leftMost = vs[0], rightMost = vs[n - 1], leftMostSize = spans[0].size / 2, rightMostSize = spans[n - 1].size / 2;
    var vLower = null, vUpper = null;
    if (lowerBound) {
        vLower = new Variable(lowerBound, leftMost.weight * 1000);
        vs.push(vLower);
        cs.push(new Constraint(vLower, leftMost, leftMostSize));
    }
    if (upperBound) {
        vUpper = new Variable(upperBound, rightMost.weight * 1000);
        vs.push(vUpper);
        cs.push(new Constraint(rightMost, vUpper, rightMostSize));
    }
    var solver = new Solver(vs, cs);
    solver.solve();
    return {
        newCenters: vs.slice(0, spans.length).map(function (v) { return v.position(); }),
        lowerBound: vLower ? vLower.position() : leftMost.position() - leftMostSize,
        upperBound: vUpper ? vUpper.position() : rightMost.position() + rightMostSize
    };
}
exports.removeOverlapInOneDimension = removeOverlapInOneDimension;

},{}]},{},[1])(1)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkaXN0L2luZGV4LmpzIiwiZGlzdC9zcmMvYWRhcHRvci5qcyIsImRpc3Qvc3JjL2JhdGNoLmpzIiwiZGlzdC9zcmMvZDNhZGFwdG9yLmpzIiwiZGlzdC9zcmMvZDN2M2FkYXB0b3IuanMiLCJkaXN0L3NyYy9kM3Y0YWRhcHRvci5qcyIsImRpc3Qvc3JjL2Rlc2NlbnQuanMiLCJkaXN0L3NyYy9nZW9tLmpzIiwiZGlzdC9zcmMvZ3JpZHJvdXRlci5qcyIsImRpc3Qvc3JjL2hhbmRsZWRpc2Nvbm5lY3RlZC5qcyIsImRpc3Qvc3JjL2xheW91dC5qcyIsImRpc3Qvc3JjL2xheW91dDNkLmpzIiwiZGlzdC9zcmMvbGlua2xlbmd0aHMuanMiLCJkaXN0L3NyYy9wb3dlcmdyYXBoLmpzIiwiZGlzdC9zcmMvcHF1ZXVlLmpzIiwiZGlzdC9zcmMvcmJ0cmVlLmpzIiwiZGlzdC9zcmMvcmVjdGFuZ2xlLmpzIiwiZGlzdC9zcmMvc2hvcnRlc3RwYXRocy5qcyIsImRpc3Qvc3JjL3Zwc2MuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2YUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcmlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVpQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1VEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JZQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbmRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiXCJ1c2Ugc3RyaWN0XCI7XG5mdW5jdGlvbiBfX2V4cG9ydChtKSB7XG4gICAgZm9yICh2YXIgcCBpbiBtKSBpZiAoIWV4cG9ydHMuaGFzT3duUHJvcGVydHkocCkpIGV4cG9ydHNbcF0gPSBtW3BdO1xufVxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuX19leHBvcnQocmVxdWlyZShcIi4vc3JjL2FkYXB0b3JcIikpO1xuX19leHBvcnQocmVxdWlyZShcIi4vc3JjL2QzYWRhcHRvclwiKSk7XG5fX2V4cG9ydChyZXF1aXJlKFwiLi9zcmMvZGVzY2VudFwiKSk7XG5fX2V4cG9ydChyZXF1aXJlKFwiLi9zcmMvZ2VvbVwiKSk7XG5fX2V4cG9ydChyZXF1aXJlKFwiLi9zcmMvZ3JpZHJvdXRlclwiKSk7XG5fX2V4cG9ydChyZXF1aXJlKFwiLi9zcmMvaGFuZGxlZGlzY29ubmVjdGVkXCIpKTtcbl9fZXhwb3J0KHJlcXVpcmUoXCIuL3NyYy9sYXlvdXRcIikpO1xuX19leHBvcnQocmVxdWlyZShcIi4vc3JjL2xheW91dDNkXCIpKTtcbl9fZXhwb3J0KHJlcXVpcmUoXCIuL3NyYy9saW5rbGVuZ3Roc1wiKSk7XG5fX2V4cG9ydChyZXF1aXJlKFwiLi9zcmMvcG93ZXJncmFwaFwiKSk7XG5fX2V4cG9ydChyZXF1aXJlKFwiLi9zcmMvcHF1ZXVlXCIpKTtcbl9fZXhwb3J0KHJlcXVpcmUoXCIuL3NyYy9yYnRyZWVcIikpO1xuX19leHBvcnQocmVxdWlyZShcIi4vc3JjL3JlY3RhbmdsZVwiKSk7XG5fX2V4cG9ydChyZXF1aXJlKFwiLi9zcmMvc2hvcnRlc3RwYXRoc1wiKSk7XG5fX2V4cG9ydChyZXF1aXJlKFwiLi9zcmMvdnBzY1wiKSk7XG5fX2V4cG9ydChyZXF1aXJlKFwiLi9zcmMvYmF0Y2hcIikpO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKbWFXeGxJam9pYVc1a1pYZ3Vhbk1pTENKemIzVnlZMlZTYjI5MElqb2lJaXdpYzI5MWNtTmxjeUk2V3lJdUxpOVhaV0pEYjJ4aEwybHVaR1Y0TG5SeklsMHNJbTVoYldWeklqcGJYU3dpYldGd2NHbHVaM01pT2lJN096czdPMEZCUVVFc2JVTkJRVFpDTzBGQlF6ZENMSEZEUVVFclFqdEJRVU12UWl4dFEwRkJOa0k3UVVGRE4wSXNaME5CUVRCQ08wRkJRekZDTEhORFFVRm5RenRCUVVOb1F5dzRRMEZCZDBNN1FVRkRlRU1zYTBOQlFUUkNPMEZCUXpWQ0xHOURRVUU0UWp0QlFVTTVRaXgxUTBGQmFVTTdRVUZEYWtNc2MwTkJRV2RETzBGQlEyaERMR3REUVVFMFFqdEJRVU0xUWl4clEwRkJORUk3UVVGRE5VSXNjVU5CUVN0Q08wRkJReTlDTEhsRFFVRnRRenRCUVVOdVF5eG5RMEZCTUVJN1FVRkRNVUlzYVVOQlFUSkNJbjA9IiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19leHRlbmRzID0gKHRoaXMgJiYgdGhpcy5fX2V4dGVuZHMpIHx8IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGV4dGVuZFN0YXRpY3MgPSBmdW5jdGlvbiAoZCwgYikge1xuICAgICAgICBleHRlbmRTdGF0aWNzID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8XG4gICAgICAgICAgICAoeyBfX3Byb3RvX186IFtdIH0gaW5zdGFuY2VvZiBBcnJheSAmJiBmdW5jdGlvbiAoZCwgYikgeyBkLl9fcHJvdG9fXyA9IGI7IH0pIHx8XG4gICAgICAgICAgICBmdW5jdGlvbiAoZCwgYikgeyBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTsgfTtcbiAgICAgICAgcmV0dXJuIGV4dGVuZFN0YXRpY3MoZCwgYik7XG4gICAgfTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGQsIGIpIHtcbiAgICAgICAgZXh0ZW5kU3RhdGljcyhkLCBiKTtcbiAgICAgICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XG4gICAgICAgIGQucHJvdG90eXBlID0gYiA9PT0gbnVsbCA/IE9iamVjdC5jcmVhdGUoYikgOiAoX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGUsIG5ldyBfXygpKTtcbiAgICB9O1xufSkoKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBsYXlvdXRfMSA9IHJlcXVpcmUoXCIuL2xheW91dFwiKTtcbnZhciBMYXlvdXRBZGFwdG9yID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoTGF5b3V0QWRhcHRvciwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBMYXlvdXRBZGFwdG9yKG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIF90aGlzID0gX3N1cGVyLmNhbGwodGhpcykgfHwgdGhpcztcbiAgICAgICAgdmFyIHNlbGYgPSBfdGhpcztcbiAgICAgICAgdmFyIG8gPSBvcHRpb25zO1xuICAgICAgICBpZiAoby50cmlnZ2VyKSB7XG4gICAgICAgICAgICBfdGhpcy50cmlnZ2VyID0gby50cmlnZ2VyO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvLmtpY2spIHtcbiAgICAgICAgICAgIF90aGlzLmtpY2sgPSBvLmtpY2s7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG8uZHJhZykge1xuICAgICAgICAgICAgX3RoaXMuZHJhZyA9IG8uZHJhZztcbiAgICAgICAgfVxuICAgICAgICBpZiAoby5vbikge1xuICAgICAgICAgICAgX3RoaXMub24gPSBvLm9uO1xuICAgICAgICB9XG4gICAgICAgIF90aGlzLmRyYWdzdGFydCA9IF90aGlzLmRyYWdTdGFydCA9IGxheW91dF8xLkxheW91dC5kcmFnU3RhcnQ7XG4gICAgICAgIF90aGlzLmRyYWdlbmQgPSBfdGhpcy5kcmFnRW5kID0gbGF5b3V0XzEuTGF5b3V0LmRyYWdFbmQ7XG4gICAgICAgIHJldHVybiBfdGhpcztcbiAgICB9XG4gICAgTGF5b3V0QWRhcHRvci5wcm90b3R5cGUudHJpZ2dlciA9IGZ1bmN0aW9uIChlKSB7IH07XG4gICAgO1xuICAgIExheW91dEFkYXB0b3IucHJvdG90eXBlLmtpY2sgPSBmdW5jdGlvbiAoKSB7IH07XG4gICAgO1xuICAgIExheW91dEFkYXB0b3IucHJvdG90eXBlLmRyYWcgPSBmdW5jdGlvbiAoKSB7IH07XG4gICAgO1xuICAgIExheW91dEFkYXB0b3IucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gKGV2ZW50VHlwZSwgbGlzdGVuZXIpIHsgcmV0dXJuIHRoaXM7IH07XG4gICAgO1xuICAgIHJldHVybiBMYXlvdXRBZGFwdG9yO1xufShsYXlvdXRfMS5MYXlvdXQpKTtcbmV4cG9ydHMuTGF5b3V0QWRhcHRvciA9IExheW91dEFkYXB0b3I7XG5mdW5jdGlvbiBhZGFwdG9yKG9wdGlvbnMpIHtcbiAgICByZXR1cm4gbmV3IExheW91dEFkYXB0b3Iob3B0aW9ucyk7XG59XG5leHBvcnRzLmFkYXB0b3IgPSBhZGFwdG9yO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKbWFXeGxJam9pWVdSaGNIUnZjaTVxY3lJc0luTnZkWEpqWlZKdmIzUWlPaUlpTENKemIzVnlZMlZ6SWpwYklpNHVMeTR1TDFkbFlrTnZiR0V2YzNKakwyRmtZWEIwYjNJdWRITWlYU3dpYm1GdFpYTWlPbHRkTENKdFlYQndhVzVuY3lJNklqczdPenM3T3pzN096czdPenM3TzBGQlFVRXNiVU5CUVdsRU8wRkJSVGRETzBsQlFXMURMR2xEUVVGTk8wbEJZWEpETEhWQ1FVRmhMRTlCUVU4N1VVRkJjRUlzV1VGRFNTeHBRa0ZCVHl4VFFYbENWanRSUVhKQ1J5eEpRVUZKTEVsQlFVa3NSMEZCUnl4TFFVRkpMRU5CUVVNN1VVRkRhRUlzU1VGQlNTeERRVUZETEVkQlFVY3NUMEZCVHl4RFFVRkRPMUZCUldoQ0xFbEJRVXNzUTBGQlF5eERRVUZETEU5QlFVOHNSVUZCUnp0WlFVTmlMRXRCUVVrc1EwRkJReXhQUVVGUExFZEJRVWNzUTBGQlF5eERRVUZETEU5QlFVOHNRMEZCUXp0VFFVTTFRanRSUVVWRUxFbEJRVXNzUTBGQlF5eERRVUZETEVsQlFVa3NSVUZCUlR0WlFVTlVMRXRCUVVrc1EwRkJReXhKUVVGSkxFZEJRVWNzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXp0VFFVTjBRanRSUVVWRUxFbEJRVXNzUTBGQlF5eERRVUZETEVsQlFVa3NSVUZCUlR0WlFVTlVMRXRCUVVrc1EwRkJReXhKUVVGSkxFZEJRVWNzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXp0VFFVTjBRanRSUVVWRUxFbEJRVXNzUTBGQlF5eERRVUZETEVWQlFVVXNSVUZCUlR0WlFVTlFMRXRCUVVrc1EwRkJReXhGUVVGRkxFZEJRVWNzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXp0VFFVTnNRanRSUVVWRUxFdEJRVWtzUTBGQlF5eFRRVUZUTEVkQlFVY3NTMEZCU1N4RFFVRkRMRk5CUVZNc1IwRkJSeXhsUVVGTkxFTkJRVU1zVTBGQlV5eERRVUZETzFGQlEyNUVMRXRCUVVrc1EwRkJReXhQUVVGUExFZEJRVWNzUzBGQlNTeERRVUZETEU5QlFVOHNSMEZCUnl4bFFVRk5MRU5CUVVNc1QwRkJUeXhEUVVGRE96dEpRVU5xUkN4RFFVRkRPMGxCY0VORUxDdENRVUZQTEVkQlFWQXNWVUZCVVN4RFFVRlJMRWxCUVVjc1EwRkJRenRKUVVGQkxFTkJRVU03U1VGRGNrSXNORUpCUVVrc1IwRkJTaXhqUVVGUkxFTkJRVU03U1VGQlFTeERRVUZETzBsQlExWXNORUpCUVVrc1IwRkJTaXhqUVVGUkxFTkJRVU03U1VGQlFTeERRVUZETzBsQlExWXNNRUpCUVVVc1IwRkJSaXhWUVVGSExGTkJRVFpDTEVWQlFVVXNVVUZCYjBJc1NVRkJWeXhQUVVGUExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTTdTVUZCUVN4RFFVRkRPMGxCYTBOd1JpeHZRa0ZCUXp0QlFVRkVMRU5CUVVNc1FVRjRRMFFzUTBGQmJVTXNaVUZCVFN4SFFYZERlRU03UVVGNFExa3NjME5CUVdFN1FVRTJRekZDTEZOQlFXZENMRTlCUVU4c1EwRkJSU3hQUVVGUE8wbEJRelZDTEU5QlFVOHNTVUZCU1N4aFFVRmhMRU5CUVVVc1QwRkJUeXhEUVVGRkxFTkJRVU03UVVGRGVFTXNRMEZCUXp0QlFVWkVMREJDUVVWREluMD0iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBsYXlvdXRfMSA9IHJlcXVpcmUoXCIuL2xheW91dFwiKTtcbnZhciBncmlkcm91dGVyXzEgPSByZXF1aXJlKFwiLi9ncmlkcm91dGVyXCIpO1xuZnVuY3Rpb24gZ3JpZGlmeShwZ0xheW91dCwgbnVkZ2VHYXAsIG1hcmdpbiwgZ3JvdXBNYXJnaW4pIHtcbiAgICBwZ0xheW91dC5jb2xhLnN0YXJ0KDAsIDAsIDAsIDEwLCBmYWxzZSk7XG4gICAgdmFyIGdyaWRyb3V0ZXIgPSByb3V0ZShwZ0xheW91dC5jb2xhLm5vZGVzKCksIHBnTGF5b3V0LmNvbGEuZ3JvdXBzKCksIG1hcmdpbiwgZ3JvdXBNYXJnaW4pO1xuICAgIHJldHVybiBncmlkcm91dGVyLnJvdXRlRWRnZXMocGdMYXlvdXQucG93ZXJHcmFwaC5wb3dlckVkZ2VzLCBudWRnZUdhcCwgZnVuY3Rpb24gKGUpIHsgcmV0dXJuIGUuc291cmNlLnJvdXRlck5vZGUuaWQ7IH0sIGZ1bmN0aW9uIChlKSB7IHJldHVybiBlLnRhcmdldC5yb3V0ZXJOb2RlLmlkOyB9KTtcbn1cbmV4cG9ydHMuZ3JpZGlmeSA9IGdyaWRpZnk7XG5mdW5jdGlvbiByb3V0ZShub2RlcywgZ3JvdXBzLCBtYXJnaW4sIGdyb3VwTWFyZ2luKSB7XG4gICAgbm9kZXMuZm9yRWFjaChmdW5jdGlvbiAoZCkge1xuICAgICAgICBkLnJvdXRlck5vZGUgPSB7XG4gICAgICAgICAgICBuYW1lOiBkLm5hbWUsXG4gICAgICAgICAgICBib3VuZHM6IGQuYm91bmRzLmluZmxhdGUoLW1hcmdpbilcbiAgICAgICAgfTtcbiAgICB9KTtcbiAgICBncm91cHMuZm9yRWFjaChmdW5jdGlvbiAoZCkge1xuICAgICAgICBkLnJvdXRlck5vZGUgPSB7XG4gICAgICAgICAgICBib3VuZHM6IGQuYm91bmRzLmluZmxhdGUoLWdyb3VwTWFyZ2luKSxcbiAgICAgICAgICAgIGNoaWxkcmVuOiAodHlwZW9mIGQuZ3JvdXBzICE9PSAndW5kZWZpbmVkJyA/IGQuZ3JvdXBzLm1hcChmdW5jdGlvbiAoYykgeyByZXR1cm4gbm9kZXMubGVuZ3RoICsgYy5pZDsgfSkgOiBbXSlcbiAgICAgICAgICAgICAgICAuY29uY2F0KHR5cGVvZiBkLmxlYXZlcyAhPT0gJ3VuZGVmaW5lZCcgPyBkLmxlYXZlcy5tYXAoZnVuY3Rpb24gKGMpIHsgcmV0dXJuIGMuaW5kZXg7IH0pIDogW10pXG4gICAgICAgIH07XG4gICAgfSk7XG4gICAgdmFyIGdyaWRSb3V0ZXJOb2RlcyA9IG5vZGVzLmNvbmNhdChncm91cHMpLm1hcChmdW5jdGlvbiAoZCwgaSkge1xuICAgICAgICBkLnJvdXRlck5vZGUuaWQgPSBpO1xuICAgICAgICByZXR1cm4gZC5yb3V0ZXJOb2RlO1xuICAgIH0pO1xuICAgIHJldHVybiBuZXcgZ3JpZHJvdXRlcl8xLkdyaWRSb3V0ZXIoZ3JpZFJvdXRlck5vZGVzLCB7XG4gICAgICAgIGdldENoaWxkcmVuOiBmdW5jdGlvbiAodikgeyByZXR1cm4gdi5jaGlsZHJlbjsgfSxcbiAgICAgICAgZ2V0Qm91bmRzOiBmdW5jdGlvbiAodikgeyByZXR1cm4gdi5ib3VuZHM7IH1cbiAgICB9LCBtYXJnaW4gLSBncm91cE1hcmdpbik7XG59XG5mdW5jdGlvbiBwb3dlckdyYXBoR3JpZExheW91dChncmFwaCwgc2l6ZSwgZ3JvdXBwYWRkaW5nKSB7XG4gICAgdmFyIHBvd2VyR3JhcGg7XG4gICAgZ3JhcGgubm9kZXMuZm9yRWFjaChmdW5jdGlvbiAodiwgaSkgeyByZXR1cm4gdi5pbmRleCA9IGk7IH0pO1xuICAgIG5ldyBsYXlvdXRfMS5MYXlvdXQoKVxuICAgICAgICAuYXZvaWRPdmVybGFwcyhmYWxzZSlcbiAgICAgICAgLm5vZGVzKGdyYXBoLm5vZGVzKVxuICAgICAgICAubGlua3MoZ3JhcGgubGlua3MpXG4gICAgICAgIC5wb3dlckdyYXBoR3JvdXBzKGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIHBvd2VyR3JhcGggPSBkO1xuICAgICAgICBwb3dlckdyYXBoLmdyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7IHJldHVybiB2LnBhZGRpbmcgPSBncm91cHBhZGRpbmc7IH0pO1xuICAgIH0pO1xuICAgIHZhciBuID0gZ3JhcGgubm9kZXMubGVuZ3RoO1xuICAgIHZhciBlZGdlcyA9IFtdO1xuICAgIHZhciB2cyA9IGdyYXBoLm5vZGVzLnNsaWNlKDApO1xuICAgIHZzLmZvckVhY2goZnVuY3Rpb24gKHYsIGkpIHsgcmV0dXJuIHYuaW5kZXggPSBpOyB9KTtcbiAgICBwb3dlckdyYXBoLmdyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uIChnKSB7XG4gICAgICAgIHZhciBzb3VyY2VJbmQgPSBnLmluZGV4ID0gZy5pZCArIG47XG4gICAgICAgIHZzLnB1c2goZyk7XG4gICAgICAgIGlmICh0eXBlb2YgZy5sZWF2ZXMgIT09ICd1bmRlZmluZWQnKVxuICAgICAgICAgICAgZy5sZWF2ZXMuZm9yRWFjaChmdW5jdGlvbiAodikgeyByZXR1cm4gZWRnZXMucHVzaCh7IHNvdXJjZTogc291cmNlSW5kLCB0YXJnZXQ6IHYuaW5kZXggfSk7IH0pO1xuICAgICAgICBpZiAodHlwZW9mIGcuZ3JvdXBzICE9PSAndW5kZWZpbmVkJylcbiAgICAgICAgICAgIGcuZ3JvdXBzLmZvckVhY2goZnVuY3Rpb24gKGdnKSB7IHJldHVybiBlZGdlcy5wdXNoKHsgc291cmNlOiBzb3VyY2VJbmQsIHRhcmdldDogZ2cuaWQgKyBuIH0pOyB9KTtcbiAgICB9KTtcbiAgICBwb3dlckdyYXBoLnBvd2VyRWRnZXMuZm9yRWFjaChmdW5jdGlvbiAoZSkge1xuICAgICAgICBlZGdlcy5wdXNoKHsgc291cmNlOiBlLnNvdXJjZS5pbmRleCwgdGFyZ2V0OiBlLnRhcmdldC5pbmRleCB9KTtcbiAgICB9KTtcbiAgICBuZXcgbGF5b3V0XzEuTGF5b3V0KClcbiAgICAgICAgLnNpemUoc2l6ZSlcbiAgICAgICAgLm5vZGVzKHZzKVxuICAgICAgICAubGlua3MoZWRnZXMpXG4gICAgICAgIC5hdm9pZE92ZXJsYXBzKGZhbHNlKVxuICAgICAgICAubGlua0Rpc3RhbmNlKDMwKVxuICAgICAgICAuc3ltbWV0cmljRGlmZkxpbmtMZW5ndGhzKDUpXG4gICAgICAgIC5jb252ZXJnZW5jZVRocmVzaG9sZCgxZS00KVxuICAgICAgICAuc3RhcnQoMTAwLCAwLCAwLCAwLCBmYWxzZSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgY29sYTogbmV3IGxheW91dF8xLkxheW91dCgpXG4gICAgICAgICAgICAuY29udmVyZ2VuY2VUaHJlc2hvbGQoMWUtMylcbiAgICAgICAgICAgIC5zaXplKHNpemUpXG4gICAgICAgICAgICAuYXZvaWRPdmVybGFwcyh0cnVlKVxuICAgICAgICAgICAgLm5vZGVzKGdyYXBoLm5vZGVzKVxuICAgICAgICAgICAgLmxpbmtzKGdyYXBoLmxpbmtzKVxuICAgICAgICAgICAgLmdyb3VwQ29tcGFjdG5lc3MoMWUtNClcbiAgICAgICAgICAgIC5saW5rRGlzdGFuY2UoMzApXG4gICAgICAgICAgICAuc3ltbWV0cmljRGlmZkxpbmtMZW5ndGhzKDUpXG4gICAgICAgICAgICAucG93ZXJHcmFwaEdyb3VwcyhmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgcG93ZXJHcmFwaCA9IGQ7XG4gICAgICAgICAgICBwb3dlckdyYXBoLmdyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICAgICAgdi5wYWRkaW5nID0gZ3JvdXBwYWRkaW5nO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pLnN0YXJ0KDUwLCAwLCAxMDAsIDAsIGZhbHNlKSxcbiAgICAgICAgcG93ZXJHcmFwaDogcG93ZXJHcmFwaFxuICAgIH07XG59XG5leHBvcnRzLnBvd2VyR3JhcGhHcmlkTGF5b3V0ID0gcG93ZXJHcmFwaEdyaWRMYXlvdXQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0ptYVd4bElqb2lZbUYwWTJndWFuTWlMQ0p6YjNWeVkyVlNiMjkwSWpvaUlpd2ljMjkxY21ObGN5STZXeUl1TGk4dUxpOVhaV0pEYjJ4aEwzTnlZeTlpWVhSamFDNTBjeUpkTENKdVlXMWxjeUk2VzEwc0ltMWhjSEJwYm1keklqb2lPenRCUVVGQkxHMURRVUV5UXp0QlFVTXpReXd5UTBGQmRVTTdRVUZSZGtNc1UwRkJaMElzVDBGQlR5eERRVUZETEZGQlFWRXNSVUZCUlN4UlFVRm5RaXhGUVVGRkxFMUJRV01zUlVGQlJTeFhRVUZ0UWp0SlFVTnVSaXhSUVVGUkxFTkJRVU1zU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFTkJRVU1zUlVGQlJTeEZRVUZGTEVWQlFVVXNTMEZCU3l4RFFVRkRMRU5CUVVNN1NVRkRlRU1zU1VGQlNTeFZRVUZWTEVkQlFVY3NTMEZCU3l4RFFVRkRMRkZCUVZFc1EwRkJReXhKUVVGSkxFTkJRVU1zUzBGQlN5eEZRVUZGTEVWQlFVVXNVVUZCVVN4RFFVRkRMRWxCUVVrc1EwRkJReXhOUVVGTkxFVkJRVVVzUlVGQlJTeE5RVUZOTEVWQlFVVXNWMEZCVnl4RFFVRkRMRU5CUVVNN1NVRkRNMFlzVDBGQlR5eFZRVUZWTEVOQlFVTXNWVUZCVlN4RFFVRk5MRkZCUVZFc1EwRkJReXhWUVVGVkxFTkJRVU1zVlVGQlZTeEZRVUZGTEZGQlFWRXNSVUZCUlN4VlFVRkJMRU5CUVVNc1NVRkJSeXhQUVVGQkxFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNWVUZCVlN4RFFVRkRMRVZCUVVVc1JVRkJkRUlzUTBGQmMwSXNSVUZCUlN4VlFVRkJMRU5CUVVNc1NVRkJSeXhQUVVGQkxFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNWVUZCVlN4RFFVRkRMRVZCUVVVc1JVRkJkRUlzUTBGQmMwSXNRMEZCUXl4RFFVRkRPMEZCUTNoSkxFTkJRVU03UVVGS1JDd3dRa0ZKUXp0QlFVVkVMRk5CUVZNc1MwRkJTeXhEUVVGRExFdEJRVXNzUlVGQlJTeE5RVUZOTEVWQlFVVXNUVUZCWXl4RlFVRkZMRmRCUVcxQ08wbEJRemRFTEV0QlFVc3NRMEZCUXl4UFFVRlBMRU5CUVVNc1ZVRkJRU3hEUVVGRE8xRkJRMWdzUTBGQlF5eERRVUZETEZWQlFWVXNSMEZCVVR0WlFVTm9RaXhKUVVGSkxFVkJRVVVzUTBGQlF5eERRVUZETEVsQlFVazdXVUZEV2l4TlFVRk5MRVZCUVVVc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF5eFBRVUZQTEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNN1UwRkRjRU1zUTBGQlF6dEpRVU5PTEVOQlFVTXNRMEZCUXl4RFFVRkRPMGxCUTBnc1RVRkJUU3hEUVVGRExFOUJRVThzUTBGQlF5eFZRVUZCTEVOQlFVTTdVVUZEV2l4RFFVRkRMRU5CUVVNc1ZVRkJWU3hIUVVGUk8xbEJRMmhDTEUxQlFVMHNSVUZCUlN4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExFOUJRVThzUTBGQlF5eERRVUZETEZkQlFWY3NRMEZCUXp0WlFVTjBReXhSUVVGUkxFVkJRVVVzUTBGQlF5eFBRVUZQTEVOQlFVTXNRMEZCUXl4TlFVRk5MRXRCUVVzc1YwRkJWeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMRWRCUVVjc1EwRkJReXhWUVVGQkxFTkJRVU1zU1VGQlJ5eFBRVUZCTEV0QlFVc3NRMEZCUXl4TlFVRk5MRWRCUVVjc1EwRkJReXhEUVVGRExFVkJRVVVzUlVGQmJrSXNRMEZCYlVJc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTTdhVUpCUTI1R0xFMUJRVTBzUTBGQlF5eFBRVUZQTEVOQlFVTXNRMEZCUXl4TlFVRk5MRXRCUVVzc1YwRkJWeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMRWRCUVVjc1EwRkJReXhWUVVGQkxFTkJRVU1zU1VGQlJ5eFBRVUZCTEVOQlFVTXNRMEZCUXl4TFFVRkxMRVZCUVZBc1EwRkJUeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXp0VFFVTm9SaXhEUVVGRE8wbEJRMDRzUTBGQlF5eERRVUZETEVOQlFVTTdTVUZEU0N4SlFVRkpMR1ZCUVdVc1IwRkJSeXhMUVVGTExFTkJRVU1zVFVGQlRTeERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhWUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETzFGQlEyaEVMRU5CUVVNc1EwRkJReXhWUVVGVkxFTkJRVU1zUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXp0UlFVTndRaXhQUVVGUExFTkJRVU1zUTBGQlF5eFZRVUZWTEVOQlFVTTdTVUZEZUVJc1EwRkJReXhEUVVGRExFTkJRVU03U1VGRFNDeFBRVUZQTEVsQlFVa3NkVUpCUVZVc1EwRkJReXhsUVVGbExFVkJRVVU3VVVGRGJrTXNWMEZCVnl4RlFVRkZMRlZCUVVNc1EwRkJUU3hKUVVGTExFOUJRVUVzUTBGQlF5eERRVUZETEZGQlFWRXNSVUZCVml4RFFVRlZPMUZCUTI1RExGTkJRVk1zUlVGQlJTeFZRVUZCTEVOQlFVTXNTVUZCU1N4UFFVRkJMRU5CUVVNc1EwRkJReXhOUVVGTkxFVkJRVklzUTBGQlVUdExRVU16UWl4RlFVRkZMRTFCUVUwc1IwRkJSeXhYUVVGWExFTkJRVU1zUTBGQlF6dEJRVU0zUWl4RFFVRkRPMEZCUlVRc1UwRkJaMElzYjBKQlFXOUNMRU5CUTJoRExFdEJRVFpETEVWQlF6ZERMRWxCUVdNc1JVRkRaQ3haUVVGdlFqdEpRVWR3UWl4SlFVRkpMRlZCUVZVc1EwRkJRenRKUVVObUxFdEJRVXNzUTBGQlF5eExRVUZMTEVOQlFVTXNUMEZCVHl4RFFVRkRMRlZCUVVNc1EwRkJReXhGUVVGRExFTkJRVU1zU1VGQlN5eFBRVUZOTEVOQlFVVXNRMEZCUXl4TFFVRkxMRWRCUVVjc1EwRkJReXhGUVVGc1FpeERRVUZyUWl4RFFVRkRMRU5CUVVNN1NVRkRha1FzU1VGQlNTeGxRVUZOTEVWQlFVVTdVMEZEVUN4aFFVRmhMRU5CUVVNc1MwRkJTeXhEUVVGRE8xTkJRM0JDTEV0QlFVc3NRMEZCUXl4TFFVRkxMRU5CUVVNc1MwRkJTeXhEUVVGRE8xTkJRMnhDTEV0QlFVc3NRMEZCUXl4TFFVRkxMRU5CUVVNc1MwRkJTeXhEUVVGRE8xTkJRMnhDTEdkQ1FVRm5RaXhEUVVGRExGVkJRVlVzUTBGQlF6dFJRVU42UWl4VlFVRlZMRWRCUVVjc1EwRkJReXhEUVVGRE8xRkJRMllzVlVGQlZTeERRVUZETEUxQlFVMHNRMEZCUXl4UFFVRlBMRU5CUVVNc1ZVRkJRU3hEUVVGRExFbEJRVWNzVDBGQlFTeERRVUZETEVOQlFVTXNUMEZCVHl4SFFVRkhMRmxCUVZrc1JVRkJlRUlzUTBGQmQwSXNRMEZCUXl4RFFVRkRPMGxCUXpWRUxFTkJRVU1zUTBGQlF5eERRVUZETzBsQlNWQXNTVUZCU1N4RFFVRkRMRWRCUVVjc1MwRkJTeXhEUVVGRExFdEJRVXNzUTBGQlF5eE5RVUZOTEVOQlFVTTdTVUZETTBJc1NVRkJTU3hMUVVGTExFZEJRVWNzUlVGQlJTeERRVUZETzBsQlEyWXNTVUZCU1N4RlFVRkZMRWRCUVVjc1MwRkJTeXhEUVVGRExFdEJRVXNzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1NVRkRPVUlzUlVGQlJTeERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFbEJRVXNzVDBGQlRTeERRVUZGTEVOQlFVTXNTMEZCU3l4SFFVRkhMRU5CUVVNc1JVRkJiRUlzUTBGQmEwSXNRMEZCUXl4RFFVRkRPMGxCUTNwRExGVkJRVlVzUTBGQlF5eE5RVUZOTEVOQlFVTXNUMEZCVHl4RFFVRkRMRlZCUVVFc1EwRkJRenRSUVVOMlFpeEpRVUZKTEZOQlFWTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1MwRkJTeXhIUVVGSExFTkJRVU1zUTBGQlF5eEZRVUZGTEVkQlFVY3NRMEZCUXl4RFFVRkRPMUZCUTI1RExFVkJRVVVzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRXQ3hKUVVGSkxFOUJRVThzUTBGQlF5eERRVUZETEUxQlFVMHNTMEZCU3l4WFFVRlhPMWxCUXk5Q0xFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNUMEZCVHl4RFFVRkRMRlZCUVVFc1EwRkJReXhKUVVGSkxFOUJRVUVzUzBGQlN5eERRVUZETEVsQlFVa3NRMEZCUXl4RlFVRkZMRTFCUVUwc1JVRkJSU3hUUVVGVExFVkJRVVVzVFVGQlRTeEZRVUZGTEVOQlFVTXNRMEZCUXl4TFFVRkxMRVZCUVVVc1EwRkJReXhGUVVGc1JDeERRVUZyUkN4RFFVRkRMRU5CUVVNN1VVRkRPVVVzU1VGQlNTeFBRVUZQTEVOQlFVTXNRMEZCUXl4TlFVRk5MRXRCUVVzc1YwRkJWenRaUVVNdlFpeERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMRTlCUVU4c1EwRkJReXhWUVVGQkxFVkJRVVVzU1VGQlNTeFBRVUZCTEV0QlFVc3NRMEZCUXl4SlFVRkpMRU5CUVVNc1JVRkJSU3hOUVVGTkxFVkJRVVVzVTBGQlV5eEZRVUZGTEUxQlFVMHNSVUZCUlN4RlFVRkZMRU5CUVVNc1JVRkJSU3hIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFYQkVMRU5CUVc5RUxFTkJRVU1zUTBGQlF6dEpRVU55Uml4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVOSUxGVkJRVlVzUTBGQlF5eFZRVUZWTEVOQlFVTXNUMEZCVHl4RFFVRkRMRlZCUVVFc1EwRkJRenRSUVVNelFpeExRVUZMTEVOQlFVTXNTVUZCU1N4RFFVRkRMRVZCUVVVc1RVRkJUU3hGUVVGRkxFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNTMEZCU3l4RlFVRkZMRTFCUVUwc1JVRkJSU3hEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEV0QlFVc3NSVUZCUlN4RFFVRkRMRU5CUVVNN1NVRkRia1VzUTBGQlF5eERRVUZETEVOQlFVTTdTVUZIU0N4SlFVRkpMR1ZCUVUwc1JVRkJSVHRUUVVOUUxFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTTdVMEZEVml4TFFVRkxMRU5CUVVNc1JVRkJSU3hEUVVGRE8xTkJRMVFzUzBGQlN5eERRVUZETEV0QlFVc3NRMEZCUXp0VFFVTmFMR0ZCUVdFc1EwRkJReXhMUVVGTExFTkJRVU03VTBGRGNFSXNXVUZCV1N4RFFVRkRMRVZCUVVVc1EwRkJRenRUUVVOb1FpeDNRa0ZCZDBJc1EwRkJReXhEUVVGRExFTkJRVU03VTBGRE0wSXNiMEpCUVc5Q0xFTkJRVU1zU1VGQlNTeERRVUZETzFOQlF6RkNMRXRCUVVzc1EwRkJReXhIUVVGSExFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4RFFVRkRMRVZCUVVVc1MwRkJTeXhEUVVGRExFTkJRVU03U1VGTGFFTXNUMEZCVHp0UlFVTklMRWxCUVVrc1JVRkRRU3hKUVVGSkxHVkJRVTBzUlVGQlJUdGhRVU5ZTEc5Q1FVRnZRaXhEUVVGRExFbEJRVWtzUTBGQlF6dGhRVU14UWl4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRE8yRkJRMVlzWVVGQllTeERRVUZETEVsQlFVa3NRMEZCUXp0aFFVTnVRaXhMUVVGTExFTkJRVU1zUzBGQlN5eERRVUZETEV0QlFVc3NRMEZCUXp0aFFVTnNRaXhMUVVGTExFTkJRVU1zUzBGQlN5eERRVUZETEV0QlFVc3NRMEZCUXp0aFFVVnNRaXhuUWtGQlowSXNRMEZCUXl4SlFVRkpMRU5CUVVNN1lVRkRkRUlzV1VGQldTeERRVUZETEVWQlFVVXNRMEZCUXp0aFFVTm9RaXgzUWtGQmQwSXNRMEZCUXl4RFFVRkRMRU5CUVVNN1lVRkRNMElzWjBKQlFXZENMRU5CUVVNc1ZVRkJWU3hEUVVGRE8xbEJRM3BDTEZWQlFWVXNSMEZCUnl4RFFVRkRMRU5CUVVNN1dVRkRaaXhWUVVGVkxFTkJRVU1zVFVGQlRTeERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRlZMRU5CUVVNN1owSkJRMnBETEVOQlFVTXNRMEZCUXl4UFFVRlBMRWRCUVVjc1dVRkJXU3hEUVVGQk8xbEJRelZDTEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTFBc1EwRkJReXhEUVVGRExFTkJRVU1zUzBGQlN5eERRVUZETEVWQlFVVXNSVUZCUlN4RFFVRkRMRVZCUVVVc1IwRkJSeXhGUVVGRkxFTkJRVU1zUlVGQlJTeExRVUZMTEVOQlFVTTdVVUZEYkVNc1ZVRkJWU3hGUVVGRkxGVkJRVlU3UzBGRGVrSXNRMEZCUXp0QlFVTk9MRU5CUVVNN1FVRnlSVVFzYjBSQmNVVkRJbjA9IiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgZDN2MyA9IHJlcXVpcmUoXCIuL2QzdjNhZGFwdG9yXCIpO1xudmFyIGQzdjQgPSByZXF1aXJlKFwiLi9kM3Y0YWRhcHRvclwiKTtcbjtcbmZ1bmN0aW9uIGQzYWRhcHRvcihkM0NvbnRleHQpIHtcbiAgICBpZiAoIWQzQ29udGV4dCB8fCBpc0QzVjMoZDNDb250ZXh0KSkge1xuICAgICAgICByZXR1cm4gbmV3IGQzdjMuRDNTdHlsZUxheW91dEFkYXB0b3IoKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBkM3Y0LkQzU3R5bGVMYXlvdXRBZGFwdG9yKGQzQ29udGV4dCk7XG59XG5leHBvcnRzLmQzYWRhcHRvciA9IGQzYWRhcHRvcjtcbmZ1bmN0aW9uIGlzRDNWMyhkM0NvbnRleHQpIHtcbiAgICB2YXIgdjNleHAgPSAvXjNcXC4vO1xuICAgIHJldHVybiBkM0NvbnRleHQudmVyc2lvbiAmJiBkM0NvbnRleHQudmVyc2lvbi5tYXRjaCh2M2V4cCkgIT09IG51bGw7XG59XG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0ptYVd4bElqb2laRE5oWkdGd2RHOXlMbXB6SWl3aWMyOTFjbU5sVW05dmRDSTZJaUlzSW5OdmRYSmpaWE1pT2xzaUxpNHZMaTR2VjJWaVEyOXNZUzl6Y21NdlpETmhaR0Z3ZEc5eUxuUnpJbDBzSW01aGJXVnpJanBiWFN3aWJXRndjR2x1WjNNaU9pSTdPMEZCUVVFc2IwTkJRWEZETzBGQlEzSkRMRzlEUVVGeFF6dEJRVWRWTEVOQlFVTTdRVUUwUW1oRUxGTkJRV2RDTEZOQlFWTXNRMEZCUXl4VFFVRjNRenRKUVVNNVJDeEpRVUZKTEVOQlFVTXNVMEZCVXl4SlFVRkpMRTFCUVUwc1EwRkJReXhUUVVGVExFTkJRVU1zUlVGQlJUdFJRVU5xUXl4UFFVRlBMRWxCUVVrc1NVRkJTU3hEUVVGRExHOUNRVUZ2UWl4RlFVRkZMRU5CUVVNN1MwRkRNVU03U1VGRFJDeFBRVUZQTEVsQlFVa3NTVUZCU1N4RFFVRkRMRzlDUVVGdlFpeERRVUZETEZOQlFWTXNRMEZCUXl4RFFVRkRPMEZCUTNCRUxFTkJRVU03UVVGTVJDdzRRa0ZMUXp0QlFVVkVMRk5CUVZNc1RVRkJUU3hEUVVGRExGTkJRWFZETzBsQlEyNUVMRWxCUVUwc1MwRkJTeXhIUVVGSExFMUJRVTBzUTBGQlF6dEpRVU55UWl4UFFVRmhMRk5CUVZVc1EwRkJReXhQUVVGUExFbEJRVlVzVTBGQlZTeERRVUZETEU5QlFVOHNRMEZCUXl4TFFVRkxMRU5CUVVNc1MwRkJTeXhEUVVGRExFdEJRVXNzU1VGQlNTeERRVUZETzBGQlEzUkdMRU5CUVVNaWZRPT0iLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2V4dGVuZHMgPSAodGhpcyAmJiB0aGlzLl9fZXh0ZW5kcykgfHwgKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZXh0ZW5kU3RhdGljcyA9IGZ1bmN0aW9uIChkLCBiKSB7XG4gICAgICAgIGV4dGVuZFN0YXRpY3MgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgfHxcbiAgICAgICAgICAgICh7IF9fcHJvdG9fXzogW10gfSBpbnN0YW5jZW9mIEFycmF5ICYmIGZ1bmN0aW9uIChkLCBiKSB7IGQuX19wcm90b19fID0gYjsgfSkgfHxcbiAgICAgICAgICAgIGZ1bmN0aW9uIChkLCBiKSB7IGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdOyB9O1xuICAgICAgICByZXR1cm4gZXh0ZW5kU3RhdGljcyhkLCBiKTtcbiAgICB9O1xuICAgIHJldHVybiBmdW5jdGlvbiAoZCwgYikge1xuICAgICAgICBleHRlbmRTdGF0aWNzKGQsIGIpO1xuICAgICAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cbiAgICAgICAgZC5wcm90b3R5cGUgPSBiID09PSBudWxsID8gT2JqZWN0LmNyZWF0ZShiKSA6IChfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZSwgbmV3IF9fKCkpO1xuICAgIH07XG59KSgpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIGxheW91dF8xID0gcmVxdWlyZShcIi4vbGF5b3V0XCIpO1xudmFyIEQzU3R5bGVMYXlvdXRBZGFwdG9yID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoRDNTdHlsZUxheW91dEFkYXB0b3IsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gRDNTdHlsZUxheW91dEFkYXB0b3IoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMpIHx8IHRoaXM7XG4gICAgICAgIF90aGlzLmV2ZW50ID0gZDMuZGlzcGF0Y2gobGF5b3V0XzEuRXZlbnRUeXBlW2xheW91dF8xLkV2ZW50VHlwZS5zdGFydF0sIGxheW91dF8xLkV2ZW50VHlwZVtsYXlvdXRfMS5FdmVudFR5cGUudGlja10sIGxheW91dF8xLkV2ZW50VHlwZVtsYXlvdXRfMS5FdmVudFR5cGUuZW5kXSk7XG4gICAgICAgIHZhciBkM2xheW91dCA9IF90aGlzO1xuICAgICAgICB2YXIgZHJhZztcbiAgICAgICAgX3RoaXMuZHJhZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICghZHJhZykge1xuICAgICAgICAgICAgICAgIHZhciBkcmFnID0gZDMuYmVoYXZpb3IuZHJhZygpXG4gICAgICAgICAgICAgICAgICAgIC5vcmlnaW4obGF5b3V0XzEuTGF5b3V0LmRyYWdPcmlnaW4pXG4gICAgICAgICAgICAgICAgICAgIC5vbihcImRyYWdzdGFydC5kM2FkYXB0b3JcIiwgbGF5b3V0XzEuTGF5b3V0LmRyYWdTdGFydClcbiAgICAgICAgICAgICAgICAgICAgLm9uKFwiZHJhZy5kM2FkYXB0b3JcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICAgICAgbGF5b3V0XzEuTGF5b3V0LmRyYWcoZCwgZDMuZXZlbnQpO1xuICAgICAgICAgICAgICAgICAgICBkM2xheW91dC5yZXN1bWUoKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAub24oXCJkcmFnZW5kLmQzYWRhcHRvclwiLCBsYXlvdXRfMS5MYXlvdXQuZHJhZ0VuZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRyYWc7XG4gICAgICAgICAgICB0aGlzXG4gICAgICAgICAgICAgICAgLmNhbGwoZHJhZyk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBfdGhpcztcbiAgICB9XG4gICAgRDNTdHlsZUxheW91dEFkYXB0b3IucHJvdG90eXBlLnRyaWdnZXIgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICB2YXIgZDNldmVudCA9IHsgdHlwZTogbGF5b3V0XzEuRXZlbnRUeXBlW2UudHlwZV0sIGFscGhhOiBlLmFscGhhLCBzdHJlc3M6IGUuc3RyZXNzIH07XG4gICAgICAgIHRoaXMuZXZlbnRbZDNldmVudC50eXBlXShkM2V2ZW50KTtcbiAgICB9O1xuICAgIEQzU3R5bGVMYXlvdXRBZGFwdG9yLnByb3RvdHlwZS5raWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICBkMy50aW1lcihmdW5jdGlvbiAoKSB7IHJldHVybiBfc3VwZXIucHJvdG90eXBlLnRpY2suY2FsbChfdGhpcyk7IH0pO1xuICAgIH07XG4gICAgRDNTdHlsZUxheW91dEFkYXB0b3IucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gKGV2ZW50VHlwZSwgbGlzdGVuZXIpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBldmVudFR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50Lm9uKGV2ZW50VHlwZSwgbGlzdGVuZXIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5ldmVudC5vbihsYXlvdXRfMS5FdmVudFR5cGVbZXZlbnRUeXBlXSwgbGlzdGVuZXIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgcmV0dXJuIEQzU3R5bGVMYXlvdXRBZGFwdG9yO1xufShsYXlvdXRfMS5MYXlvdXQpKTtcbmV4cG9ydHMuRDNTdHlsZUxheW91dEFkYXB0b3IgPSBEM1N0eWxlTGF5b3V0QWRhcHRvcjtcbmZ1bmN0aW9uIGQzYWRhcHRvcigpIHtcbiAgICByZXR1cm4gbmV3IEQzU3R5bGVMYXlvdXRBZGFwdG9yKCk7XG59XG5leHBvcnRzLmQzYWRhcHRvciA9IGQzYWRhcHRvcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSm1hV3hsSWpvaVpETjJNMkZrWVhCMGIzSXVhbk1pTENKemIzVnlZMlZTYjI5MElqb2lJaXdpYzI5MWNtTmxjeUk2V3lJdUxpOHVMaTlYWldKRGIyeGhMM055WXk5a00zWXpZV1JoY0hSdmNpNTBjeUpkTENKdVlXMWxjeUk2VzEwc0ltMWhjSEJwYm1keklqb2lPenM3T3pzN096czdPenM3T3pzN1FVRk5RU3h0UTBGQmEwUTdRVUZIT1VNN1NVRkJNRU1zZDBOQlFVMDdTVUZuUWpWRE8xRkJRVUVzV1VGRFNTeHBRa0ZCVHl4VFFYVkNWanRSUVhaRFJDeFhRVUZMTEVkQlFVY3NSVUZCUlN4RFFVRkRMRkZCUVZFc1EwRkJReXhyUWtGQlV5eERRVUZETEd0Q1FVRlRMRU5CUVVNc1MwRkJTeXhEUVVGRExFVkJRVVVzYTBKQlFWTXNRMEZCUXl4clFrRkJVeXhEUVVGRExFbEJRVWtzUTBGQlF5eEZRVUZGTEd0Q1FVRlRMRU5CUVVNc2EwSkJRVk1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCYTBKcVJ5eEpRVUZKTEZGQlFWRXNSMEZCUnl4TFFVRkpMRU5CUVVNN1VVRkRjRUlzU1VGQlNTeEpRVUZKTEVOQlFVTTdVVUZEVkN4TFFVRkpMRU5CUVVNc1NVRkJTU3hIUVVGSE8xbEJRMUlzU1VGQlNTeERRVUZETEVsQlFVa3NSVUZCUlR0blFrRkRVQ3hKUVVGSkxFbEJRVWtzUjBGQlJ5eEZRVUZGTEVOQlFVTXNVVUZCVVN4RFFVRkRMRWxCUVVrc1JVRkJSVHR4UWtGRGVFSXNUVUZCVFN4RFFVRkRMR1ZCUVUwc1EwRkJReXhWUVVGVkxFTkJRVU03Y1VKQlEzcENMRVZCUVVVc1EwRkJReXh4UWtGQmNVSXNSVUZCUlN4bFFVRk5MRU5CUVVNc1UwRkJVeXhEUVVGRE8zRkNRVU16UXl4RlFVRkZMRU5CUVVNc1owSkJRV2RDTEVWQlFVVXNWVUZCUVN4RFFVRkRPMjlDUVVOdVFpeGxRVUZOTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1JVRkJUeXhGUVVGRkxFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTTdiMEpCUXpsQ0xGRkJRVkVzUTBGQlF5eE5RVUZOTEVWQlFVVXNRMEZCUXp0blFrRkRkRUlzUTBGQlF5eERRVUZETzNGQ1FVTkVMRVZCUVVVc1EwRkJReXh0UWtGQmJVSXNSVUZCUlN4bFFVRk5MRU5CUVVNc1QwRkJUeXhEUVVGRExFTkJRVU03WVVGRGFFUTdXVUZGUkN4SlFVRkpMRU5CUVVNc1UwRkJVeXhEUVVGRExFMUJRVTA3WjBKQlFVVXNUMEZCVHl4SlFVRkpMRU5CUVVNN1dVRkhia01zU1VGQlNUdHBRa0ZGUXl4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03VVVGRGNFSXNRMEZCUXl4RFFVRkJPenRKUVVOTUxFTkJRVU03U1VGeVEwUXNjME5CUVU4c1IwRkJVQ3hWUVVGUkxFTkJRVkU3VVVGRFdpeEpRVUZKTEU5QlFVOHNSMEZCUnl4RlFVRkZMRWxCUVVrc1JVRkJSU3hyUWtGQlV5eERRVUZETEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1JVRkJSU3hMUVVGTExFVkJRVVVzUTBGQlF5eERRVUZETEV0QlFVc3NSVUZCUlN4TlFVRk5MRVZCUVVVc1EwRkJReXhEUVVGRExFMUJRVTBzUlVGQlJTeERRVUZETzFGQlF6VkZMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zVDBGQlR5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRTlCUVU4c1EwRkJReXhEUVVGRE8wbEJRM1JETEVOQlFVTTdTVUZIUkN4dFEwRkJTU3hIUVVGS08xRkJRVUVzYVVKQlJVTTdVVUZFUnl4RlFVRkZMRU5CUVVNc1MwRkJTeXhEUVVGRExHTkJRVTBzVDBGQlFTeHBRa0ZCVFN4SlFVRkpMRmxCUVVVc1JVRkJXaXhEUVVGWkxFTkJRVU1zUTBGQlF6dEpRVU5xUXl4RFFVRkRPMGxCWjBORUxHbERRVUZGTEVkQlFVWXNWVUZCUnl4VFFVRTJRaXhGUVVGRkxGRkJRVzlDTzFGQlEyeEVMRWxCUVVrc1QwRkJUeXhUUVVGVExFdEJRVXNzVVVGQlVTeEZRVUZGTzFsQlF5OUNMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zUlVGQlJTeERRVUZETEZOQlFWTXNSVUZCUlN4UlFVRlJMRU5CUVVNc1EwRkJRenRUUVVOMFF6dGhRVUZOTzFsQlEwZ3NTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhGUVVGRkxFTkJRVU1zYTBKQlFWTXNRMEZCUXl4VFFVRlRMRU5CUVVNc1JVRkJSU3hSUVVGUkxFTkJRVU1zUTBGQlF6dFRRVU5xUkR0UlFVTkVMRTlCUVU4c1NVRkJTU3hEUVVGRE8wbEJRMmhDTEVOQlFVTTdTVUZEVEN3eVFrRkJRenRCUVVGRUxFTkJRVU1zUVVGdVJFUXNRMEZCTUVNc1pVRkJUU3hIUVcxRUwwTTdRVUZ1UkZrc2IwUkJRVzlDTzBGQmFVVnFReXhUUVVGblFpeFRRVUZUTzBsQlEzSkNMRTlCUVU4c1NVRkJTU3h2UWtGQmIwSXNSVUZCUlN4RFFVRkRPMEZCUTNSRExFTkJRVU03UVVGR1JDdzRRa0ZGUXlKOSIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fZXh0ZW5kcyA9ICh0aGlzICYmIHRoaXMuX19leHRlbmRzKSB8fCAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBleHRlbmRTdGF0aWNzID0gZnVuY3Rpb24gKGQsIGIpIHtcbiAgICAgICAgZXh0ZW5kU3RhdGljcyA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fFxuICAgICAgICAgICAgKHsgX19wcm90b19fOiBbXSB9IGluc3RhbmNlb2YgQXJyYXkgJiYgZnVuY3Rpb24gKGQsIGIpIHsgZC5fX3Byb3RvX18gPSBiOyB9KSB8fFxuICAgICAgICAgICAgZnVuY3Rpb24gKGQsIGIpIHsgZm9yICh2YXIgcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwKSkgZFtwXSA9IGJbcF07IH07XG4gICAgICAgIHJldHVybiBleHRlbmRTdGF0aWNzKGQsIGIpO1xuICAgIH07XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkLCBiKSB7XG4gICAgICAgIGV4dGVuZFN0YXRpY3MoZCwgYik7XG4gICAgICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxuICAgICAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XG4gICAgfTtcbn0pKCk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgbGF5b3V0XzEgPSByZXF1aXJlKFwiLi9sYXlvdXRcIik7XG52YXIgRDNTdHlsZUxheW91dEFkYXB0b3IgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhEM1N0eWxlTGF5b3V0QWRhcHRvciwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBEM1N0eWxlTGF5b3V0QWRhcHRvcihkM0NvbnRleHQpIHtcbiAgICAgICAgdmFyIF90aGlzID0gX3N1cGVyLmNhbGwodGhpcykgfHwgdGhpcztcbiAgICAgICAgX3RoaXMuZDNDb250ZXh0ID0gZDNDb250ZXh0O1xuICAgICAgICBfdGhpcy5ldmVudCA9IGQzQ29udGV4dC5kaXNwYXRjaChsYXlvdXRfMS5FdmVudFR5cGVbbGF5b3V0XzEuRXZlbnRUeXBlLnN0YXJ0XSwgbGF5b3V0XzEuRXZlbnRUeXBlW2xheW91dF8xLkV2ZW50VHlwZS50aWNrXSwgbGF5b3V0XzEuRXZlbnRUeXBlW2xheW91dF8xLkV2ZW50VHlwZS5lbmRdKTtcbiAgICAgICAgdmFyIGQzbGF5b3V0ID0gX3RoaXM7XG4gICAgICAgIHZhciBkcmFnO1xuICAgICAgICBfdGhpcy5kcmFnID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKCFkcmFnKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRyYWcgPSBkM0NvbnRleHQuZHJhZygpXG4gICAgICAgICAgICAgICAgICAgIC5zdWJqZWN0KGxheW91dF8xLkxheW91dC5kcmFnT3JpZ2luKVxuICAgICAgICAgICAgICAgICAgICAub24oXCJzdGFydC5kM2FkYXB0b3JcIiwgbGF5b3V0XzEuTGF5b3V0LmRyYWdTdGFydClcbiAgICAgICAgICAgICAgICAgICAgLm9uKFwiZHJhZy5kM2FkYXB0b3JcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICAgICAgbGF5b3V0XzEuTGF5b3V0LmRyYWcoZCwgZDNDb250ZXh0LmV2ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgZDNsYXlvdXQucmVzdW1lKCk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgLm9uKFwiZW5kLmQzYWRhcHRvclwiLCBsYXlvdXRfMS5MYXlvdXQuZHJhZ0VuZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRyYWc7XG4gICAgICAgICAgICBhcmd1bWVudHNbMF0uY2FsbChkcmFnKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIF90aGlzO1xuICAgIH1cbiAgICBEM1N0eWxlTGF5b3V0QWRhcHRvci5wcm90b3R5cGUudHJpZ2dlciA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHZhciBkM2V2ZW50ID0geyB0eXBlOiBsYXlvdXRfMS5FdmVudFR5cGVbZS50eXBlXSwgYWxwaGE6IGUuYWxwaGEsIHN0cmVzczogZS5zdHJlc3MgfTtcbiAgICAgICAgdGhpcy5ldmVudC5jYWxsKGQzZXZlbnQudHlwZSwgZDNldmVudCk7XG4gICAgfTtcbiAgICBEM1N0eWxlTGF5b3V0QWRhcHRvci5wcm90b3R5cGUua2ljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIHQgPSB0aGlzLmQzQ29udGV4dC50aW1lcihmdW5jdGlvbiAoKSB7IHJldHVybiBfc3VwZXIucHJvdG90eXBlLnRpY2suY2FsbChfdGhpcykgJiYgdC5zdG9wKCk7IH0pO1xuICAgIH07XG4gICAgRDNTdHlsZUxheW91dEFkYXB0b3IucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gKGV2ZW50VHlwZSwgbGlzdGVuZXIpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBldmVudFR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50Lm9uKGV2ZW50VHlwZSwgbGlzdGVuZXIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5ldmVudC5vbihsYXlvdXRfMS5FdmVudFR5cGVbZXZlbnRUeXBlXSwgbGlzdGVuZXIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgcmV0dXJuIEQzU3R5bGVMYXlvdXRBZGFwdG9yO1xufShsYXlvdXRfMS5MYXlvdXQpKTtcbmV4cG9ydHMuRDNTdHlsZUxheW91dEFkYXB0b3IgPSBEM1N0eWxlTGF5b3V0QWRhcHRvcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSm1hV3hsSWpvaVpETjJOR0ZrWVhCMGIzSXVhbk1pTENKemIzVnlZMlZTYjI5MElqb2lJaXdpYzI5MWNtTmxjeUk2V3lJdUxpOHVMaTlYWldKRGIyeGhMM055WXk5a00zWTBZV1JoY0hSdmNpNTBjeUpkTENKdVlXMWxjeUk2VzEwc0ltMWhjSEJwYm1keklqb2lPenM3T3pzN096czdPenM3T3pzN1FVRkhRU3h0UTBGQmFVUTdRVUZWYWtRN1NVRkJNRU1zZDBOQlFVMDdTVUZwUWpWRExEaENRVUZ2UWl4VFFVRnZRanRSUVVGNFF5eFpRVU5KTEdsQ1FVRlBMRk5CZVVKV08xRkJNVUp0UWl4bFFVRlRMRWRCUVZRc1UwRkJVeXhEUVVGWE8xRkJSWEJETEV0QlFVa3NRMEZCUXl4TFFVRkxMRWRCUVVjc1UwRkJVeXhEUVVGRExGRkJRVkVzUTBGQlF5eHJRa0ZCVXl4RFFVRkRMR3RDUVVGVExFTkJRVU1zUzBGQlN5eERRVUZETEVWQlFVVXNhMEpCUVZNc1EwRkJReXhyUWtGQlV5eERRVUZETEVsQlFVa3NRMEZCUXl4RlFVRkZMR3RDUVVGVExFTkJRVU1zYTBKQlFWTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJSMnBJTEVsQlFVa3NVVUZCVVN4SFFVRkhMRXRCUVVrc1EwRkJRenRSUVVOd1FpeEpRVUZKTEVsQlFVa3NRMEZCUXp0UlFVTlVMRXRCUVVrc1EwRkJReXhKUVVGSkxFZEJRVWM3V1VGRFVpeEpRVUZKTEVOQlFVTXNTVUZCU1N4RlFVRkZPMmRDUVVOUUxFbEJRVWtzU1VGQlNTeEhRVUZITEZOQlFWTXNRMEZCUXl4SlFVRkpMRVZCUVVVN2NVSkJRM1JDTEU5QlFVOHNRMEZCUXl4bFFVRk5MRU5CUVVNc1ZVRkJWU3hEUVVGRE8zRkNRVU14UWl4RlFVRkZMRU5CUVVNc2FVSkJRV2xDTEVWQlFVVXNaVUZCVFN4RFFVRkRMRk5CUVZNc1EwRkJRenR4UWtGRGRrTXNSVUZCUlN4RFFVRkRMR2RDUVVGblFpeEZRVUZGTEZWQlFVRXNRMEZCUXp0dlFrRkRia0lzWlVGQlRTeERRVUZETEVsQlFVa3NRMEZCVFN4RFFVRkRMRVZCUVVVc1UwRkJVeXhEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETzI5Q1FVTnlReXhSUVVGUkxFTkJRVU1zVFVGQlRTeEZRVUZGTEVOQlFVTTdaMEpCUTNSQ0xFTkJRVU1zUTBGQlF6dHhRa0ZEUkN4RlFVRkZMRU5CUVVNc1pVRkJaU3hGUVVGRkxHVkJRVTBzUTBGQlF5eFBRVUZQTEVOQlFVTXNRMEZCUXp0aFFVTTFRenRaUVVWRUxFbEJRVWtzUTBGQlF5eFRRVUZUTEVOQlFVTXNUVUZCVFR0blFrRkJSU3hQUVVGUExFbEJRVWtzUTBGQlF6dFpRVXR1UXl4VFFVRlRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMUZCUXpWQ0xFTkJRVU1zUTBGQlFUczdTVUZEVEN4RFFVRkRPMGxCZWtORUxITkRRVUZQTEVkQlFWQXNWVUZCVVN4RFFVRlJPMUZCUTFvc1NVRkJTU3hQUVVGUExFZEJRVWNzUlVGQlJTeEpRVUZKTEVWQlFVVXNhMEpCUVZNc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVWQlFVVXNTMEZCU3l4RlFVRkZMRU5CUVVNc1EwRkJReXhMUVVGTExFVkJRVVVzVFVGQlRTeEZRVUZGTEVOQlFVTXNRMEZCUXl4TlFVRk5MRVZCUVVVc1EwRkJRenRSUVVjMVJTeEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRWxCUVVrc1EwRkJReXhQUVVGUExFTkJRVU1zU1VGQlNTeEZRVUZQTEU5QlFVOHNRMEZCUXl4RFFVRkRPMGxCUTJoRUxFTkJRVU03U1VGSFJDeHRRMEZCU1N4SFFVRktPMUZCUVVFc2FVSkJSVU03VVVGRVJ5eEpRVUZKTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1UwRkJVeXhEUVVGRExFdEJRVXNzUTBGQlF5eGpRVUZOTEU5QlFVRXNhVUpCUVUwc1NVRkJTU3haUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZETEVsQlFVa3NSVUZCUlN4RlFVRjRRaXhEUVVGM1FpeERRVUZETEVOQlFVTTdTVUZEYWtVc1EwRkJRenRKUVd0RFJDeHBRMEZCUlN4SFFVRkdMRlZCUVVjc1UwRkJOa0lzUlVGQlJTeFJRVUZ2UWp0UlFVTnNSQ3hKUVVGSkxFOUJRVThzVTBGQlV5eExRVUZMTEZGQlFWRXNSVUZCUlR0WlFVTXZRaXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEVWQlFVVXNRMEZCUXl4VFFVRlRMRVZCUVVVc1VVRkJVU3hEUVVGRExFTkJRVU03VTBGRGRFTTdZVUZCVFR0WlFVTklMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zUlVGQlJTeERRVUZETEd0Q1FVRlRMRU5CUVVNc1UwRkJVeXhEUVVGRExFVkJRVVVzVVVGQlVTeERRVUZETEVOQlFVTTdVMEZEYWtRN1VVRkRSQ3hQUVVGUExFbEJRVWtzUTBGQlF6dEpRVU5vUWl4RFFVRkRPMGxCUTB3c01rSkJRVU03UVVGQlJDeERRVUZETEVGQmRFUkVMRU5CUVRCRExHVkJRVTBzUjBGelJDOURPMEZCZEVSWkxHOUVRVUZ2UWlKOSIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIExvY2tzID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBMb2NrcygpIHtcbiAgICAgICAgdGhpcy5sb2NrcyA9IHt9O1xuICAgIH1cbiAgICBMb2Nrcy5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gKGlkLCB4KSB7XG4gICAgICAgIHRoaXMubG9ja3NbaWRdID0geDtcbiAgICB9O1xuICAgIExvY2tzLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5sb2NrcyA9IHt9O1xuICAgIH07XG4gICAgTG9ja3MucHJvdG90eXBlLmlzRW1wdHkgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZvciAodmFyIGwgaW4gdGhpcy5sb2NrcylcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcbiAgICBMb2Nrcy5wcm90b3R5cGUuYXBwbHkgPSBmdW5jdGlvbiAoZikge1xuICAgICAgICBmb3IgKHZhciBsIGluIHRoaXMubG9ja3MpIHtcbiAgICAgICAgICAgIGYoTnVtYmVyKGwpLCB0aGlzLmxvY2tzW2xdKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIExvY2tzO1xufSgpKTtcbmV4cG9ydHMuTG9ja3MgPSBMb2NrcztcbnZhciBEZXNjZW50ID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBEZXNjZW50KHgsIEQsIEcpIHtcbiAgICAgICAgaWYgKEcgPT09IHZvaWQgMCkgeyBHID0gbnVsbDsgfVxuICAgICAgICB0aGlzLkQgPSBEO1xuICAgICAgICB0aGlzLkcgPSBHO1xuICAgICAgICB0aGlzLnRocmVzaG9sZCA9IDAuMDAwMTtcbiAgICAgICAgdGhpcy5udW1HcmlkU25hcE5vZGVzID0gMDtcbiAgICAgICAgdGhpcy5zbmFwR3JpZFNpemUgPSAxMDA7XG4gICAgICAgIHRoaXMuc25hcFN0cmVuZ3RoID0gMTAwMDtcbiAgICAgICAgdGhpcy5zY2FsZVNuYXBCeU1heEggPSBmYWxzZTtcbiAgICAgICAgdGhpcy5yYW5kb20gPSBuZXcgUHNldWRvUmFuZG9tKCk7XG4gICAgICAgIHRoaXMucHJvamVjdCA9IG51bGw7XG4gICAgICAgIHRoaXMueCA9IHg7XG4gICAgICAgIHRoaXMuayA9IHgubGVuZ3RoO1xuICAgICAgICB2YXIgbiA9IHRoaXMubiA9IHhbMF0ubGVuZ3RoO1xuICAgICAgICB0aGlzLkggPSBuZXcgQXJyYXkodGhpcy5rKTtcbiAgICAgICAgdGhpcy5nID0gbmV3IEFycmF5KHRoaXMuayk7XG4gICAgICAgIHRoaXMuSGQgPSBuZXcgQXJyYXkodGhpcy5rKTtcbiAgICAgICAgdGhpcy5hID0gbmV3IEFycmF5KHRoaXMuayk7XG4gICAgICAgIHRoaXMuYiA9IG5ldyBBcnJheSh0aGlzLmspO1xuICAgICAgICB0aGlzLmMgPSBuZXcgQXJyYXkodGhpcy5rKTtcbiAgICAgICAgdGhpcy5kID0gbmV3IEFycmF5KHRoaXMuayk7XG4gICAgICAgIHRoaXMuZSA9IG5ldyBBcnJheSh0aGlzLmspO1xuICAgICAgICB0aGlzLmlhID0gbmV3IEFycmF5KHRoaXMuayk7XG4gICAgICAgIHRoaXMuaWIgPSBuZXcgQXJyYXkodGhpcy5rKTtcbiAgICAgICAgdGhpcy54dG1wID0gbmV3IEFycmF5KHRoaXMuayk7XG4gICAgICAgIHRoaXMubG9ja3MgPSBuZXcgTG9ja3MoKTtcbiAgICAgICAgdGhpcy5taW5EID0gTnVtYmVyLk1BWF9WQUxVRTtcbiAgICAgICAgdmFyIGkgPSBuLCBqO1xuICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICBqID0gbjtcbiAgICAgICAgICAgIHdoaWxlICgtLWogPiBpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGQgPSBEW2ldW2pdO1xuICAgICAgICAgICAgICAgIGlmIChkID4gMCAmJiBkIDwgdGhpcy5taW5EKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWluRCA9IGQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLm1pbkQgPT09IE51bWJlci5NQVhfVkFMVUUpXG4gICAgICAgICAgICB0aGlzLm1pbkQgPSAxO1xuICAgICAgICBpID0gdGhpcy5rO1xuICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICB0aGlzLmdbaV0gPSBuZXcgQXJyYXkobik7XG4gICAgICAgICAgICB0aGlzLkhbaV0gPSBuZXcgQXJyYXkobik7XG4gICAgICAgICAgICBqID0gbjtcbiAgICAgICAgICAgIHdoaWxlIChqLS0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLkhbaV1bal0gPSBuZXcgQXJyYXkobik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLkhkW2ldID0gbmV3IEFycmF5KG4pO1xuICAgICAgICAgICAgdGhpcy5hW2ldID0gbmV3IEFycmF5KG4pO1xuICAgICAgICAgICAgdGhpcy5iW2ldID0gbmV3IEFycmF5KG4pO1xuICAgICAgICAgICAgdGhpcy5jW2ldID0gbmV3IEFycmF5KG4pO1xuICAgICAgICAgICAgdGhpcy5kW2ldID0gbmV3IEFycmF5KG4pO1xuICAgICAgICAgICAgdGhpcy5lW2ldID0gbmV3IEFycmF5KG4pO1xuICAgICAgICAgICAgdGhpcy5pYVtpXSA9IG5ldyBBcnJheShuKTtcbiAgICAgICAgICAgIHRoaXMuaWJbaV0gPSBuZXcgQXJyYXkobik7XG4gICAgICAgICAgICB0aGlzLnh0bXBbaV0gPSBuZXcgQXJyYXkobik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgRGVzY2VudC5jcmVhdGVTcXVhcmVNYXRyaXggPSBmdW5jdGlvbiAobiwgZikge1xuICAgICAgICB2YXIgTSA9IG5ldyBBcnJheShuKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgIE1baV0gPSBuZXcgQXJyYXkobik7XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IG47ICsraikge1xuICAgICAgICAgICAgICAgIE1baV1bal0gPSBmKGksIGopO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBNO1xuICAgIH07XG4gICAgRGVzY2VudC5wcm90b3R5cGUub2Zmc2V0RGlyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgdSA9IG5ldyBBcnJheSh0aGlzLmspO1xuICAgICAgICB2YXIgbCA9IDA7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5rOyArK2kpIHtcbiAgICAgICAgICAgIHZhciB4ID0gdVtpXSA9IHRoaXMucmFuZG9tLmdldE5leHRCZXR3ZWVuKDAuMDEsIDEpIC0gMC41O1xuICAgICAgICAgICAgbCArPSB4ICogeDtcbiAgICAgICAgfVxuICAgICAgICBsID0gTWF0aC5zcXJ0KGwpO1xuICAgICAgICByZXR1cm4gdS5tYXAoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHggKj0gX3RoaXMubWluRCAvIGw7IH0pO1xuICAgIH07XG4gICAgRGVzY2VudC5wcm90b3R5cGUuY29tcHV0ZURlcml2YXRpdmVzID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIG4gPSB0aGlzLm47XG4gICAgICAgIGlmIChuIDwgMSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdmFyIGk7XG4gICAgICAgIHZhciBkID0gbmV3IEFycmF5KHRoaXMuayk7XG4gICAgICAgIHZhciBkMiA9IG5ldyBBcnJheSh0aGlzLmspO1xuICAgICAgICB2YXIgSHV1ID0gbmV3IEFycmF5KHRoaXMuayk7XG4gICAgICAgIHZhciBtYXhIID0gMDtcbiAgICAgICAgZm9yICh2YXIgdV8xID0gMDsgdV8xIDwgbjsgKyt1XzEpIHtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLms7ICsraSlcbiAgICAgICAgICAgICAgICBIdXVbaV0gPSB0aGlzLmdbaV1bdV8xXSA9IDA7XG4gICAgICAgICAgICBmb3IgKHZhciB2ID0gMDsgdiA8IG47ICsrdikge1xuICAgICAgICAgICAgICAgIGlmICh1XzEgPT09IHYpXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIHZhciBtYXhEaXNwbGFjZXMgPSBuO1xuICAgICAgICAgICAgICAgIHZhciBkaXN0YW5jZVNxdWFyZWQgPSAwO1xuICAgICAgICAgICAgICAgIHdoaWxlIChtYXhEaXNwbGFjZXMtLSkge1xuICAgICAgICAgICAgICAgICAgICBkaXN0YW5jZVNxdWFyZWQgPSAwO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5rOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkeF8xID0gZFtpXSA9IHhbaV1bdV8xXSAtIHhbaV1bdl07XG4gICAgICAgICAgICAgICAgICAgICAgICBkaXN0YW5jZVNxdWFyZWQgKz0gZDJbaV0gPSBkeF8xICogZHhfMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoZGlzdGFuY2VTcXVhcmVkID4gMWUtOSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcmQgPSB0aGlzLm9mZnNldERpcigpO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5rOyArK2kpXG4gICAgICAgICAgICAgICAgICAgICAgICB4W2ldW3ZdICs9IHJkW2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgZGlzdGFuY2UgPSBNYXRoLnNxcnQoZGlzdGFuY2VTcXVhcmVkKTtcbiAgICAgICAgICAgICAgICB2YXIgaWRlYWxEaXN0YW5jZSA9IHRoaXMuRFt1XzFdW3ZdO1xuICAgICAgICAgICAgICAgIHZhciB3ZWlnaHQgPSB0aGlzLkcgIT0gbnVsbCA/IHRoaXMuR1t1XzFdW3ZdIDogMTtcbiAgICAgICAgICAgICAgICBpZiAod2VpZ2h0ID4gMSAmJiBkaXN0YW5jZSA+IGlkZWFsRGlzdGFuY2UgfHwgIWlzRmluaXRlKGlkZWFsRGlzdGFuY2UpKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLms7ICsraSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuSFtpXVt1XzFdW3ZdID0gMDtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh3ZWlnaHQgPiAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHdlaWdodCA9IDE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBpZGVhbERpc3RTcXVhcmVkID0gaWRlYWxEaXN0YW5jZSAqIGlkZWFsRGlzdGFuY2UsIGdzID0gMiAqIHdlaWdodCAqIChkaXN0YW5jZSAtIGlkZWFsRGlzdGFuY2UpIC8gKGlkZWFsRGlzdFNxdWFyZWQgKiBkaXN0YW5jZSksIGRpc3RhbmNlQ3ViZWQgPSBkaXN0YW5jZVNxdWFyZWQgKiBkaXN0YW5jZSwgaHMgPSAyICogLXdlaWdodCAvIChpZGVhbERpc3RTcXVhcmVkICogZGlzdGFuY2VDdWJlZCk7XG4gICAgICAgICAgICAgICAgaWYgKCFpc0Zpbml0ZShncykpXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGdzKTtcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5rOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nW2ldW3VfMV0gKz0gZFtpXSAqIGdzO1xuICAgICAgICAgICAgICAgICAgICBIdXVbaV0gLT0gdGhpcy5IW2ldW3VfMV1bdl0gPSBocyAqICgyICogZGlzdGFuY2VDdWJlZCArIGlkZWFsRGlzdGFuY2UgKiAoZDJbaV0gLSBkaXN0YW5jZVNxdWFyZWQpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5rOyArK2kpXG4gICAgICAgICAgICAgICAgbWF4SCA9IE1hdGgubWF4KG1heEgsIHRoaXMuSFtpXVt1XzFdW3VfMV0gPSBIdXVbaV0pO1xuICAgICAgICB9XG4gICAgICAgIHZhciByID0gdGhpcy5zbmFwR3JpZFNpemUgLyAyO1xuICAgICAgICB2YXIgZyA9IHRoaXMuc25hcEdyaWRTaXplO1xuICAgICAgICB2YXIgdyA9IHRoaXMuc25hcFN0cmVuZ3RoO1xuICAgICAgICB2YXIgayA9IHcgLyAociAqIHIpO1xuICAgICAgICB2YXIgbnVtTm9kZXMgPSB0aGlzLm51bUdyaWRTbmFwTm9kZXM7XG4gICAgICAgIGZvciAodmFyIHUgPSAwOyB1IDwgbnVtTm9kZXM7ICsrdSkge1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMuazsgKytpKSB7XG4gICAgICAgICAgICAgICAgdmFyIHhpdSA9IHRoaXMueFtpXVt1XTtcbiAgICAgICAgICAgICAgICB2YXIgbSA9IHhpdSAvIGc7XG4gICAgICAgICAgICAgICAgdmFyIGYgPSBtICUgMTtcbiAgICAgICAgICAgICAgICB2YXIgcSA9IG0gLSBmO1xuICAgICAgICAgICAgICAgIHZhciBhID0gTWF0aC5hYnMoZik7XG4gICAgICAgICAgICAgICAgdmFyIGR4ID0gKGEgPD0gMC41KSA/IHhpdSAtIHEgKiBnIDpcbiAgICAgICAgICAgICAgICAgICAgKHhpdSA+IDApID8geGl1IC0gKHEgKyAxKSAqIGcgOiB4aXUgLSAocSAtIDEpICogZztcbiAgICAgICAgICAgICAgICBpZiAoLXIgPCBkeCAmJiBkeCA8PSByKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnNjYWxlU25hcEJ5TWF4SCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5nW2ldW3VdICs9IG1heEggKiBrICogZHg7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLkhbaV1bdV1bdV0gKz0gbWF4SCAqIGs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdbaV1bdV0gKz0gayAqIGR4O1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5IW2ldW3VdW3VdICs9IGs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLmxvY2tzLmlzRW1wdHkoKSkge1xuICAgICAgICAgICAgdGhpcy5sb2Nrcy5hcHBseShmdW5jdGlvbiAodSwgcCkge1xuICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBfdGhpcy5rOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuSFtpXVt1XVt1XSArPSBtYXhIO1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5nW2ldW3VdIC09IG1heEggKiAocFtpXSAtIHhbaV1bdV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBEZXNjZW50LmRvdFByb2QgPSBmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICB2YXIgeCA9IDAsIGkgPSBhLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGktLSlcbiAgICAgICAgICAgIHggKz0gYVtpXSAqIGJbaV07XG4gICAgICAgIHJldHVybiB4O1xuICAgIH07XG4gICAgRGVzY2VudC5yaWdodE11bHRpcGx5ID0gZnVuY3Rpb24gKG0sIHYsIHIpIHtcbiAgICAgICAgdmFyIGkgPSBtLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGktLSlcbiAgICAgICAgICAgIHJbaV0gPSBEZXNjZW50LmRvdFByb2QobVtpXSwgdik7XG4gICAgfTtcbiAgICBEZXNjZW50LnByb3RvdHlwZS5jb21wdXRlU3RlcFNpemUgPSBmdW5jdGlvbiAoZCkge1xuICAgICAgICB2YXIgbnVtZXJhdG9yID0gMCwgZGVub21pbmF0b3IgPSAwO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuazsgKytpKSB7XG4gICAgICAgICAgICBudW1lcmF0b3IgKz0gRGVzY2VudC5kb3RQcm9kKHRoaXMuZ1tpXSwgZFtpXSk7XG4gICAgICAgICAgICBEZXNjZW50LnJpZ2h0TXVsdGlwbHkodGhpcy5IW2ldLCBkW2ldLCB0aGlzLkhkW2ldKTtcbiAgICAgICAgICAgIGRlbm9taW5hdG9yICs9IERlc2NlbnQuZG90UHJvZChkW2ldLCB0aGlzLkhkW2ldKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZGVub21pbmF0b3IgPT09IDAgfHwgIWlzRmluaXRlKGRlbm9taW5hdG9yKSlcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICByZXR1cm4gMSAqIG51bWVyYXRvciAvIGRlbm9taW5hdG9yO1xuICAgIH07XG4gICAgRGVzY2VudC5wcm90b3R5cGUucmVkdWNlU3RyZXNzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmNvbXB1dGVEZXJpdmF0aXZlcyh0aGlzLngpO1xuICAgICAgICB2YXIgYWxwaGEgPSB0aGlzLmNvbXB1dGVTdGVwU2l6ZSh0aGlzLmcpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuazsgKytpKSB7XG4gICAgICAgICAgICB0aGlzLnRha2VEZXNjZW50U3RlcCh0aGlzLnhbaV0sIHRoaXMuZ1tpXSwgYWxwaGEpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmNvbXB1dGVTdHJlc3MoKTtcbiAgICB9O1xuICAgIERlc2NlbnQuY29weSA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgIHZhciBtID0gYS5sZW5ndGgsIG4gPSBiWzBdLmxlbmd0aDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtOyArK2kpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgbjsgKytqKSB7XG4gICAgICAgICAgICAgICAgYltpXVtqXSA9IGFbaV1bal07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIERlc2NlbnQucHJvdG90eXBlLnN0ZXBBbmRQcm9qZWN0ID0gZnVuY3Rpb24gKHgwLCByLCBkLCBzdGVwU2l6ZSkge1xuICAgICAgICBEZXNjZW50LmNvcHkoeDAsIHIpO1xuICAgICAgICB0aGlzLnRha2VEZXNjZW50U3RlcChyWzBdLCBkWzBdLCBzdGVwU2l6ZSk7XG4gICAgICAgIGlmICh0aGlzLnByb2plY3QpXG4gICAgICAgICAgICB0aGlzLnByb2plY3RbMF0oeDBbMF0sIHgwWzFdLCByWzBdKTtcbiAgICAgICAgdGhpcy50YWtlRGVzY2VudFN0ZXAoclsxXSwgZFsxXSwgc3RlcFNpemUpO1xuICAgICAgICBpZiAodGhpcy5wcm9qZWN0KVxuICAgICAgICAgICAgdGhpcy5wcm9qZWN0WzFdKHJbMF0sIHgwWzFdLCByWzFdKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDI7IGkgPCB0aGlzLms7IGkrKylcbiAgICAgICAgICAgIHRoaXMudGFrZURlc2NlbnRTdGVwKHJbaV0sIGRbaV0sIHN0ZXBTaXplKTtcbiAgICB9O1xuICAgIERlc2NlbnQubUFwcGx5ID0gZnVuY3Rpb24gKG0sIG4sIGYpIHtcbiAgICAgICAgdmFyIGkgPSBtO1xuICAgICAgICB3aGlsZSAoaS0tID4gMCkge1xuICAgICAgICAgICAgdmFyIGogPSBuO1xuICAgICAgICAgICAgd2hpbGUgKGotLSA+IDApXG4gICAgICAgICAgICAgICAgZihpLCBqKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgRGVzY2VudC5wcm90b3R5cGUubWF0cml4QXBwbHkgPSBmdW5jdGlvbiAoZikge1xuICAgICAgICBEZXNjZW50Lm1BcHBseSh0aGlzLmssIHRoaXMubiwgZik7XG4gICAgfTtcbiAgICBEZXNjZW50LnByb3RvdHlwZS5jb21wdXRlTmV4dFBvc2l0aW9uID0gZnVuY3Rpb24gKHgwLCByKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHRoaXMuY29tcHV0ZURlcml2YXRpdmVzKHgwKTtcbiAgICAgICAgdmFyIGFscGhhID0gdGhpcy5jb21wdXRlU3RlcFNpemUodGhpcy5nKTtcbiAgICAgICAgdGhpcy5zdGVwQW5kUHJvamVjdCh4MCwgciwgdGhpcy5nLCBhbHBoYSk7XG4gICAgICAgIGlmICh0aGlzLnByb2plY3QpIHtcbiAgICAgICAgICAgIHRoaXMubWF0cml4QXBwbHkoZnVuY3Rpb24gKGksIGopIHsgcmV0dXJuIF90aGlzLmVbaV1bal0gPSB4MFtpXVtqXSAtIHJbaV1bal07IH0pO1xuICAgICAgICAgICAgdmFyIGJldGEgPSB0aGlzLmNvbXB1dGVTdGVwU2l6ZSh0aGlzLmUpO1xuICAgICAgICAgICAgYmV0YSA9IE1hdGgubWF4KDAuMiwgTWF0aC5taW4oYmV0YSwgMSkpO1xuICAgICAgICAgICAgdGhpcy5zdGVwQW5kUHJvamVjdCh4MCwgciwgdGhpcy5lLCBiZXRhKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgRGVzY2VudC5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKGl0ZXJhdGlvbnMpIHtcbiAgICAgICAgdmFyIHN0cmVzcyA9IE51bWJlci5NQVhfVkFMVUUsIGNvbnZlcmdlZCA9IGZhbHNlO1xuICAgICAgICB3aGlsZSAoIWNvbnZlcmdlZCAmJiBpdGVyYXRpb25zLS0gPiAwKSB7XG4gICAgICAgICAgICB2YXIgcyA9IHRoaXMucnVuZ2VLdXR0YSgpO1xuICAgICAgICAgICAgY29udmVyZ2VkID0gTWF0aC5hYnMoc3RyZXNzIC8gcyAtIDEpIDwgdGhpcy50aHJlc2hvbGQ7XG4gICAgICAgICAgICBzdHJlc3MgPSBzO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzdHJlc3M7XG4gICAgfTtcbiAgICBEZXNjZW50LnByb3RvdHlwZS5ydW5nZUt1dHRhID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB0aGlzLmNvbXB1dGVOZXh0UG9zaXRpb24odGhpcy54LCB0aGlzLmEpO1xuICAgICAgICBEZXNjZW50Lm1pZCh0aGlzLngsIHRoaXMuYSwgdGhpcy5pYSk7XG4gICAgICAgIHRoaXMuY29tcHV0ZU5leHRQb3NpdGlvbih0aGlzLmlhLCB0aGlzLmIpO1xuICAgICAgICBEZXNjZW50Lm1pZCh0aGlzLngsIHRoaXMuYiwgdGhpcy5pYik7XG4gICAgICAgIHRoaXMuY29tcHV0ZU5leHRQb3NpdGlvbih0aGlzLmliLCB0aGlzLmMpO1xuICAgICAgICB0aGlzLmNvbXB1dGVOZXh0UG9zaXRpb24odGhpcy5jLCB0aGlzLmQpO1xuICAgICAgICB2YXIgZGlzcCA9IDA7XG4gICAgICAgIHRoaXMubWF0cml4QXBwbHkoZnVuY3Rpb24gKGksIGopIHtcbiAgICAgICAgICAgIHZhciB4ID0gKF90aGlzLmFbaV1bal0gKyAyLjAgKiBfdGhpcy5iW2ldW2pdICsgMi4wICogX3RoaXMuY1tpXVtqXSArIF90aGlzLmRbaV1bal0pIC8gNi4wLCBkID0gX3RoaXMueFtpXVtqXSAtIHg7XG4gICAgICAgICAgICBkaXNwICs9IGQgKiBkO1xuICAgICAgICAgICAgX3RoaXMueFtpXVtqXSA9IHg7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZGlzcDtcbiAgICB9O1xuICAgIERlc2NlbnQubWlkID0gZnVuY3Rpb24gKGEsIGIsIG0pIHtcbiAgICAgICAgRGVzY2VudC5tQXBwbHkoYS5sZW5ndGgsIGFbMF0ubGVuZ3RoLCBmdW5jdGlvbiAoaSwgaikge1xuICAgICAgICAgICAgcmV0dXJuIG1baV1bal0gPSBhW2ldW2pdICsgKGJbaV1bal0gLSBhW2ldW2pdKSAvIDIuMDtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBEZXNjZW50LnByb3RvdHlwZS50YWtlRGVzY2VudFN0ZXAgPSBmdW5jdGlvbiAoeCwgZCwgc3RlcFNpemUpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm47ICsraSkge1xuICAgICAgICAgICAgeFtpXSA9IHhbaV0gLSBzdGVwU2l6ZSAqIGRbaV07XG4gICAgICAgIH1cbiAgICB9O1xuICAgIERlc2NlbnQucHJvdG90eXBlLmNvbXB1dGVTdHJlc3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBzdHJlc3MgPSAwO1xuICAgICAgICBmb3IgKHZhciB1ID0gMCwgbk1pbnVzMSA9IHRoaXMubiAtIDE7IHUgPCBuTWludXMxOyArK3UpIHtcbiAgICAgICAgICAgIGZvciAodmFyIHYgPSB1ICsgMSwgbiA9IHRoaXMubjsgdiA8IG47ICsrdikge1xuICAgICAgICAgICAgICAgIHZhciBsID0gMDtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuazsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkeCA9IHRoaXMueFtpXVt1XSAtIHRoaXMueFtpXVt2XTtcbiAgICAgICAgICAgICAgICAgICAgbCArPSBkeCAqIGR4O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBsID0gTWF0aC5zcXJ0KGwpO1xuICAgICAgICAgICAgICAgIHZhciBkID0gdGhpcy5EW3VdW3ZdO1xuICAgICAgICAgICAgICAgIGlmICghaXNGaW5pdGUoZCkpXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIHZhciBybCA9IGQgLSBsO1xuICAgICAgICAgICAgICAgIHZhciBkMiA9IGQgKiBkO1xuICAgICAgICAgICAgICAgIHN0cmVzcyArPSBybCAqIHJsIC8gZDI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN0cmVzcztcbiAgICB9O1xuICAgIERlc2NlbnQuemVyb0Rpc3RhbmNlID0gMWUtMTA7XG4gICAgcmV0dXJuIERlc2NlbnQ7XG59KCkpO1xuZXhwb3J0cy5EZXNjZW50ID0gRGVzY2VudDtcbnZhciBQc2V1ZG9SYW5kb20gPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFBzZXVkb1JhbmRvbShzZWVkKSB7XG4gICAgICAgIGlmIChzZWVkID09PSB2b2lkIDApIHsgc2VlZCA9IDE7IH1cbiAgICAgICAgdGhpcy5zZWVkID0gc2VlZDtcbiAgICAgICAgdGhpcy5hID0gMjE0MDEzO1xuICAgICAgICB0aGlzLmMgPSAyNTMxMDExO1xuICAgICAgICB0aGlzLm0gPSAyMTQ3NDgzNjQ4O1xuICAgICAgICB0aGlzLnJhbmdlID0gMzI3Njc7XG4gICAgfVxuICAgIFBzZXVkb1JhbmRvbS5wcm90b3R5cGUuZ2V0TmV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5zZWVkID0gKHRoaXMuc2VlZCAqIHRoaXMuYSArIHRoaXMuYykgJSB0aGlzLm07XG4gICAgICAgIHJldHVybiAodGhpcy5zZWVkID4+IDE2KSAvIHRoaXMucmFuZ2U7XG4gICAgfTtcbiAgICBQc2V1ZG9SYW5kb20ucHJvdG90eXBlLmdldE5leHRCZXR3ZWVuID0gZnVuY3Rpb24gKG1pbiwgbWF4KSB7XG4gICAgICAgIHJldHVybiBtaW4gKyB0aGlzLmdldE5leHQoKSAqIChtYXggLSBtaW4pO1xuICAgIH07XG4gICAgcmV0dXJuIFBzZXVkb1JhbmRvbTtcbn0oKSk7XG5leHBvcnRzLlBzZXVkb1JhbmRvbSA9IFBzZXVkb1JhbmRvbTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSm1hV3hsSWpvaVpHVnpZMlZ1ZEM1cWN5SXNJbk52ZFhKalpWSnZiM1FpT2lJaUxDSnpiM1Z5WTJWeklqcGJJaTR1THk0dUwxZGxZa052YkdFdmMzSmpMMlJsYzJObGJuUXVkSE1pWFN3aWJtRnRaWE1pT2x0ZExDSnRZWEJ3YVc1bmN5STZJanM3UVVGSlNUdEpRVUZCTzFGQlEwa3NWVUZCU3l4SFFVRTJRaXhGUVVGRkxFTkJRVU03U1VGdlEzcERMRU5CUVVNN1NVRTNRa2NzYlVKQlFVY3NSMEZCU0N4VlFVRkpMRVZCUVZVc1JVRkJSU3hEUVVGWE8xRkJTWFpDTEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETzBsQlEzWkNMRU5CUVVNN1NVRkpSQ3h4UWtGQlN5eEhRVUZNTzFGQlEwa3NTVUZCU1N4RFFVRkRMRXRCUVVzc1IwRkJSeXhGUVVGRkxFTkJRVU03U1VGRGNFSXNRMEZCUXp0SlFVdEVMSFZDUVVGUExFZEJRVkE3VVVGRFNTeExRVUZMTEVsQlFVa3NRMEZCUXl4SlFVRkpMRWxCUVVrc1EwRkJReXhMUVVGTE8xbEJRVVVzVDBGQlR5eExRVUZMTEVOQlFVTTdVVUZEZGtNc1QwRkJUeXhKUVVGSkxFTkJRVU03U1VGRGFFSXNRMEZCUXp0SlFVdEVMSEZDUVVGTExFZEJRVXdzVlVGQlRTeERRVUZ2UXp0UlFVTjBReXhMUVVGTExFbEJRVWtzUTBGQlF5eEpRVUZKTEVsQlFVa3NRMEZCUXl4TFFVRkxMRVZCUVVVN1dVRkRkRUlzUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1UwRkRMMEk3U1VGRFRDeERRVUZETzBsQlEwd3NXVUZCUXp0QlFVRkVMRU5CUVVNc1FVRnlRMFFzU1VGeFEwTTdRVUZ5UTFrc2MwSkJRVXM3UVVGcFJHeENPMGxCTmtSSkxHbENRVUZaTEVOQlFXRXNSVUZCVXl4RFFVRmhMRVZCUVZNc1EwRkJiVUk3VVVGQmJrSXNhMEpCUVVFc1JVRkJRU3hSUVVGdFFqdFJRVUY2UXl4TlFVRkRMRWRCUVVRc1EwRkJReXhEUVVGWk8xRkJRVk1zVFVGQlF5eEhRVUZFTEVOQlFVTXNRMEZCYTBJN1VVRTFSSEJGTEdOQlFWTXNSMEZCVnl4TlFVRk5MRU5CUVVNN1VVRXlRek5DTEhGQ1FVRm5RaXhIUVVGWExFTkJRVU1zUTBGQlF6dFJRVU0zUWl4cFFrRkJXU3hIUVVGWExFZEJRVWNzUTBGQlF6dFJRVU16UWl4cFFrRkJXU3hIUVVGWExFbEJRVWtzUTBGQlF6dFJRVU0xUWl4dlFrRkJaU3hIUVVGWkxFdEJRVXNzUTBGQlF6dFJRVVZvUXl4WFFVRk5MRWRCUVVjc1NVRkJTU3haUVVGWkxFVkJRVVVzUTBGQlF6dFJRVVUzUWl4WlFVRlBMRWRCUVRCRUxFbEJRVWtzUTBGQlF6dFJRVmQ2UlN4SlFVRkpMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dFJRVU5ZTEVsQlFVa3NRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF6dFJRVU5zUWl4SlFVRkpMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhOUVVGTkxFTkJRVU03VVVGRE4wSXNTVUZCU1N4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFdEJRVXNzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRNMElzU1VGQlNTeERRVUZETEVOQlFVTXNSMEZCUnl4SlFVRkpMRXRCUVVzc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZETTBJc1NVRkJTU3hEUVVGRExFVkJRVVVzUjBGQlJ5eEpRVUZKTEV0QlFVc3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRE5VSXNTVUZCU1N4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFdEJRVXNzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRNMElzU1VGQlNTeERRVUZETEVOQlFVTXNSMEZCUnl4SlFVRkpMRXRCUVVzc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZETTBJc1NVRkJTU3hEUVVGRExFTkJRVU1zUjBGQlJ5eEpRVUZKTEV0QlFVc3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRE0wSXNTVUZCU1N4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFdEJRVXNzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRNMElzU1VGQlNTeERRVUZETEVOQlFVTXNSMEZCUnl4SlFVRkpMRXRCUVVzc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZETTBJc1NVRkJTU3hEUVVGRExFVkJRVVVzUjBGQlJ5eEpRVUZKTEV0QlFVc3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRE5VSXNTVUZCU1N4RFFVRkRMRVZCUVVVc1IwRkJSeXhKUVVGSkxFdEJRVXNzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkROVUlzU1VGQlNTeERRVUZETEVsQlFVa3NSMEZCUnl4SlFVRkpMRXRCUVVzc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZET1VJc1NVRkJTU3hEUVVGRExFdEJRVXNzUjBGQlJ5eEpRVUZKTEV0QlFVc3NSVUZCUlN4RFFVRkRPMUZCUTNwQ0xFbEJRVWtzUTBGQlF5eEpRVUZKTEVkQlFVY3NUVUZCVFN4RFFVRkRMRk5CUVZNc1EwRkJRenRSUVVNM1FpeEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRE8xRkJRMklzVDBGQlR5eERRVUZETEVWQlFVVXNSVUZCUlR0WlFVTlNMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU03V1VGRFRpeFBRVUZQTEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSVHRuUWtGRFdpeEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdaMEpCUTJoQ0xFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFbEJRVWtzUlVGQlJUdHZRa0ZEZUVJc1NVRkJTU3hEUVVGRExFbEJRVWtzUjBGQlJ5eERRVUZETEVOQlFVTTdhVUpCUTJwQ08yRkJRMG83VTBGRFNqdFJRVU5FTEVsQlFVa3NTVUZCU1N4RFFVRkRMRWxCUVVrc1MwRkJTeXhOUVVGTkxFTkJRVU1zVTBGQlV6dFpRVUZGTEVsQlFVa3NRMEZCUXl4SlFVRkpMRWRCUVVjc1EwRkJReXhEUVVGRE8xRkJRMnhFTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRMWdzVDBGQlR5eERRVUZETEVWQlFVVXNSVUZCUlR0WlFVTlNMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NTVUZCU1N4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRGVrSXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eEpRVUZKTEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVONlFpeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPMWxCUTA0c1QwRkJUeXhEUVVGRExFVkJRVVVzUlVGQlJUdG5Ra0ZEVWl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRWxCUVVrc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzJGQlF5OUNPMWxCUTBRc1NVRkJTU3hEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4SlFVRkpMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU14UWl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVsQlFVa3NTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRM3BDTEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzU1VGQlNTeExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkRla0lzU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTjZRaXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRWxCUVVrc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFsQlEzcENMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NTVUZCU1N4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRGVrSXNTVUZCU1N4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eEpRVUZKTEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVNeFFpeEpRVUZKTEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFbEJRVWtzUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUXpGQ0xFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1NVRkJTU3hMUVVGTExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVMEZETDBJN1NVRkRUQ3hEUVVGRE8wbEJSV0VzTUVKQlFXdENMRWRCUVdoRExGVkJRV2xETEVOQlFWTXNSVUZCUlN4RFFVRnRRenRSUVVNelJTeEpRVUZKTEVOQlFVTXNSMEZCUnl4SlFVRkpMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU55UWl4TFFVRkxMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRVZCUVVVc1EwRkJReXhGUVVGRk8xbEJRM2hDTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTndRaXhMUVVGTExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF5eEZRVUZGTzJkQ1FVTjRRaXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXp0aFFVTnlRanRUUVVOS08xRkJRMFFzVDBGQlR5eERRVUZETEVOQlFVTTdTVUZEWWl4RFFVRkRPMGxCUlU4c01rSkJRVk1zUjBGQmFrSTdVVUZCUVN4cFFrRlRRenRSUVZKSExFbEJRVWtzUTBGQlF5eEhRVUZITEVsQlFVa3NTMEZCU3l4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU14UWl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU03VVVGRFZpeExRVUZMTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEVOQlFVTXNSVUZCUlN4RlFVRkZMRU5CUVVNc1JVRkJSVHRaUVVNM1FpeEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4alFVRmpMRU5CUVVNc1NVRkJTU3hGUVVGRkxFTkJRVU1zUTBGQlF5eEhRVUZITEVkQlFVY3NRMEZCUXp0WlFVTjZSQ3hEUVVGRExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0VFFVTmtPMUZCUTBRc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRha0lzVDBGQlR5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRlZCUVVFc1EwRkJReXhKUVVGSExFOUJRVUVzUTBGQlF5eEpRVUZKTEV0QlFVa3NRMEZCUXl4SlFVRkpMRWRCUVVjc1EwRkJReXhGUVVGc1FpeERRVUZyUWl4RFFVRkRMRU5CUVVNN1NVRkRla01zUTBGQlF6dEpRVWROTEc5RFFVRnJRaXhIUVVGNlFpeFZRVUV3UWl4RFFVRmhPMUZCUVhaRExHbENRU3RIUXp0UlFUbEhSeXhKUVVGTkxFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTJwQ0xFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTTdXVUZCUlN4UFFVRlBPMUZCUTJ4Q0xFbEJRVWtzUTBGQlV5eERRVUZETzFGQlQyUXNTVUZCU1N4RFFVRkRMRWRCUVVjc1NVRkJTU3hMUVVGTExFTkJRVk1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTJ4RExFbEJRVWtzUlVGQlJTeEhRVUZITEVsQlFVa3NTMEZCU3l4RFFVRlRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU51UXl4SlFVRkpMRWRCUVVjc1IwRkJSeXhKUVVGSkxFdEJRVXNzUTBGQlV5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRjRU1zU1VGQlNTeEpRVUZKTEVkQlFVY3NRMEZCUXl4RFFVRkRPMUZCUjJJc1MwRkJTeXhKUVVGSkxFZEJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNSMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hGUVVGRkxFZEJRVU1zUlVGQlJUdFpRVVY0UWl4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4RFFVRkRMRVZCUVVVc1JVRkJSU3hEUVVGRE8yZENRVUZGTEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dFpRVWQyUkN4TFFVRkxMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRVZCUVVVc1EwRkJReXhGUVVGRk8yZENRVU40UWl4SlFVRkpMRWRCUVVNc1MwRkJTeXhEUVVGRE8yOUNRVUZGTEZOQlFWTTdaMEpCU1hSQ0xFbEJRVWtzV1VGQldTeEhRVUZITEVOQlFVTXNRMEZCUXp0blFrRkRja0lzU1VGQlNTeGxRVUZsTEVkQlFVY3NRMEZCUXl4RFFVRkRPMmRDUVVONFFpeFBRVUZQTEZsQlFWa3NSVUZCUlN4RlFVRkZPMjlDUVVOdVFpeGxRVUZsTEVkQlFVY3NRMEZCUXl4RFFVRkRPMjlDUVVOd1FpeExRVUZMTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eERRVUZETEVWQlFVVXNSVUZCUlN4RFFVRkRMRVZCUVVVN2QwSkJRM3BDTEVsQlFVMHNTVUZCUlN4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8zZENRVU53UXl4bFFVRmxMRWxCUVVrc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVsQlFVVXNSMEZCUnl4SlFVRkZMRU5CUVVNN2NVSkJRM1JETzI5Q1FVTkVMRWxCUVVrc1pVRkJaU3hIUVVGSExFbEJRVWs3ZDBKQlFVVXNUVUZCVFR0dlFrRkRiRU1zU1VGQlRTeEZRVUZGTEVkQlFVY3NTVUZCU1N4RFFVRkRMRk5CUVZNc1JVRkJSU3hEUVVGRE8yOUNRVU0xUWl4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4RFFVRkRMRVZCUVVVc1JVRkJSU3hEUVVGRE8zZENRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN2FVSkJRMnBFTzJkQ1FVTkVMRWxCUVUwc1VVRkJVU3hIUVVGSExFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNaVUZCWlN4RFFVRkRMRU5CUVVNN1owSkJRelZETEVsQlFVMHNZVUZCWVN4SFFVRkhMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1owSkJTVzVETEVsQlFVa3NUVUZCVFN4SFFVRkhMRWxCUVVrc1EwRkJReXhEUVVGRExFbEJRVWtzU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03WjBKQlJ5OURMRWxCUVVrc1RVRkJUU3hIUVVGSExFTkJRVU1zU1VGQlNTeFJRVUZSTEVkQlFVY3NZVUZCWVN4SlFVRkpMRU5CUVVNc1VVRkJVU3hEUVVGRExHRkJRV0VzUTBGQlF5eEZRVUZGTzI5Q1FVTndSU3hMUVVGTExFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhEUVVGRExFVkJRVVVzUlVGQlJTeERRVUZETzNkQ1FVRkZMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETzI5Q1FVTnFSQ3hUUVVGVE8ybENRVU5hTzJkQ1FVZEVMRWxCUVVrc1RVRkJUU3hIUVVGSExFTkJRVU1zUlVGQlJUdHZRa0ZEV2l4TlFVRk5MRWRCUVVjc1EwRkJReXhEUVVGRE8ybENRVU5rTzJkQ1FVTkVMRWxCUVUwc1owSkJRV2RDTEVkQlFVY3NZVUZCWVN4SFFVRkhMR0ZCUVdFc1JVRkRiRVFzUlVGQlJTeEhRVUZITEVOQlFVTXNSMEZCUnl4TlFVRk5MRWRCUVVjc1EwRkJReXhSUVVGUkxFZEJRVWNzWVVGQllTeERRVUZETEVkQlFVY3NRMEZCUXl4blFrRkJaMElzUjBGQlJ5eFJRVUZSTEVOQlFVTXNSVUZETlVVc1lVRkJZU3hIUVVGSExHVkJRV1VzUjBGQlJ5eFJRVUZSTEVWQlF6RkRMRVZCUVVVc1IwRkJSeXhEUVVGRExFZEJRVWNzUTBGQlF5eE5RVUZOTEVkQlFVY3NRMEZCUXl4blFrRkJaMElzUjBGQlJ5eGhRVUZoTEVOQlFVTXNRMEZCUXp0blFrRkRNVVFzU1VGQlNTeERRVUZETEZGQlFWRXNRMEZCUXl4RlFVRkZMRU5CUVVNN2IwSkJRMklzVDBGQlR5eERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJRenRuUWtGRGNFSXNTMEZCU3l4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RlFVRkZMRVZCUVVVc1EwRkJReXhGUVVGRk8yOUNRVU42UWl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eEZRVUZGTEVOQlFVTTdiMEpCUXpGQ0xFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFVkJRVVVzUjBGQlJ5eERRVUZETEVOQlFVTXNSMEZCUnl4aFFVRmhMRWRCUVVjc1lVRkJZU3hIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMR1ZCUVdVc1EwRkJReXhEUVVGRExFTkJRVU03YVVKQlEzQkhPMkZCUTBvN1dVRkRSQ3hMUVVGTExFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhEUVVGRExFVkJRVVVzUlVGQlJTeERRVUZETzJkQ1FVRkZMRWxCUVVrc1IwRkJSeXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVNc1EwRkJReXhIUVVGSExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMU5CUTJoR08xRkJSVVFzU1VGQlNTeERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRmxCUVZrc1IwRkJReXhEUVVGRExFTkJRVU03VVVGRE5VSXNTVUZCU1N4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExGbEJRVmtzUTBGQlF6dFJRVU14UWl4SlFVRkpMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zV1VGQldTeERRVUZETzFGQlF6RkNMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOd1FpeEpRVUZKTEZGQlFWRXNSMEZCUnl4SlFVRkpMRU5CUVVNc1owSkJRV2RDTEVOQlFVTTdVVUZGY2tNc1MwRkJTeXhKUVVGSkxFTkJRVU1zUjBGQlZ5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRkZCUVZFc1JVRkJSU3hGUVVGRkxFTkJRVU1zUlVGQlJUdFpRVU4yUXl4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4RFFVRkRMRVZCUVVVc1JVRkJSU3hEUVVGRExFVkJRVVU3WjBKQlEzcENMRWxCUVVrc1IwRkJSeXhIUVVGSExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03WjBKQlEzWkNMRWxCUVVrc1EwRkJReXhIUVVGSExFZEJRVWNzUjBGQlJ5eERRVUZETEVOQlFVTTdaMEpCUTJoQ0xFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1owSkJRMlFzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenRuUWtGRFpDeEpRVUZKTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzJkQ1FVTndRaXhKUVVGSkxFVkJRVVVzUjBGQlJ5eERRVUZETEVOQlFVTXNTVUZCU1N4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eEhRVUZITEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJRenR2UWtGREwwSXNRMEZCUXl4SFFVRkhMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NSMEZCUnl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1IwRkJSeXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1owSkJRM1JFTEVsQlFVa3NRMEZCUXl4RFFVRkRMRWRCUVVjc1JVRkJSU3hKUVVGSkxFVkJRVVVzU1VGQlNTeERRVUZETEVWQlFVVTdiMEpCUTNCQ0xFbEJRVWtzU1VGQlNTeERRVUZETEdWQlFXVXNSVUZCUlR0M1FrRkRkRUlzU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeEpRVUZKTEVkQlFVY3NRMEZCUXl4SFFVRkhMRVZCUVVVc1EwRkJRenQzUWtGRE9VSXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1NVRkJTU3hKUVVGSkxFZEJRVWNzUTBGQlF5eERRVUZETzNGQ1FVTXZRanQ1UWtGQlRUdDNRa0ZEU0N4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhGUVVGRkxFTkJRVU03ZDBKQlEzWkNMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzNGQ1FVTjRRanRwUWtGRFNqdGhRVU5LTzFOQlEwbzdVVUZEUkN4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eFBRVUZQTEVWQlFVVXNSVUZCUlR0WlFVTjJRaXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEV0QlFVc3NRMEZCUXl4VlFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRE8yZENRVU5zUWl4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEV0QlFVa3NRMEZCUXl4RFFVRkRMRVZCUVVVc1JVRkJSU3hEUVVGRExFVkJRVVU3YjBKQlEzcENMRXRCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFbEJRVWtzU1VGQlNTeERRVUZETzI5Q1FVTjRRaXhMUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFbEJRVWtzUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRwUWtGRE0wTTdXVUZEVEN4RFFVRkRMRU5CUVVNc1EwRkJRenRUUVVOT08wbEJVMHdzUTBGQlF6dEpRVVZqTEdWQlFVOHNSMEZCZEVJc1ZVRkJkVUlzUTBGQlZ5eEZRVUZGTEVOQlFWYzdVVUZETTBNc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRE8xRkJRM2hDTEU5QlFVOHNRMEZCUXl4RlFVRkZPMWxCUVVVc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRE4wSXNUMEZCVHl4RFFVRkRMRU5CUVVNN1NVRkRZaXhEUVVGRE8wbEJSMk1zY1VKQlFXRXNSMEZCTlVJc1ZVRkJOa0lzUTBGQllTeEZRVUZGTEVOQlFWY3NSVUZCUlN4RFFVRlhPMUZCUTJoRkxFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNN1VVRkRha0lzVDBGQlR5eERRVUZETEVWQlFVVTdXVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzVDBGQlR5eERRVUZETEU5QlFVOHNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdTVUZEYUVRc1EwRkJRenRKUVV0TkxHbERRVUZsTEVkQlFYUkNMRlZCUVhWQ0xFTkJRV0U3VVVGRGFFTXNTVUZCU1N4VFFVRlRMRWRCUVVjc1EwRkJReXhGUVVGRkxGZEJRVmNzUjBGQlJ5eERRVUZETEVOQlFVTTdVVUZEYmtNc1MwRkJTeXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhEUVVGRExFVkJRVVVzUlVGQlJTeERRVUZETEVWQlFVVTdXVUZETjBJc1UwRkJVeXhKUVVGSkxFOUJRVThzUTBGQlF5eFBRVUZQTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVNNVF5eFBRVUZQTEVOQlFVTXNZVUZCWVN4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFbEJRVWtzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVOdVJDeFhRVUZYTEVsQlFVa3NUMEZCVHl4RFFVRkRMRTlCUVU4c1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNTVUZCU1N4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFOQlEzQkVPMUZCUTBRc1NVRkJTU3hYUVVGWExFdEJRVXNzUTBGQlF5eEpRVUZKTEVOQlFVTXNVVUZCVVN4RFFVRkRMRmRCUVZjc1EwRkJRenRaUVVGRkxFOUJRVThzUTBGQlF5eERRVUZETzFGQlF6RkVMRTlCUVU4c1EwRkJReXhIUVVGSExGTkJRVk1zUjBGQlJ5eFhRVUZYTEVOQlFVTTdTVUZEZGtNc1EwRkJRenRKUVVWTkxEaENRVUZaTEVkQlFXNUNPMUZCUTBrc1NVRkJTU3hEUVVGRExHdENRVUZyUWl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU5vUXl4SlFVRkpMRXRCUVVzc1IwRkJSeXhKUVVGSkxFTkJRVU1zWlVGQlpTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVONlF5eExRVUZMTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEVOQlFVTXNSVUZCUlN4RlFVRkZMRU5CUVVNc1JVRkJSVHRaUVVNM1FpeEpRVUZKTEVOQlFVTXNaVUZCWlN4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeExRVUZMTEVOQlFVTXNRMEZCUXp0VFFVTnlSRHRSUVVORUxFOUJRVThzU1VGQlNTeERRVUZETEdGQlFXRXNSVUZCUlN4RFFVRkRPMGxCUTJoRExFTkJRVU03U1VGRll5eFpRVUZKTEVkQlFXNUNMRlZCUVc5Q0xFTkJRV0VzUlVGQlJTeERRVUZoTzFGQlF6VkRMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eE5RVUZOTEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTTdVVUZEYkVNc1MwRkJTeXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hGUVVGRkxFTkJRVU1zUlVGQlJUdFpRVU40UWl4TFFVRkxMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRVZCUVVVc1EwRkJReXhGUVVGRk8yZENRVU40UWl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzJGQlEzSkNPMU5CUTBvN1NVRkRUQ3hEUVVGRE8wbEJVVThzWjBOQlFXTXNSMEZCZEVJc1ZVRkJkVUlzUlVGQll5eEZRVUZGTEVOQlFXRXNSVUZCUlN4RFFVRmhMRVZCUVVVc1VVRkJaMEk3VVVGRGFrWXNUMEZCVHl4RFFVRkRMRWxCUVVrc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEY0VJc1NVRkJTU3hEUVVGRExHVkJRV1VzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEZGQlFWRXNRMEZCUXl4RFFVRkRPMUZCUXpORExFbEJRVWtzU1VGQlNTeERRVUZETEU5QlFVODdXVUZCUlN4SlFVRkpMRU5CUVVNc1QwRkJUeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRGRFUXNTVUZCU1N4RFFVRkRMR1ZCUVdVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxGRkJRVkVzUTBGQlF5eERRVUZETzFGQlF6TkRMRWxCUVVrc1NVRkJTU3hEUVVGRExFOUJRVTg3V1VGQlJTeEpRVUZKTEVOQlFVTXNUMEZCVHl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkhja1FzUzBGQlN5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZPMWxCUXpOQ0xFbEJRVWtzUTBGQlF5eGxRVUZsTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4UlFVRlJMRU5CUVVNc1EwRkJRenRKUVZWdVJDeERRVUZETzBsQlJXTXNZMEZCVFN4SFFVRnlRaXhWUVVGelFpeERRVUZUTEVWQlFVVXNRMEZCVXl4RlFVRkZMRU5CUVdkRE8xRkJRM2hGTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenRSUVVGRExFOUJRVThzUTBGQlF5eEZRVUZGTEVkQlFVY3NRMEZCUXl4RlFVRkZPMWxCUTNaQ0xFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0WlFVRkRMRTlCUVU4c1EwRkJReXhGUVVGRkxFZEJRVWNzUTBGQlF6dG5Ra0ZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETzFOQlEzUkRPMGxCUTB3c1EwRkJRenRKUVVOUExEWkNRVUZYTEVkQlFXNUNMRlZCUVc5Q0xFTkJRV2RETzFGQlEyaEVMRTlCUVU4c1EwRkJReXhOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETzBsQlEzUkRMRU5CUVVNN1NVRkZUeXh4UTBGQmJVSXNSMEZCTTBJc1ZVRkJORUlzUlVGQll5eEZRVUZGTEVOQlFXRTdVVUZCZWtRc2FVSkJaVU03VVVGa1J5eEpRVUZKTEVOQlFVTXNhMEpCUVd0Q0xFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTTdVVUZETlVJc1NVRkJTU3hMUVVGTExFZEJRVWNzU1VGQlNTeERRVUZETEdWQlFXVXNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRGVrTXNTVUZCU1N4RFFVRkRMR05CUVdNc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF5eEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRMRVZCUVVVc1MwRkJTeXhEUVVGRExFTkJRVU03VVVGTk1VTXNTVUZCU1N4SlFVRkpMRU5CUVVNc1QwRkJUeXhGUVVGRk8xbEJRMlFzU1VGQlNTeERRVUZETEZkQlFWY3NRMEZCUXl4VlFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFbEJRVXNzVDBGQlFTeExRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRV3BETEVOQlFXbERMRU5CUVVNc1EwRkJRenRaUVVNNVJDeEpRVUZKTEVsQlFVa3NSMEZCUnl4SlFVRkpMRU5CUVVNc1pVRkJaU3hEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTjRReXhKUVVGSkxFZEJRVWNzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4SFFVRkhMRVZCUVVVc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVONFF5eEpRVUZKTEVOQlFVTXNZMEZCWXl4RFFVRkRMRVZCUVVVc1JVRkJSU3hEUVVGRExFVkJRVVVzU1VGQlNTeERRVUZETEVOQlFVTXNSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJRenRUUVVNMVF6dEpRVU5NTEVOQlFVTTdTVUZGVFN4eFFrRkJSeXhIUVVGV0xGVkJRVmNzVlVGQmEwSTdVVUZEZWtJc1NVRkJTU3hOUVVGTkxFZEJRVWNzVFVGQlRTeERRVUZETEZOQlFWTXNSVUZCUlN4VFFVRlRMRWRCUVVjc1MwRkJTeXhEUVVGRE8xRkJRMnBFTEU5QlFVOHNRMEZCUXl4VFFVRlRMRWxCUVVrc1ZVRkJWU3hGUVVGRkxFZEJRVWNzUTBGQlF5eEZRVUZGTzFsQlEyNURMRWxCUVVrc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eFZRVUZWTEVWQlFVVXNRMEZCUXp0WlFVTXhRaXhUUVVGVExFZEJRVWNzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4TlFVRk5MRWRCUVVjc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4VFFVRlRMRU5CUVVNN1dVRkRkRVFzVFVGQlRTeEhRVUZITEVOQlFVTXNRMEZCUXp0VFFVTmtPMUZCUTBRc1QwRkJUeXhOUVVGTkxFTkJRVU03U1VGRGJFSXNRMEZCUXp0SlFVVk5MRFJDUVVGVkxFZEJRV3BDTzFGQlFVRXNhVUpCWlVNN1VVRmtSeXhKUVVGSkxFTkJRVU1zYlVKQlFXMUNMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRla01zVDBGQlR5eERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhGUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZETEVWQlFVVXNTVUZCU1N4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRE8xRkJRM0pETEVsQlFVa3NRMEZCUXl4dFFrRkJiVUlzUTBGQlF5eEpRVUZKTEVOQlFVTXNSVUZCUlN4RlFVRkZMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU14UXl4UFFVRlBMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVWQlFVVXNTVUZCU1N4RFFVRkRMRU5CUVVNc1JVRkJSU3hKUVVGSkxFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTTdVVUZEY2tNc1NVRkJTU3hEUVVGRExHMUNRVUZ0UWl4RFFVRkRMRWxCUVVrc1EwRkJReXhGUVVGRkxFVkJRVVVzU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUXpGRExFbEJRVWtzUTBGQlF5eHRRa0ZCYlVJc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVONlF5eEpRVUZKTEVsQlFVa3NSMEZCUnl4RFFVRkRMRU5CUVVNN1VVRkRZaXhKUVVGSkxFTkJRVU1zVjBGQlZ5eERRVUZETEZWQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNN1dVRkRiRUlzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4TFFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRWRCUVVjc1IwRkJSeXhMUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFZEJRVWNzUjBGQlJ5eExRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEV0QlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4SFFVRkhMRVZCUTJwR0xFTkJRVU1zUjBGQlJ5eExRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0WlFVTjZRaXhKUVVGSkxFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0WlFVTmtMRXRCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRE8xRkJRM0pDTEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTBnc1QwRkJUeXhKUVVGSkxFTkJRVU03U1VGRGFFSXNRMEZCUXp0SlFVVmpMRmRCUVVjc1IwRkJiRUlzVlVGQmJVSXNRMEZCWVN4RlFVRkZMRU5CUVdFc1JVRkJSU3hEUVVGaE8xRkJRekZFTEU5QlFVOHNRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJReXhEUVVGRExFMUJRVTBzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1RVRkJUU3hGUVVGRkxGVkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTTdXVUZEZGtNc1QwRkJRU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRWRCUVVjN1VVRkJOME1zUTBGQk5rTXNRMEZCUXl4RFFVRkRPMGxCUTNaRUxFTkJRVU03U1VGRlRTeHBRMEZCWlN4SFFVRjBRaXhWUVVGMVFpeERRVUZYTEVWQlFVVXNRMEZCVnl4RlFVRkZMRkZCUVdkQ08xRkJRemRFTEV0QlFVc3NTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RlFVRkZMRVZCUVVVc1EwRkJReXhGUVVGRk8xbEJRemRDTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NVVUZCVVN4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFRRVU5xUXp0SlFVTk1MRU5CUVVNN1NVRkZUU3dyUWtGQllTeEhRVUZ3UWp0UlFVTkpMRWxCUVVrc1RVRkJUU3hIUVVGSExFTkJRVU1zUTBGQlF6dFJRVU5tTEV0QlFVc3NTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFOUJRVThzUjBGQlJ5eEpRVUZKTEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzVDBGQlR5eEZRVUZGTEVWQlFVVXNRMEZCUXl4RlFVRkZPMWxCUTNCRUxFdEJRVXNzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF5eEZRVUZGTzJkQ1FVTjRReXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTTdaMEpCUTFZc1MwRkJTeXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhEUVVGRExFVkJRVVVzUlVGQlJTeERRVUZETEVWQlFVVTdiMEpCUXpkQ0xFbEJRVWtzUlVGQlJTeEhRVUZITEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0dlFrRkRja01zUTBGQlF5eEpRVUZKTEVWQlFVVXNSMEZCUnl4RlFVRkZMRU5CUVVNN2FVSkJRMmhDTzJkQ1FVTkVMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMmRDUVVOcVFpeEpRVUZKTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMmRDUVVOeVFpeEpRVUZKTEVOQlFVTXNVVUZCVVN4RFFVRkRMRU5CUVVNc1EwRkJRenR2UWtGQlJTeFRRVUZUTzJkQ1FVTXpRaXhKUVVGSkxFVkJRVVVzUjBGQlJ5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPMmRDUVVObUxFbEJRVWtzUlVGQlJTeEhRVUZITEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1owSkJRMllzVFVGQlRTeEpRVUZKTEVWQlFVVXNSMEZCUnl4RlFVRkZMRWRCUVVjc1JVRkJSU3hEUVVGRE8yRkJRekZDTzFOQlEwbzdVVUZEUkN4UFFVRlBMRTFCUVUwc1EwRkJRenRKUVVOc1FpeERRVUZETzBsQmNGaGpMRzlDUVVGWkxFZEJRVmNzUzBGQlN5eERRVUZETzBsQmNWaG9SQ3hqUVVGRE8wTkJRVUVzUVVFdldVUXNTVUVyV1VNN1FVRXZXVmtzTUVKQlFVODdRVUZyV25CQ08wbEJUVWtzYzBKQlFXMUNMRWxCUVdkQ08xRkJRV2hDTEhGQ1FVRkJMRVZCUVVFc1VVRkJaMEk3VVVGQmFFSXNVMEZCU1N4SFFVRktMRWxCUVVrc1EwRkJXVHRSUVV3elFpeE5RVUZETEVkQlFWY3NUVUZCVFN4RFFVRkRPMUZCUTI1Q0xFMUJRVU1zUjBGQlZ5eFBRVUZQTEVOQlFVTTdVVUZEY0VJc1RVRkJReXhIUVVGWExGVkJRVlVzUTBGQlF6dFJRVU4yUWl4VlFVRkxMRWRCUVZjc1MwRkJTeXhEUVVGRE8wbEJSVk1zUTBGQlF6dEpRVWQ0UXl3NFFrRkJUeXhIUVVGUU8xRkJRMGtzU1VGQlNTeERRVUZETEVsQlFVa3NSMEZCUnl4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxFZEJRVWNzU1VGQlNTeERRVUZETEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTnVSQ3hQUVVGUExFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NTVUZCU1N4RlFVRkZMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETzBsQlF6RkRMRU5CUVVNN1NVRkhSQ3h4UTBGQll5eEhRVUZrTEZWQlFXVXNSMEZCVnl4RlFVRkZMRWRCUVZjN1VVRkRia01zVDBGQlR5eEhRVUZITEVkQlFVY3NTVUZCU1N4RFFVRkRMRTlCUVU4c1JVRkJSU3hIUVVGSExFTkJRVU1zUjBGQlJ5eEhRVUZITEVkQlFVY3NRMEZCUXl4RFFVRkRPMGxCUXpsRExFTkJRVU03U1VGRFRDeHRRa0ZCUXp0QlFVRkVMRU5CUVVNc1FVRnNRa1FzU1VGclFrTTdRVUZzUWxrc2IwTkJRVmtpZlE9PSIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fZXh0ZW5kcyA9ICh0aGlzICYmIHRoaXMuX19leHRlbmRzKSB8fCAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBleHRlbmRTdGF0aWNzID0gZnVuY3Rpb24gKGQsIGIpIHtcbiAgICAgICAgZXh0ZW5kU3RhdGljcyA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fFxuICAgICAgICAgICAgKHsgX19wcm90b19fOiBbXSB9IGluc3RhbmNlb2YgQXJyYXkgJiYgZnVuY3Rpb24gKGQsIGIpIHsgZC5fX3Byb3RvX18gPSBiOyB9KSB8fFxuICAgICAgICAgICAgZnVuY3Rpb24gKGQsIGIpIHsgZm9yICh2YXIgcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwKSkgZFtwXSA9IGJbcF07IH07XG4gICAgICAgIHJldHVybiBleHRlbmRTdGF0aWNzKGQsIGIpO1xuICAgIH07XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkLCBiKSB7XG4gICAgICAgIGV4dGVuZFN0YXRpY3MoZCwgYik7XG4gICAgICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxuICAgICAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XG4gICAgfTtcbn0pKCk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgcmVjdGFuZ2xlXzEgPSByZXF1aXJlKFwiLi9yZWN0YW5nbGVcIik7XG52YXIgUG9pbnQgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFBvaW50KCkge1xuICAgIH1cbiAgICByZXR1cm4gUG9pbnQ7XG59KCkpO1xuZXhwb3J0cy5Qb2ludCA9IFBvaW50O1xudmFyIExpbmVTZWdtZW50ID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBMaW5lU2VnbWVudCh4MSwgeTEsIHgyLCB5Mikge1xuICAgICAgICB0aGlzLngxID0geDE7XG4gICAgICAgIHRoaXMueTEgPSB5MTtcbiAgICAgICAgdGhpcy54MiA9IHgyO1xuICAgICAgICB0aGlzLnkyID0geTI7XG4gICAgfVxuICAgIHJldHVybiBMaW5lU2VnbWVudDtcbn0oKSk7XG5leHBvcnRzLkxpbmVTZWdtZW50ID0gTGluZVNlZ21lbnQ7XG52YXIgUG9seVBvaW50ID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoUG9seVBvaW50LCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIFBvbHlQb2ludCgpIHtcbiAgICAgICAgcmV0dXJuIF9zdXBlciAhPT0gbnVsbCAmJiBfc3VwZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKSB8fCB0aGlzO1xuICAgIH1cbiAgICByZXR1cm4gUG9seVBvaW50O1xufShQb2ludCkpO1xuZXhwb3J0cy5Qb2x5UG9pbnQgPSBQb2x5UG9pbnQ7XG5mdW5jdGlvbiBpc0xlZnQoUDAsIFAxLCBQMikge1xuICAgIHJldHVybiAoUDEueCAtIFAwLngpICogKFAyLnkgLSBQMC55KSAtIChQMi54IC0gUDAueCkgKiAoUDEueSAtIFAwLnkpO1xufVxuZXhwb3J0cy5pc0xlZnQgPSBpc0xlZnQ7XG5mdW5jdGlvbiBhYm92ZShwLCB2aSwgdmopIHtcbiAgICByZXR1cm4gaXNMZWZ0KHAsIHZpLCB2aikgPiAwO1xufVxuZnVuY3Rpb24gYmVsb3cocCwgdmksIHZqKSB7XG4gICAgcmV0dXJuIGlzTGVmdChwLCB2aSwgdmopIDwgMDtcbn1cbmZ1bmN0aW9uIENvbnZleEh1bGwoUykge1xuICAgIHZhciBQID0gUy5zbGljZSgwKS5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhLnggIT09IGIueCA/IGIueCAtIGEueCA6IGIueSAtIGEueTsgfSk7XG4gICAgdmFyIG4gPSBTLmxlbmd0aCwgaTtcbiAgICB2YXIgbWlubWluID0gMDtcbiAgICB2YXIgeG1pbiA9IFBbMF0ueDtcbiAgICBmb3IgKGkgPSAxOyBpIDwgbjsgKytpKSB7XG4gICAgICAgIGlmIChQW2ldLnggIT09IHhtaW4pXG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG4gICAgdmFyIG1pbm1heCA9IGkgLSAxO1xuICAgIHZhciBIID0gW107XG4gICAgSC5wdXNoKFBbbWlubWluXSk7XG4gICAgaWYgKG1pbm1heCA9PT0gbiAtIDEpIHtcbiAgICAgICAgaWYgKFBbbWlubWF4XS55ICE9PSBQW21pbm1pbl0ueSlcbiAgICAgICAgICAgIEgucHVzaChQW21pbm1heF0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdmFyIG1heG1pbiwgbWF4bWF4ID0gbiAtIDE7XG4gICAgICAgIHZhciB4bWF4ID0gUFtuIC0gMV0ueDtcbiAgICAgICAgZm9yIChpID0gbiAtIDI7IGkgPj0gMDsgaS0tKVxuICAgICAgICAgICAgaWYgKFBbaV0ueCAhPT0geG1heClcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgbWF4bWluID0gaSArIDE7XG4gICAgICAgIGkgPSBtaW5tYXg7XG4gICAgICAgIHdoaWxlICgrK2kgPD0gbWF4bWluKSB7XG4gICAgICAgICAgICBpZiAoaXNMZWZ0KFBbbWlubWluXSwgUFttYXhtaW5dLCBQW2ldKSA+PSAwICYmIGkgPCBtYXhtaW4pXG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB3aGlsZSAoSC5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzTGVmdChIW0gubGVuZ3RoIC0gMl0sIEhbSC5sZW5ndGggLSAxXSwgUFtpXSkgPiAwKVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIEgubGVuZ3RoIC09IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaSAhPSBtaW5taW4pXG4gICAgICAgICAgICAgICAgSC5wdXNoKFBbaV0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChtYXhtYXggIT0gbWF4bWluKVxuICAgICAgICAgICAgSC5wdXNoKFBbbWF4bWF4XSk7XG4gICAgICAgIHZhciBib3QgPSBILmxlbmd0aDtcbiAgICAgICAgaSA9IG1heG1pbjtcbiAgICAgICAgd2hpbGUgKC0taSA+PSBtaW5tYXgpIHtcbiAgICAgICAgICAgIGlmIChpc0xlZnQoUFttYXhtYXhdLCBQW21pbm1heF0sIFBbaV0pID49IDAgJiYgaSA+IG1pbm1heClcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIHdoaWxlIChILmxlbmd0aCA+IGJvdCkge1xuICAgICAgICAgICAgICAgIGlmIChpc0xlZnQoSFtILmxlbmd0aCAtIDJdLCBIW0gubGVuZ3RoIC0gMV0sIFBbaV0pID4gMClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBILmxlbmd0aCAtPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGkgIT0gbWlubWluKVxuICAgICAgICAgICAgICAgIEgucHVzaChQW2ldKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gSDtcbn1cbmV4cG9ydHMuQ29udmV4SHVsbCA9IENvbnZleEh1bGw7XG5mdW5jdGlvbiBjbG9ja3dpc2VSYWRpYWxTd2VlcChwLCBQLCBmKSB7XG4gICAgUC5zbGljZSgwKS5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBNYXRoLmF0YW4yKGEueSAtIHAueSwgYS54IC0gcC54KSAtIE1hdGguYXRhbjIoYi55IC0gcC55LCBiLnggLSBwLngpOyB9KS5mb3JFYWNoKGYpO1xufVxuZXhwb3J0cy5jbG9ja3dpc2VSYWRpYWxTd2VlcCA9IGNsb2Nrd2lzZVJhZGlhbFN3ZWVwO1xuZnVuY3Rpb24gbmV4dFBvbHlQb2ludChwLCBwcykge1xuICAgIGlmIChwLnBvbHlJbmRleCA9PT0gcHMubGVuZ3RoIC0gMSlcbiAgICAgICAgcmV0dXJuIHBzWzBdO1xuICAgIHJldHVybiBwc1twLnBvbHlJbmRleCArIDFdO1xufVxuZnVuY3Rpb24gcHJldlBvbHlQb2ludChwLCBwcykge1xuICAgIGlmIChwLnBvbHlJbmRleCA9PT0gMClcbiAgICAgICAgcmV0dXJuIHBzW3BzLmxlbmd0aCAtIDFdO1xuICAgIHJldHVybiBwc1twLnBvbHlJbmRleCAtIDFdO1xufVxuZnVuY3Rpb24gdGFuZ2VudF9Qb2ludFBvbHlDKFAsIFYpIHtcbiAgICB2YXIgVmNsb3NlZCA9IFYuc2xpY2UoMCk7XG4gICAgVmNsb3NlZC5wdXNoKFZbMF0pO1xuICAgIHJldHVybiB7IHJ0YW46IFJ0YW5nZW50X1BvaW50UG9seUMoUCwgVmNsb3NlZCksIGx0YW46IEx0YW5nZW50X1BvaW50UG9seUMoUCwgVmNsb3NlZCkgfTtcbn1cbmZ1bmN0aW9uIFJ0YW5nZW50X1BvaW50UG9seUMoUCwgVikge1xuICAgIHZhciBuID0gVi5sZW5ndGggLSAxO1xuICAgIHZhciBhLCBiLCBjO1xuICAgIHZhciB1cEEsIGRuQztcbiAgICBpZiAoYmVsb3coUCwgVlsxXSwgVlswXSkgJiYgIWFib3ZlKFAsIFZbbiAtIDFdLCBWWzBdKSlcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgZm9yIChhID0gMCwgYiA9IG47Oykge1xuICAgICAgICBpZiAoYiAtIGEgPT09IDEpXG4gICAgICAgICAgICBpZiAoYWJvdmUoUCwgVlthXSwgVltiXSkpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGE7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgcmV0dXJuIGI7XG4gICAgICAgIGMgPSBNYXRoLmZsb29yKChhICsgYikgLyAyKTtcbiAgICAgICAgZG5DID0gYmVsb3coUCwgVltjICsgMV0sIFZbY10pO1xuICAgICAgICBpZiAoZG5DICYmICFhYm92ZShQLCBWW2MgLSAxXSwgVltjXSkpXG4gICAgICAgICAgICByZXR1cm4gYztcbiAgICAgICAgdXBBID0gYWJvdmUoUCwgVlthICsgMV0sIFZbYV0pO1xuICAgICAgICBpZiAodXBBKSB7XG4gICAgICAgICAgICBpZiAoZG5DKVxuICAgICAgICAgICAgICAgIGIgPSBjO1xuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKGFib3ZlKFAsIFZbYV0sIFZbY10pKVxuICAgICAgICAgICAgICAgICAgICBiID0gYztcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGEgPSBjO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYgKCFkbkMpXG4gICAgICAgICAgICAgICAgYSA9IGM7XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoYmVsb3coUCwgVlthXSwgVltjXSkpXG4gICAgICAgICAgICAgICAgICAgIGIgPSBjO1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgYSA9IGM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5mdW5jdGlvbiBMdGFuZ2VudF9Qb2ludFBvbHlDKFAsIFYpIHtcbiAgICB2YXIgbiA9IFYubGVuZ3RoIC0gMTtcbiAgICB2YXIgYSwgYiwgYztcbiAgICB2YXIgZG5BLCBkbkM7XG4gICAgaWYgKGFib3ZlKFAsIFZbbiAtIDFdLCBWWzBdKSAmJiAhYmVsb3coUCwgVlsxXSwgVlswXSkpXG4gICAgICAgIHJldHVybiAwO1xuICAgIGZvciAoYSA9IDAsIGIgPSBuOzspIHtcbiAgICAgICAgaWYgKGIgLSBhID09PSAxKVxuICAgICAgICAgICAgaWYgKGJlbG93KFAsIFZbYV0sIFZbYl0pKVxuICAgICAgICAgICAgICAgIHJldHVybiBhO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHJldHVybiBiO1xuICAgICAgICBjID0gTWF0aC5mbG9vcigoYSArIGIpIC8gMik7XG4gICAgICAgIGRuQyA9IGJlbG93KFAsIFZbYyArIDFdLCBWW2NdKTtcbiAgICAgICAgaWYgKGFib3ZlKFAsIFZbYyAtIDFdLCBWW2NdKSAmJiAhZG5DKVxuICAgICAgICAgICAgcmV0dXJuIGM7XG4gICAgICAgIGRuQSA9IGJlbG93KFAsIFZbYSArIDFdLCBWW2FdKTtcbiAgICAgICAgaWYgKGRuQSkge1xuICAgICAgICAgICAgaWYgKCFkbkMpXG4gICAgICAgICAgICAgICAgYiA9IGM7XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoYmVsb3coUCwgVlthXSwgVltjXSkpXG4gICAgICAgICAgICAgICAgICAgIGIgPSBjO1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgYSA9IGM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpZiAoZG5DKVxuICAgICAgICAgICAgICAgIGEgPSBjO1xuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKGFib3ZlKFAsIFZbYV0sIFZbY10pKVxuICAgICAgICAgICAgICAgICAgICBiID0gYztcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGEgPSBjO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gdGFuZ2VudF9Qb2x5UG9seUMoViwgVywgdDEsIHQyLCBjbXAxLCBjbXAyKSB7XG4gICAgdmFyIGl4MSwgaXgyO1xuICAgIGl4MSA9IHQxKFdbMF0sIFYpO1xuICAgIGl4MiA9IHQyKFZbaXgxXSwgVyk7XG4gICAgdmFyIGRvbmUgPSBmYWxzZTtcbiAgICB3aGlsZSAoIWRvbmUpIHtcbiAgICAgICAgZG9uZSA9IHRydWU7XG4gICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgICBpZiAoaXgxID09PSBWLmxlbmd0aCAtIDEpXG4gICAgICAgICAgICAgICAgaXgxID0gMDtcbiAgICAgICAgICAgIGlmIChjbXAxKFdbaXgyXSwgVltpeDFdLCBWW2l4MSArIDFdKSlcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICsraXgxO1xuICAgICAgICB9XG4gICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgICBpZiAoaXgyID09PSAwKVxuICAgICAgICAgICAgICAgIGl4MiA9IFcubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgIGlmIChjbXAyKFZbaXgxXSwgV1tpeDJdLCBXW2l4MiAtIDFdKSlcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIC0taXgyO1xuICAgICAgICAgICAgZG9uZSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7IHQxOiBpeDEsIHQyOiBpeDIgfTtcbn1cbmV4cG9ydHMudGFuZ2VudF9Qb2x5UG9seUMgPSB0YW5nZW50X1BvbHlQb2x5QztcbmZ1bmN0aW9uIExSdGFuZ2VudF9Qb2x5UG9seUMoViwgVykge1xuICAgIHZhciBybCA9IFJMdGFuZ2VudF9Qb2x5UG9seUMoVywgVik7XG4gICAgcmV0dXJuIHsgdDE6IHJsLnQyLCB0MjogcmwudDEgfTtcbn1cbmV4cG9ydHMuTFJ0YW5nZW50X1BvbHlQb2x5QyA9IExSdGFuZ2VudF9Qb2x5UG9seUM7XG5mdW5jdGlvbiBSTHRhbmdlbnRfUG9seVBvbHlDKFYsIFcpIHtcbiAgICByZXR1cm4gdGFuZ2VudF9Qb2x5UG9seUMoViwgVywgUnRhbmdlbnRfUG9pbnRQb2x5QywgTHRhbmdlbnRfUG9pbnRQb2x5QywgYWJvdmUsIGJlbG93KTtcbn1cbmV4cG9ydHMuUkx0YW5nZW50X1BvbHlQb2x5QyA9IFJMdGFuZ2VudF9Qb2x5UG9seUM7XG5mdW5jdGlvbiBMTHRhbmdlbnRfUG9seVBvbHlDKFYsIFcpIHtcbiAgICByZXR1cm4gdGFuZ2VudF9Qb2x5UG9seUMoViwgVywgTHRhbmdlbnRfUG9pbnRQb2x5QywgTHRhbmdlbnRfUG9pbnRQb2x5QywgYmVsb3csIGJlbG93KTtcbn1cbmV4cG9ydHMuTEx0YW5nZW50X1BvbHlQb2x5QyA9IExMdGFuZ2VudF9Qb2x5UG9seUM7XG5mdW5jdGlvbiBSUnRhbmdlbnRfUG9seVBvbHlDKFYsIFcpIHtcbiAgICByZXR1cm4gdGFuZ2VudF9Qb2x5UG9seUMoViwgVywgUnRhbmdlbnRfUG9pbnRQb2x5QywgUnRhbmdlbnRfUG9pbnRQb2x5QywgYWJvdmUsIGFib3ZlKTtcbn1cbmV4cG9ydHMuUlJ0YW5nZW50X1BvbHlQb2x5QyA9IFJSdGFuZ2VudF9Qb2x5UG9seUM7XG52YXIgQmlUYW5nZW50ID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBCaVRhbmdlbnQodDEsIHQyKSB7XG4gICAgICAgIHRoaXMudDEgPSB0MTtcbiAgICAgICAgdGhpcy50MiA9IHQyO1xuICAgIH1cbiAgICByZXR1cm4gQmlUYW5nZW50O1xufSgpKTtcbmV4cG9ydHMuQmlUYW5nZW50ID0gQmlUYW5nZW50O1xudmFyIEJpVGFuZ2VudHMgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEJpVGFuZ2VudHMoKSB7XG4gICAgfVxuICAgIHJldHVybiBCaVRhbmdlbnRzO1xufSgpKTtcbmV4cG9ydHMuQmlUYW5nZW50cyA9IEJpVGFuZ2VudHM7XG52YXIgVFZHUG9pbnQgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhUVkdQb2ludCwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBUVkdQb2ludCgpIHtcbiAgICAgICAgcmV0dXJuIF9zdXBlciAhPT0gbnVsbCAmJiBfc3VwZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKSB8fCB0aGlzO1xuICAgIH1cbiAgICByZXR1cm4gVFZHUG9pbnQ7XG59KFBvaW50KSk7XG5leHBvcnRzLlRWR1BvaW50ID0gVFZHUG9pbnQ7XG52YXIgVmlzaWJpbGl0eVZlcnRleCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gVmlzaWJpbGl0eVZlcnRleChpZCwgcG9seWlkLCBwb2x5dmVydGlkLCBwKSB7XG4gICAgICAgIHRoaXMuaWQgPSBpZDtcbiAgICAgICAgdGhpcy5wb2x5aWQgPSBwb2x5aWQ7XG4gICAgICAgIHRoaXMucG9seXZlcnRpZCA9IHBvbHl2ZXJ0aWQ7XG4gICAgICAgIHRoaXMucCA9IHA7XG4gICAgICAgIHAudnYgPSB0aGlzO1xuICAgIH1cbiAgICByZXR1cm4gVmlzaWJpbGl0eVZlcnRleDtcbn0oKSk7XG5leHBvcnRzLlZpc2liaWxpdHlWZXJ0ZXggPSBWaXNpYmlsaXR5VmVydGV4O1xudmFyIFZpc2liaWxpdHlFZGdlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBWaXNpYmlsaXR5RWRnZShzb3VyY2UsIHRhcmdldCkge1xuICAgICAgICB0aGlzLnNvdXJjZSA9IHNvdXJjZTtcbiAgICAgICAgdGhpcy50YXJnZXQgPSB0YXJnZXQ7XG4gICAgfVxuICAgIFZpc2liaWxpdHlFZGdlLnByb3RvdHlwZS5sZW5ndGggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBkeCA9IHRoaXMuc291cmNlLnAueCAtIHRoaXMudGFyZ2V0LnAueDtcbiAgICAgICAgdmFyIGR5ID0gdGhpcy5zb3VyY2UucC55IC0gdGhpcy50YXJnZXQucC55O1xuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KGR4ICogZHggKyBkeSAqIGR5KTtcbiAgICB9O1xuICAgIHJldHVybiBWaXNpYmlsaXR5RWRnZTtcbn0oKSk7XG5leHBvcnRzLlZpc2liaWxpdHlFZGdlID0gVmlzaWJpbGl0eUVkZ2U7XG52YXIgVGFuZ2VudFZpc2liaWxpdHlHcmFwaCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gVGFuZ2VudFZpc2liaWxpdHlHcmFwaChQLCBnMCkge1xuICAgICAgICB0aGlzLlAgPSBQO1xuICAgICAgICB0aGlzLlYgPSBbXTtcbiAgICAgICAgdGhpcy5FID0gW107XG4gICAgICAgIGlmICghZzApIHtcbiAgICAgICAgICAgIHZhciBuID0gUC5sZW5ndGg7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG47IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBwID0gUFtpXTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHAubGVuZ3RoOyArK2opIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBqID0gcFtqXSwgdnYgPSBuZXcgVmlzaWJpbGl0eVZlcnRleCh0aGlzLlYubGVuZ3RoLCBpLCBqLCBwaik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuVi5wdXNoKHZ2KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGogPiAwKVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5FLnB1c2gobmV3IFZpc2liaWxpdHlFZGdlKHBbaiAtIDFdLnZ2LCB2dikpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocC5sZW5ndGggPiAxKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLkUucHVzaChuZXcgVmlzaWJpbGl0eUVkZ2UocFswXS52diwgcFtwLmxlbmd0aCAtIDFdLnZ2KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG4gLSAxOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgUGkgPSBQW2ldO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSBpICsgMTsgaiA8IG47IGorKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgUGogPSBQW2pdLCB0ID0gdGFuZ2VudHMoUGksIFBqKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgcSBpbiB0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYyA9IHRbcV0sIHNvdXJjZSA9IFBpW2MudDFdLCB0YXJnZXQgPSBQaltjLnQyXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRWRnZUlmVmlzaWJsZShzb3VyY2UsIHRhcmdldCwgaSwgaik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLlYgPSBnMC5WLnNsaWNlKDApO1xuICAgICAgICAgICAgdGhpcy5FID0gZzAuRS5zbGljZSgwKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBUYW5nZW50VmlzaWJpbGl0eUdyYXBoLnByb3RvdHlwZS5hZGRFZGdlSWZWaXNpYmxlID0gZnVuY3Rpb24gKHUsIHYsIGkxLCBpMikge1xuICAgICAgICBpZiAoIXRoaXMuaW50ZXJzZWN0c1BvbHlzKG5ldyBMaW5lU2VnbWVudCh1LngsIHUueSwgdi54LCB2LnkpLCBpMSwgaTIpKSB7XG4gICAgICAgICAgICB0aGlzLkUucHVzaChuZXcgVmlzaWJpbGl0eUVkZ2UodS52diwgdi52dikpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBUYW5nZW50VmlzaWJpbGl0eUdyYXBoLnByb3RvdHlwZS5hZGRQb2ludCA9IGZ1bmN0aW9uIChwLCBpMSkge1xuICAgICAgICB2YXIgbiA9IHRoaXMuUC5sZW5ndGg7XG4gICAgICAgIHRoaXMuVi5wdXNoKG5ldyBWaXNpYmlsaXR5VmVydGV4KHRoaXMuVi5sZW5ndGgsIG4sIDAsIHApKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgIGlmIChpID09PSBpMSlcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIHZhciBwb2x5ID0gdGhpcy5QW2ldLCB0ID0gdGFuZ2VudF9Qb2ludFBvbHlDKHAsIHBvbHkpO1xuICAgICAgICAgICAgdGhpcy5hZGRFZGdlSWZWaXNpYmxlKHAsIHBvbHlbdC5sdGFuXSwgaTEsIGkpO1xuICAgICAgICAgICAgdGhpcy5hZGRFZGdlSWZWaXNpYmxlKHAsIHBvbHlbdC5ydGFuXSwgaTEsIGkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwLnZ2O1xuICAgIH07XG4gICAgVGFuZ2VudFZpc2liaWxpdHlHcmFwaC5wcm90b3R5cGUuaW50ZXJzZWN0c1BvbHlzID0gZnVuY3Rpb24gKGwsIGkxLCBpMikge1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgbiA9IHRoaXMuUC5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgIGlmIChpICE9IGkxICYmIGkgIT0gaTIgJiYgaW50ZXJzZWN0cyhsLCB0aGlzLlBbaV0pLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcbiAgICByZXR1cm4gVGFuZ2VudFZpc2liaWxpdHlHcmFwaDtcbn0oKSk7XG5leHBvcnRzLlRhbmdlbnRWaXNpYmlsaXR5R3JhcGggPSBUYW5nZW50VmlzaWJpbGl0eUdyYXBoO1xuZnVuY3Rpb24gaW50ZXJzZWN0cyhsLCBQKSB7XG4gICAgdmFyIGludHMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMSwgbiA9IFAubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgIHZhciBpbnQgPSByZWN0YW5nbGVfMS5SZWN0YW5nbGUubGluZUludGVyc2VjdGlvbihsLngxLCBsLnkxLCBsLngyLCBsLnkyLCBQW2kgLSAxXS54LCBQW2kgLSAxXS55LCBQW2ldLngsIFBbaV0ueSk7XG4gICAgICAgIGlmIChpbnQpXG4gICAgICAgICAgICBpbnRzLnB1c2goaW50KTtcbiAgICB9XG4gICAgcmV0dXJuIGludHM7XG59XG5mdW5jdGlvbiB0YW5nZW50cyhWLCBXKSB7XG4gICAgdmFyIG0gPSBWLmxlbmd0aCAtIDEsIG4gPSBXLmxlbmd0aCAtIDE7XG4gICAgdmFyIGJ0ID0gbmV3IEJpVGFuZ2VudHMoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG07ICsraSkge1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IG47ICsraikge1xuICAgICAgICAgICAgdmFyIHYxID0gVltpID09IDAgPyBtIC0gMSA6IGkgLSAxXTtcbiAgICAgICAgICAgIHZhciB2MiA9IFZbaV07XG4gICAgICAgICAgICB2YXIgdjMgPSBWW2kgKyAxXTtcbiAgICAgICAgICAgIHZhciB3MSA9IFdbaiA9PSAwID8gbiAtIDEgOiBqIC0gMV07XG4gICAgICAgICAgICB2YXIgdzIgPSBXW2pdO1xuICAgICAgICAgICAgdmFyIHczID0gV1tqICsgMV07XG4gICAgICAgICAgICB2YXIgdjF2MncyID0gaXNMZWZ0KHYxLCB2MiwgdzIpO1xuICAgICAgICAgICAgdmFyIHYydzF3MiA9IGlzTGVmdCh2MiwgdzEsIHcyKTtcbiAgICAgICAgICAgIHZhciB2MncydzMgPSBpc0xlZnQodjIsIHcyLCB3Myk7XG4gICAgICAgICAgICB2YXIgdzF3MnYyID0gaXNMZWZ0KHcxLCB3MiwgdjIpO1xuICAgICAgICAgICAgdmFyIHcydjF2MiA9IGlzTGVmdCh3MiwgdjEsIHYyKTtcbiAgICAgICAgICAgIHZhciB3MnYydjMgPSBpc0xlZnQodzIsIHYyLCB2Myk7XG4gICAgICAgICAgICBpZiAodjF2MncyID49IDAgJiYgdjJ3MXcyID49IDAgJiYgdjJ3MnczIDwgMFxuICAgICAgICAgICAgICAgICYmIHcxdzJ2MiA+PSAwICYmIHcydjF2MiA+PSAwICYmIHcydjJ2MyA8IDApIHtcbiAgICAgICAgICAgICAgICBidC5sbCA9IG5ldyBCaVRhbmdlbnQoaSwgaik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh2MXYydzIgPD0gMCAmJiB2MncxdzIgPD0gMCAmJiB2MncydzMgPiAwXG4gICAgICAgICAgICAgICAgJiYgdzF3MnYyIDw9IDAgJiYgdzJ2MXYyIDw9IDAgJiYgdzJ2MnYzID4gMCkge1xuICAgICAgICAgICAgICAgIGJ0LnJyID0gbmV3IEJpVGFuZ2VudChpLCBqKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHYxdjJ3MiA8PSAwICYmIHYydzF3MiA+IDAgJiYgdjJ3MnczIDw9IDBcbiAgICAgICAgICAgICAgICAmJiB3MXcydjIgPj0gMCAmJiB3MnYxdjIgPCAwICYmIHcydjJ2MyA+PSAwKSB7XG4gICAgICAgICAgICAgICAgYnQucmwgPSBuZXcgQmlUYW5nZW50KGksIGopO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodjF2MncyID49IDAgJiYgdjJ3MXcyIDwgMCAmJiB2MncydzMgPj0gMFxuICAgICAgICAgICAgICAgICYmIHcxdzJ2MiA8PSAwICYmIHcydjF2MiA+IDAgJiYgdzJ2MnYzIDw9IDApIHtcbiAgICAgICAgICAgICAgICBidC5sciA9IG5ldyBCaVRhbmdlbnQoaSwgaik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGJ0O1xufVxuZXhwb3J0cy50YW5nZW50cyA9IHRhbmdlbnRzO1xuZnVuY3Rpb24gaXNQb2ludEluc2lkZVBvbHkocCwgcG9seSkge1xuICAgIGZvciAodmFyIGkgPSAxLCBuID0gcG9seS5sZW5ndGg7IGkgPCBuOyArK2kpXG4gICAgICAgIGlmIChiZWxvdyhwb2x5W2kgLSAxXSwgcG9seVtpXSwgcCkpXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgcmV0dXJuIHRydWU7XG59XG5mdW5jdGlvbiBpc0FueVBJblEocCwgcSkge1xuICAgIHJldHVybiAhcC5ldmVyeShmdW5jdGlvbiAodikgeyByZXR1cm4gIWlzUG9pbnRJbnNpZGVQb2x5KHYsIHEpOyB9KTtcbn1cbmZ1bmN0aW9uIHBvbHlzT3ZlcmxhcChwLCBxKSB7XG4gICAgaWYgKGlzQW55UEluUShwLCBxKSlcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgaWYgKGlzQW55UEluUShxLCBwKSlcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgZm9yICh2YXIgaSA9IDEsIG4gPSBwLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICB2YXIgdiA9IHBbaV0sIHUgPSBwW2kgLSAxXTtcbiAgICAgICAgaWYgKGludGVyc2VjdHMobmV3IExpbmVTZWdtZW50KHUueCwgdS55LCB2LngsIHYueSksIHEpLmxlbmd0aCA+IDApXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuZXhwb3J0cy5wb2x5c092ZXJsYXAgPSBwb2x5c092ZXJsYXA7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0ptYVd4bElqb2laMlZ2YlM1cWN5SXNJbk52ZFhKalpWSnZiM1FpT2lJaUxDSnpiM1Z5WTJWeklqcGJJaTR1THk0dUwxZGxZa052YkdFdmMzSmpMMmRsYjIwdWRITWlYU3dpYm1GdFpYTWlPbHRkTENKdFlYQndhVzVuY3lJNklqczdPenM3T3pzN096czdPenM3TzBGQlFVRXNlVU5CUVhGRE8wRkJRMnBETzBsQlFVRTdTVUZIUVN4RFFVRkRPMGxCUVVRc1dVRkJRenRCUVVGRUxFTkJRVU1zUVVGSVJDeEpRVWRETzBGQlNGa3NjMEpCUVVzN1FVRkxiRUk3U1VGRFNTeHhRa0ZCYlVJc1JVRkJWU3hGUVVGVExFVkJRVlVzUlVGQlV5eEZRVUZWTEVWQlFWTXNSVUZCVlR0UlFVRnVSU3hQUVVGRkxFZEJRVVlzUlVGQlJTeERRVUZSTzFGQlFWTXNUMEZCUlN4SFFVRkdMRVZCUVVVc1EwRkJVVHRSUVVGVExFOUJRVVVzUjBGQlJpeEZRVUZGTEVOQlFWRTdVVUZCVXl4UFFVRkZMRWRCUVVZc1JVRkJSU3hEUVVGUk8wbEJRVWtzUTBGQlF6dEpRVU12Uml4clFrRkJRenRCUVVGRUxFTkJRVU1zUVVGR1JDeEpRVVZETzBGQlJsa3NhME5CUVZjN1FVRkplRUk3U1VGQkswSXNOa0pCUVVzN1NVRkJjRU03TzBsQlJVRXNRMEZCUXp0SlFVRkVMR2RDUVVGRE8wRkJRVVFzUTBGQlF5eEJRVVpFTEVOQlFTdENMRXRCUVVzc1IwRkZia003UVVGR1dTdzRRa0ZCVXp0QlFWVjBRaXhUUVVGblFpeE5RVUZOTEVOQlFVTXNSVUZCVXl4RlFVRkZMRVZCUVZNc1JVRkJSU3hGUVVGVE8wbEJRMnhFTEU5QlFVOHNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhIUVVGSExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFZEJRVWNzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUjBGQlJ5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eEhRVUZITEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRCUVVONlJTeERRVUZETzBGQlJrUXNkMEpCUlVNN1FVRkZSQ3hUUVVGVExFdEJRVXNzUTBGQlF5eERRVUZSTEVWQlFVVXNSVUZCVXl4RlFVRkZMRVZCUVZNN1NVRkRla01zVDBGQlR5eE5RVUZOTEVOQlFVTXNRMEZCUXl4RlFVRkZMRVZCUVVVc1JVRkJSU3hGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTTdRVUZEYWtNc1EwRkJRenRCUVVWRUxGTkJRVk1zUzBGQlN5eERRVUZETEVOQlFWRXNSVUZCUlN4RlFVRlRMRVZCUVVVc1JVRkJVenRKUVVONlF5eFBRVUZQTEUxQlFVMHNRMEZCUXl4RFFVRkRMRVZCUVVVc1JVRkJSU3hGUVVGRkxFVkJRVVVzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0QlFVTnFReXhEUVVGRE8wRkJVMFFzVTBGQlowSXNWVUZCVlN4RFFVRkRMRU5CUVZVN1NVRkRha01zU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNWVUZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhKUVVGTExFOUJRVUVzUTBGQlF5eERRVUZETEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQmJrTXNRMEZCYlVNc1EwRkJReXhEUVVGRE8wbEJRM1pGTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhOUVVGTkxFVkJRVVVzUTBGQlF5eERRVUZETzBsQlEzQkNMRWxCUVVrc1RVRkJUU3hIUVVGSExFTkJRVU1zUTBGQlF6dEpRVU5tTEVsQlFVa3NTVUZCU1N4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdTVUZEYkVJc1MwRkJTeXhEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1JVRkJSU3hEUVVGRExFVkJRVVU3VVVGRGNFSXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eExRVUZMTEVsQlFVazdXVUZCUlN4TlFVRk5PMHRCUXpsQ08wbEJRMFFzU1VGQlNTeE5RVUZOTEVkQlFVY3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenRKUVVOdVFpeEpRVUZKTEVOQlFVTXNSMEZCV1N4RlFVRkZMRU5CUVVNN1NVRkRjRUlzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU1zUTBGQlF6dEpRVU5zUWl4SlFVRkpMRTFCUVUwc1MwRkJTeXhEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTzFGQlEyeENMRWxCUVVrc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU16UWl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXl4RFFVRkRPMHRCUTNwQ08xTkJRVTA3VVVGRlNDeEpRVUZKTEUxQlFVMHNSVUZCUlN4TlFVRk5MRWRCUVVjc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dFJRVU16UWl4SlFVRkpMRWxCUVVrc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOMFFpeExRVUZMTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zU1VGQlNTeERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZPMWxCUTNaQ0xFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1MwRkJTeXhKUVVGSk8yZENRVUZGTEUxQlFVMDdVVUZETDBJc1RVRkJUU3hIUVVGSExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTTdVVUZIWml4RFFVRkRMRWRCUVVjc1RVRkJUU3hEUVVGRE8xRkJRMWdzVDBGQlR5eEZRVUZGTEVOQlFVTXNTVUZCU1N4TlFVRk5MRVZCUVVVN1dVRkZiRUlzU1VGQlNTeE5RVUZOTEVOQlFVTXNRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4SFFVRkhMRTFCUVUwN1owSkJRM0pFTEZOQlFWTTdXVUZGWWl4UFFVRlBMRU5CUVVNc1EwRkJReXhOUVVGTkxFZEJRVWNzUTBGQlF5eEZRVU51UWp0blFrRkZTU3hKUVVGSkxFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRTFCUVUwc1IwRkJSeXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRTFCUVUwc1IwRkJSeXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRE8yOUNRVU5zUkN4TlFVRk5PenR2UWtGRlRpeERRVUZETEVOQlFVTXNUVUZCVFN4SlFVRkpMRU5CUVVNc1EwRkJRenRoUVVOeVFqdFpRVU5FTEVsQlFVa3NRMEZCUXl4SlFVRkpMRTFCUVUwN1owSkJRVVVzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFRRVU5xUXp0UlFVZEVMRWxCUVVrc1RVRkJUU3hKUVVGSkxFMUJRVTA3V1VGRGFFSXNRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTjBRaXhKUVVGSkxFZEJRVWNzUjBGQlJ5eERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRPMUZCUTI1Q0xFTkJRVU1zUjBGQlJ5eE5RVUZOTEVOQlFVTTdVVUZEV0N4UFFVRlBMRVZCUVVVc1EwRkJReXhKUVVGSkxFMUJRVTBzUlVGQlJUdFpRVVZzUWl4SlFVRkpMRTFCUVUwc1EwRkJReXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFZEJRVWNzVFVGQlRUdG5Ra0ZEY2tRc1UwRkJVenRaUVVWaUxFOUJRVThzUTBGQlF5eERRVUZETEUxQlFVMHNSMEZCUnl4SFFVRkhMRVZCUTNKQ08yZENRVVZKTEVsQlFVa3NUVUZCVFN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zVFVGQlRTeEhRVUZITEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zVFVGQlRTeEhRVUZITEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTTdiMEpCUTJ4RUxFMUJRVTA3TzI5Q1FVVk9MRU5CUVVNc1EwRkJReXhOUVVGTkxFbEJRVWtzUTBGQlF5eERRVUZETzJGQlEzSkNPMWxCUTBRc1NVRkJTU3hEUVVGRExFbEJRVWtzVFVGQlRUdG5Ra0ZCUlN4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMU5CUTJwRE8wdEJRMG83U1VGRFJDeFBRVUZQTEVOQlFVTXNRMEZCUXp0QlFVTmlMRU5CUVVNN1FVRTVSRVFzWjBOQk9FUkRPMEZCUjBRc1UwRkJaMElzYjBKQlFXOUNMRU5CUVVNc1EwRkJVU3hGUVVGRkxFTkJRVlVzUlVGQlJTeERRVUZ4UWp0SlFVTTFSU3hEUVVGRExFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkRXQ3hWUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVsQlFVc3NUMEZCUVN4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQmJrVXNRMEZCYlVVc1EwRkROVVVzUTBGQlF5eFBRVUZQTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1FVRkRja0lzUTBGQlF6dEJRVXBFTEc5RVFVbERPMEZCUlVRc1UwRkJVeXhoUVVGaExFTkJRVU1zUTBGQldTeEZRVUZGTEVWQlFXVTdTVUZEYUVRc1NVRkJTU3hEUVVGRExFTkJRVU1zVTBGQlV5eExRVUZMTEVWQlFVVXNRMEZCUXl4TlFVRk5MRWRCUVVjc1EwRkJRenRSUVVGRkxFOUJRVThzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMGxCUTJoRUxFOUJRVThzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4VFFVRlRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU03UVVGREwwSXNRMEZCUXp0QlFVVkVMRk5CUVZNc1lVRkJZU3hEUVVGRExFTkJRVmtzUlVGQlJTeEZRVUZsTzBsQlEyaEVMRWxCUVVrc1EwRkJReXhEUVVGRExGTkJRVk1zUzBGQlN5eERRVUZETzFGQlFVVXNUMEZCVHl4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRExFMUJRVTBzUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXp0SlFVTm9SQ3hQUVVGUExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNVMEZCVXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRE8wRkJReTlDTEVOQlFVTTdRVUZSUkN4VFFVRlRMR3RDUVVGclFpeERRVUZETEVOQlFWRXNSVUZCUlN4RFFVRlZPMGxCUnpWRExFbEJRVWtzVDBGQlR5eEhRVUZITEVOQlFVTXNRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03U1VGRGVrSXNUMEZCVHl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0SlFVVnVRaXhQUVVGUExFVkJRVVVzU1VGQlNTeEZRVUZGTEcxQ1FVRnRRaXhEUVVGRExFTkJRVU1zUlVGQlJTeFBRVUZQTEVOQlFVTXNSVUZCUlN4SlFVRkpMRVZCUVVVc2JVSkJRVzFDTEVOQlFVTXNRMEZCUXl4RlFVRkZMRTlCUVU4c1EwRkJReXhGUVVGRkxFTkJRVU03UVVGRE5VWXNRMEZCUXp0QlFWTkVMRk5CUVZNc2JVSkJRVzFDTEVOQlFVTXNRMEZCVVN4RlFVRkZMRU5CUVZVN1NVRkROME1zU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRTFCUVUwc1IwRkJSeXhEUVVGRExFTkJRVU03U1VGSGNrSXNTVUZCU1N4RFFVRlRMRVZCUVVVc1EwRkJVeXhGUVVGRkxFTkJRVk1zUTBGQlF6dEpRVU53UXl4SlFVRkpMRWRCUVZrc1JVRkJSU3hIUVVGWkxFTkJRVU03U1VGSkwwSXNTVUZCU1N4TFFVRkxMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRGFrUXNUMEZCVHl4RFFVRkRMRU5CUVVNN1NVRkZZaXhMUVVGTExFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTenRSUVVOc1FpeEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRXRCUVVzc1EwRkJRenRaUVVOWUxFbEJRVWtzUzBGQlN5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMmRDUVVOd1FpeFBRVUZQTEVOQlFVTXNRMEZCUXpzN1owSkJSVlFzVDBGQlR5eERRVUZETEVOQlFVTTdVVUZGYWtJc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTTdVVUZETlVJc1IwRkJSeXhIUVVGSExFdEJRVXNzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVNdlFpeEpRVUZKTEVkQlFVY3NTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEYUVNc1QwRkJUeXhEUVVGRExFTkJRVU03VVVGSllpeEhRVUZITEVkQlFVY3NTMEZCU3l4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlF5OUNMRWxCUVVrc1IwRkJSeXhGUVVGRk8xbEJRMHdzU1VGQlNTeEhRVUZITzJkQ1FVTklMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU03YVVKQlEwdzdaMEpCUTBRc1NVRkJTU3hMUVVGTExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdiMEpCUTNCQ0xFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTTdPMjlDUVVWT0xFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTTdZVUZEWWp0VFFVTktPMkZCUTBrN1dVRkRSQ3hKUVVGSkxFTkJRVU1zUjBGQlJ6dG5Ra0ZEU2l4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRE8ybENRVU5NTzJkQ1FVTkVMRWxCUVVrc1MwRkJTeXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzI5Q1FVTndRaXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZET3p0dlFrRkZUaXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETzJGQlEySTdVMEZEU2p0TFFVTktPMEZCUTB3c1EwRkJRenRCUVZGRUxGTkJRVk1zYlVKQlFXMUNMRU5CUVVNc1EwRkJVU3hGUVVGRkxFTkJRVlU3U1VGRE4wTXNTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFMUJRVTBzUjBGQlJ5eERRVUZETEVOQlFVTTdTVUZGY2tJc1NVRkJTU3hEUVVGVExFVkJRVVVzUTBGQlV5eEZRVUZGTEVOQlFWTXNRMEZCUXp0SlFVTndReXhKUVVGSkxFZEJRVmtzUlVGQlJTeEhRVUZaTEVOQlFVTTdTVUZKTDBJc1NVRkJTU3hMUVVGTExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEYWtRc1QwRkJUeXhEUVVGRExFTkJRVU03U1VGRllpeExRVUZMTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlN6dFJRVU5zUWl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFdEJRVXNzUTBGQlF6dFpRVU5ZTEVsQlFVa3NTMEZCU3l4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8yZENRVU53UWl4UFFVRlBMRU5CUVVNc1EwRkJRenM3WjBKQlJWUXNUMEZCVHl4RFFVRkRMRU5CUVVNN1VVRkZha0lzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkROVUlzUjBGQlJ5eEhRVUZITEV0QlFVc3NRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU12UWl4SlFVRkpMRXRCUVVzc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRWRCUVVjN1dVRkRhRU1zVDBGQlR5eERRVUZETEVOQlFVTTdVVUZKWWl4SFFVRkhMRWRCUVVjc1MwRkJTeXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUXk5Q0xFbEJRVWtzUjBGQlJ5eEZRVUZGTzFsQlEwd3NTVUZCU1N4RFFVRkRMRWRCUVVjN1owSkJRMG9zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0cFFrRkRURHRuUWtGRFJDeEpRVUZKTEV0QlFVc3NRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenR2UWtGRGNFSXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenM3YjBKQlJVNHNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenRoUVVOaU8xTkJRMG83WVVGRFNUdFpRVU5FTEVsQlFVa3NSMEZCUnp0blFrRkRTQ3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETzJsQ1FVTk1PMmRDUVVORUxFbEJRVWtzUzBGQlN5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMjlDUVVOd1FpeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPenR2UWtGRlRpeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPMkZCUTJJN1UwRkRTanRMUVVOS08wRkJRMHdzUTBGQlF6dEJRVk5FTEZOQlFXZENMR2xDUVVGcFFpeERRVUZETEVOQlFWVXNSVUZCUlN4RFFVRlZMRVZCUVVVc1JVRkJiME1zUlVGQlJTeEZRVUZ2UXl4RlFVRkZMRWxCUVN0RExFVkJRVVVzU1VGQkswTTdTVUZEYkU4c1NVRkJTU3hIUVVGWExFVkJRVVVzUjBGQlZ5eERRVUZETzBsQlJ6ZENMRWRCUVVjc1IwRkJSeXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRE8wbEJRMnhDTEVkQlFVY3NSMEZCUnl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMGxCUjNCQ0xFbEJRVWtzU1VGQlNTeEhRVUZITEV0QlFVc3NRMEZCUXp0SlFVTnFRaXhQUVVGUExFTkJRVU1zU1VGQlNTeEZRVUZGTzFGQlExWXNTVUZCU1N4SFFVRkhMRWxCUVVrc1EwRkJRenRSUVVOYUxFOUJRVThzU1VGQlNTeEZRVUZGTzFsQlExUXNTVUZCU1N4SFFVRkhMRXRCUVVzc1EwRkJReXhEUVVGRExFMUJRVTBzUjBGQlJ5eERRVUZETzJkQ1FVRkZMRWRCUVVjc1IwRkJSeXhEUVVGRExFTkJRVU03V1VGRGJFTXNTVUZCU1N4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUjBGQlJ5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRPMmRDUVVGRkxFMUJRVTA3V1VGRE5VTXNSVUZCUlN4SFFVRkhMRU5CUVVNN1UwRkRWRHRSUVVORUxFOUJRVThzU1VGQlNTeEZRVUZGTzFsQlExUXNTVUZCU1N4SFFVRkhMRXRCUVVzc1EwRkJRenRuUWtGQlJTeEhRVUZITEVkQlFVY3NRMEZCUXl4RFFVRkRMRTFCUVUwc1IwRkJSeXhEUVVGRExFTkJRVU03V1VGRGJFTXNTVUZCU1N4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUjBGQlJ5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRPMmRDUVVGRkxFMUJRVTA3V1VGRE5VTXNSVUZCUlN4SFFVRkhMRU5CUVVNN1dVRkRUaXhKUVVGSkxFZEJRVWNzUzBGQlN5eERRVUZETzFOQlEyaENPMHRCUTBvN1NVRkRSQ3hQUVVGUExFVkJRVVVzUlVGQlJTeEZRVUZGTEVkQlFVY3NSVUZCUlN4RlFVRkZMRVZCUVVVc1IwRkJSeXhGUVVGRkxFTkJRVU03UVVGRGFFTXNRMEZCUXp0QlFYaENSQ3c0UTBGM1FrTTdRVUZGUkN4VFFVRm5RaXh0UWtGQmJVSXNRMEZCUXl4RFFVRlZMRVZCUVVVc1EwRkJWVHRKUVVOMFJDeEpRVUZKTEVWQlFVVXNSMEZCUnl4dFFrRkJiVUlzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1NVRkRia01zVDBGQlR5eEZRVUZGTEVWQlFVVXNSVUZCUlN4RlFVRkZMRU5CUVVNc1JVRkJSU3hGUVVGRkxFVkJRVVVzUlVGQlJTeEZRVUZGTEVOQlFVTXNSVUZCUlN4RlFVRkZMRU5CUVVNN1FVRkRjRU1zUTBGQlF6dEJRVWhFTEd0RVFVZERPMEZCUlVRc1UwRkJaMElzYlVKQlFXMUNMRU5CUVVNc1EwRkJWU3hGUVVGRkxFTkJRVlU3U1VGRGRFUXNUMEZCVHl4cFFrRkJhVUlzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRzFDUVVGdFFpeEZRVUZGTEcxQ1FVRnRRaXhGUVVGRkxFdEJRVXNzUlVGQlJTeExRVUZMTEVOQlFVTXNRMEZCUXp0QlFVTXpSaXhEUVVGRE8wRkJSa1FzYTBSQlJVTTdRVUZGUkN4VFFVRm5RaXh0UWtGQmJVSXNRMEZCUXl4RFFVRlZMRVZCUVVVc1EwRkJWVHRKUVVOMFJDeFBRVUZQTEdsQ1FVRnBRaXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNiVUpCUVcxQ0xFVkJRVVVzYlVKQlFXMUNMRVZCUVVVc1MwRkJTeXhGUVVGRkxFdEJRVXNzUTBGQlF5eERRVUZETzBGQlF6TkdMRU5CUVVNN1FVRkdSQ3hyUkVGRlF6dEJRVVZFTEZOQlFXZENMRzFDUVVGdFFpeERRVUZETEVOQlFWVXNSVUZCUlN4RFFVRlZPMGxCUTNSRUxFOUJRVThzYVVKQlFXbENMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUlVGQlJTeHRRa0ZCYlVJc1JVRkJSU3h0UWtGQmJVSXNSVUZCUlN4TFFVRkxMRVZCUVVVc1MwRkJTeXhEUVVGRExFTkJRVU03UVVGRE0wWXNRMEZCUXp0QlFVWkVMR3RFUVVWRE8wRkJSVVE3U1VGRFNTeHRRa0ZCYlVJc1JVRkJWU3hGUVVGVExFVkJRVlU3VVVGQk4wSXNUMEZCUlN4SFFVRkdMRVZCUVVVc1EwRkJVVHRSUVVGVExFOUJRVVVzUjBGQlJpeEZRVUZGTEVOQlFWRTdTVUZCU1N4RFFVRkRPMGxCUTNwRUxHZENRVUZETzBGQlFVUXNRMEZCUXl4QlFVWkVMRWxCUlVNN1FVRkdXU3c0UWtGQlV6dEJRVWwwUWp0SlFVRkJPMGxCUzBFc1EwRkJRenRKUVVGRUxHbENRVUZETzBGQlFVUXNRMEZCUXl4QlFVeEVMRWxCUzBNN1FVRk1XU3huUTBGQlZUdEJRVTkyUWp0SlFVRTRRaXcwUWtGQlN6dEpRVUZ1UXpzN1NVRkZRU3hEUVVGRE8wbEJRVVFzWlVGQlF6dEJRVUZFTEVOQlFVTXNRVUZHUkN4RFFVRTRRaXhMUVVGTExFZEJSV3hETzBGQlJsa3NORUpCUVZFN1FVRkpja0k3U1VGRFNTd3dRa0ZEVnl4RlFVRlZMRVZCUTFZc1RVRkJZeXhGUVVOa0xGVkJRV3RDTEVWQlEyeENMRU5CUVZjN1VVRklXQ3hQUVVGRkxFZEJRVVlzUlVGQlJTeERRVUZSTzFGQlExWXNWMEZCVFN4SFFVRk9MRTFCUVUwc1EwRkJVVHRSUVVOa0xHVkJRVlVzUjBGQlZpeFZRVUZWTEVOQlFWRTdVVUZEYkVJc1RVRkJReXhIUVVGRUxFTkJRVU1zUTBGQlZUdFJRVVZzUWl4RFFVRkRMRU5CUVVNc1JVRkJSU3hIUVVGSExFbEJRVWtzUTBGQlF6dEpRVU5vUWl4RFFVRkRPMGxCUTB3c2RVSkJRVU03UVVGQlJDeERRVUZETEVGQlZFUXNTVUZUUXp0QlFWUlpMRFJEUVVGblFqdEJRVmMzUWp0SlFVTkpMSGRDUVVOWExFMUJRWGRDTEVWQlEzaENMRTFCUVhkQ08xRkJSSGhDTEZkQlFVMHNSMEZCVGl4TlFVRk5MRU5CUVd0Q08xRkJRM2hDTEZkQlFVMHNSMEZCVGl4TlFVRk5MRU5CUVd0Q08wbEJRVWtzUTBGQlF6dEpRVU40UXl3clFrRkJUU3hIUVVGT08xRkJRMGtzU1VGQlNTeEZRVUZGTEVkQlFVY3NTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU16UXl4SlFVRkpMRVZCUVVVc1IwRkJSeXhKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUXpORExFOUJRVThzU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4RlFVRkZMRWRCUVVjc1JVRkJSU3hIUVVGSExFVkJRVVVzUjBGQlJ5eEZRVUZGTEVOQlFVTXNRMEZCUXp0SlFVTjRReXhEUVVGRE8wbEJRMHdzY1VKQlFVTTdRVUZCUkN4RFFVRkRMRUZCVkVRc1NVRlRRenRCUVZSWkxIZERRVUZqTzBGQlZ6TkNPMGxCUjBrc1owTkJRVzFDTEVOQlFXVXNSVUZCUlN4RlFVRnRSRHRSUVVGd1JTeE5RVUZETEVkQlFVUXNRMEZCUXl4RFFVRmpPMUZCUm14RExFMUJRVU1zUjBGQmRVSXNSVUZCUlN4RFFVRkRPMUZCUXpOQ0xFMUJRVU1zUjBGQmNVSXNSVUZCUlN4RFFVRkRPMUZCUlhKQ0xFbEJRVWtzUTBGQlF5eEZRVUZGTEVWQlFVVTdXVUZEVEN4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETzFsQlJXcENMRXRCUVVzc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFVkJRVVU3WjBKQlEzaENMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0blFrRkZZaXhMUVVGTExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFMUJRVTBzUlVGQlJTeEZRVUZGTEVOQlFVTXNSVUZCUlR0dlFrRkRMMElzU1VGQlNTeEZRVUZGTEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVOVUxFVkJRVVVzUjBGQlJ5eEpRVUZKTEdkQ1FVRm5RaXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNUVUZCVFN4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRExFVkJRVVVzUlVGQlJTeERRVUZETEVOQlFVTTdiMEpCUTNaRUxFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRE8yOUNRVWxvUWl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRE8zZENRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFbEJRVWtzWTBGQll5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeEZRVUZGTEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNN2FVSkJReTlFTzJkQ1FVVkVMRWxCUVVrc1EwRkJReXhEUVVGRExFMUJRVTBzUjBGQlJ5eERRVUZETzI5Q1FVRkZMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NZMEZCWXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhOUVVGTkxFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJRenRoUVVOc1JqdFpRVU5FTEV0QlFVc3NTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hGUVVGRk8yZENRVU0xUWl4SlFVRkpMRVZCUVVVc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdaMEpCUTJRc1MwRkJTeXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVWQlFVVTdiMEpCUXpWQ0xFbEJRVWtzUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkRWQ3hEUVVGRExFZEJRVWNzVVVGQlVTeERRVUZETEVWQlFVVXNSVUZCUlN4RlFVRkZMRU5CUVVNc1EwRkJRenR2UWtGRGVrSXNTMEZCU3l4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFVkJRVVU3ZDBKQlEySXNTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVU5TTEUxQlFVMHNSMEZCUnl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEUxQlFVMHNSMEZCUnl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETzNkQ1FVTjZReXhKUVVGSkxFTkJRVU1zWjBKQlFXZENMRU5CUVVNc1RVRkJUU3hGUVVGRkxFMUJRVTBzUlVGQlJTeERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNN2NVSkJReTlETzJsQ1FVTktPMkZCUTBvN1UwRkRTanRoUVVGTk8xbEJRMGdzU1VGQlNTeERRVUZETEVOQlFVTXNSMEZCUnl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTjJRaXhKUVVGSkxFTkJRVU1zUTBGQlF5eEhRVUZITEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFOQlF6RkNPMGxCUTB3c1EwRkJRenRKUVVORUxHbEVRVUZuUWl4SFFVRm9RaXhWUVVGcFFpeERRVUZYTEVWQlFVVXNRMEZCVnl4RlFVRkZMRVZCUVZVc1JVRkJSU3hGUVVGVk8xRkJRemRFTEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1pVRkJaU3hEUVVGRExFbEJRVWtzVjBGQlZ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeEZRVUZGTEVWQlFVVXNSVUZCUlN4RFFVRkRMRVZCUVVVN1dVRkRjRVVzU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1NVRkJTU3hqUVVGakxFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNSVUZCUlN4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dFRRVU12UXp0SlFVTk1MRU5CUVVNN1NVRkRSQ3g1UTBGQlVTeEhRVUZTTEZWQlFWTXNRMEZCVnl4RlFVRkZMRVZCUVZVN1VVRkROVUlzU1VGQlNTeERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhOUVVGTkxFTkJRVU03VVVGRGRFSXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zU1VGQlNTeG5Ra0ZCWjBJc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEUxQlFVMHNSVUZCUlN4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZETVVRc1MwRkJTeXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hGUVVGRkxFTkJRVU1zUlVGQlJUdFpRVU40UWl4SlFVRkpMRU5CUVVNc1MwRkJTeXhGUVVGRk8yZENRVUZGTEZOQlFWTTdXVUZEZGtJc1NVRkJTU3hKUVVGSkxFZEJRVWNzU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkRhRUlzUTBGQlF5eEhRVUZITEd0Q1FVRnJRaXhEUVVGRExFTkJRVU1zUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXp0WlFVTndReXhKUVVGSkxFTkJRVU1zWjBKQlFXZENMRU5CUVVNc1EwRkJReXhGUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRVZCUVVVc1JVRkJSU3hGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETzFsQlF6bERMRWxCUVVrc1EwRkJReXhuUWtGQlowSXNRMEZCUXl4RFFVRkRMRVZCUVVVc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNSVUZCUlN4RlFVRkZMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU03VTBGRGFrUTdVVUZEUkN4UFFVRlBMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU03U1VGRGFFSXNRMEZCUXp0SlFVTlBMR2RFUVVGbExFZEJRWFpDTEZWQlFYZENMRU5CUVdNc1JVRkJSU3hGUVVGVkxFVkJRVVVzUlVGQlZUdFJRVU14UkN4TFFVRkxMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhOUVVGTkxFVkJRVVVzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RlFVRkZMRU5CUVVNc1JVRkJSVHRaUVVNelF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4RlFVRkZMRWxCUVVrc1EwRkJReXhKUVVGSkxFVkJRVVVzU1VGQlNTeFZRVUZWTEVOQlFVTXNRMEZCUXl4RlFVRkZMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4TlFVRk5MRWRCUVVjc1EwRkJReXhGUVVGRk8yZENRVU16UkN4UFFVRlBMRWxCUVVrc1EwRkJRenRoUVVObU8xTkJRMG83VVVGRFJDeFBRVUZQTEV0QlFVc3NRMEZCUXp0SlFVTnFRaXhEUVVGRE8wbEJRMHdzTmtKQlFVTTdRVUZCUkN4RFFVRkRMRUZCYUVWRUxFbEJaMFZETzBGQmFFVlpMSGRFUVVGelFqdEJRV3RGYmtNc1UwRkJVeXhWUVVGVkxFTkJRVU1zUTBGQll5eEZRVUZGTEVOQlFWVTdTVUZETVVNc1NVRkJTU3hKUVVGSkxFZEJRVWNzUlVGQlJTeERRVUZETzBsQlEyUXNTMEZCU3l4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4TlFVRk5MRVZCUVVVc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeEZRVUZGTEVOQlFVTXNSVUZCUlR0UlFVTjBReXhKUVVGSkxFZEJRVWNzUjBGQlJ5eHhRa0ZCVXl4RFFVRkRMR2RDUVVGblFpeERRVU5vUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hGUVVGRkxFTkJRVU1zUTBGQlF5eEZRVUZGTEVWQlExWXNRMEZCUXl4RFFVRkRMRVZCUVVVc1JVRkJSU3hEUVVGRExFTkJRVU1zUlVGQlJTeEZRVU5XTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVU4wUWl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRMklzUTBGQlF6dFJRVU5PTEVsQlFVa3NSMEZCUnp0WlFVRkZMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTTdTMEZETTBJN1NVRkRSQ3hQUVVGUExFbEJRVWtzUTBGQlF6dEJRVU5vUWl4RFFVRkRPMEZCUlVRc1UwRkJaMElzVVVGQlVTeERRVUZETEVOQlFWVXNSVUZCUlN4RFFVRlZPMGxCUlRORExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4TlFVRk5MRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNUVUZCVFN4SFFVRkhMRU5CUVVNc1EwRkJRenRKUVVOMlF5eEpRVUZKTEVWQlFVVXNSMEZCUnl4SlFVRkpMRlZCUVZVc1JVRkJSU3hEUVVGRE8wbEJRekZDTEV0QlFVc3NTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNSVUZCUlN4RFFVRkRMRVZCUVVVN1VVRkRlRUlzUzBGQlN5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeEZRVUZGTEVOQlFVTXNSVUZCUlR0WlFVTjRRaXhKUVVGSkxFVkJRVVVzUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETzFsQlEyNURMRWxCUVVrc1JVRkJSU3hIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTmtMRWxCUVVrc1JVRkJSU3hIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkRiRUlzU1VGQlNTeEZRVUZGTEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTnVReXhKUVVGSkxFVkJRVVVzUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkRaQ3hKUVVGSkxFVkJRVVVzUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRMnhDTEVsQlFVa3NUVUZCVFN4SFFVRkhMRTFCUVUwc1EwRkJReXhGUVVGRkxFVkJRVVVzUlVGQlJTeEZRVUZGTEVWQlFVVXNRMEZCUXl4RFFVRkRPMWxCUTJoRExFbEJRVWtzVFVGQlRTeEhRVUZITEUxQlFVMHNRMEZCUXl4RlFVRkZMRVZCUVVVc1JVRkJSU3hGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZETzFsQlEyaERMRWxCUVVrc1RVRkJUU3hIUVVGSExFMUJRVTBzUTBGQlF5eEZRVUZGTEVWQlFVVXNSVUZCUlN4RlFVRkZMRVZCUVVVc1EwRkJReXhEUVVGRE8xbEJRMmhETEVsQlFVa3NUVUZCVFN4SFFVRkhMRTFCUVUwc1EwRkJReXhGUVVGRkxFVkJRVVVzUlVGQlJTeEZRVUZGTEVWQlFVVXNRMEZCUXl4RFFVRkRPMWxCUTJoRExFbEJRVWtzVFVGQlRTeEhRVUZITEUxQlFVMHNRMEZCUXl4RlFVRkZMRVZCUVVVc1JVRkJSU3hGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZETzFsQlEyaERMRWxCUVVrc1RVRkJUU3hIUVVGSExFMUJRVTBzUTBGQlF5eEZRVUZGTEVWQlFVVXNSVUZCUlN4RlFVRkZMRVZCUVVVc1EwRkJReXhEUVVGRE8xbEJRMmhETEVsQlFVa3NUVUZCVFN4SlFVRkpMRU5CUVVNc1NVRkJTU3hOUVVGTkxFbEJRVWtzUTBGQlF5eEpRVUZKTEUxQlFVMHNSMEZCUnl4RFFVRkRPMjFDUVVOeVF5eE5RVUZOTEVsQlFVa3NRMEZCUXl4SlFVRkpMRTFCUVUwc1NVRkJTU3hEUVVGRExFbEJRVWtzVFVGQlRTeEhRVUZITEVOQlFVTXNSVUZCUlR0blFrRkRla01zUlVGQlJTeERRVUZETEVWQlFVVXNSMEZCUnl4SlFVRkpMRk5CUVZNc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdZVUZEYmtNN2FVSkJRVTBzU1VGQlNTeE5RVUZOTEVsQlFVa3NRMEZCUXl4SlFVRkpMRTFCUVUwc1NVRkJTU3hEUVVGRExFbEJRVWtzVFVGQlRTeEhRVUZITEVOQlFVTTdiVUpCUXpWRExFMUJRVTBzU1VGQlNTeERRVUZETEVsQlFVa3NUVUZCVFN4SlFVRkpMRU5CUVVNc1NVRkJTU3hOUVVGTkxFZEJRVWNzUTBGQlF5eEZRVUZGTzJkQ1FVTjZReXhGUVVGRkxFTkJRVU1zUlVGQlJTeEhRVUZITEVsQlFVa3NVMEZCVXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dGhRVU51UXp0cFFrRkJUU3hKUVVGSkxFMUJRVTBzU1VGQlNTeERRVUZETEVsQlFVa3NUVUZCVFN4SFFVRkhMRU5CUVVNc1NVRkJTU3hOUVVGTkxFbEJRVWtzUTBGQlF6dHRRa0ZETlVNc1RVRkJUU3hKUVVGSkxFTkJRVU1zU1VGQlNTeE5RVUZOTEVkQlFVY3NRMEZCUXl4SlFVRkpMRTFCUVUwc1NVRkJTU3hEUVVGRExFVkJRVVU3WjBKQlEzcERMRVZCUVVVc1EwRkJReXhGUVVGRkxFZEJRVWNzU1VGQlNTeFRRVUZUTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRE8yRkJRMjVETzJsQ1FVRk5MRWxCUVVrc1RVRkJUU3hKUVVGSkxFTkJRVU1zU1VGQlNTeE5RVUZOTEVkQlFVY3NRMEZCUXl4SlFVRkpMRTFCUVUwc1NVRkJTU3hEUVVGRE8yMUNRVU0xUXl4TlFVRk5MRWxCUVVrc1EwRkJReXhKUVVGSkxFMUJRVTBzUjBGQlJ5eERRVUZETEVsQlFVa3NUVUZCVFN4SlFVRkpMRU5CUVVNc1JVRkJSVHRuUWtGRGVrTXNSVUZCUlN4RFFVRkRMRVZCUVVVc1IwRkJSeXhKUVVGSkxGTkJRVk1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1lVRkRia003VTBGRFNqdExRVU5LTzBsQlEwUXNUMEZCVHl4RlFVRkZMRU5CUVVNN1FVRkRaQ3hEUVVGRE8wRkJiRU5FTERSQ1FXdERRenRCUVVWRUxGTkJRVk1zYVVKQlFXbENMRU5CUVVNc1EwRkJVU3hGUVVGRkxFbEJRV0U3U1VGRE9VTXNTMEZCU3l4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4TlFVRk5MRVZCUVVVc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeEZRVUZGTEVOQlFVTTdVVUZEZGtNc1NVRkJTU3hMUVVGTExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1JVRkJSU3hKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRPMWxCUVVVc1QwRkJUeXhMUVVGTExFTkJRVU03U1VGRGNrUXNUMEZCVHl4SlFVRkpMRU5CUVVNN1FVRkRhRUlzUTBGQlF6dEJRVVZFTEZOQlFWTXNVMEZCVXl4RFFVRkRMRU5CUVZVc1JVRkJSU3hEUVVGVk8wbEJRM0pETEU5QlFVOHNRMEZCUXl4RFFVRkRMRU5CUVVNc1MwRkJTeXhEUVVGRExGVkJRVUVzUTBGQlF5eEpRVUZKTEU5QlFVRXNRMEZCUXl4cFFrRkJhVUlzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRVZCUVhoQ0xFTkJRWGRDTEVOQlFVTXNRMEZCUXp0QlFVTnVSQ3hEUVVGRE8wRkJSVVFzVTBGQlowSXNXVUZCV1N4RFFVRkRMRU5CUVZVc1JVRkJSU3hEUVVGVk8wbEJReTlETEVsQlFVa3NVMEZCVXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU03VVVGQlJTeFBRVUZQTEVsQlFVa3NRMEZCUXp0SlFVTnFReXhKUVVGSkxGTkJRVk1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRPMUZCUVVVc1QwRkJUeXhKUVVGSkxFTkJRVU03U1VGRGFrTXNTMEZCU3l4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4TlFVRk5MRVZCUVVVc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeEZRVUZGTEVOQlFVTXNSVUZCUlR0UlFVTjBReXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRNMElzU1VGQlNTeFZRVUZWTEVOQlFVTXNTVUZCU1N4WFFVRlhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFMUJRVTBzUjBGQlJ5eERRVUZETzFsQlFVVXNUMEZCVHl4SlFVRkpMRU5CUVVNN1MwRkRiRVk3U1VGRFJDeFBRVUZQTEV0QlFVc3NRMEZCUXp0QlFVTnFRaXhEUVVGRE8wRkJVa1FzYjBOQlVVTWlmUT09IiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgcmVjdGFuZ2xlXzEgPSByZXF1aXJlKFwiLi9yZWN0YW5nbGVcIik7XG52YXIgdnBzY18xID0gcmVxdWlyZShcIi4vdnBzY1wiKTtcbnZhciBzaG9ydGVzdHBhdGhzXzEgPSByZXF1aXJlKFwiLi9zaG9ydGVzdHBhdGhzXCIpO1xudmFyIE5vZGVXcmFwcGVyID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBOb2RlV3JhcHBlcihpZCwgcmVjdCwgY2hpbGRyZW4pIHtcbiAgICAgICAgdGhpcy5pZCA9IGlkO1xuICAgICAgICB0aGlzLnJlY3QgPSByZWN0O1xuICAgICAgICB0aGlzLmNoaWxkcmVuID0gY2hpbGRyZW47XG4gICAgICAgIHRoaXMubGVhZiA9IHR5cGVvZiBjaGlsZHJlbiA9PT0gJ3VuZGVmaW5lZCcgfHwgY2hpbGRyZW4ubGVuZ3RoID09PSAwO1xuICAgIH1cbiAgICByZXR1cm4gTm9kZVdyYXBwZXI7XG59KCkpO1xuZXhwb3J0cy5Ob2RlV3JhcHBlciA9IE5vZGVXcmFwcGVyO1xudmFyIFZlcnQgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFZlcnQoaWQsIHgsIHksIG5vZGUsIGxpbmUpIHtcbiAgICAgICAgaWYgKG5vZGUgPT09IHZvaWQgMCkgeyBub2RlID0gbnVsbDsgfVxuICAgICAgICBpZiAobGluZSA9PT0gdm9pZCAwKSB7IGxpbmUgPSBudWxsOyB9XG4gICAgICAgIHRoaXMuaWQgPSBpZDtcbiAgICAgICAgdGhpcy54ID0geDtcbiAgICAgICAgdGhpcy55ID0geTtcbiAgICAgICAgdGhpcy5ub2RlID0gbm9kZTtcbiAgICAgICAgdGhpcy5saW5lID0gbGluZTtcbiAgICB9XG4gICAgcmV0dXJuIFZlcnQ7XG59KCkpO1xuZXhwb3J0cy5WZXJ0ID0gVmVydDtcbnZhciBMb25nZXN0Q29tbW9uU3Vic2VxdWVuY2UgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIExvbmdlc3RDb21tb25TdWJzZXF1ZW5jZShzLCB0KSB7XG4gICAgICAgIHRoaXMucyA9IHM7XG4gICAgICAgIHRoaXMudCA9IHQ7XG4gICAgICAgIHZhciBtZiA9IExvbmdlc3RDb21tb25TdWJzZXF1ZW5jZS5maW5kTWF0Y2gocywgdCk7XG4gICAgICAgIHZhciB0ciA9IHQuc2xpY2UoMCkucmV2ZXJzZSgpO1xuICAgICAgICB2YXIgbXIgPSBMb25nZXN0Q29tbW9uU3Vic2VxdWVuY2UuZmluZE1hdGNoKHMsIHRyKTtcbiAgICAgICAgaWYgKG1mLmxlbmd0aCA+PSBtci5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRoaXMubGVuZ3RoID0gbWYubGVuZ3RoO1xuICAgICAgICAgICAgdGhpcy5zaSA9IG1mLnNpO1xuICAgICAgICAgICAgdGhpcy50aSA9IG1mLnRpO1xuICAgICAgICAgICAgdGhpcy5yZXZlcnNlZCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5sZW5ndGggPSBtci5sZW5ndGg7XG4gICAgICAgICAgICB0aGlzLnNpID0gbXIuc2k7XG4gICAgICAgICAgICB0aGlzLnRpID0gdC5sZW5ndGggLSBtci50aSAtIG1yLmxlbmd0aDtcbiAgICAgICAgICAgIHRoaXMucmV2ZXJzZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIExvbmdlc3RDb21tb25TdWJzZXF1ZW5jZS5maW5kTWF0Y2ggPSBmdW5jdGlvbiAocywgdCkge1xuICAgICAgICB2YXIgbSA9IHMubGVuZ3RoO1xuICAgICAgICB2YXIgbiA9IHQubGVuZ3RoO1xuICAgICAgICB2YXIgbWF0Y2ggPSB7IGxlbmd0aDogMCwgc2k6IC0xLCB0aTogLTEgfTtcbiAgICAgICAgdmFyIGwgPSBuZXcgQXJyYXkobSk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbTsgaSsrKSB7XG4gICAgICAgICAgICBsW2ldID0gbmV3IEFycmF5KG4pO1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBuOyBqKyspXG4gICAgICAgICAgICAgICAgaWYgKHNbaV0gPT09IHRbal0pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHYgPSBsW2ldW2pdID0gKGkgPT09IDAgfHwgaiA9PT0gMCkgPyAxIDogbFtpIC0gMV1baiAtIDFdICsgMTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHYgPiBtYXRjaC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoLmxlbmd0aCA9IHY7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXRjaC5zaSA9IGkgLSB2ICsgMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoLnRpID0gaiAtIHYgKyAxO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBsW2ldW2pdID0gMDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWF0Y2g7XG4gICAgfTtcbiAgICBMb25nZXN0Q29tbW9uU3Vic2VxdWVuY2UucHJvdG90eXBlLmdldFNlcXVlbmNlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sZW5ndGggPj0gMCA/IHRoaXMucy5zbGljZSh0aGlzLnNpLCB0aGlzLnNpICsgdGhpcy5sZW5ndGgpIDogW107XG4gICAgfTtcbiAgICByZXR1cm4gTG9uZ2VzdENvbW1vblN1YnNlcXVlbmNlO1xufSgpKTtcbmV4cG9ydHMuTG9uZ2VzdENvbW1vblN1YnNlcXVlbmNlID0gTG9uZ2VzdENvbW1vblN1YnNlcXVlbmNlO1xudmFyIEdyaWRSb3V0ZXIgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEdyaWRSb3V0ZXIob3JpZ2luYWxub2RlcywgYWNjZXNzb3IsIGdyb3VwUGFkZGluZykge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICBpZiAoZ3JvdXBQYWRkaW5nID09PSB2b2lkIDApIHsgZ3JvdXBQYWRkaW5nID0gMTI7IH1cbiAgICAgICAgdGhpcy5vcmlnaW5hbG5vZGVzID0gb3JpZ2luYWxub2RlcztcbiAgICAgICAgdGhpcy5ncm91cFBhZGRpbmcgPSBncm91cFBhZGRpbmc7XG4gICAgICAgIHRoaXMubGVhdmVzID0gbnVsbDtcbiAgICAgICAgdGhpcy5ub2RlcyA9IG9yaWdpbmFsbm9kZXMubWFwKGZ1bmN0aW9uICh2LCBpKSB7IHJldHVybiBuZXcgTm9kZVdyYXBwZXIoaSwgYWNjZXNzb3IuZ2V0Qm91bmRzKHYpLCBhY2Nlc3Nvci5nZXRDaGlsZHJlbih2KSk7IH0pO1xuICAgICAgICB0aGlzLmxlYXZlcyA9IHRoaXMubm9kZXMuZmlsdGVyKGZ1bmN0aW9uICh2KSB7IHJldHVybiB2LmxlYWY7IH0pO1xuICAgICAgICB0aGlzLmdyb3VwcyA9IHRoaXMubm9kZXMuZmlsdGVyKGZ1bmN0aW9uIChnKSB7IHJldHVybiAhZy5sZWFmOyB9KTtcbiAgICAgICAgdGhpcy5jb2xzID0gdGhpcy5nZXRHcmlkTGluZXMoJ3gnKTtcbiAgICAgICAgdGhpcy5yb3dzID0gdGhpcy5nZXRHcmlkTGluZXMoJ3knKTtcbiAgICAgICAgdGhpcy5ncm91cHMuZm9yRWFjaChmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgcmV0dXJuIHYuY2hpbGRyZW4uZm9yRWFjaChmdW5jdGlvbiAoYykgeyByZXR1cm4gX3RoaXMubm9kZXNbY10ucGFyZW50ID0gdjsgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnJvb3QgPSB7IGNoaWxkcmVuOiBbXSB9O1xuICAgICAgICB0aGlzLm5vZGVzLmZvckVhY2goZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygdi5wYXJlbnQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgdi5wYXJlbnQgPSBfdGhpcy5yb290O1xuICAgICAgICAgICAgICAgIF90aGlzLnJvb3QuY2hpbGRyZW4ucHVzaCh2LmlkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHYucG9ydHMgPSBbXTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuYmFja1RvRnJvbnQgPSB0aGlzLm5vZGVzLnNsaWNlKDApO1xuICAgICAgICB0aGlzLmJhY2tUb0Zyb250LnNvcnQoZnVuY3Rpb24gKHgsIHkpIHsgcmV0dXJuIF90aGlzLmdldERlcHRoKHgpIC0gX3RoaXMuZ2V0RGVwdGgoeSk7IH0pO1xuICAgICAgICB2YXIgZnJvbnRUb0JhY2tHcm91cHMgPSB0aGlzLmJhY2tUb0Zyb250LnNsaWNlKDApLnJldmVyc2UoKS5maWx0ZXIoZnVuY3Rpb24gKGcpIHsgcmV0dXJuICFnLmxlYWY7IH0pO1xuICAgICAgICBmcm9udFRvQmFja0dyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICB2YXIgciA9IHJlY3RhbmdsZV8xLlJlY3RhbmdsZS5lbXB0eSgpO1xuICAgICAgICAgICAgdi5jaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uIChjKSB7IHJldHVybiByID0gci51bmlvbihfdGhpcy5ub2Rlc1tjXS5yZWN0KTsgfSk7XG4gICAgICAgICAgICB2LnJlY3QgPSByLmluZmxhdGUoX3RoaXMuZ3JvdXBQYWRkaW5nKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciBjb2xNaWRzID0gdGhpcy5taWRQb2ludHModGhpcy5jb2xzLm1hcChmdW5jdGlvbiAocikgeyByZXR1cm4gci5wb3M7IH0pKTtcbiAgICAgICAgdmFyIHJvd01pZHMgPSB0aGlzLm1pZFBvaW50cyh0aGlzLnJvd3MubWFwKGZ1bmN0aW9uIChyKSB7IHJldHVybiByLnBvczsgfSkpO1xuICAgICAgICB2YXIgcm93eCA9IGNvbE1pZHNbMF0sIHJvd1ggPSBjb2xNaWRzW2NvbE1pZHMubGVuZ3RoIC0gMV07XG4gICAgICAgIHZhciBjb2x5ID0gcm93TWlkc1swXSwgY29sWSA9IHJvd01pZHNbcm93TWlkcy5sZW5ndGggLSAxXTtcbiAgICAgICAgdmFyIGhsaW5lcyA9IHRoaXMucm93cy5tYXAoZnVuY3Rpb24gKHIpIHsgcmV0dXJuICh7IHgxOiByb3d4LCB4Mjogcm93WCwgeTE6IHIucG9zLCB5Mjogci5wb3MgfSk7IH0pXG4gICAgICAgICAgICAuY29uY2F0KHJvd01pZHMubWFwKGZ1bmN0aW9uIChtKSB7IHJldHVybiAoeyB4MTogcm93eCwgeDI6IHJvd1gsIHkxOiBtLCB5MjogbSB9KTsgfSkpO1xuICAgICAgICB2YXIgdmxpbmVzID0gdGhpcy5jb2xzLm1hcChmdW5jdGlvbiAoYykgeyByZXR1cm4gKHsgeDE6IGMucG9zLCB4MjogYy5wb3MsIHkxOiBjb2x5LCB5MjogY29sWSB9KTsgfSlcbiAgICAgICAgICAgIC5jb25jYXQoY29sTWlkcy5tYXAoZnVuY3Rpb24gKG0pIHsgcmV0dXJuICh7IHgxOiBtLCB4MjogbSwgeTE6IGNvbHksIHkyOiBjb2xZIH0pOyB9KSk7XG4gICAgICAgIHZhciBsaW5lcyA9IGhsaW5lcy5jb25jYXQodmxpbmVzKTtcbiAgICAgICAgbGluZXMuZm9yRWFjaChmdW5jdGlvbiAobCkgeyByZXR1cm4gbC52ZXJ0cyA9IFtdOyB9KTtcbiAgICAgICAgdGhpcy52ZXJ0cyA9IFtdO1xuICAgICAgICB0aGlzLmVkZ2VzID0gW107XG4gICAgICAgIGhsaW5lcy5mb3JFYWNoKGZ1bmN0aW9uIChoKSB7XG4gICAgICAgICAgICByZXR1cm4gdmxpbmVzLmZvckVhY2goZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgICAgICB2YXIgcCA9IG5ldyBWZXJ0KF90aGlzLnZlcnRzLmxlbmd0aCwgdi54MSwgaC55MSk7XG4gICAgICAgICAgICAgICAgaC52ZXJ0cy5wdXNoKHApO1xuICAgICAgICAgICAgICAgIHYudmVydHMucHVzaChwKTtcbiAgICAgICAgICAgICAgICBfdGhpcy52ZXJ0cy5wdXNoKHApO1xuICAgICAgICAgICAgICAgIHZhciBpID0gX3RoaXMuYmFja1RvRnJvbnQubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHdoaWxlIChpLS0gPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBub2RlID0gX3RoaXMuYmFja1RvRnJvbnRbaV0sIHIgPSBub2RlLnJlY3Q7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkeCA9IE1hdGguYWJzKHAueCAtIHIuY3goKSksIGR5ID0gTWF0aC5hYnMocC55IC0gci5jeSgpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGR4IDwgci53aWR0aCgpIC8gMiAmJiBkeSA8IHIuaGVpZ2h0KCkgLyAyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwLm5vZGUgPSBub2RlO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIGxpbmVzLmZvckVhY2goZnVuY3Rpb24gKGwsIGxpKSB7XG4gICAgICAgICAgICBfdGhpcy5ub2Rlcy5mb3JFYWNoKGZ1bmN0aW9uICh2LCBpKSB7XG4gICAgICAgICAgICAgICAgdi5yZWN0LmxpbmVJbnRlcnNlY3Rpb25zKGwueDEsIGwueTEsIGwueDIsIGwueTIpLmZvckVhY2goZnVuY3Rpb24gKGludGVyc2VjdCwgaikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcCA9IG5ldyBWZXJ0KF90aGlzLnZlcnRzLmxlbmd0aCwgaW50ZXJzZWN0LngsIGludGVyc2VjdC55LCB2LCBsKTtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMudmVydHMucHVzaChwKTtcbiAgICAgICAgICAgICAgICAgICAgbC52ZXJ0cy5wdXNoKHApO1xuICAgICAgICAgICAgICAgICAgICB2LnBvcnRzLnB1c2gocCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHZhciBpc0hvcml6ID0gTWF0aC5hYnMobC55MSAtIGwueTIpIDwgMC4xO1xuICAgICAgICAgICAgdmFyIGRlbHRhID0gZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGlzSG9yaXogPyBiLnggLSBhLnggOiBiLnkgLSBhLnk7IH07XG4gICAgICAgICAgICBsLnZlcnRzLnNvcnQoZGVsdGEpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBsLnZlcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHUgPSBsLnZlcnRzW2kgLSAxXSwgdiA9IGwudmVydHNbaV07XG4gICAgICAgICAgICAgICAgaWYgKHUubm9kZSAmJiB1Lm5vZGUgPT09IHYubm9kZSAmJiB1Lm5vZGUubGVhZilcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgX3RoaXMuZWRnZXMucHVzaCh7IHNvdXJjZTogdS5pZCwgdGFyZ2V0OiB2LmlkLCBsZW5ndGg6IE1hdGguYWJzKGRlbHRhKHUsIHYpKSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIEdyaWRSb3V0ZXIucHJvdG90eXBlLmF2ZyA9IGZ1bmN0aW9uIChhKSB7IHJldHVybiBhLnJlZHVjZShmdW5jdGlvbiAoeCwgeSkgeyByZXR1cm4geCArIHk7IH0pIC8gYS5sZW5ndGg7IH07XG4gICAgR3JpZFJvdXRlci5wcm90b3R5cGUuZ2V0R3JpZExpbmVzID0gZnVuY3Rpb24gKGF4aXMpIHtcbiAgICAgICAgdmFyIGNvbHVtbnMgPSBbXTtcbiAgICAgICAgdmFyIGxzID0gdGhpcy5sZWF2ZXMuc2xpY2UoMCwgdGhpcy5sZWF2ZXMubGVuZ3RoKTtcbiAgICAgICAgd2hpbGUgKGxzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHZhciBvdmVybGFwcGluZyA9IGxzLmZpbHRlcihmdW5jdGlvbiAodikgeyByZXR1cm4gdi5yZWN0WydvdmVybGFwJyArIGF4aXMudG9VcHBlckNhc2UoKV0obHNbMF0ucmVjdCk7IH0pO1xuICAgICAgICAgICAgdmFyIGNvbCA9IHtcbiAgICAgICAgICAgICAgICBub2Rlczogb3ZlcmxhcHBpbmcsXG4gICAgICAgICAgICAgICAgcG9zOiB0aGlzLmF2ZyhvdmVybGFwcGluZy5tYXAoZnVuY3Rpb24gKHYpIHsgcmV0dXJuIHYucmVjdFsnYycgKyBheGlzXSgpOyB9KSlcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb2x1bW5zLnB1c2goY29sKTtcbiAgICAgICAgICAgIGNvbC5ub2Rlcy5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7IHJldHVybiBscy5zcGxpY2UobHMuaW5kZXhPZih2KSwgMSk7IH0pO1xuICAgICAgICB9XG4gICAgICAgIGNvbHVtbnMuc29ydChmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYS5wb3MgLSBiLnBvczsgfSk7XG4gICAgICAgIHJldHVybiBjb2x1bW5zO1xuICAgIH07XG4gICAgR3JpZFJvdXRlci5wcm90b3R5cGUuZ2V0RGVwdGggPSBmdW5jdGlvbiAodikge1xuICAgICAgICB2YXIgZGVwdGggPSAwO1xuICAgICAgICB3aGlsZSAodi5wYXJlbnQgIT09IHRoaXMucm9vdCkge1xuICAgICAgICAgICAgZGVwdGgrKztcbiAgICAgICAgICAgIHYgPSB2LnBhcmVudDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGVwdGg7XG4gICAgfTtcbiAgICBHcmlkUm91dGVyLnByb3RvdHlwZS5taWRQb2ludHMgPSBmdW5jdGlvbiAoYSkge1xuICAgICAgICB2YXIgZ2FwID0gYVsxXSAtIGFbMF07XG4gICAgICAgIHZhciBtaWRzID0gW2FbMF0gLSBnYXAgLyAyXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBtaWRzLnB1c2goKGFbaV0gKyBhW2kgLSAxXSkgLyAyKTtcbiAgICAgICAgfVxuICAgICAgICBtaWRzLnB1c2goYVthLmxlbmd0aCAtIDFdICsgZ2FwIC8gMik7XG4gICAgICAgIHJldHVybiBtaWRzO1xuICAgIH07XG4gICAgR3JpZFJvdXRlci5wcm90b3R5cGUuZmluZExpbmVhZ2UgPSBmdW5jdGlvbiAodikge1xuICAgICAgICB2YXIgbGluZWFnZSA9IFt2XTtcbiAgICAgICAgZG8ge1xuICAgICAgICAgICAgdiA9IHYucGFyZW50O1xuICAgICAgICAgICAgbGluZWFnZS5wdXNoKHYpO1xuICAgICAgICB9IHdoaWxlICh2ICE9PSB0aGlzLnJvb3QpO1xuICAgICAgICByZXR1cm4gbGluZWFnZS5yZXZlcnNlKCk7XG4gICAgfTtcbiAgICBHcmlkUm91dGVyLnByb3RvdHlwZS5maW5kQW5jZXN0b3JQYXRoQmV0d2VlbiA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgIHZhciBhYSA9IHRoaXMuZmluZExpbmVhZ2UoYSksIGJhID0gdGhpcy5maW5kTGluZWFnZShiKSwgaSA9IDA7XG4gICAgICAgIHdoaWxlIChhYVtpXSA9PT0gYmFbaV0pXG4gICAgICAgICAgICBpKys7XG4gICAgICAgIHJldHVybiB7IGNvbW1vbkFuY2VzdG9yOiBhYVtpIC0gMV0sIGxpbmVhZ2VzOiBhYS5zbGljZShpKS5jb25jYXQoYmEuc2xpY2UoaSkpIH07XG4gICAgfTtcbiAgICBHcmlkUm91dGVyLnByb3RvdHlwZS5zaWJsaW5nT2JzdGFjbGVzID0gZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIHBhdGggPSB0aGlzLmZpbmRBbmNlc3RvclBhdGhCZXR3ZWVuKGEsIGIpO1xuICAgICAgICB2YXIgbGluZWFnZUxvb2t1cCA9IHt9O1xuICAgICAgICBwYXRoLmxpbmVhZ2VzLmZvckVhY2goZnVuY3Rpb24gKHYpIHsgcmV0dXJuIGxpbmVhZ2VMb29rdXBbdi5pZF0gPSB7fTsgfSk7XG4gICAgICAgIHZhciBvYnN0YWNsZXMgPSBwYXRoLmNvbW1vbkFuY2VzdG9yLmNoaWxkcmVuLmZpbHRlcihmdW5jdGlvbiAodikgeyByZXR1cm4gISh2IGluIGxpbmVhZ2VMb29rdXApOyB9KTtcbiAgICAgICAgcGF0aC5saW5lYWdlc1xuICAgICAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAodikgeyByZXR1cm4gdi5wYXJlbnQgIT09IHBhdGguY29tbW9uQW5jZXN0b3I7IH0pXG4gICAgICAgICAgICAuZm9yRWFjaChmdW5jdGlvbiAodikgeyByZXR1cm4gb2JzdGFjbGVzID0gb2JzdGFjbGVzLmNvbmNhdCh2LnBhcmVudC5jaGlsZHJlbi5maWx0ZXIoZnVuY3Rpb24gKGMpIHsgcmV0dXJuIGMgIT09IHYuaWQ7IH0pKTsgfSk7XG4gICAgICAgIHJldHVybiBvYnN0YWNsZXMubWFwKGZ1bmN0aW9uICh2KSB7IHJldHVybiBfdGhpcy5ub2Rlc1t2XTsgfSk7XG4gICAgfTtcbiAgICBHcmlkUm91dGVyLmdldFNlZ21lbnRTZXRzID0gZnVuY3Rpb24gKHJvdXRlcywgeCwgeSkge1xuICAgICAgICB2YXIgdnNlZ21lbnRzID0gW107XG4gICAgICAgIGZvciAodmFyIGVpID0gMDsgZWkgPCByb3V0ZXMubGVuZ3RoOyBlaSsrKSB7XG4gICAgICAgICAgICB2YXIgcm91dGUgPSByb3V0ZXNbZWldO1xuICAgICAgICAgICAgZm9yICh2YXIgc2kgPSAwOyBzaSA8IHJvdXRlLmxlbmd0aDsgc2krKykge1xuICAgICAgICAgICAgICAgIHZhciBzID0gcm91dGVbc2ldO1xuICAgICAgICAgICAgICAgIHMuZWRnZWlkID0gZWk7XG4gICAgICAgICAgICAgICAgcy5pID0gc2k7XG4gICAgICAgICAgICAgICAgdmFyIHNkeCA9IHNbMV1beF0gLSBzWzBdW3hdO1xuICAgICAgICAgICAgICAgIGlmIChNYXRoLmFicyhzZHgpIDwgMC4xKSB7XG4gICAgICAgICAgICAgICAgICAgIHZzZWdtZW50cy5wdXNoKHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2c2VnbWVudHMuc29ydChmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYVswXVt4XSAtIGJbMF1beF07IH0pO1xuICAgICAgICB2YXIgdnNlZ21lbnRzZXRzID0gW107XG4gICAgICAgIHZhciBzZWdtZW50c2V0ID0gbnVsbDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2c2VnbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBzID0gdnNlZ21lbnRzW2ldO1xuICAgICAgICAgICAgaWYgKCFzZWdtZW50c2V0IHx8IE1hdGguYWJzKHNbMF1beF0gLSBzZWdtZW50c2V0LnBvcykgPiAwLjEpIHtcbiAgICAgICAgICAgICAgICBzZWdtZW50c2V0ID0geyBwb3M6IHNbMF1beF0sIHNlZ21lbnRzOiBbXSB9O1xuICAgICAgICAgICAgICAgIHZzZWdtZW50c2V0cy5wdXNoKHNlZ21lbnRzZXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2VnbWVudHNldC5zZWdtZW50cy5wdXNoKHMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB2c2VnbWVudHNldHM7XG4gICAgfTtcbiAgICBHcmlkUm91dGVyLm51ZGdlU2VncyA9IGZ1bmN0aW9uICh4LCB5LCByb3V0ZXMsIHNlZ21lbnRzLCBsZWZ0T2YsIGdhcCkge1xuICAgICAgICB2YXIgbiA9IHNlZ21lbnRzLmxlbmd0aDtcbiAgICAgICAgaWYgKG4gPD0gMSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdmFyIHZzID0gc2VnbWVudHMubWFwKGZ1bmN0aW9uIChzKSB7IHJldHVybiBuZXcgdnBzY18xLlZhcmlhYmxlKHNbMF1beF0pOyB9KTtcbiAgICAgICAgdmFyIGNzID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IG47IGorKykge1xuICAgICAgICAgICAgICAgIGlmIChpID09PSBqKVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB2YXIgczEgPSBzZWdtZW50c1tpXSwgczIgPSBzZWdtZW50c1tqXSwgZTEgPSBzMS5lZGdlaWQsIGUyID0gczIuZWRnZWlkLCBsaW5kID0gLTEsIHJpbmQgPSAtMTtcbiAgICAgICAgICAgICAgICBpZiAoeCA9PSAneCcpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxlZnRPZihlMSwgZTIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoczFbMF1beV0gPCBzMVsxXVt5XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbmQgPSBqLCByaW5kID0gaTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbmQgPSBpLCByaW5kID0gajtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxlZnRPZihlMSwgZTIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoczFbMF1beV0gPCBzMVsxXVt5XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbmQgPSBpLCByaW5kID0gajtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbmQgPSBqLCByaW5kID0gaTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAobGluZCA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGNzLnB1c2gobmV3IHZwc2NfMS5Db25zdHJhaW50KHZzW2xpbmRdLCB2c1tyaW5kXSwgZ2FwKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhciBzb2x2ZXIgPSBuZXcgdnBzY18xLlNvbHZlcih2cywgY3MpO1xuICAgICAgICBzb2x2ZXIuc29sdmUoKTtcbiAgICAgICAgdnMuZm9yRWFjaChmdW5jdGlvbiAodiwgaSkge1xuICAgICAgICAgICAgdmFyIHMgPSBzZWdtZW50c1tpXTtcbiAgICAgICAgICAgIHZhciBwb3MgPSB2LnBvc2l0aW9uKCk7XG4gICAgICAgICAgICBzWzBdW3hdID0gc1sxXVt4XSA9IHBvcztcbiAgICAgICAgICAgIHZhciByb3V0ZSA9IHJvdXRlc1tzLmVkZ2VpZF07XG4gICAgICAgICAgICBpZiAocy5pID4gMClcbiAgICAgICAgICAgICAgICByb3V0ZVtzLmkgLSAxXVsxXVt4XSA9IHBvcztcbiAgICAgICAgICAgIGlmIChzLmkgPCByb3V0ZS5sZW5ndGggLSAxKVxuICAgICAgICAgICAgICAgIHJvdXRlW3MuaSArIDFdWzBdW3hdID0gcG9zO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIEdyaWRSb3V0ZXIubnVkZ2VTZWdtZW50cyA9IGZ1bmN0aW9uIChyb3V0ZXMsIHgsIHksIGxlZnRPZiwgZ2FwKSB7XG4gICAgICAgIHZhciB2c2VnbWVudHNldHMgPSBHcmlkUm91dGVyLmdldFNlZ21lbnRTZXRzKHJvdXRlcywgeCwgeSk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdnNlZ21lbnRzZXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgc3MgPSB2c2VnbWVudHNldHNbaV07XG4gICAgICAgICAgICB2YXIgZXZlbnRzID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHNzLnNlZ21lbnRzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHMgPSBzcy5zZWdtZW50c1tqXTtcbiAgICAgICAgICAgICAgICBldmVudHMucHVzaCh7IHR5cGU6IDAsIHM6IHMsIHBvczogTWF0aC5taW4oc1swXVt5XSwgc1sxXVt5XSkgfSk7XG4gICAgICAgICAgICAgICAgZXZlbnRzLnB1c2goeyB0eXBlOiAxLCBzOiBzLCBwb3M6IE1hdGgubWF4KHNbMF1beV0sIHNbMV1beV0pIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZXZlbnRzLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEucG9zIC0gYi5wb3MgKyBhLnR5cGUgLSBiLnR5cGU7IH0pO1xuICAgICAgICAgICAgdmFyIG9wZW4gPSBbXTtcbiAgICAgICAgICAgIHZhciBvcGVuQ291bnQgPSAwO1xuICAgICAgICAgICAgZXZlbnRzLmZvckVhY2goZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZS50eXBlID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIG9wZW4ucHVzaChlLnMpO1xuICAgICAgICAgICAgICAgICAgICBvcGVuQ291bnQrKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG9wZW5Db3VudC0tO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAob3BlbkNvdW50ID09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgR3JpZFJvdXRlci5udWRnZVNlZ3MoeCwgeSwgcm91dGVzLCBvcGVuLCBsZWZ0T2YsIGdhcCk7XG4gICAgICAgICAgICAgICAgICAgIG9wZW4gPSBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgR3JpZFJvdXRlci5wcm90b3R5cGUucm91dGVFZGdlcyA9IGZ1bmN0aW9uIChlZGdlcywgbnVkZ2VHYXAsIHNvdXJjZSwgdGFyZ2V0KSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciByb3V0ZVBhdGhzID0gZWRnZXMubWFwKGZ1bmN0aW9uIChlKSB7IHJldHVybiBfdGhpcy5yb3V0ZShzb3VyY2UoZSksIHRhcmdldChlKSk7IH0pO1xuICAgICAgICB2YXIgb3JkZXIgPSBHcmlkUm91dGVyLm9yZGVyRWRnZXMocm91dGVQYXRocyk7XG4gICAgICAgIHZhciByb3V0ZXMgPSByb3V0ZVBhdGhzLm1hcChmdW5jdGlvbiAoZSkgeyByZXR1cm4gR3JpZFJvdXRlci5tYWtlU2VnbWVudHMoZSk7IH0pO1xuICAgICAgICBHcmlkUm91dGVyLm51ZGdlU2VnbWVudHMocm91dGVzLCAneCcsICd5Jywgb3JkZXIsIG51ZGdlR2FwKTtcbiAgICAgICAgR3JpZFJvdXRlci5udWRnZVNlZ21lbnRzKHJvdXRlcywgJ3knLCAneCcsIG9yZGVyLCBudWRnZUdhcCk7XG4gICAgICAgIEdyaWRSb3V0ZXIudW5yZXZlcnNlRWRnZXMocm91dGVzLCByb3V0ZVBhdGhzKTtcbiAgICAgICAgcmV0dXJuIHJvdXRlcztcbiAgICB9O1xuICAgIEdyaWRSb3V0ZXIudW5yZXZlcnNlRWRnZXMgPSBmdW5jdGlvbiAocm91dGVzLCByb3V0ZVBhdGhzKSB7XG4gICAgICAgIHJvdXRlcy5mb3JFYWNoKGZ1bmN0aW9uIChzZWdtZW50cywgaSkge1xuICAgICAgICAgICAgdmFyIHBhdGggPSByb3V0ZVBhdGhzW2ldO1xuICAgICAgICAgICAgaWYgKHBhdGgucmV2ZXJzZWQpIHtcbiAgICAgICAgICAgICAgICBzZWdtZW50cy5yZXZlcnNlKCk7XG4gICAgICAgICAgICAgICAgc2VnbWVudHMuZm9yRWFjaChmdW5jdGlvbiAoc2VnbWVudCkge1xuICAgICAgICAgICAgICAgICAgICBzZWdtZW50LnJldmVyc2UoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBHcmlkUm91dGVyLmFuZ2xlQmV0d2VlbjJMaW5lcyA9IGZ1bmN0aW9uIChsaW5lMSwgbGluZTIpIHtcbiAgICAgICAgdmFyIGFuZ2xlMSA9IE1hdGguYXRhbjIobGluZTFbMF0ueSAtIGxpbmUxWzFdLnksIGxpbmUxWzBdLnggLSBsaW5lMVsxXS54KTtcbiAgICAgICAgdmFyIGFuZ2xlMiA9IE1hdGguYXRhbjIobGluZTJbMF0ueSAtIGxpbmUyWzFdLnksIGxpbmUyWzBdLnggLSBsaW5lMlsxXS54KTtcbiAgICAgICAgdmFyIGRpZmYgPSBhbmdsZTEgLSBhbmdsZTI7XG4gICAgICAgIGlmIChkaWZmID4gTWF0aC5QSSB8fCBkaWZmIDwgLU1hdGguUEkpIHtcbiAgICAgICAgICAgIGRpZmYgPSBhbmdsZTIgLSBhbmdsZTE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRpZmY7XG4gICAgfTtcbiAgICBHcmlkUm91dGVyLmlzTGVmdCA9IGZ1bmN0aW9uIChhLCBiLCBjKSB7XG4gICAgICAgIHJldHVybiAoKGIueCAtIGEueCkgKiAoYy55IC0gYS55KSAtIChiLnkgLSBhLnkpICogKGMueCAtIGEueCkpIDw9IDA7XG4gICAgfTtcbiAgICBHcmlkUm91dGVyLmdldE9yZGVyID0gZnVuY3Rpb24gKHBhaXJzKSB7XG4gICAgICAgIHZhciBvdXRnb2luZyA9IHt9O1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhaXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcCA9IHBhaXJzW2ldO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBvdXRnb2luZ1twLmxdID09PSAndW5kZWZpbmVkJylcbiAgICAgICAgICAgICAgICBvdXRnb2luZ1twLmxdID0ge307XG4gICAgICAgICAgICBvdXRnb2luZ1twLmxdW3Aucl0gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAobCwgcikgeyByZXR1cm4gdHlwZW9mIG91dGdvaW5nW2xdICE9PSAndW5kZWZpbmVkJyAmJiBvdXRnb2luZ1tsXVtyXTsgfTtcbiAgICB9O1xuICAgIEdyaWRSb3V0ZXIub3JkZXJFZGdlcyA9IGZ1bmN0aW9uIChlZGdlcykge1xuICAgICAgICB2YXIgZWRnZU9yZGVyID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZWRnZXMubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gaSArIDE7IGogPCBlZGdlcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIHZhciBlID0gZWRnZXNbaV0sIGYgPSBlZGdlc1tqXSwgbGNzID0gbmV3IExvbmdlc3RDb21tb25TdWJzZXF1ZW5jZShlLCBmKTtcbiAgICAgICAgICAgICAgICB2YXIgdSwgdmksIHZqO1xuICAgICAgICAgICAgICAgIGlmIChsY3MubGVuZ3RoID09PSAwKVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICBpZiAobGNzLnJldmVyc2VkKSB7XG4gICAgICAgICAgICAgICAgICAgIGYucmV2ZXJzZSgpO1xuICAgICAgICAgICAgICAgICAgICBmLnJldmVyc2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgbGNzID0gbmV3IExvbmdlc3RDb21tb25TdWJzZXF1ZW5jZShlLCBmKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKChsY3Muc2kgPD0gMCB8fCBsY3MudGkgPD0gMCkgJiZcbiAgICAgICAgICAgICAgICAgICAgKGxjcy5zaSArIGxjcy5sZW5ndGggPj0gZS5sZW5ndGggfHwgbGNzLnRpICsgbGNzLmxlbmd0aCA+PSBmLmxlbmd0aCkpIHtcbiAgICAgICAgICAgICAgICAgICAgZWRnZU9yZGVyLnB1c2goeyBsOiBpLCByOiBqIH0pO1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGxjcy5zaSArIGxjcy5sZW5ndGggPj0gZS5sZW5ndGggfHwgbGNzLnRpICsgbGNzLmxlbmd0aCA+PSBmLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICB1ID0gZVtsY3Muc2kgKyAxXTtcbiAgICAgICAgICAgICAgICAgICAgdmogPSBlW2xjcy5zaSAtIDFdO1xuICAgICAgICAgICAgICAgICAgICB2aSA9IGZbbGNzLnRpIC0gMV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB1ID0gZVtsY3Muc2kgKyBsY3MubGVuZ3RoIC0gMl07XG4gICAgICAgICAgICAgICAgICAgIHZpID0gZVtsY3Muc2kgKyBsY3MubGVuZ3RoXTtcbiAgICAgICAgICAgICAgICAgICAgdmogPSBmW2xjcy50aSArIGxjcy5sZW5ndGhdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoR3JpZFJvdXRlci5pc0xlZnQodSwgdmksIHZqKSkge1xuICAgICAgICAgICAgICAgICAgICBlZGdlT3JkZXIucHVzaCh7IGw6IGosIHI6IGkgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBlZGdlT3JkZXIucHVzaCh7IGw6IGksIHI6IGogfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBHcmlkUm91dGVyLmdldE9yZGVyKGVkZ2VPcmRlcik7XG4gICAgfTtcbiAgICBHcmlkUm91dGVyLm1ha2VTZWdtZW50cyA9IGZ1bmN0aW9uIChwYXRoKSB7XG4gICAgICAgIGZ1bmN0aW9uIGNvcHlQb2ludChwKSB7XG4gICAgICAgICAgICByZXR1cm4geyB4OiBwLngsIHk6IHAueSB9O1xuICAgICAgICB9XG4gICAgICAgIHZhciBpc1N0cmFpZ2h0ID0gZnVuY3Rpb24gKGEsIGIsIGMpIHsgcmV0dXJuIE1hdGguYWJzKChiLnggLSBhLngpICogKGMueSAtIGEueSkgLSAoYi55IC0gYS55KSAqIChjLnggLSBhLngpKSA8IDAuMDAxOyB9O1xuICAgICAgICB2YXIgc2VnbWVudHMgPSBbXTtcbiAgICAgICAgdmFyIGEgPSBjb3B5UG9pbnQocGF0aFswXSk7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgcGF0aC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGIgPSBjb3B5UG9pbnQocGF0aFtpXSksIGMgPSBpIDwgcGF0aC5sZW5ndGggLSAxID8gcGF0aFtpICsgMV0gOiBudWxsO1xuICAgICAgICAgICAgaWYgKCFjIHx8ICFpc1N0cmFpZ2h0KGEsIGIsIGMpKSB7XG4gICAgICAgICAgICAgICAgc2VnbWVudHMucHVzaChbYSwgYl0pO1xuICAgICAgICAgICAgICAgIGEgPSBiO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzZWdtZW50cztcbiAgICB9O1xuICAgIEdyaWRSb3V0ZXIucHJvdG90eXBlLnJvdXRlID0gZnVuY3Rpb24gKHMsIHQpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIHNvdXJjZSA9IHRoaXMubm9kZXNbc10sIHRhcmdldCA9IHRoaXMubm9kZXNbdF07XG4gICAgICAgIHRoaXMub2JzdGFjbGVzID0gdGhpcy5zaWJsaW5nT2JzdGFjbGVzKHNvdXJjZSwgdGFyZ2V0KTtcbiAgICAgICAgdmFyIG9ic3RhY2xlTG9va3VwID0ge307XG4gICAgICAgIHRoaXMub2JzdGFjbGVzLmZvckVhY2goZnVuY3Rpb24gKG8pIHsgcmV0dXJuIG9ic3RhY2xlTG9va3VwW28uaWRdID0gbzsgfSk7XG4gICAgICAgIHRoaXMucGFzc2FibGVFZGdlcyA9IHRoaXMuZWRnZXMuZmlsdGVyKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICB2YXIgdSA9IF90aGlzLnZlcnRzW2Uuc291cmNlXSwgdiA9IF90aGlzLnZlcnRzW2UudGFyZ2V0XTtcbiAgICAgICAgICAgIHJldHVybiAhKHUubm9kZSAmJiB1Lm5vZGUuaWQgaW4gb2JzdGFjbGVMb29rdXBcbiAgICAgICAgICAgICAgICB8fCB2Lm5vZGUgJiYgdi5ub2RlLmlkIGluIG9ic3RhY2xlTG9va3VwKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgc291cmNlLnBvcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgdSA9IHNvdXJjZS5wb3J0c1swXS5pZDtcbiAgICAgICAgICAgIHZhciB2ID0gc291cmNlLnBvcnRzW2ldLmlkO1xuICAgICAgICAgICAgdGhpcy5wYXNzYWJsZUVkZ2VzLnB1c2goe1xuICAgICAgICAgICAgICAgIHNvdXJjZTogdSxcbiAgICAgICAgICAgICAgICB0YXJnZXQ6IHYsXG4gICAgICAgICAgICAgICAgbGVuZ3RoOiAwXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IHRhcmdldC5wb3J0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHUgPSB0YXJnZXQucG9ydHNbMF0uaWQ7XG4gICAgICAgICAgICB2YXIgdiA9IHRhcmdldC5wb3J0c1tpXS5pZDtcbiAgICAgICAgICAgIHRoaXMucGFzc2FibGVFZGdlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICBzb3VyY2U6IHUsXG4gICAgICAgICAgICAgICAgdGFyZ2V0OiB2LFxuICAgICAgICAgICAgICAgIGxlbmd0aDogMFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGdldFNvdXJjZSA9IGZ1bmN0aW9uIChlKSB7IHJldHVybiBlLnNvdXJjZTsgfSwgZ2V0VGFyZ2V0ID0gZnVuY3Rpb24gKGUpIHsgcmV0dXJuIGUudGFyZ2V0OyB9LCBnZXRMZW5ndGggPSBmdW5jdGlvbiAoZSkgeyByZXR1cm4gZS5sZW5ndGg7IH07XG4gICAgICAgIHZhciBzaG9ydGVzdFBhdGhDYWxjdWxhdG9yID0gbmV3IHNob3J0ZXN0cGF0aHNfMS5DYWxjdWxhdG9yKHRoaXMudmVydHMubGVuZ3RoLCB0aGlzLnBhc3NhYmxlRWRnZXMsIGdldFNvdXJjZSwgZ2V0VGFyZ2V0LCBnZXRMZW5ndGgpO1xuICAgICAgICB2YXIgYmVuZFBlbmFsdHkgPSBmdW5jdGlvbiAodSwgdiwgdykge1xuICAgICAgICAgICAgdmFyIGEgPSBfdGhpcy52ZXJ0c1t1XSwgYiA9IF90aGlzLnZlcnRzW3ZdLCBjID0gX3RoaXMudmVydHNbd107XG4gICAgICAgICAgICB2YXIgZHggPSBNYXRoLmFicyhjLnggLSBhLngpLCBkeSA9IE1hdGguYWJzKGMueSAtIGEueSk7XG4gICAgICAgICAgICBpZiAoYS5ub2RlID09PSBzb3VyY2UgJiYgYS5ub2RlID09PSBiLm5vZGUgfHwgYi5ub2RlID09PSB0YXJnZXQgJiYgYi5ub2RlID09PSBjLm5vZGUpXG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgICByZXR1cm4gZHggPiAxICYmIGR5ID4gMSA/IDEwMDAgOiAwO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgc2hvcnRlc3RQYXRoID0gc2hvcnRlc3RQYXRoQ2FsY3VsYXRvci5QYXRoRnJvbU5vZGVUb05vZGVXaXRoUHJldkNvc3Qoc291cmNlLnBvcnRzWzBdLmlkLCB0YXJnZXQucG9ydHNbMF0uaWQsIGJlbmRQZW5hbHR5KTtcbiAgICAgICAgdmFyIHBhdGhQb2ludHMgPSBzaG9ydGVzdFBhdGgucmV2ZXJzZSgpLm1hcChmdW5jdGlvbiAodmkpIHsgcmV0dXJuIF90aGlzLnZlcnRzW3ZpXTsgfSk7XG4gICAgICAgIHBhdGhQb2ludHMucHVzaCh0aGlzLm5vZGVzW3RhcmdldC5pZF0ucG9ydHNbMF0pO1xuICAgICAgICByZXR1cm4gcGF0aFBvaW50cy5maWx0ZXIoZnVuY3Rpb24gKHYsIGkpIHtcbiAgICAgICAgICAgIHJldHVybiAhKGkgPCBwYXRoUG9pbnRzLmxlbmd0aCAtIDEgJiYgcGF0aFBvaW50c1tpICsgMV0ubm9kZSA9PT0gc291cmNlICYmIHYubm9kZSA9PT0gc291cmNlXG4gICAgICAgICAgICAgICAgfHwgaSA+IDAgJiYgdi5ub2RlID09PSB0YXJnZXQgJiYgcGF0aFBvaW50c1tpIC0gMV0ubm9kZSA9PT0gdGFyZ2V0KTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBHcmlkUm91dGVyLmdldFJvdXRlUGF0aCA9IGZ1bmN0aW9uIChyb3V0ZSwgY29ybmVycmFkaXVzLCBhcnJvd3dpZHRoLCBhcnJvd2hlaWdodCkge1xuICAgICAgICB2YXIgcmVzdWx0ID0ge1xuICAgICAgICAgICAgcm91dGVwYXRoOiAnTSAnICsgcm91dGVbMF1bMF0ueCArICcgJyArIHJvdXRlWzBdWzBdLnkgKyAnICcsXG4gICAgICAgICAgICBhcnJvd3BhdGg6ICcnXG4gICAgICAgIH07XG4gICAgICAgIGlmIChyb3V0ZS5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJvdXRlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGxpID0gcm91dGVbaV07XG4gICAgICAgICAgICAgICAgdmFyIHggPSBsaVsxXS54LCB5ID0gbGlbMV0ueTtcbiAgICAgICAgICAgICAgICB2YXIgZHggPSB4IC0gbGlbMF0ueDtcbiAgICAgICAgICAgICAgICB2YXIgZHkgPSB5IC0gbGlbMF0ueTtcbiAgICAgICAgICAgICAgICBpZiAoaSA8IHJvdXRlLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKE1hdGguYWJzKGR4KSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHggLT0gZHggLyBNYXRoLmFicyhkeCkgKiBjb3JuZXJyYWRpdXM7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB5IC09IGR5IC8gTWF0aC5hYnMoZHkpICogY29ybmVycmFkaXVzO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5yb3V0ZXBhdGggKz0gJ0wgJyArIHggKyAnICcgKyB5ICsgJyAnO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbCA9IHJvdXRlW2kgKyAxXTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHgwID0gbFswXS54LCB5MCA9IGxbMF0ueTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHgxID0gbFsxXS54O1xuICAgICAgICAgICAgICAgICAgICB2YXIgeTEgPSBsWzFdLnk7XG4gICAgICAgICAgICAgICAgICAgIGR4ID0geDEgLSB4MDtcbiAgICAgICAgICAgICAgICAgICAgZHkgPSB5MSAtIHkwO1xuICAgICAgICAgICAgICAgICAgICB2YXIgYW5nbGUgPSBHcmlkUm91dGVyLmFuZ2xlQmV0d2VlbjJMaW5lcyhsaSwgbCkgPCAwID8gMSA6IDA7XG4gICAgICAgICAgICAgICAgICAgIHZhciB4MiwgeTI7XG4gICAgICAgICAgICAgICAgICAgIGlmIChNYXRoLmFicyhkeCkgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB4MiA9IHgwICsgZHggLyBNYXRoLmFicyhkeCkgKiBjb3JuZXJyYWRpdXM7XG4gICAgICAgICAgICAgICAgICAgICAgICB5MiA9IHkwO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgeDIgPSB4MDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHkyID0geTAgKyBkeSAvIE1hdGguYWJzKGR5KSAqIGNvcm5lcnJhZGl1cztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB2YXIgY3ggPSBNYXRoLmFicyh4MiAtIHgpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3kgPSBNYXRoLmFicyh5MiAtIHkpO1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQucm91dGVwYXRoICs9ICdBICcgKyBjeCArICcgJyArIGN5ICsgJyAwIDAgJyArIGFuZ2xlICsgJyAnICsgeDIgKyAnICcgKyB5MiArICcgJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhcnJvd3RpcCA9IFt4LCB5XTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFycm93Y29ybmVyMSwgYXJyb3djb3JuZXIyO1xuICAgICAgICAgICAgICAgICAgICBpZiAoTWF0aC5hYnMoZHgpID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgeCAtPSBkeCAvIE1hdGguYWJzKGR4KSAqIGFycm93aGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgYXJyb3djb3JuZXIxID0gW3gsIHkgKyBhcnJvd3dpZHRoXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFycm93Y29ybmVyMiA9IFt4LCB5IC0gYXJyb3d3aWR0aF07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB5IC09IGR5IC8gTWF0aC5hYnMoZHkpICogYXJyb3doZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcnJvd2Nvcm5lcjEgPSBbeCArIGFycm93d2lkdGgsIHldO1xuICAgICAgICAgICAgICAgICAgICAgICAgYXJyb3djb3JuZXIyID0gW3ggLSBhcnJvd3dpZHRoLCB5XTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXN1bHQucm91dGVwYXRoICs9ICdMICcgKyB4ICsgJyAnICsgeSArICcgJztcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFycm93aGVpZ2h0ID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LmFycm93cGF0aCA9ICdNICcgKyBhcnJvd3RpcFswXSArICcgJyArIGFycm93dGlwWzFdICsgJyBMICcgKyBhcnJvd2Nvcm5lcjFbMF0gKyAnICcgKyBhcnJvd2Nvcm5lcjFbMV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArICcgTCAnICsgYXJyb3djb3JuZXIyWzBdICsgJyAnICsgYXJyb3djb3JuZXIyWzFdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIGxpID0gcm91dGVbMF07XG4gICAgICAgICAgICB2YXIgeCA9IGxpWzFdLngsIHkgPSBsaVsxXS55O1xuICAgICAgICAgICAgdmFyIGR4ID0geCAtIGxpWzBdLng7XG4gICAgICAgICAgICB2YXIgZHkgPSB5IC0gbGlbMF0ueTtcbiAgICAgICAgICAgIHZhciBhcnJvd3RpcCA9IFt4LCB5XTtcbiAgICAgICAgICAgIHZhciBhcnJvd2Nvcm5lcjEsIGFycm93Y29ybmVyMjtcbiAgICAgICAgICAgIGlmIChNYXRoLmFicyhkeCkgPiAwKSB7XG4gICAgICAgICAgICAgICAgeCAtPSBkeCAvIE1hdGguYWJzKGR4KSAqIGFycm93aGVpZ2h0O1xuICAgICAgICAgICAgICAgIGFycm93Y29ybmVyMSA9IFt4LCB5ICsgYXJyb3d3aWR0aF07XG4gICAgICAgICAgICAgICAgYXJyb3djb3JuZXIyID0gW3gsIHkgLSBhcnJvd3dpZHRoXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHkgLT0gZHkgLyBNYXRoLmFicyhkeSkgKiBhcnJvd2hlaWdodDtcbiAgICAgICAgICAgICAgICBhcnJvd2Nvcm5lcjEgPSBbeCArIGFycm93d2lkdGgsIHldO1xuICAgICAgICAgICAgICAgIGFycm93Y29ybmVyMiA9IFt4IC0gYXJyb3d3aWR0aCwgeV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXN1bHQucm91dGVwYXRoICs9ICdMICcgKyB4ICsgJyAnICsgeSArICcgJztcbiAgICAgICAgICAgIGlmIChhcnJvd2hlaWdodCA+IDApIHtcbiAgICAgICAgICAgICAgICByZXN1bHQuYXJyb3dwYXRoID0gJ00gJyArIGFycm93dGlwWzBdICsgJyAnICsgYXJyb3d0aXBbMV0gKyAnIEwgJyArIGFycm93Y29ybmVyMVswXSArICcgJyArIGFycm93Y29ybmVyMVsxXVxuICAgICAgICAgICAgICAgICAgICArICcgTCAnICsgYXJyb3djb3JuZXIyWzBdICsgJyAnICsgYXJyb3djb3JuZXIyWzFdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgICByZXR1cm4gR3JpZFJvdXRlcjtcbn0oKSk7XG5leHBvcnRzLkdyaWRSb3V0ZXIgPSBHcmlkUm91dGVyO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKbWFXeGxJam9pWjNKcFpISnZkWFJsY2k1cWN5SXNJbk52ZFhKalpWSnZiM1FpT2lJaUxDSnpiM1Z5WTJWeklqcGJJaTR1THk0dUwxZGxZa052YkdFdmMzSmpMMmR5YVdSeWIzVjBaWEl1ZEhNaVhTd2libUZ0WlhNaU9sdGRMQ0p0WVhCd2FXNW5jeUk2SWpzN1FVRkRRU3g1UTBGQmNVTTdRVUZEY2tNc0swSkJRVzFFTzBGQlEyNUVMR2xFUVVFd1F6dEJRVXQwUXp0SlFVbEpMSEZDUVVGdFFpeEZRVUZWTEVWQlFWTXNTVUZCWlN4RlFVRlRMRkZCUVd0Q08xRkJRVGRFTEU5QlFVVXNSMEZCUml4RlFVRkZMRU5CUVZFN1VVRkJVeXhUUVVGSkxFZEJRVW9zU1VGQlNTeERRVUZYTzFGQlFWTXNZVUZCVVN4SFFVRlNMRkZCUVZFc1EwRkJWVHRSUVVNMVJTeEpRVUZKTEVOQlFVTXNTVUZCU1N4SFFVRkhMRTlCUVU4c1VVRkJVU3hMUVVGTExGZEJRVmNzU1VGQlNTeFJRVUZSTEVOQlFVTXNUVUZCVFN4TFFVRkxMRU5CUVVNc1EwRkJRenRKUVVONlJTeERRVUZETzBsQlEwd3NhMEpCUVVNN1FVRkJSQ3hEUVVGRExFRkJVRVFzU1VGUFF6dEJRVkJaTEd0RFFVRlhPMEZCVVhoQ08wbEJRMGtzWTBGQmJVSXNSVUZCVlN4RlFVRlRMRU5CUVZFc1JVRkJVeXhEUVVGVExFVkJRVk1zU1VGQmQwSXNSVUZCVXl4SlFVRlhPMUZCUVRWRExIRkNRVUZCTEVWQlFVRXNWMEZCZDBJN1VVRkJVeXh4UWtGQlFTeEZRVUZCTEZkQlFWYzdVVUZCYkVjc1QwRkJSU3hIUVVGR0xFVkJRVVVzUTBGQlVUdFJRVUZUTEUxQlFVTXNSMEZCUkN4RFFVRkRMRU5CUVU4N1VVRkJVeXhOUVVGRExFZEJRVVFzUTBGQlF5eERRVUZSTzFGQlFWTXNVMEZCU1N4SFFVRktMRWxCUVVrc1EwRkJiMEk3VVVGQlV5eFRRVUZKTEVkQlFVb3NTVUZCU1N4RFFVRlBPMGxCUVVjc1EwRkJRenRKUVVNM1NDeFhRVUZETzBGQlFVUXNRMEZCUXl4QlFVWkVMRWxCUlVNN1FVRkdXU3h2UWtGQlNUdEJRVWxxUWp0SlFVdEpMR3REUVVGdFFpeERRVUZOTEVWQlFWTXNRMEZCVFR0UlFVRnlRaXhOUVVGRExFZEJRVVFzUTBGQlF5eERRVUZMTzFGQlFWTXNUVUZCUXl4SFFVRkVMRU5CUVVNc1EwRkJTenRSUVVOd1F5eEpRVUZKTEVWQlFVVXNSMEZCUnl4M1FrRkJkMElzUTBGQlF5eFRRVUZUTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRMnhFTEVsQlFVa3NSVUZCUlN4SFFVRkhMRU5CUVVNc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNUMEZCVHl4RlFVRkZMRU5CUVVNN1VVRkRPVUlzU1VGQlNTeEZRVUZGTEVkQlFVY3NkMEpCUVhkQ0xFTkJRVU1zVTBGQlV5eERRVUZETEVOQlFVTXNSVUZCUlN4RlFVRkZMRU5CUVVNc1EwRkJRenRSUVVOdVJDeEpRVUZKTEVWQlFVVXNRMEZCUXl4TlFVRk5MRWxCUVVrc1JVRkJSU3hEUVVGRExFMUJRVTBzUlVGQlJUdFpRVU40UWl4SlFVRkpMRU5CUVVNc1RVRkJUU3hIUVVGSExFVkJRVVVzUTBGQlF5eE5RVUZOTEVOQlFVTTdXVUZEZUVJc1NVRkJTU3hEUVVGRExFVkJRVVVzUjBGQlJ5eEZRVUZGTEVOQlFVTXNSVUZCUlN4RFFVRkRPMWxCUTJoQ0xFbEJRVWtzUTBGQlF5eEZRVUZGTEVkQlFVY3NSVUZCUlN4RFFVRkRMRVZCUVVVc1EwRkJRenRaUVVOb1FpeEpRVUZKTEVOQlFVTXNVVUZCVVN4SFFVRkhMRXRCUVVzc1EwRkJRenRUUVVONlFqdGhRVUZOTzFsQlEwZ3NTVUZCU1N4RFFVRkRMRTFCUVUwc1IwRkJSeXhGUVVGRkxFTkJRVU1zVFVGQlRTeERRVUZETzFsQlEzaENMRWxCUVVrc1EwRkJReXhGUVVGRkxFZEJRVWNzUlVGQlJTeERRVUZETEVWQlFVVXNRMEZCUXp0WlFVTm9RaXhKUVVGSkxFTkJRVU1zUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXl4TlFVRk5MRWRCUVVjc1JVRkJSU3hEUVVGRExFVkJRVVVzUjBGQlJ5eEZRVUZGTEVOQlFVTXNUVUZCVFN4RFFVRkRPMWxCUTNaRExFbEJRVWtzUTBGQlF5eFJRVUZSTEVkQlFVY3NTVUZCU1N4RFFVRkRPMU5CUTNoQ08wbEJRMHdzUTBGQlF6dEpRVU5qTEd0RFFVRlRMRWRCUVhoQ0xGVkJRVFJDTEVOQlFVMHNSVUZCUlN4RFFVRk5PMUZCUTNSRExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNN1VVRkRha0lzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJRenRSUVVOcVFpeEpRVUZKTEV0QlFVc3NSMEZCUnl4RlFVRkZMRTFCUVUwc1JVRkJSU3hEUVVGRExFVkJRVVVzUlVGQlJTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RlFVRkZMRVZCUVVVc1JVRkJSU3hEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETzFGQlF6RkRMRWxCUVVrc1EwRkJReXhIUVVGSExFbEJRVWtzUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTNKQ0xFdEJRVXNzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVWQlFVVTdXVUZEZUVJc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVsQlFVa3NTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRM0JDTEV0QlFVc3NTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZPMmRDUVVOMFFpeEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVTdiMEpCUTJZc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eExRVUZMTEVOQlFVTXNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETzI5Q1FVTnFSU3hKUVVGSkxFTkJRVU1zUjBGQlJ5eExRVUZMTEVOQlFVTXNUVUZCVFN4RlFVRkZPM2RDUVVOc1FpeExRVUZMTEVOQlFVTXNUVUZCVFN4SFFVRkhMRU5CUVVNc1EwRkJRenQzUWtGRGFrSXNTMEZCU3l4RFFVRkRMRVZCUVVVc1IwRkJSeXhEUVVGRExFZEJRVWNzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0M1FrRkRja0lzUzBGQlN5eERRVUZETEVWQlFVVXNSMEZCUnl4RFFVRkRMRWRCUVVjc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dHhRa0ZEZUVJN2IwSkJRVUVzUTBGQlF6dHBRa0ZEVERzN2IwSkJRVTBzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dFRRVU14UWp0UlFVTkVMRTlCUVU4c1MwRkJTeXhEUVVGRE8wbEJRMnBDTEVOQlFVTTdTVUZEUkN3NFEwRkJWeXhIUVVGWU8xRkJRMGtzVDBGQlR5eEpRVUZKTEVOQlFVTXNUVUZCVFN4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4TFFVRkxMRU5CUVVNc1NVRkJTU3hEUVVGRExFVkJRVVVzUlVGQlJTeEpRVUZKTEVOQlFVTXNSVUZCUlN4SFFVRkhMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRPMGxCUTJoR0xFTkJRVU03U1VGRFRDd3JRa0ZCUXp0QlFVRkVMRU5CUVVNc1FVRXpRMFFzU1VFeVEwTTdRVUV6UTFrc05FUkJRWGRDTzBGQmFVUnlRenRKUVhORVNTeHZRa0ZCYlVJc1lVRkJjVUlzUlVGQlJTeFJRVUUwUWl4RlFVRlRMRmxCUVhsQ08xRkJRWGhITEdsQ1FXdElRenRSUVd4SU9FVXNOa0pCUVVFc1JVRkJRU3hwUWtGQmVVSTdVVUZCY2tZc2EwSkJRV0VzUjBGQllpeGhRVUZoTEVOQlFWRTdVVUZCZFVNc2FVSkJRVmtzUjBGQldpeFpRVUZaTEVOQlFXRTdVVUZ5UkhoSExGZEJRVTBzUjBGQmEwSXNTVUZCU1N4RFFVRkRPMUZCYzBSNlFpeEpRVUZKTEVOQlFVTXNTMEZCU3l4SFFVRkhMR0ZCUVdFc1EwRkJReXhIUVVGSExFTkJRVU1zVlVGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4SlFVRkxMRTlCUVVFc1NVRkJTU3hYUVVGWExFTkJRVU1zUTBGQlF5eEZRVUZGTEZGQlFWRXNRMEZCUXl4VFFVRlRMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzVVVGQlVTeERRVUZETEZkQlFWY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGc1JTeERRVUZyUlN4RFFVRkRMRU5CUVVNN1VVRkROMGNzU1VGQlNTeERRVUZETEUxQlFVMHNSMEZCUnl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFMUJRVTBzUTBGQlF5eFZRVUZCTEVOQlFVTXNTVUZCUnl4UFFVRkJMRU5CUVVNc1EwRkJReXhKUVVGSkxFVkJRVTRzUTBGQlRTeERRVUZETEVOQlFVTTdVVUZETlVNc1NVRkJTU3hEUVVGRExFMUJRVTBzUjBGQlJ5eEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRTFCUVUwc1EwRkJReXhWUVVGQkxFTkJRVU1zU1VGQlJ5eFBRVUZCTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWxCUVVrc1JVRkJVQ3hEUVVGUExFTkJRVU1zUTBGQlF6dFJRVU0zUXl4SlFVRkpMRU5CUVVNc1NVRkJTU3hIUVVGSExFbEJRVWtzUTBGQlF5eFpRVUZaTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1VVRkRia01zU1VGQlNTeERRVUZETEVsQlFVa3NSMEZCUnl4SlFVRkpMRU5CUVVNc1dVRkJXU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETzFGQlIyNURMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zVDBGQlR5eERRVUZETEZWQlFVRXNRMEZCUXp0WlFVTnFRaXhQUVVGQkxFTkJRVU1zUTBGQlF5eFJRVUZSTEVOQlFVTXNUMEZCVHl4RFFVRkRMRlZCUVVFc1EwRkJReXhKUVVGSExFOUJRVUVzUzBGQlNTeERRVUZETEV0QlFVc3NRMEZCVXl4RFFVRkRMRU5CUVVNc1EwRkJReXhOUVVGTkxFZEJRVWNzUTBGQlF5eEZRVUZvUXl4RFFVRm5ReXhEUVVGRE8xRkJRWGhFTEVOQlFYZEVMRU5CUVVNc1EwRkJRenRSUVVjNVJDeEpRVUZKTEVOQlFVTXNTVUZCU1N4SFFVRkhMRVZCUVVVc1VVRkJVU3hGUVVGRkxFVkJRVVVzUlVGQlJTeERRVUZETzFGQlF6ZENMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zVDBGQlR5eERRVUZETEZWQlFVRXNRMEZCUXp0WlFVTm9RaXhKUVVGSkxFOUJRVThzUTBGQlF5eERRVUZETEUxQlFVMHNTMEZCU3l4WFFVRlhMRVZCUVVVN1owSkJRMnBETEVOQlFVTXNRMEZCUXl4TlFVRk5MRWRCUVVjc1MwRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF6dG5Ra0ZEY2tJc1MwRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eFJRVUZSTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF6dGhRVU5xUXp0WlFVOUVMRU5CUVVNc1EwRkJReXhMUVVGTExFZEJRVWNzUlVGQlJTeERRVUZCTzFGQlEyaENMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJSMGdzU1VGQlNTeERRVUZETEZkQlFWY3NSMEZCUnl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTjJReXhKUVVGSkxFTkJRVU1zVjBGQlZ5eERRVUZETEVsQlFVa3NRMEZCUXl4VlFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFbEJRVXNzVDBGQlFTeExRVUZKTEVOQlFVTXNVVUZCVVN4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFdEJRVWtzUTBGQlF5eFJRVUZSTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVc1RExFTkJRVzFETEVOQlFVTXNRMEZCUXp0UlFVdHlSU3hKUVVGSkxHbENRVUZwUWl4SFFVRkhMRWxCUVVrc1EwRkJReXhYUVVGWExFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRTlCUVU4c1JVRkJSU3hEUVVGRExFMUJRVTBzUTBGQlF5eFZRVUZCTEVOQlFVTXNTVUZCUnl4UFFVRkJMRU5CUVVNc1EwRkJReXhEUVVGRExFbEJRVWtzUlVGQlVDeERRVUZQTEVOQlFVTXNRMEZCUXp0UlFVTm9SaXhwUWtGQmFVSXNRMEZCUXl4UFFVRlBMRU5CUVVNc1ZVRkJRU3hEUVVGRE8xbEJRM1pDTEVsQlFVa3NRMEZCUXl4SFFVRkhMSEZDUVVGVExFTkJRVU1zUzBGQlN5eEZRVUZGTEVOQlFVTTdXVUZETVVJc1EwRkJReXhEUVVGRExGRkJRVkVzUTBGQlF5eFBRVUZQTEVOQlFVTXNWVUZCUVN4RFFVRkRMRWxCUVVjc1QwRkJRU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEV0QlFVc3NRMEZCUXl4TFFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4RlFVRXZRaXhEUVVFclFpeERRVUZETEVOQlFVTTdXVUZEZUVRc1EwRkJReXhEUVVGRExFbEJRVWtzUjBGQlJ5eERRVUZETEVOQlFVTXNUMEZCVHl4RFFVRkRMRXRCUVVrc1EwRkJReXhaUVVGWkxFTkJRVU1zUTBGQlF6dFJRVU14UXl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVWSUxFbEJRVWtzVDBGQlR5eEhRVUZITEVsQlFVa3NRMEZCUXl4VFFVRlRMRU5CUVVNc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNWVUZCUVN4RFFVRkRMRWxCUVVjc1QwRkJRU3hEUVVGRExFTkJRVU1zUjBGQlJ5eEZRVUZNTEVOQlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRka1FzU1VGQlNTeFBRVUZQTEVkQlFVY3NTVUZCU1N4RFFVRkRMRk5CUVZNc1EwRkJReXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4VlFVRkJMRU5CUVVNc1NVRkJSeXhQUVVGQkxFTkJRVU1zUTBGQlF5eEhRVUZITEVWQlFVd3NRMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVkMlJDeEpRVUZKTEVsQlFVa3NSMEZCUnl4UFFVRlBMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzU1VGQlNTeEhRVUZITEU5QlFVOHNRMEZCUXl4UFFVRlBMRU5CUVVNc1RVRkJUU3hIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlF6RkVMRWxCUVVrc1NVRkJTU3hIUVVGSExFOUJRVThzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4SlFVRkpMRWRCUVVjc1QwRkJUeXhEUVVGRExFOUJRVThzUTBGQlF5eE5RVUZOTEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkhNVVFzU1VGQlNTeE5RVUZOTEVkQlFVY3NTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zVlVGQlFTeERRVUZETEVsQlFVY3NUMEZCUVN4RFFVRkxMRVZCUVVVc1JVRkJSU3hGUVVGRkxFbEJRVWtzUlVGQlJTeEZRVUZGTEVWQlFVVXNTVUZCU1N4RlFVRkZMRVZCUVVVc1JVRkJSU3hEUVVGRExFTkJRVU1zUjBGQlJ5eEZRVUZGTEVWQlFVVXNSVUZCUlN4RFFVRkRMRU5CUVVNc1IwRkJSeXhGUVVGRkxFTkJRVUVzUlVGQmFrUXNRMEZCYVVRc1EwRkJRenRoUVVNMVJTeE5RVUZOTEVOQlFVTXNUMEZCVHl4RFFVRkRMRWRCUVVjc1EwRkJReXhWUVVGQkxFTkJRVU1zU1VGQlJ5eFBRVUZCTEVOQlFVc3NSVUZCUlN4RlFVRkZMRVZCUVVVc1NVRkJTU3hGUVVGRkxFVkJRVVVzUlVGQlJTeEpRVUZKTEVWQlFVVXNSVUZCUlN4RlFVRkZMRU5CUVVNc1JVRkJSU3hGUVVGRkxFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVRXNSVUZCZWtNc1EwRkJlVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZIZUVVc1NVRkJTU3hOUVVGTkxFZEJRVWNzU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1ZVRkJRU3hEUVVGRExFbEJRVWNzVDBGQlFTeERRVUZMTEVWQlFVVXNSVUZCUlN4RlFVRkZMRU5CUVVNc1EwRkJReXhIUVVGSExFVkJRVVVzUlVGQlJTeEZRVUZGTEVOQlFVTXNRMEZCUXl4SFFVRkhMRVZCUVVVc1JVRkJSU3hGUVVGRkxFbEJRVWtzUlVGQlJTeEZRVUZGTEVWQlFVVXNTVUZCU1N4RlFVRkZMRU5CUVVFc1JVRkJha1FzUTBGQmFVUXNRMEZCUXp0aFFVTTFSU3hOUVVGTkxFTkJRVU1zVDBGQlR5eERRVUZETEVkQlFVY3NRMEZCUXl4VlFVRkJMRU5CUVVNc1NVRkJSeXhQUVVGQkxFTkJRVXNzUlVGQlJTeEZRVUZGTEVWQlFVVXNRMEZCUXl4RlFVRkZMRVZCUVVVc1JVRkJSU3hEUVVGRExFVkJRVVVzUlVGQlJTeEZRVUZGTEVsQlFVa3NSVUZCUlN4RlFVRkZMRVZCUVVVc1NVRkJTU3hGUVVGRkxFTkJRVUVzUlVGQmVrTXNRMEZCZVVNc1EwRkJReXhEUVVGRExFTkJRVU03VVVGSGVFVXNTVUZCU1N4TFFVRkxMRWRCUVVjc1RVRkJUU3hEUVVGRExFMUJRVTBzUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXp0UlFVZHNReXhMUVVGTExFTkJRVU1zVDBGQlR5eERRVUZETEZWQlFVRXNRMEZCUXl4SlFVRkhMRTlCUVVFc1EwRkJReXhEUVVGRExFdEJRVXNzUjBGQlJ5eEZRVUZGTEVWQlFWb3NRMEZCV1N4RFFVRkRMRU5CUVVNN1VVRkhhRU1zU1VGQlNTeERRVUZETEV0QlFVc3NSMEZCUnl4RlFVRkZMRU5CUVVNN1VVRkRhRUlzU1VGQlNTeERRVUZETEV0QlFVc3NSMEZCUnl4RlFVRkZMRU5CUVVNN1VVRkhhRUlzVFVGQlRTeERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRkJMRU5CUVVNN1dVRkRXaXhQUVVGQkxFMUJRVTBzUTBGQlF5eFBRVUZQTEVOQlFVTXNWVUZCUVN4RFFVRkRPMmRDUVVOYUxFbEJRVWtzUTBGQlF5eEhRVUZITEVsQlFVa3NTVUZCU1N4RFFVRkRMRXRCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zVFVGQlRTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RlFVRkZMRVZCUVVVc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETzJkQ1FVTm9SQ3hEUVVGRExFTkJRVU1zUzBGQlN5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRuUWtGRGFFSXNRMEZCUXl4RFFVRkRMRXRCUVVzc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdaMEpCUTJoQ0xFdEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8yZENRVWR1UWl4SlFVRkpMRU5CUVVNc1IwRkJSeXhMUVVGSkxFTkJRVU1zVjBGQlZ5eERRVUZETEUxQlFVMHNRMEZCUXp0blFrRkRhRU1zVDBGQlR5eERRVUZETEVWQlFVVXNSMEZCUnl4RFFVRkRMRVZCUVVVN2IwSkJRMW9zU1VGQlNTeEpRVUZKTEVkQlFVY3NTMEZCU1N4RFFVRkRMRmRCUVZjc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGRE1VSXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU03YjBKQlEyeENMRWxCUVVrc1JVRkJSU3hIUVVGSExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUlVGQlJTeEZRVUZGTEVOQlFVTXNSVUZETTBJc1JVRkJSU3hIUVVGSExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUlVGQlJTeEZRVUZGTEVOQlFVTXNRMEZCUXp0dlFrRkRhRU1zU1VGQlNTeEZRVUZGTEVkQlFVY3NRMEZCUXl4RFFVRkRMRXRCUVVzc1JVRkJSU3hIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEVkQlFVY3NRMEZCUXl4RFFVRkRMRTFCUVUwc1JVRkJSU3hIUVVGSExFTkJRVU1zUlVGQlJUdDNRa0ZEY2tNc1EwRkJSU3hEUVVGRExFbEJRVWtzUjBGQlJ5eEpRVUZKTEVOQlFVTTdkMEpCUTNKQ0xFMUJRVTA3Y1VKQlExUTdhVUpCUTBvN1dVRkRUQ3hEUVVGRExFTkJRVU03VVVGc1FrWXNRMEZyUWtVc1EwRkRSQ3hEUVVGRE8xRkJSVTRzUzBGQlN5eERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRkRMRU5CUVVNc1JVRkJSU3hGUVVGRk8xbEJSV2hDTEV0QlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1QwRkJUeXhEUVVGRExGVkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTTdaMEpCUTNCQ0xFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNhVUpCUVdsQ0xFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNSVUZCUlN4RFFVRkRMRU5CUVVNc1JVRkJSU3hGUVVGRkxFTkJRVU1zUTBGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFOUJRVThzUTBGQlF5eFZRVUZETEZOQlFWTXNSVUZCUlN4RFFVRkRPMjlDUVVWc1JTeEpRVUZKTEVOQlFVTXNSMEZCUnl4SlFVRkpMRWxCUVVrc1EwRkJReXhMUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEUxQlFVMHNSVUZCUlN4VFFVRlRMRU5CUVVNc1EwRkJReXhGUVVGRkxGTkJRVk1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRE8yOUNRVU53UlN4TFFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0dlFrRkRia0lzUTBGQlF5eERRVUZETEV0QlFVc3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03YjBKQlEyaENMRU5CUVVNc1EwRkJReXhMUVVGTExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMmRDUVVOd1FpeERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTlFMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJSMGdzU1VGQlNTeFBRVUZQTEVkQlFVY3NTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhIUVVGSExFTkJRVU03V1VGRE1VTXNTVUZCU1N4TFFVRkxMRWRCUVVjc1ZVRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEpRVUZMTEU5QlFVRXNUMEZCVHl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJMMElzUTBGQkswSXNRMEZCUXp0WlFVTjBSQ3hEUVVGRExFTkJRVU1zUzBGQlN5eERRVUZETEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJRenRaUVVOd1FpeExRVUZMTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEV0QlFVc3NRMEZCUXl4TlFVRk5MRVZCUVVVc1EwRkJReXhGUVVGRkxFVkJRVVU3WjBKQlEzSkRMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8yZENRVU4yUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhKUVVGSkxFbEJRVWtzUTBGQlF5eERRVUZETEVsQlFVa3NTMEZCU3l4RFFVRkRMRU5CUVVNc1NVRkJTU3hKUVVGSkxFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1R0dlFrRkJSU3hUUVVGVE8yZENRVU42UkN4TFFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFbEJRVWtzUTBGQlF5eEZRVUZGTEUxQlFVMHNSVUZCUlN4RFFVRkRMRU5CUVVNc1JVRkJSU3hGUVVGRkxFMUJRVTBzUlVGQlJTeERRVUZETEVOQlFVTXNSVUZCUlN4RlFVRkZMRTFCUVUwc1JVRkJSU3hKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTTdZVUZEYkVZN1VVRkRUQ3hEUVVGRExFTkJRVU1zUTBGQlF6dEpRVWxRTEVOQlFVTTdTVUUxU2s4c2QwSkJRVWNzUjBGQldDeFZRVUZaTEVOQlFVTXNTVUZCU1N4UFFVRlBMRU5CUVVNc1EwRkJReXhOUVVGTkxFTkJRVU1zVlVGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4SlFVRkxMRTlCUVVFc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlRDeERRVUZMTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGQkxFTkJRVU1zUTBGQlF6dEpRVWwwUkN4cFEwRkJXU3hIUVVGd1FpeFZRVUZ4UWl4SlFVRkpPMUZCUTNKQ0xFbEJRVWtzVDBGQlR5eEhRVUZITEVWQlFVVXNRMEZCUXp0UlFVTnFRaXhKUVVGSkxFVkJRVVVzUjBGQlJ5eEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFVkJRVVVzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJRenRSUVVOc1JDeFBRVUZQTEVWQlFVVXNRMEZCUXl4TlFVRk5MRWRCUVVjc1EwRkJReXhGUVVGRk8xbEJSV3hDTEVsQlFVa3NWMEZCVnl4SFFVRkhMRVZCUVVVc1EwRkJReXhOUVVGTkxFTkJRVU1zVlVGQlFTeERRVUZETEVsQlFVY3NUMEZCUVN4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExGTkJRVk1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNWMEZCVnl4RlFVRkZMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRVZCUVd4RUxFTkJRV3RFTEVOQlFVTXNRMEZCUXp0WlFVTndSaXhKUVVGSkxFZEJRVWNzUjBGQlJ6dG5Ra0ZEVGl4TFFVRkxMRVZCUVVVc1YwRkJWenRuUWtGRGJFSXNSMEZCUnl4RlFVRkZMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zVjBGQlZ5eERRVUZETEVkQlFVY3NRMEZCUXl4VlFVRkJMRU5CUVVNc1NVRkJSeXhQUVVGQkxFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNSMEZCUnl4SFFVRkhMRWxCUVVrc1EwRkJReXhGUVVGRkxFVkJRWEJDTEVOQlFXOUNMRU5CUVVNc1EwRkJRenRoUVVNelJDeERRVUZETzFsQlEwWXNUMEZCVHl4RFFVRkRMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dFpRVU5zUWl4SFFVRkhMRU5CUVVNc1MwRkJTeXhEUVVGRExFOUJRVThzUTBGQlF5eFZRVUZCTEVOQlFVTXNTVUZCUnl4UFFVRkJMRVZCUVVVc1EwRkJReXhOUVVGTkxFTkJRVU1zUlVGQlJTeERRVUZETEU5QlFVOHNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUlVGQk0wSXNRMEZCTWtJc1EwRkJReXhEUVVGRE8xTkJRM1JFTzFGQlEwUXNUMEZCVHl4RFFVRkRMRWxCUVVrc1EwRkJReXhWUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVsQlFVc3NUMEZCUVN4RFFVRkRMRU5CUVVNc1IwRkJSeXhIUVVGSExFTkJRVU1zUTBGQlF5eEhRVUZITEVWQlFXSXNRMEZCWVN4RFFVRkRMRU5CUVVFN1VVRkRja01zVDBGQlR5eFBRVUZQTEVOQlFVTTdTVUZEYmtJc1EwRkJRenRKUVVkUExEWkNRVUZSTEVkQlFXaENMRlZCUVdsQ0xFTkJRVU03VVVGRFpDeEpRVUZKTEV0QlFVc3NSMEZCUnl4RFFVRkRMRU5CUVVNN1VVRkRaQ3hQUVVGUExFTkJRVU1zUTBGQlF5eE5RVUZOTEV0QlFVc3NTVUZCU1N4RFFVRkRMRWxCUVVrc1JVRkJSVHRaUVVNelFpeExRVUZMTEVWQlFVVXNRMEZCUXp0WlFVTlNMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETzFOQlEyaENPMUZCUTBRc1QwRkJUeXhMUVVGTExFTkJRVU03U1VGRGFrSXNRMEZCUXp0SlFVZFBMRGhDUVVGVExFZEJRV3BDTEZWQlFXdENMRU5CUVVNN1VVRkRaaXhKUVVGSkxFZEJRVWNzUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlEzUkNMRWxCUVVrc1NVRkJTU3hIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRWRCUVVjc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU0xUWl4TFFVRkxMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRTFCUVUwc1JVRkJSU3hEUVVGRExFVkJRVVVzUlVGQlJUdFpRVU12UWl4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJRenRUUVVOd1F6dFJRVU5FTEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eE5RVUZOTEVkQlFVY3NRMEZCUXl4RFFVRkRMRWRCUVVjc1IwRkJSeXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlEzSkRMRTlCUVU4c1NVRkJTU3hEUVVGRE8wbEJRMmhDTEVOQlFVTTdTVUYxU0U4c1owTkJRVmNzUjBGQmJrSXNWVUZCYjBJc1EwRkJRenRSUVVOcVFpeEpRVUZKTEU5QlFVOHNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRMnhDTEVkQlFVYzdXVUZEUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF6dFpRVU5pTEU5QlFVOHNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03VTBGRGJrSXNVVUZCVVN4RFFVRkRMRXRCUVVzc1NVRkJTU3hEUVVGRExFbEJRVWtzUlVGQlJUdFJRVU14UWl4UFFVRlBMRTlCUVU4c1EwRkJReXhQUVVGUExFVkJRVVVzUTBGQlF6dEpRVU0zUWl4RFFVRkRPMGxCUjA4c05FTkJRWFZDTEVkQlFTOUNMRlZCUVdkRExFTkJRVU1zUlVGQlJTeERRVUZETzFGQlEyaERMRWxCUVVrc1JVRkJSU3hIUVVGSExFbEJRVWtzUTBGQlF5eFhRVUZYTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1JVRkJSU3hIUVVGSExFbEJRVWtzUTBGQlF5eFhRVUZYTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dFJRVU01UkN4UFFVRlBMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUzBGQlN5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUVVVc1EwRkJReXhGUVVGRkxFTkJRVU03VVVGRk5VSXNUMEZCVHl4RlFVRkZMR05CUVdNc1JVRkJSU3hGUVVGRkxFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RlFVRkZMRkZCUVZFc1JVRkJSU3hGUVVGRkxFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhGUVVGRkxFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJRenRKUVVOd1JpeERRVUZETzBsQlNVUXNjVU5CUVdkQ0xFZEJRV2hDTEZWQlFXbENMRU5CUVVNc1JVRkJSU3hEUVVGRE8xRkJRWEpDTEdsQ1FWZERPMUZCVmtjc1NVRkJTU3hKUVVGSkxFZEJRVWNzU1VGQlNTeERRVUZETEhWQ1FVRjFRaXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTTVReXhKUVVGSkxHRkJRV0VzUjBGQlJ5eEZRVUZGTEVOQlFVTTdVVUZEZGtJc1NVRkJTU3hEUVVGRExGRkJRVkVzUTBGQlF5eFBRVUZQTEVOQlFVTXNWVUZCUVN4RFFVRkRMRWxCUVVjc1QwRkJRU3hoUVVGaExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRVZCUVVVc1JVRkJlRUlzUTBGQmQwSXNRMEZCUXl4RFFVRkRPMUZCUTNCRUxFbEJRVWtzVTBGQlV5eEhRVUZITEVsQlFVa3NRMEZCUXl4alFVRmpMRU5CUVVNc1VVRkJVU3hEUVVGRExFMUJRVTBzUTBGQlF5eFZRVUZCTEVOQlFVTXNTVUZCUnl4UFFVRkJMRU5CUVVNc1EwRkJReXhEUVVGRExFbEJRVWtzWVVGQllTeERRVUZETEVWQlFYSkNMRU5CUVhGQ0xFTkJRVU1zUTBGQlF6dFJRVVV2UlN4SlFVRkpMRU5CUVVNc1VVRkJVVHRoUVVOU0xFMUJRVTBzUTBGQlF5eFZRVUZCTEVOQlFVTXNTVUZCUnl4UFFVRkJMRU5CUVVNc1EwRkJReXhOUVVGTkxFdEJRVXNzU1VGQlNTeERRVUZETEdOQlFXTXNSVUZCYUVNc1EwRkJaME1zUTBGQlF6dGhRVU0xUXl4UFFVRlBMRU5CUVVNc1ZVRkJRU3hEUVVGRExFbEJRVWNzVDBGQlFTeFRRVUZUTEVkQlFVY3NVMEZCVXl4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEZGQlFWRXNRMEZCUXl4TlFVRk5MRU5CUVVNc1ZVRkJRU3hEUVVGRExFbEJRVWNzVDBGQlFTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRVZCUVVVc1JVRkJWaXhEUVVGVkxFTkJRVU1zUTBGQlF5eEZRVUYwUlN4RFFVRnpSU3hEUVVGRExFTkJRVU03VVVGRmVrWXNUMEZCVHl4VFFVRlRMRU5CUVVNc1IwRkJSeXhEUVVGRExGVkJRVUVzUTBGQlF5eEpRVUZITEU5QlFVRXNTMEZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQllpeERRVUZoTEVOQlFVTXNRMEZCUXp0SlFVTTFReXhEUVVGRE8wbEJTVTBzZVVKQlFXTXNSMEZCY2tJc1ZVRkJjMElzVFVGQlRTeEZRVUZGTEVOQlFVTXNSVUZCUlN4RFFVRkRPMUZCUlRsQ0xFbEJRVWtzVTBGQlV5eEhRVUZITEVWQlFVVXNRMEZCUXp0UlFVTnVRaXhMUVVGTExFbEJRVWtzUlVGQlJTeEhRVUZITEVOQlFVTXNSVUZCUlN4RlFVRkZMRWRCUVVjc1RVRkJUU3hEUVVGRExFMUJRVTBzUlVGQlJTeEZRVUZGTEVWQlFVVXNSVUZCUlR0WlFVTjJReXhKUVVGSkxFdEJRVXNzUjBGQlJ5eE5RVUZOTEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNN1dVRkRka0lzUzBGQlN5eEpRVUZKTEVWQlFVVXNSMEZCUnl4RFFVRkRMRVZCUVVVc1JVRkJSU3hIUVVGSExFdEJRVXNzUTBGQlF5eE5RVUZOTEVWQlFVVXNSVUZCUlN4RlFVRkZMRVZCUVVVN1owSkJRM1JETEVsQlFVa3NRMEZCUXl4SFFVRlJMRXRCUVVzc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF6dG5Ra0ZEZGtJc1EwRkJReXhEUVVGRExFMUJRVTBzUjBGQlJ5eEZRVUZGTEVOQlFVTTdaMEpCUTJRc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eEZRVUZGTEVOQlFVTTdaMEpCUTFRc1NVRkJTU3hIUVVGSExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRuUWtGRE5VSXNTVUZCU1N4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFZEJRVWNzUTBGQlF5eEhRVUZITEVkQlFVY3NSVUZCUlR0dlFrRkRja0lzVTBGQlV5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRwUWtGRGNrSTdZVUZEU2p0VFFVTktPMUZCUTBRc1UwRkJVeXhEUVVGRExFbEJRVWtzUTBGQlF5eFZRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRWxCUVVzc1QwRkJRU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRnFRaXhEUVVGcFFpeERRVUZETEVOQlFVTTdVVUZITlVNc1NVRkJTU3haUVVGWkxFZEJRVWNzUlVGQlJTeERRVUZETzFGQlEzUkNMRWxCUVVrc1ZVRkJWU3hIUVVGSExFbEJRVWtzUTBGQlF6dFJRVU4wUWl4TFFVRkxMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NVMEZCVXl4RFFVRkRMRTFCUVUwc1JVRkJSU3hEUVVGRExFVkJRVVVzUlVGQlJUdFpRVU4yUXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhUUVVGVExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEY2tJc1NVRkJTU3hEUVVGRExGVkJRVlVzU1VGQlNTeEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4VlFVRlZMRU5CUVVNc1IwRkJSeXhEUVVGRExFZEJRVWNzUjBGQlJ5eEZRVUZGTzJkQ1FVTjZSQ3hWUVVGVkxFZEJRVWNzUlVGQlJTeEhRVUZITEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEZGQlFWRXNSVUZCUlN4RlFVRkZMRVZCUVVVc1EwRkJRenRuUWtGRE5VTXNXVUZCV1N4RFFVRkRMRWxCUVVrc1EwRkJReXhWUVVGVkxFTkJRVU1zUTBGQlF6dGhRVU5xUXp0WlFVTkVMRlZCUVZVc1EwRkJReXhSUVVGUkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMU5CUXk5Q08xRkJRMFFzVDBGQlR5eFpRVUZaTEVOQlFVTTdTVUZEZUVJc1EwRkJRenRKUVZOTkxHOUNRVUZUTEVkQlFXaENMRlZCUVdsQ0xFTkJRVk1zUlVGQlJTeERRVUZUTEVWQlFVVXNUVUZCVFN4RlFVRkZMRkZCUVZFc1JVRkJSU3hOUVVGTkxFVkJRVVVzUjBGQlZ6dFJRVU40UlN4SlFVRkpMRU5CUVVNc1IwRkJSeXhSUVVGUkxFTkJRVU1zVFVGQlRTeERRVUZETzFGQlEzaENMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU03V1VGQlJTeFBRVUZQTzFGQlEyNUNMRWxCUVVrc1JVRkJSU3hIUVVGSExGRkJRVkVzUTBGQlF5eEhRVUZITEVOQlFVTXNWVUZCUVN4RFFVRkRMRWxCUVVrc1QwRkJRU3hKUVVGSkxHVkJRVkVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQmNrSXNRMEZCY1VJc1EwRkJReXhEUVVGRE8xRkJRMnhFTEVsQlFVa3NSVUZCUlN4SFFVRkhMRVZCUVVVc1EwRkJRenRSUVVOYUxFdEJRVXNzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVWQlFVVTdXVUZEZUVJc1MwRkJTeXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFVkJRVVVzUlVGQlJUdG5Ra0ZEZUVJc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF6dHZRa0ZCUlN4VFFVRlRPMmRDUVVOMFFpeEpRVUZKTEVWQlFVVXNSMEZCUnl4UlFVRlJMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRMmhDTEVWQlFVVXNSMEZCUnl4UlFVRlJMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRMmhDTEVWQlFVVXNSMEZCUnl4RlFVRkZMRU5CUVVNc1RVRkJUU3hGUVVOa0xFVkJRVVVzUjBGQlJ5eEZRVUZGTEVOQlFVTXNUVUZCVFN4RlFVTmtMRWxCUVVrc1IwRkJSeXhEUVVGRExFTkJRVU1zUlVGRFZDeEpRVUZKTEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNN1owSkJUV1FzU1VGQlNTeERRVUZETEVsQlFVa3NSMEZCUnl4RlFVRkZPMjlDUVVOV0xFbEJRVWtzVFVGQlRTeERRVUZETEVWQlFVVXNSVUZCUlN4RlFVRkZMRU5CUVVNc1JVRkJSVHQzUWtGRmFFSXNTVUZCU1N4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGT3pSQ1FVTnlRaXhKUVVGSkxFZEJRVWNzUTBGQlF5eEZRVUZGTEVsQlFVa3NSMEZCUnl4RFFVRkRMRU5CUVVNN2VVSkJRM1JDT3paQ1FVRk5PelJDUVVOSUxFbEJRVWtzUjBGQlJ5eERRVUZETEVWQlFVVXNTVUZCU1N4SFFVRkhMRU5CUVVNc1EwRkJRenQ1UWtGRGRFSTdjVUpCUTBvN2FVSkJRMG83Y1VKQlFVMDdiMEpCUTBnc1NVRkJTU3hOUVVGTkxFTkJRVU1zUlVGQlJTeEZRVUZGTEVWQlFVVXNRMEZCUXl4RlFVRkZPM2RDUVVOb1FpeEpRVUZKTEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVU3TkVKQlEzSkNMRWxCUVVrc1IwRkJSeXhEUVVGRExFVkJRVVVzU1VGQlNTeEhRVUZITEVOQlFVTXNRMEZCUXp0NVFrRkRkRUk3TmtKQlFVMDdORUpCUTBnc1NVRkJTU3hIUVVGSExFTkJRVU1zUlVGQlJTeEpRVUZKTEVkQlFVY3NRMEZCUXl4RFFVRkRPM2xDUVVOMFFqdHhRa0ZEU2p0cFFrRkRTanRuUWtGRFJDeEpRVUZKTEVsQlFVa3NTVUZCU1N4RFFVRkRMRVZCUVVVN2IwSkJSVmdzUlVGQlJTeERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMR2xDUVVGVkxFTkJRVU1zUlVGQlJTeERRVUZETEVsQlFVa3NRMEZCUXl4RlFVRkZMRVZCUVVVc1EwRkJReXhKUVVGSkxFTkJRVU1zUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRPMmxDUVVOd1JEdGhRVU5LTzFOQlEwbzdVVUZEUkN4SlFVRkpMRTFCUVUwc1IwRkJSeXhKUVVGSkxHRkJRVTBzUTBGQlF5eEZRVUZGTEVWQlFVVXNSVUZCUlN4RFFVRkRMRU5CUVVNN1VVRkRhRU1zVFVGQlRTeERRVUZETEV0QlFVc3NSVUZCUlN4RFFVRkRPMUZCUTJZc1JVRkJSU3hEUVVGRExFOUJRVThzUTBGQlF5eFZRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRPMWxCUTFvc1NVRkJTU3hEUVVGRExFZEJRVWNzVVVGQlVTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUTNCQ0xFbEJRVWtzUjBGQlJ5eEhRVUZITEVOQlFVTXNRMEZCUXl4UlFVRlJMRVZCUVVVc1EwRkJRenRaUVVOMlFpeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFZEJRVWNzUTBGQlF6dFpRVU40UWl4SlFVRkpMRXRCUVVzc1IwRkJSeXhOUVVGTkxFTkJRVU1zUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRPMWxCUXpkQ0xFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRPMmRDUVVGRkxFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRWRCUVVjc1EwRkJRenRaUVVONFF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1MwRkJTeXhEUVVGRExFMUJRVTBzUjBGQlJ5eERRVUZETzJkQ1FVRkZMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVkQlFVY3NRMEZCUXp0UlFVTXpSQ3hEUVVGRExFTkJRVU1zUTBGQlF6dEpRVU5RTEVOQlFVTTdTVUZGVFN4M1FrRkJZU3hIUVVGd1FpeFZRVUZ4UWl4TlFVRk5MRVZCUVVVc1EwRkJVeXhGUVVGRkxFTkJRVk1zUlVGQlJTeE5RVUV5UXl4RlFVRkZMRWRCUVZjN1VVRkRka2NzU1VGQlNTeFpRVUZaTEVkQlFVY3NWVUZCVlN4RFFVRkRMR05CUVdNc1EwRkJReXhOUVVGTkxFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUlRORUxFdEJRVXNzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhaUVVGWkxFTkJRVU1zVFVGQlRTeEZRVUZGTEVOQlFVTXNSVUZCUlN4RlFVRkZPMWxCUXpGRExFbEJRVWtzUlVGQlJTeEhRVUZITEZsQlFWa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVONlFpeEpRVUZKTEUxQlFVMHNSMEZCUnl4RlFVRkZMRU5CUVVNN1dVRkRhRUlzUzBGQlN5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1EwRkJReXhIUVVGSExFVkJRVVVzUTBGQlF5eFJRVUZSTEVOQlFVTXNUVUZCVFN4RlFVRkZMRU5CUVVNc1JVRkJSU3hGUVVGRk8yZENRVU42UXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhGUVVGRkxFTkJRVU1zVVVGQlVTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMmRDUVVOMlFpeE5RVUZOTEVOQlFVTXNTVUZCU1N4RFFVRkRMRVZCUVVVc1NVRkJTU3hGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRWRCUVVjc1JVRkJSU3hKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTTdaMEpCUTJoRkxFMUJRVTBzUTBGQlF5eEpRVUZKTEVOQlFVTXNSVUZCUlN4SlFVRkpMRVZCUVVVc1EwRkJReXhGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNSMEZCUnl4RlFVRkZMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF6dGhRVU51UlR0WlFVTkVMRTFCUVUwc1EwRkJReXhKUVVGSkxFTkJRVU1zVlVGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4SlFVRkxMRTlCUVVFc1EwRkJReXhEUVVGRExFZEJRVWNzUjBGQlJ5eERRVUZETEVOQlFVTXNSMEZCUnl4SFFVRkhMRU5CUVVNc1EwRkJReXhKUVVGSkxFZEJRVWNzUTBGQlF5eERRVUZETEVsQlFVa3NSVUZCTDBJc1EwRkJLMElzUTBGQlF5eERRVUZETzFsQlEzWkVMRWxCUVVrc1NVRkJTU3hIUVVGSExFVkJRVVVzUTBGQlF6dFpRVU5rTEVsQlFVa3NVMEZCVXl4SFFVRkhMRU5CUVVNc1EwRkJRenRaUVVOc1FpeE5RVUZOTEVOQlFVTXNUMEZCVHl4RFFVRkRMRlZCUVVFc1EwRkJRenRuUWtGRFdpeEpRVUZKTEVOQlFVTXNRMEZCUXl4SlFVRkpMRXRCUVVzc1EwRkJReXhGUVVGRk8yOUNRVU5rTEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzI5Q1FVTm1MRk5CUVZNc1JVRkJSU3hEUVVGRE8ybENRVU5tTzNGQ1FVRk5PMjlDUVVOSUxGTkJRVk1zUlVGQlJTeERRVUZETzJsQ1FVTm1PMmRDUVVORUxFbEJRVWtzVTBGQlV5eEpRVUZKTEVOQlFVTXNSVUZCUlR0dlFrRkRhRUlzVlVGQlZTeERRVUZETEZOQlFWTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFMUJRVTBzUlVGQlJTeEpRVUZKTEVWQlFVVXNUVUZCVFN4RlFVRkZMRWRCUVVjc1EwRkJReXhEUVVGRE8yOUNRVU4wUkN4SlFVRkpMRWRCUVVjc1JVRkJSU3hEUVVGRE8ybENRVU5pTzFsQlEwd3NRMEZCUXl4RFFVRkRMRU5CUVVNN1UwRkRUanRKUVVOTUxFTkJRVU03U1VGVFJDd3JRa0ZCVlN4SFFVRldMRlZCUVdsQ0xFdEJRV0VzUlVGQlJTeFJRVUZuUWl4RlFVRkZMRTFCUVRKQ0xFVkJRVVVzVFVGQk1rSTdVVUZCTVVjc2FVSkJVVU03VVVGUVJ5eEpRVUZKTEZWQlFWVXNSMEZCUnl4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExGVkJRVUVzUTBGQlF5eEpRVUZITEU5QlFVRXNTMEZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNUVUZCVFN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRV2hETEVOQlFXZERMRU5CUVVNc1EwRkJRenRSUVVOcVJTeEpRVUZKTEV0QlFVc3NSMEZCUnl4VlFVRlZMRU5CUVVNc1ZVRkJWU3hEUVVGRExGVkJRVlVzUTBGQlF5eERRVUZETzFGQlF6bERMRWxCUVVrc1RVRkJUU3hIUVVGSExGVkJRVlVzUTBGQlF5eEhRVUZITEVOQlFVTXNWVUZCVlN4RFFVRkRMRWxCUVVrc1QwRkJUeXhWUVVGVkxFTkJRVU1zV1VGQldTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRGFrWXNWVUZCVlN4RFFVRkRMR0ZCUVdFc1EwRkJReXhOUVVGTkxFVkJRVVVzUjBGQlJ5eEZRVUZGTEVkQlFVY3NSVUZCUlN4TFFVRkxMRVZCUVVVc1VVRkJVU3hEUVVGRExFTkJRVU03VVVGRE5VUXNWVUZCVlN4RFFVRkRMR0ZCUVdFc1EwRkJReXhOUVVGTkxFVkJRVVVzUjBGQlJ5eEZRVUZGTEVkQlFVY3NSVUZCUlN4TFFVRkxMRVZCUVVVc1VVRkJVU3hEUVVGRExFTkJRVU03VVVGRE5VUXNWVUZCVlN4RFFVRkRMR05CUVdNc1EwRkJReXhOUVVGTkxFVkJRVVVzVlVGQlZTeERRVUZETEVOQlFVTTdVVUZET1VNc1QwRkJUeXhOUVVGTkxFTkJRVU03U1VGRGJFSXNRMEZCUXp0SlFVbE5MSGxDUVVGakxFZEJRWEpDTEZWQlFYTkNMRTFCUVUwc1JVRkJSU3hWUVVGVk8xRkJRM0JETEUxQlFVMHNRMEZCUXl4UFFVRlBMRU5CUVVNc1ZVRkJReXhSUVVGUkxFVkJRVVVzUTBGQlF6dFpRVU4yUWl4SlFVRkpMRWxCUVVrc1IwRkJSeXhWUVVGVkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEZWtJc1NVRkJWU3hKUVVGTExFTkJRVU1zVVVGQlVTeEZRVUZGTzJkQ1FVTjBRaXhSUVVGUkxFTkJRVU1zVDBGQlR5eEZRVUZGTEVOQlFVTTdaMEpCUTI1Q0xGRkJRVkVzUTBGQlF5eFBRVUZQTEVOQlFVTXNWVUZCVlN4UFFVRlBPMjlDUVVNNVFpeFBRVUZQTEVOQlFVTXNUMEZCVHl4RlFVRkZMRU5CUVVNN1owSkJRM1JDTEVOQlFVTXNRMEZCUXl4RFFVRkRPMkZCUTA0N1VVRkRUQ3hEUVVGRExFTkJRVU1zUTBGQlF6dEpRVU5RTEVOQlFVTTdTVUZGVFN3MlFrRkJhMElzUjBGQmVrSXNWVUZCTUVJc1MwRkJZeXhGUVVGRkxFdEJRV003VVVGRGNFUXNTVUZCU1N4TlFVRk5MRWRCUVVjc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUXpORExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUXpkQ0xFbEJRVWtzVFVGQlRTeEhRVUZITEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVU16UXl4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU0zUWl4SlFVRkpMRWxCUVVrc1IwRkJSeXhOUVVGTkxFZEJRVWNzVFVGQlRTeERRVUZETzFGQlF6TkNMRWxCUVVrc1NVRkJTU3hIUVVGSExFbEJRVWtzUTBGQlF5eEZRVUZGTEVsQlFVa3NTVUZCU1N4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExFVkJRVVVzUlVGQlJUdFpRVU51UXl4SlFVRkpMRWRCUVVjc1RVRkJUU3hIUVVGSExFMUJRVTBzUTBGQlF6dFRRVU14UWp0UlFVTkVMRTlCUVU4c1NVRkJTU3hEUVVGRE8wbEJRMmhDTEVOQlFVTTdTVUZIWXl4cFFrRkJUU3hIUVVGeVFpeFZRVUZ6UWl4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFTkJRVU03VVVGRGVrSXNUMEZCVHl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdTVUZEZUVVc1EwRkJRenRKUVVsakxHMUNRVUZSTEVkQlFYWkNMRlZCUVhkQ0xFdEJRV2xETzFGQlEzSkVMRWxCUVVrc1VVRkJVU3hIUVVGSExFVkJRVVVzUTBGQlF6dFJRVU5zUWl4TFFVRkxMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NTMEZCU3l4RFFVRkRMRTFCUVUwc1JVRkJSU3hEUVVGRExFVkJRVVVzUlVGQlJUdFpRVU51UXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhMUVVGTExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEYWtJc1NVRkJTU3hQUVVGUExGRkJRVkVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRXRCUVVzc1YwRkJWenRuUWtGQlJTeFJRVUZSTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFVkJRVVVzUTBGQlF6dFpRVU0zUkN4UlFVRlJMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU03VTBGRE4wSTdVVUZEUkN4UFFVRlBMRlZCUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zU1VGQlN5eFBRVUZCTEU5QlFVOHNVVUZCVVN4RFFVRkRMRU5CUVVNc1EwRkJReXhMUVVGTExGZEJRVmNzU1VGQlNTeFJRVUZSTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRWEJFTEVOQlFXOUVMRU5CUVVNN1NVRkRNVVVzUTBGQlF6dEpRVWxOTEhGQ1FVRlZMRWRCUVdwQ0xGVkJRV3RDTEV0QlFVczdVVUZEYmtJc1NVRkJTU3hUUVVGVExFZEJRVWNzUlVGQlJTeERRVUZETzFGQlEyNUNMRXRCUVVzc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4TFFVRkxMRU5CUVVNc1RVRkJUU3hIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNSVUZCUlR0WlFVTjJReXhMUVVGTExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1EwRkJReXhIUVVGSExFdEJRVXNzUTBGQlF5eE5RVUZOTEVWQlFVVXNRMEZCUXl4RlFVRkZMRVZCUVVVN1owSkJRM1pETEVsQlFVa3NRMEZCUXl4SFFVRkhMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGRFdpeERRVUZETEVkQlFVY3NTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVOYUxFZEJRVWNzUjBGQlJ5eEpRVUZKTEhkQ1FVRjNRaXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXp0blFrRkROME1zU1VGQlNTeERRVUZETEVWQlFVVXNSVUZCUlN4RlFVRkZMRVZCUVVVc1EwRkJRenRuUWtGRFpDeEpRVUZKTEVkQlFVY3NRMEZCUXl4TlFVRk5MRXRCUVVzc1EwRkJRenR2UWtGRGFFSXNVMEZCVXp0blFrRkRZaXhKUVVGSkxFZEJRVWNzUTBGQlF5eFJRVUZSTEVWQlFVVTdiMEpCUjJRc1EwRkJReXhEUVVGRExFOUJRVThzUlVGQlJTeERRVUZETzI5Q1FVTmFMRU5CUVVNc1EwRkJReXhSUVVGUkxFZEJRVWNzU1VGQlNTeERRVUZETzI5Q1FVTnNRaXhIUVVGSExFZEJRVWNzU1VGQlNTeDNRa0ZCZDBJc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdhVUpCUXpWRE8yZENRVU5FTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hKUVVGSkxFTkJRVU1zU1VGQlNTeEhRVUZITEVOQlFVTXNSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJRenR2UWtGRE5VSXNRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hIUVVGSExFZEJRVWNzUTBGQlF5eE5RVUZOTEVsQlFVa3NRMEZCUXl4RFFVRkRMRTFCUVUwc1NVRkJTU3hIUVVGSExFTkJRVU1zUlVGQlJTeEhRVUZITEVkQlFVY3NRMEZCUXl4TlFVRk5MRWxCUVVrc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF5eEZRVUZGTzI5Q1FVVjBSU3hUUVVGVExFTkJRVU1zU1VGQlNTeERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXp0dlFrRkRMMElzVTBGQlV6dHBRa0ZEV2p0blFrRkRSQ3hKUVVGSkxFZEJRVWNzUTBGQlF5eEZRVUZGTEVkQlFVY3NSMEZCUnl4RFFVRkRMRTFCUVUwc1NVRkJTU3hEUVVGRExFTkJRVU1zVFVGQlRTeEpRVUZKTEVkQlFVY3NRMEZCUXl4RlFVRkZMRWRCUVVjc1IwRkJSeXhEUVVGRExFMUJRVTBzU1VGQlNTeERRVUZETEVOQlFVTXNUVUZCVFN4RlFVRkZPMjlDUVUxd1JTeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTTdiMEpCUTJ4Q0xFVkJRVVVzUjBGQlJ5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF6dHZRa0ZEYmtJc1JVRkJSU3hIUVVGSExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRE8ybENRVU4wUWp0eFFrRkJUVHR2UWtGRFNDeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFZEJRVWNzUjBGQlJ5eERRVUZETEUxQlFVMHNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJRenR2UWtGREwwSXNSVUZCUlN4SFFVRkhMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeEhRVUZITEVkQlFVY3NRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJRenR2UWtGRE5VSXNSVUZCUlN4SFFVRkhMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeEhRVUZITEVkQlFVY3NRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJRenRwUWtGREwwSTdaMEpCUTBRc1NVRkJTU3hWUVVGVkxFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNSVUZCUlN4RlFVRkZMRVZCUVVVc1JVRkJSU3hEUVVGRExFVkJRVVU3YjBKQlF6bENMRk5CUVZNc1EwRkJReXhKUVVGSkxFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETzJsQ1FVTnNRenR4UWtGQlRUdHZRa0ZEU0N4VFFVRlRMRU5CUVVNc1NVRkJTU3hEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF6dHBRa0ZEYkVNN1lVRkRTanRUUVVOS08xRkJSVVFzVDBGQlR5eFZRVUZWTEVOQlFVTXNVVUZCVVN4RFFVRkRMRk5CUVZNc1EwRkJReXhEUVVGRE8wbEJRekZETEVOQlFVTTdTVUZMVFN4MVFrRkJXU3hIUVVGdVFpeFZRVUZ2UWl4SlFVRmhPMUZCUXpkQ0xGTkJRVk1zVTBGQlV5eERRVUZETEVOQlFWRTdXVUZEZGtJc1QwRkJZeXhGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTTdVVUZEY2tNc1EwRkJRenRSUVVORUxFbEJRVWtzVlVGQlZTeEhRVUZITEZWQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRExFbEJRVXNzVDBGQlFTeEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eExRVUZMTEVWQlFYWkZMRU5CUVhWRkxFTkJRVU03VVVGRGRFY3NTVUZCU1N4UlFVRlJMRWRCUVVjc1JVRkJSU3hEUVVGRE8xRkJRMnhDTEVsQlFVa3NRMEZCUXl4SFFVRkhMRk5CUVZNc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTXpRaXhMUVVGTExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFMUJRVTBzUlVGQlJTeERRVUZETEVWQlFVVXNSVUZCUlR0WlFVTnNReXhKUVVGSkxFTkJRVU1zUjBGQlJ5eFRRVUZUTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1RVRkJUU3hIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRPMWxCUTNwRkxFbEJRVWtzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4VlFVRlZMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNSVUZCUlR0blFrRkROVUlzVVVGQlVTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzJkQ1FVTjBRaXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETzJGQlExUTdVMEZEU2p0UlFVTkVMRTlCUVU4c1VVRkJVU3hEUVVGRE8wbEJRM0JDTEVOQlFVTTdTVUZKUkN3d1FrRkJTeXhIUVVGTUxGVkJRVTBzUTBGQlV5eEZRVUZGTEVOQlFWTTdVVUZCTVVJc2FVSkJORVJETzFGQk0wUkhMRWxCUVVrc1RVRkJUU3hIUVVGSExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFWTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1RVRkJUU3hIUVVGSExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFWTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRia1VzU1VGQlNTeERRVUZETEZOQlFWTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1owSkJRV2RDTEVOQlFVTXNUVUZCVFN4RlFVRkZMRTFCUVUwc1EwRkJReXhEUVVGRE8xRkJSWFpFTEVsQlFVa3NZMEZCWXl4SFFVRkhMRVZCUVVVc1EwRkJRenRSUVVONFFpeEpRVUZKTEVOQlFVTXNVMEZCVXl4RFFVRkRMRTlCUVU4c1EwRkJReXhWUVVGQkxFTkJRVU1zU1VGQlNTeFBRVUZCTEdOQlFXTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUY0UWl4RFFVRjNRaXhEUVVGRExFTkJRVU03VVVGRGRFUXNTVUZCU1N4RFFVRkRMR0ZCUVdFc1IwRkJSeXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEUxQlFVMHNRMEZCUXl4VlFVRkJMRU5CUVVNN1dVRkRjRU1zU1VGQlNTeERRVUZETEVkQlFVY3NTMEZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEVWQlEzaENMRU5CUVVNc1IwRkJSeXhMUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJRenRaUVVNM1FpeFBRVUZQTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1NVRkJTU3hKUVVGSkxFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNSVUZCUlN4SlFVRkpMR05CUVdNN2JVSkJRM1pETEVOQlFVTXNRMEZCUXl4SlFVRkpMRWxCUVVrc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eEZRVUZGTEVsQlFVa3NZMEZCWXl4RFFVRkRMRU5CUVVNN1VVRkRiRVFzUTBGQlF5eERRVUZETEVOQlFVTTdVVUZIU0N4TFFVRkxMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NUVUZCVFN4RFFVRkRMRXRCUVVzc1EwRkJReXhOUVVGTkxFVkJRVVVzUTBGQlF5eEZRVUZGTEVWQlFVVTdXVUZETVVNc1NVRkJTU3hEUVVGRExFZEJRVWNzVFVGQlRTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU03V1VGRE0wSXNTVUZCU1N4RFFVRkRMRWRCUVVjc1RVRkJUU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNN1dVRkRNMElzU1VGQlNTeERRVUZETEdGQlFXRXNRMEZCUXl4SlFVRkpMRU5CUVVNN1owSkJRM0JDTEUxQlFVMHNSVUZCUlN4RFFVRkRPMmRDUVVOVUxFMUJRVTBzUlVGQlJTeERRVUZETzJkQ1FVTlVMRTFCUVUwc1JVRkJSU3hEUVVGRE8yRkJRMW9zUTBGQlF5eERRVUZETzFOQlEwNDdVVUZEUkN4TFFVRkxMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NUVUZCVFN4RFFVRkRMRXRCUVVzc1EwRkJReXhOUVVGTkxFVkJRVVVzUTBGQlF5eEZRVUZGTEVWQlFVVTdXVUZETVVNc1NVRkJTU3hEUVVGRExFZEJRVWNzVFVGQlRTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU03V1VGRE0wSXNTVUZCU1N4RFFVRkRMRWRCUVVjc1RVRkJUU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNN1dVRkRNMElzU1VGQlNTeERRVUZETEdGQlFXRXNRMEZCUXl4SlFVRkpMRU5CUVVNN1owSkJRM0JDTEUxQlFVMHNSVUZCUlN4RFFVRkRPMmRDUVVOVUxFMUJRVTBzUlVGQlJTeERRVUZETzJkQ1FVTlVMRTFCUVUwc1JVRkJSU3hEUVVGRE8yRkJRMW9zUTBGQlF5eERRVUZETzFOQlEwNDdVVUZGUkN4SlFVRkpMRk5CUVZNc1IwRkJSeXhWUVVGQkxFTkJRVU1zU1VGQlJ5eFBRVUZCTEVOQlFVTXNRMEZCUXl4TlFVRk5MRVZCUVZJc1EwRkJVU3hGUVVONFFpeFRRVUZUTEVkQlFVY3NWVUZCUVN4RFFVRkRMRWxCUVVjc1QwRkJRU3hEUVVGRExFTkJRVU1zVFVGQlRTeEZRVUZTTEVOQlFWRXNSVUZEZUVJc1UwRkJVeXhIUVVGSExGVkJRVUVzUTBGQlF5eEpRVUZITEU5QlFVRXNRMEZCUXl4RFFVRkRMRTFCUVUwc1JVRkJVaXhEUVVGUkxFTkJRVU03VVVGRk4wSXNTVUZCU1N4elFrRkJjMElzUjBGQlJ5eEpRVUZKTERCQ1FVRlZMRU5CUVVNc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eE5RVUZOTEVWQlFVVXNTVUZCU1N4RFFVRkRMR0ZCUVdFc1JVRkJSU3hUUVVGVExFVkJRVVVzVTBGQlV5eEZRVUZGTEZOQlFWTXNRMEZCUXl4RFFVRkRPMUZCUTNCSUxFbEJRVWtzVjBGQlZ5eEhRVUZITEZWQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRE8xbEJRM1JDTEVsQlFVa3NRMEZCUXl4SFFVRkhMRXRCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRXRCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRXRCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdXVUZETlVRc1NVRkJTU3hGUVVGRkxFZEJRVWNzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RlFVRkZMRWRCUVVjc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVVYyUkN4SlFVRkpMRU5CUVVNc1EwRkJReXhKUVVGSkxFdEJRVXNzVFVGQlRTeEpRVUZKTEVOQlFVTXNRMEZCUXl4SlFVRkpMRXRCUVVzc1EwRkJReXhEUVVGRExFbEJRVWtzU1VGQlNTeERRVUZETEVOQlFVTXNTVUZCU1N4TFFVRkxMRTFCUVUwc1NVRkJTU3hEUVVGRExFTkJRVU1zU1VGQlNTeExRVUZMTEVOQlFVTXNRMEZCUXl4SlFVRkpPMmRDUVVOb1JpeFBRVUZQTEVOQlFVTXNRMEZCUXp0WlFVTmlMRTlCUVU4c1JVRkJSU3hIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTjJReXhEUVVGRExFTkJRVU03VVVGSFJpeEpRVUZKTEZsQlFWa3NSMEZCUnl4elFrRkJjMElzUTBGQlF5dzRRa0ZCT0VJc1EwRkRjRVVzVFVGQlRTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFVkJRVVVzVFVGQlRTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFVkJRM1JETEZkQlFWY3NRMEZCUXl4RFFVRkRPMUZCUjJwQ0xFbEJRVWtzVlVGQlZTeEhRVUZITEZsQlFWa3NRMEZCUXl4UFFVRlBMRVZCUVVVc1EwRkJReXhIUVVGSExFTkJRVU1zVlVGQlFTeEZRVUZGTEVsQlFVa3NUMEZCUVN4TFFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZrTEVOQlFXTXNRMEZCUXl4RFFVRkRPMUZCUTJ4RkxGVkJRVlVzUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhOUVVGTkxFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03VVVGSGFFUXNUMEZCVHl4VlFVRlZMRU5CUVVNc1RVRkJUU3hEUVVGRExGVkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTTdXVUZETVVJc1QwRkJRU3hEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEZWQlFWVXNRMEZCUXl4TlFVRk5MRWRCUVVjc1EwRkJReXhKUVVGSkxGVkJRVlVzUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1NVRkJTU3hMUVVGTExFMUJRVTBzU1VGQlNTeERRVUZETEVOQlFVTXNTVUZCU1N4TFFVRkxMRTFCUVUwN2JVSkJRemxGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFbEJRVWtzUzBGQlN5eE5RVUZOTEVsQlFVa3NWVUZCVlN4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eEpRVUZKTEV0QlFVc3NUVUZCVFN4RFFVRkRPMUZCUkhaRkxFTkJRM1ZGTEVOQlFVTXNRMEZCUXp0SlFVTnFSaXhEUVVGRE8wbEJSVTBzZFVKQlFWa3NSMEZCYmtJc1ZVRkJiMElzUzBGQlowSXNSVUZCUlN4WlFVRnZRaXhGUVVGRkxGVkJRV3RDTEVWQlFVVXNWMEZCYlVJN1VVRkRMMFlzU1VGQlNTeE5RVUZOTEVkQlFVYzdXVUZEVkN4VFFVRlRMRVZCUVVVc1NVRkJTU3hIUVVGSExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUjBGQlJ5eEhRVUZITEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NSMEZCUnp0WlFVTXpSQ3hUUVVGVExFVkJRVVVzUlVGQlJUdFRRVU5vUWl4RFFVRkRPMUZCUTBZc1NVRkJTU3hMUVVGTExFTkJRVU1zVFVGQlRTeEhRVUZITEVOQlFVTXNSVUZCUlR0WlFVTnNRaXhMUVVGTExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1MwRkJTeXhEUVVGRExFMUJRVTBzUlVGQlJTeERRVUZETEVWQlFVVXNSVUZCUlR0blFrRkRia01zU1VGQlNTeEZRVUZGTEVkQlFVY3NTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8yZENRVU5zUWl4SlFVRkpMRU5CUVVNc1IwRkJSeXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMmRDUVVNM1FpeEpRVUZKTEVWQlFVVXNSMEZCUnl4RFFVRkRMRWRCUVVjc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0blFrRkRja0lzU1VGQlNTeEZRVUZGTEVkQlFVY3NRMEZCUXl4SFFVRkhMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdaMEpCUTNKQ0xFbEJRVWtzUTBGQlF5eEhRVUZITEV0QlFVc3NRMEZCUXl4TlFVRk5MRWRCUVVjc1EwRkJReXhGUVVGRk8yOUNRVU4wUWl4SlFVRkpMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZPM2RDUVVOc1FpeERRVUZETEVsQlFVa3NSVUZCUlN4SFFVRkhMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NXVUZCV1N4RFFVRkRPM0ZDUVVONlF6dDVRa0ZCVFR0M1FrRkRTQ3hEUVVGRExFbEJRVWtzUlVGQlJTeEhRVUZITEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzV1VGQldTeERRVUZETzNGQ1FVTjZRenR2UWtGRFJDeE5RVUZOTEVOQlFVTXNVMEZCVXl4SlFVRkpMRWxCUVVrc1IwRkJSeXhEUVVGRExFZEJRVWNzUjBGQlJ5eEhRVUZITEVOQlFVTXNSMEZCUnl4SFFVRkhMRU5CUVVNN2IwSkJRemRETEVsQlFVa3NRMEZCUXl4SFFVRkhMRXRCUVVzc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTTdiMEpCUTNKQ0xFbEJRVWtzUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03YjBKQlF6ZENMRWxCUVVrc1JVRkJSU3hIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN2IwSkJRMmhDTEVsQlFVa3NSVUZCUlN4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdiMEpCUTJoQ0xFVkJRVVVzUjBGQlJ5eEZRVUZGTEVkQlFVY3NSVUZCUlN4RFFVRkRPMjlDUVVOaUxFVkJRVVVzUjBGQlJ5eEZRVUZGTEVkQlFVY3NSVUZCUlN4RFFVRkRPMjlDUVVOaUxFbEJRVWtzUzBGQlN5eEhRVUZITEZWQlFWVXNRMEZCUXl4clFrRkJhMElzUTBGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenR2UWtGRk4wUXNTVUZCU1N4RlFVRkZMRVZCUVVVc1JVRkJSU3hEUVVGRE8yOUNRVU5ZTEVsQlFVa3NTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVTdkMEpCUTJ4Q0xFVkJRVVVzUjBGQlJ5eEZRVUZGTEVkQlFVY3NSVUZCUlN4SFFVRkhMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NXVUZCV1N4RFFVRkRPM2RDUVVNelF5eEZRVUZGTEVkQlFVY3NSVUZCUlN4RFFVRkRPM0ZDUVVOWU8zbENRVUZOTzNkQ1FVTklMRVZCUVVVc1IwRkJSeXhGUVVGRkxFTkJRVU03ZDBKQlExSXNSVUZCUlN4SFFVRkhMRVZCUVVVc1IwRkJSeXhGUVVGRkxFZEJRVWNzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhaUVVGWkxFTkJRVU03Y1VKQlF6bERPMjlDUVVORUxFbEJRVWtzUlVGQlJTeEhRVUZITEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETzI5Q1FVTXhRaXhKUVVGSkxFVkJRVVVzUjBGQlJ5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF6dHZRa0ZETVVJc1RVRkJUU3hEUVVGRExGTkJRVk1zU1VGQlNTeEpRVUZKTEVkQlFVY3NSVUZCUlN4SFFVRkhMRWRCUVVjc1IwRkJSeXhGUVVGRkxFZEJRVWNzVDBGQlR5eEhRVUZITEV0QlFVc3NSMEZCUnl4SFFVRkhMRWRCUVVjc1JVRkJSU3hIUVVGSExFZEJRVWNzUjBGQlJ5eEZRVUZGTEVkQlFVY3NSMEZCUnl4RFFVRkRPMmxDUVVNeFJqdHhRa0ZCVFR0dlFrRkRTQ3hKUVVGSkxGRkJRVkVzUjBGQlJ5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJRenR2UWtGRGRFSXNTVUZCU1N4WlFVRlpMRVZCUVVVc1dVRkJXU3hEUVVGRE8yOUNRVU12UWl4SlFVRkpMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZPM2RDUVVOc1FpeERRVUZETEVsQlFVa3NSVUZCUlN4SFFVRkhMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NWMEZCVnl4RFFVRkRPM2RDUVVOeVF5eFpRVUZaTEVkQlFVY3NRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhIUVVGSExGVkJRVlVzUTBGQlF5eERRVUZETzNkQ1FVTnVReXhaUVVGWkxFZEJRVWNzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRlZCUVZVc1EwRkJReXhEUVVGRE8zRkNRVU4wUXp0NVFrRkJUVHQzUWtGRFNDeERRVUZETEVsQlFVa3NSVUZCUlN4SFFVRkhMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NWMEZCVnl4RFFVRkRPM2RDUVVOeVF5eFpRVUZaTEVkQlFVY3NRMEZCUXl4RFFVRkRMRWRCUVVjc1ZVRkJWU3hGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETzNkQ1FVTnVReXhaUVVGWkxFZEJRVWNzUTBGQlF5eERRVUZETEVkQlFVY3NWVUZCVlN4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRE8zRkNRVU4wUXp0dlFrRkRSQ3hOUVVGTkxFTkJRVU1zVTBGQlV5eEpRVUZKTEVsQlFVa3NSMEZCUnl4RFFVRkRMRWRCUVVjc1IwRkJSeXhIUVVGSExFTkJRVU1zUjBGQlJ5eEhRVUZITEVOQlFVTTdiMEpCUXpkRExFbEJRVWtzVjBGQlZ5eEhRVUZITEVOQlFVTXNSVUZCUlR0M1FrRkRha0lzVFVGQlRTeERRVUZETEZOQlFWTXNSMEZCUnl4SlFVRkpMRWRCUVVjc1VVRkJVU3hEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVkQlFVY3NSMEZCUnl4UlFVRlJMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUzBGQlN5eEhRVUZITEZsQlFWa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhIUVVGSExFZEJRVWNzV1VGQldTeERRVUZETEVOQlFVTXNRMEZCUXpzNFFrRkRla2NzUzBGQlN5eEhRVUZITEZsQlFWa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhIUVVGSExFZEJRVWNzV1VGQldTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPM0ZDUVVOeVJEdHBRa0ZEU2p0aFFVTktPMU5CUTBvN1lVRkJUVHRaUVVOSUxFbEJRVWtzUlVGQlJTeEhRVUZITEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVOc1FpeEpRVUZKTEVOQlFVTXNSMEZCUnl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFsQlF6ZENMRWxCUVVrc1JVRkJSU3hIUVVGSExFTkJRVU1zUjBGQlJ5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRM0pDTEVsQlFVa3NSVUZCUlN4SFFVRkhMRU5CUVVNc1IwRkJSeXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUTNKQ0xFbEJRVWtzVVVGQlVTeEhRVUZITEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRM1JDTEVsQlFVa3NXVUZCV1N4RlFVRkZMRmxCUVZrc1EwRkJRenRaUVVNdlFpeEpRVUZKTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTzJkQ1FVTnNRaXhEUVVGRExFbEJRVWtzUlVGQlJTeEhRVUZITEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzVjBGQlZ5eERRVUZETzJkQ1FVTnlReXhaUVVGWkxFZEJRVWNzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRlZCUVZVc1EwRkJReXhEUVVGRE8yZENRVU51UXl4WlFVRlpMRWRCUVVjc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEZWQlFWVXNRMEZCUXl4RFFVRkRPMkZCUTNSRE8ybENRVUZOTzJkQ1FVTklMRU5CUVVNc1NVRkJTU3hGUVVGRkxFZEJRVWNzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhYUVVGWExFTkJRVU03WjBKQlEzSkRMRmxCUVZrc1IwRkJSeXhEUVVGRExFTkJRVU1zUjBGQlJ5eFZRVUZWTEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1owSkJRMjVETEZsQlFWa3NSMEZCUnl4RFFVRkRMRU5CUVVNc1IwRkJSeXhWUVVGVkxFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdZVUZEZEVNN1dVRkRSQ3hOUVVGTkxFTkJRVU1zVTBGQlV5eEpRVUZKTEVsQlFVa3NSMEZCUnl4RFFVRkRMRWRCUVVjc1IwRkJSeXhIUVVGSExFTkJRVU1zUjBGQlJ5eEhRVUZITEVOQlFVTTdXVUZETjBNc1NVRkJTU3hYUVVGWExFZEJRVWNzUTBGQlF5eEZRVUZGTzJkQ1FVTnFRaXhOUVVGTkxFTkJRVU1zVTBGQlV5eEhRVUZITEVsQlFVa3NSMEZCUnl4UlFVRlJMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUjBGQlJ5eEhRVUZITEZGQlFWRXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhMUVVGTExFZEJRVWNzV1VGQldTeERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRWRCUVVjc1IwRkJSeXhaUVVGWkxFTkJRVU1zUTBGQlF5eERRVUZETzNOQ1FVTjZSeXhMUVVGTExFZEJRVWNzV1VGQldTeERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRWRCUVVjc1IwRkJSeXhaUVVGWkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdZVUZEY2tRN1UwRkRTanRSUVVORUxFOUJRVThzVFVGQlRTeERRVUZETzBsQlEyeENMRU5CUVVNN1NVRkRUQ3hwUWtGQlF6dEJRVUZFTEVOQlFVTXNRVUY2YkVKRUxFbEJlV3hDUXp0QlFYcHNRbGtzWjBOQlFWVWlmUT09IiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgcGFja2luZ09wdGlvbnMgPSB7XG4gICAgUEFERElORzogMTAsXG4gICAgR09MREVOX1NFQ1RJT046ICgxICsgTWF0aC5zcXJ0KDUpKSAvIDIsXG4gICAgRkxPQVRfRVBTSUxPTjogMC4wMDAxLFxuICAgIE1BWF9JTkVSQVRJT05TOiAxMDBcbn07XG5mdW5jdGlvbiBhcHBseVBhY2tpbmcoZ3JhcGhzLCB3LCBoLCBub2RlX3NpemUsIGRlc2lyZWRfcmF0aW8sIGNlbnRlckdyYXBoKSB7XG4gICAgaWYgKGRlc2lyZWRfcmF0aW8gPT09IHZvaWQgMCkgeyBkZXNpcmVkX3JhdGlvID0gMTsgfVxuICAgIGlmIChjZW50ZXJHcmFwaCA9PT0gdm9pZCAwKSB7IGNlbnRlckdyYXBoID0gdHJ1ZTsgfVxuICAgIHZhciBpbml0X3ggPSAwLCBpbml0X3kgPSAwLCBzdmdfd2lkdGggPSB3LCBzdmdfaGVpZ2h0ID0gaCwgZGVzaXJlZF9yYXRpbyA9IHR5cGVvZiBkZXNpcmVkX3JhdGlvICE9PSAndW5kZWZpbmVkJyA/IGRlc2lyZWRfcmF0aW8gOiAxLCBub2RlX3NpemUgPSB0eXBlb2Ygbm9kZV9zaXplICE9PSAndW5kZWZpbmVkJyA/IG5vZGVfc2l6ZSA6IDAsIHJlYWxfd2lkdGggPSAwLCByZWFsX2hlaWdodCA9IDAsIG1pbl93aWR0aCA9IDAsIGdsb2JhbF9ib3R0b20gPSAwLCBsaW5lID0gW107XG4gICAgaWYgKGdyYXBocy5sZW5ndGggPT0gMClcbiAgICAgICAgcmV0dXJuO1xuICAgIGNhbGN1bGF0ZV9iYihncmFwaHMpO1xuICAgIGFwcGx5KGdyYXBocywgZGVzaXJlZF9yYXRpbyk7XG4gICAgaWYgKGNlbnRlckdyYXBoKSB7XG4gICAgICAgIHB1dF9ub2Rlc190b19yaWdodF9wb3NpdGlvbnMoZ3JhcGhzKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gY2FsY3VsYXRlX2JiKGdyYXBocykge1xuICAgICAgICBncmFwaHMuZm9yRWFjaChmdW5jdGlvbiAoZykge1xuICAgICAgICAgICAgY2FsY3VsYXRlX3NpbmdsZV9iYihnKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGZ1bmN0aW9uIGNhbGN1bGF0ZV9zaW5nbGVfYmIoZ3JhcGgpIHtcbiAgICAgICAgICAgIHZhciBtaW5feCA9IE51bWJlci5NQVhfVkFMVUUsIG1pbl95ID0gTnVtYmVyLk1BWF9WQUxVRSwgbWF4X3ggPSAwLCBtYXhfeSA9IDA7XG4gICAgICAgICAgICBncmFwaC5hcnJheS5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICAgICAgdmFyIHcgPSB0eXBlb2Ygdi53aWR0aCAhPT0gJ3VuZGVmaW5lZCcgPyB2LndpZHRoIDogbm9kZV9zaXplO1xuICAgICAgICAgICAgICAgIHZhciBoID0gdHlwZW9mIHYuaGVpZ2h0ICE9PSAndW5kZWZpbmVkJyA/IHYuaGVpZ2h0IDogbm9kZV9zaXplO1xuICAgICAgICAgICAgICAgIHcgLz0gMjtcbiAgICAgICAgICAgICAgICBoIC89IDI7XG4gICAgICAgICAgICAgICAgbWF4X3ggPSBNYXRoLm1heCh2LnggKyB3LCBtYXhfeCk7XG4gICAgICAgICAgICAgICAgbWluX3ggPSBNYXRoLm1pbih2LnggLSB3LCBtaW5feCk7XG4gICAgICAgICAgICAgICAgbWF4X3kgPSBNYXRoLm1heCh2LnkgKyBoLCBtYXhfeSk7XG4gICAgICAgICAgICAgICAgbWluX3kgPSBNYXRoLm1pbih2LnkgLSBoLCBtaW5feSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGdyYXBoLndpZHRoID0gbWF4X3ggLSBtaW5feDtcbiAgICAgICAgICAgIGdyYXBoLmhlaWdodCA9IG1heF95IC0gbWluX3k7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gcHV0X25vZGVzX3RvX3JpZ2h0X3Bvc2l0aW9ucyhncmFwaHMpIHtcbiAgICAgICAgZ3JhcGhzLmZvckVhY2goZnVuY3Rpb24gKGcpIHtcbiAgICAgICAgICAgIHZhciBjZW50ZXIgPSB7IHg6IDAsIHk6IDAgfTtcbiAgICAgICAgICAgIGcuYXJyYXkuZm9yRWFjaChmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgICAgIGNlbnRlci54ICs9IG5vZGUueDtcbiAgICAgICAgICAgICAgICBjZW50ZXIueSArPSBub2RlLnk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNlbnRlci54IC89IGcuYXJyYXkubGVuZ3RoO1xuICAgICAgICAgICAgY2VudGVyLnkgLz0gZy5hcnJheS5sZW5ndGg7XG4gICAgICAgICAgICB2YXIgY29ybmVyID0geyB4OiBjZW50ZXIueCAtIGcud2lkdGggLyAyLCB5OiBjZW50ZXIueSAtIGcuaGVpZ2h0IC8gMiB9O1xuICAgICAgICAgICAgdmFyIG9mZnNldCA9IHsgeDogZy54IC0gY29ybmVyLnggKyBzdmdfd2lkdGggLyAyIC0gcmVhbF93aWR0aCAvIDIsIHk6IGcueSAtIGNvcm5lci55ICsgc3ZnX2hlaWdodCAvIDIgLSByZWFsX2hlaWdodCAvIDIgfTtcbiAgICAgICAgICAgIGcuYXJyYXkuZm9yRWFjaChmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgICAgIG5vZGUueCArPSBvZmZzZXQueDtcbiAgICAgICAgICAgICAgICBub2RlLnkgKz0gb2Zmc2V0Lnk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGFwcGx5KGRhdGEsIGRlc2lyZWRfcmF0aW8pIHtcbiAgICAgICAgdmFyIGN1cnJfYmVzdF9mID0gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZO1xuICAgICAgICB2YXIgY3Vycl9iZXN0ID0gMDtcbiAgICAgICAgZGF0YS5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBiLmhlaWdodCAtIGEuaGVpZ2h0OyB9KTtcbiAgICAgICAgbWluX3dpZHRoID0gZGF0YS5yZWR1Y2UoZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgIHJldHVybiBhLndpZHRoIDwgYi53aWR0aCA/IGEud2lkdGggOiBiLndpZHRoO1xuICAgICAgICB9KTtcbiAgICAgICAgdmFyIGxlZnQgPSB4MSA9IG1pbl93aWR0aDtcbiAgICAgICAgdmFyIHJpZ2h0ID0geDIgPSBnZXRfZW50aXJlX3dpZHRoKGRhdGEpO1xuICAgICAgICB2YXIgaXRlcmF0aW9uQ291bnRlciA9IDA7XG4gICAgICAgIHZhciBmX3gxID0gTnVtYmVyLk1BWF9WQUxVRTtcbiAgICAgICAgdmFyIGZfeDIgPSBOdW1iZXIuTUFYX1ZBTFVFO1xuICAgICAgICB2YXIgZmxhZyA9IC0xO1xuICAgICAgICB2YXIgZHggPSBOdW1iZXIuTUFYX1ZBTFVFO1xuICAgICAgICB2YXIgZGYgPSBOdW1iZXIuTUFYX1ZBTFVFO1xuICAgICAgICB3aGlsZSAoKGR4ID4gbWluX3dpZHRoKSB8fCBkZiA+IHBhY2tpbmdPcHRpb25zLkZMT0FUX0VQU0lMT04pIHtcbiAgICAgICAgICAgIGlmIChmbGFnICE9IDEpIHtcbiAgICAgICAgICAgICAgICB2YXIgeDEgPSByaWdodCAtIChyaWdodCAtIGxlZnQpIC8gcGFja2luZ09wdGlvbnMuR09MREVOX1NFQ1RJT047XG4gICAgICAgICAgICAgICAgdmFyIGZfeDEgPSBzdGVwKGRhdGEsIHgxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChmbGFnICE9IDApIHtcbiAgICAgICAgICAgICAgICB2YXIgeDIgPSBsZWZ0ICsgKHJpZ2h0IC0gbGVmdCkgLyBwYWNraW5nT3B0aW9ucy5HT0xERU5fU0VDVElPTjtcbiAgICAgICAgICAgICAgICB2YXIgZl94MiA9IHN0ZXAoZGF0YSwgeDIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZHggPSBNYXRoLmFicyh4MSAtIHgyKTtcbiAgICAgICAgICAgIGRmID0gTWF0aC5hYnMoZl94MSAtIGZfeDIpO1xuICAgICAgICAgICAgaWYgKGZfeDEgPCBjdXJyX2Jlc3RfZikge1xuICAgICAgICAgICAgICAgIGN1cnJfYmVzdF9mID0gZl94MTtcbiAgICAgICAgICAgICAgICBjdXJyX2Jlc3QgPSB4MTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChmX3gyIDwgY3Vycl9iZXN0X2YpIHtcbiAgICAgICAgICAgICAgICBjdXJyX2Jlc3RfZiA9IGZfeDI7XG4gICAgICAgICAgICAgICAgY3Vycl9iZXN0ID0geDI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZl94MSA+IGZfeDIpIHtcbiAgICAgICAgICAgICAgICBsZWZ0ID0geDE7XG4gICAgICAgICAgICAgICAgeDEgPSB4MjtcbiAgICAgICAgICAgICAgICBmX3gxID0gZl94MjtcbiAgICAgICAgICAgICAgICBmbGFnID0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJpZ2h0ID0geDI7XG4gICAgICAgICAgICAgICAgeDIgPSB4MTtcbiAgICAgICAgICAgICAgICBmX3gyID0gZl94MTtcbiAgICAgICAgICAgICAgICBmbGFnID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpdGVyYXRpb25Db3VudGVyKysgPiAxMDApIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBzdGVwKGRhdGEsIGN1cnJfYmVzdCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHN0ZXAoZGF0YSwgbWF4X3dpZHRoKSB7XG4gICAgICAgIGxpbmUgPSBbXTtcbiAgICAgICAgcmVhbF93aWR0aCA9IDA7XG4gICAgICAgIHJlYWxfaGVpZ2h0ID0gMDtcbiAgICAgICAgZ2xvYmFsX2JvdHRvbSA9IGluaXRfeTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgbyA9IGRhdGFbaV07XG4gICAgICAgICAgICBwdXRfcmVjdChvLCBtYXhfd2lkdGgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBNYXRoLmFicyhnZXRfcmVhbF9yYXRpbygpIC0gZGVzaXJlZF9yYXRpbyk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHB1dF9yZWN0KHJlY3QsIG1heF93aWR0aCkge1xuICAgICAgICB2YXIgcGFyZW50ID0gdW5kZWZpbmVkO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpbmUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICgobGluZVtpXS5zcGFjZV9sZWZ0ID49IHJlY3QuaGVpZ2h0KSAmJiAobGluZVtpXS54ICsgbGluZVtpXS53aWR0aCArIHJlY3Qud2lkdGggKyBwYWNraW5nT3B0aW9ucy5QQURESU5HIC0gbWF4X3dpZHRoKSA8PSBwYWNraW5nT3B0aW9ucy5GTE9BVF9FUFNJTE9OKSB7XG4gICAgICAgICAgICAgICAgcGFyZW50ID0gbGluZVtpXTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBsaW5lLnB1c2gocmVjdCk7XG4gICAgICAgIGlmIChwYXJlbnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmVjdC54ID0gcGFyZW50LnggKyBwYXJlbnQud2lkdGggKyBwYWNraW5nT3B0aW9ucy5QQURESU5HO1xuICAgICAgICAgICAgcmVjdC55ID0gcGFyZW50LmJvdHRvbTtcbiAgICAgICAgICAgIHJlY3Quc3BhY2VfbGVmdCA9IHJlY3QuaGVpZ2h0O1xuICAgICAgICAgICAgcmVjdC5ib3R0b20gPSByZWN0Lnk7XG4gICAgICAgICAgICBwYXJlbnQuc3BhY2VfbGVmdCAtPSByZWN0LmhlaWdodCArIHBhY2tpbmdPcHRpb25zLlBBRERJTkc7XG4gICAgICAgICAgICBwYXJlbnQuYm90dG9tICs9IHJlY3QuaGVpZ2h0ICsgcGFja2luZ09wdGlvbnMuUEFERElORztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJlY3QueSA9IGdsb2JhbF9ib3R0b207XG4gICAgICAgICAgICBnbG9iYWxfYm90dG9tICs9IHJlY3QuaGVpZ2h0ICsgcGFja2luZ09wdGlvbnMuUEFERElORztcbiAgICAgICAgICAgIHJlY3QueCA9IGluaXRfeDtcbiAgICAgICAgICAgIHJlY3QuYm90dG9tID0gcmVjdC55O1xuICAgICAgICAgICAgcmVjdC5zcGFjZV9sZWZ0ID0gcmVjdC5oZWlnaHQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlY3QueSArIHJlY3QuaGVpZ2h0IC0gcmVhbF9oZWlnaHQgPiAtcGFja2luZ09wdGlvbnMuRkxPQVRfRVBTSUxPTilcbiAgICAgICAgICAgIHJlYWxfaGVpZ2h0ID0gcmVjdC55ICsgcmVjdC5oZWlnaHQgLSBpbml0X3k7XG4gICAgICAgIGlmIChyZWN0LnggKyByZWN0LndpZHRoIC0gcmVhbF93aWR0aCA+IC1wYWNraW5nT3B0aW9ucy5GTE9BVF9FUFNJTE9OKVxuICAgICAgICAgICAgcmVhbF93aWR0aCA9IHJlY3QueCArIHJlY3Qud2lkdGggLSBpbml0X3g7XG4gICAgfVxuICAgIDtcbiAgICBmdW5jdGlvbiBnZXRfZW50aXJlX3dpZHRoKGRhdGEpIHtcbiAgICAgICAgdmFyIHdpZHRoID0gMDtcbiAgICAgICAgZGF0YS5mb3JFYWNoKGZ1bmN0aW9uIChkKSB7IHJldHVybiB3aWR0aCArPSBkLndpZHRoICsgcGFja2luZ09wdGlvbnMuUEFERElORzsgfSk7XG4gICAgICAgIHJldHVybiB3aWR0aDtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ2V0X3JlYWxfcmF0aW8oKSB7XG4gICAgICAgIHJldHVybiAocmVhbF93aWR0aCAvIHJlYWxfaGVpZ2h0KTtcbiAgICB9XG59XG5leHBvcnRzLmFwcGx5UGFja2luZyA9IGFwcGx5UGFja2luZztcbmZ1bmN0aW9uIHNlcGFyYXRlR3JhcGhzKG5vZGVzLCBsaW5rcykge1xuICAgIHZhciBtYXJrcyA9IHt9O1xuICAgIHZhciB3YXlzID0ge307XG4gICAgdmFyIGdyYXBocyA9IFtdO1xuICAgIHZhciBjbHVzdGVycyA9IDA7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW5rcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgbGluayA9IGxpbmtzW2ldO1xuICAgICAgICB2YXIgbjEgPSBsaW5rLnNvdXJjZTtcbiAgICAgICAgdmFyIG4yID0gbGluay50YXJnZXQ7XG4gICAgICAgIGlmICh3YXlzW24xLmluZGV4XSlcbiAgICAgICAgICAgIHdheXNbbjEuaW5kZXhdLnB1c2gobjIpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICB3YXlzW24xLmluZGV4XSA9IFtuMl07XG4gICAgICAgIGlmICh3YXlzW24yLmluZGV4XSlcbiAgICAgICAgICAgIHdheXNbbjIuaW5kZXhdLnB1c2gobjEpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICB3YXlzW24yLmluZGV4XSA9IFtuMV07XG4gICAgfVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIG5vZGUgPSBub2Rlc1tpXTtcbiAgICAgICAgaWYgKG1hcmtzW25vZGUuaW5kZXhdKVxuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIGV4cGxvcmVfbm9kZShub2RlLCB0cnVlKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZXhwbG9yZV9ub2RlKG4sIGlzX25ldykge1xuICAgICAgICBpZiAobWFya3Nbbi5pbmRleF0gIT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgaWYgKGlzX25ldykge1xuICAgICAgICAgICAgY2x1c3RlcnMrKztcbiAgICAgICAgICAgIGdyYXBocy5wdXNoKHsgYXJyYXk6IFtdIH0pO1xuICAgICAgICB9XG4gICAgICAgIG1hcmtzW24uaW5kZXhdID0gY2x1c3RlcnM7XG4gICAgICAgIGdyYXBoc1tjbHVzdGVycyAtIDFdLmFycmF5LnB1c2gobik7XG4gICAgICAgIHZhciBhZGphY2VudCA9IHdheXNbbi5pbmRleF07XG4gICAgICAgIGlmICghYWRqYWNlbnQpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgYWRqYWNlbnQubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIGV4cGxvcmVfbm9kZShhZGphY2VudFtqXSwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBncmFwaHM7XG59XG5leHBvcnRzLnNlcGFyYXRlR3JhcGhzID0gc2VwYXJhdGVHcmFwaHM7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0ptYVd4bElqb2lhR0Z1Wkd4bFpHbHpZMjl1Ym1WamRHVmtMbXB6SWl3aWMyOTFjbU5sVW05dmRDSTZJaUlzSW5OdmRYSmpaWE1pT2xzaUxpNHZMaTR2VjJWaVEyOXNZUzl6Y21NdmFHRnVaR3hsWkdselkyOXVibVZqZEdWa0xuUnpJbDBzSW01aGJXVnpJanBiWFN3aWJXRndjR2x1WjNNaU9pSTdPMEZCUVVrc1NVRkJTU3hqUVVGakxFZEJRVWM3U1VGRGFrSXNUMEZCVHl4RlFVRkZMRVZCUVVVN1NVRkRXQ3hqUVVGakxFVkJRVVVzUTBGQlF5eERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTTdTVUZEZEVNc1lVRkJZU3hGUVVGRkxFMUJRVTA3U1VGRGNrSXNZMEZCWXl4RlFVRkZMRWRCUVVjN1EwRkRkRUlzUTBGQlF6dEJRVWRHTEZOQlFXZENMRmxCUVZrc1EwRkJReXhOUVVGcFFpeEZRVUZGTEVOQlFVTXNSVUZCUlN4RFFVRkRMRVZCUVVVc1UwRkJVeXhGUVVGRkxHRkJRV2xDTEVWQlFVVXNWMEZCYTBJN1NVRkJja01zT0VKQlFVRXNSVUZCUVN4cFFrRkJhVUk3U1VGQlJTdzBRa0ZCUVN4RlFVRkJMR3RDUVVGclFqdEpRVVZzUnl4SlFVRkpMRTFCUVUwc1IwRkJSeXhEUVVGRExFVkJRMVlzVFVGQlRTeEhRVUZITEVOQlFVTXNSVUZGVml4VFFVRlRMRWRCUVVjc1EwRkJReXhGUVVOaUxGVkJRVlVzUjBGQlJ5eERRVUZETEVWQlJXUXNZVUZCWVN4SFFVRkhMRTlCUVU4c1lVRkJZU3hMUVVGTExGZEJRVmNzUTBGQlF5eERRVUZETEVOQlFVTXNZVUZCWVN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRM2hGTEZOQlFWTXNSMEZCUnl4UFFVRlBMRk5CUVZNc1MwRkJTeXhYUVVGWExFTkJRVU1zUTBGQlF5eERRVUZETEZOQlFWTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVVMVJDeFZRVUZWTEVkQlFVY3NRMEZCUXl4RlFVTmtMRmRCUVZjc1IwRkJSeXhEUVVGRExFVkJRMllzVTBGQlV5eEhRVUZITEVOQlFVTXNSVUZGWWl4aFFVRmhMRWRCUVVjc1EwRkJReXhGUVVOcVFpeEpRVUZKTEVkQlFVY3NSVUZCUlN4RFFVRkRPMGxCUldRc1NVRkJTU3hOUVVGTkxFTkJRVU1zVFVGQlRTeEpRVUZKTEVOQlFVTTdVVUZEYkVJc1QwRkJUenRKUVZWWUxGbEJRVmtzUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXp0SlFVTnlRaXhMUVVGTExFTkJRVU1zVFVGQlRTeEZRVUZGTEdGQlFXRXNRMEZCUXl4RFFVRkRPMGxCUXpkQ0xFbEJRVWNzVjBGQlZ5eEZRVUZGTzFGQlExb3NORUpCUVRSQ0xFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTTdTMEZEZUVNN1NVRkhSQ3hUUVVGVExGbEJRVmtzUTBGQlF5eE5RVUZOTzFGQlJYaENMRTFCUVUwc1EwRkJReXhQUVVGUExFTkJRVU1zVlVGQlZTeERRVUZETzFsQlEzUkNMRzFDUVVGdFFpeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkJPMUZCUXpGQ0xFTkJRVU1zUTBGQlF5eERRVUZETzFGQlJVZ3NVMEZCVXl4dFFrRkJiVUlzUTBGQlF5eExRVUZMTzFsQlF6bENMRWxCUVVrc1MwRkJTeXhIUVVGSExFMUJRVTBzUTBGQlF5eFRRVUZUTEVWQlFVVXNTMEZCU3l4SFFVRkhMRTFCUVUwc1EwRkJReXhUUVVGVExFVkJRMnhFTEV0QlFVc3NSMEZCUnl4RFFVRkRMRVZCUVVVc1MwRkJTeXhIUVVGSExFTkJRVU1zUTBGQlF6dFpRVVY2UWl4TFFVRkxMRU5CUVVNc1MwRkJTeXhEUVVGRExFOUJRVThzUTBGQlF5eFZRVUZWTEVOQlFVTTdaMEpCUXpOQ0xFbEJRVWtzUTBGQlF5eEhRVUZITEU5QlFVOHNRMEZCUXl4RFFVRkRMRXRCUVVzc1MwRkJTeXhYUVVGWExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExGTkJRVk1zUTBGQlF6dG5Ra0ZETjBRc1NVRkJTU3hEUVVGRExFZEJRVWNzVDBGQlR5eERRVUZETEVOQlFVTXNUVUZCVFN4TFFVRkxMRmRCUVZjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1UwRkJVeXhEUVVGRE8yZENRVU12UkN4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRE8yZENRVU5RTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNN1owSkJRMUFzUzBGQlN5eEhRVUZITEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNTMEZCU3l4RFFVRkRMRU5CUVVNN1owSkJRMnBETEV0QlFVc3NSMEZCUnl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRXRCUVVzc1EwRkJReXhEUVVGRE8yZENRVU5xUXl4TFFVRkxMRWRCUVVjc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hMUVVGTExFTkJRVU1zUTBGQlF6dG5Ra0ZEYWtNc1MwRkJTeXhIUVVGSExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUzBGQlN5eERRVUZETEVOQlFVTTdXVUZEY2tNc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRlNDeExRVUZMTEVOQlFVTXNTMEZCU3l4SFFVRkhMRXRCUVVzc1IwRkJSeXhMUVVGTExFTkJRVU03V1VGRE5VSXNTMEZCU3l4RFFVRkRMRTFCUVUwc1IwRkJSeXhMUVVGTExFZEJRVWNzUzBGQlN5eERRVUZETzFGQlEycERMRU5CUVVNN1NVRkRUQ3hEUVVGRE8wbEJkVU5FTEZOQlFWTXNORUpCUVRSQ0xFTkJRVU1zVFVGQlRUdFJRVU40UXl4TlFVRk5MRU5CUVVNc1QwRkJUeXhEUVVGRExGVkJRVlVzUTBGQlF6dFpRVVYwUWl4SlFVRkpMRTFCUVUwc1IwRkJSeXhGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRE8xbEJSVFZDTEVOQlFVTXNRMEZCUXl4TFFVRkxMRU5CUVVNc1QwRkJUeXhEUVVGRExGVkJRVlVzU1VGQlNUdG5Ra0ZETVVJc1RVRkJUU3hEUVVGRExFTkJRVU1zU1VGQlNTeEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRPMmRDUVVOdVFpeE5RVUZOTEVOQlFVTXNRMEZCUXl4SlFVRkpMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRGRrSXNRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkZTQ3hOUVVGTkxFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4TFFVRkxMRU5CUVVNc1RVRkJUU3hEUVVGRE8xbEJRek5DTEUxQlFVMHNRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFdEJRVXNzUTBGQlF5eE5RVUZOTEVOQlFVTTdXVUZITTBJc1NVRkJTU3hOUVVGTkxFZEJRVWNzUlVGQlJTeERRVUZETEVWQlFVVXNUVUZCVFN4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUzBGQlN5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRVZCUVVVc1RVRkJUU3hEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNUVUZCVFN4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRE8xbEJRM1pGTEVsQlFVa3NUVUZCVFN4SFFVRkhMRVZCUVVVc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NUVUZCVFN4RFFVRkRMRU5CUVVNc1IwRkJSeXhUUVVGVExFZEJRVWNzUTBGQlF5eEhRVUZITEZWQlFWVXNSMEZCUnl4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NUVUZCVFN4RFFVRkRMRU5CUVVNc1IwRkJSeXhWUVVGVkxFZEJRVWNzUTBGQlF5eEhRVUZITEZkQlFWY3NSMEZCUnl4RFFVRkRMRVZCUVVNc1EwRkJRenRaUVVkNlNDeERRVUZETEVOQlFVTXNTMEZCU3l4RFFVRkRMRTlCUVU4c1EwRkJReXhWUVVGVkxFbEJRVWs3WjBKQlF6RkNMRWxCUVVrc1EwRkJReXhEUVVGRExFbEJRVWtzVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXp0blFrRkRia0lzU1VGQlNTeERRVUZETEVOQlFVTXNTVUZCU1N4TlFVRk5MRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRM1pDTEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTFBc1EwRkJReXhEUVVGRExFTkJRVU03U1VGRFVDeERRVUZETzBsQlNVUXNVMEZCVXl4TFFVRkxMRU5CUVVNc1NVRkJTU3hGUVVGRkxHRkJRV0U3VVVGRE9VSXNTVUZCU1N4WFFVRlhMRWRCUVVjc1RVRkJUU3hEUVVGRExHbENRVUZwUWl4RFFVRkRPMUZCUXpORExFbEJRVWtzVTBGQlV5eEhRVUZITEVOQlFVTXNRMEZCUXp0UlFVTnNRaXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEZWQlFWVXNRMEZCUXl4RlFVRkZMRU5CUVVNc1NVRkJTU3hQUVVGUExFTkJRVU1zUTBGQlF5eE5RVUZOTEVkQlFVY3NRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlJUTkVMRk5CUVZNc1IwRkJSeXhKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEZWQlFWVXNRMEZCUXl4RlFVRkZMRU5CUVVNN1dVRkRiRU1zVDBGQlR5eERRVUZETEVOQlFVTXNTMEZCU3l4SFFVRkhMRU5CUVVNc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eExRVUZMTEVOQlFVTTdVVUZEYWtRc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRlNDeEpRVUZKTEVsQlFVa3NSMEZCUnl4RlFVRkZMRWRCUVVjc1UwRkJVeXhEUVVGRE8xRkJRekZDTEVsQlFVa3NTMEZCU3l4SFFVRkhMRVZCUVVVc1IwRkJSeXhuUWtGQlowSXNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRenRSUVVONFF5eEpRVUZKTEdkQ1FVRm5RaXhIUVVGSExFTkJRVU1zUTBGQlF6dFJRVVY2UWl4SlFVRkpMRWxCUVVrc1IwRkJSeXhOUVVGTkxFTkJRVU1zVTBGQlV5eERRVUZETzFGQlF6VkNMRWxCUVVrc1NVRkJTU3hIUVVGSExFMUJRVTBzUTBGQlF5eFRRVUZUTEVOQlFVTTdVVUZETlVJc1NVRkJTU3hKUVVGSkxFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTTdVVUZIWkN4SlFVRkpMRVZCUVVVc1IwRkJSeXhOUVVGTkxFTkJRVU1zVTBGQlV5eERRVUZETzFGQlF6RkNMRWxCUVVrc1JVRkJSU3hIUVVGSExFMUJRVTBzUTBGQlF5eFRRVUZUTEVOQlFVTTdVVUZGTVVJc1QwRkJUeXhEUVVGRExFVkJRVVVzUjBGQlJ5eFRRVUZUTEVOQlFVTXNTVUZCU1N4RlFVRkZMRWRCUVVjc1kwRkJZeXhEUVVGRExHRkJRV0VzUlVGQlJUdFpRVVV4UkN4SlFVRkpMRWxCUVVrc1NVRkJTU3hEUVVGRExFVkJRVVU3WjBKQlExZ3NTVUZCU1N4RlFVRkZMRWRCUVVjc1MwRkJTeXhIUVVGSExFTkJRVU1zUzBGQlN5eEhRVUZITEVsQlFVa3NRMEZCUXl4SFFVRkhMR05CUVdNc1EwRkJReXhqUVVGakxFTkJRVU03WjBKQlEyaEZMRWxCUVVrc1NVRkJTU3hIUVVGSExFbEJRVWtzUTBGQlF5eEpRVUZKTEVWQlFVVXNSVUZCUlN4RFFVRkRMRU5CUVVNN1lVRkROMEk3V1VGRFJDeEpRVUZKTEVsQlFVa3NTVUZCU1N4RFFVRkRMRVZCUVVVN1owSkJRMWdzU1VGQlNTeEZRVUZGTEVkQlFVY3NTVUZCU1N4SFFVRkhMRU5CUVVNc1MwRkJTeXhIUVVGSExFbEJRVWtzUTBGQlF5eEhRVUZITEdOQlFXTXNRMEZCUXl4alFVRmpMRU5CUVVNN1owSkJReTlFTEVsQlFVa3NTVUZCU1N4SFFVRkhMRWxCUVVrc1EwRkJReXhKUVVGSkxFVkJRVVVzUlVGQlJTeERRVUZETEVOQlFVTTdZVUZETjBJN1dVRkZSQ3hGUVVGRkxFZEJRVWNzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRWRCUVVjc1JVRkJSU3hEUVVGRExFTkJRVU03V1VGRGRrSXNSVUZCUlN4SFFVRkhMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeEhRVUZITEVsQlFVa3NRMEZCUXl4RFFVRkRPMWxCUlROQ0xFbEJRVWtzU1VGQlNTeEhRVUZITEZkQlFWY3NSVUZCUlR0blFrRkRjRUlzVjBGQlZ5eEhRVUZITEVsQlFVa3NRMEZCUXp0blFrRkRia0lzVTBGQlV5eEhRVUZITEVWQlFVVXNRMEZCUXp0aFFVTnNRanRaUVVWRUxFbEJRVWtzU1VGQlNTeEhRVUZITEZkQlFWY3NSVUZCUlR0blFrRkRjRUlzVjBGQlZ5eEhRVUZITEVsQlFVa3NRMEZCUXp0blFrRkRia0lzVTBGQlV5eEhRVUZITEVWQlFVVXNRMEZCUXp0aFFVTnNRanRaUVVWRUxFbEJRVWtzU1VGQlNTeEhRVUZITEVsQlFVa3NSVUZCUlR0blFrRkRZaXhKUVVGSkxFZEJRVWNzUlVGQlJTeERRVUZETzJkQ1FVTldMRVZCUVVVc1IwRkJSeXhGUVVGRkxFTkJRVU03WjBKQlExSXNTVUZCU1N4SFFVRkhMRWxCUVVrc1EwRkJRenRuUWtGRFdpeEpRVUZKTEVkQlFVY3NRMEZCUXl4RFFVRkRPMkZCUTFvN2FVSkJRVTA3WjBKQlEwZ3NTMEZCU3l4SFFVRkhMRVZCUVVVc1EwRkJRenRuUWtGRFdDeEZRVUZGTEVkQlFVY3NSVUZCUlN4RFFVRkRPMmRDUVVOU0xFbEJRVWtzUjBGQlJ5eEpRVUZKTEVOQlFVTTdaMEpCUTFvc1NVRkJTU3hIUVVGSExFTkJRVU1zUTBGQlF6dGhRVU5hTzFsQlJVUXNTVUZCU1N4blFrRkJaMElzUlVGQlJTeEhRVUZITEVkQlFVY3NSVUZCUlR0blFrRkRNVUlzVFVGQlRUdGhRVU5VTzFOQlEwbzdVVUZGUkN4SlFVRkpMRU5CUVVNc1NVRkJTU3hGUVVGRkxGTkJRVk1zUTBGQlF5eERRVUZETzBsQlF6RkNMRU5CUVVNN1NVRkpSQ3hUUVVGVExFbEJRVWtzUTBGQlF5eEpRVUZKTEVWQlFVVXNVMEZCVXp0UlFVTjZRaXhKUVVGSkxFZEJRVWNzUlVGQlJTeERRVUZETzFGQlExWXNWVUZCVlN4SFFVRkhMRU5CUVVNc1EwRkJRenRSUVVObUxGZEJRVmNzUjBGQlJ5eERRVUZETEVOQlFVTTdVVUZEYUVJc1lVRkJZU3hIUVVGSExFMUJRVTBzUTBGQlF6dFJRVVYyUWl4TFFVRkxMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRTFCUVUwc1JVRkJSU3hEUVVGRExFVkJRVVVzUlVGQlJUdFpRVU5zUXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEYUVJc1VVRkJVU3hEUVVGRExFTkJRVU1zUlVGQlJTeFRRVUZUTEVOQlFVTXNRMEZCUXp0VFFVTXhRanRSUVVWRUxFOUJRVThzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4alFVRmpMRVZCUVVVc1IwRkJSeXhoUVVGaExFTkJRVU1zUTBGQlF6dEpRVU4wUkN4RFFVRkRPMGxCUjBRc1UwRkJVeXhSUVVGUkxFTkJRVU1zU1VGQlNTeEZRVUZGTEZOQlFWTTdVVUZITjBJc1NVRkJTU3hOUVVGTkxFZEJRVWNzVTBGQlV5eERRVUZETzFGQlJYWkNMRXRCUVVzc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1RVRkJUU3hGUVVGRkxFTkJRVU1zUlVGQlJTeEZRVUZGTzFsQlEyeERMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNWVUZCVlN4SlFVRkpMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRXRCUVVzc1IwRkJSeXhKUVVGSkxFTkJRVU1zUzBGQlN5eEhRVUZITEdOQlFXTXNRMEZCUXl4UFFVRlBMRWRCUVVjc1UwRkJVeXhEUVVGRExFbEJRVWtzWTBGQll5eERRVUZETEdGQlFXRXNSVUZCUlR0blFrRkRkRW9zVFVGQlRTeEhRVUZITEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRuUWtGRGFrSXNUVUZCVFR0aFFVTlVPMU5CUTBvN1VVRkZSQ3hKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMUZCUldoQ0xFbEJRVWtzVFVGQlRTeExRVUZMTEZOQlFWTXNSVUZCUlR0WlFVTjBRaXhKUVVGSkxFTkJRVU1zUTBGQlF5eEhRVUZITEUxQlFVMHNRMEZCUXl4RFFVRkRMRWRCUVVjc1RVRkJUU3hEUVVGRExFdEJRVXNzUjBGQlJ5eGpRVUZqTEVOQlFVTXNUMEZCVHl4RFFVRkRPMWxCUXpGRUxFbEJRVWtzUTBGQlF5eERRVUZETEVkQlFVY3NUVUZCVFN4RFFVRkRMRTFCUVUwc1EwRkJRenRaUVVOMlFpeEpRVUZKTEVOQlFVTXNWVUZCVlN4SFFVRkhMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU03V1VGRE9VSXNTVUZCU1N4RFFVRkRMRTFCUVUwc1IwRkJSeXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETzFsQlEzSkNMRTFCUVUwc1EwRkJReXhWUVVGVkxFbEJRVWtzU1VGQlNTeERRVUZETEUxQlFVMHNSMEZCUnl4alFVRmpMRU5CUVVNc1QwRkJUeXhEUVVGRE8xbEJRekZFTEUxQlFVMHNRMEZCUXl4TlFVRk5MRWxCUVVrc1NVRkJTU3hEUVVGRExFMUJRVTBzUjBGQlJ5eGpRVUZqTEVOQlFVTXNUMEZCVHl4RFFVRkRPMU5CUTNwRU8yRkJRVTA3V1VGRFNDeEpRVUZKTEVOQlFVTXNRMEZCUXl4SFFVRkhMR0ZCUVdFc1EwRkJRenRaUVVOMlFpeGhRVUZoTEVsQlFVa3NTVUZCU1N4RFFVRkRMRTFCUVUwc1IwRkJSeXhqUVVGakxFTkJRVU1zVDBGQlR5eERRVUZETzFsQlEzUkVMRWxCUVVrc1EwRkJReXhEUVVGRExFZEJRVWNzVFVGQlRTeERRVUZETzFsQlEyaENMRWxCUVVrc1EwRkJReXhOUVVGTkxFZEJRVWNzU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTnlRaXhKUVVGSkxFTkJRVU1zVlVGQlZTeEhRVUZITEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNN1UwRkRha003VVVGRlJDeEpRVUZKTEVsQlFVa3NRMEZCUXl4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFMUJRVTBzUjBGQlJ5eFhRVUZYTEVkQlFVY3NRMEZCUXl4alFVRmpMRU5CUVVNc1lVRkJZVHRaUVVGRkxGZEJRVmNzUjBGQlJ5eEpRVUZKTEVOQlFVTXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhOUVVGTkxFZEJRVWNzVFVGQlRTeERRVUZETzFGQlEzQklMRWxCUVVrc1NVRkJTU3hEUVVGRExFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNTMEZCU3l4SFFVRkhMRlZCUVZVc1IwRkJSeXhEUVVGRExHTkJRV01zUTBGQlF5eGhRVUZoTzFsQlFVVXNWVUZCVlN4SFFVRkhMRWxCUVVrc1EwRkJReXhEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEV0QlFVc3NSMEZCUnl4TlFVRk5MRU5CUVVNN1NVRkRjRWdzUTBGQlF6dEpRVUZCTEVOQlFVTTdTVUZGUml4VFFVRlRMR2RDUVVGblFpeERRVUZETEVsQlFVazdVVUZETVVJc1NVRkJTU3hMUVVGTExFZEJRVWNzUTBGQlF5eERRVUZETzFGQlEyUXNTVUZCU1N4RFFVRkRMRTlCUVU4c1EwRkJReXhWUVVGVkxFTkJRVU1zU1VGQlNTeFBRVUZQTEV0QlFVc3NTVUZCU1N4RFFVRkRMRU5CUVVNc1MwRkJTeXhIUVVGSExHTkJRV01zUTBGQlF5eFBRVUZQTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOcVJpeFBRVUZQTEV0QlFVc3NRMEZCUXp0SlFVTnFRaXhEUVVGRE8wbEJSVVFzVTBGQlV5eGpRVUZqTzFGQlEyNUNMRTlCUVU4c1EwRkJReXhWUVVGVkxFZEJRVWNzVjBGQlZ5eERRVUZETEVOQlFVTTdTVUZEZEVNc1EwRkJRenRCUVVOTUxFTkJRVU03UVVFeFVFUXNiME5CTUZCRE8wRkJUVVFzVTBGQlowSXNZMEZCWXl4RFFVRkRMRXRCUVVzc1JVRkJSU3hMUVVGTE8wbEJRM1pETEVsQlFVa3NTMEZCU3l4SFFVRkhMRVZCUVVVc1EwRkJRenRKUVVObUxFbEJRVWtzU1VGQlNTeEhRVUZITEVWQlFVVXNRMEZCUXp0SlFVTmtMRWxCUVVrc1RVRkJUU3hIUVVGSExFVkJRVVVzUTBGQlF6dEpRVU5vUWl4SlFVRkpMRkZCUVZFc1IwRkJSeXhEUVVGRExFTkJRVU03U1VGRmFrSXNTMEZCU3l4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEV0QlFVc3NRMEZCUXl4TlFVRk5MRVZCUVVVc1EwRkJReXhGUVVGRkxFVkJRVVU3VVVGRGJrTXNTVUZCU1N4SlFVRkpMRWRCUVVjc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlEzQkNMRWxCUVVrc1JVRkJSU3hIUVVGSExFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTTdVVUZEY2tJc1NVRkJTU3hGUVVGRkxFZEJRVWNzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXp0UlFVTnlRaXhKUVVGSkxFbEJRVWtzUTBGQlF5eEZRVUZGTEVOQlFVTXNTMEZCU3l4RFFVRkRPMWxCUTJRc1NVRkJTU3hEUVVGRExFVkJRVVVzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU03TzFsQlJYaENMRWxCUVVrc1EwRkJReXhGUVVGRkxFTkJRVU1zUzBGQlN5eERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJRenRSUVVVeFFpeEpRVUZKTEVsQlFVa3NRMEZCUXl4RlFVRkZMRU5CUVVNc1MwRkJTeXhEUVVGRE8xbEJRMlFzU1VGQlNTeERRVUZETEVWQlFVVXNRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTTdPMWxCUlhoQ0xFbEJRVWtzUTBGQlF5eEZRVUZGTEVOQlFVTXNTMEZCU3l4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF6dExRVU0zUWp0SlFVVkVMRXRCUVVzc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4TFFVRkxMRU5CUVVNc1RVRkJUU3hGUVVGRkxFTkJRVU1zUlVGQlJTeEZRVUZGTzFGQlEyNURMRWxCUVVrc1NVRkJTU3hIUVVGSExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTndRaXhKUVVGSkxFdEJRVXNzUTBGQlF5eEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRPMWxCUVVVc1UwRkJVenRSUVVOb1F5eFpRVUZaTEVOQlFVTXNTVUZCU1N4RlFVRkZMRWxCUVVrc1EwRkJReXhEUVVGRE8wdEJRelZDTzBsQlJVUXNVMEZCVXl4WlFVRlpMRU5CUVVNc1EwRkJReXhGUVVGRkxFMUJRVTA3VVVGRE0wSXNTVUZCU1N4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFdEJRVXNzUTBGQlF5eExRVUZMTEZOQlFWTTdXVUZCUlN4UFFVRlBPMUZCUTNwRExFbEJRVWtzVFVGQlRTeEZRVUZGTzFsQlExSXNVVUZCVVN4RlFVRkZMRU5CUVVNN1dVRkRXQ3hOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETEVWQlFVVXNTMEZCU3l4RlFVRkZMRVZCUVVVc1JVRkJSU3hEUVVGRExFTkJRVU03VTBGRE9VSTdVVUZEUkN4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFdEJRVXNzUTBGQlF5eEhRVUZITEZGQlFWRXNRMEZCUXp0UlFVTXhRaXhOUVVGTkxFTkJRVU1zVVVGQlVTeEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRXRCUVVzc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEYmtNc1NVRkJTU3hSUVVGUkxFZEJRVWNzU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJRenRSUVVNM1FpeEpRVUZKTEVOQlFVTXNVVUZCVVR0WlFVRkZMRTlCUVU4N1VVRkZkRUlzUzBGQlN5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1EwRkJReXhIUVVGSExGRkJRVkVzUTBGQlF5eE5RVUZOTEVWQlFVVXNRMEZCUXl4RlFVRkZMRVZCUVVVN1dVRkRkRU1zV1VGQldTeERRVUZETEZGQlFWRXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hMUVVGTExFTkJRVU1zUTBGQlF6dFRRVU53UXp0SlFVTk1MRU5CUVVNN1NVRkZSQ3hQUVVGUExFMUJRVTBzUTBGQlF6dEJRVU5zUWl4RFFVRkRPMEZCTlVORUxIZERRVFJEUXlKOSIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHBvd2VyZ3JhcGggPSByZXF1aXJlKFwiLi9wb3dlcmdyYXBoXCIpO1xudmFyIGxpbmtsZW5ndGhzXzEgPSByZXF1aXJlKFwiLi9saW5rbGVuZ3Roc1wiKTtcbnZhciBkZXNjZW50XzEgPSByZXF1aXJlKFwiLi9kZXNjZW50XCIpO1xudmFyIHJlY3RhbmdsZV8xID0gcmVxdWlyZShcIi4vcmVjdGFuZ2xlXCIpO1xudmFyIHNob3J0ZXN0cGF0aHNfMSA9IHJlcXVpcmUoXCIuL3Nob3J0ZXN0cGF0aHNcIik7XG52YXIgZ2VvbV8xID0gcmVxdWlyZShcIi4vZ2VvbVwiKTtcbnZhciBoYW5kbGVkaXNjb25uZWN0ZWRfMSA9IHJlcXVpcmUoXCIuL2hhbmRsZWRpc2Nvbm5lY3RlZFwiKTtcbnZhciBFdmVudFR5cGU7XG4oZnVuY3Rpb24gKEV2ZW50VHlwZSkge1xuICAgIEV2ZW50VHlwZVtFdmVudFR5cGVbXCJzdGFydFwiXSA9IDBdID0gXCJzdGFydFwiO1xuICAgIEV2ZW50VHlwZVtFdmVudFR5cGVbXCJ0aWNrXCJdID0gMV0gPSBcInRpY2tcIjtcbiAgICBFdmVudFR5cGVbRXZlbnRUeXBlW1wiZW5kXCJdID0gMl0gPSBcImVuZFwiO1xufSkoRXZlbnRUeXBlID0gZXhwb3J0cy5FdmVudFR5cGUgfHwgKGV4cG9ydHMuRXZlbnRUeXBlID0ge30pKTtcbjtcbmZ1bmN0aW9uIGlzR3JvdXAoZykge1xuICAgIHJldHVybiB0eXBlb2YgZy5sZWF2ZXMgIT09ICd1bmRlZmluZWQnIHx8IHR5cGVvZiBnLmdyb3VwcyAhPT0gJ3VuZGVmaW5lZCc7XG59XG52YXIgTGF5b3V0ID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBMYXlvdXQoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHRoaXMuX2NhbnZhc1NpemUgPSBbMSwgMV07XG4gICAgICAgIHRoaXMuX2xpbmtEaXN0YW5jZSA9IDIwO1xuICAgICAgICB0aGlzLl9kZWZhdWx0Tm9kZVNpemUgPSAxMDtcbiAgICAgICAgdGhpcy5fbGlua0xlbmd0aENhbGN1bGF0b3IgPSBudWxsO1xuICAgICAgICB0aGlzLl9saW5rVHlwZSA9IG51bGw7XG4gICAgICAgIHRoaXMuX2F2b2lkT3ZlcmxhcHMgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5faGFuZGxlRGlzY29ubmVjdGVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5fcnVubmluZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9ub2RlcyA9IFtdO1xuICAgICAgICB0aGlzLl9ncm91cHMgPSBbXTtcbiAgICAgICAgdGhpcy5fcm9vdEdyb3VwID0gbnVsbDtcbiAgICAgICAgdGhpcy5fbGlua3MgPSBbXTtcbiAgICAgICAgdGhpcy5fY29uc3RyYWludHMgPSBbXTtcbiAgICAgICAgdGhpcy5fZGlzdGFuY2VNYXRyaXggPSBudWxsO1xuICAgICAgICB0aGlzLl9kZXNjZW50ID0gbnVsbDtcbiAgICAgICAgdGhpcy5fZGlyZWN0ZWRMaW5rQ29uc3RyYWludHMgPSBudWxsO1xuICAgICAgICB0aGlzLl90aHJlc2hvbGQgPSAwLjAxO1xuICAgICAgICB0aGlzLl92aXNpYmlsaXR5R3JhcGggPSBudWxsO1xuICAgICAgICB0aGlzLl9ncm91cENvbXBhY3RuZXNzID0gMWUtNjtcbiAgICAgICAgdGhpcy5ldmVudCA9IG51bGw7XG4gICAgICAgIHRoaXMubGlua0FjY2Vzc29yID0ge1xuICAgICAgICAgICAgZ2V0U291cmNlSW5kZXg6IExheW91dC5nZXRTb3VyY2VJbmRleCxcbiAgICAgICAgICAgIGdldFRhcmdldEluZGV4OiBMYXlvdXQuZ2V0VGFyZ2V0SW5kZXgsXG4gICAgICAgICAgICBzZXRMZW5ndGg6IExheW91dC5zZXRMaW5rTGVuZ3RoLFxuICAgICAgICAgICAgZ2V0VHlwZTogZnVuY3Rpb24gKGwpIHsgcmV0dXJuIHR5cGVvZiBfdGhpcy5fbGlua1R5cGUgPT09IFwiZnVuY3Rpb25cIiA/IF90aGlzLl9saW5rVHlwZShsKSA6IDA7IH1cbiAgICAgICAgfTtcbiAgICB9XG4gICAgTGF5b3V0LnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uIChlLCBsaXN0ZW5lcikge1xuICAgICAgICBpZiAoIXRoaXMuZXZlbnQpXG4gICAgICAgICAgICB0aGlzLmV2ZW50ID0ge307XG4gICAgICAgIGlmICh0eXBlb2YgZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRoaXMuZXZlbnRbRXZlbnRUeXBlW2VdXSA9IGxpc3RlbmVyO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5ldmVudFtlXSA9IGxpc3RlbmVyO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS50cmlnZ2VyID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgaWYgKHRoaXMuZXZlbnQgJiYgdHlwZW9mIHRoaXMuZXZlbnRbZS50eXBlXSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRoaXMuZXZlbnRbZS50eXBlXShlKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5raWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB3aGlsZSAoIXRoaXMudGljaygpKVxuICAgICAgICAgICAgO1xuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS50aWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5fYWxwaGEgPCB0aGlzLl90aHJlc2hvbGQpIHtcbiAgICAgICAgICAgIHRoaXMuX3J1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMudHJpZ2dlcih7IHR5cGU6IEV2ZW50VHlwZS5lbmQsIGFscGhhOiB0aGlzLl9hbHBoYSA9IDAsIHN0cmVzczogdGhpcy5fbGFzdFN0cmVzcyB9KTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBuID0gdGhpcy5fbm9kZXMubGVuZ3RoLCBtID0gdGhpcy5fbGlua3MubGVuZ3RoO1xuICAgICAgICB2YXIgbywgaTtcbiAgICAgICAgdGhpcy5fZGVzY2VudC5sb2Nrcy5jbGVhcigpO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICBvID0gdGhpcy5fbm9kZXNbaV07XG4gICAgICAgICAgICBpZiAoby5maXhlZCkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygby5weCA9PT0gJ3VuZGVmaW5lZCcgfHwgdHlwZW9mIG8ucHkgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgIG8ucHggPSBvLng7XG4gICAgICAgICAgICAgICAgICAgIG8ucHkgPSBvLnk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBwID0gW28ucHgsIG8ucHldO1xuICAgICAgICAgICAgICAgIHRoaXMuX2Rlc2NlbnQubG9ja3MuYWRkKGksIHApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhciBzMSA9IHRoaXMuX2Rlc2NlbnQucnVuZ2VLdXR0YSgpO1xuICAgICAgICBpZiAoczEgPT09IDApIHtcbiAgICAgICAgICAgIHRoaXMuX2FscGhhID0gMDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0eXBlb2YgdGhpcy5fbGFzdFN0cmVzcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRoaXMuX2FscGhhID0gczE7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fbGFzdFN0cmVzcyA9IHMxO1xuICAgICAgICB0aGlzLnVwZGF0ZU5vZGVQb3NpdGlvbnMoKTtcbiAgICAgICAgdGhpcy50cmlnZ2VyKHsgdHlwZTogRXZlbnRUeXBlLnRpY2ssIGFscGhhOiB0aGlzLl9hbHBoYSwgc3RyZXNzOiB0aGlzLl9sYXN0U3RyZXNzIH0pO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcbiAgICBMYXlvdXQucHJvdG90eXBlLnVwZGF0ZU5vZGVQb3NpdGlvbnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB4ID0gdGhpcy5fZGVzY2VudC54WzBdLCB5ID0gdGhpcy5fZGVzY2VudC54WzFdO1xuICAgICAgICB2YXIgbywgaSA9IHRoaXMuX25vZGVzLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgbyA9IHRoaXMuX25vZGVzW2ldO1xuICAgICAgICAgICAgby54ID0geFtpXTtcbiAgICAgICAgICAgIG8ueSA9IHlbaV07XG4gICAgICAgIH1cbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUubm9kZXMgPSBmdW5jdGlvbiAodikge1xuICAgICAgICBpZiAoIXYpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9ub2Rlcy5sZW5ndGggPT09IDAgJiYgdGhpcy5fbGlua3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHZhciBuID0gMDtcbiAgICAgICAgICAgICAgICB0aGlzLl9saW5rcy5mb3JFYWNoKGZ1bmN0aW9uIChsKSB7XG4gICAgICAgICAgICAgICAgICAgIG4gPSBNYXRoLm1heChuLCBsLnNvdXJjZSwgbC50YXJnZXQpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuX25vZGVzID0gbmV3IEFycmF5KCsrbik7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbm9kZXNbaV0gPSB7fTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbm9kZXM7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fbm9kZXMgPSB2O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUuZ3JvdXBzID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgaWYgKCF4KVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2dyb3VwcztcbiAgICAgICAgdGhpcy5fZ3JvdXBzID0geDtcbiAgICAgICAgdGhpcy5fcm9vdEdyb3VwID0ge307XG4gICAgICAgIHRoaXMuX2dyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uIChnKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGcucGFkZGluZyA9PT0gXCJ1bmRlZmluZWRcIilcbiAgICAgICAgICAgICAgICBnLnBhZGRpbmcgPSAxO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBnLmxlYXZlcyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgICAgIGcubGVhdmVzLmZvckVhY2goZnVuY3Rpb24gKHYsIGkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2ID09PSAnbnVtYmVyJylcbiAgICAgICAgICAgICAgICAgICAgICAgIChnLmxlYXZlc1tpXSA9IF90aGlzLl9ub2Rlc1t2XSkucGFyZW50ID0gZztcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlb2YgZy5ncm91cHMgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgICAgICBnLmdyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uIChnaSwgaSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGdpID09PSAnbnVtYmVyJylcbiAgICAgICAgICAgICAgICAgICAgICAgIChnLmdyb3Vwc1tpXSA9IF90aGlzLl9ncm91cHNbZ2ldKS5wYXJlbnQgPSBnO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5fcm9vdEdyb3VwLmxlYXZlcyA9IHRoaXMuX25vZGVzLmZpbHRlcihmdW5jdGlvbiAodikgeyByZXR1cm4gdHlwZW9mIHYucGFyZW50ID09PSAndW5kZWZpbmVkJzsgfSk7XG4gICAgICAgIHRoaXMuX3Jvb3RHcm91cC5ncm91cHMgPSB0aGlzLl9ncm91cHMuZmlsdGVyKGZ1bmN0aW9uIChnKSB7IHJldHVybiB0eXBlb2YgZy5wYXJlbnQgPT09ICd1bmRlZmluZWQnOyB9KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBMYXlvdXQucHJvdG90eXBlLnBvd2VyR3JhcGhHcm91cHMgPSBmdW5jdGlvbiAoZikge1xuICAgICAgICB2YXIgZyA9IHBvd2VyZ3JhcGguZ2V0R3JvdXBzKHRoaXMuX25vZGVzLCB0aGlzLl9saW5rcywgdGhpcy5saW5rQWNjZXNzb3IsIHRoaXMuX3Jvb3RHcm91cCk7XG4gICAgICAgIHRoaXMuZ3JvdXBzKGcuZ3JvdXBzKTtcbiAgICAgICAgZihnKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBMYXlvdXQucHJvdG90eXBlLmF2b2lkT3ZlcmxhcHMgPSBmdW5jdGlvbiAodikge1xuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fYXZvaWRPdmVybGFwcztcbiAgICAgICAgdGhpcy5fYXZvaWRPdmVybGFwcyA9IHY7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5oYW5kbGVEaXNjb25uZWN0ZWQgPSBmdW5jdGlvbiAodikge1xuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5faGFuZGxlRGlzY29ubmVjdGVkO1xuICAgICAgICB0aGlzLl9oYW5kbGVEaXNjb25uZWN0ZWQgPSB2O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUuZmxvd0xheW91dCA9IGZ1bmN0aW9uIChheGlzLCBtaW5TZXBhcmF0aW9uKSB7XG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aClcbiAgICAgICAgICAgIGF4aXMgPSAneSc7XG4gICAgICAgIHRoaXMuX2RpcmVjdGVkTGlua0NvbnN0cmFpbnRzID0ge1xuICAgICAgICAgICAgYXhpczogYXhpcyxcbiAgICAgICAgICAgIGdldE1pblNlcGFyYXRpb246IHR5cGVvZiBtaW5TZXBhcmF0aW9uID09PSAnbnVtYmVyJyA/IGZ1bmN0aW9uICgpIHsgcmV0dXJuIG1pblNlcGFyYXRpb247IH0gOiBtaW5TZXBhcmF0aW9uXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5saW5rcyA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aClcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9saW5rcztcbiAgICAgICAgdGhpcy5fbGlua3MgPSB4O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUuY29uc3RyYWludHMgPSBmdW5jdGlvbiAoYykge1xuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY29uc3RyYWludHM7XG4gICAgICAgIHRoaXMuX2NvbnN0cmFpbnRzID0gYztcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBMYXlvdXQucHJvdG90eXBlLmRpc3RhbmNlTWF0cml4ID0gZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2Rpc3RhbmNlTWF0cml4O1xuICAgICAgICB0aGlzLl9kaXN0YW5jZU1hdHJpeCA9IGQ7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5zaXplID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgaWYgKCF4KVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2NhbnZhc1NpemU7XG4gICAgICAgIHRoaXMuX2NhbnZhc1NpemUgPSB4O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUuZGVmYXVsdE5vZGVTaXplID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgaWYgKCF4KVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2RlZmF1bHROb2RlU2l6ZTtcbiAgICAgICAgdGhpcy5fZGVmYXVsdE5vZGVTaXplID0geDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBMYXlvdXQucHJvdG90eXBlLmdyb3VwQ29tcGFjdG5lc3MgPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICBpZiAoIXgpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZ3JvdXBDb21wYWN0bmVzcztcbiAgICAgICAgdGhpcy5fZ3JvdXBDb21wYWN0bmVzcyA9IHg7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5saW5rRGlzdGFuY2UgPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICBpZiAoIXgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9saW5rRGlzdGFuY2U7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fbGlua0Rpc3RhbmNlID0gdHlwZW9mIHggPT09IFwiZnVuY3Rpb25cIiA/IHggOiAreDtcbiAgICAgICAgdGhpcy5fbGlua0xlbmd0aENhbGN1bGF0b3IgPSBudWxsO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUubGlua1R5cGUgPSBmdW5jdGlvbiAoZikge1xuICAgICAgICB0aGlzLl9saW5rVHlwZSA9IGY7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5jb252ZXJnZW5jZVRocmVzaG9sZCA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIGlmICgheClcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl90aHJlc2hvbGQ7XG4gICAgICAgIHRoaXMuX3RocmVzaG9sZCA9IHR5cGVvZiB4ID09PSBcImZ1bmN0aW9uXCIgPyB4IDogK3g7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5hbHBoYSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aClcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9hbHBoYTtcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB4ID0gK3g7XG4gICAgICAgICAgICBpZiAodGhpcy5fYWxwaGEpIHtcbiAgICAgICAgICAgICAgICBpZiAoeCA+IDApXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2FscGhhID0geDtcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2FscGhhID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHggPiAwKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9ydW5uaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3J1bm5pbmcgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXIoeyB0eXBlOiBFdmVudFR5cGUuc3RhcnQsIGFscGhhOiB0aGlzLl9hbHBoYSA9IHggfSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMua2ljaygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBMYXlvdXQucHJvdG90eXBlLmdldExpbmtMZW5ndGggPSBmdW5jdGlvbiAobGluaykge1xuICAgICAgICByZXR1cm4gdHlwZW9mIHRoaXMuX2xpbmtEaXN0YW5jZSA9PT0gXCJmdW5jdGlvblwiID8gKyh0aGlzLl9saW5rRGlzdGFuY2UobGluaykpIDogdGhpcy5fbGlua0Rpc3RhbmNlO1xuICAgIH07XG4gICAgTGF5b3V0LnNldExpbmtMZW5ndGggPSBmdW5jdGlvbiAobGluaywgbGVuZ3RoKSB7XG4gICAgICAgIGxpbmsubGVuZ3RoID0gbGVuZ3RoO1xuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5nZXRMaW5rVHlwZSA9IGZ1bmN0aW9uIChsaW5rKSB7XG4gICAgICAgIHJldHVybiB0eXBlb2YgdGhpcy5fbGlua1R5cGUgPT09IFwiZnVuY3Rpb25cIiA/IHRoaXMuX2xpbmtUeXBlKGxpbmspIDogMDtcbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUuc3ltbWV0cmljRGlmZkxpbmtMZW5ndGhzID0gZnVuY3Rpb24gKGlkZWFsTGVuZ3RoLCB3KSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIGlmICh3ID09PSB2b2lkIDApIHsgdyA9IDE7IH1cbiAgICAgICAgdGhpcy5saW5rRGlzdGFuY2UoZnVuY3Rpb24gKGwpIHsgcmV0dXJuIGlkZWFsTGVuZ3RoICogbC5sZW5ndGg7IH0pO1xuICAgICAgICB0aGlzLl9saW5rTGVuZ3RoQ2FsY3VsYXRvciA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIGxpbmtsZW5ndGhzXzEuc3ltbWV0cmljRGlmZkxpbmtMZW5ndGhzKF90aGlzLl9saW5rcywgX3RoaXMubGlua0FjY2Vzc29yLCB3KTsgfTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBMYXlvdXQucHJvdG90eXBlLmphY2NhcmRMaW5rTGVuZ3RocyA9IGZ1bmN0aW9uIChpZGVhbExlbmd0aCwgdykge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICBpZiAodyA9PT0gdm9pZCAwKSB7IHcgPSAxOyB9XG4gICAgICAgIHRoaXMubGlua0Rpc3RhbmNlKGZ1bmN0aW9uIChsKSB7IHJldHVybiBpZGVhbExlbmd0aCAqIGwubGVuZ3RoOyB9KTtcbiAgICAgICAgdGhpcy5fbGlua0xlbmd0aENhbGN1bGF0b3IgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBsaW5rbGVuZ3Roc18xLmphY2NhcmRMaW5rTGVuZ3RocyhfdGhpcy5fbGlua3MsIF90aGlzLmxpbmtBY2Nlc3Nvciwgdyk7IH07XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uIChpbml0aWFsVW5jb25zdHJhaW5lZEl0ZXJhdGlvbnMsIGluaXRpYWxVc2VyQ29uc3RyYWludEl0ZXJhdGlvbnMsIGluaXRpYWxBbGxDb25zdHJhaW50c0l0ZXJhdGlvbnMsIGdyaWRTbmFwSXRlcmF0aW9ucywga2VlcFJ1bm5pbmcsIGNlbnRlckdyYXBoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIGlmIChpbml0aWFsVW5jb25zdHJhaW5lZEl0ZXJhdGlvbnMgPT09IHZvaWQgMCkgeyBpbml0aWFsVW5jb25zdHJhaW5lZEl0ZXJhdGlvbnMgPSAwOyB9XG4gICAgICAgIGlmIChpbml0aWFsVXNlckNvbnN0cmFpbnRJdGVyYXRpb25zID09PSB2b2lkIDApIHsgaW5pdGlhbFVzZXJDb25zdHJhaW50SXRlcmF0aW9ucyA9IDA7IH1cbiAgICAgICAgaWYgKGluaXRpYWxBbGxDb25zdHJhaW50c0l0ZXJhdGlvbnMgPT09IHZvaWQgMCkgeyBpbml0aWFsQWxsQ29uc3RyYWludHNJdGVyYXRpb25zID0gMDsgfVxuICAgICAgICBpZiAoZ3JpZFNuYXBJdGVyYXRpb25zID09PSB2b2lkIDApIHsgZ3JpZFNuYXBJdGVyYXRpb25zID0gMDsgfVxuICAgICAgICBpZiAoa2VlcFJ1bm5pbmcgPT09IHZvaWQgMCkgeyBrZWVwUnVubmluZyA9IHRydWU7IH1cbiAgICAgICAgaWYgKGNlbnRlckdyYXBoID09PSB2b2lkIDApIHsgY2VudGVyR3JhcGggPSB0cnVlOyB9XG4gICAgICAgIHZhciBpLCBqLCBuID0gdGhpcy5ub2RlcygpLmxlbmd0aCwgTiA9IG4gKyAyICogdGhpcy5fZ3JvdXBzLmxlbmd0aCwgbSA9IHRoaXMuX2xpbmtzLmxlbmd0aCwgdyA9IHRoaXMuX2NhbnZhc1NpemVbMF0sIGggPSB0aGlzLl9jYW52YXNTaXplWzFdO1xuICAgICAgICB2YXIgeCA9IG5ldyBBcnJheShOKSwgeSA9IG5ldyBBcnJheShOKTtcbiAgICAgICAgdmFyIEcgPSBudWxsO1xuICAgICAgICB2YXIgYW8gPSB0aGlzLl9hdm9pZE92ZXJsYXBzO1xuICAgICAgICB0aGlzLl9ub2Rlcy5mb3JFYWNoKGZ1bmN0aW9uICh2LCBpKSB7XG4gICAgICAgICAgICB2LmluZGV4ID0gaTtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygdi54ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHYueCA9IHcgLyAyLCB2LnkgPSBoIC8gMjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHhbaV0gPSB2LngsIHlbaV0gPSB2Lnk7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAodGhpcy5fbGlua0xlbmd0aENhbGN1bGF0b3IpXG4gICAgICAgICAgICB0aGlzLl9saW5rTGVuZ3RoQ2FsY3VsYXRvcigpO1xuICAgICAgICB2YXIgZGlzdGFuY2VzO1xuICAgICAgICBpZiAodGhpcy5fZGlzdGFuY2VNYXRyaXgpIHtcbiAgICAgICAgICAgIGRpc3RhbmNlcyA9IHRoaXMuX2Rpc3RhbmNlTWF0cml4O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZGlzdGFuY2VzID0gKG5ldyBzaG9ydGVzdHBhdGhzXzEuQ2FsY3VsYXRvcihOLCB0aGlzLl9saW5rcywgTGF5b3V0LmdldFNvdXJjZUluZGV4LCBMYXlvdXQuZ2V0VGFyZ2V0SW5kZXgsIGZ1bmN0aW9uIChsKSB7IHJldHVybiBfdGhpcy5nZXRMaW5rTGVuZ3RoKGwpOyB9KSkuRGlzdGFuY2VNYXRyaXgoKTtcbiAgICAgICAgICAgIEcgPSBkZXNjZW50XzEuRGVzY2VudC5jcmVhdGVTcXVhcmVNYXRyaXgoTiwgZnVuY3Rpb24gKCkgeyByZXR1cm4gMjsgfSk7XG4gICAgICAgICAgICB0aGlzLl9saW5rcy5mb3JFYWNoKGZ1bmN0aW9uIChsKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBsLnNvdXJjZSA9PSBcIm51bWJlclwiKVxuICAgICAgICAgICAgICAgICAgICBsLnNvdXJjZSA9IF90aGlzLl9ub2Rlc1tsLnNvdXJjZV07XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBsLnRhcmdldCA9PSBcIm51bWJlclwiKVxuICAgICAgICAgICAgICAgICAgICBsLnRhcmdldCA9IF90aGlzLl9ub2Rlc1tsLnRhcmdldF07XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMuX2xpbmtzLmZvckVhY2goZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgdSA9IExheW91dC5nZXRTb3VyY2VJbmRleChlKSwgdiA9IExheW91dC5nZXRUYXJnZXRJbmRleChlKTtcbiAgICAgICAgICAgICAgICBHW3VdW3ZdID0gR1t2XVt1XSA9IGUud2VpZ2h0IHx8IDE7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgRCA9IGRlc2NlbnRfMS5EZXNjZW50LmNyZWF0ZVNxdWFyZU1hdHJpeChOLCBmdW5jdGlvbiAoaSwgaikge1xuICAgICAgICAgICAgcmV0dXJuIGRpc3RhbmNlc1tpXVtqXTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmICh0aGlzLl9yb290R3JvdXAgJiYgdHlwZW9mIHRoaXMuX3Jvb3RHcm91cC5ncm91cHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB2YXIgaSA9IG47XG4gICAgICAgICAgICB2YXIgYWRkQXR0cmFjdGlvbiA9IGZ1bmN0aW9uIChpLCBqLCBzdHJlbmd0aCwgaWRlYWxEaXN0YW5jZSkge1xuICAgICAgICAgICAgICAgIEdbaV1bal0gPSBHW2pdW2ldID0gc3RyZW5ndGg7XG4gICAgICAgICAgICAgICAgRFtpXVtqXSA9IERbal1baV0gPSBpZGVhbERpc3RhbmNlO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHRoaXMuX2dyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uIChnKSB7XG4gICAgICAgICAgICAgICAgYWRkQXR0cmFjdGlvbihpLCBpICsgMSwgX3RoaXMuX2dyb3VwQ29tcGFjdG5lc3MsIDAuMSk7XG4gICAgICAgICAgICAgICAgeFtpXSA9IDAsIHlbaSsrXSA9IDA7XG4gICAgICAgICAgICAgICAgeFtpXSA9IDAsIHlbaSsrXSA9IDA7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICB0aGlzLl9yb290R3JvdXAgPSB7IGxlYXZlczogdGhpcy5fbm9kZXMsIGdyb3VwczogW10gfTtcbiAgICAgICAgdmFyIGN1ckNvbnN0cmFpbnRzID0gdGhpcy5fY29uc3RyYWludHMgfHwgW107XG4gICAgICAgIGlmICh0aGlzLl9kaXJlY3RlZExpbmtDb25zdHJhaW50cykge1xuICAgICAgICAgICAgdGhpcy5saW5rQWNjZXNzb3IuZ2V0TWluU2VwYXJhdGlvbiA9IHRoaXMuX2RpcmVjdGVkTGlua0NvbnN0cmFpbnRzLmdldE1pblNlcGFyYXRpb247XG4gICAgICAgICAgICBjdXJDb25zdHJhaW50cyA9IGN1ckNvbnN0cmFpbnRzLmNvbmNhdChsaW5rbGVuZ3Roc18xLmdlbmVyYXRlRGlyZWN0ZWRFZGdlQ29uc3RyYWludHMobiwgdGhpcy5fbGlua3MsIHRoaXMuX2RpcmVjdGVkTGlua0NvbnN0cmFpbnRzLmF4aXMsICh0aGlzLmxpbmtBY2Nlc3NvcikpKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmF2b2lkT3ZlcmxhcHMoZmFsc2UpO1xuICAgICAgICB0aGlzLl9kZXNjZW50ID0gbmV3IGRlc2NlbnRfMS5EZXNjZW50KFt4LCB5XSwgRCk7XG4gICAgICAgIHRoaXMuX2Rlc2NlbnQubG9ja3MuY2xlYXIoKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgIHZhciBvID0gdGhpcy5fbm9kZXNbaV07XG4gICAgICAgICAgICBpZiAoby5maXhlZCkge1xuICAgICAgICAgICAgICAgIG8ucHggPSBvLng7XG4gICAgICAgICAgICAgICAgby5weSA9IG8ueTtcbiAgICAgICAgICAgICAgICB2YXIgcCA9IFtvLngsIG8ueV07XG4gICAgICAgICAgICAgICAgdGhpcy5fZGVzY2VudC5sb2Nrcy5hZGQoaSwgcCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fZGVzY2VudC50aHJlc2hvbGQgPSB0aGlzLl90aHJlc2hvbGQ7XG4gICAgICAgIHRoaXMuaW5pdGlhbExheW91dChpbml0aWFsVW5jb25zdHJhaW5lZEl0ZXJhdGlvbnMsIHgsIHkpO1xuICAgICAgICBpZiAoY3VyQ29uc3RyYWludHMubGVuZ3RoID4gMClcbiAgICAgICAgICAgIHRoaXMuX2Rlc2NlbnQucHJvamVjdCA9IG5ldyByZWN0YW5nbGVfMS5Qcm9qZWN0aW9uKHRoaXMuX25vZGVzLCB0aGlzLl9ncm91cHMsIHRoaXMuX3Jvb3RHcm91cCwgY3VyQ29uc3RyYWludHMpLnByb2plY3RGdW5jdGlvbnMoKTtcbiAgICAgICAgdGhpcy5fZGVzY2VudC5ydW4oaW5pdGlhbFVzZXJDb25zdHJhaW50SXRlcmF0aW9ucyk7XG4gICAgICAgIHRoaXMuc2VwYXJhdGVPdmVybGFwcGluZ0NvbXBvbmVudHModywgaCwgY2VudGVyR3JhcGgpO1xuICAgICAgICB0aGlzLmF2b2lkT3ZlcmxhcHMoYW8pO1xuICAgICAgICBpZiAoYW8pIHtcbiAgICAgICAgICAgIHRoaXMuX25vZGVzLmZvckVhY2goZnVuY3Rpb24gKHYsIGkpIHsgdi54ID0geFtpXSwgdi55ID0geVtpXTsgfSk7XG4gICAgICAgICAgICB0aGlzLl9kZXNjZW50LnByb2plY3QgPSBuZXcgcmVjdGFuZ2xlXzEuUHJvamVjdGlvbih0aGlzLl9ub2RlcywgdGhpcy5fZ3JvdXBzLCB0aGlzLl9yb290R3JvdXAsIGN1ckNvbnN0cmFpbnRzLCB0cnVlKS5wcm9qZWN0RnVuY3Rpb25zKCk7XG4gICAgICAgICAgICB0aGlzLl9ub2Rlcy5mb3JFYWNoKGZ1bmN0aW9uICh2LCBpKSB7IHhbaV0gPSB2LngsIHlbaV0gPSB2Lnk7IH0pO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2Rlc2NlbnQuRyA9IEc7XG4gICAgICAgIHRoaXMuX2Rlc2NlbnQucnVuKGluaXRpYWxBbGxDb25zdHJhaW50c0l0ZXJhdGlvbnMpO1xuICAgICAgICBpZiAoZ3JpZFNuYXBJdGVyYXRpb25zKSB7XG4gICAgICAgICAgICB0aGlzLl9kZXNjZW50LnNuYXBTdHJlbmd0aCA9IDEwMDA7XG4gICAgICAgICAgICB0aGlzLl9kZXNjZW50LnNuYXBHcmlkU2l6ZSA9IHRoaXMuX25vZGVzWzBdLndpZHRoO1xuICAgICAgICAgICAgdGhpcy5fZGVzY2VudC5udW1HcmlkU25hcE5vZGVzID0gbjtcbiAgICAgICAgICAgIHRoaXMuX2Rlc2NlbnQuc2NhbGVTbmFwQnlNYXhIID0gbiAhPSBOO1xuICAgICAgICAgICAgdmFyIEcwID0gZGVzY2VudF8xLkRlc2NlbnQuY3JlYXRlU3F1YXJlTWF0cml4KE4sIGZ1bmN0aW9uIChpLCBqKSB7XG4gICAgICAgICAgICAgICAgaWYgKGkgPj0gbiB8fCBqID49IG4pXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBHW2ldW2pdO1xuICAgICAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLl9kZXNjZW50LkcgPSBHMDtcbiAgICAgICAgICAgIHRoaXMuX2Rlc2NlbnQucnVuKGdyaWRTbmFwSXRlcmF0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy51cGRhdGVOb2RlUG9zaXRpb25zKCk7XG4gICAgICAgIHRoaXMuc2VwYXJhdGVPdmVybGFwcGluZ0NvbXBvbmVudHModywgaCwgY2VudGVyR3JhcGgpO1xuICAgICAgICByZXR1cm4ga2VlcFJ1bm5pbmcgPyB0aGlzLnJlc3VtZSgpIDogdGhpcztcbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUuaW5pdGlhbExheW91dCA9IGZ1bmN0aW9uIChpdGVyYXRpb25zLCB4LCB5KSB7XG4gICAgICAgIGlmICh0aGlzLl9ncm91cHMubGVuZ3RoID4gMCAmJiBpdGVyYXRpb25zID4gMCkge1xuICAgICAgICAgICAgdmFyIG4gPSB0aGlzLl9ub2Rlcy5sZW5ndGg7XG4gICAgICAgICAgICB2YXIgZWRnZXMgPSB0aGlzLl9saW5rcy5tYXAoZnVuY3Rpb24gKGUpIHsgcmV0dXJuICh7IHNvdXJjZTogZS5zb3VyY2UuaW5kZXgsIHRhcmdldDogZS50YXJnZXQuaW5kZXggfSk7IH0pO1xuICAgICAgICAgICAgdmFyIHZzID0gdGhpcy5fbm9kZXMubWFwKGZ1bmN0aW9uICh2KSB7IHJldHVybiAoeyBpbmRleDogdi5pbmRleCB9KTsgfSk7XG4gICAgICAgICAgICB0aGlzLl9ncm91cHMuZm9yRWFjaChmdW5jdGlvbiAoZywgaSkge1xuICAgICAgICAgICAgICAgIHZzLnB1c2goeyBpbmRleDogZy5pbmRleCA9IG4gKyBpIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLl9ncm91cHMuZm9yRWFjaChmdW5jdGlvbiAoZywgaSkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZy5sZWF2ZXMgIT09ICd1bmRlZmluZWQnKVxuICAgICAgICAgICAgICAgICAgICBnLmxlYXZlcy5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7IHJldHVybiBlZGdlcy5wdXNoKHsgc291cmNlOiBnLmluZGV4LCB0YXJnZXQ6IHYuaW5kZXggfSk7IH0pO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZy5ncm91cHMgIT09ICd1bmRlZmluZWQnKVxuICAgICAgICAgICAgICAgICAgICBnLmdyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uIChnZykgeyByZXR1cm4gZWRnZXMucHVzaCh7IHNvdXJjZTogZy5pbmRleCwgdGFyZ2V0OiBnZy5pbmRleCB9KTsgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIG5ldyBMYXlvdXQoKVxuICAgICAgICAgICAgICAgIC5zaXplKHRoaXMuc2l6ZSgpKVxuICAgICAgICAgICAgICAgIC5ub2Rlcyh2cylcbiAgICAgICAgICAgICAgICAubGlua3MoZWRnZXMpXG4gICAgICAgICAgICAgICAgLmF2b2lkT3ZlcmxhcHMoZmFsc2UpXG4gICAgICAgICAgICAgICAgLmxpbmtEaXN0YW5jZSh0aGlzLmxpbmtEaXN0YW5jZSgpKVxuICAgICAgICAgICAgICAgIC5zeW1tZXRyaWNEaWZmTGlua0xlbmd0aHMoNSlcbiAgICAgICAgICAgICAgICAuY29udmVyZ2VuY2VUaHJlc2hvbGQoMWUtNClcbiAgICAgICAgICAgICAgICAuc3RhcnQoaXRlcmF0aW9ucywgMCwgMCwgMCwgZmFsc2UpO1xuICAgICAgICAgICAgdGhpcy5fbm9kZXMuZm9yRWFjaChmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgICAgIHhbdi5pbmRleF0gPSB2c1t2LmluZGV4XS54O1xuICAgICAgICAgICAgICAgIHlbdi5pbmRleF0gPSB2c1t2LmluZGV4XS55O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9kZXNjZW50LnJ1bihpdGVyYXRpb25zKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5zZXBhcmF0ZU92ZXJsYXBwaW5nQ29tcG9uZW50cyA9IGZ1bmN0aW9uICh3aWR0aCwgaGVpZ2h0LCBjZW50ZXJHcmFwaCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICBpZiAoY2VudGVyR3JhcGggPT09IHZvaWQgMCkgeyBjZW50ZXJHcmFwaCA9IHRydWU7IH1cbiAgICAgICAgaWYgKCF0aGlzLl9kaXN0YW5jZU1hdHJpeCAmJiB0aGlzLl9oYW5kbGVEaXNjb25uZWN0ZWQpIHtcbiAgICAgICAgICAgIHZhciB4XzEgPSB0aGlzLl9kZXNjZW50LnhbMF0sIHlfMSA9IHRoaXMuX2Rlc2NlbnQueFsxXTtcbiAgICAgICAgICAgIHRoaXMuX25vZGVzLmZvckVhY2goZnVuY3Rpb24gKHYsIGkpIHsgdi54ID0geF8xW2ldLCB2LnkgPSB5XzFbaV07IH0pO1xuICAgICAgICAgICAgdmFyIGdyYXBocyA9IGhhbmRsZWRpc2Nvbm5lY3RlZF8xLnNlcGFyYXRlR3JhcGhzKHRoaXMuX25vZGVzLCB0aGlzLl9saW5rcyk7XG4gICAgICAgICAgICBoYW5kbGVkaXNjb25uZWN0ZWRfMS5hcHBseVBhY2tpbmcoZ3JhcGhzLCB3aWR0aCwgaGVpZ2h0LCB0aGlzLl9kZWZhdWx0Tm9kZVNpemUsIDEsIGNlbnRlckdyYXBoKTtcbiAgICAgICAgICAgIHRoaXMuX25vZGVzLmZvckVhY2goZnVuY3Rpb24gKHYsIGkpIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5fZGVzY2VudC54WzBdW2ldID0gdi54LCBfdGhpcy5fZGVzY2VudC54WzFdW2ldID0gdi55O1xuICAgICAgICAgICAgICAgIGlmICh2LmJvdW5kcykge1xuICAgICAgICAgICAgICAgICAgICB2LmJvdW5kcy5zZXRYQ2VudHJlKHYueCk7XG4gICAgICAgICAgICAgICAgICAgIHYuYm91bmRzLnNldFlDZW50cmUodi55KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5yZXN1bWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFscGhhKDAuMSk7XG4gICAgfTtcbiAgICBMYXlvdXQucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFscGhhKDApO1xuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5wcmVwYXJlRWRnZVJvdXRpbmcgPSBmdW5jdGlvbiAobm9kZU1hcmdpbikge1xuICAgICAgICBpZiAobm9kZU1hcmdpbiA9PT0gdm9pZCAwKSB7IG5vZGVNYXJnaW4gPSAwOyB9XG4gICAgICAgIHRoaXMuX3Zpc2liaWxpdHlHcmFwaCA9IG5ldyBnZW9tXzEuVGFuZ2VudFZpc2liaWxpdHlHcmFwaCh0aGlzLl9ub2Rlcy5tYXAoZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgIHJldHVybiB2LmJvdW5kcy5pbmZsYXRlKC1ub2RlTWFyZ2luKS52ZXJ0aWNlcygpO1xuICAgICAgICB9KSk7XG4gICAgfTtcbiAgICBMYXlvdXQucHJvdG90eXBlLnJvdXRlRWRnZSA9IGZ1bmN0aW9uIChlZGdlLCBhaCwgZHJhdykge1xuICAgICAgICBpZiAoYWggPT09IHZvaWQgMCkgeyBhaCA9IDU7IH1cbiAgICAgICAgdmFyIGxpbmVEYXRhID0gW107XG4gICAgICAgIHZhciB2ZzIgPSBuZXcgZ2VvbV8xLlRhbmdlbnRWaXNpYmlsaXR5R3JhcGgodGhpcy5fdmlzaWJpbGl0eUdyYXBoLlAsIHsgVjogdGhpcy5fdmlzaWJpbGl0eUdyYXBoLlYsIEU6IHRoaXMuX3Zpc2liaWxpdHlHcmFwaC5FIH0pLCBwb3J0MSA9IHsgeDogZWRnZS5zb3VyY2UueCwgeTogZWRnZS5zb3VyY2UueSB9LCBwb3J0MiA9IHsgeDogZWRnZS50YXJnZXQueCwgeTogZWRnZS50YXJnZXQueSB9LCBzdGFydCA9IHZnMi5hZGRQb2ludChwb3J0MSwgZWRnZS5zb3VyY2UuaW5kZXgpLCBlbmQgPSB2ZzIuYWRkUG9pbnQocG9ydDIsIGVkZ2UudGFyZ2V0LmluZGV4KTtcbiAgICAgICAgdmcyLmFkZEVkZ2VJZlZpc2libGUocG9ydDEsIHBvcnQyLCBlZGdlLnNvdXJjZS5pbmRleCwgZWRnZS50YXJnZXQuaW5kZXgpO1xuICAgICAgICBpZiAodHlwZW9mIGRyYXcgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBkcmF3KHZnMik7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHNvdXJjZUluZCA9IGZ1bmN0aW9uIChlKSB7IHJldHVybiBlLnNvdXJjZS5pZDsgfSwgdGFyZ2V0SW5kID0gZnVuY3Rpb24gKGUpIHsgcmV0dXJuIGUudGFyZ2V0LmlkOyB9LCBsZW5ndGggPSBmdW5jdGlvbiAoZSkgeyByZXR1cm4gZS5sZW5ndGgoKTsgfSwgc3BDYWxjID0gbmV3IHNob3J0ZXN0cGF0aHNfMS5DYWxjdWxhdG9yKHZnMi5WLmxlbmd0aCwgdmcyLkUsIHNvdXJjZUluZCwgdGFyZ2V0SW5kLCBsZW5ndGgpLCBzaG9ydGVzdFBhdGggPSBzcENhbGMuUGF0aEZyb21Ob2RlVG9Ob2RlKHN0YXJ0LmlkLCBlbmQuaWQpO1xuICAgICAgICBpZiAoc2hvcnRlc3RQYXRoLmxlbmd0aCA9PT0gMSB8fCBzaG9ydGVzdFBhdGgubGVuZ3RoID09PSB2ZzIuVi5sZW5ndGgpIHtcbiAgICAgICAgICAgIHZhciByb3V0ZSA9IHJlY3RhbmdsZV8xLm1ha2VFZGdlQmV0d2VlbihlZGdlLnNvdXJjZS5pbm5lckJvdW5kcywgZWRnZS50YXJnZXQuaW5uZXJCb3VuZHMsIGFoKTtcbiAgICAgICAgICAgIGxpbmVEYXRhID0gW3JvdXRlLnNvdXJjZUludGVyc2VjdGlvbiwgcm91dGUuYXJyb3dTdGFydF07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgbiA9IHNob3J0ZXN0UGF0aC5sZW5ndGggLSAyLCBwID0gdmcyLlZbc2hvcnRlc3RQYXRoW25dXS5wLCBxID0gdmcyLlZbc2hvcnRlc3RQYXRoWzBdXS5wLCBsaW5lRGF0YSA9IFtlZGdlLnNvdXJjZS5pbm5lckJvdW5kcy5yYXlJbnRlcnNlY3Rpb24ocC54LCBwLnkpXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSBuOyBpID49IDA7IC0taSlcbiAgICAgICAgICAgICAgICBsaW5lRGF0YS5wdXNoKHZnMi5WW3Nob3J0ZXN0UGF0aFtpXV0ucCk7XG4gICAgICAgICAgICBsaW5lRGF0YS5wdXNoKHJlY3RhbmdsZV8xLm1ha2VFZGdlVG8ocSwgZWRnZS50YXJnZXQuaW5uZXJCb3VuZHMsIGFoKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGxpbmVEYXRhO1xuICAgIH07XG4gICAgTGF5b3V0LmdldFNvdXJjZUluZGV4ID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBlLnNvdXJjZSA9PT0gJ251bWJlcicgPyBlLnNvdXJjZSA6IGUuc291cmNlLmluZGV4O1xuICAgIH07XG4gICAgTGF5b3V0LmdldFRhcmdldEluZGV4ID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBlLnRhcmdldCA9PT0gJ251bWJlcicgPyBlLnRhcmdldCA6IGUudGFyZ2V0LmluZGV4O1xuICAgIH07XG4gICAgTGF5b3V0LmxpbmtJZCA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHJldHVybiBMYXlvdXQuZ2V0U291cmNlSW5kZXgoZSkgKyBcIi1cIiArIExheW91dC5nZXRUYXJnZXRJbmRleChlKTtcbiAgICB9O1xuICAgIExheW91dC5kcmFnU3RhcnQgPSBmdW5jdGlvbiAoZCkge1xuICAgICAgICBpZiAoaXNHcm91cChkKSkge1xuICAgICAgICAgICAgTGF5b3V0LnN0b3JlT2Zmc2V0KGQsIExheW91dC5kcmFnT3JpZ2luKGQpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIExheW91dC5zdG9wTm9kZShkKTtcbiAgICAgICAgICAgIGQuZml4ZWQgfD0gMjtcbiAgICAgICAgfVxuICAgIH07XG4gICAgTGF5b3V0LnN0b3BOb2RlID0gZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgdi5weCA9IHYueDtcbiAgICAgICAgdi5weSA9IHYueTtcbiAgICB9O1xuICAgIExheW91dC5zdG9yZU9mZnNldCA9IGZ1bmN0aW9uIChkLCBvcmlnaW4pIHtcbiAgICAgICAgaWYgKHR5cGVvZiBkLmxlYXZlcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGQubGVhdmVzLmZvckVhY2goZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgICAgICB2LmZpeGVkIHw9IDI7XG4gICAgICAgICAgICAgICAgTGF5b3V0LnN0b3BOb2RlKHYpO1xuICAgICAgICAgICAgICAgIHYuX2RyYWdHcm91cE9mZnNldFggPSB2LnggLSBvcmlnaW4ueDtcbiAgICAgICAgICAgICAgICB2Ll9kcmFnR3JvdXBPZmZzZXRZID0gdi55IC0gb3JpZ2luLnk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIGQuZ3JvdXBzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgZC5ncm91cHMuZm9yRWFjaChmdW5jdGlvbiAoZykgeyByZXR1cm4gTGF5b3V0LnN0b3JlT2Zmc2V0KGcsIG9yaWdpbik7IH0pO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBMYXlvdXQuZHJhZ09yaWdpbiA9IGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIGlmIChpc0dyb3VwKGQpKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHg6IGQuYm91bmRzLmN4KCksXG4gICAgICAgICAgICAgICAgeTogZC5ib3VuZHMuY3koKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBkO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBMYXlvdXQuZHJhZyA9IGZ1bmN0aW9uIChkLCBwb3NpdGlvbikge1xuICAgICAgICBpZiAoaXNHcm91cChkKSkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBkLmxlYXZlcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBkLmxlYXZlcy5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICAgICAgICAgIGQuYm91bmRzLnNldFhDZW50cmUocG9zaXRpb24ueCk7XG4gICAgICAgICAgICAgICAgICAgIGQuYm91bmRzLnNldFlDZW50cmUocG9zaXRpb24ueSk7XG4gICAgICAgICAgICAgICAgICAgIHYucHggPSB2Ll9kcmFnR3JvdXBPZmZzZXRYICsgcG9zaXRpb24ueDtcbiAgICAgICAgICAgICAgICAgICAgdi5weSA9IHYuX2RyYWdHcm91cE9mZnNldFkgKyBwb3NpdGlvbi55O1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBkLmdyb3VwcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBkLmdyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uIChnKSB7IHJldHVybiBMYXlvdXQuZHJhZyhnLCBwb3NpdGlvbik7IH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZC5weCA9IHBvc2l0aW9uLng7XG4gICAgICAgICAgICBkLnB5ID0gcG9zaXRpb24ueTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgTGF5b3V0LmRyYWdFbmQgPSBmdW5jdGlvbiAoZCkge1xuICAgICAgICBpZiAoaXNHcm91cChkKSkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBkLmxlYXZlcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBkLmxlYXZlcy5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICAgICAgICAgIExheW91dC5kcmFnRW5kKHYpO1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgdi5fZHJhZ0dyb3VwT2Zmc2V0WDtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHYuX2RyYWdHcm91cE9mZnNldFk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZW9mIGQuZ3JvdXBzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGQuZ3JvdXBzLmZvckVhY2goTGF5b3V0LmRyYWdFbmQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZC5maXhlZCAmPSB+NjtcbiAgICAgICAgfVxuICAgIH07XG4gICAgTGF5b3V0Lm1vdXNlT3ZlciA9IGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIGQuZml4ZWQgfD0gNDtcbiAgICAgICAgZC5weCA9IGQueCwgZC5weSA9IGQueTtcbiAgICB9O1xuICAgIExheW91dC5tb3VzZU91dCA9IGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIGQuZml4ZWQgJj0gfjQ7XG4gICAgfTtcbiAgICByZXR1cm4gTGF5b3V0O1xufSgpKTtcbmV4cG9ydHMuTGF5b3V0ID0gTGF5b3V0O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKbWFXeGxJam9pYkdGNWIzVjBMbXB6SWl3aWMyOTFjbU5sVW05dmRDSTZJaUlzSW5OdmRYSmpaWE1pT2xzaUxpNHZMaTR2VjJWaVEyOXNZUzl6Y21NdmJHRjViM1YwTG5SeklsMHNJbTVoYldWeklqcGJYU3dpYldGd2NHbHVaM01pT2lJN08wRkJRVUVzZVVOQlFUQkRPMEZCUXpGRExEWkRRVUVyU0R0QlFVTXZTQ3h4UTBGQmFVTTdRVUZEYWtNc2VVTkJRVGhGTzBGQlF6bEZMR2xFUVVFd1F6dEJRVU14UXl3clFrRkJkVVE3UVVGRGRrUXNNa1JCUVdsRk8wRkJUemRFTEVsQlFWa3NVMEZCT0VJN1FVRkJNVU1zVjBGQldTeFRRVUZUTzBsQlFVY3NNa05CUVVzc1EwRkJRVHRKUVVGRkxIbERRVUZKTEVOQlFVRTdTVUZCUlN4MVEwRkJSeXhEUVVGQk8wRkJRVU1zUTBGQlF5eEZRVUU1UWl4VFFVRlRMRWRCUVZRc2FVSkJRVk1zUzBGQlZDeHBRa0ZCVXl4UlFVRnhRanRCUVVGQkxFTkJRVU03UVVFclF6TkRMRk5CUVZNc1QwRkJUeXhEUVVGRExFTkJRVTA3U1VGRGJrSXNUMEZCVHl4UFFVRlBMRU5CUVVNc1EwRkJReXhOUVVGTkxFdEJRVXNzVjBGQlZ5eEpRVUZKTEU5QlFVOHNRMEZCUXl4RFFVRkRMRTFCUVUwc1MwRkJTeXhYUVVGWExFTkJRVU03UVVGRE9VVXNRMEZCUXp0QlFYZENSRHRKUVVGQk8xRkJRVUVzYVVKQmEzbENRenRSUVdwNVFsY3NaMEpCUVZjc1IwRkJSeXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTnlRaXhyUWtGQllTeEhRVUY1UXl4RlFVRkZMRU5CUVVNN1VVRkRla1FzY1VKQlFXZENMRWRCUVZjc1JVRkJSU3hEUVVGRE8xRkJRemxDTERCQ1FVRnhRaXhIUVVGSExFbEJRVWtzUTBGQlF6dFJRVU0zUWl4alFVRlRMRWRCUVVjc1NVRkJTU3hEUVVGRE8xRkJRMnBDTEcxQ1FVRmpMRWRCUVVjc1MwRkJTeXhEUVVGRE8xRkJRM1pDTEhkQ1FVRnRRaXhIUVVGSExFbEJRVWtzUTBGQlF6dFJRVWN6UWl4aFFVRlJMRWRCUVVjc1MwRkJTeXhEUVVGRE8xRkJRMnBDTEZkQlFVMHNSMEZCUnl4RlFVRkZMRU5CUVVNN1VVRkRXaXhaUVVGUExFZEJRVWNzUlVGQlJTeERRVUZETzFGQlEySXNaVUZCVlN4SFFVRkhMRWxCUVVrc1EwRkJRenRSUVVOc1FpeFhRVUZOTEVkQlFUQkNMRVZCUVVVc1EwRkJRenRSUVVOdVF5eHBRa0ZCV1N4SFFVRkhMRVZCUVVVc1EwRkJRenRSUVVOc1FpeHZRa0ZCWlN4SFFVRkhMRWxCUVVrc1EwRkJRenRSUVVOMlFpeGhRVUZSTEVkQlFWa3NTVUZCU1N4RFFVRkRPMUZCUTNwQ0xEWkNRVUYzUWl4SFFVRkhMRWxCUVVrc1EwRkJRenRSUVVOb1F5eGxRVUZWTEVkQlFVY3NTVUZCU1N4RFFVRkRPMUZCUTJ4Q0xIRkNRVUZuUWl4SFFVRkhMRWxCUVVrc1EwRkJRenRSUVVONFFpeHpRa0ZCYVVJc1IwRkJSeXhKUVVGSkxFTkJRVU03VVVGSGRrSXNWVUZCU3l4SFFVRkhMRWxCUVVrc1EwRkJRenRSUVd0V2RrSXNhVUpCUVZrc1IwRkJNa0k3V1VGRGJrTXNZMEZCWXl4RlFVRkZMRTFCUVUwc1EwRkJReXhqUVVGak8xbEJRM0pETEdOQlFXTXNSVUZCUlN4TlFVRk5MRU5CUVVNc1kwRkJZenRaUVVOeVF5eFRRVUZUTEVWQlFVVXNUVUZCVFN4RFFVRkRMR0ZCUVdFN1dVRkRMMElzVDBGQlR5eEZRVUZGTEZWQlFVRXNRMEZCUXl4SlFVRkpMRTlCUVVFc1QwRkJUeXhMUVVGSkxFTkJRVU1zVTBGQlV5eExRVUZMTEZWQlFWVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1MwRkJTU3hEUVVGRExGTkJRVk1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVFMVJDeERRVUUwUkR0VFFVTTNSU3hEUVVGRE8wbEJiV0pPTEVOQlFVTTdTVUYwZDBKVkxHMUNRVUZGTEVkQlFWUXNWVUZCVlN4RFFVRnhRaXhGUVVGRkxGRkJRV2xETzFGQlJUbEVMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zUzBGQlN6dFpRVUZGTEVsQlFVa3NRMEZCUXl4TFFVRkxMRWRCUVVjc1JVRkJSU3hEUVVGRE8xRkJRMnBETEVsQlFVa3NUMEZCVHl4RFFVRkRMRXRCUVVzc1VVRkJVU3hGUVVGRk8xbEJRM1pDTEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1UwRkJVeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NVVUZCVVN4RFFVRkRPMU5CUTNaRE8yRkJRVTA3V1VGRFNDeEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExGRkJRVkVzUTBGQlF6dFRRVU0xUWp0UlFVTkVMRTlCUVU4c1NVRkJTU3hEUVVGRE8wbEJRMmhDTEVOQlFVTTdTVUZKVXl4M1FrRkJUeXhIUVVGcVFpeFZRVUZyUWl4RFFVRlJPMUZCUTNSQ0xFbEJRVWtzU1VGQlNTeERRVUZETEV0QlFVc3NTVUZCU1N4UFFVRlBMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4TFFVRkxMRmRCUVZjc1JVRkJSVHRaUVVONlJDeEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0VFFVTjZRanRKUVVOTUxFTkJRVU03U1VGTFV5eHhRa0ZCU1N4SFFVRmtPMUZCUTBrc1QwRkJUeXhEUVVGRExFbEJRVWtzUTBGQlF5eEpRVUZKTEVWQlFVVTdXVUZCUXl4RFFVRkRPMGxCUTNwQ0xFTkJRVU03U1VGTFV5eHhRa0ZCU1N4SFFVRmtPMUZCUTBrc1NVRkJTU3hKUVVGSkxFTkJRVU1zVFVGQlRTeEhRVUZITEVsQlFVa3NRMEZCUXl4VlFVRlZMRVZCUVVVN1dVRkRMMElzU1VGQlNTeERRVUZETEZGQlFWRXNSMEZCUnl4TFFVRkxMRU5CUVVNN1dVRkRkRUlzU1VGQlNTeERRVUZETEU5QlFVOHNRMEZCUXl4RlFVRkZMRWxCUVVrc1JVRkJSU3hUUVVGVExFTkJRVU1zUjBGQlJ5eEZRVUZGTEV0QlFVc3NSVUZCUlN4SlFVRkpMRU5CUVVNc1RVRkJUU3hIUVVGSExFTkJRVU1zUlVGQlJTeE5RVUZOTEVWQlFVVXNTVUZCU1N4RFFVRkRMRmRCUVZjc1JVRkJSU3hEUVVGRExFTkJRVU03V1VGRGVFWXNUMEZCVHl4SlFVRkpMRU5CUVVNN1UwRkRaanRSUVVORUxFbEJRVTBzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1RVRkJUU3hGUVVOMFFpeERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXhOUVVGTkxFTkJRVU03VVVGRE4wSXNTVUZCU1N4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRE8xRkJSVlFzU1VGQlNTeERRVUZETEZGQlFWRXNRMEZCUXl4TFFVRkxMRU5CUVVNc1MwRkJTeXhGUVVGRkxFTkJRVU03VVVGRE5VSXNTMEZCU3l4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNSVUZCUlN4RFFVRkRMRVZCUVVVN1dVRkRjRUlzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRGJrSXNTVUZCU1N4RFFVRkRMRU5CUVVNc1MwRkJTeXhGUVVGRk8yZENRVU5VTEVsQlFVa3NUMEZCVHl4RFFVRkRMRU5CUVVNc1JVRkJSU3hMUVVGTExGZEJRVmNzU1VGQlNTeFBRVUZQTEVOQlFVTXNRMEZCUXl4RlFVRkZMRXRCUVVzc1YwRkJWeXhGUVVGRk8yOUNRVU0xUkN4RFFVRkRMRU5CUVVNc1JVRkJSU3hIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdiMEpCUTFnc1EwRkJReXhEUVVGRExFVkJRVVVzUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMmxDUVVOa08yZENRVU5FTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUlVGQlJTeERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNN1owSkJRM0pDTEVsQlFVa3NRMEZCUXl4UlFVRlJMRU5CUVVNc1MwRkJTeXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1lVRkRha003VTBGRFNqdFJRVVZFTEVsQlFVa3NSVUZCUlN4SFFVRkhMRWxCUVVrc1EwRkJReXhSUVVGUkxFTkJRVU1zVlVGQlZTeEZRVUZGTEVOQlFVTTdVVUZGY0VNc1NVRkJTU3hGUVVGRkxFdEJRVXNzUTBGQlF5eEZRVUZGTzFsQlExWXNTVUZCU1N4RFFVRkRMRTFCUVUwc1IwRkJSeXhEUVVGRExFTkJRVU03VTBGRGJrSTdZVUZCVFN4SlFVRkpMRTlCUVU4c1NVRkJTU3hEUVVGRExGZEJRVmNzUzBGQlN5eFhRVUZYTEVWQlFVVTdXVUZEYUVRc1NVRkJTU3hEUVVGRExFMUJRVTBzUjBGQlJ5eEZRVUZGTEVOQlFVTTdVMEZEY0VJN1VVRkRSQ3hKUVVGSkxFTkJRVU1zVjBGQlZ5eEhRVUZITEVWQlFVVXNRMEZCUXp0UlFVVjBRaXhKUVVGSkxFTkJRVU1zYlVKQlFXMUNMRVZCUVVVc1EwRkJRenRSUVVVelFpeEpRVUZKTEVOQlFVTXNUMEZCVHl4RFFVRkRMRVZCUVVVc1NVRkJTU3hGUVVGRkxGTkJRVk1zUTBGQlF5eEpRVUZKTEVWQlFVVXNTMEZCU3l4RlFVRkZMRWxCUVVrc1EwRkJReXhOUVVGTkxFVkJRVVVzVFVGQlRTeEZRVUZGTEVsQlFVa3NRMEZCUXl4WFFVRlhMRVZCUVVVc1EwRkJReXhEUVVGRE8xRkJRM0pHTEU5QlFVOHNTMEZCU3l4RFFVRkRPMGxCUTJwQ0xFTkJRVU03U1VGSFR5eHZRMEZCYlVJc1IwRkJNMEk3VVVGRFNTeEpRVUZOTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1VVRkJVU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExGRkJRVkVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRja1FzU1VGQlNTeERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zVFVGQlRTeERRVUZETzFGQlF6bENMRTlCUVU4c1EwRkJReXhGUVVGRkxFVkJRVVU3V1VGRFVpeERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU51UWl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTllMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMU5CUTJRN1NVRkRUQ3hEUVVGRE8wbEJWMFFzYzBKQlFVc3NSMEZCVEN4VlFVRk5MRU5CUVU4N1VVRkRWQ3hKUVVGSkxFTkJRVU1zUTBGQlF5eEZRVUZGTzFsQlEwb3NTVUZCU1N4SlFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRExFMUJRVTBzUzBGQlN5eERRVUZETEVsQlFVa3NTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXhOUVVGTkxFZEJRVWNzUTBGQlF5eEZRVUZGTzJkQ1FVZHdSQ3hKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTTdaMEpCUTFZc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eFBRVUZQTEVOQlFVTXNWVUZCVlN4RFFVRkRPMjlDUVVNelFpeERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFVkJRVlVzUTBGQlF5eERRVUZETEUxQlFVMHNSVUZCVlN4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU03WjBKQlEzaEVMRU5CUVVNc1EwRkJReXhEUVVGRE8yZENRVU5JTEVsQlFVa3NRMEZCUXl4TlFVRk5MRWRCUVVjc1NVRkJTU3hMUVVGTExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXp0blFrRkROMElzUzBGQlN5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeEZRVUZGTEVOQlFVTXNSVUZCUlR0dlFrRkRlRUlzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhGUVVGRkxFTkJRVU03YVVKQlEzWkNPMkZCUTBvN1dVRkRSQ3hQUVVGUExFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTTdVMEZEZEVJN1VVRkRSQ3hKUVVGSkxFTkJRVU1zVFVGQlRTeEhRVUZITEVOQlFVTXNRMEZCUXp0UlFVTm9RaXhQUVVGUExFbEJRVWtzUTBGQlF6dEpRVU5vUWl4RFFVRkRPMGxCVTBRc2RVSkJRVTBzUjBGQlRpeFZRVUZQTEVOQlFXZENPMUZCUVhaQ0xHbENRWFZDUXp0UlFYUkNSeXhKUVVGSkxFTkJRVU1zUTBGQlF6dFpRVUZGTEU5QlFVOHNTVUZCU1N4RFFVRkRMRTlCUVU4c1EwRkJRenRSUVVNMVFpeEpRVUZKTEVOQlFVTXNUMEZCVHl4SFFVRkhMRU5CUVVNc1EwRkJRenRSUVVOcVFpeEpRVUZKTEVOQlFVTXNWVUZCVlN4SFFVRkhMRVZCUVVVc1EwRkJRenRSUVVOeVFpeEpRVUZKTEVOQlFVTXNUMEZCVHl4RFFVRkRMRTlCUVU4c1EwRkJReXhWUVVGQkxFTkJRVU03V1VGRGJFSXNTVUZCU1N4UFFVRlBMRU5CUVVNc1EwRkJReXhQUVVGUExFdEJRVXNzVjBGQlZ6dG5Ra0ZEYUVNc1EwRkJReXhEUVVGRExFOUJRVThzUjBGQlJ5eERRVUZETEVOQlFVTTdXVUZEYkVJc1NVRkJTU3hQUVVGUExFTkJRVU1zUTBGQlF5eE5RVUZOTEV0QlFVc3NWMEZCVnl4RlFVRkZPMmRDUVVOcVF5eERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMRTlCUVU4c1EwRkJReXhWUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETzI5Q1FVTnNRaXhKUVVGSkxFOUJRVThzUTBGQlF5eExRVUZMTEZGQlFWRTdkMEpCUTNKQ0xFTkJRVU1zUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhMUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1RVRkJUU3hIUVVGSExFTkJRVU1zUTBGQlFUdG5Ra0ZEYWtRc1EwRkJReXhEUVVGRExFTkJRVU03WVVGRFRqdFpRVU5FTEVsQlFVa3NUMEZCVHl4RFFVRkRMRU5CUVVNc1RVRkJUU3hMUVVGTExGZEJRVmNzUlVGQlJUdG5Ra0ZEYWtNc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF5eFBRVUZQTEVOQlFVTXNWVUZCUXl4RlFVRkZMRVZCUVVVc1EwRkJRenR2UWtGRGJrSXNTVUZCU1N4UFFVRlBMRVZCUVVVc1MwRkJTeXhSUVVGUk8zZENRVU4wUWl4RFFVRkRMRU5CUVVNc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NTMEZCU1N4RFFVRkRMRTlCUVU4c1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEUxQlFVMHNSMEZCUnl4RFFVRkRMRU5CUVVFN1owSkJRMjVFTEVOQlFVTXNRMEZCUXl4RFFVRkRPMkZCUTA0N1VVRkRUQ3hEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU5JTEVsQlFVa3NRMEZCUXl4VlFVRlZMRU5CUVVNc1RVRkJUU3hIUVVGSExFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNUVUZCVFN4RFFVRkRMRlZCUVVFc1EwRkJReXhKUVVGSkxFOUJRVUVzVDBGQlR5eERRVUZETEVOQlFVTXNUVUZCVFN4TFFVRkxMRmRCUVZjc1JVRkJMMElzUTBGQkswSXNRMEZCUXl4RFFVRkRPMUZCUTJ4R0xFbEJRVWtzUTBGQlF5eFZRVUZWTEVOQlFVTXNUVUZCVFN4SFFVRkhMRWxCUVVrc1EwRkJReXhQUVVGUExFTkJRVU1zVFVGQlRTeERRVUZETEZWQlFVRXNRMEZCUXl4SlFVRkpMRTlCUVVFc1QwRkJUeXhEUVVGRExFTkJRVU1zVFVGQlRTeExRVUZMTEZkQlFWY3NSVUZCTDBJc1EwRkJLMElzUTBGQlF5eERRVUZETzFGQlEyNUdMRTlCUVU4c1NVRkJTU3hEUVVGRE8wbEJRMmhDTEVOQlFVTTdTVUZGUkN4cFEwRkJaMElzUjBGQmFFSXNWVUZCYVVJc1EwRkJWenRSUVVONFFpeEpRVUZKTEVOQlFVTXNSMEZCUnl4VlFVRlZMRU5CUVVNc1UwRkJVeXhEUVVGRExFbEJRVWtzUTBGQlF5eE5RVUZOTEVWQlFVVXNTVUZCU1N4RFFVRkRMRTFCUVUwc1JVRkJSU3hKUVVGSkxFTkJRVU1zV1VGQldTeEZRVUZGTEVsQlFVa3NRMEZCUXl4VlFVRlZMRU5CUVVNc1EwRkJRenRSUVVNelJpeEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF6dFJRVU4wUWl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRFRDeFBRVUZQTEVsQlFVa3NRMEZCUXp0SlFVTm9RaXhEUVVGRE8wbEJWVVFzT0VKQlFXRXNSMEZCWWl4VlFVRmpMRU5CUVZjN1VVRkRja0lzU1VGQlNTeERRVUZETEZOQlFWTXNRMEZCUXl4TlFVRk5PMWxCUVVVc1QwRkJUeXhKUVVGSkxFTkJRVU1zWTBGQll5eERRVUZETzFGQlEyeEVMRWxCUVVrc1EwRkJReXhqUVVGakxFZEJRVWNzUTBGQlF5eERRVUZETzFGQlEzaENMRTlCUVU4c1NVRkJTU3hEUVVGRE8wbEJRMmhDTEVOQlFVTTdTVUZaUkN4dFEwRkJhMElzUjBGQmJFSXNWVUZCYlVJc1EwRkJWenRSUVVNeFFpeEpRVUZKTEVOQlFVTXNVMEZCVXl4RFFVRkRMRTFCUVUwN1dVRkJSU3hQUVVGUExFbEJRVWtzUTBGQlF5eHRRa0ZCYlVJc1EwRkJRenRSUVVOMlJDeEpRVUZKTEVOQlFVTXNiVUpCUVcxQ0xFZEJRVWNzUTBGQlF5eERRVUZETzFGQlF6ZENMRTlCUVU4c1NVRkJTU3hEUVVGRE8wbEJRMmhDTEVOQlFVTTdTVUZSUkN3eVFrRkJWU3hIUVVGV0xGVkJRVmNzU1VGQldTeEZRVUZGTEdGQlFYZERPMUZCUXpkRUxFbEJRVWtzUTBGQlF5eFRRVUZUTEVOQlFVTXNUVUZCVFR0WlFVRkZMRWxCUVVrc1IwRkJSeXhIUVVGSExFTkJRVU03VVVGRGJFTXNTVUZCU1N4RFFVRkRMSGRDUVVGM1FpeEhRVUZITzFsQlF6VkNMRWxCUVVrc1JVRkJSU3hKUVVGSk8xbEJRMVlzWjBKQlFXZENMRVZCUVVVc1QwRkJUeXhoUVVGaExFdEJRVXNzVVVGQlVTeERRVUZETEVOQlFVTXNRMEZCUXl4alFVRmpMRTlCUVU4c1lVRkJZU3hEUVVGQkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4aFFVRmhPMU5CUXpkSExFTkJRVU03VVVGRFJpeFBRVUZQTEVsQlFVa3NRMEZCUXp0SlFVTm9RaXhEUVVGRE8wbEJVMFFzYzBKQlFVc3NSMEZCVEN4VlFVRk5MRU5CUVRSQ08xRkJRemxDTEVsQlFVa3NRMEZCUXl4VFFVRlRMRU5CUVVNc1RVRkJUVHRaUVVGRkxFOUJRVThzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXp0UlFVTXhReXhKUVVGSkxFTkJRVU1zVFVGQlRTeEhRVUZITEVOQlFVTXNRMEZCUXp0UlFVTm9RaXhQUVVGUExFbEJRVWtzUTBGQlF6dEpRVU5vUWl4RFFVRkRPMGxCVlVRc05FSkJRVmNzUjBGQldDeFZRVUZaTEVOQlFXTTdVVUZEZEVJc1NVRkJTU3hEUVVGRExGTkJRVk1zUTBGQlF5eE5RVUZOTzFsQlFVVXNUMEZCVHl4SlFVRkpMRU5CUVVNc1dVRkJXU3hEUVVGRE8xRkJRMmhFTEVsQlFVa3NRMEZCUXl4WlFVRlpMRWRCUVVjc1EwRkJReXhEUVVGRE8xRkJRM1JDTEU5QlFVOHNTVUZCU1N4RFFVRkRPMGxCUTJoQ0xFTkJRVU03U1VGWFJDd3JRa0ZCWXl4SFFVRmtMRlZCUVdVc1EwRkJUenRSUVVOc1FpeEpRVUZKTEVOQlFVTXNVMEZCVXl4RFFVRkRMRTFCUVUwN1dVRkJSU3hQUVVGUExFbEJRVWtzUTBGQlF5eGxRVUZsTEVOQlFVTTdVVUZEYmtRc1NVRkJTU3hEUVVGRExHVkJRV1VzUjBGQlJ5eERRVUZETEVOQlFVTTdVVUZEZWtJc1QwRkJUeXhKUVVGSkxFTkJRVU03U1VGRGFFSXNRMEZCUXp0SlFWVkVMSEZDUVVGSkxFZEJRVW9zVlVGQlN5eERRVUZwUWp0UlFVTnNRaXhKUVVGSkxFTkJRVU1zUTBGQlF6dFpRVUZGTEU5QlFVOHNTVUZCU1N4RFFVRkRMRmRCUVZjc1EwRkJRenRSUVVOb1F5eEpRVUZKTEVOQlFVTXNWMEZCVnl4SFFVRkhMRU5CUVVNc1EwRkJRenRSUVVOeVFpeFBRVUZQTEVsQlFVa3NRMEZCUXp0SlFVTm9RaXhEUVVGRE8wbEJVMFFzWjBOQlFXVXNSMEZCWml4VlFVRm5RaXhEUVVGUE8xRkJRMjVDTEVsQlFVa3NRMEZCUXl4RFFVRkRPMWxCUVVVc1QwRkJUeXhKUVVGSkxFTkJRVU1zWjBKQlFXZENMRU5CUVVNN1VVRkRja01zU1VGQlNTeERRVUZETEdkQ1FVRm5RaXhIUVVGSExFTkJRVU1zUTBGQlF6dFJRVU14UWl4UFFVRlBMRWxCUVVrc1EwRkJRenRKUVVOb1FpeERRVUZETzBsQlUwUXNhVU5CUVdkQ0xFZEJRV2hDTEZWQlFXbENMRU5CUVU4N1VVRkRjRUlzU1VGQlNTeERRVUZETEVOQlFVTTdXVUZCUlN4UFFVRlBMRWxCUVVrc1EwRkJReXhwUWtGQmFVSXNRMEZCUXp0UlFVTjBReXhKUVVGSkxFTkJRVU1zYVVKQlFXbENMRWRCUVVjc1EwRkJReXhEUVVGRE8xRkJRek5DTEU5QlFVOHNTVUZCU1N4RFFVRkRPMGxCUTJoQ0xFTkJRVU03U1VGVFJDdzJRa0ZCV1N4SFFVRmFMRlZCUVdFc1EwRkJUenRSUVVOb1FpeEpRVUZKTEVOQlFVTXNRMEZCUXl4RlFVRkZPMWxCUTBvc1QwRkJUeXhKUVVGSkxFTkJRVU1zWVVGQllTeERRVUZETzFOQlF6ZENPMUZCUTBRc1NVRkJTU3hEUVVGRExHRkJRV0VzUjBGQlJ5eFBRVUZQTEVOQlFVTXNTMEZCU3l4VlFVRlZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRkRVFzU1VGQlNTeERRVUZETEhGQ1FVRnhRaXhIUVVGSExFbEJRVWtzUTBGQlF6dFJRVU5zUXl4UFFVRlBMRWxCUVVrc1EwRkJRenRKUVVOb1FpeERRVUZETzBsQlJVUXNlVUpCUVZFc1IwRkJVaXhWUVVGVExFTkJRVzlDTzFGQlEzcENMRWxCUVVrc1EwRkJReXhUUVVGVExFZEJRVWNzUTBGQlF5eERRVUZETzFGQlEyNUNMRTlCUVU4c1NVRkJTU3hEUVVGRE8wbEJRMmhDTEVOQlFVTTdTVUZKUkN4eFEwRkJiMElzUjBGQmNFSXNWVUZCY1VJc1EwRkJWVHRSUVVNelFpeEpRVUZKTEVOQlFVTXNRMEZCUXp0WlFVRkZMRTlCUVU4c1NVRkJTU3hEUVVGRExGVkJRVlVzUTBGQlF6dFJRVU12UWl4SlFVRkpMRU5CUVVNc1ZVRkJWU3hIUVVGSExFOUJRVThzUTBGQlF5eExRVUZMTEZWQlFWVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTnVSQ3hQUVVGUExFbEJRVWtzUTBGQlF6dEpRVU5vUWl4RFFVRkRPMGxCU1VRc2MwSkJRVXNzUjBGQlRDeFZRVUZOTEVOQlFWVTdVVUZEV2l4SlFVRkpMRU5CUVVNc1UwRkJVeXhEUVVGRExFMUJRVTA3V1VGQlJTeFBRVUZQTEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNN1lVRkRja003V1VGRFJDeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkRVQ3hKUVVGSkxFbEJRVWtzUTBGQlF5eE5RVUZOTEVWQlFVVTdaMEpCUTJJc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF6dHZRa0ZCUlN4SlFVRkpMRU5CUVVNc1RVRkJUU3hIUVVGSExFTkJRVU1zUTBGQlF6czdiMEpCUTNSQ0xFbEJRVWtzUTBGQlF5eE5RVUZOTEVkQlFVY3NRMEZCUXl4RFFVRkRPMkZCUTNoQ08ybENRVUZOTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSVHRuUWtGRFpDeEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMRkZCUVZFc1JVRkJSVHR2UWtGRGFFSXNTVUZCU1N4RFFVRkRMRkZCUVZFc1IwRkJSeXhKUVVGSkxFTkJRVU03YjBKQlEzSkNMRWxCUVVrc1EwRkJReXhQUVVGUExFTkJRVU1zUlVGQlJTeEpRVUZKTEVWQlFVVXNVMEZCVXl4RFFVRkRMRXRCUVVzc1JVRkJSU3hMUVVGTExFVkJRVVVzU1VGQlNTeERRVUZETEUxQlFVMHNSMEZCUnl4RFFVRkRMRVZCUVVNc1EwRkJReXhEUVVGRE8yOUNRVU12UkN4SlFVRkpMRU5CUVVNc1NVRkJTU3hGUVVGRkxFTkJRVU03YVVKQlEyWTdZVUZEU2p0WlFVTkVMRTlCUVU4c1NVRkJTU3hEUVVGRE8xTkJRMlk3U1VGRFRDeERRVUZETzBsQlJVUXNPRUpCUVdFc1IwRkJZaXhWUVVGakxFbEJRWGxDTzFGQlEyNURMRTlCUVU4c1QwRkJUeXhKUVVGSkxFTkJRVU1zWVVGQllTeExRVUZMTEZWQlFWVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVFclFpeEpRVUZKTEVOQlFVTXNZVUZCWXl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZUTEVsQlFVa3NRMEZCUXl4aFFVRmhMRU5CUVVNN1NVRkRPVWtzUTBGQlF6dEpRVVZOTEc5Q1FVRmhMRWRCUVhCQ0xGVkJRWEZDTEVsQlFYVkNMRVZCUVVVc1RVRkJZenRSUVVONFJDeEpRVUZKTEVOQlFVTXNUVUZCVFN4SFFVRkhMRTFCUVUwc1EwRkJRenRKUVVONlFpeERRVUZETzBsQlJVUXNORUpCUVZjc1IwRkJXQ3hWUVVGWkxFbEJRWGxDTzFGQlEycERMRTlCUVU4c1QwRkJUeXhKUVVGSkxFTkJRVU1zVTBGQlV5eExRVUZMTEZWQlFWVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExGTkJRVk1zUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8wbEJRek5GTEVOQlFVTTdTVUZ0UWtRc2VVTkJRWGRDTEVkQlFYaENMRlZCUVhsQ0xGZEJRVzFDTEVWQlFVVXNRMEZCWVR0UlFVRXpSQ3hwUWtGSlF6dFJRVW8yUXl4clFrRkJRU3hGUVVGQkxFdEJRV0U3VVVGRGRrUXNTVUZCU1N4RFFVRkRMRmxCUVZrc1EwRkJReXhWUVVGQkxFTkJRVU1zU1VGQlNTeFBRVUZCTEZkQlFWY3NSMEZCUnl4RFFVRkRMRU5CUVVNc1RVRkJUU3hGUVVGMFFpeERRVUZ6UWl4RFFVRkRMRU5CUVVNN1VVRkRMME1zU1VGQlNTeERRVUZETEhGQ1FVRnhRaXhIUVVGSExHTkJRVTBzVDBGQlFTeHpRMEZCZDBJc1EwRkJReXhMUVVGSkxFTkJRVU1zVFVGQlRTeEZRVUZGTEV0QlFVa3NRMEZCUXl4WlFVRlpMRVZCUVVVc1EwRkJReXhEUVVGRExFVkJRVE5FTEVOQlFUSkVMRU5CUVVNN1VVRkRMMFlzVDBGQlR5eEpRVUZKTEVOQlFVTTdTVUZEYUVJc1EwRkJRenRKUVZsRUxHMURRVUZyUWl4SFFVRnNRaXhWUVVGdFFpeFhRVUZ0UWl4RlFVRkZMRU5CUVdFN1VVRkJja1FzYVVKQlNVTTdVVUZLZFVNc2EwSkJRVUVzUlVGQlFTeExRVUZoTzFGQlEycEVMRWxCUVVrc1EwRkJReXhaUVVGWkxFTkJRVU1zVlVGQlFTeERRVUZETEVsQlFVa3NUMEZCUVN4WFFVRlhMRWRCUVVjc1EwRkJReXhEUVVGRExFMUJRVTBzUlVGQmRFSXNRMEZCYzBJc1EwRkJReXhEUVVGRE8xRkJReTlETEVsQlFVa3NRMEZCUXl4eFFrRkJjVUlzUjBGQlJ5eGpRVUZOTEU5QlFVRXNaME5CUVd0Q0xFTkJRVU1zUzBGQlNTeERRVUZETEUxQlFVMHNSVUZCUlN4TFFVRkpMRU5CUVVNc1dVRkJXU3hGUVVGRkxFTkJRVU1zUTBGQlF5eEZRVUZ5UkN4RFFVRnhSQ3hEUVVGRE8xRkJRM3BHTEU5QlFVOHNTVUZCU1N4RFFVRkRPMGxCUTJoQ0xFTkJRVU03U1VGWlJDeHpRa0ZCU3l4SFFVRk1MRlZCUTBrc09FSkJRVEJETEVWQlF6RkRMQ3RDUVVFeVF5eEZRVU16UXl3clFrRkJNa01zUlVGRE0wTXNhMEpCUVRoQ0xFVkJRemxDTEZkQlFXdENMRVZCUTJ4Q0xGZEJRV3RDTzFGQlRuUkNMR2xDUVhOS1F6dFJRWEpLUnl3clEwRkJRU3hGUVVGQkxHdERRVUV3UXp0UlFVTXhReXhuUkVGQlFTeEZRVUZCTEcxRFFVRXlRenRSUVVNelF5eG5SRUZCUVN4RlFVRkJMRzFEUVVFeVF6dFJRVU16UXl4dFEwRkJRU3hGUVVGQkxITkNRVUU0UWp0UlFVTTVRaXcwUWtGQlFTeEZRVUZCTEd0Q1FVRnJRanRSUVVOc1FpdzBRa0ZCUVN4RlFVRkJMR3RDUVVGclFqdFJRVVZzUWl4SlFVRkpMRU5CUVZNc1JVRkRWQ3hEUVVGVExFVkJRMVFzUTBGQlF5eEhRVUZuUWl4SlFVRkpMRU5CUVVNc1MwRkJTeXhGUVVGSExFTkJRVU1zVFVGQlRTeEZRVU55UXl4RFFVRkRMRWRCUVVjc1EwRkJReXhIUVVGSExFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNUMEZCVHl4RFFVRkRMRTFCUVUwc1JVRkRMMElzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1RVRkJUU3hGUVVOMFFpeERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRmRCUVZjc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGRGRrSXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhYUVVGWExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZGTlVJc1NVRkJTU3hEUVVGRExFZEJRVWNzU1VGQlNTeExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhIUVVGSExFbEJRVWtzUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUlhaRExFbEJRVWtzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXp0UlFVVmlMRWxCUVVrc1JVRkJSU3hIUVVGSExFbEJRVWtzUTBGQlF5eGpRVUZqTEVOQlFVTTdVVUZGTjBJc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eFBRVUZQTEVOQlFVTXNWVUZCUXl4RFFVRkRMRVZCUVVVc1EwRkJRenRaUVVOeVFpeERRVUZETEVOQlFVTXNTMEZCU3l4SFFVRkhMRU5CUVVNc1EwRkJRenRaUVVOYUxFbEJRVWtzVDBGQlR5eERRVUZETEVOQlFVTXNRMEZCUXl4TFFVRkxMRmRCUVZjc1JVRkJSVHRuUWtGRE5VSXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dGhRVU0xUWp0WlFVTkVMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUXpOQ0xFTkJRVU1zUTBGQlF5eERRVUZETzFGQlJVZ3NTVUZCU1N4SlFVRkpMRU5CUVVNc2NVSkJRWEZDTzFsQlFVVXNTVUZCU1N4RFFVRkRMSEZDUVVGeFFpeEZRVUZGTEVOQlFVTTdVVUZMTjBRc1NVRkJTU3hUUVVGVExFTkJRVU03VVVGRFpDeEpRVUZKTEVsQlFVa3NRMEZCUXl4bFFVRmxMRVZCUVVVN1dVRkZkRUlzVTBGQlV5eEhRVUZITEVsQlFVa3NRMEZCUXl4bFFVRmxMRU5CUVVNN1UwRkRjRU03WVVGQlRUdFpRVVZJTEZOQlFWTXNSMEZCUnl4RFFVRkRMRWxCUVVrc01FSkJRVlVzUTBGQlF5eERRVUZETEVWQlFVVXNTVUZCU1N4RFFVRkRMRTFCUVUwc1JVRkJSU3hOUVVGTkxFTkJRVU1zWTBGQll5eEZRVUZGTEUxQlFVMHNRMEZCUXl4alFVRmpMRVZCUVVVc1ZVRkJRU3hEUVVGRExFbEJRVWNzVDBGQlFTeExRVUZKTEVOQlFVTXNZVUZCWVN4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGeVFpeERRVUZ4UWl4RFFVRkRMRU5CUVVNc1EwRkJReXhqUVVGakxFVkJRVVVzUTBGQlF6dFpRVWwyU1N4RFFVRkRMRWRCUVVjc2FVSkJRVThzUTBGQlF5eHJRa0ZCYTBJc1EwRkJReXhEUVVGRExFVkJRVVVzWTBGQlRTeFBRVUZCTEVOQlFVTXNSVUZCUkN4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVNelF5eEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRTlCUVU4c1EwRkJReXhWUVVGQkxFTkJRVU03WjBKQlEycENMRWxCUVVrc1QwRkJUeXhEUVVGRExFTkJRVU1zVFVGQlRTeEpRVUZKTEZGQlFWRTdiMEpCUVVVc1EwRkJReXhEUVVGRExFMUJRVTBzUjBGQlJ5eExRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRlRMRU5CUVVNc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF6dG5Ra0ZETVVVc1NVRkJTU3hQUVVGUExFTkJRVU1zUTBGQlF5eE5RVUZOTEVsQlFVa3NVVUZCVVR0dlFrRkJSU3hEUVVGRExFTkJRVU1zVFVGQlRTeEhRVUZITEV0QlFVa3NRMEZCUXl4TlFVRk5MRU5CUVZNc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETzFsQlF6bEZMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRMGdzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4UFFVRlBMRU5CUVVNc1ZVRkJRU3hEUVVGRE8yZENRVU5xUWl4SlFVRk5MRU5CUVVNc1IwRkJSeXhOUVVGTkxFTkJRVU1zWTBGQll5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhOUVVGTkxFTkJRVU1zWTBGQll5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMmRDUVVOcVJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eE5RVUZOTEVsQlFVa3NRMEZCUXl4RFFVRkRPMWxCUTNSRExFTkJRVU1zUTBGQlF5eERRVUZETzFOQlEwNDdVVUZGUkN4SlFVRkpMRU5CUVVNc1IwRkJSeXhwUWtGQlR5eERRVUZETEd0Q1FVRnJRaXhEUVVGRExFTkJRVU1zUlVGQlJTeFZRVUZWTEVOQlFVTXNSVUZCUlN4RFFVRkRPMWxCUTJoRUxFOUJRVThzVTBGQlV5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRek5DTEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUlVnc1NVRkJTU3hKUVVGSkxFTkJRVU1zVlVGQlZTeEpRVUZKTEU5QlFVOHNTVUZCU1N4RFFVRkRMRlZCUVZVc1EwRkJReXhOUVVGTkxFdEJRVXNzVjBGQlZ5eEZRVUZGTzFsQlEyeEZMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dFpRVU5XTEVsQlFVa3NZVUZCWVN4SFFVRkhMRlZCUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUlVGQlJTeFJRVUZSTEVWQlFVVXNZVUZCWVR0blFrRkRPVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhSUVVGUkxFTkJRVU03WjBKQlF6ZENMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NZVUZCWVN4RFFVRkRPMWxCUTNSRExFTkJRVU1zUTBGQlF6dFpRVU5HTEVsQlFVa3NRMEZCUXl4UFFVRlBMRU5CUVVNc1QwRkJUeXhEUVVGRExGVkJRVUVzUTBGQlF6dG5Ra0ZEYkVJc1lVRkJZU3hEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRXRCUVVrc1EwRkJReXhwUWtGQmFVSXNSVUZCUlN4SFFVRkhMRU5CUVVNc1EwRkJRenRuUWtGcFFuSkVMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETzJkQ1FVTnlRaXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0WlFVTjZRaXhEUVVGRExFTkJRVU1zUTBGQlF6dFRRVU5PT3p0WlFVRk5MRWxCUVVrc1EwRkJReXhWUVVGVkxFZEJRVWNzUlVGQlJTeE5RVUZOTEVWQlFVVXNTVUZCU1N4RFFVRkRMRTFCUVUwc1JVRkJSU3hOUVVGTkxFVkJRVVVzUlVGQlJTeEZRVUZGTEVOQlFVTTdVVUZGTjBRc1NVRkJTU3hqUVVGakxFZEJRVWNzU1VGQlNTeERRVUZETEZsQlFWa3NTVUZCU1N4RlFVRkZMRU5CUVVNN1VVRkROME1zU1VGQlNTeEpRVUZKTEVOQlFVTXNkMEpCUVhkQ0xFVkJRVVU3V1VGRGVrSXNTVUZCU1N4RFFVRkRMRmxCUVdFc1EwRkJReXhuUWtGQlowSXNSMEZCUnl4SlFVRkpMRU5CUVVNc2QwSkJRWGRDTEVOQlFVTXNaMEpCUVdkQ0xFTkJRVU03V1VGRE0wWXNZMEZCWXl4SFFVRkhMR05CUVdNc1EwRkJReXhOUVVGTkxFTkJRVU1zTmtOQlFTdENMRU5CUVVNc1EwRkJReXhGUVVGRkxFbEJRVWtzUTBGQlF5eE5RVUZOTEVWQlFVVXNTVUZCU1N4RFFVRkRMSGRDUVVGM1FpeERRVUZETEVsQlFVa3NSVUZCVHl4RFFVRkRMRWxCUVVrc1EwRkJReXhaUVVGWkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVMEZIZWtvN1VVRkZSQ3hKUVVGSkxFTkJRVU1zWVVGQllTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRPMUZCUXpGQ0xFbEJRVWtzUTBGQlF5eFJRVUZSTEVkQlFVY3NTVUZCU1N4cFFrRkJUeXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJSWFpETEVsQlFVa3NRMEZCUXl4UlFVRlJMRU5CUVVNc1MwRkJTeXhEUVVGRExFdEJRVXNzUlVGQlJTeERRVUZETzFGQlF6VkNMRXRCUVVzc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1JVRkJSU3hEUVVGRExFVkJRVVU3V1VGRGVFSXNTVUZCU1N4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTjJRaXhKUVVGSkxFTkJRVU1zUTBGQlF5eExRVUZMTEVWQlFVVTdaMEpCUTFRc1EwRkJReXhEUVVGRExFVkJRVVVzUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMmRDUVVOWUxFTkJRVU1zUTBGQlF5eEZRVUZGTEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRuUWtGRFdDeEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMmRDUVVOdVFpeEpRVUZKTEVOQlFVTXNVVUZCVVN4RFFVRkRMRXRCUVVzc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMkZCUTJwRE8xTkJRMG83VVVGRFJDeEpRVUZKTEVOQlFVTXNVVUZCVVN4RFFVRkRMRk5CUVZNc1IwRkJSeXhKUVVGSkxFTkJRVU1zVlVGQlZTeERRVUZETzFGQlN6RkRMRWxCUVVrc1EwRkJReXhoUVVGaExFTkJRVU1zT0VKQlFUaENMRVZCUVVVc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETzFGQlIzcEVMRWxCUVVrc1kwRkJZeXhEUVVGRExFMUJRVTBzUjBGQlJ5eERRVUZETzFsQlFVVXNTVUZCU1N4RFFVRkRMRkZCUVZFc1EwRkJReXhQUVVGUExFZEJRVWNzU1VGQlNTeHpRa0ZCVlN4RFFVRkRMRWxCUVVrc1EwRkJReXhOUVVGTkxFVkJRVVVzU1VGQlNTeERRVUZETEU5QlFVOHNSVUZCUlN4SlFVRkpMRU5CUVVNc1ZVRkJWU3hGUVVGRkxHTkJRV01zUTBGQlF5eERRVUZETEdkQ1FVRm5RaXhGUVVGRkxFTkJRVU03VVVGRGNrb3NTVUZCU1N4RFFVRkRMRkZCUVZFc1EwRkJReXhIUVVGSExFTkJRVU1zSzBKQlFTdENMRU5CUVVNc1EwRkJRenRSUVVOdVJDeEpRVUZKTEVOQlFVTXNOa0pCUVRaQ0xFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4WFFVRlhMRU5CUVVNc1EwRkJRenRSUVVkMFJDeEpRVUZKTEVOQlFVTXNZVUZCWVN4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRE8xRkJRM1pDTEVsQlFVa3NSVUZCUlN4RlFVRkZPMWxCUTBvc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eFBRVUZQTEVOQlFVTXNWVUZCVlN4RFFVRkRMRVZCUVVVc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEYWtVc1NVRkJTU3hEUVVGRExGRkJRVkVzUTBGQlF5eFBRVUZQTEVkQlFVY3NTVUZCU1N4elFrRkJWU3hEUVVGRExFbEJRVWtzUTBGQlF5eE5RVUZOTEVWQlFVVXNTVUZCU1N4RFFVRkRMRTlCUVU4c1JVRkJSU3hKUVVGSkxFTkJRVU1zVlVGQlZTeEZRVUZGTEdOQlFXTXNSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJReXhuUWtGQlowSXNSVUZCUlN4RFFVRkRPMWxCUXpWSUxFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNUMEZCVHl4RFFVRkRMRlZCUVZVc1EwRkJReXhGUVVGRkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMU5CUTNCRk8xRkJSMFFzU1VGQlNTeERRVUZETEZGQlFWRXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRE8xRkJRM0JDTEVsQlFVa3NRMEZCUXl4UlFVRlJMRU5CUVVNc1IwRkJSeXhEUVVGRExDdENRVUVyUWl4RFFVRkRMRU5CUVVNN1VVRkZia1FzU1VGQlNTeHJRa0ZCYTBJc1JVRkJSVHRaUVVOd1FpeEpRVUZKTEVOQlFVTXNVVUZCVVN4RFFVRkRMRmxCUVZrc1IwRkJSeXhKUVVGSkxFTkJRVU03V1VGRGJFTXNTVUZCU1N4RFFVRkRMRkZCUVZFc1EwRkJReXhaUVVGWkxFZEJRVWNzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhMUVVGTExFTkJRVU03V1VGRGJFUXNTVUZCU1N4RFFVRkRMRkZCUVZFc1EwRkJReXhuUWtGQlowSXNSMEZCUnl4RFFVRkRMRU5CUVVNN1dVRkRia01zU1VGQlNTeERRVUZETEZGQlFWRXNRMEZCUXl4bFFVRmxMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dFpRVU4yUXl4SlFVRkpMRVZCUVVVc1IwRkJSeXhwUWtGQlR5eERRVUZETEd0Q1FVRnJRaXhEUVVGRExFTkJRVU1zUlVGQlF5eFZRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRPMmRDUVVOMlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU03YjBKQlFVVXNUMEZCVHl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdaMEpCUTNKRExFOUJRVThzUTBGQlF5eERRVUZCTzFsQlExb3NRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkRTQ3hKUVVGSkxFTkJRVU1zVVVGQlVTeERRVUZETEVOQlFVTXNSMEZCUnl4RlFVRkZMRU5CUVVNN1dVRkRja0lzU1VGQlNTeERRVUZETEZGQlFWRXNRMEZCUXl4SFFVRkhMRU5CUVVNc2EwSkJRV3RDTEVOQlFVTXNRMEZCUXp0VFFVTjZRenRSUVVWRUxFbEJRVWtzUTBGQlF5eHRRa0ZCYlVJc1JVRkJSU3hEUVVGRE8xRkJRek5DTEVsQlFVa3NRMEZCUXl3MlFrRkJOa0lzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRmRCUVZjc1EwRkJReXhEUVVGRE8xRkJRM1JFTEU5QlFVOHNWMEZCVnl4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zVFVGQlRTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJRenRKUVVNNVF5eERRVUZETzBsQlJVOHNPRUpCUVdFc1IwRkJja0lzVlVGQmMwSXNWVUZCYTBJc1JVRkJSU3hEUVVGWExFVkJRVVVzUTBGQlZ6dFJRVU01UkN4SlFVRkpMRWxCUVVrc1EwRkJReXhQUVVGUExFTkJRVU1zVFVGQlRTeEhRVUZITEVOQlFVTXNTVUZCU1N4VlFVRlZMRWRCUVVjc1EwRkJReXhGUVVGRk8xbEJSek5ETEVsQlFVa3NRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zVFVGQlRTeERRVUZETzFsQlF6TkNMRWxCUVVrc1MwRkJTeXhIUVVGSExFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNSMEZCUnl4RFFVRkRMRlZCUVVFc1EwRkJReXhKUVVGSkxFOUJRVUVzUTBGQlN5eEZRVUZGTEUxQlFVMHNSVUZCVXl4RFFVRkRMRU5CUVVNc1RVRkJUeXhEUVVGRExFdEJRVXNzUlVGQlJTeE5RVUZOTEVWQlFWTXNRMEZCUXl4RFFVRkRMRTFCUVU4c1EwRkJReXhMUVVGTExFVkJRVVVzUTBGQlFTeEZRVUYyUlN4RFFVRjFSU3hEUVVGRExFTkJRVU03V1VGRE1VY3NTVUZCU1N4RlFVRkZMRWRCUVVjc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eEhRVUZITEVOQlFVTXNWVUZCUVN4RFFVRkRMRWxCUVVrc1QwRkJRU3hEUVVGTExFVkJRVVVzUzBGQlN5eEZRVUZGTEVOQlFVTXNRMEZCUXl4TFFVRkxMRVZCUVVVc1EwRkJRU3hGUVVGMlFpeERRVUYxUWl4RFFVRkRMRU5CUVVNN1dVRkRka1FzU1VGQlNTeERRVUZETEU5QlFVOHNRMEZCUXl4UFFVRlBMRU5CUVVNc1ZVRkJReXhEUVVGRExFVkJRVVVzUTBGQlF6dG5Ra0ZEZEVJc1JVRkJSU3hEUVVGRExFbEJRVWtzUTBGQlRTeEZRVUZGTEV0QlFVc3NSVUZCUlN4RFFVRkRMRU5CUVVNc1MwRkJTeXhIUVVGSExFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRPMWxCUXpkRExFTkJRVU1zUTBGQlF5eERRVUZETzFsQlEwZ3NTVUZCU1N4RFFVRkRMRTlCUVU4c1EwRkJReXhQUVVGUExFTkJRVU1zVlVGQlF5eERRVUZETEVWQlFVVXNRMEZCUXp0blFrRkRkRUlzU1VGQlNTeFBRVUZQTEVOQlFVTXNRMEZCUXl4TlFVRk5MRXRCUVVzc1YwRkJWenR2UWtGREwwSXNRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhQUVVGUExFTkJRVU1zVlVGQlFTeERRVUZETEVsQlFVa3NUMEZCUVN4TFFVRkxMRU5CUVVNc1NVRkJTU3hEUVVGRExFVkJRVVVzVFVGQlRTeEZRVUZGTEVOQlFVTXNRMEZCUXl4TFFVRkxMRVZCUVVVc1RVRkJUU3hGUVVGRkxFTkJRVU1zUTBGQlF5eExRVUZMTEVWQlFVVXNRMEZCUXl4RlFVRm9SQ3hEUVVGblJDeERRVUZETEVOQlFVTTdaMEpCUXpWRkxFbEJRVWtzVDBGQlR5eERRVUZETEVOQlFVTXNUVUZCVFN4TFFVRkxMRmRCUVZjN2IwSkJReTlDTEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1QwRkJUeXhEUVVGRExGVkJRVUVzUlVGQlJTeEpRVUZKTEU5QlFVRXNTMEZCU3l4RFFVRkRMRWxCUVVrc1EwRkJReXhGUVVGRkxFMUJRVTBzUlVGQlJTeERRVUZETEVOQlFVTXNTMEZCU3l4RlFVRkZMRTFCUVUwc1JVRkJSU3hGUVVGRkxFTkJRVU1zUzBGQlN5eEZRVUZGTEVOQlFVTXNSVUZCYWtRc1EwRkJhVVFzUTBGQlF5eERRVUZETzFsQlEyeEdMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJSMGdzU1VGQlNTeE5RVUZOTEVWQlFVVTdhVUpCUTFBc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eEpRVUZKTEVWQlFVVXNRMEZCUXp0cFFrRkRha0lzUzBGQlN5eERRVUZETEVWQlFVVXNRMEZCUXp0cFFrRkRWQ3hMUVVGTExFTkJRVU1zUzBGQlN5eERRVUZETzJsQ1FVTmFMR0ZCUVdFc1EwRkJReXhMUVVGTExFTkJRVU03YVVKQlEzQkNMRmxCUVZrc1EwRkJReXhKUVVGSkxFTkJRVU1zV1VGQldTeEZRVUZGTEVOQlFVTTdhVUpCUTJwRExIZENRVUYzUWl4RFFVRkRMRU5CUVVNc1EwRkJRenRwUWtGRE0wSXNiMEpCUVc5Q0xFTkJRVU1zU1VGQlNTeERRVUZETzJsQ1FVTXhRaXhMUVVGTExFTkJRVU1zVlVGQlZTeEZRVUZGTEVOQlFVTXNSVUZCUlN4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFdEJRVXNzUTBGQlF5eERRVUZETzFsQlJYWkRMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zVDBGQlR5eERRVUZETEZWQlFVRXNRMEZCUXp0blFrRkRha0lzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4TFFVRkxMRU5CUVVNc1IwRkJSeXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRuUWtGRE0wSXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhMUVVGTExFTkJRVU1zUjBGQlJ5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU12UWl4RFFVRkRMRU5CUVVNc1EwRkJRenRUUVVOT08yRkJRVTA3V1VGRFNDeEpRVUZKTEVOQlFVTXNVVUZCVVN4RFFVRkRMRWRCUVVjc1EwRkJReXhWUVVGVkxFTkJRVU1zUTBGQlF6dFRRVU5xUXp0SlFVTk1MRU5CUVVNN1NVRkhUeXc0UTBGQk5rSXNSMEZCY2tNc1ZVRkJjME1zUzBGQllTeEZRVUZGTEUxQlFXTXNSVUZCUlN4WFFVRXlRanRSUVVGb1J5eHBRa0ZsUXp0UlFXWnZSU3cwUWtGQlFTeEZRVUZCTEd0Q1FVRXlRanRSUVVVMVJpeEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMR1ZCUVdVc1NVRkJTU3hKUVVGSkxFTkJRVU1zYlVKQlFXMUNMRVZCUVVVN1dVRkRia1FzU1VGQlNTeEhRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRkZCUVZFc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNSMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhSUVVGUkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUTI1RUxFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNUMEZCVHl4RFFVRkRMRlZCUVZVc1EwRkJReXhGUVVGRkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRWRCUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRWRCUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUTJwRkxFbEJRVWtzVFVGQlRTeEhRVUZITEcxRFFVRmpMRU5CUVVNc1NVRkJTU3hEUVVGRExFMUJRVTBzUlVGQlJTeEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNN1dVRkRkRVFzYVVOQlFWa3NRMEZCUXl4TlFVRk5MRVZCUVVVc1MwRkJTeXhGUVVGRkxFMUJRVTBzUlVGQlJTeEpRVUZKTEVOQlFVTXNaMEpCUVdkQ0xFVkJRVVVzUTBGQlF5eEZRVUZGTEZkQlFWY3NRMEZCUXl4RFFVRkRPMWxCUXpORkxFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNUMEZCVHl4RFFVRkRMRlZCUVVNc1EwRkJReXhGUVVGRkxFTkJRVU03WjBKQlEzSkNMRXRCUVVrc1EwRkJReXhSUVVGUkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNTMEZCU1N4RFFVRkRMRkZCUVZFc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dG5Ra0ZEZWtRc1NVRkJTU3hEUVVGRExFTkJRVU1zVFVGQlRTeEZRVUZGTzI5Q1FVTldMRU5CUVVNc1EwRkJReXhOUVVGTkxFTkJRVU1zVlVGQlZTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenR2UWtGRGVrSXNRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhWUVVGVkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMmxDUVVNMVFqdFpRVU5NTEVOQlFVTXNRMEZCUXl4RFFVRkRPMU5CUTA0N1NVRkRUQ3hEUVVGRE8wbEJSVVFzZFVKQlFVMHNSMEZCVGp0UlFVTkpMRTlCUVU4c1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0SlFVTXpRaXhEUVVGRE8wbEJSVVFzY1VKQlFVa3NSMEZCU2p0UlFVTkpMRTlCUVU4c1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0SlFVTjZRaXhEUVVGRE8wbEJTVVFzYlVOQlFXdENMRWRCUVd4Q0xGVkJRVzFDTEZWQlFYTkNPMUZCUVhSQ0xESkNRVUZCTEVWQlFVRXNZMEZCYzBJN1VVRkRja01zU1VGQlNTeERRVUZETEdkQ1FVRm5RaXhIUVVGSExFbEJRVWtzTmtKQlFYTkNMRU5CUXpsRExFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNSMEZCUnl4RFFVRkRMRlZCUVZVc1EwRkJRenRaUVVOMlFpeFBRVUZQTEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1QwRkJUeXhEUVVGRExFTkJRVU1zVlVGQlZTeERRVUZETEVOQlFVTXNVVUZCVVN4RlFVRkZMRU5CUVVNN1VVRkRjRVFzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0SlFVTmFMRU5CUVVNN1NVRlhSQ3d3UWtGQlV5eEhRVUZVTEZWQlFWVXNTVUZCU1N4RlFVRkZMRVZCUVdNc1JVRkJSU3hKUVVGSk8xRkJRWEJDTEcxQ1FVRkJMRVZCUVVFc1RVRkJZenRSUVVNeFFpeEpRVUZKTEZGQlFWRXNSMEZCUnl4RlFVRkZMRU5CUVVNN1VVRkpiRUlzU1VGQlNTeEhRVUZITEVkQlFVY3NTVUZCU1N3MlFrRkJjMElzUTBGQlF5eEpRVUZKTEVOQlFVTXNaMEpCUVdkQ0xFTkJRVU1zUTBGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXl4RlFVRkZMRWxCUVVrc1EwRkJReXhuUWtGQlowSXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFbEJRVWtzUTBGQlF5eG5Ra0ZCWjBJc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEZRVU55U0N4TFFVRkxMRWRCUVdFc1JVRkJSU3hEUVVGRExFVkJRVVVzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXl4RlFVRkZMRVZCUTNoRUxFdEJRVXNzUjBGQllTeEZRVUZGTEVOQlFVTXNSVUZCUlN4SlFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRExFVkJRVVVzUlVGRGVFUXNTMEZCU3l4SFFVRkhMRWRCUVVjc1EwRkJReXhSUVVGUkxFTkJRVU1zUzBGQlN5eEZRVUZGTEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1MwRkJTeXhEUVVGRExFVkJRemxETEVkQlFVY3NSMEZCUnl4SFFVRkhMRU5CUVVNc1VVRkJVU3hEUVVGRExFdEJRVXNzUlVGQlJTeEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRE8xRkJRMnBFTEVkQlFVY3NRMEZCUXl4blFrRkJaMElzUTBGQlF5eExRVUZMTEVWQlFVVXNTMEZCU3l4RlFVRkZMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zUzBGQlN5eEZRVUZGTEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU03VVVGRGVrVXNTVUZCU1N4UFFVRlBMRWxCUVVrc1MwRkJTeXhYUVVGWExFVkJRVVU3V1VGRE4wSXNTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRE8xTkJRMkk3VVVGRFJDeEpRVUZKTEZOQlFWTXNSMEZCUnl4VlFVRkJMRU5CUVVNc1NVRkJTU3hQUVVGQkxFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNSVUZCUlN4RlFVRllMRU5CUVZjc1JVRkJSU3hUUVVGVExFZEJRVWNzVlVGQlFTeERRVUZETEVsQlFVa3NUMEZCUVN4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExFVkJRVVVzUlVGQldDeERRVUZYTEVWQlFVVXNUVUZCVFN4SFFVRkhMRlZCUVVFc1EwRkJReXhKUVVGSkxFOUJRVUVzUTBGQlF5eERRVUZETEUxQlFVMHNSVUZCUlN4RlFVRldMRU5CUVZVc1JVRkRjRVlzVFVGQlRTeEhRVUZITEVsQlFVa3NNRUpCUVZVc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEUxQlFVMHNSVUZCUlN4SFFVRkhMRU5CUVVNc1EwRkJReXhGUVVGRkxGTkJRVk1zUlVGQlJTeFRRVUZUTEVWQlFVVXNUVUZCVFN4RFFVRkRMRVZCUXpGRkxGbEJRVmtzUjBGQlJ5eE5RVUZOTEVOQlFVTXNhMEpCUVd0Q0xFTkJRVU1zUzBGQlN5eERRVUZETEVWQlFVVXNSVUZCUlN4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU03VVVGREwwUXNTVUZCU1N4WlFVRlpMRU5CUVVNc1RVRkJUU3hMUVVGTExFTkJRVU1zU1VGQlNTeFpRVUZaTEVOQlFVTXNUVUZCVFN4TFFVRkxMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zVFVGQlRTeEZRVUZGTzFsQlEyNUZMRWxCUVVrc1MwRkJTeXhIUVVGSExESkNRVUZsTEVOQlFVTXNTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXhYUVVGWExFVkJRVVVzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4WFFVRlhMRVZCUVVVc1JVRkJSU3hEUVVGRExFTkJRVU03V1VGRGJFWXNVVUZCVVN4SFFVRkhMRU5CUVVNc1MwRkJTeXhEUVVGRExHdENRVUZyUWl4RlFVRkZMRXRCUVVzc1EwRkJReXhWUVVGVkxFTkJRVU1zUTBGQlF6dFRRVU16UkR0aFFVRk5PMWxCUTBnc1NVRkJTU3hEUVVGRExFZEJRVWNzV1VGQldTeERRVUZETEUxQlFVMHNSMEZCUnl4RFFVRkRMRVZCUXpOQ0xFTkJRVU1zUjBGQlJ5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRmxCUVZrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSVUZETlVJc1EwRkJReXhIUVVGSExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNXVUZCV1N4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVU0xUWl4UlFVRlJMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEZkQlFWY3NRMEZCUXl4bFFVRmxMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVOdVJTeExRVUZMTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFbEJRVWtzUTBGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXp0blFrRkRka0lzVVVGQlVTeERRVUZETEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExGbEJRVmtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRelZETEZGQlFWRXNRMEZCUXl4SlFVRkpMRU5CUVVNc2MwSkJRVlVzUTBGQlF5eERRVUZETEVWQlFVVXNTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXhYUVVGWExFVkJRVVVzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXp0VFFVTTNSRHRSUVdGRUxFOUJRVThzVVVGQlVTeERRVUZETzBsQlEzQkNMRU5CUVVNN1NVRkhUU3h4UWtGQll5eEhRVUZ5UWl4VlFVRnpRaXhEUVVGelFqdFJRVU40UXl4UFFVRlBMRTlCUVU4c1EwRkJReXhEUVVGRExFMUJRVTBzUzBGQlN5eFJRVUZSTEVOQlFVTXNRMEZCUXl4RFFVRlRMRU5CUVVNc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF5eERRVUZSTEVOQlFVTXNRMEZCUXl4TlFVRlBMRU5CUVVNc1MwRkJTeXhEUVVGRE8wbEJRM0JHTEVOQlFVTTdTVUZIVFN4eFFrRkJZeXhIUVVGeVFpeFZRVUZ6UWl4RFFVRnpRanRSUVVONFF5eFBRVUZQTEU5QlFVOHNRMEZCUXl4RFFVRkRMRTFCUVUwc1MwRkJTeXhSUVVGUkxFTkJRVU1zUTBGQlF5eERRVUZUTEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJReXhEUVVGUkxFTkJRVU1zUTBGQlF5eE5RVUZQTEVOQlFVTXNTMEZCU3l4RFFVRkRPMGxCUTNCR0xFTkJRVU03U1VGSFRTeGhRVUZOTEVkQlFXSXNWVUZCWXl4RFFVRnpRanRSUVVOb1F5eFBRVUZQTEUxQlFVMHNRMEZCUXl4alFVRmpMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUjBGQlJ5eEhRVUZITEUxQlFVMHNRMEZCUXl4alFVRmpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03U1VGRGNrVXNRMEZCUXp0SlFVMU5MR2RDUVVGVExFZEJRV2hDTEZWQlFXbENMRU5CUVdVN1VVRkROVUlzU1VGQlNTeFBRVUZQTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVN1dVRkRXaXhOUVVGTkxFTkJRVU1zVjBGQlZ5eERRVUZETEVOQlFVTXNSVUZCUlN4TlFVRk5MRU5CUVVNc1ZVRkJWU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVMEZETDBNN1lVRkJUVHRaUVVOSUxFMUJRVTBzUTBGQlF5eFJRVUZSTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkRia0lzUTBGQlF5eERRVUZETEV0QlFVc3NTVUZCU1N4RFFVRkRMRU5CUVVNN1UwRkRhRUk3U1VGRFRDeERRVUZETzBsQlNXTXNaVUZCVVN4SFFVRjJRaXhWUVVGM1FpeERRVUZQTzFGQlEzSkNMRU5CUVVVc1EwRkJReXhGUVVGRkxFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTmFMRU5CUVVVc1EwRkJReXhGUVVGRkxFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0SlFVTjBRaXhEUVVGRE8wbEJTV01zYTBKQlFWY3NSMEZCTVVJc1ZVRkJNa0lzUTBGQlVTeEZRVUZGTEUxQlFXZERPMUZCUTJwRkxFbEJRVWtzVDBGQlR5eERRVUZETEVOQlFVTXNUVUZCVFN4TFFVRkxMRmRCUVZjc1JVRkJSVHRaUVVOcVF5eERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMRTlCUVU4c1EwRkJReXhWUVVGQkxFTkJRVU03WjBKQlEyUXNRMEZCUXl4RFFVRkRMRXRCUVVzc1NVRkJTU3hEUVVGRExFTkJRVU03WjBKQlEySXNUVUZCVFN4RFFVRkRMRkZCUVZFc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dG5Ra0ZEWWl4RFFVRkZMRU5CUVVNc2FVSkJRV2xDTEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhOUVVGTkxFTkJRVU1zUTBGQlF5eERRVUZETzJkQ1FVTjBReXhEUVVGRkxFTkJRVU1zYVVKQlFXbENMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eE5RVUZOTEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUTJoRUxFTkJRVU1zUTBGQlF5eERRVUZETzFOQlEwNDdVVUZEUkN4SlFVRkpMRTlCUVU4c1EwRkJReXhEUVVGRExFMUJRVTBzUzBGQlN5eFhRVUZYTEVWQlFVVTdXVUZEYWtNc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF5eFBRVUZQTEVOQlFVTXNWVUZCUVN4RFFVRkRMRWxCUVVrc1QwRkJRU3hOUVVGTkxFTkJRVU1zVjBGQlZ5eERRVUZETEVOQlFVTXNSVUZCUlN4TlFVRk5MRU5CUVVNc1JVRkJOMElzUTBGQk5rSXNRMEZCUXl4RFFVRkRPMU5CUTNoRU8wbEJRMHdzUTBGQlF6dEpRVWROTEdsQ1FVRlZMRWRCUVdwQ0xGVkJRV3RDTEVOQlFXVTdVVUZETjBJc1NVRkJTU3hQUVVGUExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVTdXVUZEV2l4UFFVRlBPMmRDUVVOSUxFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMRVZCUVVVc1JVRkJSVHRuUWtGRGFFSXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhOUVVGTkxFTkJRVU1zUlVGQlJTeEZRVUZGTzJGQlEyNUNMRU5CUVVNN1UwRkRURHRoUVVGTk8xbEJRMGdzVDBGQlR5eERRVUZETEVOQlFVTTdVMEZEV2p0SlFVTk1MRU5CUVVNN1NVRkpUU3hYUVVGSkxFZEJRVmdzVlVGQldTeERRVUZsTEVWQlFVVXNVVUZCYTBNN1VVRkRNMFFzU1VGQlNTeFBRVUZQTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVN1dVRkRXaXhKUVVGSkxFOUJRVThzUTBGQlF5eERRVUZETEUxQlFVMHNTMEZCU3l4WFFVRlhMRVZCUVVVN1owSkJRMnBETEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1QwRkJUeXhEUVVGRExGVkJRVUVzUTBGQlF6dHZRa0ZEWkN4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExGVkJRVlVzUTBGQlF5eFJRVUZSTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN2IwSkJRMmhETEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1ZVRkJWU3hEUVVGRExGRkJRVkVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0dlFrRkRNVUlzUTBGQlJTeERRVUZETEVWQlFVVXNSMEZCVXl4RFFVRkZMRU5CUVVNc2FVSkJRV2xDTEVkQlFVY3NVVUZCVVN4RFFVRkRMRU5CUVVNc1EwRkJRenR2UWtGRGFFUXNRMEZCUlN4RFFVRkRMRVZCUVVVc1IwRkJVeXhEUVVGRkxFTkJRVU1zYVVKQlFXbENMRWRCUVVjc1VVRkJVU3hEUVVGRExFTkJRVU1zUTBGQlF6dG5Ra0ZETVVRc1EwRkJReXhEUVVGRExFTkJRVU03WVVGRFRqdFpRVU5FTEVsQlFVa3NUMEZCVHl4RFFVRkRMRU5CUVVNc1RVRkJUU3hMUVVGTExGZEJRVmNzUlVGQlJUdG5Ra0ZEYWtNc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF5eFBRVUZQTEVOQlFVTXNWVUZCUVN4RFFVRkRMRWxCUVVrc1QwRkJRU3hOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNSVUZCUlN4UlFVRlJMRU5CUVVNc1JVRkJlRUlzUTBGQmQwSXNRMEZCUXl4RFFVRkRPMkZCUTI1RU8xTkJRMG83WVVGQlRUdFpRVU5ITEVOQlFVVXNRMEZCUXl4RlFVRkZMRWRCUVVjc1VVRkJVU3hEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU51UWl4RFFVRkZMRU5CUVVNc1JVRkJSU3hIUVVGSExGRkJRVkVzUTBGQlF5eERRVUZETEVOQlFVTTdVMEZETlVJN1NVRkRUQ3hEUVVGRE8wbEJTVTBzWTBGQlR5eEhRVUZrTEZWQlFXVXNRMEZCUXp0UlFVTmFMRWxCUVVrc1QwRkJUeXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTzFsQlExb3NTVUZCU1N4UFFVRlBMRU5CUVVNc1EwRkJReXhOUVVGTkxFdEJRVXNzVjBGQlZ5eEZRVUZGTzJkQ1FVTnFReXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRkJMRU5CUVVNN2IwSkJRMlFzVFVGQlRTeERRVUZETEU5QlFVOHNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenR2UWtGRGJFSXNUMEZCWVN4RFFVRkZMRU5CUVVNc2FVSkJRV2xDTEVOQlFVTTdiMEpCUTJ4RExFOUJRV0VzUTBGQlJTeERRVUZETEdsQ1FVRnBRaXhEUVVGRE8yZENRVU4wUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRoUVVOT08xbEJRMFFzU1VGQlNTeFBRVUZQTEVOQlFVTXNRMEZCUXl4TlFVRk5MRXRCUVVzc1YwRkJWeXhGUVVGRk8yZENRVU5xUXl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExFOUJRVThzUTBGQlF5eE5RVUZOTEVOQlFVTXNUMEZCVHl4RFFVRkRMRU5CUVVNN1lVRkRjRU03VTBGRFNqdGhRVUZOTzFsQlEwZ3NRMEZCUXl4RFFVRkRMRXRCUVVzc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF6dFRRVVZxUWp0SlFVTk1MRU5CUVVNN1NVRkhUU3huUWtGQlV5eEhRVUZvUWl4VlFVRnBRaXhEUVVGRE8xRkJRMlFzUTBGQlF5eERRVUZETEV0QlFVc3NTVUZCU1N4RFFVRkRMRU5CUVVNN1VVRkRZaXhEUVVGRExFTkJRVU1zUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFVkJRVVVzUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMGxCUXpOQ0xFTkJRVU03U1VGSFRTeGxRVUZSTEVkQlFXWXNWVUZCWjBJc1EwRkJRenRSUVVOaUxFTkJRVU1zUTBGQlF5eExRVUZMTEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNN1NVRkRiRUlzUTBGQlF6dEpRVU5NTEdGQlFVTTdRVUZCUkN4RFFVRkRMRUZCYkhsQ1JDeEpRV3Q1UWtNN1FVRnNlVUpaTEhkQ1FVRk5JbjA9IiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgc2hvcnRlc3RwYXRoc18xID0gcmVxdWlyZShcIi4vc2hvcnRlc3RwYXRoc1wiKTtcbnZhciBkZXNjZW50XzEgPSByZXF1aXJlKFwiLi9kZXNjZW50XCIpO1xudmFyIHJlY3RhbmdsZV8xID0gcmVxdWlyZShcIi4vcmVjdGFuZ2xlXCIpO1xudmFyIGxpbmtsZW5ndGhzXzEgPSByZXF1aXJlKFwiLi9saW5rbGVuZ3Roc1wiKTtcbnZhciBMaW5rM0QgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIExpbmszRChzb3VyY2UsIHRhcmdldCkge1xuICAgICAgICB0aGlzLnNvdXJjZSA9IHNvdXJjZTtcbiAgICAgICAgdGhpcy50YXJnZXQgPSB0YXJnZXQ7XG4gICAgfVxuICAgIExpbmszRC5wcm90b3R5cGUuYWN0dWFsTGVuZ3RoID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgcmV0dXJuIE1hdGguc3FydCh4LnJlZHVjZShmdW5jdGlvbiAoYywgdikge1xuICAgICAgICAgICAgdmFyIGR4ID0gdltfdGhpcy50YXJnZXRdIC0gdltfdGhpcy5zb3VyY2VdO1xuICAgICAgICAgICAgcmV0dXJuIGMgKyBkeCAqIGR4O1xuICAgICAgICB9LCAwKSk7XG4gICAgfTtcbiAgICByZXR1cm4gTGluazNEO1xufSgpKTtcbmV4cG9ydHMuTGluazNEID0gTGluazNEO1xudmFyIE5vZGUzRCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTm9kZTNEKHgsIHksIHopIHtcbiAgICAgICAgaWYgKHggPT09IHZvaWQgMCkgeyB4ID0gMDsgfVxuICAgICAgICBpZiAoeSA9PT0gdm9pZCAwKSB7IHkgPSAwOyB9XG4gICAgICAgIGlmICh6ID09PSB2b2lkIDApIHsgeiA9IDA7IH1cbiAgICAgICAgdGhpcy54ID0geDtcbiAgICAgICAgdGhpcy55ID0geTtcbiAgICAgICAgdGhpcy56ID0gejtcbiAgICB9XG4gICAgcmV0dXJuIE5vZGUzRDtcbn0oKSk7XG5leHBvcnRzLk5vZGUzRCA9IE5vZGUzRDtcbnZhciBMYXlvdXQzRCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTGF5b3V0M0Qobm9kZXMsIGxpbmtzLCBpZGVhbExpbmtMZW5ndGgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgaWYgKGlkZWFsTGlua0xlbmd0aCA9PT0gdm9pZCAwKSB7IGlkZWFsTGlua0xlbmd0aCA9IDE7IH1cbiAgICAgICAgdGhpcy5ub2RlcyA9IG5vZGVzO1xuICAgICAgICB0aGlzLmxpbmtzID0gbGlua3M7XG4gICAgICAgIHRoaXMuaWRlYWxMaW5rTGVuZ3RoID0gaWRlYWxMaW5rTGVuZ3RoO1xuICAgICAgICB0aGlzLmNvbnN0cmFpbnRzID0gbnVsbDtcbiAgICAgICAgdGhpcy51c2VKYWNjYXJkTGlua0xlbmd0aHMgPSB0cnVlO1xuICAgICAgICB0aGlzLnJlc3VsdCA9IG5ldyBBcnJheShMYXlvdXQzRC5rKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBMYXlvdXQzRC5rOyArK2kpIHtcbiAgICAgICAgICAgIHRoaXMucmVzdWx0W2ldID0gbmV3IEFycmF5KG5vZGVzLmxlbmd0aCk7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZXMuZm9yRWFjaChmdW5jdGlvbiAodiwgaSkge1xuICAgICAgICAgICAgZm9yICh2YXIgX2kgPSAwLCBfYSA9IExheW91dDNELmRpbXM7IF9pIDwgX2EubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRpbSA9IF9hW19pXTtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHZbZGltXSA9PSAndW5kZWZpbmVkJylcbiAgICAgICAgICAgICAgICAgICAgdltkaW1dID0gTWF0aC5yYW5kb20oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF90aGlzLnJlc3VsdFswXVtpXSA9IHYueDtcbiAgICAgICAgICAgIF90aGlzLnJlc3VsdFsxXVtpXSA9IHYueTtcbiAgICAgICAgICAgIF90aGlzLnJlc3VsdFsyXVtpXSA9IHYuejtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIDtcbiAgICBMYXlvdXQzRC5wcm90b3R5cGUubGlua0xlbmd0aCA9IGZ1bmN0aW9uIChsKSB7XG4gICAgICAgIHJldHVybiBsLmFjdHVhbExlbmd0aCh0aGlzLnJlc3VsdCk7XG4gICAgfTtcbiAgICBMYXlvdXQzRC5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbiAoaXRlcmF0aW9ucykge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICBpZiAoaXRlcmF0aW9ucyA9PT0gdm9pZCAwKSB7IGl0ZXJhdGlvbnMgPSAxMDA7IH1cbiAgICAgICAgdmFyIG4gPSB0aGlzLm5vZGVzLmxlbmd0aDtcbiAgICAgICAgdmFyIGxpbmtBY2Nlc3NvciA9IG5ldyBMaW5rQWNjZXNzb3IoKTtcbiAgICAgICAgaWYgKHRoaXMudXNlSmFjY2FyZExpbmtMZW5ndGhzKVxuICAgICAgICAgICAgbGlua2xlbmd0aHNfMS5qYWNjYXJkTGlua0xlbmd0aHModGhpcy5saW5rcywgbGlua0FjY2Vzc29yLCAxLjUpO1xuICAgICAgICB0aGlzLmxpbmtzLmZvckVhY2goZnVuY3Rpb24gKGUpIHsgcmV0dXJuIGUubGVuZ3RoICo9IF90aGlzLmlkZWFsTGlua0xlbmd0aDsgfSk7XG4gICAgICAgIHZhciBkaXN0YW5jZU1hdHJpeCA9IChuZXcgc2hvcnRlc3RwYXRoc18xLkNhbGN1bGF0b3IobiwgdGhpcy5saW5rcywgZnVuY3Rpb24gKGUpIHsgcmV0dXJuIGUuc291cmNlOyB9LCBmdW5jdGlvbiAoZSkgeyByZXR1cm4gZS50YXJnZXQ7IH0sIGZ1bmN0aW9uIChlKSB7IHJldHVybiBlLmxlbmd0aDsgfSkpLkRpc3RhbmNlTWF0cml4KCk7XG4gICAgICAgIHZhciBEID0gZGVzY2VudF8xLkRlc2NlbnQuY3JlYXRlU3F1YXJlTWF0cml4KG4sIGZ1bmN0aW9uIChpLCBqKSB7IHJldHVybiBkaXN0YW5jZU1hdHJpeFtpXVtqXTsgfSk7XG4gICAgICAgIHZhciBHID0gZGVzY2VudF8xLkRlc2NlbnQuY3JlYXRlU3F1YXJlTWF0cml4KG4sIGZ1bmN0aW9uICgpIHsgcmV0dXJuIDI7IH0pO1xuICAgICAgICB0aGlzLmxpbmtzLmZvckVhY2goZnVuY3Rpb24gKF9hKSB7XG4gICAgICAgICAgICB2YXIgc291cmNlID0gX2Euc291cmNlLCB0YXJnZXQgPSBfYS50YXJnZXQ7XG4gICAgICAgICAgICByZXR1cm4gR1tzb3VyY2VdW3RhcmdldF0gPSBHW3RhcmdldF1bc291cmNlXSA9IDE7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmRlc2NlbnQgPSBuZXcgZGVzY2VudF8xLkRlc2NlbnQodGhpcy5yZXN1bHQsIEQpO1xuICAgICAgICB0aGlzLmRlc2NlbnQudGhyZXNob2xkID0gMWUtMztcbiAgICAgICAgdGhpcy5kZXNjZW50LkcgPSBHO1xuICAgICAgICBpZiAodGhpcy5jb25zdHJhaW50cylcbiAgICAgICAgICAgIHRoaXMuZGVzY2VudC5wcm9qZWN0ID0gbmV3IHJlY3RhbmdsZV8xLlByb2plY3Rpb24odGhpcy5ub2RlcywgbnVsbCwgbnVsbCwgdGhpcy5jb25zdHJhaW50cykucHJvamVjdEZ1bmN0aW9ucygpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciB2ID0gdGhpcy5ub2Rlc1tpXTtcbiAgICAgICAgICAgIGlmICh2LmZpeGVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kZXNjZW50LmxvY2tzLmFkZChpLCBbdi54LCB2LnksIHYuel0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuZGVzY2VudC5ydW4oaXRlcmF0aW9ucyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgTGF5b3V0M0QucHJvdG90eXBlLnRpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuZGVzY2VudC5sb2Nrcy5jbGVhcigpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciB2ID0gdGhpcy5ub2Rlc1tpXTtcbiAgICAgICAgICAgIGlmICh2LmZpeGVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kZXNjZW50LmxvY2tzLmFkZChpLCBbdi54LCB2LnksIHYuel0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmRlc2NlbnQucnVuZ2VLdXR0YSgpO1xuICAgIH07XG4gICAgTGF5b3V0M0QuZGltcyA9IFsneCcsICd5JywgJ3onXTtcbiAgICBMYXlvdXQzRC5rID0gTGF5b3V0M0QuZGltcy5sZW5ndGg7XG4gICAgcmV0dXJuIExheW91dDNEO1xufSgpKTtcbmV4cG9ydHMuTGF5b3V0M0QgPSBMYXlvdXQzRDtcbnZhciBMaW5rQWNjZXNzb3IgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIExpbmtBY2Nlc3NvcigpIHtcbiAgICB9XG4gICAgTGlua0FjY2Vzc29yLnByb3RvdHlwZS5nZXRTb3VyY2VJbmRleCA9IGZ1bmN0aW9uIChlKSB7IHJldHVybiBlLnNvdXJjZTsgfTtcbiAgICBMaW5rQWNjZXNzb3IucHJvdG90eXBlLmdldFRhcmdldEluZGV4ID0gZnVuY3Rpb24gKGUpIHsgcmV0dXJuIGUudGFyZ2V0OyB9O1xuICAgIExpbmtBY2Nlc3Nvci5wcm90b3R5cGUuZ2V0TGVuZ3RoID0gZnVuY3Rpb24gKGUpIHsgcmV0dXJuIGUubGVuZ3RoOyB9O1xuICAgIExpbmtBY2Nlc3Nvci5wcm90b3R5cGUuc2V0TGVuZ3RoID0gZnVuY3Rpb24gKGUsIGwpIHsgZS5sZW5ndGggPSBsOyB9O1xuICAgIHJldHVybiBMaW5rQWNjZXNzb3I7XG59KCkpO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKbWFXeGxJam9pYkdGNWIzVjBNMlF1YW5NaUxDSnpiM1Z5WTJWU2IyOTBJam9pSWl3aWMyOTFjbU5sY3lJNld5SXVMaTh1TGk5WFpXSkRiMnhoTDNOeVl5OXNZWGx2ZFhRelpDNTBjeUpkTENKdVlXMWxjeUk2VzEwc0ltMWhjSEJwYm1keklqb2lPenRCUVVGQkxHbEVRVUV3UXp0QlFVTXhReXh4UTBGQmFVTTdRVUZEYWtNc2VVTkJRVFJFTzBGQlJUVkVMRFpEUVVGdlJUdEJRVVZ3UlR0SlFVVlJMR2RDUVVGdFFpeE5RVUZqTEVWQlFWTXNUVUZCWXp0UlFVRnlReXhYUVVGTkxFZEJRVTRzVFVGQlRTeERRVUZSTzFGQlFWTXNWMEZCVFN4SFFVRk9MRTFCUVUwc1EwRkJVVHRKUVVGSkxFTkJRVU03U1VGRE4wUXNOa0pCUVZrc1IwRkJXaXhWUVVGaExFTkJRV0U3VVVGQk1VSXNhVUpCVFVNN1VVRk1SeXhQUVVGUExFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlExb3NRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhWUVVGRExFTkJRVk1zUlVGQlJTeERRVUZYTzFsQlF6VkNMRWxCUVUwc1JVRkJSU3hIUVVGSExFTkJRVU1zUTBGQlF5eExRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFdEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXp0WlFVTXpReXhQUVVGUExFTkJRVU1zUjBGQlJ5eEZRVUZGTEVkQlFVY3NSVUZCUlN4RFFVRkRPMUZCUTNaQ0xFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMGxCUTJZc1EwRkJRenRKUVVOTUxHRkJRVU03UVVGQlJDeERRVUZETEVGQlZrd3NTVUZWU3p0QlFWWlJMSGRDUVVGTk8wRkJWMlk3U1VGVFNTeG5Ra0ZEVnl4RFFVRmhMRVZCUTJJc1EwRkJZU3hGUVVOaUxFTkJRV0U3VVVGR1lpeHJRa0ZCUVN4RlFVRkJMRXRCUVdFN1VVRkRZaXhyUWtGQlFTeEZRVUZCTEV0QlFXRTdVVUZEWWl4clFrRkJRU3hGUVVGQkxFdEJRV0U3VVVGR1lpeE5RVUZETEVkQlFVUXNRMEZCUXl4RFFVRlpPMUZCUTJJc1RVRkJReXhIUVVGRUxFTkJRVU1zUTBGQldUdFJRVU5pTEUxQlFVTXNSMEZCUkN4RFFVRkRMRU5CUVZrN1NVRkJTU3hEUVVGRE8wbEJRMnBETEdGQlFVTTdRVUZCUkN4RFFVRkRMRUZCWWtRc1NVRmhRenRCUVdKWkxIZENRVUZOTzBGQlkyNUNPMGxCVFVrc2EwSkJRVzFDTEV0QlFXVXNSVUZCVXl4TFFVRmxMRVZCUVZNc1pVRkJNa0k3VVVGQk9VWXNhVUpCWVVNN1VVRmlhMFVzWjBOQlFVRXNSVUZCUVN4dFFrRkJNa0k3VVVGQk0wVXNWVUZCU3l4SFFVRk1MRXRCUVVzc1EwRkJWVHRSUVVGVExGVkJRVXNzUjBGQlRDeExRVUZMTEVOQlFWVTdVVUZCVXl4dlFrRkJaU3hIUVVGbUxHVkJRV1VzUTBGQldUdFJRVVk1Uml4blFrRkJWeXhIUVVGVkxFbEJRVWtzUTBGQlF6dFJRWEZDTVVJc01FSkJRWEZDTEVkQlFWa3NTVUZCU1N4RFFVRkRPMUZCYkVKc1F5eEpRVUZKTEVOQlFVTXNUVUZCVFN4SFFVRkhMRWxCUVVrc1MwRkJTeXhEUVVGRExGRkJRVkVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTndReXhMUVVGTExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1VVRkJVU3hEUVVGRExFTkJRVU1zUlVGQlJTeEZRVUZGTEVOQlFVTXNSVUZCUlR0WlFVTnFReXhKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRWxCUVVrc1MwRkJTeXhEUVVGRExFdEJRVXNzUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXp0VFFVTTFRenRSUVVORUxFdEJRVXNzUTBGQlF5eFBRVUZQTEVOQlFVTXNWVUZCUXl4RFFVRkRMRVZCUVVVc1EwRkJRenRaUVVObUxFdEJRV2RDTEZWQlFXRXNSVUZCWWl4TFFVRkJMRkZCUVZFc1EwRkJReXhKUVVGSkxFVkJRV0lzWTBGQllTeEZRVUZpTEVsQlFXRXNSVUZCUlR0blFrRkJNVUlzU1VGQlNTeEhRVUZITEZOQlFVRTdaMEpCUTFJc1NVRkJTU3hQUVVGUExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4WFFVRlhPMjlDUVVGRkxFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1RVRkJUU3hGUVVGRkxFTkJRVU03WVVGRE5VUTdXVUZEUkN4TFFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRGVFSXNTMEZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRM2hDTEV0QlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVNMVFpeERRVUZETEVOQlFVTXNRMEZCUXp0SlFVTlFMRU5CUVVNN1NVRkJRU3hEUVVGRE8wbEJSVVlzTmtKQlFWVXNSMEZCVml4VlFVRlhMRU5CUVZNN1VVRkRhRUlzVDBGQlR5eERRVUZETEVOQlFVTXNXVUZCV1N4RFFVRkRMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF6dEpRVU4yUXl4RFFVRkRPMGxCUzBRc2QwSkJRVXNzUjBGQlRDeFZRVUZOTEZWQlFYZENPMUZCUVRsQ0xHbENRWFZEUXp0UlFYWkRTeXd5UWtGQlFTeEZRVUZCTEdkQ1FVRjNRanRSUVVNeFFpeEpRVUZOTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFMUJRVTBzUTBGQlF6dFJRVVUxUWl4SlFVRkpMRmxCUVZrc1IwRkJSeXhKUVVGSkxGbEJRVmtzUlVGQlJTeERRVUZETzFGQlJYUkRMRWxCUVVrc1NVRkJTU3hEUVVGRExIRkNRVUZ4UWp0WlFVTXhRaXhuUTBGQmEwSXNRMEZCUXl4SlFVRkpMRU5CUVVNc1MwRkJTeXhGUVVGRkxGbEJRVmtzUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXp0UlFVVjBSQ3hKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRkJMRU5CUVVNc1NVRkJTU3hQUVVGQkxFTkJRVU1zUTBGQlF5eE5RVUZOTEVsQlFVa3NTMEZCU1N4RFFVRkRMR1ZCUVdVc1JVRkJhRU1zUTBGQlowTXNRMEZCUXl4RFFVRkRPMUZCUnpGRUxFbEJRVTBzWTBGQll5eEhRVUZITEVOQlFVTXNTVUZCU1N3d1FrRkJWU3hEUVVGRExFTkJRVU1zUlVGQlJTeEpRVUZKTEVOQlFVTXNTMEZCU3l4RlFVTm9SQ3hWUVVGQkxFTkJRVU1zU1VGQlJ5eFBRVUZCTEVOQlFVTXNRMEZCUXl4TlFVRk5MRVZCUVZJc1EwRkJVU3hGUVVGRkxGVkJRVUVzUTBGQlF5eEpRVUZITEU5QlFVRXNRMEZCUXl4RFFVRkRMRTFCUVUwc1JVRkJVaXhEUVVGUkxFVkJRVVVzVlVGQlFTeERRVUZETEVsQlFVa3NUMEZCUVN4RFFVRkRMRU5CUVVNc1RVRkJUU3hGUVVGU0xFTkJRVkVzUTBGQlF5eERRVUZETEVOQlFVTXNZMEZCWXl4RlFVRkZMRU5CUVVNN1VVRkZha1VzU1VGQlRTeERRVUZETEVkQlFVY3NhVUpCUVU4c1EwRkJReXhyUWtGQmEwSXNRMEZCUXl4RFFVRkRMRVZCUVVVc1ZVRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEpRVUZMTEU5QlFVRXNZMEZCWXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZ3UWl4RFFVRnZRaXhEUVVGRExFTkJRVU03VVVGSmVFVXNTVUZCU1N4RFFVRkRMRWRCUVVjc2FVSkJRVThzUTBGQlF5eHJRa0ZCYTBJc1EwRkJReXhEUVVGRExFVkJRVVVzWTBGQll5eFBRVUZQTEVOQlFVTXNRMEZCUVN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRMmhGTEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1QwRkJUeXhEUVVGRExGVkJRVU1zUlVGQmEwSTdaMEpCUVdoQ0xHdENRVUZOTEVWQlFVVXNhMEpCUVUwN1dVRkJUeXhQUVVGQkxFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMRWRCUVVjc1EwRkJRenRSUVVGNlF5eERRVUY1UXl4RFFVRkRMRU5CUVVNN1VVRkZkRVlzU1VGQlNTeERRVUZETEU5QlFVOHNSMEZCUnl4SlFVRkpMR2xDUVVGUExFTkJRVU1zU1VGQlNTeERRVUZETEUxQlFVMHNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVNelF5eEpRVUZKTEVOQlFVTXNUMEZCVHl4RFFVRkRMRk5CUVZNc1IwRkJSeXhKUVVGSkxFTkJRVU03VVVGRE9VSXNTVUZCU1N4RFFVRkRMRTlCUVU4c1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETzFGQlNXNUNMRWxCUVVrc1NVRkJTU3hEUVVGRExGZEJRVmM3V1VGRGFFSXNTVUZCU1N4RFFVRkRMRTlCUVU4c1EwRkJReXhQUVVGUExFZEJRVWNzU1VGQlNTeHpRa0ZCVlN4RFFVRmpMRWxCUVVrc1EwRkJReXhMUVVGTExFVkJRVVVzU1VGQlNTeEZRVUZGTEVsQlFVa3NSVUZCUlN4SlFVRkpMRU5CUVVNc1YwRkJWeXhEUVVGRExFTkJRVU1zWjBKQlFXZENMRVZCUVVVc1EwRkJRenRSUVVWd1NDeExRVUZMTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4TlFVRk5MRVZCUVVVc1EwRkJReXhGUVVGRkxFVkJRVVU3V1VGRGVFTXNTVUZCU1N4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTjBRaXhKUVVGSkxFTkJRVU1zUTBGQlF5eExRVUZMTEVWQlFVVTdaMEpCUTFRc1NVRkJTU3hEUVVGRExFOUJRVThzUTBGQlF5eExRVUZMTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0aFFVTTVRenRUUVVOS08xRkJSVVFzU1VGQlNTeERRVUZETEU5QlFVOHNRMEZCUXl4SFFVRkhMRU5CUVVNc1ZVRkJWU3hEUVVGRExFTkJRVU03VVVGRE4wSXNUMEZCVHl4SlFVRkpMRU5CUVVNN1NVRkRhRUlzUTBGQlF6dEpRVVZFTEhWQ1FVRkpMRWRCUVVvN1VVRkRTU3hKUVVGSkxFTkJRVU1zVDBGQlR5eERRVUZETEV0QlFVc3NRMEZCUXl4TFFVRkxMRVZCUVVVc1EwRkJRenRSUVVNelFpeExRVUZMTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4TlFVRk5MRVZCUVVVc1EwRkJReXhGUVVGRkxFVkJRVVU3V1VGRGVFTXNTVUZCU1N4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTjBRaXhKUVVGSkxFTkJRVU1zUTBGQlF5eExRVUZMTEVWQlFVVTdaMEpCUTFRc1NVRkJTU3hEUVVGRExFOUJRVThzUTBGQlF5eExRVUZMTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0aFFVTTVRenRUUVVOS08xRkJRMFFzVDBGQlR5eEpRVUZKTEVOQlFVTXNUMEZCVHl4RFFVRkRMRlZCUVZVc1JVRkJSU3hEUVVGRE8wbEJRM0pETEVOQlFVTTdTVUUzUlUwc1lVRkJTU3hIUVVGSExFTkJRVU1zUjBGQlJ5eEZRVUZGTEVkQlFVY3NSVUZCUlN4SFFVRkhMRU5CUVVNc1EwRkJRenRKUVVOMlFpeFZRVUZETEVkQlFVY3NVVUZCVVN4RFFVRkRMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU03U1VFMlJYQkRMR1ZCUVVNN1EwRkJRU3hCUVM5RlJDeEpRU3RGUXp0QlFTOUZXU3cwUWtGQlVUdEJRV2xHY2tJN1NVRkJRVHRKUVV0QkxFTkJRVU03U1VGS1J5eHhRMEZCWXl4SFFVRmtMRlZCUVdVc1EwRkJUU3hKUVVGWkxFOUJRVThzUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNN1NVRkRia1FzY1VOQlFXTXNSMEZCWkN4VlFVRmxMRU5CUVUwc1NVRkJXU3hQUVVGUExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXl4RFFVRkRPMGxCUTI1RUxHZERRVUZUTEVkQlFWUXNWVUZCVlN4RFFVRk5MRWxCUVZrc1QwRkJUeXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXp0SlFVTTVReXhuUTBGQlV5eEhRVUZVTEZWQlFWVXNRMEZCVFN4RlFVRkZMRU5CUVZNc1NVRkJTU3hEUVVGRExFTkJRVU1zVFVGQlRTeEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1NVRkRiRVFzYlVKQlFVTTdRVUZCUkN4RFFVRkRMRUZCVEVRc1NVRkxReUo5IiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5mdW5jdGlvbiB1bmlvbkNvdW50KGEsIGIpIHtcbiAgICB2YXIgdSA9IHt9O1xuICAgIGZvciAodmFyIGkgaW4gYSlcbiAgICAgICAgdVtpXSA9IHt9O1xuICAgIGZvciAodmFyIGkgaW4gYilcbiAgICAgICAgdVtpXSA9IHt9O1xuICAgIHJldHVybiBPYmplY3Qua2V5cyh1KS5sZW5ndGg7XG59XG5mdW5jdGlvbiBpbnRlcnNlY3Rpb25Db3VudChhLCBiKSB7XG4gICAgdmFyIG4gPSAwO1xuICAgIGZvciAodmFyIGkgaW4gYSlcbiAgICAgICAgaWYgKHR5cGVvZiBiW2ldICE9PSAndW5kZWZpbmVkJylcbiAgICAgICAgICAgICsrbjtcbiAgICByZXR1cm4gbjtcbn1cbmZ1bmN0aW9uIGdldE5laWdoYm91cnMobGlua3MsIGxhKSB7XG4gICAgdmFyIG5laWdoYm91cnMgPSB7fTtcbiAgICB2YXIgYWRkTmVpZ2hib3VycyA9IGZ1bmN0aW9uICh1LCB2KSB7XG4gICAgICAgIGlmICh0eXBlb2YgbmVpZ2hib3Vyc1t1XSA9PT0gJ3VuZGVmaW5lZCcpXG4gICAgICAgICAgICBuZWlnaGJvdXJzW3VdID0ge307XG4gICAgICAgIG5laWdoYm91cnNbdV1bdl0gPSB7fTtcbiAgICB9O1xuICAgIGxpbmtzLmZvckVhY2goZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgdmFyIHUgPSBsYS5nZXRTb3VyY2VJbmRleChlKSwgdiA9IGxhLmdldFRhcmdldEluZGV4KGUpO1xuICAgICAgICBhZGROZWlnaGJvdXJzKHUsIHYpO1xuICAgICAgICBhZGROZWlnaGJvdXJzKHYsIHUpO1xuICAgIH0pO1xuICAgIHJldHVybiBuZWlnaGJvdXJzO1xufVxuZnVuY3Rpb24gY29tcHV0ZUxpbmtMZW5ndGhzKGxpbmtzLCB3LCBmLCBsYSkge1xuICAgIHZhciBuZWlnaGJvdXJzID0gZ2V0TmVpZ2hib3VycyhsaW5rcywgbGEpO1xuICAgIGxpbmtzLmZvckVhY2goZnVuY3Rpb24gKGwpIHtcbiAgICAgICAgdmFyIGEgPSBuZWlnaGJvdXJzW2xhLmdldFNvdXJjZUluZGV4KGwpXTtcbiAgICAgICAgdmFyIGIgPSBuZWlnaGJvdXJzW2xhLmdldFRhcmdldEluZGV4KGwpXTtcbiAgICAgICAgbGEuc2V0TGVuZ3RoKGwsIDEgKyB3ICogZihhLCBiKSk7XG4gICAgfSk7XG59XG5mdW5jdGlvbiBzeW1tZXRyaWNEaWZmTGlua0xlbmd0aHMobGlua3MsIGxhLCB3KSB7XG4gICAgaWYgKHcgPT09IHZvaWQgMCkgeyB3ID0gMTsgfVxuICAgIGNvbXB1dGVMaW5rTGVuZ3RocyhsaW5rcywgdywgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIE1hdGguc3FydCh1bmlvbkNvdW50KGEsIGIpIC0gaW50ZXJzZWN0aW9uQ291bnQoYSwgYikpOyB9LCBsYSk7XG59XG5leHBvcnRzLnN5bW1ldHJpY0RpZmZMaW5rTGVuZ3RocyA9IHN5bW1ldHJpY0RpZmZMaW5rTGVuZ3RocztcbmZ1bmN0aW9uIGphY2NhcmRMaW5rTGVuZ3RocyhsaW5rcywgbGEsIHcpIHtcbiAgICBpZiAodyA9PT0gdm9pZCAwKSB7IHcgPSAxOyB9XG4gICAgY29tcHV0ZUxpbmtMZW5ndGhzKGxpbmtzLCB3LCBmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICByZXR1cm4gTWF0aC5taW4oT2JqZWN0LmtleXMoYSkubGVuZ3RoLCBPYmplY3Qua2V5cyhiKS5sZW5ndGgpIDwgMS4xID8gMCA6IGludGVyc2VjdGlvbkNvdW50KGEsIGIpIC8gdW5pb25Db3VudChhLCBiKTtcbiAgICB9LCBsYSk7XG59XG5leHBvcnRzLmphY2NhcmRMaW5rTGVuZ3RocyA9IGphY2NhcmRMaW5rTGVuZ3RocztcbmZ1bmN0aW9uIGdlbmVyYXRlRGlyZWN0ZWRFZGdlQ29uc3RyYWludHMobiwgbGlua3MsIGF4aXMsIGxhKSB7XG4gICAgdmFyIGNvbXBvbmVudHMgPSBzdHJvbmdseUNvbm5lY3RlZENvbXBvbmVudHMobiwgbGlua3MsIGxhKTtcbiAgICB2YXIgbm9kZXMgPSB7fTtcbiAgICBjb21wb25lbnRzLmZvckVhY2goZnVuY3Rpb24gKGMsIGkpIHtcbiAgICAgICAgcmV0dXJuIGMuZm9yRWFjaChmdW5jdGlvbiAodikgeyByZXR1cm4gbm9kZXNbdl0gPSBpOyB9KTtcbiAgICB9KTtcbiAgICB2YXIgY29uc3RyYWludHMgPSBbXTtcbiAgICBsaW5rcy5mb3JFYWNoKGZ1bmN0aW9uIChsKSB7XG4gICAgICAgIHZhciB1aSA9IGxhLmdldFNvdXJjZUluZGV4KGwpLCB2aSA9IGxhLmdldFRhcmdldEluZGV4KGwpLCB1ID0gbm9kZXNbdWldLCB2ID0gbm9kZXNbdmldO1xuICAgICAgICBpZiAodSAhPT0gdikge1xuICAgICAgICAgICAgY29uc3RyYWludHMucHVzaCh7XG4gICAgICAgICAgICAgICAgYXhpczogYXhpcyxcbiAgICAgICAgICAgICAgICBsZWZ0OiB1aSxcbiAgICAgICAgICAgICAgICByaWdodDogdmksXG4gICAgICAgICAgICAgICAgZ2FwOiBsYS5nZXRNaW5TZXBhcmF0aW9uKGwpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBjb25zdHJhaW50cztcbn1cbmV4cG9ydHMuZ2VuZXJhdGVEaXJlY3RlZEVkZ2VDb25zdHJhaW50cyA9IGdlbmVyYXRlRGlyZWN0ZWRFZGdlQ29uc3RyYWludHM7XG5mdW5jdGlvbiBzdHJvbmdseUNvbm5lY3RlZENvbXBvbmVudHMobnVtVmVydGljZXMsIGVkZ2VzLCBsYSkge1xuICAgIHZhciBub2RlcyA9IFtdO1xuICAgIHZhciBpbmRleCA9IDA7XG4gICAgdmFyIHN0YWNrID0gW107XG4gICAgdmFyIGNvbXBvbmVudHMgPSBbXTtcbiAgICBmdW5jdGlvbiBzdHJvbmdDb25uZWN0KHYpIHtcbiAgICAgICAgdi5pbmRleCA9IHYubG93bGluayA9IGluZGV4Kys7XG4gICAgICAgIHN0YWNrLnB1c2godik7XG4gICAgICAgIHYub25TdGFjayA9IHRydWU7XG4gICAgICAgIGZvciAodmFyIF9pID0gMCwgX2EgPSB2Lm91dDsgX2kgPCBfYS5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgIHZhciB3ID0gX2FbX2ldO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB3LmluZGV4ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHN0cm9uZ0Nvbm5lY3Qodyk7XG4gICAgICAgICAgICAgICAgdi5sb3dsaW5rID0gTWF0aC5taW4odi5sb3dsaW5rLCB3Lmxvd2xpbmspO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAody5vblN0YWNrKSB7XG4gICAgICAgICAgICAgICAgdi5sb3dsaW5rID0gTWF0aC5taW4odi5sb3dsaW5rLCB3LmluZGV4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodi5sb3dsaW5rID09PSB2LmluZGV4KSB7XG4gICAgICAgICAgICB2YXIgY29tcG9uZW50ID0gW107XG4gICAgICAgICAgICB3aGlsZSAoc3RhY2subGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdyA9IHN0YWNrLnBvcCgpO1xuICAgICAgICAgICAgICAgIHcub25TdGFjayA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGNvbXBvbmVudC5wdXNoKHcpO1xuICAgICAgICAgICAgICAgIGlmICh3ID09PSB2KVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbXBvbmVudHMucHVzaChjb21wb25lbnQubWFwKGZ1bmN0aW9uICh2KSB7IHJldHVybiB2LmlkOyB9KSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBudW1WZXJ0aWNlczsgaSsrKSB7XG4gICAgICAgIG5vZGVzLnB1c2goeyBpZDogaSwgb3V0OiBbXSB9KTtcbiAgICB9XG4gICAgZm9yICh2YXIgX2kgPSAwLCBlZGdlc18xID0gZWRnZXM7IF9pIDwgZWRnZXNfMS5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgdmFyIGUgPSBlZGdlc18xW19pXTtcbiAgICAgICAgdmFyIHZfMSA9IG5vZGVzW2xhLmdldFNvdXJjZUluZGV4KGUpXSwgdyA9IG5vZGVzW2xhLmdldFRhcmdldEluZGV4KGUpXTtcbiAgICAgICAgdl8xLm91dC5wdXNoKHcpO1xuICAgIH1cbiAgICBmb3IgKHZhciBfYSA9IDAsIG5vZGVzXzEgPSBub2RlczsgX2EgPCBub2Rlc18xLmxlbmd0aDsgX2ErKykge1xuICAgICAgICB2YXIgdiA9IG5vZGVzXzFbX2FdO1xuICAgICAgICBpZiAodHlwZW9mIHYuaW5kZXggPT09ICd1bmRlZmluZWQnKVxuICAgICAgICAgICAgc3Ryb25nQ29ubmVjdCh2KTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbXBvbmVudHM7XG59XG5leHBvcnRzLnN0cm9uZ2x5Q29ubmVjdGVkQ29tcG9uZW50cyA9IHN0cm9uZ2x5Q29ubmVjdGVkQ29tcG9uZW50cztcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSm1hV3hsSWpvaWJHbHVhMnhsYm1kMGFITXVhbk1pTENKemIzVnlZMlZTYjI5MElqb2lJaXdpYzI5MWNtTmxjeUk2V3lJdUxpOHVMaTlYWldKRGIyeGhMM055WXk5c2FXNXJiR1Z1WjNSb2N5NTBjeUpkTENKdVlXMWxjeUk2VzEwc0ltMWhjSEJwYm1keklqb2lPenRCUVZWSkxGTkJRVk1zVlVGQlZTeERRVUZETEVOQlFVMHNSVUZCUlN4RFFVRk5PMGxCUXpsQ0xFbEJRVWtzUTBGQlF5eEhRVUZITEVWQlFVVXNRMEZCUXp0SlFVTllMRXRCUVVzc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF6dFJRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhGUVVGRkxFTkJRVU03U1VGRE0wSXNTMEZCU3l4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRE8xRkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRVZCUVVVc1EwRkJRenRKUVVNelFpeFBRVUZQTEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETzBGQlEycERMRU5CUVVNN1FVRkhSQ3hUUVVGVExHbENRVUZwUWl4RFFVRkRMRU5CUVZjc1JVRkJSU3hEUVVGWE8wbEJReTlETEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenRKUVVOV0xFdEJRVXNzU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXp0UlFVRkZMRWxCUVVrc1QwRkJUeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEV0QlFVc3NWMEZCVnp0WlFVRkZMRVZCUVVVc1EwRkJReXhEUVVGRE8wbEJRM1JFTEU5QlFVOHNRMEZCUXl4RFFVRkRPMEZCUTJJc1EwRkJRenRCUVVWRUxGTkJRVk1zWVVGQllTeERRVUZQTEV0QlFXRXNSVUZCUlN4RlFVRnpRanRKUVVNNVJDeEpRVUZKTEZWQlFWVXNSMEZCUnl4RlFVRkZMRU5CUVVNN1NVRkRjRUlzU1VGQlNTeGhRVUZoTEVkQlFVY3NWVUZCUXl4RFFVRkRMRVZCUVVVc1EwRkJRenRSUVVOeVFpeEpRVUZKTEU5QlFVOHNWVUZCVlN4RFFVRkRMRU5CUVVNc1EwRkJReXhMUVVGTExGZEJRVmM3V1VGRGNFTXNWVUZCVlN4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFVkJRVVVzUTBGQlF6dFJRVU4yUWl4VlFVRlZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NSVUZCUlN4RFFVRkRPMGxCUXpGQ0xFTkJRVU1zUTBGQlF6dEpRVU5HTEV0QlFVc3NRMEZCUXl4UFFVRlBMRU5CUVVNc1ZVRkJRU3hEUVVGRE8xRkJRMWdzU1VGQlNTeERRVUZETEVkQlFVY3NSVUZCUlN4RFFVRkRMR05CUVdNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NSVUZCUlN4RFFVRkRMR05CUVdNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU4yUkN4aFFVRmhMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETzFGQlEzQkNMR0ZCUVdFc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdTVUZEZUVJc1EwRkJReXhEUVVGRExFTkJRVU03U1VGRFNDeFBRVUZQTEZWQlFWVXNRMEZCUXp0QlFVTjBRaXhEUVVGRE8wRkJSMFFzVTBGQlV5eHJRa0ZCYTBJc1EwRkJUeXhMUVVGaExFVkJRVVVzUTBGQlV5eEZRVUZGTEVOQlFUWkNMRVZCUVVVc1JVRkJORUk3U1VGRGJrZ3NTVUZCU1N4VlFVRlZMRWRCUVVjc1lVRkJZU3hEUVVGRExFdEJRVXNzUlVGQlJTeEZRVUZGTEVOQlFVTXNRMEZCUXp0SlFVTXhReXhMUVVGTExFTkJRVU1zVDBGQlR5eERRVUZETEZWQlFVRXNRMEZCUXp0UlFVTllMRWxCUVVrc1EwRkJReXhIUVVGSExGVkJRVlVzUTBGQlF5eEZRVUZGTEVOQlFVTXNZMEZCWXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRGVrTXNTVUZCU1N4RFFVRkRMRWRCUVVjc1ZVRkJWU3hEUVVGRExFVkJRVVVzUTBGQlF5eGpRVUZqTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVONlF5eEZRVUZGTEVOQlFVTXNVMEZCVXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dEpRVU55UXl4RFFVRkRMRU5CUVVNc1EwRkJRenRCUVVOUUxFTkJRVU03UVVGTFJDeFRRVUZuUWl4M1FrRkJkMElzUTBGQlR5eExRVUZoTEVWQlFVVXNSVUZCTkVJc1JVRkJSU3hEUVVGaE8wbEJRV0lzYTBKQlFVRXNSVUZCUVN4TFFVRmhPMGxCUTNKSExHdENRVUZyUWl4RFFVRkRMRXRCUVVzc1JVRkJSU3hEUVVGRExFVkJRVVVzVlVGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4SlFVRkxMRTlCUVVFc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eFZRVUZWTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhIUVVGSExHbENRVUZwUWl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZ5UkN4RFFVRnhSQ3hGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZETzBGQlEzUkhMRU5CUVVNN1FVRkdSQ3cwUkVGRlF6dEJRVXRFTEZOQlFXZENMR3RDUVVGclFpeERRVUZQTEV0QlFXRXNSVUZCUlN4RlFVRTBRaXhGUVVGRkxFTkJRV0U3U1VGQllpeHJRa0ZCUVN4RlFVRkJMRXRCUVdFN1NVRkRMMFlzYTBKQlFXdENMRU5CUVVNc1MwRkJTeXhGUVVGRkxFTkJRVU1zUlVGQlJTeFZRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRPMUZCUXpsQ0xFOUJRVUVzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4TlFVRk5MRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEUxQlFVMHNSVUZCUlN4TlFVRk5MRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4SFFVRkhMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4cFFrRkJhVUlzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRWRCUVVjc1ZVRkJWU3hEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTTdTVUZCTjBjc1EwRkJOa2NzUlVGRE0wY3NSVUZCUlN4RFFVRkRMRU5CUVVNN1FVRkRaQ3hEUVVGRE8wRkJTa1FzWjBSQlNVTTdRVUZ2UWtRc1UwRkJaMElzSzBKQlFTdENMRU5CUVU4c1EwRkJVeXhGUVVGRkxFdEJRV0VzUlVGQlJTeEpRVUZaTEVWQlEzaEdMRVZCUVhsQ08wbEJSWHBDTEVsQlFVa3NWVUZCVlN4SFFVRkhMREpDUVVFeVFpeERRVUZETEVOQlFVTXNSVUZCUlN4TFFVRkxMRVZCUVVVc1JVRkJSU3hEUVVGRExFTkJRVU03U1VGRE0wUXNTVUZCU1N4TFFVRkxMRWRCUVVjc1JVRkJSU3hEUVVGRE8wbEJRMllzVlVGQlZTeERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRkRMRU5CUVVNc1JVRkJReXhEUVVGRE8xRkJRMjVDTEU5QlFVRXNRMEZCUXl4RFFVRkRMRTlCUVU4c1EwRkJReXhWUVVGQkxFTkJRVU1zU1VGQlNTeFBRVUZCTEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVm9zUTBGQldTeERRVUZETzBsQlFUVkNMRU5CUVRSQ0xFTkJReTlDTEVOQlFVTTdTVUZEUml4SlFVRkpMRmRCUVZjc1IwRkJWU3hGUVVGRkxFTkJRVU03U1VGRE5VSXNTMEZCU3l4RFFVRkRMRTlCUVU4c1EwRkJReXhWUVVGQkxFTkJRVU03VVVGRFdDeEpRVUZKTEVWQlFVVXNSMEZCUnl4RlFVRkZMRU5CUVVNc1kwRkJZeXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVWQlFVVXNSMEZCUnl4RlFVRkZMRU5CUVVNc1kwRkJZeXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVU53UkN4RFFVRkRMRWRCUVVjc1MwRkJTeXhEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4TFFVRkxMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU03VVVGRGFrTXNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhGUVVGRk8xbEJRMVFzVjBGQlZ5eERRVUZETEVsQlFVa3NRMEZCUXp0blFrRkRZaXhKUVVGSkxFVkJRVVVzU1VGQlNUdG5Ra0ZEVml4SlFVRkpMRVZCUVVVc1JVRkJSVHRuUWtGRFVpeExRVUZMTEVWQlFVVXNSVUZCUlR0blFrRkRWQ3hIUVVGSExFVkJRVVVzUlVGQlJTeERRVUZETEdkQ1FVRm5RaXhEUVVGRExFTkJRVU1zUTBGQlF6dGhRVU01UWl4RFFVRkRMRU5CUVVNN1UwRkRUanRKUVVOTUxFTkJRVU1zUTBGQlF5eERRVUZETzBsQlEwZ3NUMEZCVHl4WFFVRlhMRU5CUVVNN1FVRkRka0lzUTBGQlF6dEJRWFJDUkN3d1JVRnpRa003UVVGUlJDeFRRVUZuUWl3eVFrRkJNa0lzUTBGQlR5eFhRVUZ0UWl4RlFVRkZMRXRCUVdFc1JVRkJSU3hGUVVGelFqdEpRVU40Unl4SlFVRkpMRXRCUVVzc1IwRkJSeXhGUVVGRkxFTkJRVU03U1VGRFppeEpRVUZKTEV0QlFVc3NSMEZCUnl4RFFVRkRMRU5CUVVNN1NVRkRaQ3hKUVVGSkxFdEJRVXNzUjBGQlJ5eEZRVUZGTEVOQlFVTTdTVUZEWml4SlFVRkpMRlZCUVZVc1IwRkJSeXhGUVVGRkxFTkJRVU03U1VGRGNFSXNVMEZCVXl4aFFVRmhMRU5CUVVNc1EwRkJRenRSUVVWd1FpeERRVUZETEVOQlFVTXNTMEZCU3l4SFFVRkhMRU5CUVVNc1EwRkJReXhQUVVGUExFZEJRVWNzUzBGQlN5eEZRVUZGTEVOQlFVTTdVVUZET1VJc1MwRkJTeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTmtMRU5CUVVNc1EwRkJReXhQUVVGUExFZEJRVWNzU1VGQlNTeERRVUZETzFGQlIycENMRXRCUVdNc1ZVRkJTeXhGUVVGTUxFdEJRVUVzUTBGQlF5eERRVUZETEVkQlFVY3NSVUZCVEN4alFVRkxMRVZCUVV3c1NVRkJTeXhGUVVGRk8xbEJRV2hDTEVsQlFVa3NRMEZCUXl4VFFVRkJPMWxCUTA0c1NVRkJTU3hQUVVGUExFTkJRVU1zUTBGQlF5eExRVUZMTEV0QlFVc3NWMEZCVnl4RlFVRkZPMmRDUVVWb1F5eGhRVUZoTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1owSkJRMnBDTEVOQlFVTXNRMEZCUXl4UFFVRlBMRWRCUVVjc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNUMEZCVHl4RlFVRkZMRU5CUVVNc1EwRkJReXhQUVVGUExFTkJRVU1zUTBGQlF6dGhRVU01UXp0cFFrRkJUU3hKUVVGSkxFTkJRVU1zUTBGQlF5eFBRVUZQTEVWQlFVVTdaMEpCUld4Q0xFTkJRVU1zUTBGQlF5eFBRVUZQTEVkQlFVY3NTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zVDBGQlR5eEZRVUZGTEVOQlFVTXNRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJRenRoUVVNMVF6dFRRVU5LTzFGQlIwUXNTVUZCU1N4RFFVRkRMRU5CUVVNc1QwRkJUeXhMUVVGTExFTkJRVU1zUTBGQlF5eExRVUZMTEVWQlFVVTdXVUZGZGtJc1NVRkJTU3hUUVVGVExFZEJRVWNzUlVGQlJTeERRVUZETzFsQlEyNUNMRTlCUVU4c1MwRkJTeXhEUVVGRExFMUJRVTBzUlVGQlJUdG5Ra0ZEYWtJc1EwRkJReXhIUVVGSExFdEJRVXNzUTBGQlF5eEhRVUZITEVWQlFVVXNRMEZCUXp0blFrRkRhRUlzUTBGQlF5eERRVUZETEU5QlFVOHNSMEZCUnl4TFFVRkxMRU5CUVVNN1owSkJSV3hDTEZOQlFWTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03WjBKQlEyeENMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU03YjBKQlFVVXNUVUZCVFR0aFFVTjBRanRaUVVWRUxGVkJRVlVzUTBGQlF5eEpRVUZKTEVOQlFVTXNVMEZCVXl4RFFVRkRMRWRCUVVjc1EwRkJReXhWUVVGQkxFTkJRVU1zU1VGQlNTeFBRVUZCTEVOQlFVTXNRMEZCUXl4RlFVRkZMRVZCUVVvc1EwRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF6dFRRVU0zUXp0SlFVTk1MRU5CUVVNN1NVRkRSQ3hMUVVGTExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1YwRkJWeXhGUVVGRkxFTkJRVU1zUlVGQlJTeEZRVUZGTzFGQlEyeERMRXRCUVVzc1EwRkJReXhKUVVGSkxFTkJRVU1zUlVGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXl4RlFVRkZMRWRCUVVjc1JVRkJSU3hGUVVGRkxFVkJRVU1zUTBGQlF5eERRVUZETzB0QlEyaERPMGxCUTBRc1MwRkJZeXhWUVVGTExFVkJRVXdzWlVGQlN5eEZRVUZNTEcxQ1FVRkxMRVZCUVV3c1NVRkJTeXhGUVVGRk8xRkJRV2hDTEVsQlFVa3NRMEZCUXl4alFVRkJPMUZCUTA0c1NVRkJTU3hIUVVGRExFZEJRVWNzUzBGQlN5eERRVUZETEVWQlFVVXNRMEZCUXl4alFVRmpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGREwwSXNRMEZCUXl4SFFVRkhMRXRCUVVzc1EwRkJReXhGUVVGRkxFTkJRVU1zWTBGQll5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRjRU1zUjBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03UzBGRGFrSTdTVUZEUkN4TFFVRmpMRlZCUVVzc1JVRkJUQ3hsUVVGTExFVkJRVXdzYlVKQlFVc3NSVUZCVEN4SlFVRkxPMUZCUVdRc1NVRkJTU3hEUVVGRExHTkJRVUU3VVVGQlZ5eEpRVUZKTEU5QlFVOHNRMEZCUXl4RFFVRkRMRXRCUVVzc1MwRkJTeXhYUVVGWE8xbEJRVVVzWVVGQllTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMHRCUVVFN1NVRkRNVVVzVDBGQlR5eFZRVUZWTEVOQlFVTTdRVUZEZEVJc1EwRkJRenRCUVdoRVJDeHJSVUZuUkVNaWZRPT0iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBQb3dlckVkZ2UgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFBvd2VyRWRnZShzb3VyY2UsIHRhcmdldCwgdHlwZSkge1xuICAgICAgICB0aGlzLnNvdXJjZSA9IHNvdXJjZTtcbiAgICAgICAgdGhpcy50YXJnZXQgPSB0YXJnZXQ7XG4gICAgICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgfVxuICAgIHJldHVybiBQb3dlckVkZ2U7XG59KCkpO1xuZXhwb3J0cy5Qb3dlckVkZ2UgPSBQb3dlckVkZ2U7XG52YXIgQ29uZmlndXJhdGlvbiA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQ29uZmlndXJhdGlvbihuLCBlZGdlcywgbGlua0FjY2Vzc29yLCByb290R3JvdXApIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdGhpcy5saW5rQWNjZXNzb3IgPSBsaW5rQWNjZXNzb3I7XG4gICAgICAgIHRoaXMubW9kdWxlcyA9IG5ldyBBcnJheShuKTtcbiAgICAgICAgdGhpcy5yb290cyA9IFtdO1xuICAgICAgICBpZiAocm9vdEdyb3VwKSB7XG4gICAgICAgICAgICB0aGlzLmluaXRNb2R1bGVzRnJvbUdyb3VwKHJvb3RHcm91cCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnJvb3RzLnB1c2gobmV3IE1vZHVsZVNldCgpKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgKytpKVxuICAgICAgICAgICAgICAgIHRoaXMucm9vdHNbMF0uYWRkKHRoaXMubW9kdWxlc1tpXSA9IG5ldyBNb2R1bGUoaSkpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuUiA9IGVkZ2VzLmxlbmd0aDtcbiAgICAgICAgZWRnZXMuZm9yRWFjaChmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgdmFyIHMgPSBfdGhpcy5tb2R1bGVzW2xpbmtBY2Nlc3Nvci5nZXRTb3VyY2VJbmRleChlKV0sIHQgPSBfdGhpcy5tb2R1bGVzW2xpbmtBY2Nlc3Nvci5nZXRUYXJnZXRJbmRleChlKV0sIHR5cGUgPSBsaW5rQWNjZXNzb3IuZ2V0VHlwZShlKTtcbiAgICAgICAgICAgIHMub3V0Z29pbmcuYWRkKHR5cGUsIHQpO1xuICAgICAgICAgICAgdC5pbmNvbWluZy5hZGQodHlwZSwgcyk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBDb25maWd1cmF0aW9uLnByb3RvdHlwZS5pbml0TW9kdWxlc0Zyb21Hcm91cCA9IGZ1bmN0aW9uIChncm91cCkge1xuICAgICAgICB2YXIgbW9kdWxlU2V0ID0gbmV3IE1vZHVsZVNldCgpO1xuICAgICAgICB0aGlzLnJvb3RzLnB1c2gobW9kdWxlU2V0KTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBncm91cC5sZWF2ZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIHZhciBub2RlID0gZ3JvdXAubGVhdmVzW2ldO1xuICAgICAgICAgICAgdmFyIG1vZHVsZSA9IG5ldyBNb2R1bGUobm9kZS5pZCk7XG4gICAgICAgICAgICB0aGlzLm1vZHVsZXNbbm9kZS5pZF0gPSBtb2R1bGU7XG4gICAgICAgICAgICBtb2R1bGVTZXQuYWRkKG1vZHVsZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGdyb3VwLmdyb3Vwcykge1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBncm91cC5ncm91cHMubGVuZ3RoOyArK2opIHtcbiAgICAgICAgICAgICAgICB2YXIgY2hpbGQgPSBncm91cC5ncm91cHNbal07XG4gICAgICAgICAgICAgICAgdmFyIGRlZmluaXRpb24gPSB7fTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBwcm9wIGluIGNoaWxkKVxuICAgICAgICAgICAgICAgICAgICBpZiAocHJvcCAhPT0gXCJsZWF2ZXNcIiAmJiBwcm9wICE9PSBcImdyb3Vwc1wiICYmIGNoaWxkLmhhc093blByb3BlcnR5KHByb3ApKVxuICAgICAgICAgICAgICAgICAgICAgICAgZGVmaW5pdGlvbltwcm9wXSA9IGNoaWxkW3Byb3BdO1xuICAgICAgICAgICAgICAgIG1vZHVsZVNldC5hZGQobmV3IE1vZHVsZSgtMSAtIGosIG5ldyBMaW5rU2V0cygpLCBuZXcgTGlua1NldHMoKSwgdGhpcy5pbml0TW9kdWxlc0Zyb21Hcm91cChjaGlsZCksIGRlZmluaXRpb24pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbW9kdWxlU2V0O1xuICAgIH07XG4gICAgQ29uZmlndXJhdGlvbi5wcm90b3R5cGUubWVyZ2UgPSBmdW5jdGlvbiAoYSwgYiwgaykge1xuICAgICAgICBpZiAoayA9PT0gdm9pZCAwKSB7IGsgPSAwOyB9XG4gICAgICAgIHZhciBpbkludCA9IGEuaW5jb21pbmcuaW50ZXJzZWN0aW9uKGIuaW5jb21pbmcpLCBvdXRJbnQgPSBhLm91dGdvaW5nLmludGVyc2VjdGlvbihiLm91dGdvaW5nKTtcbiAgICAgICAgdmFyIGNoaWxkcmVuID0gbmV3IE1vZHVsZVNldCgpO1xuICAgICAgICBjaGlsZHJlbi5hZGQoYSk7XG4gICAgICAgIGNoaWxkcmVuLmFkZChiKTtcbiAgICAgICAgdmFyIG0gPSBuZXcgTW9kdWxlKHRoaXMubW9kdWxlcy5sZW5ndGgsIG91dEludCwgaW5JbnQsIGNoaWxkcmVuKTtcbiAgICAgICAgdGhpcy5tb2R1bGVzLnB1c2gobSk7XG4gICAgICAgIHZhciB1cGRhdGUgPSBmdW5jdGlvbiAocywgaSwgbykge1xuICAgICAgICAgICAgcy5mb3JBbGwoZnVuY3Rpb24gKG1zLCBsaW5rdHlwZSkge1xuICAgICAgICAgICAgICAgIG1zLmZvckFsbChmdW5jdGlvbiAobikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbmxzID0gbltpXTtcbiAgICAgICAgICAgICAgICAgICAgbmxzLmFkZChsaW5rdHlwZSwgbSk7XG4gICAgICAgICAgICAgICAgICAgIG5scy5yZW1vdmUobGlua3R5cGUsIGEpO1xuICAgICAgICAgICAgICAgICAgICBubHMucmVtb3ZlKGxpbmt0eXBlLCBiKTtcbiAgICAgICAgICAgICAgICAgICAgYVtvXS5yZW1vdmUobGlua3R5cGUsIG4pO1xuICAgICAgICAgICAgICAgICAgICBiW29dLnJlbW92ZShsaW5rdHlwZSwgbik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgdXBkYXRlKG91dEludCwgXCJpbmNvbWluZ1wiLCBcIm91dGdvaW5nXCIpO1xuICAgICAgICB1cGRhdGUoaW5JbnQsIFwib3V0Z29pbmdcIiwgXCJpbmNvbWluZ1wiKTtcbiAgICAgICAgdGhpcy5SIC09IGluSW50LmNvdW50KCkgKyBvdXRJbnQuY291bnQoKTtcbiAgICAgICAgdGhpcy5yb290c1trXS5yZW1vdmUoYSk7XG4gICAgICAgIHRoaXMucm9vdHNba10ucmVtb3ZlKGIpO1xuICAgICAgICB0aGlzLnJvb3RzW2tdLmFkZChtKTtcbiAgICAgICAgcmV0dXJuIG07XG4gICAgfTtcbiAgICBDb25maWd1cmF0aW9uLnByb3RvdHlwZS5yb290TWVyZ2VzID0gZnVuY3Rpb24gKGspIHtcbiAgICAgICAgaWYgKGsgPT09IHZvaWQgMCkgeyBrID0gMDsgfVxuICAgICAgICB2YXIgcnMgPSB0aGlzLnJvb3RzW2tdLm1vZHVsZXMoKTtcbiAgICAgICAgdmFyIG4gPSBycy5sZW5ndGg7XG4gICAgICAgIHZhciBtZXJnZXMgPSBuZXcgQXJyYXkobiAqIChuIC0gMSkpO1xuICAgICAgICB2YXIgY3RyID0gMDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlfID0gbiAtIDE7IGkgPCBpXzsgKytpKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gaSArIDE7IGogPCBuOyArK2opIHtcbiAgICAgICAgICAgICAgICB2YXIgYSA9IHJzW2ldLCBiID0gcnNbal07XG4gICAgICAgICAgICAgICAgbWVyZ2VzW2N0cl0gPSB7IGlkOiBjdHIsIG5FZGdlczogdGhpcy5uRWRnZXMoYSwgYiksIGE6IGEsIGI6IGIgfTtcbiAgICAgICAgICAgICAgICBjdHIrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWVyZ2VzO1xuICAgIH07XG4gICAgQ29uZmlndXJhdGlvbi5wcm90b3R5cGUuZ3JlZWR5TWVyZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5yb290cy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgaWYgKHRoaXMucm9vdHNbaV0ubW9kdWxlcygpLmxlbmd0aCA8IDIpXG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB2YXIgbXMgPSB0aGlzLnJvb3RNZXJnZXMoaSkuc29ydChmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYS5uRWRnZXMgPT0gYi5uRWRnZXMgPyBhLmlkIC0gYi5pZCA6IGEubkVkZ2VzIC0gYi5uRWRnZXM7IH0pO1xuICAgICAgICAgICAgdmFyIG0gPSBtc1swXTtcbiAgICAgICAgICAgIGlmIChtLm5FZGdlcyA+PSB0aGlzLlIpXG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB0aGlzLm1lcmdlKG0uYSwgbS5iLCBpKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBDb25maWd1cmF0aW9uLnByb3RvdHlwZS5uRWRnZXMgPSBmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICB2YXIgaW5JbnQgPSBhLmluY29taW5nLmludGVyc2VjdGlvbihiLmluY29taW5nKSwgb3V0SW50ID0gYS5vdXRnb2luZy5pbnRlcnNlY3Rpb24oYi5vdXRnb2luZyk7XG4gICAgICAgIHJldHVybiB0aGlzLlIgLSBpbkludC5jb3VudCgpIC0gb3V0SW50LmNvdW50KCk7XG4gICAgfTtcbiAgICBDb25maWd1cmF0aW9uLnByb3RvdHlwZS5nZXRHcm91cEhpZXJhcmNoeSA9IGZ1bmN0aW9uIChyZXRhcmdldGVkRWRnZXMpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIGdyb3VwcyA9IFtdO1xuICAgICAgICB2YXIgcm9vdCA9IHt9O1xuICAgICAgICB0b0dyb3Vwcyh0aGlzLnJvb3RzWzBdLCByb290LCBncm91cHMpO1xuICAgICAgICB2YXIgZXMgPSB0aGlzLmFsbEVkZ2VzKCk7XG4gICAgICAgIGVzLmZvckVhY2goZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIHZhciBhID0gX3RoaXMubW9kdWxlc1tlLnNvdXJjZV07XG4gICAgICAgICAgICB2YXIgYiA9IF90aGlzLm1vZHVsZXNbZS50YXJnZXRdO1xuICAgICAgICAgICAgcmV0YXJnZXRlZEVkZ2VzLnB1c2gobmV3IFBvd2VyRWRnZSh0eXBlb2YgYS5naWQgPT09IFwidW5kZWZpbmVkXCIgPyBlLnNvdXJjZSA6IGdyb3Vwc1thLmdpZF0sIHR5cGVvZiBiLmdpZCA9PT0gXCJ1bmRlZmluZWRcIiA/IGUudGFyZ2V0IDogZ3JvdXBzW2IuZ2lkXSwgZS50eXBlKSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZ3JvdXBzO1xuICAgIH07XG4gICAgQ29uZmlndXJhdGlvbi5wcm90b3R5cGUuYWxsRWRnZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBlcyA9IFtdO1xuICAgICAgICBDb25maWd1cmF0aW9uLmdldEVkZ2VzKHRoaXMucm9vdHNbMF0sIGVzKTtcbiAgICAgICAgcmV0dXJuIGVzO1xuICAgIH07XG4gICAgQ29uZmlndXJhdGlvbi5nZXRFZGdlcyA9IGZ1bmN0aW9uIChtb2R1bGVzLCBlcykge1xuICAgICAgICBtb2R1bGVzLmZvckFsbChmdW5jdGlvbiAobSkge1xuICAgICAgICAgICAgbS5nZXRFZGdlcyhlcyk7XG4gICAgICAgICAgICBDb25maWd1cmF0aW9uLmdldEVkZ2VzKG0uY2hpbGRyZW4sIGVzKTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICByZXR1cm4gQ29uZmlndXJhdGlvbjtcbn0oKSk7XG5leHBvcnRzLkNvbmZpZ3VyYXRpb24gPSBDb25maWd1cmF0aW9uO1xuZnVuY3Rpb24gdG9Hcm91cHMobW9kdWxlcywgZ3JvdXAsIGdyb3Vwcykge1xuICAgIG1vZHVsZXMuZm9yQWxsKGZ1bmN0aW9uIChtKSB7XG4gICAgICAgIGlmIChtLmlzTGVhZigpKSB7XG4gICAgICAgICAgICBpZiAoIWdyb3VwLmxlYXZlcylcbiAgICAgICAgICAgICAgICBncm91cC5sZWF2ZXMgPSBbXTtcbiAgICAgICAgICAgIGdyb3VwLmxlYXZlcy5wdXNoKG0uaWQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIGcgPSBncm91cDtcbiAgICAgICAgICAgIG0uZ2lkID0gZ3JvdXBzLmxlbmd0aDtcbiAgICAgICAgICAgIGlmICghbS5pc0lzbGFuZCgpIHx8IG0uaXNQcmVkZWZpbmVkKCkpIHtcbiAgICAgICAgICAgICAgICBnID0geyBpZDogbS5naWQgfTtcbiAgICAgICAgICAgICAgICBpZiAobS5pc1ByZWRlZmluZWQoKSlcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBtLmRlZmluaXRpb24pXG4gICAgICAgICAgICAgICAgICAgICAgICBnW3Byb3BdID0gbS5kZWZpbml0aW9uW3Byb3BdO1xuICAgICAgICAgICAgICAgIGlmICghZ3JvdXAuZ3JvdXBzKVxuICAgICAgICAgICAgICAgICAgICBncm91cC5ncm91cHMgPSBbXTtcbiAgICAgICAgICAgICAgICBncm91cC5ncm91cHMucHVzaChtLmdpZCk7XG4gICAgICAgICAgICAgICAgZ3JvdXBzLnB1c2goZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0b0dyb3VwcyhtLmNoaWxkcmVuLCBnLCBncm91cHMpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG52YXIgTW9kdWxlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBNb2R1bGUoaWQsIG91dGdvaW5nLCBpbmNvbWluZywgY2hpbGRyZW4sIGRlZmluaXRpb24pIHtcbiAgICAgICAgaWYgKG91dGdvaW5nID09PSB2b2lkIDApIHsgb3V0Z29pbmcgPSBuZXcgTGlua1NldHMoKTsgfVxuICAgICAgICBpZiAoaW5jb21pbmcgPT09IHZvaWQgMCkgeyBpbmNvbWluZyA9IG5ldyBMaW5rU2V0cygpOyB9XG4gICAgICAgIGlmIChjaGlsZHJlbiA9PT0gdm9pZCAwKSB7IGNoaWxkcmVuID0gbmV3IE1vZHVsZVNldCgpOyB9XG4gICAgICAgIHRoaXMuaWQgPSBpZDtcbiAgICAgICAgdGhpcy5vdXRnb2luZyA9IG91dGdvaW5nO1xuICAgICAgICB0aGlzLmluY29taW5nID0gaW5jb21pbmc7XG4gICAgICAgIHRoaXMuY2hpbGRyZW4gPSBjaGlsZHJlbjtcbiAgICAgICAgdGhpcy5kZWZpbml0aW9uID0gZGVmaW5pdGlvbjtcbiAgICB9XG4gICAgTW9kdWxlLnByb3RvdHlwZS5nZXRFZGdlcyA9IGZ1bmN0aW9uIChlcykge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB0aGlzLm91dGdvaW5nLmZvckFsbChmdW5jdGlvbiAobXMsIGVkZ2V0eXBlKSB7XG4gICAgICAgICAgICBtcy5mb3JBbGwoZnVuY3Rpb24gKHRhcmdldCkge1xuICAgICAgICAgICAgICAgIGVzLnB1c2gobmV3IFBvd2VyRWRnZShfdGhpcy5pZCwgdGFyZ2V0LmlkLCBlZGdldHlwZSkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgTW9kdWxlLnByb3RvdHlwZS5pc0xlYWYgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNoaWxkcmVuLmNvdW50KCkgPT09IDA7XG4gICAgfTtcbiAgICBNb2R1bGUucHJvdG90eXBlLmlzSXNsYW5kID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vdXRnb2luZy5jb3VudCgpID09PSAwICYmIHRoaXMuaW5jb21pbmcuY291bnQoKSA9PT0gMDtcbiAgICB9O1xuICAgIE1vZHVsZS5wcm90b3R5cGUuaXNQcmVkZWZpbmVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdHlwZW9mIHRoaXMuZGVmaW5pdGlvbiAhPT0gXCJ1bmRlZmluZWRcIjtcbiAgICB9O1xuICAgIHJldHVybiBNb2R1bGU7XG59KCkpO1xuZXhwb3J0cy5Nb2R1bGUgPSBNb2R1bGU7XG5mdW5jdGlvbiBpbnRlcnNlY3Rpb24obSwgbikge1xuICAgIHZhciBpID0ge307XG4gICAgZm9yICh2YXIgdiBpbiBtKVxuICAgICAgICBpZiAodiBpbiBuKVxuICAgICAgICAgICAgaVt2XSA9IG1bdl07XG4gICAgcmV0dXJuIGk7XG59XG52YXIgTW9kdWxlU2V0ID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBNb2R1bGVTZXQoKSB7XG4gICAgICAgIHRoaXMudGFibGUgPSB7fTtcbiAgICB9XG4gICAgTW9kdWxlU2V0LnByb3RvdHlwZS5jb3VudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMudGFibGUpLmxlbmd0aDtcbiAgICB9O1xuICAgIE1vZHVsZVNldC5wcm90b3R5cGUuaW50ZXJzZWN0aW9uID0gZnVuY3Rpb24gKG90aGVyKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSBuZXcgTW9kdWxlU2V0KCk7XG4gICAgICAgIHJlc3VsdC50YWJsZSA9IGludGVyc2VjdGlvbih0aGlzLnRhYmxlLCBvdGhlci50YWJsZSk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgICBNb2R1bGVTZXQucHJvdG90eXBlLmludGVyc2VjdGlvbkNvdW50ID0gZnVuY3Rpb24gKG90aGVyKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmludGVyc2VjdGlvbihvdGhlcikuY291bnQoKTtcbiAgICB9O1xuICAgIE1vZHVsZVNldC5wcm90b3R5cGUuY29udGFpbnMgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgcmV0dXJuIGlkIGluIHRoaXMudGFibGU7XG4gICAgfTtcbiAgICBNb2R1bGVTZXQucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uIChtKSB7XG4gICAgICAgIHRoaXMudGFibGVbbS5pZF0gPSBtO1xuICAgIH07XG4gICAgTW9kdWxlU2V0LnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbiAobSkge1xuICAgICAgICBkZWxldGUgdGhpcy50YWJsZVttLmlkXTtcbiAgICB9O1xuICAgIE1vZHVsZVNldC5wcm90b3R5cGUuZm9yQWxsID0gZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgZm9yICh2YXIgbWlkIGluIHRoaXMudGFibGUpIHtcbiAgICAgICAgICAgIGYodGhpcy50YWJsZVttaWRdKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgTW9kdWxlU2V0LnByb3RvdHlwZS5tb2R1bGVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdnMgPSBbXTtcbiAgICAgICAgdGhpcy5mb3JBbGwoZnVuY3Rpb24gKG0pIHtcbiAgICAgICAgICAgIGlmICghbS5pc1ByZWRlZmluZWQoKSlcbiAgICAgICAgICAgICAgICB2cy5wdXNoKG0pO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHZzO1xuICAgIH07XG4gICAgcmV0dXJuIE1vZHVsZVNldDtcbn0oKSk7XG5leHBvcnRzLk1vZHVsZVNldCA9IE1vZHVsZVNldDtcbnZhciBMaW5rU2V0cyA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTGlua1NldHMoKSB7XG4gICAgICAgIHRoaXMuc2V0cyA9IHt9O1xuICAgICAgICB0aGlzLm4gPSAwO1xuICAgIH1cbiAgICBMaW5rU2V0cy5wcm90b3R5cGUuY291bnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm47XG4gICAgfTtcbiAgICBMaW5rU2V0cy5wcm90b3R5cGUuY29udGFpbnMgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmZvckFsbE1vZHVsZXMoZnVuY3Rpb24gKG0pIHtcbiAgICAgICAgICAgIGlmICghcmVzdWx0ICYmIG0uaWQgPT0gaWQpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICAgIExpbmtTZXRzLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiAobGlua3R5cGUsIG0pIHtcbiAgICAgICAgdmFyIHMgPSBsaW5rdHlwZSBpbiB0aGlzLnNldHMgPyB0aGlzLnNldHNbbGlua3R5cGVdIDogdGhpcy5zZXRzW2xpbmt0eXBlXSA9IG5ldyBNb2R1bGVTZXQoKTtcbiAgICAgICAgcy5hZGQobSk7XG4gICAgICAgICsrdGhpcy5uO1xuICAgIH07XG4gICAgTGlua1NldHMucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIChsaW5rdHlwZSwgbSkge1xuICAgICAgICB2YXIgbXMgPSB0aGlzLnNldHNbbGlua3R5cGVdO1xuICAgICAgICBtcy5yZW1vdmUobSk7XG4gICAgICAgIGlmIChtcy5jb3VudCgpID09PSAwKSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5zZXRzW2xpbmt0eXBlXTtcbiAgICAgICAgfVxuICAgICAgICAtLXRoaXMubjtcbiAgICB9O1xuICAgIExpbmtTZXRzLnByb3RvdHlwZS5mb3JBbGwgPSBmdW5jdGlvbiAoZikge1xuICAgICAgICBmb3IgKHZhciBsaW5rdHlwZSBpbiB0aGlzLnNldHMpIHtcbiAgICAgICAgICAgIGYodGhpcy5zZXRzW2xpbmt0eXBlXSwgTnVtYmVyKGxpbmt0eXBlKSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIExpbmtTZXRzLnByb3RvdHlwZS5mb3JBbGxNb2R1bGVzID0gZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgdGhpcy5mb3JBbGwoZnVuY3Rpb24gKG1zLCBsdCkgeyByZXR1cm4gbXMuZm9yQWxsKGYpOyB9KTtcbiAgICB9O1xuICAgIExpbmtTZXRzLnByb3RvdHlwZS5pbnRlcnNlY3Rpb24gPSBmdW5jdGlvbiAob3RoZXIpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IG5ldyBMaW5rU2V0cygpO1xuICAgICAgICB0aGlzLmZvckFsbChmdW5jdGlvbiAobXMsIGx0KSB7XG4gICAgICAgICAgICBpZiAobHQgaW4gb3RoZXIuc2V0cykge1xuICAgICAgICAgICAgICAgIHZhciBpID0gbXMuaW50ZXJzZWN0aW9uKG90aGVyLnNldHNbbHRdKSwgbiA9IGkuY291bnQoKTtcbiAgICAgICAgICAgICAgICBpZiAobiA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnNldHNbbHRdID0gaTtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0Lm4gKz0gbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gICAgcmV0dXJuIExpbmtTZXRzO1xufSgpKTtcbmV4cG9ydHMuTGlua1NldHMgPSBMaW5rU2V0cztcbmZ1bmN0aW9uIGludGVyc2VjdGlvbkNvdW50KG0sIG4pIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXMoaW50ZXJzZWN0aW9uKG0sIG4pKS5sZW5ndGg7XG59XG5mdW5jdGlvbiBnZXRHcm91cHMobm9kZXMsIGxpbmtzLCBsYSwgcm9vdEdyb3VwKSB7XG4gICAgdmFyIG4gPSBub2Rlcy5sZW5ndGgsIGMgPSBuZXcgQ29uZmlndXJhdGlvbihuLCBsaW5rcywgbGEsIHJvb3RHcm91cCk7XG4gICAgd2hpbGUgKGMuZ3JlZWR5TWVyZ2UoKSlcbiAgICAgICAgO1xuICAgIHZhciBwb3dlckVkZ2VzID0gW107XG4gICAgdmFyIGcgPSBjLmdldEdyb3VwSGllcmFyY2h5KHBvd2VyRWRnZXMpO1xuICAgIHBvd2VyRWRnZXMuZm9yRWFjaChmdW5jdGlvbiAoZSkge1xuICAgICAgICB2YXIgZiA9IGZ1bmN0aW9uIChlbmQpIHtcbiAgICAgICAgICAgIHZhciBnID0gZVtlbmRdO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBnID09IFwibnVtYmVyXCIpXG4gICAgICAgICAgICAgICAgZVtlbmRdID0gbm9kZXNbZ107XG4gICAgICAgIH07XG4gICAgICAgIGYoXCJzb3VyY2VcIik7XG4gICAgICAgIGYoXCJ0YXJnZXRcIik7XG4gICAgfSk7XG4gICAgcmV0dXJuIHsgZ3JvdXBzOiBnLCBwb3dlckVkZ2VzOiBwb3dlckVkZ2VzIH07XG59XG5leHBvcnRzLmdldEdyb3VwcyA9IGdldEdyb3Vwcztcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSm1hV3hsSWpvaWNHOTNaWEpuY21Gd2FDNXFjeUlzSW5OdmRYSmpaVkp2YjNRaU9pSWlMQ0p6YjNWeVkyVnpJanBiSWk0dUx5NHVMMWRsWWtOdmJHRXZjM0pqTDNCdmQyVnlaM0poY0dndWRITWlYU3dpYm1GdFpYTWlPbHRkTENKdFlYQndhVzVuY3lJNklqczdRVUZQU1R0SlFVTkpMRzFDUVVOWExFMUJRVmNzUlVGRFdDeE5RVUZYTEVWQlExZ3NTVUZCV1R0UlFVWmFMRmRCUVUwc1IwRkJUaXhOUVVGTkxFTkJRVXM3VVVGRFdDeFhRVUZOTEVkQlFVNHNUVUZCVFN4RFFVRkxPMUZCUTFnc1UwRkJTU3hIUVVGS0xFbEJRVWtzUTBGQlVUdEpRVUZKTEVOQlFVTTdTVUZEYUVNc1owSkJRVU03UVVGQlJDeERRVUZETEVGQlRFUXNTVUZMUXp0QlFVeFpMRGhDUVVGVE8wRkJUM1JDTzBsQlUwa3NkVUpCUVZrc1EwRkJVeXhGUVVGRkxFdEJRV0VzUlVGQlZTeFpRVUZ2UXl4RlFVRkZMRk5CUVdsQ08xRkJRWEpITEdsQ1FXdENRenRSUVd4Q05rTXNhVUpCUVZrc1IwRkJXaXhaUVVGWkxFTkJRWGRDTzFGQlF6bEZMRWxCUVVrc1EwRkJReXhQUVVGUExFZEJRVWNzU1VGQlNTeExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkROVUlzU1VGQlNTeERRVUZETEV0QlFVc3NSMEZCUnl4RlFVRkZMRU5CUVVNN1VVRkRhRUlzU1VGQlNTeFRRVUZUTEVWQlFVVTdXVUZEV0N4SlFVRkpMRU5CUVVNc2IwSkJRVzlDTEVOQlFVTXNVMEZCVXl4RFFVRkRMRU5CUVVNN1UwRkRlRU03WVVGQlRUdFpRVU5JTEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1NVRkJTU3hEUVVGRExFbEJRVWtzVTBGQlV5eEZRVUZGTEVOQlFVTXNRMEZCUXp0WlFVTnFReXhMUVVGTExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF6dG5Ra0ZEZEVJc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExFOUJRVThzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4SlFVRkpMRTFCUVUwc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFOQlF6RkVPMUZCUTBRc1NVRkJTU3hEUVVGRExFTkJRVU1zUjBGQlJ5eExRVUZMTEVOQlFVTXNUVUZCVFN4RFFVRkRPMUZCUTNSQ0xFdEJRVXNzUTBGQlF5eFBRVUZQTEVOQlFVTXNWVUZCUVN4RFFVRkRPMWxCUTFnc1NVRkJTU3hEUVVGRExFZEJRVWNzUzBGQlNTeERRVUZETEU5QlFVOHNRMEZCUXl4WlFVRlpMRU5CUVVNc1kwRkJZeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlEyaEVMRU5CUVVNc1IwRkJSeXhMUVVGSkxFTkJRVU1zVDBGQlR5eERRVUZETEZsQlFWa3NRMEZCUXl4alFVRmpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGRGFFUXNTVUZCU1N4SFFVRkhMRmxCUVZrc1EwRkJReXhQUVVGUExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEYmtNc1EwRkJReXhEUVVGRExGRkJRVkVzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRM2hDTEVOQlFVTXNRMEZCUXl4UlFVRlJMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTTFRaXhEUVVGRExFTkJRVU1zUTBGQlF6dEpRVU5RTEVOQlFVTTdTVUZGVHl3MFEwRkJiMElzUjBGQk5VSXNWVUZCTmtJc1MwRkJTenRSUVVNNVFpeEpRVUZKTEZOQlFWTXNSMEZCUnl4SlFVRkpMRk5CUVZNc1JVRkJSU3hEUVVGRE8xRkJRMmhETEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1NVRkJTU3hEUVVGRExGTkJRVk1zUTBGQlF5eERRVUZETzFGQlF6TkNMRXRCUVVzc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4TFFVRkxMRU5CUVVNc1RVRkJUU3hEUVVGRExFMUJRVTBzUlVGQlJTeEZRVUZGTEVOQlFVTXNSVUZCUlR0WlFVTXhReXhKUVVGSkxFbEJRVWtzUjBGQlJ5eExRVUZMTEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRek5DTEVsQlFVa3NUVUZCVFN4SFFVRkhMRWxCUVVrc1RVRkJUU3hEUVVGRExFbEJRVWtzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXp0WlFVTnFReXhKUVVGSkxFTkJRVU1zVDBGQlR5eERRVUZETEVsQlFVa3NRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhOUVVGTkxFTkJRVU03V1VGREwwSXNVMEZCVXl4RFFVRkRMRWRCUVVjc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF6dFRRVU42UWp0UlFVTkVMRWxCUVVrc1MwRkJTeXhEUVVGRExFMUJRVTBzUlVGQlJUdFpRVU5rTEV0QlFVc3NTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eExRVUZMTEVOQlFVTXNUVUZCVFN4RFFVRkRMRTFCUVUwc1JVRkJSU3hGUVVGRkxFTkJRVU1zUlVGQlJUdG5Ra0ZETVVNc1NVRkJTU3hMUVVGTExFZEJRVWNzUzBGQlN5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRuUWtGRk5VSXNTVUZCU1N4VlFVRlZMRWRCUVVjc1JVRkJSU3hEUVVGRE8yZENRVU53UWl4TFFVRkxMRWxCUVVrc1NVRkJTU3hKUVVGSkxFdEJRVXM3YjBKQlEyeENMRWxCUVVrc1NVRkJTU3hMUVVGTExGRkJRVkVzU1VGQlNTeEpRVUZKTEV0QlFVc3NVVUZCVVN4SlFVRkpMRXRCUVVzc1EwRkJReXhqUVVGakxFTkJRVU1zU1VGQlNTeERRVUZETzNkQ1FVTndSU3hWUVVGVkxFTkJRVU1zU1VGQlNTeERRVUZETEVkQlFVY3NTMEZCU3l4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRE8yZENRVVYyUXl4VFFVRlRMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkRMRU5CUVVNc1JVRkJSU3hKUVVGSkxGRkJRVkVzUlVGQlJTeEZRVUZGTEVsQlFVa3NVVUZCVVN4RlFVRkZMRVZCUVVVc1NVRkJTU3hEUVVGRExHOUNRVUZ2UWl4RFFVRkRMRXRCUVVzc1EwRkJReXhGUVVGRkxGVkJRVlVzUTBGQlF5eERRVUZETEVOQlFVTTdZVUZEYWtnN1UwRkRTanRSUVVORUxFOUJRVThzVTBGQlV5eERRVUZETzBsQlEzQkNMRU5CUVVNN1NVRkhSaXcyUWtGQlN5eEhRVUZNTEZWQlFVMHNRMEZCVXl4RlFVRkZMRU5CUVZNc1JVRkJSU3hEUVVGaE8xRkJRV0lzYTBKQlFVRXNSVUZCUVN4TFFVRmhPMUZCUTNKRExFbEJRVWtzUzBGQlN5eEhRVUZITEVOQlFVTXNRMEZCUXl4UlFVRlJMRU5CUVVNc1dVRkJXU3hEUVVGRExFTkJRVU1zUTBGQlF5eFJRVUZSTEVOQlFVTXNSVUZETTBNc1RVRkJUU3hIUVVGSExFTkJRVU1zUTBGQlF5eFJRVUZSTEVOQlFVTXNXVUZCV1N4RFFVRkRMRU5CUVVNc1EwRkJReXhSUVVGUkxFTkJRVU1zUTBGQlF6dFJRVU5xUkN4SlFVRkpMRkZCUVZFc1IwRkJSeXhKUVVGSkxGTkJRVk1zUlVGQlJTeERRVUZETzFGQlF5OUNMRkZCUVZFc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEYUVJc1VVRkJVU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTm9RaXhKUVVGSkxFTkJRVU1zUjBGQlJ5eEpRVUZKTEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNc1QwRkJUeXhEUVVGRExFMUJRVTBzUlVGQlJTeE5RVUZOTEVWQlFVVXNTMEZCU3l4RlFVRkZMRkZCUVZFc1EwRkJReXhEUVVGRE8xRkJRMnBGTEVsQlFVa3NRMEZCUXl4UFFVRlBMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlEzSkNMRWxCUVVrc1RVRkJUU3hIUVVGSExGVkJRVU1zUTBGQlZ5eEZRVUZGTEVOQlFWTXNSVUZCUlN4RFFVRlRPMWxCUXpORExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNWVUZCUXl4RlFVRkZMRVZCUVVVc1VVRkJVVHRuUWtGRGJFSXNSVUZCUlN4RFFVRkRMRTFCUVUwc1EwRkJReXhWUVVGQkxFTkJRVU03YjBKQlExQXNTVUZCU1N4SFFVRkhMRWRCUVdFc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzI5Q1FVTjZRaXhIUVVGSExFTkJRVU1zUjBGQlJ5eERRVUZETEZGQlFWRXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJRenR2UWtGRGNrSXNSMEZCUnl4RFFVRkRMRTFCUVUwc1EwRkJReXhSUVVGUkxFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdiMEpCUTNoQ0xFZEJRVWNzUTBGQlF5eE5RVUZOTEVOQlFVTXNVVUZCVVN4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRE8yOUNRVU5pTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVVc1EwRkJReXhOUVVGTkxFTkJRVU1zVVVGQlVTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMjlDUVVNeFFpeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkZMRU5CUVVNc1RVRkJUU3hEUVVGRExGRkJRVkVzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXp0blFrRkRla01zUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEVUN4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOUUxFTkJRVU1zUTBGQlF6dFJRVU5HTEUxQlFVMHNRMEZCUXl4TlFVRk5MRVZCUVVVc1ZVRkJWU3hGUVVGRkxGVkJRVlVzUTBGQlF5eERRVUZETzFGQlEzWkRMRTFCUVUwc1EwRkJReXhMUVVGTExFVkJRVVVzVlVGQlZTeEZRVUZGTEZWQlFWVXNRMEZCUXl4RFFVRkRPMUZCUTNSRExFbEJRVWtzUTBGQlF5eERRVUZETEVsQlFVa3NTMEZCU3l4RFFVRkRMRXRCUVVzc1JVRkJSU3hIUVVGSExFMUJRVTBzUTBGQlF5eExRVUZMTEVWQlFVVXNRMEZCUXp0UlFVTjZReXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU40UWl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVONFFpeEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTnlRaXhQUVVGUExFTkJRVU1zUTBGQlF6dEpRVU5pTEVOQlFVTTdTVUZGVHl4clEwRkJWU3hIUVVGc1FpeFZRVUZ0UWl4RFFVRmhPMUZCUVdJc2EwSkJRVUVzUlVGQlFTeExRVUZoTzFGQlRUVkNMRWxCUVVrc1JVRkJSU3hIUVVGSExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU03VVVGRGFrTXNTVUZCU1N4RFFVRkRMRWRCUVVjc1JVRkJSU3hEUVVGRExFMUJRVTBzUTBGQlF6dFJRVU5zUWl4SlFVRkpMRTFCUVUwc1IwRkJSeXhKUVVGSkxFdEJRVXNzUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU53UXl4SlFVRkpMRWRCUVVjc1IwRkJSeXhEUVVGRExFTkJRVU03VVVGRFdpeExRVUZMTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hGUVVGRkxFZEJRVWNzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1JVRkJSU3hGUVVGRkxFVkJRVVVzUTBGQlF5eEZRVUZGTzFsQlEzSkRMRXRCUVVzc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEhRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF5eEZRVUZGTzJkQ1FVTXhRaXhKUVVGSkxFTkJRVU1zUjBGQlJ5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhIUVVGSExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0blFrRkRla0lzVFVGQlRTeERRVUZETEVkQlFVY3NRMEZCUXl4SFFVRkhMRVZCUVVVc1JVRkJSU3hGUVVGRkxFZEJRVWNzUlVGQlJTeE5RVUZOTEVWQlFVVXNTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTTdaMEpCUTJwRkxFZEJRVWNzUlVGQlJTeERRVUZETzJGQlExUTdVMEZEU2p0UlFVTkVMRTlCUVU4c1RVRkJUU3hEUVVGRE8wbEJRMnhDTEVOQlFVTTdTVUZGUkN4dFEwRkJWeXhIUVVGWU8xRkJRMGtzUzBGQlN5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNUVUZCVFN4RlFVRkZMRVZCUVVVc1EwRkJReXhGUVVGRk8xbEJSWGhETEVsQlFVa3NTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eFBRVUZQTEVWQlFVVXNRMEZCUXl4TlFVRk5MRWRCUVVjc1EwRkJRenRuUWtGQlJTeFRRVUZUTzFsQlIycEVMRWxCUVVrc1JVRkJSU3hIUVVGSExFbEJRVWtzUTBGQlF5eFZRVUZWTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExGVkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNTVUZCU3l4UFFVRkJMRU5CUVVNc1EwRkJReXhOUVVGTkxFbEJRVWtzUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUjBGQlJ5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zVFVGQlRTeEhRVUZITEVOQlFVTXNRMEZCUXl4TlFVRk5MRVZCUVhoRUxFTkJRWGRFTEVOQlFVTXNRMEZCUXp0WlFVTnlSeXhKUVVGSkxFTkJRVU1zUjBGQlJ5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkRaQ3hKUVVGSkxFTkJRVU1zUTBGQlF5eE5RVUZOTEVsQlFVa3NTVUZCU1N4RFFVRkRMRU5CUVVNN1owSkJRVVVzVTBGQlV6dFpRVU5xUXl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU40UWl4UFFVRlBMRWxCUVVrc1EwRkJRenRUUVVObU8wbEJRMHdzUTBGQlF6dEpRVVZQTERoQ1FVRk5MRWRCUVdRc1ZVRkJaU3hEUVVGVExFVkJRVVVzUTBGQlV6dFJRVU12UWl4SlFVRkpMRXRCUVVzc1IwRkJSeXhEUVVGRExFTkJRVU1zVVVGQlVTeERRVUZETEZsQlFWa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1VVRkJVU3hEUVVGRExFVkJRek5ETEUxQlFVMHNSMEZCUnl4RFFVRkRMRU5CUVVNc1VVRkJVU3hEUVVGRExGbEJRVmtzUTBGQlF5eERRVUZETEVOQlFVTXNVVUZCVVN4RFFVRkRMRU5CUVVNN1VVRkRha1FzVDBGQlR5eEpRVUZKTEVOQlFVTXNRMEZCUXl4SFFVRkhMRXRCUVVzc1EwRkJReXhMUVVGTExFVkJRVVVzUjBGQlJ5eE5RVUZOTEVOQlFVTXNTMEZCU3l4RlFVRkZMRU5CUVVNN1NVRkRia1FzUTBGQlF6dEpRVVZFTEhsRFFVRnBRaXhIUVVGcVFpeFZRVUZyUWl4bFFVRTBRanRSUVVFNVF5eHBRa0ZsUXp0UlFXUkhMRWxCUVVrc1RVRkJUU3hIUVVGSExFVkJRVVVzUTBGQlF6dFJRVU5vUWl4SlFVRkpMRWxCUVVrc1IwRkJSeXhGUVVGRkxFTkJRVU03VVVGRFpDeFJRVUZSTEVOQlFVTXNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeEpRVUZKTEVWQlFVVXNUVUZCVFN4RFFVRkRMRU5CUVVNN1VVRkRkRU1zU1VGQlNTeEZRVUZGTEVkQlFVY3NTVUZCU1N4RFFVRkRMRkZCUVZFc1JVRkJSU3hEUVVGRE8xRkJRM3BDTEVWQlFVVXNRMEZCUXl4UFFVRlBMRU5CUVVNc1ZVRkJRU3hEUVVGRE8xbEJRMUlzU1VGQlNTeERRVUZETEVkQlFVY3NTMEZCU1N4RFFVRkRMRTlCUVU4c1EwRkJReXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTTdXVUZETDBJc1NVRkJTU3hEUVVGRExFZEJRVWNzUzBGQlNTeERRVUZETEU5QlFVOHNRMEZCUXl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU03V1VGREwwSXNaVUZCWlN4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxGTkJRVk1zUTBGRE9VSXNUMEZCVHl4RFFVRkRMRU5CUVVNc1IwRkJSeXhMUVVGTExGZEJRVmNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkRka1FzVDBGQlR5eERRVUZETEVOQlFVTXNSMEZCUnl4TFFVRkxMRmRCUVZjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZEZGtRc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGRFZDeERRVUZETEVOQlFVTTdVVUZEVUN4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOSUxFOUJRVThzVFVGQlRTeERRVUZETzBsQlEyeENMRU5CUVVNN1NVRkZSQ3huUTBGQlVTeEhRVUZTTzFGQlEwa3NTVUZCU1N4RlFVRkZMRWRCUVVjc1JVRkJSU3hEUVVGRE8xRkJRMW9zWVVGQllTeERRVUZETEZGQlFWRXNRMEZCUXl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXl4RFFVRkRPMUZCUXpGRExFOUJRVThzUlVGQlJTeERRVUZETzBsQlEyUXNRMEZCUXp0SlFVVk5MSE5DUVVGUkxFZEJRV1lzVlVGQlowSXNUMEZCYTBJc1JVRkJSU3hGUVVGbE8xRkJReTlETEU5QlFVOHNRMEZCUXl4TlFVRk5MRU5CUVVNc1ZVRkJRU3hEUVVGRE8xbEJRMW9zUTBGQlF5eERRVUZETEZGQlFWRXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJRenRaUVVObUxHRkJRV0VzUTBGQlF5eFJRVUZSTEVOQlFVTXNRMEZCUXl4RFFVRkRMRkZCUVZFc1JVRkJSU3hGUVVGRkxFTkJRVU1zUTBGQlF6dFJRVU16UXl4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVOUUxFTkJRVU03U1VGRFRDeHZRa0ZCUXp0QlFVRkVMRU5CUVVNc1FVRjRTa1FzU1VGM1NrTTdRVUY0U2xrc2MwTkJRV0U3UVVFd1NqRkNMRk5CUVZNc1VVRkJVU3hEUVVGRExFOUJRV3RDTEVWQlFVVXNTMEZCU3l4RlFVRkZMRTFCUVUwN1NVRkRMME1zVDBGQlR5eERRVUZETEUxQlFVMHNRMEZCUXl4VlFVRkJMRU5CUVVNN1VVRkRXaXhKUVVGSkxFTkJRVU1zUTBGQlF5eE5RVUZOTEVWQlFVVXNSVUZCUlR0WlFVTmFMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zVFVGQlRUdG5Ra0ZCUlN4TFFVRkxMRU5CUVVNc1RVRkJUU3hIUVVGSExFVkJRVVVzUTBGQlF6dFpRVU55UXl4TFFVRkxMRU5CUVVNc1RVRkJUU3hEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNN1UwRkRNMEk3WVVGQlRUdFpRVU5JTEVsQlFVa3NRMEZCUXl4SFFVRkhMRXRCUVVzc1EwRkJRenRaUVVOa0xFTkJRVU1zUTBGQlF5eEhRVUZITEVkQlFVY3NUVUZCVFN4RFFVRkRMRTFCUVUwc1EwRkJRenRaUVVOMFFpeEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRkZCUVZFc1JVRkJSU3hKUVVGSkxFTkJRVU1zUTBGQlF5eFpRVUZaTEVWQlFVVXNSVUZCUlR0blFrRkRia01zUTBGQlF5eEhRVUZITEVWQlFVVXNSVUZCUlN4RlFVRkZMRU5CUVVNc1EwRkJReXhIUVVGSExFVkJRVVVzUTBGQlF6dG5Ra0ZEYkVJc1NVRkJTU3hEUVVGRExFTkJRVU1zV1VGQldTeEZRVUZGTzI5Q1FVVm9RaXhMUVVGTExFbEJRVWtzU1VGQlNTeEpRVUZKTEVOQlFVTXNRMEZCUXl4VlFVRlZPM2RDUVVONlFpeERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExGVkJRVlVzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXp0blFrRkRja01zU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4TlFVRk5PMjlDUVVGRkxFdEJRVXNzUTBGQlF5eE5RVUZOTEVkQlFVY3NSVUZCUlN4RFFVRkRPMmRDUVVOeVF5eExRVUZMTEVOQlFVTXNUVUZCVFN4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTTdaMEpCUTNwQ0xFMUJRVTBzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1lVRkRiRUk3V1VGRFJDeFJRVUZSTEVOQlFVTXNRMEZCUXl4RFFVRkRMRkZCUVZFc1JVRkJSU3hEUVVGRExFVkJRVVVzVFVGQlRTeERRVUZETEVOQlFVTTdVMEZEYmtNN1NVRkRUQ3hEUVVGRExFTkJRVU1zUTBGQlF6dEJRVU5RTEVOQlFVTTdRVUZGUkR0SlFVZEpMR2RDUVVOWExFVkJRVlVzUlVGRFZpeFJRVUZ0UXl4RlFVTnVReXhSUVVGdFF5eEZRVU51UXl4UlFVRnhReXhGUVVOeVF5eFZRVUZuUWp0UlFVaG9RaXg1UWtGQlFTeEZRVUZCTEdWQlFYbENMRkZCUVZFc1JVRkJSVHRSUVVOdVF5eDVRa0ZCUVN4RlFVRkJMR1ZCUVhsQ0xGRkJRVkVzUlVGQlJUdFJRVU51UXl4NVFrRkJRU3hGUVVGQkxHVkJRVEJDTEZOQlFWTXNSVUZCUlR0UlFVaHlReXhQUVVGRkxFZEJRVVlzUlVGQlJTeERRVUZSTzFGQlExWXNZVUZCVVN4SFFVRlNMRkZCUVZFc1EwRkJNa0k3VVVGRGJrTXNZVUZCVVN4SFFVRlNMRkZCUVZFc1EwRkJNa0k3VVVGRGJrTXNZVUZCVVN4SFFVRlNMRkZCUVZFc1EwRkJOa0k3VVVGRGNrTXNaVUZCVlN4SFFVRldMRlZCUVZVc1EwRkJUVHRKUVVGSkxFTkJRVU03U1VGRmFFTXNlVUpCUVZFc1IwRkJVaXhWUVVGVExFVkJRV1U3VVVGQmVFSXNhVUpCVFVNN1VVRk1SeXhKUVVGSkxFTkJRVU1zVVVGQlVTeERRVUZETEUxQlFVMHNRMEZCUXl4VlFVRkRMRVZCUVVVc1JVRkJSU3hSUVVGUk8xbEJRemxDTEVWQlFVVXNRMEZCUXl4TlFVRk5MRU5CUVVNc1ZVRkJRU3hOUVVGTk8yZENRVU5hTEVWQlFVVXNRMEZCUXl4SlFVRkpMRU5CUVVNc1NVRkJTU3hUUVVGVExFTkJRVU1zUzBGQlNTeERRVUZETEVWQlFVVXNSVUZCUlN4TlFVRk5MRU5CUVVNc1JVRkJSU3hGUVVGRkxGRkJRVkVzUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEZWtRc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRFVDeERRVUZETEVOQlFVTXNRMEZCUXp0SlFVTlFMRU5CUVVNN1NVRkZSQ3gxUWtGQlRTeEhRVUZPTzFGQlEwa3NUMEZCVHl4SlFVRkpMRU5CUVVNc1VVRkJVU3hEUVVGRExFdEJRVXNzUlVGQlJTeExRVUZMTEVOQlFVTXNRMEZCUXp0SlFVTjJReXhEUVVGRE8wbEJSVVFzZVVKQlFWRXNSMEZCVWp0UlFVTkpMRTlCUVU4c1NVRkJTU3hEUVVGRExGRkJRVkVzUTBGQlF5eExRVUZMTEVWQlFVVXNTMEZCU3l4RFFVRkRMRWxCUVVrc1NVRkJTU3hEUVVGRExGRkJRVkVzUTBGQlF5eExRVUZMTEVWQlFVVXNTMEZCU3l4RFFVRkRMRU5CUVVNN1NVRkRkRVVzUTBGQlF6dEpRVVZFTERaQ1FVRlpMRWRCUVZvN1VVRkRTU3hQUVVGUExFOUJRVThzU1VGQlNTeERRVUZETEZWQlFWVXNTMEZCU3l4WFFVRlhMRU5CUVVNN1NVRkRiRVFzUTBGQlF6dEpRVU5NTEdGQlFVTTdRVUZCUkN4RFFVRkRMRUZCTjBKRUxFbEJOa0pETzBGQk4wSlpMSGRDUVVGTk8wRkJLMEp1UWl4VFFVRlRMRmxCUVZrc1EwRkJReXhEUVVGTkxFVkJRVVVzUTBGQlRUdEpRVU5vUXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhGUVVGRkxFTkJRVU03U1VGRFdDeExRVUZMTEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNN1VVRkJSU3hKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETzFsQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0SlFVTjZReXhQUVVGUExFTkJRVU1zUTBGQlF6dEJRVU5pTEVOQlFVTTdRVUZGUkR0SlFVRkJPMUZCUTBrc1ZVRkJTeXhIUVVGUkxFVkJRVVVzUTBGQlF6dEpRV3REY0VJc1EwRkJRenRKUVdwRFJ5eDVRa0ZCU3l4SFFVRk1PMUZCUTBrc1QwRkJUeXhOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhOUVVGTkxFTkJRVU03U1VGRE1VTXNRMEZCUXp0SlFVTkVMR2REUVVGWkxFZEJRVm9zVlVGQllTeExRVUZuUWp0UlFVTjZRaXhKUVVGSkxFMUJRVTBzUjBGQlJ5eEpRVUZKTEZOQlFWTXNSVUZCUlN4RFFVRkRPMUZCUXpkQ0xFMUJRVTBzUTBGQlF5eExRVUZMTEVkQlFVY3NXVUZCV1N4RFFVRkRMRWxCUVVrc1EwRkJReXhMUVVGTExFVkJRVVVzUzBGQlN5eERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRPMUZCUTNKRUxFOUJRVThzVFVGQlRTeERRVUZETzBsQlEyeENMRU5CUVVNN1NVRkRSQ3h4UTBGQmFVSXNSMEZCYWtJc1ZVRkJhMElzUzBGQlowSTdVVUZET1VJc1QwRkJUeXhKUVVGSkxFTkJRVU1zV1VGQldTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRXRCUVVzc1JVRkJSU3hEUVVGRE8wbEJRelZETEVOQlFVTTdTVUZEUkN3MFFrRkJVU3hIUVVGU0xGVkJRVk1zUlVGQlZUdFJRVU5tTEU5QlFVOHNSVUZCUlN4SlFVRkpMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU03U1VGRE5VSXNRMEZCUXp0SlFVTkVMSFZDUVVGSExFZEJRVWdzVlVGQlNTeERRVUZUTzFGQlExUXNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPMGxCUTNwQ0xFTkJRVU03U1VGRFJDd3dRa0ZCVFN4SFFVRk9MRlZCUVU4c1EwRkJVenRSUVVOYUxFOUJRVThzU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU03U1VGRE5VSXNRMEZCUXp0SlFVTkVMREJDUVVGTkxFZEJRVTRzVlVGQlR5eERRVUZ6UWp0UlFVTjZRaXhMUVVGTExFbEJRVWtzUjBGQlJ5eEpRVUZKTEVsQlFVa3NRMEZCUXl4TFFVRkxMRVZCUVVVN1dVRkRlRUlzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF6dFRRVU4wUWp0SlFVTk1MRU5CUVVNN1NVRkRSQ3d5UWtGQlR5eEhRVUZRTzFGQlEwa3NTVUZCU1N4RlFVRkZMRWRCUVVjc1JVRkJSU3hEUVVGRE8xRkJRMW9zU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4VlFVRkJMRU5CUVVNN1dVRkRWQ3hKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEZsQlFWa3NSVUZCUlR0blFrRkRha0lzUlVGQlJTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOdVFpeERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTklMRTlCUVU4c1JVRkJSU3hEUVVGRE8wbEJRMlFzUTBGQlF6dEpRVU5NTEdkQ1FVRkRPMEZCUVVRc1EwRkJReXhCUVc1RFJDeEpRVzFEUXp0QlFXNURXU3c0UWtGQlV6dEJRWEZEZEVJN1NVRkJRVHRSUVVOSkxGTkJRVWtzUjBGQlVTeEZRVUZGTEVOQlFVTTdVVUZEWml4TlFVRkRMRWRCUVZjc1EwRkJReXhEUVVGRE8wbEJaMFJzUWl4RFFVRkRPMGxCTDBOSExIZENRVUZMTEVkQlFVdzdVVUZEU1N4UFFVRlBMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU03U1VGRGJFSXNRMEZCUXp0SlFVTkVMREpDUVVGUkxFZEJRVklzVlVGQlV5eEZRVUZWTzFGQlEyWXNTVUZCU1N4TlFVRk5MRWRCUVVjc1MwRkJTeXhEUVVGRE8xRkJRMjVDTEVsQlFVa3NRMEZCUXl4aFFVRmhMRU5CUVVNc1ZVRkJRU3hEUVVGRE8xbEJRMmhDTEVsQlFVa3NRMEZCUXl4TlFVRk5MRWxCUVVrc1EwRkJReXhEUVVGRExFVkJRVVVzU1VGQlNTeEZRVUZGTEVWQlFVVTdaMEpCUTNaQ0xFMUJRVTBzUjBGQlJ5eEpRVUZKTEVOQlFVTTdZVUZEYWtJN1VVRkRUQ3hEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU5JTEU5QlFVOHNUVUZCVFN4RFFVRkRPMGxCUTJ4Q0xFTkJRVU03U1VGRFJDeHpRa0ZCUnl4SFFVRklMRlZCUVVrc1VVRkJaMElzUlVGQlJTeERRVUZUTzFGQlF6TkNMRWxCUVVrc1EwRkJReXhIUVVGakxGRkJRVkVzU1VGQlNTeEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEZGQlFWRXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEZGQlFWRXNRMEZCUXl4SFFVRkhMRWxCUVVrc1UwRkJVeXhGUVVGRkxFTkJRVU03VVVGRGRrY3NRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU5VTEVWQlFVVXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVOaUxFTkJRVU03U1VGRFJDeDVRa0ZCVFN4SFFVRk9MRlZCUVU4c1VVRkJaMElzUlVGQlJTeERRVUZUTzFGQlF6bENMRWxCUVVrc1JVRkJSU3hIUVVGakxFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNVVUZCVVN4RFFVRkRMRU5CUVVNN1VVRkRlRU1zUlVGQlJTeERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOaUxFbEJRVWtzUlVGQlJTeERRVUZETEV0QlFVc3NSVUZCUlN4TFFVRkxMRU5CUVVNc1JVRkJSVHRaUVVOc1FpeFBRVUZQTEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1VVRkJVU3hEUVVGRExFTkJRVU03VTBGRE9VSTdVVUZEUkN4RlFVRkZMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU03U1VGRFlpeERRVUZETzBsQlEwUXNlVUpCUVUwc1IwRkJUaXhWUVVGUExFTkJRVFJETzFGQlF5OURMRXRCUVVzc1NVRkJTU3hSUVVGUkxFbEJRVWtzU1VGQlNTeERRVUZETEVsQlFVa3NSVUZCUlR0WlFVTTFRaXhEUVVGRExFTkJRVmtzU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4UlFVRlJMRU5CUVVNc1JVRkJSU3hOUVVGTkxFTkJRVU1zVVVGQlVTeERRVUZETEVOQlFVTXNRMEZCUXp0VFFVTjJSRHRKUVVOTUxFTkJRVU03U1VGRFJDeG5RMEZCWVN4SFFVRmlMRlZCUVdNc1EwRkJjMEk3VVVGRGFFTXNTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXhWUVVGRExFVkJRVVVzUlVGQlJTeEZRVUZGTEVsQlFVc3NUMEZCUVN4RlFVRkZMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZhTEVOQlFWa3NRMEZCUXl4RFFVRkRPMGxCUXpGRExFTkJRVU03U1VGRFJDd3JRa0ZCV1N4SFFVRmFMRlZCUVdFc1MwRkJaVHRSUVVONFFpeEpRVUZKTEUxQlFVMHNSMEZCWVN4SlFVRkpMRkZCUVZFc1JVRkJSU3hEUVVGRE8xRkJRM1JETEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1ZVRkJReXhGUVVGRkxFVkJRVVVzUlVGQlJUdFpRVU5tTEVsQlFVa3NSVUZCUlN4SlFVRkpMRXRCUVVzc1EwRkJReXhKUVVGSkxFVkJRVVU3WjBKQlEyeENMRWxCUVVrc1EwRkJReXhIUVVGSExFVkJRVVVzUTBGQlF5eFpRVUZaTEVOQlFVTXNTMEZCU3l4RFFVRkRMRWxCUVVrc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eEZRVU51UXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFdEJRVXNzUlVGQlJTeERRVUZETzJkQ1FVTnNRaXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVTdiMEpCUTFBc1RVRkJUU3hEUVVGRExFbEJRVWtzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN2IwSkJRM0JDTEUxQlFVMHNRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRE8ybENRVU5xUWp0aFFVTktPMUZCUTB3c1EwRkJReXhEUVVGRExFTkJRVU03VVVGRFNDeFBRVUZQTEUxQlFVMHNRMEZCUXp0SlFVTnNRaXhEUVVGRE8wbEJRMHdzWlVGQlF6dEJRVUZFTEVOQlFVTXNRVUZzUkVRc1NVRnJSRU03UVVGc1JGa3NORUpCUVZFN1FVRnZSSEpDTEZOQlFWTXNhVUpCUVdsQ0xFTkJRVU1zUTBGQlRTeEZRVUZGTEVOQlFVMDdTVUZEY2tNc1QwRkJUeXhOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETEZsQlFWa3NRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVRTdRVUZEYWtRc1EwRkJRenRCUVVWRUxGTkJRV2RDTEZOQlFWTXNRMEZCVHl4TFFVRlpMRVZCUVVVc1MwRkJZU3hGUVVGRkxFVkJRVEJDTEVWQlFVVXNVMEZCYVVJN1NVRkRkRWNzU1VGQlNTeERRVUZETEVkQlFVY3NTMEZCU3l4RFFVRkRMRTFCUVUwc1JVRkRhRUlzUTBGQlF5eEhRVUZITEVsQlFVa3NZVUZCWVN4RFFVRkRMRU5CUVVNc1JVRkJSU3hMUVVGTExFVkJRVVVzUlVGQlJTeEZRVUZGTEZOQlFWTXNRMEZCUXl4RFFVRkRPMGxCUTI1RUxFOUJRVThzUTBGQlF5eERRVUZETEZkQlFWY3NSVUZCUlR0UlFVRkRMRU5CUVVNN1NVRkRlRUlzU1VGQlNTeFZRVUZWTEVkQlFXZENMRVZCUVVVc1EwRkJRenRKUVVOcVF5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc2FVSkJRV2xDTEVOQlFVTXNWVUZCVlN4RFFVRkRMRU5CUVVNN1NVRkRlRU1zVlVGQlZTeERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRlZMRU5CUVVNN1VVRkRNVUlzU1VGQlNTeERRVUZETEVkQlFVY3NWVUZCUXl4SFFVRkhPMWxCUTFJc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPMWxCUTJZc1NVRkJTU3hQUVVGUExFTkJRVU1zU1VGQlNTeFJRVUZSTzJkQ1FVRkZMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUjBGQlJ5eExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRhRVFzUTBGQlF5eERRVUZETzFGQlEwWXNRMEZCUXl4RFFVRkRMRkZCUVZFc1EwRkJReXhEUVVGRE8xRkJRMW9zUTBGQlF5eERRVUZETEZGQlFWRXNRMEZCUXl4RFFVRkRPMGxCUTJoQ0xFTkJRVU1zUTBGQlF5eERRVUZETzBsQlEwZ3NUMEZCVHl4RlFVRkZMRTFCUVUwc1JVRkJSU3hEUVVGRExFVkJRVVVzVlVGQlZTeEZRVUZGTEZWQlFWVXNSVUZCUlN4RFFVRkRPMEZCUTJwRUxFTkJRVU03UVVGbVJDdzRRa0ZsUXlKOSIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIFBhaXJpbmdIZWFwID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBQYWlyaW5nSGVhcChlbGVtKSB7XG4gICAgICAgIHRoaXMuZWxlbSA9IGVsZW07XG4gICAgICAgIHRoaXMuc3ViaGVhcHMgPSBbXTtcbiAgICB9XG4gICAgUGFpcmluZ0hlYXAucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XG4gICAgICAgIHZhciBzdHIgPSBcIlwiLCBuZWVkQ29tbWEgPSBmYWxzZTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnN1YmhlYXBzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICB2YXIgc3ViaGVhcCA9IHRoaXMuc3ViaGVhcHNbaV07XG4gICAgICAgICAgICBpZiAoIXN1YmhlYXAuZWxlbSkge1xuICAgICAgICAgICAgICAgIG5lZWRDb21tYSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG5lZWRDb21tYSkge1xuICAgICAgICAgICAgICAgIHN0ciA9IHN0ciArIFwiLFwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3RyID0gc3RyICsgc3ViaGVhcC50b1N0cmluZyhzZWxlY3Rvcik7XG4gICAgICAgICAgICBuZWVkQ29tbWEgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdHIgIT09IFwiXCIpIHtcbiAgICAgICAgICAgIHN0ciA9IFwiKFwiICsgc3RyICsgXCIpXCI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICh0aGlzLmVsZW0gPyBzZWxlY3Rvcih0aGlzLmVsZW0pIDogXCJcIikgKyBzdHI7XG4gICAgfTtcbiAgICBQYWlyaW5nSGVhcC5wcm90b3R5cGUuZm9yRWFjaCA9IGZ1bmN0aW9uIChmKSB7XG4gICAgICAgIGlmICghdGhpcy5lbXB0eSgpKSB7XG4gICAgICAgICAgICBmKHRoaXMuZWxlbSwgdGhpcyk7XG4gICAgICAgICAgICB0aGlzLnN1YmhlYXBzLmZvckVhY2goZnVuY3Rpb24gKHMpIHsgcmV0dXJuIHMuZm9yRWFjaChmKTsgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFBhaXJpbmdIZWFwLnByb3RvdHlwZS5jb3VudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZW1wdHkoKSA/IDAgOiAxICsgdGhpcy5zdWJoZWFwcy5yZWR1Y2UoZnVuY3Rpb24gKG4sIGgpIHtcbiAgICAgICAgICAgIHJldHVybiBuICsgaC5jb3VudCgpO1xuICAgICAgICB9LCAwKTtcbiAgICB9O1xuICAgIFBhaXJpbmdIZWFwLnByb3RvdHlwZS5taW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW07XG4gICAgfTtcbiAgICBQYWlyaW5nSGVhcC5wcm90b3R5cGUuZW1wdHkgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW0gPT0gbnVsbDtcbiAgICB9O1xuICAgIFBhaXJpbmdIZWFwLnByb3RvdHlwZS5jb250YWlucyA9IGZ1bmN0aW9uIChoKSB7XG4gICAgICAgIGlmICh0aGlzID09PSBoKVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zdWJoZWFwcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHRoaXMuc3ViaGVhcHNbaV0uY29udGFpbnMoaCkpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG4gICAgUGFpcmluZ0hlYXAucHJvdG90eXBlLmlzSGVhcCA9IGZ1bmN0aW9uIChsZXNzVGhhbikge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICByZXR1cm4gdGhpcy5zdWJoZWFwcy5ldmVyeShmdW5jdGlvbiAoaCkgeyByZXR1cm4gbGVzc1RoYW4oX3RoaXMuZWxlbSwgaC5lbGVtKSAmJiBoLmlzSGVhcChsZXNzVGhhbik7IH0pO1xuICAgIH07XG4gICAgUGFpcmluZ0hlYXAucHJvdG90eXBlLmluc2VydCA9IGZ1bmN0aW9uIChvYmosIGxlc3NUaGFuKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1lcmdlKG5ldyBQYWlyaW5nSGVhcChvYmopLCBsZXNzVGhhbik7XG4gICAgfTtcbiAgICBQYWlyaW5nSGVhcC5wcm90b3R5cGUubWVyZ2UgPSBmdW5jdGlvbiAoaGVhcDIsIGxlc3NUaGFuKSB7XG4gICAgICAgIGlmICh0aGlzLmVtcHR5KCkpXG4gICAgICAgICAgICByZXR1cm4gaGVhcDI7XG4gICAgICAgIGVsc2UgaWYgKGhlYXAyLmVtcHR5KCkpXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgZWxzZSBpZiAobGVzc1RoYW4odGhpcy5lbGVtLCBoZWFwMi5lbGVtKSkge1xuICAgICAgICAgICAgdGhpcy5zdWJoZWFwcy5wdXNoKGhlYXAyKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaGVhcDIuc3ViaGVhcHMucHVzaCh0aGlzKTtcbiAgICAgICAgICAgIHJldHVybiBoZWFwMjtcbiAgICAgICAgfVxuICAgIH07XG4gICAgUGFpcmluZ0hlYXAucHJvdG90eXBlLnJlbW92ZU1pbiA9IGZ1bmN0aW9uIChsZXNzVGhhbikge1xuICAgICAgICBpZiAodGhpcy5lbXB0eSgpKVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm1lcmdlUGFpcnMobGVzc1RoYW4pO1xuICAgIH07XG4gICAgUGFpcmluZ0hlYXAucHJvdG90eXBlLm1lcmdlUGFpcnMgPSBmdW5jdGlvbiAobGVzc1RoYW4pIHtcbiAgICAgICAgaWYgKHRoaXMuc3ViaGVhcHMubGVuZ3RoID09IDApXG4gICAgICAgICAgICByZXR1cm4gbmV3IFBhaXJpbmdIZWFwKG51bGwpO1xuICAgICAgICBlbHNlIGlmICh0aGlzLnN1YmhlYXBzLmxlbmd0aCA9PSAxKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zdWJoZWFwc1swXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBmaXJzdFBhaXIgPSB0aGlzLnN1YmhlYXBzLnBvcCgpLm1lcmdlKHRoaXMuc3ViaGVhcHMucG9wKCksIGxlc3NUaGFuKTtcbiAgICAgICAgICAgIHZhciByZW1haW5pbmcgPSB0aGlzLm1lcmdlUGFpcnMobGVzc1RoYW4pO1xuICAgICAgICAgICAgcmV0dXJuIGZpcnN0UGFpci5tZXJnZShyZW1haW5pbmcsIGxlc3NUaGFuKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgUGFpcmluZ0hlYXAucHJvdG90eXBlLmRlY3JlYXNlS2V5ID0gZnVuY3Rpb24gKHN1YmhlYXAsIG5ld1ZhbHVlLCBzZXRIZWFwTm9kZSwgbGVzc1RoYW4pIHtcbiAgICAgICAgdmFyIG5ld0hlYXAgPSBzdWJoZWFwLnJlbW92ZU1pbihsZXNzVGhhbik7XG4gICAgICAgIHN1YmhlYXAuZWxlbSA9IG5ld0hlYXAuZWxlbTtcbiAgICAgICAgc3ViaGVhcC5zdWJoZWFwcyA9IG5ld0hlYXAuc3ViaGVhcHM7XG4gICAgICAgIGlmIChzZXRIZWFwTm9kZSAhPT0gbnVsbCAmJiBuZXdIZWFwLmVsZW0gIT09IG51bGwpIHtcbiAgICAgICAgICAgIHNldEhlYXBOb2RlKHN1YmhlYXAuZWxlbSwgc3ViaGVhcCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHBhaXJpbmdOb2RlID0gbmV3IFBhaXJpbmdIZWFwKG5ld1ZhbHVlKTtcbiAgICAgICAgaWYgKHNldEhlYXBOb2RlICE9PSBudWxsKSB7XG4gICAgICAgICAgICBzZXRIZWFwTm9kZShuZXdWYWx1ZSwgcGFpcmluZ05vZGUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLm1lcmdlKHBhaXJpbmdOb2RlLCBsZXNzVGhhbik7XG4gICAgfTtcbiAgICByZXR1cm4gUGFpcmluZ0hlYXA7XG59KCkpO1xuZXhwb3J0cy5QYWlyaW5nSGVhcCA9IFBhaXJpbmdIZWFwO1xudmFyIFByaW9yaXR5UXVldWUgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFByaW9yaXR5UXVldWUobGVzc1RoYW4pIHtcbiAgICAgICAgdGhpcy5sZXNzVGhhbiA9IGxlc3NUaGFuO1xuICAgIH1cbiAgICBQcmlvcml0eVF1ZXVlLnByb3RvdHlwZS50b3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLmVtcHR5KCkpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLnJvb3QuZWxlbTtcbiAgICB9O1xuICAgIFByaW9yaXR5UXVldWUucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBhcmdzID0gW107XG4gICAgICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICBhcmdzW19pXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHBhaXJpbmdOb2RlO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgYXJnOyBhcmcgPSBhcmdzW2ldOyArK2kpIHtcbiAgICAgICAgICAgIHBhaXJpbmdOb2RlID0gbmV3IFBhaXJpbmdIZWFwKGFyZyk7XG4gICAgICAgICAgICB0aGlzLnJvb3QgPSB0aGlzLmVtcHR5KCkgP1xuICAgICAgICAgICAgICAgIHBhaXJpbmdOb2RlIDogdGhpcy5yb290Lm1lcmdlKHBhaXJpbmdOb2RlLCB0aGlzLmxlc3NUaGFuKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcGFpcmluZ05vZGU7XG4gICAgfTtcbiAgICBQcmlvcml0eVF1ZXVlLnByb3RvdHlwZS5lbXB0eSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuICF0aGlzLnJvb3QgfHwgIXRoaXMucm9vdC5lbGVtO1xuICAgIH07XG4gICAgUHJpb3JpdHlRdWV1ZS5wcm90b3R5cGUuaXNIZWFwID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yb290LmlzSGVhcCh0aGlzLmxlc3NUaGFuKTtcbiAgICB9O1xuICAgIFByaW9yaXR5UXVldWUucHJvdG90eXBlLmZvckVhY2ggPSBmdW5jdGlvbiAoZikge1xuICAgICAgICB0aGlzLnJvb3QuZm9yRWFjaChmKTtcbiAgICB9O1xuICAgIFByaW9yaXR5UXVldWUucHJvdG90eXBlLnBvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuZW1wdHkoKSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG9iaiA9IHRoaXMucm9vdC5taW4oKTtcbiAgICAgICAgdGhpcy5yb290ID0gdGhpcy5yb290LnJlbW92ZU1pbih0aGlzLmxlc3NUaGFuKTtcbiAgICAgICAgcmV0dXJuIG9iajtcbiAgICB9O1xuICAgIFByaW9yaXR5UXVldWUucHJvdG90eXBlLnJlZHVjZUtleSA9IGZ1bmN0aW9uIChoZWFwTm9kZSwgbmV3S2V5LCBzZXRIZWFwTm9kZSkge1xuICAgICAgICBpZiAoc2V0SGVhcE5vZGUgPT09IHZvaWQgMCkgeyBzZXRIZWFwTm9kZSA9IG51bGw7IH1cbiAgICAgICAgdGhpcy5yb290ID0gdGhpcy5yb290LmRlY3JlYXNlS2V5KGhlYXBOb2RlLCBuZXdLZXksIHNldEhlYXBOb2RlLCB0aGlzLmxlc3NUaGFuKTtcbiAgICB9O1xuICAgIFByaW9yaXR5UXVldWUucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJvb3QudG9TdHJpbmcoc2VsZWN0b3IpO1xuICAgIH07XG4gICAgUHJpb3JpdHlRdWV1ZS5wcm90b3R5cGUuY291bnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJvb3QuY291bnQoKTtcbiAgICB9O1xuICAgIHJldHVybiBQcmlvcml0eVF1ZXVlO1xufSgpKTtcbmV4cG9ydHMuUHJpb3JpdHlRdWV1ZSA9IFByaW9yaXR5UXVldWU7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0ptYVd4bElqb2ljSEYxWlhWbExtcHpJaXdpYzI5MWNtTmxVbTl2ZENJNklpSXNJbk52ZFhKalpYTWlPbHNpTGk0dkxpNHZWMlZpUTI5c1lTOXpjbU12Y0hGMVpYVmxMblJ6SWwwc0ltNWhiV1Z6SWpwYlhTd2liV0Z3Y0dsdVozTWlPaUk3TzBGQlEwRTdTVUZKU1N4eFFrRkJiVUlzU1VGQlR6dFJRVUZRTEZOQlFVa3NSMEZCU2l4SlFVRkpMRU5CUVVjN1VVRkRkRUlzU1VGQlNTeERRVUZETEZGQlFWRXNSMEZCUnl4RlFVRkZMRU5CUVVNN1NVRkRka0lzUTBGQlF6dEpRVVZOTERoQ1FVRlJMRWRCUVdZc1ZVRkJaMElzVVVGQlVUdFJRVU53UWl4SlFVRkpMRWRCUVVjc1IwRkJSeXhGUVVGRkxFVkJRVVVzVTBGQlV5eEhRVUZITEV0QlFVc3NRMEZCUXp0UlFVTm9ReXhMUVVGTExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExGRkJRVkVzUTBGQlF5eE5RVUZOTEVWQlFVVXNSVUZCUlN4RFFVRkRMRVZCUVVVN1dVRkRNME1zU1VGQlNTeFBRVUZQTEVkQlFXMUNMRWxCUVVrc1EwRkJReXhSUVVGUkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdXVUZETDBNc1NVRkJTU3hEUVVGRExFOUJRVThzUTBGQlF5eEpRVUZKTEVWQlFVVTdaMEpCUTJZc1UwRkJVeXhIUVVGSExFdEJRVXNzUTBGQlF6dG5Ra0ZEYkVJc1UwRkJVenRoUVVOYU8xbEJRMFFzU1VGQlNTeFRRVUZUTEVWQlFVVTdaMEpCUTFnc1IwRkJSeXhIUVVGSExFZEJRVWNzUjBGQlJ5eEhRVUZITEVOQlFVTTdZVUZEYmtJN1dVRkRSQ3hIUVVGSExFZEJRVWNzUjBGQlJ5eEhRVUZITEU5QlFVOHNRMEZCUXl4UlFVRlJMRU5CUVVNc1VVRkJVU3hEUVVGRExFTkJRVU03V1VGRGRrTXNVMEZCVXl4SFFVRkhMRWxCUVVrc1EwRkJRenRUUVVOd1FqdFJRVU5FTEVsQlFVa3NSMEZCUnl4TFFVRkxMRVZCUVVVc1JVRkJSVHRaUVVOYUxFZEJRVWNzUjBGQlJ5eEhRVUZITEVkQlFVY3NSMEZCUnl4SFFVRkhMRWRCUVVjc1EwRkJRenRUUVVONlFqdFJRVU5FTEU5QlFVOHNRMEZCUXl4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eFJRVUZSTEVOQlFVTXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4SFFVRkhMRU5CUVVNN1NVRkRlRVFzUTBGQlF6dEpRVVZOTERaQ1FVRlBMRWRCUVdRc1ZVRkJaU3hEUVVGRE8xRkJRMW9zU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4TFFVRkxMRVZCUVVVc1JVRkJSVHRaUVVObUxFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4RlFVRkZMRWxCUVVrc1EwRkJReXhEUVVGRE8xbEJRMjVDTEVsQlFVa3NRMEZCUXl4UlFVRlJMRU5CUVVNc1QwRkJUeXhEUVVGRExGVkJRVUVzUTBGQlF5eEpRVUZKTEU5QlFVRXNRMEZCUXl4RFFVRkRMRTlCUVU4c1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQldpeERRVUZaTEVOQlFVTXNRMEZCUXp0VFFVTTFRenRKUVVOTUxFTkJRVU03U1VGRlRTd3lRa0ZCU3l4SFFVRmFPMUZCUTBrc1QwRkJUeXhKUVVGSkxFTkJRVU1zUzBGQlN5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4UlFVRlJMRU5CUVVNc1RVRkJUU3hEUVVGRExGVkJRVU1zUTBGQlV5eEZRVUZGTEVOQlFXbENPMWxCUXpWRkxFOUJRVThzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4TFFVRkxMRVZCUVVVc1EwRkJRenRSUVVONlFpeERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1NVRkRWaXhEUVVGRE8wbEJSVTBzZVVKQlFVY3NSMEZCVmp0UlFVTkpMRTlCUVU4c1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF6dEpRVU55UWl4RFFVRkRPMGxCUlUwc01rSkJRVXNzUjBGQldqdFJRVU5KTEU5QlFVOHNTVUZCU1N4RFFVRkRMRWxCUVVrc1NVRkJTU3hKUVVGSkxFTkJRVU03U1VGRE4wSXNRMEZCUXp0SlFVVk5MRGhDUVVGUkxFZEJRV1lzVlVGQlowSXNRMEZCYVVJN1VVRkROMElzU1VGQlNTeEpRVUZKTEV0QlFVc3NRMEZCUXp0WlFVRkZMRTlCUVU4c1NVRkJTU3hEUVVGRE8xRkJRelZDTEV0QlFVc3NTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNVVUZCVVN4RFFVRkRMRTFCUVUwc1JVRkJSU3hEUVVGRExFVkJRVVVzUlVGQlJUdFpRVU16UXl4SlFVRkpMRWxCUVVrc1EwRkJReXhSUVVGUkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNVVUZCVVN4RFFVRkRMRU5CUVVNc1EwRkJRenRuUWtGQlJTeFBRVUZQTEVsQlFVa3NRMEZCUXp0VFFVTnFSRHRSUVVORUxFOUJRVThzUzBGQlN5eERRVUZETzBsQlEycENMRU5CUVVNN1NVRkZUU3cwUWtGQlRTeEhRVUZpTEZWQlFXTXNVVUZCYVVNN1VVRkJMME1zYVVKQlJVTTdVVUZFUnl4UFFVRlBMRWxCUVVrc1EwRkJReXhSUVVGUkxFTkJRVU1zUzBGQlN5eERRVUZETEZWQlFVRXNRMEZCUXl4SlFVRkhMRTlCUVVFc1VVRkJVU3hEUVVGRExFdEJRVWtzUTBGQlF5eEpRVUZKTEVWQlFVVXNRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNVVUZCVVN4RFFVRkRMRVZCUVdwRUxFTkJRV2xFTEVOQlFVTXNRMEZCUXp0SlFVTjBSaXhEUVVGRE8wbEJSVTBzTkVKQlFVMHNSMEZCWWl4VlFVRmpMRWRCUVU4c1JVRkJSU3hSUVVGUk8xRkJRek5DTEU5QlFVOHNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhKUVVGSkxGZEJRVmNzUTBGQlNTeEhRVUZITEVOQlFVTXNSVUZCUlN4UlFVRlJMRU5CUVVNc1EwRkJRenRKUVVONlJDeERRVUZETzBsQlJVMHNNa0pCUVVzc1IwRkJXaXhWUVVGaExFdEJRWEZDTEVWQlFVVXNVVUZCVVR0UlFVTjRReXhKUVVGSkxFbEJRVWtzUTBGQlF5eExRVUZMTEVWQlFVVTdXVUZCUlN4UFFVRlBMRXRCUVVzc1EwRkJRenRoUVVNeFFpeEpRVUZKTEV0QlFVc3NRMEZCUXl4TFFVRkxMRVZCUVVVN1dVRkJSU3hQUVVGUExFbEJRVWtzUTBGQlF6dGhRVU12UWl4SlFVRkpMRkZCUVZFc1EwRkJReXhKUVVGSkxFTkJRVU1zU1VGQlNTeEZRVUZGTEV0QlFVc3NRMEZCUXl4SlFVRkpMRU5CUVVNc1JVRkJSVHRaUVVOMFF5eEpRVUZKTEVOQlFVTXNVVUZCVVN4RFFVRkRMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF6dFpRVU14UWl4UFFVRlBMRWxCUVVrc1EwRkJRenRUUVVObU8yRkJRVTA3V1VGRFNDeExRVUZMTEVOQlFVTXNVVUZCVVN4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dFpRVU14UWl4UFFVRlBMRXRCUVVzc1EwRkJRenRUUVVOb1FqdEpRVU5NTEVOQlFVTTdTVUZGVFN3clFrRkJVeXhIUVVGb1FpeFZRVUZwUWl4UlFVRnBRenRSUVVNNVF5eEpRVUZKTEVsQlFVa3NRMEZCUXl4TFFVRkxMRVZCUVVVN1dVRkJSU3hQUVVGUExFbEJRVWtzUTBGQlF6czdXVUZEZWtJc1QwRkJUeXhKUVVGSkxFTkJRVU1zVlVGQlZTeERRVUZETEZGQlFWRXNRMEZCUXl4RFFVRkRPMGxCUXpGRExFTkJRVU03U1VGRlRTeG5RMEZCVlN4SFFVRnFRaXhWUVVGclFpeFJRVUZwUXp0UlFVTXZReXhKUVVGSkxFbEJRVWtzUTBGQlF5eFJRVUZSTEVOQlFVTXNUVUZCVFN4SlFVRkpMRU5CUVVNN1dVRkJSU3hQUVVGUExFbEJRVWtzVjBGQlZ5eERRVUZKTEVsQlFVa3NRMEZCUXl4RFFVRkRPMkZCUXpGRUxFbEJRVWtzU1VGQlNTeERRVUZETEZGQlFWRXNRMEZCUXl4TlFVRk5MRWxCUVVrc1EwRkJReXhGUVVGRk8xbEJRVVVzVDBGQlR5eEpRVUZKTEVOQlFVTXNVVUZCVVN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xTkJRVVU3WVVGRE0wUTdXVUZEUkN4SlFVRkpMRk5CUVZNc1IwRkJSeXhKUVVGSkxFTkJRVU1zVVVGQlVTeERRVUZETEVkQlFVY3NSVUZCUlN4RFFVRkRMRXRCUVVzc1EwRkJReXhKUVVGSkxFTkJRVU1zVVVGQlVTeERRVUZETEVkQlFVY3NSVUZCUlN4RlFVRkZMRkZCUVZFc1EwRkJReXhEUVVGRE8xbEJRM3BGTEVsQlFVa3NVMEZCVXl4SFFVRkhMRWxCUVVrc1EwRkJReXhWUVVGVkxFTkJRVU1zVVVGQlVTeERRVUZETEVOQlFVTTdXVUZETVVNc1QwRkJUeXhUUVVGVExFTkJRVU1zUzBGQlN5eERRVUZETEZOQlFWTXNSVUZCUlN4UlFVRlJMRU5CUVVNc1EwRkJRenRUUVVNdlF6dEpRVU5NTEVOQlFVTTdTVUZEVFN4cFEwRkJWeXhIUVVGc1FpeFZRVUZ0UWl4UFFVRjFRaXhGUVVGRkxGRkJRVmNzUlVGQlJTeFhRVUUwUXl4RlFVRkZMRkZCUVdsRE8xRkJRM0JKTEVsQlFVa3NUMEZCVHl4SFFVRkhMRTlCUVU4c1EwRkJReXhUUVVGVExFTkJRVU1zVVVGQlVTeERRVUZETEVOQlFVTTdVVUZGTVVNc1QwRkJUeXhEUVVGRExFbEJRVWtzUjBGQlJ5eFBRVUZQTEVOQlFVTXNTVUZCU1N4RFFVRkRPMUZCUXpWQ0xFOUJRVThzUTBGQlF5eFJRVUZSTEVkQlFVY3NUMEZCVHl4RFFVRkRMRkZCUVZFc1EwRkJRenRSUVVOd1F5eEpRVUZKTEZkQlFWY3NTMEZCU3l4SlFVRkpMRWxCUVVrc1QwRkJUeXhEUVVGRExFbEJRVWtzUzBGQlN5eEpRVUZKTEVWQlFVVTdXVUZETDBNc1YwRkJWeXhEUVVGRExFOUJRVThzUTBGQlF5eEpRVUZKTEVWQlFVVXNUMEZCVHl4RFFVRkRMRU5CUVVNN1UwRkRkRU03VVVGRFJDeEpRVUZKTEZkQlFWY3NSMEZCUnl4SlFVRkpMRmRCUVZjc1EwRkJReXhSUVVGUkxFTkJRVU1zUTBGQlF6dFJRVU0xUXl4SlFVRkpMRmRCUVZjc1MwRkJTeXhKUVVGSkxFVkJRVVU3V1VGRGRFSXNWMEZCVnl4RFFVRkRMRkZCUVZFc1JVRkJSU3hYUVVGWExFTkJRVU1zUTBGQlF6dFRRVU4wUXp0UlFVTkVMRTlCUVU4c1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eFhRVUZYTEVWQlFVVXNVVUZCVVN4RFFVRkRMRU5CUVVNN1NVRkROME1zUTBGQlF6dEpRVU5NTEd0Q1FVRkRPMEZCUVVRc1EwRkJReXhCUVhwSFJDeEpRWGxIUXp0QlFYcEhXU3hyUTBGQlZ6dEJRVGhIZUVJN1NVRkZTU3gxUWtGQmIwSXNVVUZCYVVNN1VVRkJha01zWVVGQlVTeEhRVUZTTEZGQlFWRXNRMEZCZVVJN1NVRkJTU3hEUVVGRE8wbEJTMjVFTERKQ1FVRkhMRWRCUVZZN1VVRkRTU3hKUVVGSkxFbEJRVWtzUTBGQlF5eExRVUZMTEVWQlFVVXNSVUZCUlR0WlFVRkZMRTlCUVU4c1NVRkJTU3hEUVVGRE8xTkJRVVU3VVVGRGJFTXNUMEZCVHl4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF6dEpRVU14UWl4RFFVRkRPMGxCUzAwc05FSkJRVWtzUjBGQldEdFJRVUZaTEdOQlFWazdZVUZCV2l4VlFVRlpMRVZCUVZvc2NVSkJRVmtzUlVGQldpeEpRVUZaTzFsQlFWb3NlVUpCUVZrN08xRkJRM0JDTEVsQlFVa3NWMEZCVnl4RFFVRkRPMUZCUTJoQ0xFdEJRVXNzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRWRCUVVjc1JVRkJSU3hIUVVGSExFZEJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRVZCUVVVc1EwRkJReXhGUVVGRk8xbEJRMjVETEZkQlFWY3NSMEZCUnl4SlFVRkpMRmRCUVZjc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dFpRVU51UXl4SlFVRkpMRU5CUVVNc1NVRkJTU3hIUVVGSExFbEJRVWtzUTBGQlF5eExRVUZMTEVWQlFVVXNRMEZCUXl4RFFVRkRPMmRDUVVOMFFpeFhRVUZYTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEZkQlFWY3NSVUZCUlN4SlFVRkpMRU5CUVVNc1VVRkJVU3hEUVVGRExFTkJRVU03VTBGRGFrVTdVVUZEUkN4UFFVRlBMRmRCUVZjc1EwRkJRenRKUVVOMlFpeERRVUZETzBsQlMwMHNOa0pCUVVzc1IwRkJXanRSUVVOSkxFOUJRVThzUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTTdTVUZEZWtNc1EwRkJRenRKUVV0TkxEaENRVUZOTEVkQlFXSTdVVUZEU1N4UFFVRlBMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEVsQlFVa3NRMEZCUXl4UlFVRlJMRU5CUVVNc1EwRkJRenRKUVVNelF5eERRVUZETzBsQlMwMHNLMEpCUVU4c1IwRkJaQ3hWUVVGbExFTkJRVU03VVVGRFdpeEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMRTlCUVU4c1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dEpRVU42UWl4RFFVRkRPMGxCU1Uwc01rSkJRVWNzUjBGQlZqdFJRVU5KTEVsQlFVa3NTVUZCU1N4RFFVRkRMRXRCUVVzc1JVRkJSU3hGUVVGRk8xbEJRMlFzVDBGQlR5eEpRVUZKTEVOQlFVTTdVMEZEWmp0UlFVTkVMRWxCUVVrc1IwRkJSeXhIUVVGSExFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RlFVRkZMRU5CUVVNN1VVRkRNVUlzU1VGQlNTeERRVUZETEVsQlFVa3NSMEZCUnl4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExGTkJRVk1zUTBGQlF5eEpRVUZKTEVOQlFVTXNVVUZCVVN4RFFVRkRMRU5CUVVNN1VVRkRMME1zVDBGQlR5eEhRVUZITEVOQlFVTTdTVUZEWml4RFFVRkRPMGxCU1Uwc2FVTkJRVk1zUjBGQmFFSXNWVUZCYVVJc1VVRkJkMElzUlVGQlJTeE5RVUZUTEVWQlFVVXNWMEZCYlVRN1VVRkJia1FzTkVKQlFVRXNSVUZCUVN4clFrRkJiVVE3VVVGRGNrY3NTVUZCU1N4RFFVRkRMRWxCUVVrc1IwRkJSeXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEZkQlFWY3NRMEZCUXl4UlFVRlJMRVZCUVVVc1RVRkJUU3hGUVVGRkxGZEJRVmNzUlVGQlJTeEpRVUZKTEVOQlFVTXNVVUZCVVN4RFFVRkRMRU5CUVVNN1NVRkRjRVlzUTBGQlF6dEpRVU5OTEdkRFFVRlJMRWRCUVdZc1ZVRkJaMElzVVVGQlVUdFJRVU53UWl4UFFVRlBMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zVVVGQlVTeERRVUZETEZGQlFWRXNRMEZCUXl4RFFVRkRPMGxCUTNoRExFTkJRVU03U1VGTFRTdzJRa0ZCU3l4SFFVRmFPMUZCUTBrc1QwRkJUeXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEV0QlFVc3NSVUZCUlN4RFFVRkRPMGxCUXpkQ0xFTkJRVU03U1VGRFRDeHZRa0ZCUXp0QlFVRkVMRU5CUVVNc1FVRjRSVVFzU1VGM1JVTTdRVUY0UlZrc2MwTkJRV0VpZlE9PSIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fZXh0ZW5kcyA9ICh0aGlzICYmIHRoaXMuX19leHRlbmRzKSB8fCAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBleHRlbmRTdGF0aWNzID0gZnVuY3Rpb24gKGQsIGIpIHtcbiAgICAgICAgZXh0ZW5kU3RhdGljcyA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fFxuICAgICAgICAgICAgKHsgX19wcm90b19fOiBbXSB9IGluc3RhbmNlb2YgQXJyYXkgJiYgZnVuY3Rpb24gKGQsIGIpIHsgZC5fX3Byb3RvX18gPSBiOyB9KSB8fFxuICAgICAgICAgICAgZnVuY3Rpb24gKGQsIGIpIHsgZm9yICh2YXIgcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwKSkgZFtwXSA9IGJbcF07IH07XG4gICAgICAgIHJldHVybiBleHRlbmRTdGF0aWNzKGQsIGIpO1xuICAgIH07XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkLCBiKSB7XG4gICAgICAgIGV4dGVuZFN0YXRpY3MoZCwgYik7XG4gICAgICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxuICAgICAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XG4gICAgfTtcbn0pKCk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgVHJlZUJhc2UgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFRyZWVCYXNlKCkge1xuICAgICAgICB0aGlzLmZpbmRJdGVyID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgIHZhciByZXMgPSB0aGlzLl9yb290O1xuICAgICAgICAgICAgdmFyIGl0ZXIgPSB0aGlzLml0ZXJhdG9yKCk7XG4gICAgICAgICAgICB3aGlsZSAocmVzICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdmFyIGMgPSB0aGlzLl9jb21wYXJhdG9yKGRhdGEsIHJlcy5kYXRhKTtcbiAgICAgICAgICAgICAgICBpZiAoYyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBpdGVyLl9jdXJzb3IgPSByZXM7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpdGVyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaXRlci5fYW5jZXN0b3JzLnB1c2gocmVzKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzID0gcmVzLmdldF9jaGlsZChjID4gMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH07XG4gICAgfVxuICAgIFRyZWVCYXNlLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5fcm9vdCA9IG51bGw7XG4gICAgICAgIHRoaXMuc2l6ZSA9IDA7XG4gICAgfTtcbiAgICA7XG4gICAgVHJlZUJhc2UucHJvdG90eXBlLmZpbmQgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICB2YXIgcmVzID0gdGhpcy5fcm9vdDtcbiAgICAgICAgd2hpbGUgKHJlcyAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdmFyIGMgPSB0aGlzLl9jb21wYXJhdG9yKGRhdGEsIHJlcy5kYXRhKTtcbiAgICAgICAgICAgIGlmIChjID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5kYXRhO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzID0gcmVzLmdldF9jaGlsZChjID4gMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfTtcbiAgICA7XG4gICAgVHJlZUJhc2UucHJvdG90eXBlLmxvd2VyQm91bmQgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYm91bmQoZGF0YSwgdGhpcy5fY29tcGFyYXRvcik7XG4gICAgfTtcbiAgICA7XG4gICAgVHJlZUJhc2UucHJvdG90eXBlLnVwcGVyQm91bmQgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICB2YXIgY21wID0gdGhpcy5fY29tcGFyYXRvcjtcbiAgICAgICAgZnVuY3Rpb24gcmV2ZXJzZV9jbXAoYSwgYikge1xuICAgICAgICAgICAgcmV0dXJuIGNtcChiLCBhKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5fYm91bmQoZGF0YSwgcmV2ZXJzZV9jbXApO1xuICAgIH07XG4gICAgO1xuICAgIFRyZWVCYXNlLnByb3RvdHlwZS5taW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciByZXMgPSB0aGlzLl9yb290O1xuICAgICAgICBpZiAocmVzID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAocmVzLmxlZnQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHJlcyA9IHJlcy5sZWZ0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXMuZGF0YTtcbiAgICB9O1xuICAgIDtcbiAgICBUcmVlQmFzZS5wcm90b3R5cGUubWF4ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcmVzID0gdGhpcy5fcm9vdDtcbiAgICAgICAgaWYgKHJlcyA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUgKHJlcy5yaWdodCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgcmVzID0gcmVzLnJpZ2h0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXMuZGF0YTtcbiAgICB9O1xuICAgIDtcbiAgICBUcmVlQmFzZS5wcm90b3R5cGUuaXRlcmF0b3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgSXRlcmF0b3IodGhpcyk7XG4gICAgfTtcbiAgICA7XG4gICAgVHJlZUJhc2UucHJvdG90eXBlLmVhY2ggPSBmdW5jdGlvbiAoY2IpIHtcbiAgICAgICAgdmFyIGl0ID0gdGhpcy5pdGVyYXRvcigpLCBkYXRhO1xuICAgICAgICB3aGlsZSAoKGRhdGEgPSBpdC5uZXh0KCkpICE9PSBudWxsKSB7XG4gICAgICAgICAgICBjYihkYXRhKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgO1xuICAgIFRyZWVCYXNlLnByb3RvdHlwZS5yZWFjaCA9IGZ1bmN0aW9uIChjYikge1xuICAgICAgICB2YXIgaXQgPSB0aGlzLml0ZXJhdG9yKCksIGRhdGE7XG4gICAgICAgIHdoaWxlICgoZGF0YSA9IGl0LnByZXYoKSkgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGNiKGRhdGEpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICA7XG4gICAgVHJlZUJhc2UucHJvdG90eXBlLl9ib3VuZCA9IGZ1bmN0aW9uIChkYXRhLCBjbXApIHtcbiAgICAgICAgdmFyIGN1ciA9IHRoaXMuX3Jvb3Q7XG4gICAgICAgIHZhciBpdGVyID0gdGhpcy5pdGVyYXRvcigpO1xuICAgICAgICB3aGlsZSAoY3VyICE9PSBudWxsKSB7XG4gICAgICAgICAgICB2YXIgYyA9IHRoaXMuX2NvbXBhcmF0b3IoZGF0YSwgY3VyLmRhdGEpO1xuICAgICAgICAgICAgaWYgKGMgPT09IDApIHtcbiAgICAgICAgICAgICAgICBpdGVyLl9jdXJzb3IgPSBjdXI7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGl0ZXI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpdGVyLl9hbmNlc3RvcnMucHVzaChjdXIpO1xuICAgICAgICAgICAgY3VyID0gY3VyLmdldF9jaGlsZChjID4gMCk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgaSA9IGl0ZXIuX2FuY2VzdG9ycy5sZW5ndGggLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgICAgICAgY3VyID0gaXRlci5fYW5jZXN0b3JzW2ldO1xuICAgICAgICAgICAgaWYgKGNtcChkYXRhLCBjdXIuZGF0YSkgPiAwKSB7XG4gICAgICAgICAgICAgICAgaXRlci5fY3Vyc29yID0gY3VyO1xuICAgICAgICAgICAgICAgIGl0ZXIuX2FuY2VzdG9ycy5sZW5ndGggPSBpO1xuICAgICAgICAgICAgICAgIHJldHVybiBpdGVyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGl0ZXIuX2FuY2VzdG9ycy5sZW5ndGggPSAwO1xuICAgICAgICByZXR1cm4gaXRlcjtcbiAgICB9O1xuICAgIDtcbiAgICByZXR1cm4gVHJlZUJhc2U7XG59KCkpO1xuZXhwb3J0cy5UcmVlQmFzZSA9IFRyZWVCYXNlO1xudmFyIEl0ZXJhdG9yID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBJdGVyYXRvcih0cmVlKSB7XG4gICAgICAgIHRoaXMuX3RyZWUgPSB0cmVlO1xuICAgICAgICB0aGlzLl9hbmNlc3RvcnMgPSBbXTtcbiAgICAgICAgdGhpcy5fY3Vyc29yID0gbnVsbDtcbiAgICB9XG4gICAgSXRlcmF0b3IucHJvdG90eXBlLmRhdGEgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jdXJzb3IgIT09IG51bGwgPyB0aGlzLl9jdXJzb3IuZGF0YSA6IG51bGw7XG4gICAgfTtcbiAgICA7XG4gICAgSXRlcmF0b3IucHJvdG90eXBlLm5leHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLl9jdXJzb3IgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHZhciByb290ID0gdGhpcy5fdHJlZS5fcm9vdDtcbiAgICAgICAgICAgIGlmIChyb290ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fbWluTm9kZShyb290KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9jdXJzb3IucmlnaHQgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB2YXIgc2F2ZTtcbiAgICAgICAgICAgICAgICBkbyB7XG4gICAgICAgICAgICAgICAgICAgIHNhdmUgPSB0aGlzLl9jdXJzb3I7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9hbmNlc3RvcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9jdXJzb3IgPSB0aGlzLl9hbmNlc3RvcnMucG9wKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9jdXJzb3IgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IHdoaWxlICh0aGlzLl9jdXJzb3IucmlnaHQgPT09IHNhdmUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fYW5jZXN0b3JzLnB1c2godGhpcy5fY3Vyc29yKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9taW5Ob2RlKHRoaXMuX2N1cnNvci5yaWdodCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX2N1cnNvciAhPT0gbnVsbCA/IHRoaXMuX2N1cnNvci5kYXRhIDogbnVsbDtcbiAgICB9O1xuICAgIDtcbiAgICBJdGVyYXRvci5wcm90b3R5cGUucHJldiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuX2N1cnNvciA9PT0gbnVsbCkge1xuICAgICAgICAgICAgdmFyIHJvb3QgPSB0aGlzLl90cmVlLl9yb290O1xuICAgICAgICAgICAgaWYgKHJvb3QgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9tYXhOb2RlKHJvb3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2N1cnNvci5sZWZ0ID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdmFyIHNhdmU7XG4gICAgICAgICAgICAgICAgZG8ge1xuICAgICAgICAgICAgICAgICAgICBzYXZlID0gdGhpcy5fY3Vyc29yO1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fYW5jZXN0b3JzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fY3Vyc29yID0gdGhpcy5fYW5jZXN0b3JzLnBvcCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fY3Vyc29yID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSB3aGlsZSAodGhpcy5fY3Vyc29yLmxlZnQgPT09IHNhdmUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fYW5jZXN0b3JzLnB1c2godGhpcy5fY3Vyc29yKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9tYXhOb2RlKHRoaXMuX2N1cnNvci5sZWZ0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5fY3Vyc29yICE9PSBudWxsID8gdGhpcy5fY3Vyc29yLmRhdGEgOiBudWxsO1xuICAgIH07XG4gICAgO1xuICAgIEl0ZXJhdG9yLnByb3RvdHlwZS5fbWluTm9kZSA9IGZ1bmN0aW9uIChzdGFydCkge1xuICAgICAgICB3aGlsZSAoc3RhcnQubGVmdCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5fYW5jZXN0b3JzLnB1c2goc3RhcnQpO1xuICAgICAgICAgICAgc3RhcnQgPSBzdGFydC5sZWZ0O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2N1cnNvciA9IHN0YXJ0O1xuICAgIH07XG4gICAgO1xuICAgIEl0ZXJhdG9yLnByb3RvdHlwZS5fbWF4Tm9kZSA9IGZ1bmN0aW9uIChzdGFydCkge1xuICAgICAgICB3aGlsZSAoc3RhcnQucmlnaHQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuX2FuY2VzdG9ycy5wdXNoKHN0YXJ0KTtcbiAgICAgICAgICAgIHN0YXJ0ID0gc3RhcnQucmlnaHQ7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fY3Vyc29yID0gc3RhcnQ7XG4gICAgfTtcbiAgICA7XG4gICAgcmV0dXJuIEl0ZXJhdG9yO1xufSgpKTtcbmV4cG9ydHMuSXRlcmF0b3IgPSBJdGVyYXRvcjtcbnZhciBOb2RlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBOb2RlKGRhdGEpIHtcbiAgICAgICAgdGhpcy5kYXRhID0gZGF0YTtcbiAgICAgICAgdGhpcy5sZWZ0ID0gbnVsbDtcbiAgICAgICAgdGhpcy5yaWdodCA9IG51bGw7XG4gICAgICAgIHRoaXMucmVkID0gdHJ1ZTtcbiAgICB9XG4gICAgTm9kZS5wcm90b3R5cGUuZ2V0X2NoaWxkID0gZnVuY3Rpb24gKGRpcikge1xuICAgICAgICByZXR1cm4gZGlyID8gdGhpcy5yaWdodCA6IHRoaXMubGVmdDtcbiAgICB9O1xuICAgIDtcbiAgICBOb2RlLnByb3RvdHlwZS5zZXRfY2hpbGQgPSBmdW5jdGlvbiAoZGlyLCB2YWwpIHtcbiAgICAgICAgaWYgKGRpcikge1xuICAgICAgICAgICAgdGhpcy5yaWdodCA9IHZhbDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubGVmdCA9IHZhbDtcbiAgICAgICAgfVxuICAgIH07XG4gICAgO1xuICAgIHJldHVybiBOb2RlO1xufSgpKTtcbnZhciBSQlRyZWUgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhSQlRyZWUsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gUkJUcmVlKGNvbXBhcmF0b3IpIHtcbiAgICAgICAgdmFyIF90aGlzID0gX3N1cGVyLmNhbGwodGhpcykgfHwgdGhpcztcbiAgICAgICAgX3RoaXMuX3Jvb3QgPSBudWxsO1xuICAgICAgICBfdGhpcy5fY29tcGFyYXRvciA9IGNvbXBhcmF0b3I7XG4gICAgICAgIF90aGlzLnNpemUgPSAwO1xuICAgICAgICByZXR1cm4gX3RoaXM7XG4gICAgfVxuICAgIFJCVHJlZS5wcm90b3R5cGUuaW5zZXJ0ID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgdmFyIHJldCA9IGZhbHNlO1xuICAgICAgICBpZiAodGhpcy5fcm9vdCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5fcm9vdCA9IG5ldyBOb2RlKGRhdGEpO1xuICAgICAgICAgICAgcmV0ID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuc2l6ZSsrO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIGhlYWQgPSBuZXcgTm9kZSh1bmRlZmluZWQpO1xuICAgICAgICAgICAgdmFyIGRpciA9IGZhbHNlO1xuICAgICAgICAgICAgdmFyIGxhc3QgPSBmYWxzZTtcbiAgICAgICAgICAgIHZhciBncCA9IG51bGw7XG4gICAgICAgICAgICB2YXIgZ2dwID0gaGVhZDtcbiAgICAgICAgICAgIHZhciBwID0gbnVsbDtcbiAgICAgICAgICAgIHZhciBub2RlID0gdGhpcy5fcm9vdDtcbiAgICAgICAgICAgIGdncC5yaWdodCA9IHRoaXMuX3Jvb3Q7XG4gICAgICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgICAgICAgIGlmIChub2RlID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUgPSBuZXcgTm9kZShkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgcC5zZXRfY2hpbGQoZGlyLCBub2RlKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zaXplKys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKFJCVHJlZS5pc19yZWQobm9kZS5sZWZ0KSAmJiBSQlRyZWUuaXNfcmVkKG5vZGUucmlnaHQpKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUucmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5sZWZ0LnJlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBub2RlLnJpZ2h0LnJlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoUkJUcmVlLmlzX3JlZChub2RlKSAmJiBSQlRyZWUuaXNfcmVkKHApKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkaXIyID0gZ2dwLnJpZ2h0ID09PSBncDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGUgPT09IHAuZ2V0X2NoaWxkKGxhc3QpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBnZ3Auc2V0X2NoaWxkKGRpcjIsIFJCVHJlZS5zaW5nbGVfcm90YXRlKGdwLCAhbGFzdCkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ2dwLnNldF9jaGlsZChkaXIyLCBSQlRyZWUuZG91YmxlX3JvdGF0ZShncCwgIWxhc3QpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgY21wID0gdGhpcy5fY29tcGFyYXRvcihub2RlLmRhdGEsIGRhdGEpO1xuICAgICAgICAgICAgICAgIGlmIChjbXAgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGxhc3QgPSBkaXI7XG4gICAgICAgICAgICAgICAgZGlyID0gY21wIDwgMDtcbiAgICAgICAgICAgICAgICBpZiAoZ3AgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgZ2dwID0gZ3A7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGdwID0gcDtcbiAgICAgICAgICAgICAgICBwID0gbm9kZTtcbiAgICAgICAgICAgICAgICBub2RlID0gbm9kZS5nZXRfY2hpbGQoZGlyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3Jvb3QgPSBoZWFkLnJpZ2h0O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3Jvb3QucmVkID0gZmFsc2U7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfTtcbiAgICA7XG4gICAgUkJUcmVlLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICBpZiAodGhpcy5fcm9vdCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBoZWFkID0gbmV3IE5vZGUodW5kZWZpbmVkKTtcbiAgICAgICAgdmFyIG5vZGUgPSBoZWFkO1xuICAgICAgICBub2RlLnJpZ2h0ID0gdGhpcy5fcm9vdDtcbiAgICAgICAgdmFyIHAgPSBudWxsO1xuICAgICAgICB2YXIgZ3AgPSBudWxsO1xuICAgICAgICB2YXIgZm91bmQgPSBudWxsO1xuICAgICAgICB2YXIgZGlyID0gdHJ1ZTtcbiAgICAgICAgd2hpbGUgKG5vZGUuZ2V0X2NoaWxkKGRpcikgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHZhciBsYXN0ID0gZGlyO1xuICAgICAgICAgICAgZ3AgPSBwO1xuICAgICAgICAgICAgcCA9IG5vZGU7XG4gICAgICAgICAgICBub2RlID0gbm9kZS5nZXRfY2hpbGQoZGlyKTtcbiAgICAgICAgICAgIHZhciBjbXAgPSB0aGlzLl9jb21wYXJhdG9yKGRhdGEsIG5vZGUuZGF0YSk7XG4gICAgICAgICAgICBkaXIgPSBjbXAgPiAwO1xuICAgICAgICAgICAgaWYgKGNtcCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGZvdW5kID0gbm9kZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghUkJUcmVlLmlzX3JlZChub2RlKSAmJiAhUkJUcmVlLmlzX3JlZChub2RlLmdldF9jaGlsZChkaXIpKSkge1xuICAgICAgICAgICAgICAgIGlmIChSQlRyZWUuaXNfcmVkKG5vZGUuZ2V0X2NoaWxkKCFkaXIpKSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgc3IgPSBSQlRyZWUuc2luZ2xlX3JvdGF0ZShub2RlLCBkaXIpO1xuICAgICAgICAgICAgICAgICAgICBwLnNldF9jaGlsZChsYXN0LCBzcik7XG4gICAgICAgICAgICAgICAgICAgIHAgPSBzcjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoIVJCVHJlZS5pc19yZWQobm9kZS5nZXRfY2hpbGQoIWRpcikpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzaWJsaW5nID0gcC5nZXRfY2hpbGQoIWxhc3QpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2libGluZyAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFSQlRyZWUuaXNfcmVkKHNpYmxpbmcuZ2V0X2NoaWxkKCFsYXN0KSkgJiYgIVJCVHJlZS5pc19yZWQoc2libGluZy5nZXRfY2hpbGQobGFzdCkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcC5yZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaWJsaW5nLnJlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5yZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRpcjIgPSBncC5yaWdodCA9PT0gcDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoUkJUcmVlLmlzX3JlZChzaWJsaW5nLmdldF9jaGlsZChsYXN0KSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ3Auc2V0X2NoaWxkKGRpcjIsIFJCVHJlZS5kb3VibGVfcm90YXRlKHAsIGxhc3QpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoUkJUcmVlLmlzX3JlZChzaWJsaW5nLmdldF9jaGlsZCghbGFzdCkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdwLnNldF9jaGlsZChkaXIyLCBSQlRyZWUuc2luZ2xlX3JvdGF0ZShwLCBsYXN0KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBncGMgPSBncC5nZXRfY2hpbGQoZGlyMik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ3BjLnJlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5yZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdwYy5sZWZ0LnJlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdwYy5yaWdodC5yZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoZm91bmQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGZvdW5kLmRhdGEgPSBub2RlLmRhdGE7XG4gICAgICAgICAgICBwLnNldF9jaGlsZChwLnJpZ2h0ID09PSBub2RlLCBub2RlLmdldF9jaGlsZChub2RlLmxlZnQgPT09IG51bGwpKTtcbiAgICAgICAgICAgIHRoaXMuc2l6ZS0tO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3Jvb3QgPSBoZWFkLnJpZ2h0O1xuICAgICAgICBpZiAodGhpcy5fcm9vdCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5fcm9vdC5yZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZm91bmQgIT09IG51bGw7XG4gICAgfTtcbiAgICA7XG4gICAgUkJUcmVlLmlzX3JlZCA9IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgIHJldHVybiBub2RlICE9PSBudWxsICYmIG5vZGUucmVkO1xuICAgIH07XG4gICAgUkJUcmVlLnNpbmdsZV9yb3RhdGUgPSBmdW5jdGlvbiAocm9vdCwgZGlyKSB7XG4gICAgICAgIHZhciBzYXZlID0gcm9vdC5nZXRfY2hpbGQoIWRpcik7XG4gICAgICAgIHJvb3Quc2V0X2NoaWxkKCFkaXIsIHNhdmUuZ2V0X2NoaWxkKGRpcikpO1xuICAgICAgICBzYXZlLnNldF9jaGlsZChkaXIsIHJvb3QpO1xuICAgICAgICByb290LnJlZCA9IHRydWU7XG4gICAgICAgIHNhdmUucmVkID0gZmFsc2U7XG4gICAgICAgIHJldHVybiBzYXZlO1xuICAgIH07XG4gICAgUkJUcmVlLmRvdWJsZV9yb3RhdGUgPSBmdW5jdGlvbiAocm9vdCwgZGlyKSB7XG4gICAgICAgIHJvb3Quc2V0X2NoaWxkKCFkaXIsIFJCVHJlZS5zaW5nbGVfcm90YXRlKHJvb3QuZ2V0X2NoaWxkKCFkaXIpLCAhZGlyKSk7XG4gICAgICAgIHJldHVybiBSQlRyZWUuc2luZ2xlX3JvdGF0ZShyb290LCBkaXIpO1xuICAgIH07XG4gICAgcmV0dXJuIFJCVHJlZTtcbn0oVHJlZUJhc2UpKTtcbmV4cG9ydHMuUkJUcmVlID0gUkJUcmVlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKbWFXeGxJam9pY21KMGNtVmxMbXB6SWl3aWMyOTFjbU5sVW05dmRDSTZJaUlzSW5OdmRYSmpaWE1pT2xzaUxpNHZMaTR2VjJWaVEyOXNZUzl6Y21NdmNtSjBjbVZsTG5SeklsMHNJbTVoYldWeklqcGJYU3dpYldGd2NHbHVaM01pT2lJN096czdPenM3T3pzN096czdPenRCUVhWQ1NUdEpRVUZCTzFGQk5FSkpMR0ZCUVZFc1IwRkJSeXhWUVVGVkxFbEJRVWs3V1VGRGNrSXNTVUZCU1N4SFFVRkhMRWRCUVVjc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF6dFpRVU55UWl4SlFVRkpMRWxCUVVrc1IwRkJSeXhKUVVGSkxFTkJRVU1zVVVGQlVTeEZRVUZGTEVOQlFVTTdXVUZGTTBJc1QwRkJUeXhIUVVGSExFdEJRVXNzU1VGQlNTeEZRVUZGTzJkQ1FVTnFRaXhKUVVGSkxFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNWMEZCVnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hIUVVGSExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdaMEpCUTNwRExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNSVUZCUlR0dlFrRkRWQ3hKUVVGSkxFTkJRVU1zVDBGQlR5eEhRVUZITEVkQlFVY3NRMEZCUXp0dlFrRkRia0lzVDBGQlR5eEpRVUZKTEVOQlFVTTdhVUpCUTJZN2NVSkJRMGs3YjBKQlEwUXNTVUZCU1N4RFFVRkRMRlZCUVZVc1EwRkJReXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTTdiMEpCUXpGQ0xFZEJRVWNzUjBGQlJ5eEhRVUZITEVOQlFVTXNVMEZCVXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF6dHBRa0ZET1VJN1lVRkRTanRaUVVWRUxFOUJRVThzU1VGQlNTeERRVUZETzFGQlEyaENMRU5CUVVNc1EwRkJRenRKUVN0R1RpeERRVUZETzBsQmRrbEhMSGRDUVVGTExFZEJRVXc3VVVGRFNTeEpRVUZKTEVOQlFVTXNTMEZCU3l4SFFVRkhMRWxCUVVrc1EwRkJRenRSUVVOc1FpeEpRVUZKTEVOQlFVTXNTVUZCU1N4SFFVRkhMRU5CUVVNc1EwRkJRenRKUVVOc1FpeERRVUZETzBsQlFVRXNRMEZCUXp0SlFVZEdMSFZDUVVGSkxFZEJRVW9zVlVGQlN5eEpRVUZKTzFGQlEwd3NTVUZCU1N4SFFVRkhMRWRCUVVjc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF6dFJRVVZ5UWl4UFFVRlBMRWRCUVVjc1MwRkJTeXhKUVVGSkxFVkJRVVU3V1VGRGFrSXNTVUZCU1N4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExGZEJRVmNzUTBGQlF5eEpRVUZKTEVWQlFVVXNSMEZCUnl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRE8xbEJRM3BETEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1JVRkJSVHRuUWtGRFZDeFBRVUZQTEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNN1lVRkRia0k3YVVKQlEwazdaMEpCUTBRc1IwRkJSeXhIUVVGSExFZEJRVWNzUTBGQlF5eFRRVUZUTEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRE8yRkJRemxDTzFOQlEwbzdVVUZGUkN4UFFVRlBMRWxCUVVrc1EwRkJRenRKUVVOb1FpeERRVUZETzBsQlFVRXNRMEZCUXp0SlFYVkNSaXcyUWtGQlZTeEhRVUZXTEZWQlFWY3NTVUZCU1R0UlFVTllMRTlCUVU4c1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eEpRVUZKTEVWQlFVVXNTVUZCU1N4RFFVRkRMRmRCUVZjc1EwRkJReXhEUVVGRE8wbEJReTlETEVOQlFVTTdTVUZCUVN4RFFVRkRPMGxCUjBZc05rSkJRVlVzUjBGQlZpeFZRVUZYTEVsQlFVazdVVUZEV0N4SlFVRkpMRWRCUVVjc1IwRkJSeXhKUVVGSkxFTkJRVU1zVjBGQlZ5eERRVUZETzFGQlJUTkNMRk5CUVZNc1YwRkJWeXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETzFsQlEzSkNMRTlCUVU4c1IwRkJSeXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTnlRaXhEUVVGRE8xRkJSVVFzVDBGQlR5eEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRWxCUVVrc1JVRkJSU3hYUVVGWExFTkJRVU1zUTBGQlF6dEpRVU14UXl4RFFVRkRPMGxCUVVFc1EwRkJRenRKUVVkR0xITkNRVUZITEVkQlFVZzdVVUZEU1N4SlFVRkpMRWRCUVVjc1IwRkJSeXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETzFGQlEzSkNMRWxCUVVrc1IwRkJSeXhMUVVGTExFbEJRVWtzUlVGQlJUdFpRVU5rTEU5QlFVOHNTVUZCU1N4RFFVRkRPMU5CUTJZN1VVRkZSQ3hQUVVGUExFZEJRVWNzUTBGQlF5eEpRVUZKTEV0QlFVc3NTVUZCU1N4RlFVRkZPMWxCUTNSQ0xFZEJRVWNzUjBGQlJ5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRPMU5CUTJ4Q08xRkJSVVFzVDBGQlR5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRPMGxCUTNCQ0xFTkJRVU03U1VGQlFTeERRVUZETzBsQlIwWXNjMEpCUVVjc1IwRkJTRHRSUVVOSkxFbEJRVWtzUjBGQlJ5eEhRVUZITEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNN1VVRkRja0lzU1VGQlNTeEhRVUZITEV0QlFVc3NTVUZCU1N4RlFVRkZPMWxCUTJRc1QwRkJUeXhKUVVGSkxFTkJRVU03VTBGRFpqdFJRVVZFTEU5QlFVOHNSMEZCUnl4RFFVRkRMRXRCUVVzc1MwRkJTeXhKUVVGSkxFVkJRVVU3V1VGRGRrSXNSMEZCUnl4SFFVRkhMRWRCUVVjc1EwRkJReXhMUVVGTExFTkJRVU03VTBGRGJrSTdVVUZGUkN4UFFVRlBMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU03U1VGRGNFSXNRMEZCUXp0SlFVRkJMRU5CUVVNN1NVRkpSaXd5UWtGQlVTeEhRVUZTTzFGQlEwa3NUMEZCVHl4SlFVRkpMRkZCUVZFc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dEpRVU01UWl4RFFVRkRPMGxCUVVFc1EwRkJRenRKUVVkR0xIVkNRVUZKTEVkQlFVb3NWVUZCU3l4RlFVRkZPMUZCUTBnc1NVRkJTU3hGUVVGRkxFZEJRVWNzU1VGQlNTeERRVUZETEZGQlFWRXNSVUZCUlN4RlFVRkZMRWxCUVVrc1EwRkJRenRSUVVNdlFpeFBRVUZQTEVOQlFVTXNTVUZCU1N4SFFVRkhMRVZCUVVVc1EwRkJReXhKUVVGSkxFVkJRVVVzUTBGQlF5eExRVUZMTEVsQlFVa3NSVUZCUlR0WlFVTm9ReXhGUVVGRkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdVMEZEV2p0SlFVTk1MRU5CUVVNN1NVRkJRU3hEUVVGRE8wbEJSMFlzZDBKQlFVc3NSMEZCVEN4VlFVRk5MRVZCUVVVN1VVRkRTaXhKUVVGSkxFVkJRVVVzUjBGQlJ5eEpRVUZKTEVOQlFVTXNVVUZCVVN4RlFVRkZMRVZCUVVVc1NVRkJTU3hEUVVGRE8xRkJReTlDTEU5QlFVOHNRMEZCUXl4SlFVRkpMRWRCUVVjc1JVRkJSU3hEUVVGRExFbEJRVWtzUlVGQlJTeERRVUZETEV0QlFVc3NTVUZCU1N4RlFVRkZPMWxCUTJoRExFVkJRVVVzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXp0VFFVTmFPMGxCUTB3c1EwRkJRenRKUVVGQkxFTkJRVU03U1VGSFJpeDVRa0ZCVFN4SFFVRk9MRlZCUVU4c1NVRkJTU3hGUVVGRkxFZEJRVWM3VVVGRFdpeEpRVUZKTEVkQlFVY3NSMEZCUnl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRE8xRkJRM0pDTEVsQlFVa3NTVUZCU1N4SFFVRkhMRWxCUVVrc1EwRkJReXhSUVVGUkxFVkJRVVVzUTBGQlF6dFJRVVV6UWl4UFFVRlBMRWRCUVVjc1MwRkJTeXhKUVVGSkxFVkJRVVU3V1VGRGFrSXNTVUZCU1N4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExGZEJRVmNzUTBGQlF5eEpRVUZKTEVWQlFVVXNSMEZCUnl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRE8xbEJRM3BETEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1JVRkJSVHRuUWtGRFZDeEpRVUZKTEVOQlFVTXNUMEZCVHl4SFFVRkhMRWRCUVVjc1EwRkJRenRuUWtGRGJrSXNUMEZCVHl4SlFVRkpMRU5CUVVNN1lVRkRaanRaUVVORUxFbEJRVWtzUTBGQlF5eFZRVUZWTEVOQlFVTXNTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRE8xbEJRekZDTEVkQlFVY3NSMEZCUnl4SFFVRkhMRU5CUVVNc1UwRkJVeXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXp0VFFVTTVRanRSUVVWRUxFdEJRVXNzU1VGQlNTeERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRlZCUVZVc1EwRkJReXhOUVVGTkxFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNTVUZCU1N4RFFVRkRMRVZCUVVVc1JVRkJSU3hEUVVGRExFVkJRVVU3V1VGRGJFUXNSMEZCUnl4SFFVRkhMRWxCUVVrc1EwRkJReXhWUVVGVkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEZWtJc1NVRkJTU3hIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVU3WjBKQlEzcENMRWxCUVVrc1EwRkJReXhQUVVGUExFZEJRVWNzUjBGQlJ5eERRVUZETzJkQ1FVTnVRaXhKUVVGSkxFTkJRVU1zVlVGQlZTeERRVUZETEUxQlFVMHNSMEZCUnl4RFFVRkRMRU5CUVVNN1owSkJRek5DTEU5QlFVOHNTVUZCU1N4RFFVRkRPMkZCUTJZN1UwRkRTanRSUVVWRUxFbEJRVWtzUTBGQlF5eFZRVUZWTEVOQlFVTXNUVUZCVFN4SFFVRkhMRU5CUVVNc1EwRkJRenRSUVVNelFpeFBRVUZQTEVsQlFVa3NRMEZCUXp0SlFVTm9RaXhEUVVGRE8wbEJRVUVzUTBGQlF6dEpRVU5PTEdWQlFVTTdRVUZCUkN4RFFVRkRMRUZCTlVsRUxFbEJORWxETzBGQk5VbFpMRFJDUVVGUk8wRkJOa2x5UWp0SlFVbEpMR3RDUVVGWkxFbEJRVWs3VVVGRFdpeEpRVUZKTEVOQlFVTXNTMEZCU3l4SFFVRkhMRWxCUVVrc1EwRkJRenRSUVVOc1FpeEpRVUZKTEVOQlFVTXNWVUZCVlN4SFFVRkhMRVZCUVVVc1EwRkJRenRSUVVOeVFpeEpRVUZKTEVOQlFVTXNUMEZCVHl4SFFVRkhMRWxCUVVrc1EwRkJRenRKUVVONFFpeERRVUZETzBsQlJVUXNkVUpCUVVrc1IwRkJTanRSUVVOSkxFOUJRVThzU1VGQlNTeERRVUZETEU5QlFVOHNTMEZCU3l4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eFBRVUZQTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU03U1VGRE5VUXNRMEZCUXp0SlFVRkJMRU5CUVVNN1NVRkpSaXgxUWtGQlNTeEhRVUZLTzFGQlEwa3NTVUZCU1N4SlFVRkpMRU5CUVVNc1QwRkJUeXhMUVVGTExFbEJRVWtzUlVGQlJUdFpRVU4yUWl4SlFVRkpMRWxCUVVrc1IwRkJSeXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEV0QlFVc3NRMEZCUXp0WlFVTTFRaXhKUVVGSkxFbEJRVWtzUzBGQlN5eEpRVUZKTEVWQlFVVTdaMEpCUTJZc1NVRkJTU3hEUVVGRExGRkJRVkVzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXp0aFFVTjJRanRUUVVOS08yRkJRMGs3V1VGRFJDeEpRVUZKTEVsQlFVa3NRMEZCUXl4UFFVRlBMRU5CUVVNc1MwRkJTeXhMUVVGTExFbEJRVWtzUlVGQlJUdG5Ra0ZITjBJc1NVRkJTU3hKUVVGSkxFTkJRVU03WjBKQlExUXNSMEZCUnp0dlFrRkRReXhKUVVGSkxFZEJRVWNzU1VGQlNTeERRVUZETEU5QlFVOHNRMEZCUXp0dlFrRkRjRUlzU1VGQlNTeEpRVUZKTEVOQlFVTXNWVUZCVlN4RFFVRkRMRTFCUVUwc1JVRkJSVHQzUWtGRGVFSXNTVUZCU1N4RFFVRkRMRTlCUVU4c1IwRkJSeXhKUVVGSkxFTkJRVU1zVlVGQlZTeERRVUZETEVkQlFVY3NSVUZCUlN4RFFVRkRPM0ZDUVVONFF6dDVRa0ZEU1R0M1FrRkRSQ3hKUVVGSkxFTkJRVU1zVDBGQlR5eEhRVUZITEVsQlFVa3NRMEZCUXp0M1FrRkRjRUlzVFVGQlRUdHhRa0ZEVkR0cFFrRkRTaXhSUVVGUkxFbEJRVWtzUTBGQlF5eFBRVUZQTEVOQlFVTXNTMEZCU3l4TFFVRkxMRWxCUVVrc1JVRkJSVHRoUVVONlF6dHBRa0ZEU1R0blFrRkZSQ3hKUVVGSkxFTkJRVU1zVlVGQlZTeERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1QwRkJUeXhEUVVGRExFTkJRVU03WjBKQlEyNURMRWxCUVVrc1EwRkJReXhSUVVGUkxFTkJRVU1zU1VGQlNTeERRVUZETEU5QlFVOHNRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJRenRoUVVOeVF6dFRRVU5LTzFGQlEwUXNUMEZCVHl4SlFVRkpMRU5CUVVNc1QwRkJUeXhMUVVGTExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRTlCUVU4c1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXp0SlFVTTFSQ3hEUVVGRE8wbEJRVUVzUTBGQlF6dEpRVWxHTEhWQ1FVRkpMRWRCUVVvN1VVRkRTU3hKUVVGSkxFbEJRVWtzUTBGQlF5eFBRVUZQTEV0QlFVc3NTVUZCU1N4RlFVRkZPMWxCUTNaQ0xFbEJRVWtzU1VGQlNTeEhRVUZITEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1MwRkJTeXhEUVVGRE8xbEJRelZDTEVsQlFVa3NTVUZCU1N4TFFVRkxMRWxCUVVrc1JVRkJSVHRuUWtGRFppeEpRVUZKTEVOQlFVTXNVVUZCVVN4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRE8yRkJRM1pDTzFOQlEwbzdZVUZEU1R0WlFVTkVMRWxCUVVrc1NVRkJTU3hEUVVGRExFOUJRVThzUTBGQlF5eEpRVUZKTEV0QlFVc3NTVUZCU1N4RlFVRkZPMmRDUVVNMVFpeEpRVUZKTEVsQlFVa3NRMEZCUXp0blFrRkRWQ3hIUVVGSE8yOUNRVU5ETEVsQlFVa3NSMEZCUnl4SlFVRkpMRU5CUVVNc1QwRkJUeXhEUVVGRE8yOUNRVU53UWl4SlFVRkpMRWxCUVVrc1EwRkJReXhWUVVGVkxFTkJRVU1zVFVGQlRTeEZRVUZGTzNkQ1FVTjRRaXhKUVVGSkxFTkJRVU1zVDBGQlR5eEhRVUZITEVsQlFVa3NRMEZCUXl4VlFVRlZMRU5CUVVNc1IwRkJSeXhGUVVGRkxFTkJRVU03Y1VKQlEzaERPM2xDUVVOSk8zZENRVU5FTEVsQlFVa3NRMEZCUXl4UFFVRlBMRWRCUVVjc1NVRkJTU3hEUVVGRE8zZENRVU53UWl4TlFVRk5PM0ZDUVVOVU8ybENRVU5LTEZGQlFWRXNTVUZCU1N4RFFVRkRMRTlCUVU4c1EwRkJReXhKUVVGSkxFdEJRVXNzU1VGQlNTeEZRVUZGTzJGQlEzaERPMmxDUVVOSk8yZENRVU5FTEVsQlFVa3NRMEZCUXl4VlFVRlZMRU5CUVVNc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eFBRVUZQTEVOQlFVTXNRMEZCUXp0blFrRkRia01zU1VGQlNTeERRVUZETEZGQlFWRXNRMEZCUXl4SlFVRkpMRU5CUVVNc1QwRkJUeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzJGQlEzQkRPMU5CUTBvN1VVRkRSQ3hQUVVGUExFbEJRVWtzUTBGQlF5eFBRVUZQTEV0QlFVc3NTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zVDBGQlR5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRE8wbEJRelZFTEVOQlFVTTdTVUZCUVN4RFFVRkRPMGxCUlVZc01rSkJRVkVzUjBGQlVpeFZRVUZUTEV0QlFVczdVVUZEVml4UFFVRlBMRXRCUVVzc1EwRkJReXhKUVVGSkxFdEJRVXNzU1VGQlNTeEZRVUZGTzFsQlEzaENMRWxCUVVrc1EwRkJReXhWUVVGVkxFTkJRVU1zU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRPMWxCUXpWQ0xFdEJRVXNzUjBGQlJ5eExRVUZMTEVOQlFVTXNTVUZCU1N4RFFVRkRPMU5CUTNSQ08xRkJRMFFzU1VGQlNTeERRVUZETEU5QlFVOHNSMEZCUnl4TFFVRkxMRU5CUVVNN1NVRkRla0lzUTBGQlF6dEpRVUZCTEVOQlFVTTdTVUZGUml3eVFrRkJVU3hIUVVGU0xGVkJRVk1zUzBGQlN6dFJRVU5XTEU5QlFVOHNTMEZCU3l4RFFVRkRMRXRCUVVzc1MwRkJTeXhKUVVGSkxFVkJRVVU3V1VGRGVrSXNTVUZCU1N4RFFVRkRMRlZCUVZVc1EwRkJReXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTTdXVUZETlVJc1MwRkJTeXhIUVVGSExFdEJRVXNzUTBGQlF5eExRVUZMTEVOQlFVTTdVMEZEZGtJN1VVRkRSQ3hKUVVGSkxFTkJRVU1zVDBGQlR5eEhRVUZITEV0QlFVc3NRMEZCUXp0SlFVTjZRaXhEUVVGRE8wbEJRVUVzUTBGQlF6dEpRVU5PTEdWQlFVTTdRVUZCUkN4RFFVRkRMRUZCT1VaRUxFbEJPRVpETzBGQk9VWlpMRFJDUVVGUk8wRkJaMGR5UWp0SlFVdEpMR05CUVZrc1NVRkJTVHRSUVVOYUxFbEJRVWtzUTBGQlF5eEpRVUZKTEVkQlFVY3NTVUZCU1N4RFFVRkRPMUZCUTJwQ0xFbEJRVWtzUTBGQlF5eEpRVUZKTEVkQlFVY3NTVUZCU1N4RFFVRkRPMUZCUTJwQ0xFbEJRVWtzUTBGQlF5eExRVUZMTEVkQlFVY3NTVUZCU1N4RFFVRkRPMUZCUTJ4Q0xFbEJRVWtzUTBGQlF5eEhRVUZITEVkQlFVY3NTVUZCU1N4RFFVRkRPMGxCUTNCQ0xFTkJRVU03U1VGRlJDeDNRa0ZCVXl4SFFVRlVMRlZCUVZVc1IwRkJSenRSUVVOVUxFOUJRVThzUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRPMGxCUTNoRExFTkJRVU03U1VGQlFTeERRVUZETzBsQlJVWXNkMEpCUVZNc1IwRkJWQ3hWUVVGVkxFZEJRVWNzUlVGQlJTeEhRVUZITzFGQlEyUXNTVUZCU1N4SFFVRkhMRVZCUVVVN1dVRkRUQ3hKUVVGSkxFTkJRVU1zUzBGQlN5eEhRVUZITEVkQlFVY3NRMEZCUXp0VFFVTndRanRoUVVOSk8xbEJRMFFzU1VGQlNTeERRVUZETEVsQlFVa3NSMEZCUnl4SFFVRkhMRU5CUVVNN1UwRkRia0k3U1VGRFRDeERRVUZETzBsQlFVRXNRMEZCUXp0SlFVTk9MRmRCUVVNN1FVRkJSQ3hEUVVGRExFRkJlRUpFTEVsQmQwSkRPMEZCUlVRN1NVRkJLMElzTUVKQlFWRTdTVUZMYmtNc1owSkJRVmtzVlVGQmEwTTdVVUZCT1VNc1dVRkRTU3hwUWtGQlR5eFRRVWxXTzFGQlNFY3NTMEZCU1N4RFFVRkRMRXRCUVVzc1IwRkJSeXhKUVVGSkxFTkJRVU03VVVGRGJFSXNTMEZCU1N4RFFVRkRMRmRCUVZjc1IwRkJSeXhWUVVGVkxFTkJRVU03VVVGRE9VSXNTMEZCU1N4RFFVRkRMRWxCUVVrc1IwRkJSeXhEUVVGRExFTkJRVU03TzBsQlEyeENMRU5CUVVNN1NVRkhSQ3gxUWtGQlRTeEhRVUZPTEZWQlFVOHNTVUZCU1R0UlFVTlFMRWxCUVVrc1IwRkJSeXhIUVVGSExFdEJRVXNzUTBGQlF6dFJRVVZvUWl4SlFVRkpMRWxCUVVrc1EwRkJReXhMUVVGTExFdEJRVXNzU1VGQlNTeEZRVUZGTzFsQlJYSkNMRWxCUVVrc1EwRkJReXhMUVVGTExFZEJRVWNzU1VGQlNTeEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNN1dVRkROVUlzUjBGQlJ5eEhRVUZITEVsQlFVa3NRMEZCUXp0WlFVTllMRWxCUVVrc1EwRkJReXhKUVVGSkxFVkJRVVVzUTBGQlF6dFRRVU5tTzJGQlEwazdXVUZEUkN4SlFVRkpMRWxCUVVrc1IwRkJSeXhKUVVGSkxFbEJRVWtzUTBGQlF5eFRRVUZUTEVOQlFVTXNRMEZCUXp0WlFVVXZRaXhKUVVGSkxFZEJRVWNzUjBGQlJ5eExRVUZMTEVOQlFVTTdXVUZEYUVJc1NVRkJTU3hKUVVGSkxFZEJRVWNzUzBGQlN5eERRVUZETzFsQlIycENMRWxCUVVrc1JVRkJSU3hIUVVGSExFbEJRVWtzUTBGQlF6dFpRVU5rTEVsQlFVa3NSMEZCUnl4SFFVRkhMRWxCUVVrc1EwRkJRenRaUVVObUxFbEJRVWtzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXp0WlFVTmlMRWxCUVVrc1NVRkJTU3hIUVVGSExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTTdXVUZEZEVJc1IwRkJSeXhEUVVGRExFdEJRVXNzUjBGQlJ5eEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRPMWxCUjNaQ0xFOUJRVThzU1VGQlNTeEZRVUZGTzJkQ1FVTlVMRWxCUVVrc1NVRkJTU3hMUVVGTExFbEJRVWtzUlVGQlJUdHZRa0ZGWml4SlFVRkpMRWRCUVVjc1NVRkJTU3hKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdiMEpCUTNSQ0xFTkJRVU1zUTBGQlF5eFRRVUZUTEVOQlFVTXNSMEZCUnl4RlFVRkZMRWxCUVVrc1EwRkJReXhEUVVGRE8yOUNRVU4yUWl4SFFVRkhMRWRCUVVjc1NVRkJTU3hEUVVGRE8yOUNRVU5ZTEVsQlFVa3NRMEZCUXl4SlFVRkpMRVZCUVVVc1EwRkJRenRwUWtGRFpqdHhRa0ZEU1N4SlFVRkpMRTFCUVUwc1EwRkJReXhOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMRTFCUVUwc1EwRkJReXhOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4RlFVRkZPMjlDUVVVMVJDeEpRVUZKTEVOQlFVTXNSMEZCUnl4SFFVRkhMRWxCUVVrc1EwRkJRenR2UWtGRGFFSXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhIUVVGSExFZEJRVWNzUzBGQlN5eERRVUZETzI5Q1FVTjBRaXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEVkQlFVY3NSMEZCUnl4TFFVRkxMRU5CUVVNN2FVSkJRekZDTzJkQ1FVZEVMRWxCUVVrc1RVRkJUU3hEUVVGRExFMUJRVTBzUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4TlFVRk5MRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTzI5Q1FVTjZReXhKUVVGSkxFbEJRVWtzUjBGQlJ5eEhRVUZITEVOQlFVTXNTMEZCU3l4TFFVRkxMRVZCUVVVc1EwRkJRenR2UWtGRk5VSXNTVUZCU1N4SlFVRkpMRXRCUVVzc1EwRkJReXhEUVVGRExGTkJRVk1zUTBGQlF5eEpRVUZKTEVOQlFVTXNSVUZCUlR0M1FrRkROVUlzUjBGQlJ5eERRVUZETEZOQlFWTXNRMEZCUXl4SlFVRkpMRVZCUVVVc1RVRkJUU3hEUVVGRExHRkJRV0VzUTBGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRE8zRkNRVU40UkR0NVFrRkRTVHQzUWtGRFJDeEhRVUZITEVOQlFVTXNVMEZCVXl4RFFVRkRMRWxCUVVrc1JVRkJSU3hOUVVGTkxFTkJRVU1zWVVGQllTeERRVUZETEVWQlFVVXNSVUZCUlN4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU03Y1VKQlEzaEVPMmxDUVVOS08yZENRVVZFTEVsQlFVa3NSMEZCUnl4SFFVRkhMRWxCUVVrc1EwRkJReXhYUVVGWExFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJRenRuUWtGSE5VTXNTVUZCU1N4SFFVRkhMRXRCUVVzc1EwRkJReXhGUVVGRk8yOUNRVU5ZTEUxQlFVMDdhVUpCUTFRN1owSkJSVVFzU1VGQlNTeEhRVUZITEVkQlFVY3NRMEZCUXp0blFrRkRXQ3hIUVVGSExFZEJRVWNzUjBGQlJ5eEhRVUZITEVOQlFVTXNRMEZCUXp0blFrRkhaQ3hKUVVGSkxFVkJRVVVzUzBGQlN5eEpRVUZKTEVWQlFVVTdiMEpCUTJJc1IwRkJSeXhIUVVGSExFVkJRVVVzUTBGQlF6dHBRa0ZEV2p0blFrRkRSQ3hGUVVGRkxFZEJRVWNzUTBGQlF5eERRVUZETzJkQ1FVTlFMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU03WjBKQlExUXNTVUZCU1N4SFFVRkhMRWxCUVVrc1EwRkJReXhUUVVGVExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTTdZVUZET1VJN1dVRkhSQ3hKUVVGSkxFTkJRVU1zUzBGQlN5eEhRVUZITEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNN1UwRkRNMEk3VVVGSFJDeEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRWRCUVVjc1IwRkJSeXhMUVVGTExFTkJRVU03VVVGRmRrSXNUMEZCVHl4SFFVRkhMRU5CUVVNN1NVRkRaaXhEUVVGRE8wbEJRVUVzUTBGQlF6dEpRVWRHTEhWQ1FVRk5MRWRCUVU0c1ZVRkJUeXhKUVVGSk8xRkJRMUFzU1VGQlNTeEpRVUZKTEVOQlFVTXNTMEZCU3l4TFFVRkxMRWxCUVVrc1JVRkJSVHRaUVVOeVFpeFBRVUZQTEV0QlFVc3NRMEZCUXp0VFFVTm9RanRSUVVWRUxFbEJRVWtzU1VGQlNTeEhRVUZITEVsQlFVa3NTVUZCU1N4RFFVRkRMRk5CUVZNc1EwRkJReXhEUVVGRE8xRkJReTlDTEVsQlFVa3NTVUZCU1N4SFFVRkhMRWxCUVVrc1EwRkJRenRSUVVOb1FpeEpRVUZKTEVOQlFVTXNTMEZCU3l4SFFVRkhMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU03VVVGRGVFSXNTVUZCU1N4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRE8xRkJRMklzU1VGQlNTeEZRVUZGTEVkQlFVY3NTVUZCU1N4RFFVRkRPMUZCUTJRc1NVRkJTU3hMUVVGTExFZEJRVWNzU1VGQlNTeERRVUZETzFGQlEycENMRWxCUVVrc1IwRkJSeXhIUVVGSExFbEJRVWtzUTBGQlF6dFJRVVZtTEU5QlFVOHNTVUZCU1N4RFFVRkRMRk5CUVZNc1EwRkJReXhIUVVGSExFTkJRVU1zUzBGQlN5eEpRVUZKTEVWQlFVVTdXVUZEYWtNc1NVRkJTU3hKUVVGSkxFZEJRVWNzUjBGQlJ5eERRVUZETzFsQlIyWXNSVUZCUlN4SFFVRkhMRU5CUVVNc1EwRkJRenRaUVVOUUxFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTTdXVUZEVkN4SlFVRkpMRWRCUVVjc1NVRkJTU3hEUVVGRExGTkJRVk1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0WlFVVXpRaXhKUVVGSkxFZEJRVWNzUjBGQlJ5eEpRVUZKTEVOQlFVTXNWMEZCVnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdXVUZGTlVNc1IwRkJSeXhIUVVGSExFZEJRVWNzUjBGQlJ5eERRVUZETEVOQlFVTTdXVUZIWkN4SlFVRkpMRWRCUVVjc1MwRkJTeXhEUVVGRExFVkJRVVU3WjBKQlExZ3NTMEZCU3l4SFFVRkhMRWxCUVVrc1EwRkJRenRoUVVOb1FqdFpRVWRFTEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1RVRkJUU3hEUVVGRExFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRTFCUVUwc1EwRkJReXhKUVVGSkxFTkJRVU1zVTBGQlV5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRVZCUVVVN1owSkJRemRFTEVsQlFVa3NUVUZCVFN4RFFVRkRMRTFCUVUwc1EwRkJReXhKUVVGSkxFTkJRVU1zVTBGQlV5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1JVRkJSVHR2UWtGRGNrTXNTVUZCU1N4RlFVRkZMRWRCUVVjc1RVRkJUU3hEUVVGRExHRkJRV0VzUTBGQlF5eEpRVUZKTEVWQlFVVXNSMEZCUnl4RFFVRkRMRU5CUVVNN2IwSkJRM3BETEVOQlFVTXNRMEZCUXl4VFFVRlRMRU5CUVVNc1NVRkJTU3hGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZETzI5Q1FVTjBRaXhEUVVGRExFZEJRVWNzUlVGQlJTeERRVUZETzJsQ1FVTldPM0ZDUVVOSkxFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNUVUZCVFN4RFFVRkRMRWxCUVVrc1EwRkJReXhUUVVGVExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RlFVRkZPMjlDUVVNelF5eEpRVUZKTEU5QlFVOHNSMEZCUnl4RFFVRkRMRU5CUVVNc1UwRkJVeXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdiMEpCUTJwRExFbEJRVWtzVDBGQlR5eExRVUZMTEVsQlFVa3NSVUZCUlR0M1FrRkRiRUlzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4TlFVRk5MRU5CUVVNc1QwRkJUeXhEUVVGRExGTkJRVk1zUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zVFVGQlRTeERRVUZETEU5QlFVOHNRMEZCUXl4VFFVRlRMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUlVGQlJUczBRa0ZGY2tZc1EwRkJReXhEUVVGRExFZEJRVWNzUjBGQlJ5eExRVUZMTEVOQlFVTTdORUpCUTJRc1QwRkJUeXhEUVVGRExFZEJRVWNzUjBGQlJ5eEpRVUZKTEVOQlFVTTdORUpCUTI1Q0xFbEJRVWtzUTBGQlF5eEhRVUZITEVkQlFVY3NTVUZCU1N4RFFVRkRPM2xDUVVOdVFqczJRa0ZEU1RzMFFrRkRSQ3hKUVVGSkxFbEJRVWtzUjBGQlJ5eEZRVUZGTEVOQlFVTXNTMEZCU3l4TFFVRkxMRU5CUVVNc1EwRkJRenMwUWtGRk1VSXNTVUZCU1N4TlFVRk5MRU5CUVVNc1RVRkJUU3hEUVVGRExFOUJRVThzUTBGQlF5eFRRVUZUTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1JVRkJSVHRuUTBGRGVFTXNSVUZCUlN4RFFVRkRMRk5CUVZNc1EwRkJReXhKUVVGSkxFVkJRVVVzVFVGQlRTeERRVUZETEdGQlFXRXNRMEZCUXl4RFFVRkRMRVZCUVVVc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF6czJRa0ZEY2tRN2FVTkJRMGtzU1VGQlNTeE5RVUZOTEVOQlFVTXNUVUZCVFN4RFFVRkRMRTlCUVU4c1EwRkJReXhUUVVGVExFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RlFVRkZPMmREUVVNNVF5eEZRVUZGTEVOQlFVTXNVMEZCVXl4RFFVRkRMRWxCUVVrc1JVRkJSU3hOUVVGTkxFTkJRVU1zWVVGQllTeERRVUZETEVOQlFVTXNSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRE96WkNRVU55UkRzMFFrRkhSQ3hKUVVGSkxFZEJRVWNzUjBGQlJ5eEZRVUZGTEVOQlFVTXNVMEZCVXl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRE96UkNRVU0zUWl4SFFVRkhMRU5CUVVNc1IwRkJSeXhIUVVGSExFbEJRVWtzUTBGQlF6czBRa0ZEWml4SlFVRkpMRU5CUVVNc1IwRkJSeXhIUVVGSExFbEJRVWtzUTBGQlF6czBRa0ZEYUVJc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eEhRVUZITEVkQlFVY3NTMEZCU3l4RFFVRkRPelJDUVVOeVFpeEhRVUZITEVOQlFVTXNTMEZCU3l4RFFVRkRMRWRCUVVjc1IwRkJSeXhMUVVGTExFTkJRVU03ZVVKQlEzcENPM0ZDUVVOS08ybENRVU5LTzJGQlEwbzdVMEZEU2p0UlFVZEVMRWxCUVVrc1MwRkJTeXhMUVVGTExFbEJRVWtzUlVGQlJUdFpRVU5vUWl4TFFVRkxMRU5CUVVNc1NVRkJTU3hIUVVGSExFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTTdXVUZEZGtJc1EwRkJReXhEUVVGRExGTkJRVk1zUTBGQlF5eERRVUZETEVOQlFVTXNTMEZCU3l4TFFVRkxMRWxCUVVrc1JVRkJSU3hKUVVGSkxFTkJRVU1zVTBGQlV5eERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMRXRCUVVzc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU5zUlN4SlFVRkpMRU5CUVVNc1NVRkJTU3hGUVVGRkxFTkJRVU03VTBGRFpqdFJRVWRFTEVsQlFVa3NRMEZCUXl4TFFVRkxMRWRCUVVjc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF6dFJRVU40UWl4SlFVRkpMRWxCUVVrc1EwRkJReXhMUVVGTExFdEJRVXNzU1VGQlNTeEZRVUZGTzFsQlEzSkNMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zUjBGQlJ5eEhRVUZITEV0QlFVc3NRMEZCUXp0VFFVTXhRanRSUVVWRUxFOUJRVThzUzBGQlN5eExRVUZMTEVsQlFVa3NRMEZCUXp0SlFVTXhRaXhEUVVGRE8wbEJRVUVzUTBGQlF6dEpRVVZMTEdGQlFVMHNSMEZCWWl4VlFVRmpMRWxCUVVrN1VVRkRaQ3hQUVVGUExFbEJRVWtzUzBGQlN5eEpRVUZKTEVsQlFVa3NTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJRenRKUVVOeVF5eERRVUZETzBsQlJVMHNiMEpCUVdFc1IwRkJjRUlzVlVGQmNVSXNTVUZCU1N4RlFVRkZMRWRCUVVjN1VVRkRNVUlzU1VGQlNTeEpRVUZKTEVkQlFVY3NTVUZCU1N4RFFVRkRMRk5CUVZNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETzFGQlJXaERMRWxCUVVrc1EwRkJReXhUUVVGVExFTkJRVU1zUTBGQlF5eEhRVUZITEVWQlFVVXNTVUZCU1N4RFFVRkRMRk5CUVZNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlF6RkRMRWxCUVVrc1EwRkJReXhUUVVGVExFTkJRVU1zUjBGQlJ5eEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRPMUZCUlRGQ0xFbEJRVWtzUTBGQlF5eEhRVUZITEVkQlFVY3NTVUZCU1N4RFFVRkRPMUZCUTJoQ0xFbEJRVWtzUTBGQlF5eEhRVUZITEVkQlFVY3NTMEZCU3l4RFFVRkRPMUZCUldwQ0xFOUJRVThzU1VGQlNTeERRVUZETzBsQlEyaENMRU5CUVVNN1NVRkZUU3h2UWtGQllTeEhRVUZ3UWl4VlFVRnhRaXhKUVVGSkxFVkJRVVVzUjBGQlJ6dFJRVU14UWl4SlFVRkpMRU5CUVVNc1UwRkJVeXhEUVVGRExFTkJRVU1zUjBGQlJ5eEZRVUZGTEUxQlFVMHNRMEZCUXl4aFFVRmhMRU5CUVVNc1NVRkJTU3hEUVVGRExGTkJRVk1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU4yUlN4UFFVRlBMRTFCUVUwc1EwRkJReXhoUVVGaExFTkJRVU1zU1VGQlNTeEZRVUZGTEVkQlFVY3NRMEZCUXl4RFFVRkRPMGxCUXpORExFTkJRVU03U1VGRFRDeGhRVUZETzBGQlFVUXNRMEZCUXl4QlFYSk5SQ3hEUVVFclFpeFJRVUZSTEVkQmNVMTBRenRCUVhKTldTeDNRa0ZCVFNKOSIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fZXh0ZW5kcyA9ICh0aGlzICYmIHRoaXMuX19leHRlbmRzKSB8fCAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBleHRlbmRTdGF0aWNzID0gZnVuY3Rpb24gKGQsIGIpIHtcbiAgICAgICAgZXh0ZW5kU3RhdGljcyA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fFxuICAgICAgICAgICAgKHsgX19wcm90b19fOiBbXSB9IGluc3RhbmNlb2YgQXJyYXkgJiYgZnVuY3Rpb24gKGQsIGIpIHsgZC5fX3Byb3RvX18gPSBiOyB9KSB8fFxuICAgICAgICAgICAgZnVuY3Rpb24gKGQsIGIpIHsgZm9yICh2YXIgcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwKSkgZFtwXSA9IGJbcF07IH07XG4gICAgICAgIHJldHVybiBleHRlbmRTdGF0aWNzKGQsIGIpO1xuICAgIH07XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkLCBiKSB7XG4gICAgICAgIGV4dGVuZFN0YXRpY3MoZCwgYik7XG4gICAgICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxuICAgICAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XG4gICAgfTtcbn0pKCk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgdnBzY18xID0gcmVxdWlyZShcIi4vdnBzY1wiKTtcbnZhciByYnRyZWVfMSA9IHJlcXVpcmUoXCIuL3JidHJlZVwiKTtcbmZ1bmN0aW9uIGNvbXB1dGVHcm91cEJvdW5kcyhnKSB7XG4gICAgZy5ib3VuZHMgPSB0eXBlb2YgZy5sZWF2ZXMgIT09IFwidW5kZWZpbmVkXCIgP1xuICAgICAgICBnLmxlYXZlcy5yZWR1Y2UoZnVuY3Rpb24gKHIsIGMpIHsgcmV0dXJuIGMuYm91bmRzLnVuaW9uKHIpOyB9LCBSZWN0YW5nbGUuZW1wdHkoKSkgOlxuICAgICAgICBSZWN0YW5nbGUuZW1wdHkoKTtcbiAgICBpZiAodHlwZW9mIGcuZ3JvdXBzICE9PSBcInVuZGVmaW5lZFwiKVxuICAgICAgICBnLmJvdW5kcyA9IGcuZ3JvdXBzLnJlZHVjZShmdW5jdGlvbiAociwgYykgeyByZXR1cm4gY29tcHV0ZUdyb3VwQm91bmRzKGMpLnVuaW9uKHIpOyB9LCBnLmJvdW5kcyk7XG4gICAgZy5ib3VuZHMgPSBnLmJvdW5kcy5pbmZsYXRlKGcucGFkZGluZyk7XG4gICAgcmV0dXJuIGcuYm91bmRzO1xufVxuZXhwb3J0cy5jb21wdXRlR3JvdXBCb3VuZHMgPSBjb21wdXRlR3JvdXBCb3VuZHM7XG52YXIgUmVjdGFuZ2xlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBSZWN0YW5nbGUoeCwgWCwgeSwgWSkge1xuICAgICAgICB0aGlzLnggPSB4O1xuICAgICAgICB0aGlzLlggPSBYO1xuICAgICAgICB0aGlzLnkgPSB5O1xuICAgICAgICB0aGlzLlkgPSBZO1xuICAgIH1cbiAgICBSZWN0YW5nbGUuZW1wdHkgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBuZXcgUmVjdGFuZ2xlKE51bWJlci5QT1NJVElWRV9JTkZJTklUWSwgTnVtYmVyLk5FR0FUSVZFX0lORklOSVRZLCBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFksIE51bWJlci5ORUdBVElWRV9JTkZJTklUWSk7IH07XG4gICAgUmVjdGFuZ2xlLnByb3RvdHlwZS5jeCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICh0aGlzLnggKyB0aGlzLlgpIC8gMjsgfTtcbiAgICBSZWN0YW5nbGUucHJvdG90eXBlLmN5ID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gKHRoaXMueSArIHRoaXMuWSkgLyAyOyB9O1xuICAgIFJlY3RhbmdsZS5wcm90b3R5cGUub3ZlcmxhcFggPSBmdW5jdGlvbiAocikge1xuICAgICAgICB2YXIgdXggPSB0aGlzLmN4KCksIHZ4ID0gci5jeCgpO1xuICAgICAgICBpZiAodXggPD0gdnggJiYgci54IDwgdGhpcy5YKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuWCAtIHIueDtcbiAgICAgICAgaWYgKHZ4IDw9IHV4ICYmIHRoaXMueCA8IHIuWClcbiAgICAgICAgICAgIHJldHVybiByLlggLSB0aGlzLng7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH07XG4gICAgUmVjdGFuZ2xlLnByb3RvdHlwZS5vdmVybGFwWSA9IGZ1bmN0aW9uIChyKSB7XG4gICAgICAgIHZhciB1eSA9IHRoaXMuY3koKSwgdnkgPSByLmN5KCk7XG4gICAgICAgIGlmICh1eSA8PSB2eSAmJiByLnkgPCB0aGlzLlkpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5ZIC0gci55O1xuICAgICAgICBpZiAodnkgPD0gdXkgJiYgdGhpcy55IDwgci5ZKVxuICAgICAgICAgICAgcmV0dXJuIHIuWSAtIHRoaXMueTtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfTtcbiAgICBSZWN0YW5nbGUucHJvdG90eXBlLnNldFhDZW50cmUgPSBmdW5jdGlvbiAoY3gpIHtcbiAgICAgICAgdmFyIGR4ID0gY3ggLSB0aGlzLmN4KCk7XG4gICAgICAgIHRoaXMueCArPSBkeDtcbiAgICAgICAgdGhpcy5YICs9IGR4O1xuICAgIH07XG4gICAgUmVjdGFuZ2xlLnByb3RvdHlwZS5zZXRZQ2VudHJlID0gZnVuY3Rpb24gKGN5KSB7XG4gICAgICAgIHZhciBkeSA9IGN5IC0gdGhpcy5jeSgpO1xuICAgICAgICB0aGlzLnkgKz0gZHk7XG4gICAgICAgIHRoaXMuWSArPSBkeTtcbiAgICB9O1xuICAgIFJlY3RhbmdsZS5wcm90b3R5cGUud2lkdGggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLlggLSB0aGlzLng7XG4gICAgfTtcbiAgICBSZWN0YW5nbGUucHJvdG90eXBlLmhlaWdodCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuWSAtIHRoaXMueTtcbiAgICB9O1xuICAgIFJlY3RhbmdsZS5wcm90b3R5cGUudW5pb24gPSBmdW5jdGlvbiAocikge1xuICAgICAgICByZXR1cm4gbmV3IFJlY3RhbmdsZShNYXRoLm1pbih0aGlzLngsIHIueCksIE1hdGgubWF4KHRoaXMuWCwgci5YKSwgTWF0aC5taW4odGhpcy55LCByLnkpLCBNYXRoLm1heCh0aGlzLlksIHIuWSkpO1xuICAgIH07XG4gICAgUmVjdGFuZ2xlLnByb3RvdHlwZS5saW5lSW50ZXJzZWN0aW9ucyA9IGZ1bmN0aW9uICh4MSwgeTEsIHgyLCB5Mikge1xuICAgICAgICB2YXIgc2lkZXMgPSBbW3RoaXMueCwgdGhpcy55LCB0aGlzLlgsIHRoaXMueV0sXG4gICAgICAgICAgICBbdGhpcy5YLCB0aGlzLnksIHRoaXMuWCwgdGhpcy5ZXSxcbiAgICAgICAgICAgIFt0aGlzLlgsIHRoaXMuWSwgdGhpcy54LCB0aGlzLlldLFxuICAgICAgICAgICAgW3RoaXMueCwgdGhpcy5ZLCB0aGlzLngsIHRoaXMueV1dO1xuICAgICAgICB2YXIgaW50ZXJzZWN0aW9ucyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDQ7ICsraSkge1xuICAgICAgICAgICAgdmFyIHIgPSBSZWN0YW5nbGUubGluZUludGVyc2VjdGlvbih4MSwgeTEsIHgyLCB5Miwgc2lkZXNbaV1bMF0sIHNpZGVzW2ldWzFdLCBzaWRlc1tpXVsyXSwgc2lkZXNbaV1bM10pO1xuICAgICAgICAgICAgaWYgKHIgIT09IG51bGwpXG4gICAgICAgICAgICAgICAgaW50ZXJzZWN0aW9ucy5wdXNoKHsgeDogci54LCB5OiByLnkgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGludGVyc2VjdGlvbnM7XG4gICAgfTtcbiAgICBSZWN0YW5nbGUucHJvdG90eXBlLnJheUludGVyc2VjdGlvbiA9IGZ1bmN0aW9uICh4MiwgeTIpIHtcbiAgICAgICAgdmFyIGludHMgPSB0aGlzLmxpbmVJbnRlcnNlY3Rpb25zKHRoaXMuY3goKSwgdGhpcy5jeSgpLCB4MiwgeTIpO1xuICAgICAgICByZXR1cm4gaW50cy5sZW5ndGggPiAwID8gaW50c1swXSA6IG51bGw7XG4gICAgfTtcbiAgICBSZWN0YW5nbGUucHJvdG90eXBlLnZlcnRpY2VzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgeyB4OiB0aGlzLngsIHk6IHRoaXMueSB9LFxuICAgICAgICAgICAgeyB4OiB0aGlzLlgsIHk6IHRoaXMueSB9LFxuICAgICAgICAgICAgeyB4OiB0aGlzLlgsIHk6IHRoaXMuWSB9LFxuICAgICAgICAgICAgeyB4OiB0aGlzLngsIHk6IHRoaXMuWSB9XG4gICAgICAgIF07XG4gICAgfTtcbiAgICBSZWN0YW5nbGUubGluZUludGVyc2VjdGlvbiA9IGZ1bmN0aW9uICh4MSwgeTEsIHgyLCB5MiwgeDMsIHkzLCB4NCwgeTQpIHtcbiAgICAgICAgdmFyIGR4MTIgPSB4MiAtIHgxLCBkeDM0ID0geDQgLSB4MywgZHkxMiA9IHkyIC0geTEsIGR5MzQgPSB5NCAtIHkzLCBkZW5vbWluYXRvciA9IGR5MzQgKiBkeDEyIC0gZHgzNCAqIGR5MTI7XG4gICAgICAgIGlmIChkZW5vbWluYXRvciA9PSAwKVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIHZhciBkeDMxID0geDEgLSB4MywgZHkzMSA9IHkxIC0geTMsIG51bWEgPSBkeDM0ICogZHkzMSAtIGR5MzQgKiBkeDMxLCBhID0gbnVtYSAvIGRlbm9taW5hdG9yLCBudW1iID0gZHgxMiAqIGR5MzEgLSBkeTEyICogZHgzMSwgYiA9IG51bWIgLyBkZW5vbWluYXRvcjtcbiAgICAgICAgaWYgKGEgPj0gMCAmJiBhIDw9IDEgJiYgYiA+PSAwICYmIGIgPD0gMSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB4OiB4MSArIGEgKiBkeDEyLFxuICAgICAgICAgICAgICAgIHk6IHkxICsgYSAqIGR5MTJcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfTtcbiAgICBSZWN0YW5nbGUucHJvdG90eXBlLmluZmxhdGUgPSBmdW5jdGlvbiAocGFkKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVjdGFuZ2xlKHRoaXMueCAtIHBhZCwgdGhpcy5YICsgcGFkLCB0aGlzLnkgLSBwYWQsIHRoaXMuWSArIHBhZCk7XG4gICAgfTtcbiAgICByZXR1cm4gUmVjdGFuZ2xlO1xufSgpKTtcbmV4cG9ydHMuUmVjdGFuZ2xlID0gUmVjdGFuZ2xlO1xuZnVuY3Rpb24gbWFrZUVkZ2VCZXR3ZWVuKHNvdXJjZSwgdGFyZ2V0LCBhaCkge1xuICAgIHZhciBzaSA9IHNvdXJjZS5yYXlJbnRlcnNlY3Rpb24odGFyZ2V0LmN4KCksIHRhcmdldC5jeSgpKSB8fCB7IHg6IHNvdXJjZS5jeCgpLCB5OiBzb3VyY2UuY3koKSB9LCB0aSA9IHRhcmdldC5yYXlJbnRlcnNlY3Rpb24oc291cmNlLmN4KCksIHNvdXJjZS5jeSgpKSB8fCB7IHg6IHRhcmdldC5jeCgpLCB5OiB0YXJnZXQuY3koKSB9LCBkeCA9IHRpLnggLSBzaS54LCBkeSA9IHRpLnkgLSBzaS55LCBsID0gTWF0aC5zcXJ0KGR4ICogZHggKyBkeSAqIGR5KSwgYWwgPSBsIC0gYWg7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc291cmNlSW50ZXJzZWN0aW9uOiBzaSxcbiAgICAgICAgdGFyZ2V0SW50ZXJzZWN0aW9uOiB0aSxcbiAgICAgICAgYXJyb3dTdGFydDogeyB4OiBzaS54ICsgYWwgKiBkeCAvIGwsIHk6IHNpLnkgKyBhbCAqIGR5IC8gbCB9XG4gICAgfTtcbn1cbmV4cG9ydHMubWFrZUVkZ2VCZXR3ZWVuID0gbWFrZUVkZ2VCZXR3ZWVuO1xuZnVuY3Rpb24gbWFrZUVkZ2VUbyhzLCB0YXJnZXQsIGFoKSB7XG4gICAgdmFyIHRpID0gdGFyZ2V0LnJheUludGVyc2VjdGlvbihzLngsIHMueSk7XG4gICAgaWYgKCF0aSlcbiAgICAgICAgdGkgPSB7IHg6IHRhcmdldC5jeCgpLCB5OiB0YXJnZXQuY3koKSB9O1xuICAgIHZhciBkeCA9IHRpLnggLSBzLngsIGR5ID0gdGkueSAtIHMueSwgbCA9IE1hdGguc3FydChkeCAqIGR4ICsgZHkgKiBkeSk7XG4gICAgcmV0dXJuIHsgeDogdGkueCAtIGFoICogZHggLyBsLCB5OiB0aS55IC0gYWggKiBkeSAvIGwgfTtcbn1cbmV4cG9ydHMubWFrZUVkZ2VUbyA9IG1ha2VFZGdlVG87XG52YXIgTm9kZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTm9kZSh2LCByLCBwb3MpIHtcbiAgICAgICAgdGhpcy52ID0gdjtcbiAgICAgICAgdGhpcy5yID0gcjtcbiAgICAgICAgdGhpcy5wb3MgPSBwb3M7XG4gICAgICAgIHRoaXMucHJldiA9IG1ha2VSQlRyZWUoKTtcbiAgICAgICAgdGhpcy5uZXh0ID0gbWFrZVJCVHJlZSgpO1xuICAgIH1cbiAgICByZXR1cm4gTm9kZTtcbn0oKSk7XG52YXIgRXZlbnQgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEV2ZW50KGlzT3BlbiwgdiwgcG9zKSB7XG4gICAgICAgIHRoaXMuaXNPcGVuID0gaXNPcGVuO1xuICAgICAgICB0aGlzLnYgPSB2O1xuICAgICAgICB0aGlzLnBvcyA9IHBvcztcbiAgICB9XG4gICAgcmV0dXJuIEV2ZW50O1xufSgpKTtcbmZ1bmN0aW9uIGNvbXBhcmVFdmVudHMoYSwgYikge1xuICAgIGlmIChhLnBvcyA+IGIucG9zKSB7XG4gICAgICAgIHJldHVybiAxO1xuICAgIH1cbiAgICBpZiAoYS5wb3MgPCBiLnBvcykge1xuICAgICAgICByZXR1cm4gLTE7XG4gICAgfVxuICAgIGlmIChhLmlzT3Blbikge1xuICAgICAgICByZXR1cm4gLTE7XG4gICAgfVxuICAgIGlmIChiLmlzT3Blbikge1xuICAgICAgICByZXR1cm4gMTtcbiAgICB9XG4gICAgcmV0dXJuIDA7XG59XG5mdW5jdGlvbiBtYWtlUkJUcmVlKCkge1xuICAgIHJldHVybiBuZXcgcmJ0cmVlXzEuUkJUcmVlKGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhLnBvcyAtIGIucG9zOyB9KTtcbn1cbnZhciB4UmVjdCA9IHtcbiAgICBnZXRDZW50cmU6IGZ1bmN0aW9uIChyKSB7IHJldHVybiByLmN4KCk7IH0sXG4gICAgZ2V0T3BlbjogZnVuY3Rpb24gKHIpIHsgcmV0dXJuIHIueTsgfSxcbiAgICBnZXRDbG9zZTogZnVuY3Rpb24gKHIpIHsgcmV0dXJuIHIuWTsgfSxcbiAgICBnZXRTaXplOiBmdW5jdGlvbiAocikgeyByZXR1cm4gci53aWR0aCgpOyB9LFxuICAgIG1ha2VSZWN0OiBmdW5jdGlvbiAob3BlbiwgY2xvc2UsIGNlbnRlciwgc2l6ZSkgeyByZXR1cm4gbmV3IFJlY3RhbmdsZShjZW50ZXIgLSBzaXplIC8gMiwgY2VudGVyICsgc2l6ZSAvIDIsIG9wZW4sIGNsb3NlKTsgfSxcbiAgICBmaW5kTmVpZ2hib3VyczogZmluZFhOZWlnaGJvdXJzXG59O1xudmFyIHlSZWN0ID0ge1xuICAgIGdldENlbnRyZTogZnVuY3Rpb24gKHIpIHsgcmV0dXJuIHIuY3koKTsgfSxcbiAgICBnZXRPcGVuOiBmdW5jdGlvbiAocikgeyByZXR1cm4gci54OyB9LFxuICAgIGdldENsb3NlOiBmdW5jdGlvbiAocikgeyByZXR1cm4gci5YOyB9LFxuICAgIGdldFNpemU6IGZ1bmN0aW9uIChyKSB7IHJldHVybiByLmhlaWdodCgpOyB9LFxuICAgIG1ha2VSZWN0OiBmdW5jdGlvbiAob3BlbiwgY2xvc2UsIGNlbnRlciwgc2l6ZSkgeyByZXR1cm4gbmV3IFJlY3RhbmdsZShvcGVuLCBjbG9zZSwgY2VudGVyIC0gc2l6ZSAvIDIsIGNlbnRlciArIHNpemUgLyAyKTsgfSxcbiAgICBmaW5kTmVpZ2hib3VyczogZmluZFlOZWlnaGJvdXJzXG59O1xuZnVuY3Rpb24gZ2VuZXJhdGVHcm91cENvbnN0cmFpbnRzKHJvb3QsIGYsIG1pblNlcCwgaXNDb250YWluZWQpIHtcbiAgICBpZiAoaXNDb250YWluZWQgPT09IHZvaWQgMCkgeyBpc0NvbnRhaW5lZCA9IGZhbHNlOyB9XG4gICAgdmFyIHBhZGRpbmcgPSByb290LnBhZGRpbmcsIGduID0gdHlwZW9mIHJvb3QuZ3JvdXBzICE9PSAndW5kZWZpbmVkJyA/IHJvb3QuZ3JvdXBzLmxlbmd0aCA6IDAsIGxuID0gdHlwZW9mIHJvb3QubGVhdmVzICE9PSAndW5kZWZpbmVkJyA/IHJvb3QubGVhdmVzLmxlbmd0aCA6IDAsIGNoaWxkQ29uc3RyYWludHMgPSAhZ24gPyBbXVxuICAgICAgICA6IHJvb3QuZ3JvdXBzLnJlZHVjZShmdW5jdGlvbiAoY2NzLCBnKSB7IHJldHVybiBjY3MuY29uY2F0KGdlbmVyYXRlR3JvdXBDb25zdHJhaW50cyhnLCBmLCBtaW5TZXAsIHRydWUpKTsgfSwgW10pLCBuID0gKGlzQ29udGFpbmVkID8gMiA6IDApICsgbG4gKyBnbiwgdnMgPSBuZXcgQXJyYXkobiksIHJzID0gbmV3IEFycmF5KG4pLCBpID0gMCwgYWRkID0gZnVuY3Rpb24gKHIsIHYpIHsgcnNbaV0gPSByOyB2c1tpKytdID0gdjsgfTtcbiAgICBpZiAoaXNDb250YWluZWQpIHtcbiAgICAgICAgdmFyIGIgPSByb290LmJvdW5kcywgYyA9IGYuZ2V0Q2VudHJlKGIpLCBzID0gZi5nZXRTaXplKGIpIC8gMiwgb3BlbiA9IGYuZ2V0T3BlbihiKSwgY2xvc2UgPSBmLmdldENsb3NlKGIpLCBtaW4gPSBjIC0gcyArIHBhZGRpbmcgLyAyLCBtYXggPSBjICsgcyAtIHBhZGRpbmcgLyAyO1xuICAgICAgICByb290Lm1pblZhci5kZXNpcmVkUG9zaXRpb24gPSBtaW47XG4gICAgICAgIGFkZChmLm1ha2VSZWN0KG9wZW4sIGNsb3NlLCBtaW4sIHBhZGRpbmcpLCByb290Lm1pblZhcik7XG4gICAgICAgIHJvb3QubWF4VmFyLmRlc2lyZWRQb3NpdGlvbiA9IG1heDtcbiAgICAgICAgYWRkKGYubWFrZVJlY3Qob3BlbiwgY2xvc2UsIG1heCwgcGFkZGluZyksIHJvb3QubWF4VmFyKTtcbiAgICB9XG4gICAgaWYgKGxuKVxuICAgICAgICByb290LmxlYXZlcy5mb3JFYWNoKGZ1bmN0aW9uIChsKSB7IHJldHVybiBhZGQobC5ib3VuZHMsIGwudmFyaWFibGUpOyB9KTtcbiAgICBpZiAoZ24pXG4gICAgICAgIHJvb3QuZ3JvdXBzLmZvckVhY2goZnVuY3Rpb24gKGcpIHtcbiAgICAgICAgICAgIHZhciBiID0gZy5ib3VuZHM7XG4gICAgICAgICAgICBhZGQoZi5tYWtlUmVjdChmLmdldE9wZW4oYiksIGYuZ2V0Q2xvc2UoYiksIGYuZ2V0Q2VudHJlKGIpLCBmLmdldFNpemUoYikpLCBnLm1pblZhcik7XG4gICAgICAgIH0pO1xuICAgIHZhciBjcyA9IGdlbmVyYXRlQ29uc3RyYWludHMocnMsIHZzLCBmLCBtaW5TZXApO1xuICAgIGlmIChnbikge1xuICAgICAgICB2cy5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7IHYuY091dCA9IFtdLCB2LmNJbiA9IFtdOyB9KTtcbiAgICAgICAgY3MuZm9yRWFjaChmdW5jdGlvbiAoYykgeyBjLmxlZnQuY091dC5wdXNoKGMpLCBjLnJpZ2h0LmNJbi5wdXNoKGMpOyB9KTtcbiAgICAgICAgcm9vdC5ncm91cHMuZm9yRWFjaChmdW5jdGlvbiAoZykge1xuICAgICAgICAgICAgdmFyIGdhcEFkanVzdG1lbnQgPSAoZy5wYWRkaW5nIC0gZi5nZXRTaXplKGcuYm91bmRzKSkgLyAyO1xuICAgICAgICAgICAgZy5taW5WYXIuY0luLmZvckVhY2goZnVuY3Rpb24gKGMpIHsgcmV0dXJuIGMuZ2FwICs9IGdhcEFkanVzdG1lbnQ7IH0pO1xuICAgICAgICAgICAgZy5taW5WYXIuY091dC5mb3JFYWNoKGZ1bmN0aW9uIChjKSB7IGMubGVmdCA9IGcubWF4VmFyOyBjLmdhcCArPSBnYXBBZGp1c3RtZW50OyB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBjaGlsZENvbnN0cmFpbnRzLmNvbmNhdChjcyk7XG59XG5mdW5jdGlvbiBnZW5lcmF0ZUNvbnN0cmFpbnRzKHJzLCB2YXJzLCByZWN0LCBtaW5TZXApIHtcbiAgICB2YXIgaSwgbiA9IHJzLmxlbmd0aDtcbiAgICB2YXIgTiA9IDIgKiBuO1xuICAgIGNvbnNvbGUuYXNzZXJ0KHZhcnMubGVuZ3RoID49IG4pO1xuICAgIHZhciBldmVudHMgPSBuZXcgQXJyYXkoTik7XG4gICAgZm9yIChpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgICB2YXIgciA9IHJzW2ldO1xuICAgICAgICB2YXIgdiA9IG5ldyBOb2RlKHZhcnNbaV0sIHIsIHJlY3QuZ2V0Q2VudHJlKHIpKTtcbiAgICAgICAgZXZlbnRzW2ldID0gbmV3IEV2ZW50KHRydWUsIHYsIHJlY3QuZ2V0T3BlbihyKSk7XG4gICAgICAgIGV2ZW50c1tpICsgbl0gPSBuZXcgRXZlbnQoZmFsc2UsIHYsIHJlY3QuZ2V0Q2xvc2UocikpO1xuICAgIH1cbiAgICBldmVudHMuc29ydChjb21wYXJlRXZlbnRzKTtcbiAgICB2YXIgY3MgPSBuZXcgQXJyYXkoKTtcbiAgICB2YXIgc2NhbmxpbmUgPSBtYWtlUkJUcmVlKCk7XG4gICAgZm9yIChpID0gMDsgaSA8IE47ICsraSkge1xuICAgICAgICB2YXIgZSA9IGV2ZW50c1tpXTtcbiAgICAgICAgdmFyIHYgPSBlLnY7XG4gICAgICAgIGlmIChlLmlzT3Blbikge1xuICAgICAgICAgICAgc2NhbmxpbmUuaW5zZXJ0KHYpO1xuICAgICAgICAgICAgcmVjdC5maW5kTmVpZ2hib3Vycyh2LCBzY2FubGluZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBzY2FubGluZS5yZW1vdmUodik7XG4gICAgICAgICAgICB2YXIgbWFrZUNvbnN0cmFpbnQgPSBmdW5jdGlvbiAobCwgcikge1xuICAgICAgICAgICAgICAgIHZhciBzZXAgPSAocmVjdC5nZXRTaXplKGwucikgKyByZWN0LmdldFNpemUoci5yKSkgLyAyICsgbWluU2VwO1xuICAgICAgICAgICAgICAgIGNzLnB1c2gobmV3IHZwc2NfMS5Db25zdHJhaW50KGwudiwgci52LCBzZXApKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB2YXIgdmlzaXROZWlnaGJvdXJzID0gZnVuY3Rpb24gKGZvcndhcmQsIHJldmVyc2UsIG1rY29uKSB7XG4gICAgICAgICAgICAgICAgdmFyIHUsIGl0ID0gdltmb3J3YXJkXS5pdGVyYXRvcigpO1xuICAgICAgICAgICAgICAgIHdoaWxlICgodSA9IGl0W2ZvcndhcmRdKCkpICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIG1rY29uKHUsIHYpO1xuICAgICAgICAgICAgICAgICAgICB1W3JldmVyc2VdLnJlbW92ZSh2KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdmlzaXROZWlnaGJvdXJzKFwicHJldlwiLCBcIm5leHRcIiwgZnVuY3Rpb24gKHUsIHYpIHsgcmV0dXJuIG1ha2VDb25zdHJhaW50KHUsIHYpOyB9KTtcbiAgICAgICAgICAgIHZpc2l0TmVpZ2hib3VycyhcIm5leHRcIiwgXCJwcmV2XCIsIGZ1bmN0aW9uICh1LCB2KSB7IHJldHVybiBtYWtlQ29uc3RyYWludCh2LCB1KTsgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgY29uc29sZS5hc3NlcnQoc2NhbmxpbmUuc2l6ZSA9PT0gMCk7XG4gICAgcmV0dXJuIGNzO1xufVxuZnVuY3Rpb24gZmluZFhOZWlnaGJvdXJzKHYsIHNjYW5saW5lKSB7XG4gICAgdmFyIGYgPSBmdW5jdGlvbiAoZm9yd2FyZCwgcmV2ZXJzZSkge1xuICAgICAgICB2YXIgaXQgPSBzY2FubGluZS5maW5kSXRlcih2KTtcbiAgICAgICAgdmFyIHU7XG4gICAgICAgIHdoaWxlICgodSA9IGl0W2ZvcndhcmRdKCkpICE9PSBudWxsKSB7XG4gICAgICAgICAgICB2YXIgdW92ZXJ2WCA9IHUuci5vdmVybGFwWCh2LnIpO1xuICAgICAgICAgICAgaWYgKHVvdmVydlggPD0gMCB8fCB1b3ZlcnZYIDw9IHUuci5vdmVybGFwWSh2LnIpKSB7XG4gICAgICAgICAgICAgICAgdltmb3J3YXJkXS5pbnNlcnQodSk7XG4gICAgICAgICAgICAgICAgdVtyZXZlcnNlXS5pbnNlcnQodik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodW92ZXJ2WCA8PSAwKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIGYoXCJuZXh0XCIsIFwicHJldlwiKTtcbiAgICBmKFwicHJldlwiLCBcIm5leHRcIik7XG59XG5mdW5jdGlvbiBmaW5kWU5laWdoYm91cnModiwgc2NhbmxpbmUpIHtcbiAgICB2YXIgZiA9IGZ1bmN0aW9uIChmb3J3YXJkLCByZXZlcnNlKSB7XG4gICAgICAgIHZhciB1ID0gc2NhbmxpbmUuZmluZEl0ZXIodilbZm9yd2FyZF0oKTtcbiAgICAgICAgaWYgKHUgIT09IG51bGwgJiYgdS5yLm92ZXJsYXBYKHYucikgPiAwKSB7XG4gICAgICAgICAgICB2W2ZvcndhcmRdLmluc2VydCh1KTtcbiAgICAgICAgICAgIHVbcmV2ZXJzZV0uaW5zZXJ0KHYpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBmKFwibmV4dFwiLCBcInByZXZcIik7XG4gICAgZihcInByZXZcIiwgXCJuZXh0XCIpO1xufVxuZnVuY3Rpb24gZ2VuZXJhdGVYQ29uc3RyYWludHMocnMsIHZhcnMpIHtcbiAgICByZXR1cm4gZ2VuZXJhdGVDb25zdHJhaW50cyhycywgdmFycywgeFJlY3QsIDFlLTYpO1xufVxuZXhwb3J0cy5nZW5lcmF0ZVhDb25zdHJhaW50cyA9IGdlbmVyYXRlWENvbnN0cmFpbnRzO1xuZnVuY3Rpb24gZ2VuZXJhdGVZQ29uc3RyYWludHMocnMsIHZhcnMpIHtcbiAgICByZXR1cm4gZ2VuZXJhdGVDb25zdHJhaW50cyhycywgdmFycywgeVJlY3QsIDFlLTYpO1xufVxuZXhwb3J0cy5nZW5lcmF0ZVlDb25zdHJhaW50cyA9IGdlbmVyYXRlWUNvbnN0cmFpbnRzO1xuZnVuY3Rpb24gZ2VuZXJhdGVYR3JvdXBDb25zdHJhaW50cyhyb290KSB7XG4gICAgcmV0dXJuIGdlbmVyYXRlR3JvdXBDb25zdHJhaW50cyhyb290LCB4UmVjdCwgMWUtNik7XG59XG5leHBvcnRzLmdlbmVyYXRlWEdyb3VwQ29uc3RyYWludHMgPSBnZW5lcmF0ZVhHcm91cENvbnN0cmFpbnRzO1xuZnVuY3Rpb24gZ2VuZXJhdGVZR3JvdXBDb25zdHJhaW50cyhyb290KSB7XG4gICAgcmV0dXJuIGdlbmVyYXRlR3JvdXBDb25zdHJhaW50cyhyb290LCB5UmVjdCwgMWUtNik7XG59XG5leHBvcnRzLmdlbmVyYXRlWUdyb3VwQ29uc3RyYWludHMgPSBnZW5lcmF0ZVlHcm91cENvbnN0cmFpbnRzO1xuZnVuY3Rpb24gcmVtb3ZlT3ZlcmxhcHMocnMpIHtcbiAgICB2YXIgdnMgPSBycy5tYXAoZnVuY3Rpb24gKHIpIHsgcmV0dXJuIG5ldyB2cHNjXzEuVmFyaWFibGUoci5jeCgpKTsgfSk7XG4gICAgdmFyIGNzID0gZ2VuZXJhdGVYQ29uc3RyYWludHMocnMsIHZzKTtcbiAgICB2YXIgc29sdmVyID0gbmV3IHZwc2NfMS5Tb2x2ZXIodnMsIGNzKTtcbiAgICBzb2x2ZXIuc29sdmUoKTtcbiAgICB2cy5mb3JFYWNoKGZ1bmN0aW9uICh2LCBpKSB7IHJldHVybiByc1tpXS5zZXRYQ2VudHJlKHYucG9zaXRpb24oKSk7IH0pO1xuICAgIHZzID0gcnMubWFwKGZ1bmN0aW9uIChyKSB7IHJldHVybiBuZXcgdnBzY18xLlZhcmlhYmxlKHIuY3koKSk7IH0pO1xuICAgIGNzID0gZ2VuZXJhdGVZQ29uc3RyYWludHMocnMsIHZzKTtcbiAgICBzb2x2ZXIgPSBuZXcgdnBzY18xLlNvbHZlcih2cywgY3MpO1xuICAgIHNvbHZlci5zb2x2ZSgpO1xuICAgIHZzLmZvckVhY2goZnVuY3Rpb24gKHYsIGkpIHsgcmV0dXJuIHJzW2ldLnNldFlDZW50cmUodi5wb3NpdGlvbigpKTsgfSk7XG59XG5leHBvcnRzLnJlbW92ZU92ZXJsYXBzID0gcmVtb3ZlT3ZlcmxhcHM7XG52YXIgSW5kZXhlZFZhcmlhYmxlID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoSW5kZXhlZFZhcmlhYmxlLCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIEluZGV4ZWRWYXJpYWJsZShpbmRleCwgdykge1xuICAgICAgICB2YXIgX3RoaXMgPSBfc3VwZXIuY2FsbCh0aGlzLCAwLCB3KSB8fCB0aGlzO1xuICAgICAgICBfdGhpcy5pbmRleCA9IGluZGV4O1xuICAgICAgICByZXR1cm4gX3RoaXM7XG4gICAgfVxuICAgIHJldHVybiBJbmRleGVkVmFyaWFibGU7XG59KHZwc2NfMS5WYXJpYWJsZSkpO1xuZXhwb3J0cy5JbmRleGVkVmFyaWFibGUgPSBJbmRleGVkVmFyaWFibGU7XG52YXIgUHJvamVjdGlvbiA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUHJvamVjdGlvbihub2RlcywgZ3JvdXBzLCByb290R3JvdXAsIGNvbnN0cmFpbnRzLCBhdm9pZE92ZXJsYXBzKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIGlmIChyb290R3JvdXAgPT09IHZvaWQgMCkgeyByb290R3JvdXAgPSBudWxsOyB9XG4gICAgICAgIGlmIChjb25zdHJhaW50cyA9PT0gdm9pZCAwKSB7IGNvbnN0cmFpbnRzID0gbnVsbDsgfVxuICAgICAgICBpZiAoYXZvaWRPdmVybGFwcyA9PT0gdm9pZCAwKSB7IGF2b2lkT3ZlcmxhcHMgPSBmYWxzZTsgfVxuICAgICAgICB0aGlzLm5vZGVzID0gbm9kZXM7XG4gICAgICAgIHRoaXMuZ3JvdXBzID0gZ3JvdXBzO1xuICAgICAgICB0aGlzLnJvb3RHcm91cCA9IHJvb3RHcm91cDtcbiAgICAgICAgdGhpcy5hdm9pZE92ZXJsYXBzID0gYXZvaWRPdmVybGFwcztcbiAgICAgICAgdGhpcy52YXJpYWJsZXMgPSBub2Rlcy5tYXAoZnVuY3Rpb24gKHYsIGkpIHtcbiAgICAgICAgICAgIHJldHVybiB2LnZhcmlhYmxlID0gbmV3IEluZGV4ZWRWYXJpYWJsZShpLCAxKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChjb25zdHJhaW50cylcbiAgICAgICAgICAgIHRoaXMuY3JlYXRlQ29uc3RyYWludHMoY29uc3RyYWludHMpO1xuICAgICAgICBpZiAoYXZvaWRPdmVybGFwcyAmJiByb290R3JvdXAgJiYgdHlwZW9mIHJvb3RHcm91cC5ncm91cHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBub2Rlcy5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICAgICAgaWYgKCF2LndpZHRoIHx8ICF2LmhlaWdodCkge1xuICAgICAgICAgICAgICAgICAgICB2LmJvdW5kcyA9IG5ldyBSZWN0YW5nbGUodi54LCB2LngsIHYueSwgdi55KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgdzIgPSB2LndpZHRoIC8gMiwgaDIgPSB2LmhlaWdodCAvIDI7XG4gICAgICAgICAgICAgICAgdi5ib3VuZHMgPSBuZXcgUmVjdGFuZ2xlKHYueCAtIHcyLCB2LnggKyB3Miwgdi55IC0gaDIsIHYueSArIGgyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29tcHV0ZUdyb3VwQm91bmRzKHJvb3RHcm91cCk7XG4gICAgICAgICAgICB2YXIgaSA9IG5vZGVzLmxlbmd0aDtcbiAgICAgICAgICAgIGdyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uIChnKSB7XG4gICAgICAgICAgICAgICAgX3RoaXMudmFyaWFibGVzW2ldID0gZy5taW5WYXIgPSBuZXcgSW5kZXhlZFZhcmlhYmxlKGkrKywgdHlwZW9mIGcuc3RpZmZuZXNzICE9PSBcInVuZGVmaW5lZFwiID8gZy5zdGlmZm5lc3MgOiAwLjAxKTtcbiAgICAgICAgICAgICAgICBfdGhpcy52YXJpYWJsZXNbaV0gPSBnLm1heFZhciA9IG5ldyBJbmRleGVkVmFyaWFibGUoaSsrLCB0eXBlb2YgZy5zdGlmZm5lc3MgIT09IFwidW5kZWZpbmVkXCIgPyBnLnN0aWZmbmVzcyA6IDAuMDEpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgUHJvamVjdGlvbi5wcm90b3R5cGUuY3JlYXRlU2VwYXJhdGlvbiA9IGZ1bmN0aW9uIChjKSB7XG4gICAgICAgIHJldHVybiBuZXcgdnBzY18xLkNvbnN0cmFpbnQodGhpcy5ub2Rlc1tjLmxlZnRdLnZhcmlhYmxlLCB0aGlzLm5vZGVzW2MucmlnaHRdLnZhcmlhYmxlLCBjLmdhcCwgdHlwZW9mIGMuZXF1YWxpdHkgIT09IFwidW5kZWZpbmVkXCIgPyBjLmVxdWFsaXR5IDogZmFsc2UpO1xuICAgIH07XG4gICAgUHJvamVjdGlvbi5wcm90b3R5cGUubWFrZUZlYXNpYmxlID0gZnVuY3Rpb24gKGMpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgaWYgKCF0aGlzLmF2b2lkT3ZlcmxhcHMpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHZhciBheGlzID0gJ3gnLCBkaW0gPSAnd2lkdGgnO1xuICAgICAgICBpZiAoYy5heGlzID09PSAneCcpXG4gICAgICAgICAgICBheGlzID0gJ3knLCBkaW0gPSAnaGVpZ2h0JztcbiAgICAgICAgdmFyIHZzID0gYy5vZmZzZXRzLm1hcChmdW5jdGlvbiAobykgeyByZXR1cm4gX3RoaXMubm9kZXNbby5ub2RlXTsgfSkuc29ydChmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYVtheGlzXSAtIGJbYXhpc107IH0pO1xuICAgICAgICB2YXIgcCA9IG51bGw7XG4gICAgICAgIHZzLmZvckVhY2goZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgIGlmIChwKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5leHRQb3MgPSBwW2F4aXNdICsgcFtkaW1dO1xuICAgICAgICAgICAgICAgIGlmIChuZXh0UG9zID4gdltheGlzXSkge1xuICAgICAgICAgICAgICAgICAgICB2W2F4aXNdID0gbmV4dFBvcztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwID0gdjtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBQcm9qZWN0aW9uLnByb3RvdHlwZS5jcmVhdGVBbGlnbm1lbnQgPSBmdW5jdGlvbiAoYykge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgdSA9IHRoaXMubm9kZXNbYy5vZmZzZXRzWzBdLm5vZGVdLnZhcmlhYmxlO1xuICAgICAgICB0aGlzLm1ha2VGZWFzaWJsZShjKTtcbiAgICAgICAgdmFyIGNzID0gYy5heGlzID09PSAneCcgPyB0aGlzLnhDb25zdHJhaW50cyA6IHRoaXMueUNvbnN0cmFpbnRzO1xuICAgICAgICBjLm9mZnNldHMuc2xpY2UoMSkuZm9yRWFjaChmdW5jdGlvbiAobykge1xuICAgICAgICAgICAgdmFyIHYgPSBfdGhpcy5ub2Rlc1tvLm5vZGVdLnZhcmlhYmxlO1xuICAgICAgICAgICAgY3MucHVzaChuZXcgdnBzY18xLkNvbnN0cmFpbnQodSwgdiwgby5vZmZzZXQsIHRydWUpKTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBQcm9qZWN0aW9uLnByb3RvdHlwZS5jcmVhdGVDb25zdHJhaW50cyA9IGZ1bmN0aW9uIChjb25zdHJhaW50cykge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgaXNTZXAgPSBmdW5jdGlvbiAoYykgeyByZXR1cm4gdHlwZW9mIGMudHlwZSA9PT0gJ3VuZGVmaW5lZCcgfHwgYy50eXBlID09PSAnc2VwYXJhdGlvbic7IH07XG4gICAgICAgIHRoaXMueENvbnN0cmFpbnRzID0gY29uc3RyYWludHNcbiAgICAgICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKGMpIHsgcmV0dXJuIGMuYXhpcyA9PT0gXCJ4XCIgJiYgaXNTZXAoYyk7IH0pXG4gICAgICAgICAgICAubWFwKGZ1bmN0aW9uIChjKSB7IHJldHVybiBfdGhpcy5jcmVhdGVTZXBhcmF0aW9uKGMpOyB9KTtcbiAgICAgICAgdGhpcy55Q29uc3RyYWludHMgPSBjb25zdHJhaW50c1xuICAgICAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAoYykgeyByZXR1cm4gYy5heGlzID09PSBcInlcIiAmJiBpc1NlcChjKTsgfSlcbiAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKGMpIHsgcmV0dXJuIF90aGlzLmNyZWF0ZVNlcGFyYXRpb24oYyk7IH0pO1xuICAgICAgICBjb25zdHJhaW50c1xuICAgICAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAoYykgeyByZXR1cm4gYy50eXBlID09PSAnYWxpZ25tZW50JzsgfSlcbiAgICAgICAgICAgIC5mb3JFYWNoKGZ1bmN0aW9uIChjKSB7IHJldHVybiBfdGhpcy5jcmVhdGVBbGlnbm1lbnQoYyk7IH0pO1xuICAgIH07XG4gICAgUHJvamVjdGlvbi5wcm90b3R5cGUuc2V0dXBWYXJpYWJsZXNBbmRCb3VuZHMgPSBmdW5jdGlvbiAoeDAsIHkwLCBkZXNpcmVkLCBnZXREZXNpcmVkKSB7XG4gICAgICAgIHRoaXMubm9kZXMuZm9yRWFjaChmdW5jdGlvbiAodiwgaSkge1xuICAgICAgICAgICAgaWYgKHYuZml4ZWQpIHtcbiAgICAgICAgICAgICAgICB2LnZhcmlhYmxlLndlaWdodCA9IHYuZml4ZWRXZWlnaHQgPyB2LmZpeGVkV2VpZ2h0IDogMTAwMDtcbiAgICAgICAgICAgICAgICBkZXNpcmVkW2ldID0gZ2V0RGVzaXJlZCh2KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHYudmFyaWFibGUud2VpZ2h0ID0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB3ID0gKHYud2lkdGggfHwgMCkgLyAyLCBoID0gKHYuaGVpZ2h0IHx8IDApIC8gMjtcbiAgICAgICAgICAgIHZhciBpeCA9IHgwW2ldLCBpeSA9IHkwW2ldO1xuICAgICAgICAgICAgdi5ib3VuZHMgPSBuZXcgUmVjdGFuZ2xlKGl4IC0gdywgaXggKyB3LCBpeSAtIGgsIGl5ICsgaCk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgUHJvamVjdGlvbi5wcm90b3R5cGUueFByb2plY3QgPSBmdW5jdGlvbiAoeDAsIHkwLCB4KSB7XG4gICAgICAgIGlmICghdGhpcy5yb290R3JvdXAgJiYgISh0aGlzLmF2b2lkT3ZlcmxhcHMgfHwgdGhpcy54Q29uc3RyYWludHMpKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLnByb2plY3QoeDAsIHkwLCB4MCwgeCwgZnVuY3Rpb24gKHYpIHsgcmV0dXJuIHYucHg7IH0sIHRoaXMueENvbnN0cmFpbnRzLCBnZW5lcmF0ZVhHcm91cENvbnN0cmFpbnRzLCBmdW5jdGlvbiAodikgeyByZXR1cm4gdi5ib3VuZHMuc2V0WENlbnRyZSh4W3YudmFyaWFibGUuaW5kZXhdID0gdi52YXJpYWJsZS5wb3NpdGlvbigpKTsgfSwgZnVuY3Rpb24gKGcpIHtcbiAgICAgICAgICAgIHZhciB4bWluID0geFtnLm1pblZhci5pbmRleF0gPSBnLm1pblZhci5wb3NpdGlvbigpO1xuICAgICAgICAgICAgdmFyIHhtYXggPSB4W2cubWF4VmFyLmluZGV4XSA9IGcubWF4VmFyLnBvc2l0aW9uKCk7XG4gICAgICAgICAgICB2YXIgcDIgPSBnLnBhZGRpbmcgLyAyO1xuICAgICAgICAgICAgZy5ib3VuZHMueCA9IHhtaW4gLSBwMjtcbiAgICAgICAgICAgIGcuYm91bmRzLlggPSB4bWF4ICsgcDI7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgUHJvamVjdGlvbi5wcm90b3R5cGUueVByb2plY3QgPSBmdW5jdGlvbiAoeDAsIHkwLCB5KSB7XG4gICAgICAgIGlmICghdGhpcy5yb290R3JvdXAgJiYgIXRoaXMueUNvbnN0cmFpbnRzKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLnByb2plY3QoeDAsIHkwLCB5MCwgeSwgZnVuY3Rpb24gKHYpIHsgcmV0dXJuIHYucHk7IH0sIHRoaXMueUNvbnN0cmFpbnRzLCBnZW5lcmF0ZVlHcm91cENvbnN0cmFpbnRzLCBmdW5jdGlvbiAodikgeyByZXR1cm4gdi5ib3VuZHMuc2V0WUNlbnRyZSh5W3YudmFyaWFibGUuaW5kZXhdID0gdi52YXJpYWJsZS5wb3NpdGlvbigpKTsgfSwgZnVuY3Rpb24gKGcpIHtcbiAgICAgICAgICAgIHZhciB5bWluID0geVtnLm1pblZhci5pbmRleF0gPSBnLm1pblZhci5wb3NpdGlvbigpO1xuICAgICAgICAgICAgdmFyIHltYXggPSB5W2cubWF4VmFyLmluZGV4XSA9IGcubWF4VmFyLnBvc2l0aW9uKCk7XG4gICAgICAgICAgICB2YXIgcDIgPSBnLnBhZGRpbmcgLyAyO1xuICAgICAgICAgICAgZy5ib3VuZHMueSA9IHltaW4gLSBwMjtcbiAgICAgICAgICAgIDtcbiAgICAgICAgICAgIGcuYm91bmRzLlkgPSB5bWF4ICsgcDI7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgUHJvamVjdGlvbi5wcm90b3R5cGUucHJvamVjdEZ1bmN0aW9ucyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIGZ1bmN0aW9uICh4MCwgeTAsIHgpIHsgcmV0dXJuIF90aGlzLnhQcm9qZWN0KHgwLCB5MCwgeCk7IH0sXG4gICAgICAgICAgICBmdW5jdGlvbiAoeDAsIHkwLCB5KSB7IHJldHVybiBfdGhpcy55UHJvamVjdCh4MCwgeTAsIHkpOyB9XG4gICAgICAgIF07XG4gICAgfTtcbiAgICBQcm9qZWN0aW9uLnByb3RvdHlwZS5wcm9qZWN0ID0gZnVuY3Rpb24gKHgwLCB5MCwgc3RhcnQsIGRlc2lyZWQsIGdldERlc2lyZWQsIGNzLCBnZW5lcmF0ZUNvbnN0cmFpbnRzLCB1cGRhdGVOb2RlQm91bmRzLCB1cGRhdGVHcm91cEJvdW5kcykge1xuICAgICAgICB0aGlzLnNldHVwVmFyaWFibGVzQW5kQm91bmRzKHgwLCB5MCwgZGVzaXJlZCwgZ2V0RGVzaXJlZCk7XG4gICAgICAgIGlmICh0aGlzLnJvb3RHcm91cCAmJiB0aGlzLmF2b2lkT3ZlcmxhcHMpIHtcbiAgICAgICAgICAgIGNvbXB1dGVHcm91cEJvdW5kcyh0aGlzLnJvb3RHcm91cCk7XG4gICAgICAgICAgICBjcyA9IGNzLmNvbmNhdChnZW5lcmF0ZUNvbnN0cmFpbnRzKHRoaXMucm9vdEdyb3VwKSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zb2x2ZSh0aGlzLnZhcmlhYmxlcywgY3MsIHN0YXJ0LCBkZXNpcmVkKTtcbiAgICAgICAgdGhpcy5ub2Rlcy5mb3JFYWNoKHVwZGF0ZU5vZGVCb3VuZHMpO1xuICAgICAgICBpZiAodGhpcy5yb290R3JvdXAgJiYgdGhpcy5hdm9pZE92ZXJsYXBzKSB7XG4gICAgICAgICAgICB0aGlzLmdyb3Vwcy5mb3JFYWNoKHVwZGF0ZUdyb3VwQm91bmRzKTtcbiAgICAgICAgICAgIGNvbXB1dGVHcm91cEJvdW5kcyh0aGlzLnJvb3RHcm91cCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFByb2plY3Rpb24ucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24gKHZzLCBjcywgc3RhcnRpbmcsIGRlc2lyZWQpIHtcbiAgICAgICAgdmFyIHNvbHZlciA9IG5ldyB2cHNjXzEuU29sdmVyKHZzLCBjcyk7XG4gICAgICAgIHNvbHZlci5zZXRTdGFydGluZ1Bvc2l0aW9ucyhzdGFydGluZyk7XG4gICAgICAgIHNvbHZlci5zZXREZXNpcmVkUG9zaXRpb25zKGRlc2lyZWQpO1xuICAgICAgICBzb2x2ZXIuc29sdmUoKTtcbiAgICB9O1xuICAgIHJldHVybiBQcm9qZWN0aW9uO1xufSgpKTtcbmV4cG9ydHMuUHJvamVjdGlvbiA9IFByb2plY3Rpb247XG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0ptYVd4bElqb2ljbVZqZEdGdVoyeGxMbXB6SWl3aWMyOTFjbU5sVW05dmRDSTZJaUlzSW5OdmRYSmpaWE1pT2xzaUxpNHZMaTR2VjJWaVEyOXNZUzl6Y21NdmNtVmpkR0Z1WjJ4bExuUnpJbDBzSW01aGJXVnpJanBiWFN3aWJXRndjR2x1WjNNaU9pSTdPenM3T3pzN096czdPenM3T3p0QlFVRkJMQ3RDUVVGdFJEdEJRVU51UkN4dFEwRkJLMEk3UVVGclFqTkNMRk5CUVdkQ0xHdENRVUZyUWl4RFFVRkRMRU5CUVd0Q08wbEJRMnBFTEVOQlFVTXNRMEZCUXl4TlFVRk5MRWRCUVVjc1QwRkJUeXhEUVVGRExFTkJRVU1zVFVGQlRTeExRVUZMTEZkQlFWY3NRMEZCUXl4RFFVRkRPMUZCUTNoRExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNUVUZCVFN4RFFVRkRMRlZCUVVNc1EwRkJXU3hGUVVGRkxFTkJRVU1zU1VGQlN5eFBRVUZCTEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZxUWl4RFFVRnBRaXhGUVVGRkxGTkJRVk1zUTBGQlF5eExRVUZMTEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkROVVVzVTBGQlV5eERRVUZETEV0QlFVc3NSVUZCUlN4RFFVRkRPMGxCUTNSQ0xFbEJRVWtzVDBGQlR5eERRVUZETEVOQlFVTXNUVUZCVFN4TFFVRkxMRmRCUVZjN1VVRkRMMElzUTBGQlF5eERRVUZETEUxQlFVMHNSMEZCWXl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExFMUJRVTBzUTBGQlF5eFZRVUZETEVOQlFWa3NSVUZCUlN4RFFVRkRMRWxCUVVzc1QwRkJRU3hyUWtGQmEwSXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFUbENMRU5CUVRoQ0xFVkJRVVVzUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRPMGxCUTNwSExFTkJRVU1zUTBGQlF5eE5RVUZOTEVkQlFVY3NRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhQUVVGUExFTkJRVU1zUTBGQlF5eERRVUZETEU5QlFVOHNRMEZCUXl4RFFVRkRPMGxCUTNaRExFOUJRVThzUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXp0QlFVTndRaXhEUVVGRE8wRkJVa1FzWjBSQlVVTTdRVUZGUkR0SlFVTkpMRzFDUVVOWExFTkJRVk1zUlVGRFZDeERRVUZUTEVWQlExUXNRMEZCVXl4RlFVTlVMRU5CUVZNN1VVRklWQ3hOUVVGRExFZEJRVVFzUTBGQlF5eERRVUZSTzFGQlExUXNUVUZCUXl4SFFVRkVMRU5CUVVNc1EwRkJVVHRSUVVOVUxFMUJRVU1zUjBGQlJDeERRVUZETEVOQlFWRTdVVUZEVkN4TlFVRkRMRWRCUVVRc1EwRkJReXhEUVVGUk8wbEJRVWtzUTBGQlF6dEpRVVZzUWl4bFFVRkxMRWRCUVZvc1kwRkJORUlzVDBGQlR5eEpRVUZKTEZOQlFWTXNRMEZCUXl4TlFVRk5MRU5CUVVNc2FVSkJRV2xDTEVWQlFVVXNUVUZCVFN4RFFVRkRMR2xDUVVGcFFpeEZRVUZGTEUxQlFVMHNRMEZCUXl4cFFrRkJhVUlzUlVGQlJTeE5RVUZOTEVOQlFVTXNhVUpCUVdsQ0xFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdTVUZGTTBvc2MwSkJRVVVzUjBGQlJpeGpRVUZsTEU5QlFVOHNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8wbEJSVGxETEhOQ1FVRkZMRWRCUVVZc1kwRkJaU3hQUVVGUExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0SlFVVTVReXcwUWtGQlVTeEhRVUZTTEZWQlFWTXNRMEZCV1R0UlFVTnFRaXhKUVVGSkxFVkJRVVVzUjBGQlJ5eEpRVUZKTEVOQlFVTXNSVUZCUlN4RlFVRkZMRVZCUVVVc1JVRkJSU3hIUVVGSExFTkJRVU1zUTBGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXp0UlFVTm9ReXhKUVVGSkxFVkJRVVVzU1VGQlNTeEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zUTBGQlF6dFpRVUZGTEU5QlFVOHNTVUZCU1N4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlEyeEVMRWxCUVVrc1JVRkJSU3hKUVVGSkxFVkJRVVVzU1VGQlNTeEpRVUZKTEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRVVVzVDBGQlR5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRGJFUXNUMEZCVHl4RFFVRkRMRU5CUVVNN1NVRkRZaXhEUVVGRE8wbEJSVVFzTkVKQlFWRXNSMEZCVWl4VlFVRlRMRU5CUVZrN1VVRkRha0lzU1VGQlNTeEZRVUZGTEVkQlFVY3NTVUZCU1N4RFFVRkRMRVZCUVVVc1JVRkJSU3hGUVVGRkxFVkJRVVVzUjBGQlJ5eERRVUZETEVOQlFVTXNSVUZCUlN4RlFVRkZMRU5CUVVNN1VVRkRhRU1zU1VGQlNTeEZRVUZGTEVsQlFVa3NSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEVOQlFVTTdXVUZCUlN4UFFVRlBMRWxCUVVrc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTnNSQ3hKUVVGSkxFVkJRVVVzU1VGQlNTeEZRVUZGTEVsQlFVa3NTVUZCU1N4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVUZGTEU5QlFVOHNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETzFGQlEyeEVMRTlCUVU4c1EwRkJReXhEUVVGRE8wbEJRMklzUTBGQlF6dEpRVVZFTERoQ1FVRlZMRWRCUVZZc1ZVRkJWeXhGUVVGVk8xRkJRMnBDTEVsQlFVa3NSVUZCUlN4SFFVRkhMRVZCUVVVc1IwRkJSeXhKUVVGSkxFTkJRVU1zUlVGQlJTeEZRVUZGTEVOQlFVTTdVVUZEZUVJc1NVRkJTU3hEUVVGRExFTkJRVU1zU1VGQlNTeEZRVUZGTEVOQlFVTTdVVUZEWWl4SlFVRkpMRU5CUVVNc1EwRkJReXhKUVVGSkxFVkJRVVVzUTBGQlF6dEpRVU5xUWl4RFFVRkRPMGxCUlVRc09FSkJRVlVzUjBGQlZpeFZRVUZYTEVWQlFWVTdVVUZEYWtJc1NVRkJTU3hGUVVGRkxFZEJRVWNzUlVGQlJTeEhRVUZITEVsQlFVa3NRMEZCUXl4RlFVRkZMRVZCUVVVc1EwRkJRenRSUVVONFFpeEpRVUZKTEVOQlFVTXNRMEZCUXl4SlFVRkpMRVZCUVVVc1EwRkJRenRSUVVOaUxFbEJRVWtzUTBGQlF5eERRVUZETEVsQlFVa3NSVUZCUlN4RFFVRkRPMGxCUTJwQ0xFTkJRVU03U1VGRlJDeDVRa0ZCU3l4SFFVRk1PMUZCUTBrc1QwRkJUeXhKUVVGSkxFTkJRVU1zUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNN1NVRkRNMElzUTBGQlF6dEpRVVZFTERCQ1FVRk5MRWRCUVU0N1VVRkRTU3hQUVVGUExFbEJRVWtzUTBGQlF5eERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVNelFpeERRVUZETzBsQlJVUXNlVUpCUVVzc1IwRkJUQ3hWUVVGTkxFTkJRVms3VVVGRFpDeFBRVUZQTEVsQlFVa3NVMEZCVXl4RFFVRkRMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0SlFVTnlTQ3hEUVVGRE8wbEJWMFFzY1VOQlFXbENMRWRCUVdwQ0xGVkJRV3RDTEVWQlFWVXNSVUZCUlN4RlFVRlZMRVZCUVVVc1JVRkJWU3hGUVVGRkxFVkJRVlU3VVVGRE5VUXNTVUZCU1N4TFFVRkxMRWRCUVVjc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVWQlFVVXNTVUZCU1N4RFFVRkRMRU5CUVVNc1JVRkJSU3hKUVVGSkxFTkJRVU1zUTBGQlF5eEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkRja01zUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RlFVRkZMRWxCUVVrc1EwRkJReXhEUVVGRExFVkJRVVVzU1VGQlNTeERRVUZETEVOQlFVTXNSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRMmhETEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1JVRkJSU3hKUVVGSkxFTkJRVU1zUTBGQlF5eEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRMRVZCUVVVc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU53UXl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFVkJRVVVzU1VGQlNTeERRVUZETEVOQlFVTXNSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJReXhGUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTNSRExFbEJRVWtzWVVGQllTeEhRVUZITEVWQlFVVXNRMEZCUXp0UlFVTjJRaXhMUVVGTExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF5eEZRVUZGTzFsQlEzaENMRWxCUVVrc1EwRkJReXhIUVVGSExGTkJRVk1zUTBGQlF5eG5Ra0ZCWjBJc1EwRkJReXhGUVVGRkxFVkJRVVVzUlVGQlJTeEZRVUZGTEVWQlFVVXNSVUZCUlN4RlFVRkZMRVZCUVVVc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEZGtjc1NVRkJTU3hEUVVGRExFdEJRVXNzU1VGQlNUdG5Ra0ZCUlN4aFFVRmhMRU5CUVVNc1NVRkJTU3hEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRPMU5CUXpGRU8xRkJRMFFzVDBGQlR5eGhRVUZoTEVOQlFVTTdTVUZEZWtJc1EwRkJRenRKUVZWRUxHMURRVUZsTEVkQlFXWXNWVUZCWjBJc1JVRkJWU3hGUVVGRkxFVkJRVlU3VVVGRGJFTXNTVUZCU1N4SlFVRkpMRWRCUVVjc1NVRkJTU3hEUVVGRExHbENRVUZwUWl4RFFVRkRMRWxCUVVrc1EwRkJReXhGUVVGRkxFVkJRVVVzUlVGQlJTeEpRVUZKTEVOQlFVTXNSVUZCUlN4RlFVRkZMRVZCUVVVc1JVRkJSU3hGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZETzFGQlEyaEZMRTlCUVU4c1NVRkJTU3hEUVVGRExFMUJRVTBzUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRPMGxCUXpWRExFTkJRVU03U1VGRlJDdzBRa0ZCVVN4SFFVRlNPMUZCUTBrc1QwRkJUenRaUVVOSUxFVkJRVVVzUTBGQlF5eEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZETEVWQlFVVTdXVUZEZUVJc1JVRkJSU3hEUVVGRExFVkJRVVVzU1VGQlNTeERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRVZCUVVVc1NVRkJTU3hEUVVGRExFTkJRVU1zUlVGQlJUdFpRVU40UWl4RlFVRkZMRU5CUVVNc1JVRkJSU3hKUVVGSkxFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJReXhGUVVGRk8xbEJRM2hDTEVWQlFVVXNRMEZCUXl4RlFVRkZMRWxCUVVrc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRMRVZCUVVVN1UwRkJReXhEUVVGRE8wbEJRMnhETEVOQlFVTTdTVUZGVFN3d1FrRkJaMElzUjBGQmRrSXNWVUZEU1N4RlFVRlZMRVZCUVVVc1JVRkJWU3hGUVVOMFFpeEZRVUZWTEVWQlFVVXNSVUZCVlN4RlFVTjBRaXhGUVVGVkxFVkJRVVVzUlVGQlZTeEZRVU4wUWl4RlFVRlZMRVZCUVVVc1JVRkJWVHRSUVVOMFFpeEpRVUZKTEVsQlFVa3NSMEZCUnl4RlFVRkZMRWRCUVVjc1JVRkJSU3hGUVVGRkxFbEJRVWtzUjBGQlJ5eEZRVUZGTEVkQlFVY3NSVUZCUlN4RlFVTTVRaXhKUVVGSkxFZEJRVWNzUlVGQlJTeEhRVUZITEVWQlFVVXNSVUZCUlN4SlFVRkpMRWRCUVVjc1JVRkJSU3hIUVVGSExFVkJRVVVzUlVGRE9VSXNWMEZCVnl4SFFVRkhMRWxCUVVrc1IwRkJSeXhKUVVGSkxFZEJRVWNzU1VGQlNTeEhRVUZITEVsQlFVa3NRMEZCUXp0UlFVTTFReXhKUVVGSkxGZEJRVmNzU1VGQlNTeERRVUZETzFsQlFVVXNUMEZCVHl4SlFVRkpMRU5CUVVNN1VVRkRiRU1zU1VGQlNTeEpRVUZKTEVkQlFVY3NSVUZCUlN4SFFVRkhMRVZCUVVVc1JVRkJSU3hKUVVGSkxFZEJRVWNzUlVGQlJTeEhRVUZITEVWQlFVVXNSVUZET1VJc1NVRkJTU3hIUVVGSExFbEJRVWtzUjBGQlJ5eEpRVUZKTEVkQlFVY3NTVUZCU1N4SFFVRkhMRWxCUVVrc1JVRkRhRU1zUTBGQlF5eEhRVUZITEVsQlFVa3NSMEZCUnl4WFFVRlhMRVZCUTNSQ0xFbEJRVWtzUjBGQlJ5eEpRVUZKTEVkQlFVY3NTVUZCU1N4SFFVRkhMRWxCUVVrc1IwRkJSeXhKUVVGSkxFVkJRMmhETEVOQlFVTXNSMEZCUnl4SlFVRkpMRWRCUVVjc1YwRkJWeXhEUVVGRE8xRkJRek5DTEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zUlVGQlJUdFpRVU4wUXl4UFFVRlBPMmRDUVVOSUxFTkJRVU1zUlVGQlJTeEZRVUZGTEVkQlFVY3NRMEZCUXl4SFFVRkhMRWxCUVVrN1owSkJRMmhDTEVOQlFVTXNSVUZCUlN4RlFVRkZMRWRCUVVjc1EwRkJReXhIUVVGSExFbEJRVWs3WVVGRGJrSXNRMEZCUXp0VFFVTk1PMUZCUTBRc1QwRkJUeXhKUVVGSkxFTkJRVU03U1VGRGFFSXNRMEZCUXp0SlFVVkVMREpDUVVGUExFZEJRVkFzVlVGQlVTeEhRVUZYTzFGQlEyWXNUMEZCVHl4SlFVRkpMRk5CUVZNc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eEhRVUZITEVkQlFVY3NSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJReXhIUVVGSExFZEJRVWNzUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXl4SFFVRkhMRWRCUVVjc1JVRkJSU3hKUVVGSkxFTkJRVU1zUTBGQlF5eEhRVUZITEVkQlFVY3NRMEZCUXl4RFFVRkRPMGxCUTJwR0xFTkJRVU03U1VGRFRDeG5Ra0ZCUXp0QlFVRkVMRU5CUVVNc1FVRjRTRVFzU1VGM1NFTTdRVUY0U0Zrc09FSkJRVk03UVVGeFNYUkNMRk5CUVdkQ0xHVkJRV1VzUTBGQlF5eE5RVUZwUWl4RlFVRkZMRTFCUVdsQ0xFVkJRVVVzUlVGQlZUdEpRVVUxUlN4SlFVRk5MRVZCUVVVc1IwRkJSeXhOUVVGTkxFTkJRVU1zWlVGQlpTeERRVUZETEUxQlFVMHNRMEZCUXl4RlFVRkZMRVZCUVVVc1JVRkJSU3hOUVVGTkxFTkJRVU1zUlVGQlJTeEZRVUZGTEVOQlFVTXNTVUZCU1N4RlFVRkZMRU5CUVVNc1JVRkJSU3hOUVVGTkxFTkJRVU1zUlVGQlJTeEZRVUZGTEVWQlFVVXNRMEZCUXl4RlFVRkZMRTFCUVUwc1EwRkJReXhGUVVGRkxFVkJRVVVzUlVGQlJTeEZRVU0zUml4RlFVRkZMRWRCUVVjc1RVRkJUU3hEUVVGRExHVkJRV1VzUTBGQlF5eE5RVUZOTEVOQlFVTXNSVUZCUlN4RlFVRkZMRVZCUVVVc1RVRkJUU3hEUVVGRExFVkJRVVVzUlVGQlJTeERRVUZETEVsQlFVa3NSVUZCUlN4RFFVRkRMRVZCUVVVc1RVRkJUU3hEUVVGRExFVkJRVVVzUlVGQlJTeEZRVUZGTEVOQlFVTXNSVUZCUlN4TlFVRk5MRU5CUVVNc1JVRkJSU3hGUVVGRkxFVkJRVVVzUlVGRE0wWXNSVUZCUlN4SFFVRkhMRVZCUVVVc1EwRkJReXhEUVVGRExFZEJRVWNzUlVGQlJTeERRVUZETEVOQlFVTXNSVUZEYUVJc1JVRkJSU3hIUVVGSExFVkJRVVVzUTBGQlF5eERRVUZETEVkQlFVY3NSVUZCUlN4RFFVRkRMRU5CUVVNc1JVRkRhRUlzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1JVRkJSU3hIUVVGSExFVkJRVVVzUjBGQlJ5eEZRVUZGTEVkQlFVY3NSVUZCUlN4RFFVRkRMRVZCUVVVc1JVRkJSU3hIUVVGSExFTkJRVU1zUjBGQlJ5eEZRVUZGTEVOQlFVTTdTVUZEYkVRc1QwRkJUenRSUVVOSUxHdENRVUZyUWl4RlFVRkZMRVZCUVVVN1VVRkRkRUlzYTBKQlFXdENMRVZCUVVVc1JVRkJSVHRSUVVOMFFpeFZRVUZWTEVWQlFVVXNSVUZCUlN4RFFVRkRMRVZCUVVVc1JVRkJSU3hEUVVGRExFTkJRVU1zUjBGQlJ5eEZRVUZGTEVkQlFVY3NSVUZCUlN4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFVkJRVVVzUlVGQlJTeERRVUZETEVOQlFVTXNSMEZCUnl4RlFVRkZMRWRCUVVjc1JVRkJSU3hIUVVGSExFTkJRVU1zUlVGQlJUdExRVU12UkN4RFFVRkJPMEZCUTB3c1EwRkJRenRCUVZwRUxEQkRRVmxETzBGQlYwUXNVMEZCWjBJc1ZVRkJWU3hEUVVGRExFTkJRVEpDTEVWQlFVVXNUVUZCYVVJc1JVRkJSU3hGUVVGVk8wbEJRMnBHTEVsQlFVa3NSVUZCUlN4SFFVRkhMRTFCUVUwc1EwRkJReXhsUVVGbExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03U1VGRE1VTXNTVUZCU1N4RFFVRkRMRVZCUVVVN1VVRkJSU3hGUVVGRkxFZEJRVWNzUlVGQlJTeERRVUZETEVWQlFVVXNUVUZCVFN4RFFVRkRMRVZCUVVVc1JVRkJSU3hGUVVGRkxFTkJRVU1zUlVGQlJTeE5RVUZOTEVOQlFVTXNSVUZCUlN4RlFVRkZMRVZCUVVVc1EwRkJRenRKUVVOcVJDeEpRVUZKTEVWQlFVVXNSMEZCUnl4RlFVRkZMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlEyWXNSVUZCUlN4SFFVRkhMRVZCUVVVc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZEWml4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eEZRVUZGTEVkQlFVY3NSVUZCUlN4SFFVRkhMRVZCUVVVc1IwRkJSeXhGUVVGRkxFTkJRVU1zUTBGQlF6dEpRVU55UXl4UFFVRlBMRVZCUVVVc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZETEVkQlFVY3NSVUZCUlN4SFFVRkhMRVZCUVVVc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXl4RFFVRkRMRWRCUVVjc1JVRkJSU3hIUVVGSExFVkJRVVVzUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXp0QlFVTTFSQ3hEUVVGRE8wRkJVRVFzWjBOQlQwTTdRVUZGUkR0SlFVbEpMR05CUVcxQ0xFTkJRVmNzUlVGQlV5eERRVUZaTEVWQlFWTXNSMEZCVnp0UlFVRndSQ3hOUVVGRExFZEJRVVFzUTBGQlF5eERRVUZWTzFGQlFWTXNUVUZCUXl4SFFVRkVMRU5CUVVNc1EwRkJWenRSUVVGVExGRkJRVWNzUjBGQlNDeEhRVUZITEVOQlFWRTdVVUZEYmtVc1NVRkJTU3hEUVVGRExFbEJRVWtzUjBGQlJ5eFZRVUZWTEVWQlFVVXNRMEZCUXp0UlFVTjZRaXhKUVVGSkxFTkJRVU1zU1VGQlNTeEhRVUZITEZWQlFWVXNSVUZCUlN4RFFVRkRPMGxCUXpkQ0xFTkJRVU03U1VGRFRDeFhRVUZETzBGQlFVUXNRMEZCUXl4QlFWSkVMRWxCVVVNN1FVRkZSRHRKUVVOSkxHVkJRVzFDTEUxQlFXVXNSVUZCVXl4RFFVRlBMRVZCUVZNc1IwRkJWenRSUVVGdVJDeFhRVUZOTEVkQlFVNHNUVUZCVFN4RFFVRlRPMUZCUVZNc1RVRkJReXhIUVVGRUxFTkJRVU1zUTBGQlRUdFJRVUZUTEZGQlFVY3NSMEZCU0N4SFFVRkhMRU5CUVZFN1NVRkJSeXhEUVVGRE8wbEJRemxGTEZsQlFVTTdRVUZCUkN4RFFVRkRMRUZCUmtRc1NVRkZRenRCUVVWRUxGTkJRVk1zWVVGQllTeERRVUZETEVOQlFWRXNSVUZCUlN4RFFVRlJPMGxCUTNKRExFbEJRVWtzUTBGQlF5eERRVUZETEVkQlFVY3NSMEZCUnl4RFFVRkRMRU5CUVVNc1IwRkJSeXhGUVVGRk8xRkJRMllzVDBGQlR5eERRVUZETEVOQlFVTTdTMEZEV2p0SlFVTkVMRWxCUVVrc1EwRkJReXhEUVVGRExFZEJRVWNzUjBGQlJ5eERRVUZETEVOQlFVTXNSMEZCUnl4RlFVRkZPMUZCUTJZc1QwRkJUeXhEUVVGRExFTkJRVU1zUTBGQlF6dExRVU5pTzBsQlEwUXNTVUZCU1N4RFFVRkRMRU5CUVVNc1RVRkJUU3hGUVVGRk8xRkJSVllzVDBGQlR5eERRVUZETEVOQlFVTXNRMEZCUXp0TFFVTmlPMGxCUTBRc1NVRkJTU3hEUVVGRExFTkJRVU1zVFVGQlRTeEZRVUZGTzFGQlJWWXNUMEZCVHl4RFFVRkRMRU5CUVVNN1MwRkRXanRKUVVORUxFOUJRVThzUTBGQlF5eERRVUZETzBGQlEySXNRMEZCUXp0QlFVVkVMRk5CUVZNc1ZVRkJWVHRKUVVObUxFOUJRVThzU1VGQlNTeGxRVUZOTEVOQlFVOHNWVUZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhKUVVGTExFOUJRVUVzUTBGQlF5eERRVUZETEVkQlFVY3NSMEZCUnl4RFFVRkRMRU5CUVVNc1IwRkJSeXhGUVVGaUxFTkJRV0VzUTBGQlF5eERRVUZETzBGQlEzSkVMRU5CUVVNN1FVRlhSQ3hKUVVGSkxFdEJRVXNzUjBGQmEwSTdTVUZEZGtJc1UwRkJVeXhGUVVGRkxGVkJRVUVzUTBGQlF5eEpRVUZITEU5QlFVRXNRMEZCUXl4RFFVRkRMRVZCUVVVc1JVRkJSU3hGUVVGT0xFTkJRVTA3U1VGRGNrSXNUMEZCVHl4RlFVRkZMRlZCUVVFc1EwRkJReXhKUVVGSExFOUJRVUVzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCU0N4RFFVRkhPMGxCUTJoQ0xGRkJRVkVzUlVGQlJTeFZRVUZCTEVOQlFVTXNTVUZCUnl4UFFVRkJMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVWdzUTBGQlJ6dEpRVU5xUWl4UFFVRlBMRVZCUVVVc1ZVRkJRU3hEUVVGRExFbEJRVWNzVDBGQlFTeERRVUZETEVOQlFVTXNTMEZCU3l4RlFVRkZMRVZCUVZRc1EwRkJVenRKUVVOMFFpeFJRVUZSTEVWQlFVVXNWVUZCUXl4SlFVRkpMRVZCUVVVc1MwRkJTeXhGUVVGRkxFMUJRVTBzUlVGQlJTeEpRVUZKTEVsQlFVc3NUMEZCUVN4SlFVRkpMRk5CUVZNc1EwRkJReXhOUVVGTkxFZEJRVWNzU1VGQlNTeEhRVUZITEVOQlFVTXNSVUZCUlN4TlFVRk5MRWRCUVVjc1NVRkJTU3hIUVVGSExFTkJRVU1zUlVGQlJTeEpRVUZKTEVWQlFVVXNTMEZCU3l4RFFVRkRMRVZCUVdoRkxFTkJRV2RGTzBsQlEzcEhMR05CUVdNc1JVRkJSU3hsUVVGbE8wTkJRMnhETEVOQlFVTTdRVUZGUml4SlFVRkpMRXRCUVVzc1IwRkJhMEk3U1VGRGRrSXNVMEZCVXl4RlFVRkZMRlZCUVVFc1EwRkJReXhKUVVGSExFOUJRVUVzUTBGQlF5eERRVUZETEVWQlFVVXNSVUZCUlN4RlFVRk9MRU5CUVUwN1NVRkRja0lzVDBGQlR5eEZRVUZGTEZWQlFVRXNRMEZCUXl4SlFVRkhMRTlCUVVFc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlNDeERRVUZITzBsQlEyaENMRkZCUVZFc1JVRkJSU3hWUVVGQkxFTkJRVU1zU1VGQlJ5eFBRVUZCTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVnc1EwRkJSenRKUVVOcVFpeFBRVUZQTEVWQlFVVXNWVUZCUVN4RFFVRkRMRWxCUVVjc1QwRkJRU3hEUVVGRExFTkJRVU1zVFVGQlRTeEZRVUZGTEVWQlFWWXNRMEZCVlR0SlFVTjJRaXhSUVVGUkxFVkJRVVVzVlVGQlF5eEpRVUZKTEVWQlFVVXNTMEZCU3l4RlFVRkZMRTFCUVUwc1JVRkJSU3hKUVVGSkxFbEJRVXNzVDBGQlFTeEpRVUZKTEZOQlFWTXNRMEZCUXl4SlFVRkpMRVZCUVVVc1MwRkJTeXhGUVVGRkxFMUJRVTBzUjBGQlJ5eEpRVUZKTEVkQlFVY3NRMEZCUXl4RlFVRkZMRTFCUVUwc1IwRkJSeXhKUVVGSkxFZEJRVWNzUTBGQlF5eERRVUZETEVWQlFXaEZMRU5CUVdkRk8wbEJRM3BITEdOQlFXTXNSVUZCUlN4bFFVRmxPME5CUTJ4RExFTkJRVU03UVVGRlJpeFRRVUZUTEhkQ1FVRjNRaXhEUVVGRExFbEJRWEZDTEVWQlFVVXNRMEZCWjBJc1JVRkJSU3hOUVVGakxFVkJRVVVzVjBGQk5FSTdTVUZCTlVJc05FSkJRVUVzUlVGQlFTeHRRa0ZCTkVJN1NVRkZia2dzU1VGQlNTeFBRVUZQTEVkQlFVY3NTVUZCU1N4RFFVRkRMRTlCUVU4c1JVRkRkRUlzUlVGQlJTeEhRVUZITEU5QlFVOHNTVUZCU1N4RFFVRkRMRTFCUVUwc1MwRkJTeXhYUVVGWExFTkJRVU1zUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlEyaEZMRVZCUVVVc1IwRkJSeXhQUVVGUExFbEJRVWtzUTBGQlF5eE5RVUZOTEV0QlFVc3NWMEZCVnl4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVOb1JTeG5Ra0ZCWjBJc1IwRkJhVUlzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVN1VVRkRla01zUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1RVRkJUU3hEUVVGRExGVkJRVU1zUjBGQmFVSXNSVUZCUlN4RFFVRkRMRWxCUVVzc1QwRkJRU3hIUVVGSExFTkJRVU1zVFVGQlRTeERRVUZETEhkQ1FVRjNRaXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNUVUZCVFN4RlFVRkZMRWxCUVVrc1EwRkJReXhEUVVGRExFVkJRWGhFTEVOQlFYZEVMRVZCUVVVc1JVRkJSU3hEUVVGRExFVkJRelZITEVOQlFVTXNSMEZCUnl4RFFVRkRMRmRCUVZjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhGUVVGRkxFZEJRVWNzUlVGQlJTeEZRVU51UXl4RlFVRkZMRWRCUVdVc1NVRkJTU3hMUVVGTExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlF6ZENMRVZCUVVVc1IwRkJaMElzU1VGQlNTeExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUXpsQ0xFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlEwd3NSMEZCUnl4SFFVRkhMRlZCUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zU1VGQlR5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGQkxFTkJRVU1zUTBGQlF5eERRVUZETzBsQlF5OURMRWxCUVVrc1YwRkJWeXhGUVVGRk8xRkJSV0lzU1VGQlNTeERRVUZETEVkQlFXTXNTVUZCU1N4RFFVRkRMRTFCUVUwc1JVRkRNVUlzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4VFFVRlRMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4UFFVRlBMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eEZRVU40UXl4SlFVRkpMRWRCUVVjc1EwRkJReXhEUVVGRExFOUJRVThzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4TFFVRkxMRWRCUVVjc1EwRkJReXhEUVVGRExGRkJRVkVzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZETVVNc1IwRkJSeXhIUVVGSExFTkJRVU1zUjBGQlJ5eERRVUZETEVkQlFVY3NUMEZCVHl4SFFVRkhMRU5CUVVNc1JVRkJSU3hIUVVGSExFZEJRVWNzUTBGQlF5eEhRVUZITEVOQlFVTXNSMEZCUnl4UFFVRlBMRWRCUVVjc1EwRkJReXhEUVVGRE8xRkJRM3BFTEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1pVRkJaU3hIUVVGSExFZEJRVWNzUTBGQlF6dFJRVU5zUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExGRkJRVkVzUTBGQlF5eEpRVUZKTEVWQlFVVXNTMEZCU3l4RlFVRkZMRWRCUVVjc1JVRkJSU3hQUVVGUExFTkJRVU1zUlVGQlJTeEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNN1VVRkRlRVFzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4bFFVRmxMRWRCUVVjc1IwRkJSeXhEUVVGRE8xRkJRMnhETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1VVRkJVU3hEUVVGRExFbEJRVWtzUlVGQlJTeExRVUZMTEVWQlFVVXNSMEZCUnl4RlFVRkZMRTlCUVU4c1EwRkJReXhGUVVGRkxFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXp0TFFVTXpSRHRKUVVORUxFbEJRVWtzUlVGQlJUdFJRVUZGTEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1QwRkJUeXhEUVVGRExGVkJRVUVzUTBGQlF5eEpRVUZKTEU5QlFVRXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhOUVVGTkxFVkJRVVVzUTBGQlF5eERRVUZETEZGQlFWRXNRMEZCUXl4RlFVRjZRaXhEUVVGNVFpeERRVUZETEVOQlFVTTdTVUZETlVRc1NVRkJTU3hGUVVGRk8xRkJRVVVzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4UFFVRlBMRU5CUVVNc1ZVRkJRU3hEUVVGRE8xbEJRM3BDTEVsQlFVa3NRMEZCUXl4SFFVRmpMRU5CUVVNc1EwRkJReXhOUVVGTkxFTkJRVU03V1VGRE5VSXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhSUVVGUkxFTkJRVU1zUTBGQlF5eERRVUZETEU5QlFVOHNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zVVVGQlVTeERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhUUVVGVExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRTlCUVU4c1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJRenRSUVVONlJpeERRVUZETEVOQlFVTXNRMEZCUXp0SlFVTklMRWxCUVVrc1JVRkJSU3hIUVVGSExHMUNRVUZ0UWl4RFFVRkRMRVZCUVVVc1JVRkJSU3hGUVVGRkxFVkJRVVVzUTBGQlF5eEZRVUZGTEUxQlFVMHNRMEZCUXl4RFFVRkRPMGxCUTJoRUxFbEJRVWtzUlVGQlJTeEZRVUZGTzFGQlEwb3NSVUZCUlN4RFFVRkRMRTlCUVU4c1EwRkJReXhWUVVGQkxFTkJRVU1zU1VGQlRTeERRVUZETEVOQlFVTXNTVUZCU1N4SFFVRkhMRVZCUVVVc1JVRkJSU3hEUVVGRExFTkJRVU1zUjBGQlJ5eEhRVUZITEVWQlFVVXNRMEZCUVN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRemRETEVWQlFVVXNRMEZCUXl4UFFVRlBMRU5CUVVNc1ZVRkJRU3hEUVVGRExFbEJRVTBzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUVN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRemxFTEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1QwRkJUeXhEUVVGRExGVkJRVUVzUTBGQlF6dFpRVU5xUWl4SlFVRkpMR0ZCUVdFc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eFBRVUZQTEVkQlFVY3NRMEZCUXl4RFFVRkRMRTlCUVU4c1EwRkJReXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1dVRkRNVVFzUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4SFFVRkhMRU5CUVVNc1QwRkJUeXhEUVVGRExGVkJRVUVzUTBGQlF5eEpRVUZKTEU5QlFVRXNRMEZCUXl4RFFVRkRMRWRCUVVjc1NVRkJTU3hoUVVGaExFVkJRWFJDTEVOQlFYTkNMRU5CUVVNc1EwRkJRenRaUVVOc1JDeERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMRWxCUVVrc1EwRkJReXhQUVVGUExFTkJRVU1zVlVGQlFTeERRVUZETEVsQlFVMHNRMEZCUXl4RFFVRkRMRWxCUVVrc1IwRkJSeXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1NVRkJTU3hoUVVGaExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTXZSU3hEUVVGRExFTkJRVU1zUTBGQlF6dExRVU5PTzBsQlEwUXNUMEZCVHl4blFrRkJaMElzUTBGQlF5eE5RVUZOTEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNN1FVRkRka01zUTBGQlF6dEJRVVZFTEZOQlFWTXNiVUpCUVcxQ0xFTkJRVU1zUlVGQlpTeEZRVUZGTEVsQlFXZENMRVZCUXpGRUxFbEJRVzFDTEVWQlFVVXNUVUZCWXp0SlFVVnVReXhKUVVGSkxFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NSVUZCUlN4RFFVRkRMRTFCUVUwc1EwRkJRenRKUVVOeVFpeEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRE8wbEJRMlFzVDBGQlR5eERRVUZETEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNc1RVRkJUU3hKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETzBsQlEycERMRWxCUVVrc1RVRkJUU3hIUVVGSExFbEJRVWtzUzBGQlN5eERRVUZSTEVOQlFVTXNRMEZCUXl4RFFVRkRPMGxCUTJwRExFdEJRVXNzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF5eEZRVUZGTzFGQlEzQkNMRWxCUVVrc1EwRkJReXhIUVVGSExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTmtMRWxCUVVrc1EwRkJReXhIUVVGSExFbEJRVWtzU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFVkJRVVVzU1VGQlNTeERRVUZETEZOQlFWTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRMmhFTEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFdEJRVXNzUTBGQlF5eEpRVUZKTEVWQlFVVXNRMEZCUXl4RlFVRkZMRWxCUVVrc1EwRkJReXhQUVVGUExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTm9SQ3hOUVVGTkxFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4SFFVRkhMRWxCUVVrc1MwRkJTeXhEUVVGRExFdEJRVXNzUlVGQlJTeERRVUZETEVWQlFVVXNTVUZCU1N4RFFVRkRMRkZCUVZFc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzB0QlEzcEVPMGxCUTBRc1RVRkJUU3hEUVVGRExFbEJRVWtzUTBGQlF5eGhRVUZoTEVOQlFVTXNRMEZCUXp0SlFVTXpRaXhKUVVGSkxFVkJRVVVzUjBGQlJ5eEpRVUZKTEV0QlFVc3NSVUZCWXl4RFFVRkRPMGxCUTJwRExFbEJRVWtzVVVGQlVTeEhRVUZITEZWQlFWVXNSVUZCUlN4RFFVRkRPMGxCUXpWQ0xFdEJRVXNzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF5eEZRVUZGTzFGQlEzQkNMRWxCUVVrc1EwRkJReXhIUVVGSExFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTnNRaXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTFvc1NVRkJTU3hEUVVGRExFTkJRVU1zVFVGQlRTeEZRVUZGTzFsQlExWXNVVUZCVVN4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU51UWl4SlFVRkpMRU5CUVVNc1kwRkJZeXhEUVVGRExFTkJRVU1zUlVGQlJTeFJRVUZSTEVOQlFVTXNRMEZCUXp0VFFVTndRenRoUVVGTk8xbEJSVWdzVVVGQlVTeERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVOdVFpeEpRVUZKTEdOQlFXTXNSMEZCUnl4VlFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRE8yZENRVU4wUWl4SlFVRkpMRWRCUVVjc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eFBRVUZQTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eFBRVUZQTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eEhRVUZITEUxQlFVMHNRMEZCUXp0blFrRkRMMFFzUlVGQlJTeERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMR2xDUVVGVkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTTdXVUZETTBNc1EwRkJReXhEUVVGRE8xbEJRMFlzU1VGQlNTeGxRVUZsTEVkQlFVY3NWVUZCUXl4UFFVRlBMRVZCUVVVc1QwRkJUeXhGUVVGRkxFdEJRVXM3WjBKQlF6RkRMRWxCUVVrc1EwRkJReXhGUVVGRkxFVkJRVVVzUjBGQlJ5eERRVUZETEVOQlFVTXNUMEZCVHl4RFFVRkRMRU5CUVVNc1VVRkJVU3hGUVVGRkxFTkJRVU03WjBKQlEyeERMRTlCUVU4c1EwRkJReXhEUVVGRExFZEJRVWNzUlVGQlJTeERRVUZETEU5QlFVOHNRMEZCUXl4RlFVRkZMRU5CUVVNc1MwRkJTeXhKUVVGSkxFVkJRVVU3YjBKQlEycERMRXRCUVVzc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdiMEpCUTFvc1EwRkJReXhEUVVGRExFOUJRVThzUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRwUWtGRGVFSTdXVUZEVEN4RFFVRkRMRU5CUVVNN1dVRkRSaXhsUVVGbExFTkJRVU1zVFVGQlRTeEZRVUZGTEUxQlFVMHNSVUZCUlN4VlFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFbEJRVXNzVDBGQlFTeGpRVUZqTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhGUVVGd1FpeERRVUZ2UWl4RFFVRkRMRU5CUVVNN1dVRkRhRVVzWlVGQlpTeERRVUZETEUxQlFVMHNSVUZCUlN4TlFVRk5MRVZCUVVVc1ZVRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEpRVUZMTEU5QlFVRXNZMEZCWXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUlVGQmNFSXNRMEZCYjBJc1EwRkJReXhEUVVGRE8xTkJRMjVGTzB0QlEwbzdTVUZEUkN4UFFVRlBMRU5CUVVNc1RVRkJUU3hEUVVGRExGRkJRVkVzUTBGQlF5eEpRVUZKTEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNN1NVRkRjRU1zVDBGQlR5eEZRVUZGTEVOQlFVTTdRVUZEWkN4RFFVRkRPMEZCUlVRc1UwRkJVeXhsUVVGbExFTkJRVU1zUTBGQlR5eEZRVUZGTEZGQlFYTkNPMGxCUTNCRUxFbEJRVWtzUTBGQlF5eEhRVUZITEZWQlFVTXNUMEZCVHl4RlFVRkZMRTlCUVU4N1VVRkRja0lzU1VGQlNTeEZRVUZGTEVkQlFVY3NVVUZCVVN4RFFVRkRMRkZCUVZFc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU01UWl4SlFVRkpMRU5CUVVNc1EwRkJRenRSUVVOT0xFOUJRVThzUTBGQlF5eERRVUZETEVkQlFVY3NSVUZCUlN4RFFVRkRMRTlCUVU4c1EwRkJReXhGUVVGRkxFTkJRVU1zUzBGQlN5eEpRVUZKTEVWQlFVVTdXVUZEYWtNc1NVRkJTU3hQUVVGUExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4UlFVRlJMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFsQlEyaERMRWxCUVVrc1QwRkJUeXhKUVVGSkxFTkJRVU1zU1VGQlNTeFBRVUZQTEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhSUVVGUkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZPMmRDUVVNNVF5eERRVUZETEVOQlFVTXNUMEZCVHl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzJkQ1FVTnlRaXhEUVVGRExFTkJRVU1zVDBGQlR5eERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8yRkJRM2hDTzFsQlEwUXNTVUZCU1N4UFFVRlBMRWxCUVVrc1EwRkJReXhGUVVGRk8yZENRVU5rTEUxQlFVMDdZVUZEVkR0VFFVTktPMGxCUTB3c1EwRkJReXhEUVVGQk8wbEJRMFFzUTBGQlF5eERRVUZETEUxQlFVMHNSVUZCUlN4TlFVRk5MRU5CUVVNc1EwRkJRenRKUVVOc1FpeERRVUZETEVOQlFVTXNUVUZCVFN4RlFVRkZMRTFCUVUwc1EwRkJReXhEUVVGRE8wRkJRM1JDTEVOQlFVTTdRVUZGUkN4VFFVRlRMR1ZCUVdVc1EwRkJReXhEUVVGUExFVkJRVVVzVVVGQmMwSTdTVUZEY0VRc1NVRkJTU3hEUVVGRExFZEJRVWNzVlVGQlF5eFBRVUZQTEVWQlFVVXNUMEZCVHp0UlFVTnlRaXhKUVVGSkxFTkJRVU1zUjBGQlJ5eFJRVUZSTEVOQlFVTXNVVUZCVVN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFOUJRVThzUTBGQlF5eEZRVUZGTEVOQlFVTTdVVUZEZUVNc1NVRkJTU3hEUVVGRExFdEJRVXNzU1VGQlNTeEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1VVRkJVU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVN1dVRkRja01zUTBGQlF5eERRVUZETEU5QlFVOHNRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU55UWl4RFFVRkRMRU5CUVVNc1QwRkJUeXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMU5CUTNoQ08wbEJRMHdzUTBGQlF5eERRVUZCTzBsQlEwUXNRMEZCUXl4RFFVRkRMRTFCUVUwc1JVRkJSU3hOUVVGTkxFTkJRVU1zUTBGQlF6dEpRVU5zUWl4RFFVRkRMRU5CUVVNc1RVRkJUU3hGUVVGRkxFMUJRVTBzUTBGQlF5eERRVUZETzBGQlEzUkNMRU5CUVVNN1FVRkZSQ3hUUVVGblFpeHZRa0ZCYjBJc1EwRkJReXhGUVVGbExFVkJRVVVzU1VGQlowSTdTVUZEYkVVc1QwRkJUeXh0UWtGQmJVSXNRMEZCUXl4RlFVRkZMRVZCUVVVc1NVRkJTU3hGUVVGRkxFdEJRVXNzUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXp0QlFVTjBSQ3hEUVVGRE8wRkJSa1FzYjBSQlJVTTdRVUZGUkN4VFFVRm5RaXh2UWtGQmIwSXNRMEZCUXl4RlFVRmxMRVZCUVVVc1NVRkJaMEk3U1VGRGJFVXNUMEZCVHl4dFFrRkJiVUlzUTBGQlF5eEZRVUZGTEVWQlFVVXNTVUZCU1N4RlFVRkZMRXRCUVVzc1JVRkJSU3hKUVVGSkxFTkJRVU1zUTBGQlF6dEJRVU4wUkN4RFFVRkRPMEZCUmtRc2IwUkJSVU03UVVGRlJDeFRRVUZuUWl4NVFrRkJlVUlzUTBGQlF5eEpRVUZ4UWp0SlFVTXpSQ3hQUVVGUExIZENRVUYzUWl4RFFVRkRMRWxCUVVrc1JVRkJSU3hMUVVGTExFVkJRVVVzU1VGQlNTeERRVUZETEVOQlFVTTdRVUZEZGtRc1EwRkJRenRCUVVaRUxEaEVRVVZETzBGQlJVUXNVMEZCWjBJc2VVSkJRWGxDTEVOQlFVTXNTVUZCY1VJN1NVRkRNMFFzVDBGQlR5eDNRa0ZCZDBJc1EwRkJReXhKUVVGSkxFVkJRVVVzUzBGQlN5eEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRPMEZCUTNaRUxFTkJRVU03UVVGR1JDdzRSRUZGUXp0QlFVVkVMRk5CUVdkQ0xHTkJRV01zUTBGQlF5eEZRVUZsTzBsQlF6RkRMRWxCUVVrc1JVRkJSU3hIUVVGSExFVkJRVVVzUTBGQlF5eEhRVUZITEVOQlFVTXNWVUZCUVN4RFFVRkRMRWxCUVVrc1QwRkJRU3hKUVVGSkxHVkJRVkVzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RlFVRkZMRU5CUVVNc1JVRkJjRUlzUTBGQmIwSXNRMEZCUXl4RFFVRkRPMGxCUXpORExFbEJRVWtzUlVGQlJTeEhRVUZITEc5Q1FVRnZRaXhEUVVGRExFVkJRVVVzUlVGQlJTeEZRVUZGTEVOQlFVTXNRMEZCUXp0SlFVTjBReXhKUVVGSkxFMUJRVTBzUjBGQlJ5eEpRVUZKTEdGQlFVMHNRMEZCUXl4RlFVRkZMRVZCUVVVc1JVRkJSU3hEUVVGRExFTkJRVU03U1VGRGFFTXNUVUZCVFN4RFFVRkRMRXRCUVVzc1JVRkJSU3hEUVVGRE8wbEJRMllzUlVGQlJTeERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFbEJRVXNzVDBGQlFTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1ZVRkJWU3hEUVVGRExFTkJRVU1zUTBGQlF5eFJRVUZSTEVWQlFVVXNRMEZCUXl4RlFVRTVRaXhEUVVFNFFpeERRVUZETEVOQlFVTTdTVUZEY2tRc1JVRkJSU3hIUVVGSExFVkJRVVVzUTBGQlF5eEhRVUZITEVOQlFVTXNWVUZCUVN4RFFVRkRMRWxCUVVjc1QwRkJRU3hKUVVGSkxHVkJRVkVzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RlFVRkZMRU5CUVVNc1JVRkJjRUlzUTBGQmIwSXNRMEZCUXl4RFFVRkRPMGxCUTNSRExFVkJRVVVzUjBGQlJ5eHZRa0ZCYjBJc1EwRkJReXhGUVVGRkxFVkJRVVVzUlVGQlJTeERRVUZETEVOQlFVTTdTVUZEYkVNc1RVRkJUU3hIUVVGSExFbEJRVWtzWVVGQlRTeERRVUZETEVWQlFVVXNSVUZCUlN4RlFVRkZMRU5CUVVNc1EwRkJRenRKUVVNMVFpeE5RVUZOTEVOQlFVTXNTMEZCU3l4RlFVRkZMRU5CUVVNN1NVRkRaaXhGUVVGRkxFTkJRVU1zVDBGQlR5eERRVUZETEZWQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1NVRkJTeXhQUVVGQkxFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4VlFVRlZMRU5CUVVNc1EwRkJReXhEUVVGRExGRkJRVkVzUlVGQlJTeERRVUZETEVWQlFUbENMRU5CUVRoQ0xFTkJRVU1zUTBGQlF6dEJRVU42UkN4RFFVRkRPMEZCV0VRc2QwTkJWME03UVVGaFJEdEpRVUZ4UXl4dFEwRkJVVHRKUVVONlF5eDVRa0ZCYlVJc1MwRkJZU3hGUVVGRkxFTkJRVk03VVVGQk0wTXNXVUZEU1N4clFrRkJUU3hEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEZOQlEyUTdVVUZHYTBJc1YwRkJTeXhIUVVGTUxFdEJRVXNzUTBGQlVUczdTVUZGYUVNc1EwRkJRenRKUVVOTUxITkNRVUZETzBGQlFVUXNRMEZCUXl4QlFVcEVMRU5CUVhGRExHVkJRVkVzUjBGSk5VTTdRVUZLV1N3d1EwRkJaVHRCUVUwMVFqdEpRVXRKTEc5Q1FVRnZRaXhMUVVGclFpeEZRVU14UWl4TlFVRjVRaXhGUVVONlFpeFRRVUZwUXl4RlFVTjZReXhYUVVGM1FpeEZRVU5vUWl4aFFVRTRRanRSUVVveFF5eHBRa0U0UWtNN1VVRTFRbGNzTUVKQlFVRXNSVUZCUVN4blFrRkJhVU03VVVGRGVrTXNORUpCUVVFc1JVRkJRU3hyUWtGQmQwSTdVVUZEYUVJc09FSkJRVUVzUlVGQlFTeHhRa0ZCT0VJN1VVRktkRUlzVlVGQlN5eEhRVUZNTEV0QlFVc3NRMEZCWVR0UlFVTXhRaXhYUVVGTkxFZEJRVTRzVFVGQlRTeERRVUZ0UWp0UlFVTjZRaXhqUVVGVExFZEJRVlFzVTBGQlV5eERRVUYzUWp0UlFVVnFReXhyUWtGQllTeEhRVUZpTEdGQlFXRXNRMEZCYVVJN1VVRkZkRU1zU1VGQlNTeERRVUZETEZOQlFWTXNSMEZCUnl4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExGVkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTTdXVUZETlVJc1QwRkJUeXhEUVVGRExFTkJRVU1zVVVGQlVTeEhRVUZITEVsQlFVa3NaVUZCWlN4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU5zUkN4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVWSUxFbEJRVWtzVjBGQlZ6dFpRVUZGTEVsQlFVa3NRMEZCUXl4cFFrRkJhVUlzUTBGQlF5eFhRVUZYTEVOQlFVTXNRMEZCUXp0UlFVVnlSQ3hKUVVGSkxHRkJRV0VzU1VGQlNTeFRRVUZUTEVsQlFVa3NUMEZCVHl4VFFVRlRMRU5CUVVNc1RVRkJUU3hMUVVGTExGZEJRVmNzUlVGQlJUdFpRVU4yUlN4TFFVRkxMRU5CUVVNc1QwRkJUeXhEUVVGRExGVkJRVUVzUTBGQlF6dG5Ra0ZETVVJc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eExRVUZMTEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1RVRkJUU3hGUVVONlFqdHZRa0ZGUXl4RFFVRkRMRU5CUVVNc1RVRkJUU3hIUVVGSExFbEJRVWtzVTBGQlV5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dHZRa0ZETjBNc1QwRkJUenRwUWtGRFVEdG5Ra0ZEWXl4SlFVRkpMRVZCUVVVc1IwRkJSeXhEUVVGRExFTkJRVU1zUzBGQlN5eEhRVUZITEVOQlFVTXNSVUZCUlN4RlFVRkZMRWRCUVVjc1EwRkJReXhEUVVGRExFMUJRVTBzUjBGQlJ5eERRVUZETEVOQlFVTTdaMEpCUTNoRExFTkJRVU1zUTBGQlF5eE5RVUZOTEVkQlFVY3NTVUZCU1N4VFFVRlRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eEZRVUZGTEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RlFVRkZMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eEZRVUZGTEVOQlFVTXNRMEZCUXp0WlFVTnlSU3hEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU5JTEd0Q1FVRnJRaXhEUVVGRExGTkJRVk1zUTBGQlF5eERRVUZETzFsQlF6bENMRWxCUVVrc1EwRkJReXhIUVVGSExFdEJRVXNzUTBGQlF5eE5RVUZOTEVOQlFVTTdXVUZEY2tJc1RVRkJUU3hEUVVGRExFOUJRVThzUTBGQlF5eFZRVUZCTEVOQlFVTTdaMEpCUTFvc1MwRkJTU3hEUVVGRExGTkJRVk1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1RVRkJUU3hIUVVGSExFbEJRVWtzWlVGQlpTeERRVUZETEVOQlFVTXNSVUZCUlN4RlFVRkZMRTlCUVU4c1EwRkJReXhEUVVGRExGTkJRVk1zUzBGQlN5eFhRVUZYTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhUUVVGVExFTkJRVU1zUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMmRDUVVOcVNDeExRVUZKTEVOQlFVTXNVMEZCVXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eE5RVUZOTEVkQlFVY3NTVUZCU1N4bFFVRmxMRU5CUVVNc1EwRkJReXhGUVVGRkxFVkJRVVVzVDBGQlR5eERRVUZETEVOQlFVTXNVMEZCVXl4TFFVRkxMRmRCUVZjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEZOQlFWTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03V1VGRGNrZ3NRMEZCUXl4RFFVRkRMRU5CUVVNN1UwRkRUanRKUVVOTUxFTkJRVU03U1VGSFR5eHhRMEZCWjBJc1IwRkJlRUlzVlVGQmVVSXNRMEZCVFR0UlFVTXpRaXhQUVVGUExFbEJRVWtzYVVKQlFWVXNRMEZEYWtJc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1VVRkJVU3hGUVVNelFpeEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eFJRVUZSTEVWQlF6VkNMRU5CUVVNc1EwRkJReXhIUVVGSExFVkJRMHdzVDBGQlR5eERRVUZETEVOQlFVTXNVVUZCVVN4TFFVRkxMRmRCUVZjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEZGQlFWRXNRMEZCUXl4RFFVRkRMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU03U1VGRGFFVXNRMEZCUXp0SlFVZFBMR2xEUVVGWkxFZEJRWEJDTEZWQlFYRkNMRU5CUVUwN1VVRkJNMElzYVVKQmFVSkRPMUZCYUVKSExFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNZVUZCWVR0WlFVRkZMRTlCUVU4N1VVRkZhRU1zU1VGQlNTeEpRVUZKTEVkQlFVY3NSMEZCUnl4RlFVRkZMRWRCUVVjc1IwRkJSeXhQUVVGUExFTkJRVU03VVVGRE9VSXNTVUZCU1N4RFFVRkRMRU5CUVVNc1NVRkJTU3hMUVVGTExFZEJRVWM3V1VGQlJTeEpRVUZKTEVkQlFVY3NSMEZCUnl4RlFVRkZMRWRCUVVjc1IwRkJSeXhSUVVGUkxFTkJRVU03VVVGREwwTXNTVUZCU1N4RlFVRkZMRWRCUVdkQ0xFTkJRVU1zUTBGQlF5eFBRVUZQTEVOQlFVTXNSMEZCUnl4RFFVRkRMRlZCUVVFc1EwRkJReXhKUVVGSkxFOUJRVUVzUzBGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFVkJRV3hDTEVOQlFXdENMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zVlVGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4SlFVRkxMRTlCUVVFc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1JVRkJha0lzUTBGQmFVSXNRMEZCUXl4RFFVRkRPMUZCUXk5R0xFbEJRVWtzUTBGQlF5eEhRVUZqTEVsQlFVa3NRMEZCUXp0UlFVTjRRaXhGUVVGRkxFTkJRVU1zVDBGQlR5eERRVUZETEZWQlFVRXNRMEZCUXp0WlFVVlNMRWxCUVVrc1EwRkJReXhGUVVGRk8yZENRVU5JTEVsQlFVa3NUMEZCVHl4SFFVRkhMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1owSkJReTlDTEVsQlFVa3NUMEZCVHl4SFFVRkhMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zUlVGQlJUdHZRa0ZEYmtJc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eEhRVUZITEU5QlFVOHNRMEZCUXp0cFFrRkRja0k3WVVGRFNqdFpRVU5FTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1VVRkRWaXhEUVVGRExFTkJRVU1zUTBGQlF6dEpRVU5RTEVOQlFVTTdTVUZGVHl4dlEwRkJaU3hIUVVGMlFpeFZRVUYzUWl4RFFVRk5PMUZCUVRsQ0xHbENRVkZETzFGQlVFY3NTVUZCU1N4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNUMEZCVHl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEZGQlFWRXNRMEZCUXp0UlFVTXZReXhKUVVGSkxFTkJRVU1zV1VGQldTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTNKQ0xFbEJRVWtzUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXl4SlFVRkpMRXRCUVVzc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNXVUZCV1N4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zV1VGQldTeERRVUZETzFGQlEyaEZMRU5CUVVNc1EwRkJReXhQUVVGUExFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRTlCUVU4c1EwRkJReXhWUVVGQkxFTkJRVU03V1VGRGVFSXNTVUZCU1N4RFFVRkRMRWRCUVVjc1MwRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1VVRkJVU3hEUVVGRE8xbEJRM0JETEVWQlFVVXNRMEZCUXl4SlFVRkpMRU5CUVVNc1NVRkJTU3hwUWtGQlZTeERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFMUJRVTBzUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTJ4RUxFTkJRVU1zUTBGQlF5eERRVUZETzBsQlExQXNRMEZCUXp0SlFVVlBMSE5EUVVGcFFpeEhRVUY2UWl4VlFVRXdRaXhYUVVGclFqdFJRVUUxUXl4cFFrRlhRenRSUVZaSExFbEJRVWtzUzBGQlN5eEhRVUZITEZWQlFVRXNRMEZCUXl4SlFVRkpMRTlCUVVFc1QwRkJUeXhEUVVGRExFTkJRVU1zU1VGQlNTeExRVUZMTEZkQlFWY3NTVUZCU1N4RFFVRkRMRU5CUVVNc1NVRkJTU3hMUVVGTExGbEJRVmtzUlVGQmVFUXNRMEZCZDBRc1EwRkJRenRSUVVNeFJTeEpRVUZKTEVOQlFVTXNXVUZCV1N4SFFVRkhMRmRCUVZjN1lVRkRNVUlzVFVGQlRTeERRVUZETEZWQlFVRXNRMEZCUXl4SlFVRkpMRTlCUVVFc1EwRkJReXhEUVVGRExFbEJRVWtzUzBGQlN5eEhRVUZITEVsQlFVa3NTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVFeFFpeERRVUV3UWl4RFFVRkRPMkZCUTNaRExFZEJRVWNzUTBGQlF5eFZRVUZCTEVOQlFVTXNTVUZCU1N4UFFVRkJMRXRCUVVrc1EwRkJReXhuUWtGQlowSXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJlRUlzUTBGQmQwSXNRMEZCUXl4RFFVRkRPMUZCUTNoRExFbEJRVWtzUTBGQlF5eFpRVUZaTEVkQlFVY3NWMEZCVnp0aFFVTXhRaXhOUVVGTkxFTkJRVU1zVlVGQlFTeERRVUZETEVsQlFVa3NUMEZCUVN4RFFVRkRMRU5CUVVNc1NVRkJTU3hMUVVGTExFZEJRVWNzU1VGQlNTeExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVRGQ0xFTkJRVEJDTEVOQlFVTTdZVUZEZGtNc1IwRkJSeXhEUVVGRExGVkJRVUVzUTBGQlF5eEpRVUZKTEU5QlFVRXNTMEZCU1N4RFFVRkRMR2RDUVVGblFpeERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRjRRaXhEUVVGM1FpeERRVUZETEVOQlFVTTdVVUZEZUVNc1YwRkJWenRoUVVOT0xFMUJRVTBzUTBGQlF5eFZRVUZCTEVOQlFVTXNTVUZCU1N4UFFVRkJMRU5CUVVNc1EwRkJReXhKUVVGSkxFdEJRVXNzVjBGQlZ5eEZRVUYwUWl4RFFVRnpRaXhEUVVGRE8yRkJRMjVETEU5QlFVOHNRMEZCUXl4VlFVRkJMRU5CUVVNc1NVRkJTU3hQUVVGQkxFdEJRVWtzUTBGQlF5eGxRVUZsTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVhaQ0xFTkJRWFZDTEVOQlFVTXNRMEZCUXp0SlFVTXZReXhEUVVGRE8wbEJSVThzTkVOQlFYVkNMRWRCUVM5Q0xGVkJRV2RETEVWQlFWa3NSVUZCUlN4RlFVRlpMRVZCUVVVc1QwRkJhVUlzUlVGQlJTeFZRVUZ2UXp0UlFVTXZSeXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRE8xbEJRM0JDTEVsQlFVa3NRMEZCUXl4RFFVRkRMRXRCUVVzc1JVRkJSVHRuUWtGRFZDeERRVUZETEVOQlFVTXNVVUZCVVN4RFFVRkRMRTFCUVUwc1IwRkJSeXhEUVVGRExFTkJRVU1zVjBGQlZ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1YwRkJWeXhEUVVGRExFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTTdaMEpCUTNwRUxFOUJRVThzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4VlFVRlZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03WVVGRE9VSTdhVUpCUVUwN1owSkJRMGdzUTBGQlF5eERRVUZETEZGQlFWRXNRMEZCUXl4TlFVRk5MRWRCUVVjc1EwRkJReXhEUVVGRE8yRkJRM3BDTzFsQlEwUXNTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUzBGQlN5eEpRVUZKTEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNUVUZCVFN4SlFVRkpMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dFpRVU53UkN4SlFVRkpMRVZCUVVVc1IwRkJSeXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNSVUZCUlN4SFFVRkhMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU16UWl4RFFVRkRMRU5CUVVNc1RVRkJUU3hIUVVGSExFbEJRVWtzVTBGQlV5eERRVUZETEVWQlFVVXNSMEZCUnl4RFFVRkRMRVZCUVVVc1JVRkJSU3hIUVVGSExFTkJRVU1zUlVGQlJTeEZRVUZGTEVkQlFVY3NRMEZCUXl4RlFVRkZMRVZCUVVVc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU0zUkN4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVOUUxFTkJRVU03U1VGRlJDdzJRa0ZCVVN4SFFVRlNMRlZCUVZNc1JVRkJXU3hGUVVGRkxFVkJRVmtzUlVGQlJTeERRVUZYTzFGQlF6VkRMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zVTBGQlV5eEpRVUZKTEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1lVRkJZU3hKUVVGSkxFbEJRVWtzUTBGQlF5eFpRVUZaTEVOQlFVTTdXVUZCUlN4UFFVRlBPMUZCUXpGRkxFbEJRVWtzUTBGQlF5eFBRVUZQTEVOQlFVTXNSVUZCUlN4RlFVRkZMRVZCUVVVc1JVRkJSU3hGUVVGRkxFVkJRVVVzUTBGQlF5eEZRVUZGTEZWQlFVRXNRMEZCUXl4SlFVRkhMRTlCUVVFc1EwRkJReXhEUVVGRExFVkJRVVVzUlVGQlNpeERRVUZKTEVWQlFVVXNTVUZCU1N4RFFVRkRMRmxCUVZrc1JVRkJSU3g1UWtGQmVVSXNSVUZET1VVc1ZVRkJRU3hEUVVGRExFbEJRVWtzVDBGQlFTeERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMRlZCUVZVc1EwRkJReXhEUVVGRExFTkJRVzFDTEVOQlFVTXNRMEZCUXl4UlFVRlRMRU5CUVVNc1MwRkJTeXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEZGQlFWRXNRMEZCUXl4UlFVRlJMRVZCUVVVc1EwRkJReXhGUVVGdVJpeERRVUZ0Uml4RlFVTjRSaXhWUVVGQkxFTkJRVU03V1VGRFJ5eEpRVUZKTEVsQlFVa3NSMEZCUnl4RFFVRkRMRU5CUVcxQ0xFTkJRVU1zUTBGQlF5eE5RVUZQTEVOQlFVTXNTMEZCU3l4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF5eFJRVUZSTEVWQlFVVXNRMEZCUXp0WlFVTjBSU3hKUVVGSkxFbEJRVWtzUjBGQlJ5eERRVUZETEVOQlFXMUNMRU5CUVVNc1EwRkJReXhOUVVGUExFTkJRVU1zUzBGQlN5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhSUVVGUkxFVkJRVVVzUTBGQlF6dFpRVU4wUlN4SlFVRkpMRVZCUVVVc1IwRkJSeXhEUVVGRExFTkJRVU1zVDBGQlR5eEhRVUZITEVOQlFVTXNRMEZCUXp0WlFVTjJRaXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNSMEZCUnl4SlFVRkpMRWRCUVVjc1JVRkJSU3hEUVVGRE8xbEJRM1pDTEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJReXhIUVVGSExFbEJRVWtzUjBGQlJ5eEZRVUZGTEVOQlFVTTdVVUZETTBJc1EwRkJReXhEUVVGRExFTkJRVU03U1VGRFdDeERRVUZETzBsQlJVUXNOa0pCUVZFc1IwRkJVaXhWUVVGVExFVkJRVmtzUlVGQlJTeEZRVUZaTEVWQlFVVXNRMEZCVnp0UlFVTTFReXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEZOQlFWTXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhaUVVGWk8xbEJRVVVzVDBGQlR6dFJRVU5zUkN4SlFVRkpMRU5CUVVNc1QwRkJUeXhEUVVGRExFVkJRVVVzUlVGQlJTeEZRVUZGTEVWQlFVVXNSVUZCUlN4RlFVRkZMRU5CUVVNc1JVRkJSU3hWUVVGQkxFTkJRVU1zU1VGQlJ5eFBRVUZCTEVOQlFVTXNRMEZCUXl4RlFVRkZMRVZCUVVvc1EwRkJTU3hGUVVGRkxFbEJRVWtzUTBGQlF5eFpRVUZaTEVWQlFVVXNlVUpCUVhsQ0xFVkJRemxGTEZWQlFVRXNRMEZCUXl4SlFVRkpMRTlCUVVFc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF5eFZRVUZWTEVOQlFVTXNRMEZCUXl4RFFVRnRRaXhEUVVGRExFTkJRVU1zVVVGQlV5eERRVUZETEV0QlFVc3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhSUVVGUkxFTkJRVU1zVVVGQlVTeEZRVUZGTEVOQlFVTXNSVUZCYmtZc1EwRkJiVVlzUlVGRGVFWXNWVUZCUVN4RFFVRkRPMWxCUTBjc1NVRkJTU3hKUVVGSkxFZEJRVWNzUTBGQlF5eERRVUZ0UWl4RFFVRkRMRU5CUVVNc1RVRkJUeXhEUVVGRExFdEJRVXNzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1VVRkJVU3hGUVVGRkxFTkJRVU03V1VGRGRFVXNTVUZCU1N4SlFVRkpMRWRCUVVjc1EwRkJReXhEUVVGdFFpeERRVUZETEVOQlFVTXNUVUZCVHl4RFFVRkRMRXRCUVVzc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNVVUZCVVN4RlFVRkZMRU5CUVVNN1dVRkRkRVVzU1VGQlNTeEZRVUZGTEVkQlFVY3NRMEZCUXl4RFFVRkRMRTlCUVU4c1IwRkJSeXhEUVVGRExFTkJRVU03V1VGRGRrSXNRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRExFZEJRVWNzU1VGQlNTeEhRVUZITEVWQlFVVXNRMEZCUXp0WlFVRkJMRU5CUVVNN1dVRkRlRUlzUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRWRCUVVjc1NVRkJTU3hIUVVGSExFVkJRVVVzUTBGQlF6dFJRVU16UWl4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVOWUxFTkJRVU03U1VGRlJDeHhRMEZCWjBJc1IwRkJhRUk3VVVGQlFTeHBRa0ZMUXp0UlFVcEhMRTlCUVU4N1dVRkRTQ3hWUVVGRExFVkJRVVVzUlVGQlJTeEZRVUZGTEVWQlFVVXNRMEZCUXl4SlFVRkxMRTlCUVVFc1MwRkJTU3hEUVVGRExGRkJRVkVzUTBGQlF5eEZRVUZGTEVWQlFVVXNSVUZCUlN4RlFVRkZMRU5CUVVNc1EwRkJReXhGUVVGNFFpeERRVUYzUWp0WlFVTjJReXhWUVVGRExFVkJRVVVzUlVGQlJTeEZRVUZGTEVWQlFVVXNRMEZCUXl4SlFVRkxMRTlCUVVFc1MwRkJTU3hEUVVGRExGRkJRVkVzUTBGQlF5eEZRVUZGTEVWQlFVVXNSVUZCUlN4RlFVRkZMRU5CUVVNc1EwRkJReXhGUVVGNFFpeERRVUYzUWp0VFFVTXhReXhEUVVGRE8wbEJRMDRzUTBGQlF6dEpRVVZQTERSQ1FVRlBMRWRCUVdZc1ZVRkJaMElzUlVGQldTeEZRVUZGTEVWQlFWa3NSVUZCUlN4TFFVRmxMRVZCUVVVc1QwRkJhVUlzUlVGRE1VVXNWVUZCYjBNc1JVRkRjRU1zUlVGQlowSXNSVUZEYUVJc2JVSkJRWGxFTEVWQlEzcEVMR2RDUVVGMVF5eEZRVU4yUXl4cFFrRkJPRU03VVVGRk9VTXNTVUZCU1N4RFFVRkRMSFZDUVVGMVFpeERRVUZETEVWQlFVVXNSVUZCUlN4RlFVRkZMRVZCUVVVc1QwRkJUeXhGUVVGRkxGVkJRVlVzUTBGQlF5eERRVUZETzFGQlF6RkVMRWxCUVVrc1NVRkJTU3hEUVVGRExGTkJRVk1zU1VGQlNTeEpRVUZKTEVOQlFVTXNZVUZCWVN4RlFVRkZPMWxCUTNSRExHdENRVUZyUWl4RFFVRkRMRWxCUVVrc1EwRkJReXhUUVVGVExFTkJRVU1zUTBGQlF6dFpRVU51UXl4RlFVRkZMRWRCUVVjc1JVRkJSU3hEUVVGRExFMUJRVTBzUTBGQlF5eHRRa0ZCYlVJc1EwRkJReXhKUVVGSkxFTkJRVU1zVTBGQlV5eERRVUZETEVOQlFVTXNRMEZCUXp0VFFVTjJSRHRSUVVORUxFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNTVUZCU1N4RFFVRkRMRk5CUVZNc1JVRkJSU3hGUVVGRkxFVkJRVVVzUzBGQlN5eEZRVUZGTEU5QlFVOHNRMEZCUXl4RFFVRkRPMUZCUXk5RExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNUMEZCVHl4RFFVRkRMR2RDUVVGblFpeERRVUZETEVOQlFVTTdVVUZEY2tNc1NVRkJTU3hKUVVGSkxFTkJRVU1zVTBGQlV5eEpRVUZKTEVsQlFVa3NRMEZCUXl4aFFVRmhMRVZCUVVVN1dVRkRkRU1zU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4UFFVRlBMRU5CUVVNc2FVSkJRV2xDTEVOQlFVTXNRMEZCUXp0WlFVTjJReXhyUWtGQmEwSXNRMEZCUXl4SlFVRkpMRU5CUVVNc1UwRkJVeXhEUVVGRExFTkJRVU03VTBGRGRFTTdTVUZEVEN4RFFVRkRPMGxCUlU4c01FSkJRVXNzUjBGQllpeFZRVUZqTEVWQlFXTXNSVUZCUlN4RlFVRm5RaXhGUVVGRkxGRkJRV3RDTEVWQlFVVXNUMEZCYVVJN1VVRkRha1lzU1VGQlNTeE5RVUZOTEVkQlFVY3NTVUZCU1N4aFFVRk5MRU5CUVVNc1JVRkJSU3hGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZETzFGQlEyaERMRTFCUVUwc1EwRkJReXh2UWtGQmIwSXNRMEZCUXl4UlFVRlJMRU5CUVVNc1EwRkJRenRSUVVOMFF5eE5RVUZOTEVOQlFVTXNiVUpCUVcxQ0xFTkJRVU1zVDBGQlR5eERRVUZETEVOQlFVTTdVVUZEY0VNc1RVRkJUU3hEUVVGRExFdEJRVXNzUlVGQlJTeERRVUZETzBsQlEyNUNMRU5CUVVNN1NVRkRUQ3hwUWtGQlF6dEJRVUZFTEVOQlFVTXNRVUZzUzBRc1NVRnJTME03UVVGc1Mxa3NaME5CUVZVaWZRPT0iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBwcXVldWVfMSA9IHJlcXVpcmUoXCIuL3BxdWV1ZVwiKTtcbnZhciBOZWlnaGJvdXIgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIE5laWdoYm91cihpZCwgZGlzdGFuY2UpIHtcbiAgICAgICAgdGhpcy5pZCA9IGlkO1xuICAgICAgICB0aGlzLmRpc3RhbmNlID0gZGlzdGFuY2U7XG4gICAgfVxuICAgIHJldHVybiBOZWlnaGJvdXI7XG59KCkpO1xudmFyIE5vZGUgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIE5vZGUoaWQpIHtcbiAgICAgICAgdGhpcy5pZCA9IGlkO1xuICAgICAgICB0aGlzLm5laWdoYm91cnMgPSBbXTtcbiAgICB9XG4gICAgcmV0dXJuIE5vZGU7XG59KCkpO1xudmFyIFF1ZXVlRW50cnkgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFF1ZXVlRW50cnkobm9kZSwgcHJldiwgZCkge1xuICAgICAgICB0aGlzLm5vZGUgPSBub2RlO1xuICAgICAgICB0aGlzLnByZXYgPSBwcmV2O1xuICAgICAgICB0aGlzLmQgPSBkO1xuICAgIH1cbiAgICByZXR1cm4gUXVldWVFbnRyeTtcbn0oKSk7XG52YXIgQ2FsY3VsYXRvciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQ2FsY3VsYXRvcihuLCBlcywgZ2V0U291cmNlSW5kZXgsIGdldFRhcmdldEluZGV4LCBnZXRMZW5ndGgpIHtcbiAgICAgICAgdGhpcy5uID0gbjtcbiAgICAgICAgdGhpcy5lcyA9IGVzO1xuICAgICAgICB0aGlzLm5laWdoYm91cnMgPSBuZXcgQXJyYXkodGhpcy5uKTtcbiAgICAgICAgdmFyIGkgPSB0aGlzLm47XG4gICAgICAgIHdoaWxlIChpLS0pXG4gICAgICAgICAgICB0aGlzLm5laWdoYm91cnNbaV0gPSBuZXcgTm9kZShpKTtcbiAgICAgICAgaSA9IHRoaXMuZXMubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICB2YXIgZSA9IHRoaXMuZXNbaV07XG4gICAgICAgICAgICB2YXIgdSA9IGdldFNvdXJjZUluZGV4KGUpLCB2ID0gZ2V0VGFyZ2V0SW5kZXgoZSk7XG4gICAgICAgICAgICB2YXIgZCA9IGdldExlbmd0aChlKTtcbiAgICAgICAgICAgIHRoaXMubmVpZ2hib3Vyc1t1XS5uZWlnaGJvdXJzLnB1c2gobmV3IE5laWdoYm91cih2LCBkKSk7XG4gICAgICAgICAgICB0aGlzLm5laWdoYm91cnNbdl0ubmVpZ2hib3Vycy5wdXNoKG5ldyBOZWlnaGJvdXIodSwgZCkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIENhbGN1bGF0b3IucHJvdG90eXBlLkRpc3RhbmNlTWF0cml4ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgRCA9IG5ldyBBcnJheSh0aGlzLm4pO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubjsgKytpKSB7XG4gICAgICAgICAgICBEW2ldID0gdGhpcy5kaWprc3RyYU5laWdoYm91cnMoaSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIEQ7XG4gICAgfTtcbiAgICBDYWxjdWxhdG9yLnByb3RvdHlwZS5EaXN0YW5jZXNGcm9tTm9kZSA9IGZ1bmN0aW9uIChzdGFydCkge1xuICAgICAgICByZXR1cm4gdGhpcy5kaWprc3RyYU5laWdoYm91cnMoc3RhcnQpO1xuICAgIH07XG4gICAgQ2FsY3VsYXRvci5wcm90b3R5cGUuUGF0aEZyb21Ob2RlVG9Ob2RlID0gZnVuY3Rpb24gKHN0YXJ0LCBlbmQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGlqa3N0cmFOZWlnaGJvdXJzKHN0YXJ0LCBlbmQpO1xuICAgIH07XG4gICAgQ2FsY3VsYXRvci5wcm90b3R5cGUuUGF0aEZyb21Ob2RlVG9Ob2RlV2l0aFByZXZDb3N0ID0gZnVuY3Rpb24gKHN0YXJ0LCBlbmQsIHByZXZDb3N0KSB7XG4gICAgICAgIHZhciBxID0gbmV3IHBxdWV1ZV8xLlByaW9yaXR5UXVldWUoZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEuZCA8PSBiLmQ7IH0pLCB1ID0gdGhpcy5uZWlnaGJvdXJzW3N0YXJ0XSwgcXUgPSBuZXcgUXVldWVFbnRyeSh1LCBudWxsLCAwKSwgdmlzaXRlZEZyb20gPSB7fTtcbiAgICAgICAgcS5wdXNoKHF1KTtcbiAgICAgICAgd2hpbGUgKCFxLmVtcHR5KCkpIHtcbiAgICAgICAgICAgIHF1ID0gcS5wb3AoKTtcbiAgICAgICAgICAgIHUgPSBxdS5ub2RlO1xuICAgICAgICAgICAgaWYgKHUuaWQgPT09IGVuZCkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGkgPSB1Lm5laWdoYm91cnMubGVuZ3RoO1xuICAgICAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgICAgIHZhciBuZWlnaGJvdXIgPSB1Lm5laWdoYm91cnNbaV0sIHYgPSB0aGlzLm5laWdoYm91cnNbbmVpZ2hib3VyLmlkXTtcbiAgICAgICAgICAgICAgICBpZiAocXUucHJldiAmJiB2LmlkID09PSBxdS5wcmV2Lm5vZGUuaWQpXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIHZhciB2aWR1aWQgPSB2LmlkICsgJywnICsgdS5pZDtcbiAgICAgICAgICAgICAgICBpZiAodmlkdWlkIGluIHZpc2l0ZWRGcm9tICYmIHZpc2l0ZWRGcm9tW3ZpZHVpZF0gPD0gcXUuZClcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgdmFyIGNjID0gcXUucHJldiA/IHByZXZDb3N0KHF1LnByZXYubm9kZS5pZCwgdS5pZCwgdi5pZCkgOiAwLCB0ID0gcXUuZCArIG5laWdoYm91ci5kaXN0YW5jZSArIGNjO1xuICAgICAgICAgICAgICAgIHZpc2l0ZWRGcm9tW3ZpZHVpZF0gPSB0O1xuICAgICAgICAgICAgICAgIHEucHVzaChuZXcgUXVldWVFbnRyeSh2LCBxdSwgdCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhciBwYXRoID0gW107XG4gICAgICAgIHdoaWxlIChxdS5wcmV2KSB7XG4gICAgICAgICAgICBxdSA9IHF1LnByZXY7XG4gICAgICAgICAgICBwYXRoLnB1c2gocXUubm9kZS5pZCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHBhdGg7XG4gICAgfTtcbiAgICBDYWxjdWxhdG9yLnByb3RvdHlwZS5kaWprc3RyYU5laWdoYm91cnMgPSBmdW5jdGlvbiAoc3RhcnQsIGRlc3QpIHtcbiAgICAgICAgaWYgKGRlc3QgPT09IHZvaWQgMCkgeyBkZXN0ID0gLTE7IH1cbiAgICAgICAgdmFyIHEgPSBuZXcgcHF1ZXVlXzEuUHJpb3JpdHlRdWV1ZShmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYS5kIDw9IGIuZDsgfSksIGkgPSB0aGlzLm5laWdoYm91cnMubGVuZ3RoLCBkID0gbmV3IEFycmF5KGkpO1xuICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICB2YXIgbm9kZSA9IHRoaXMubmVpZ2hib3Vyc1tpXTtcbiAgICAgICAgICAgIG5vZGUuZCA9IGkgPT09IHN0YXJ0ID8gMCA6IE51bWJlci5QT1NJVElWRV9JTkZJTklUWTtcbiAgICAgICAgICAgIG5vZGUucSA9IHEucHVzaChub2RlKTtcbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAoIXEuZW1wdHkoKSkge1xuICAgICAgICAgICAgdmFyIHUgPSBxLnBvcCgpO1xuICAgICAgICAgICAgZFt1LmlkXSA9IHUuZDtcbiAgICAgICAgICAgIGlmICh1LmlkID09PSBkZXN0KSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhdGggPSBbXTtcbiAgICAgICAgICAgICAgICB2YXIgdiA9IHU7XG4gICAgICAgICAgICAgICAgd2hpbGUgKHR5cGVvZiB2LnByZXYgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGgucHVzaCh2LnByZXYuaWQpO1xuICAgICAgICAgICAgICAgICAgICB2ID0gdi5wcmV2O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcGF0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGkgPSB1Lm5laWdoYm91cnMubGVuZ3RoO1xuICAgICAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgICAgIHZhciBuZWlnaGJvdXIgPSB1Lm5laWdoYm91cnNbaV07XG4gICAgICAgICAgICAgICAgdmFyIHYgPSB0aGlzLm5laWdoYm91cnNbbmVpZ2hib3VyLmlkXTtcbiAgICAgICAgICAgICAgICB2YXIgdCA9IHUuZCArIG5laWdoYm91ci5kaXN0YW5jZTtcbiAgICAgICAgICAgICAgICBpZiAodS5kICE9PSBOdW1iZXIuTUFYX1ZBTFVFICYmIHYuZCA+IHQpIHtcbiAgICAgICAgICAgICAgICAgICAgdi5kID0gdDtcbiAgICAgICAgICAgICAgICAgICAgdi5wcmV2ID0gdTtcbiAgICAgICAgICAgICAgICAgICAgcS5yZWR1Y2VLZXkodi5xLCB2LCBmdW5jdGlvbiAoZSwgcSkgeyByZXR1cm4gZS5xID0gcTsgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkO1xuICAgIH07XG4gICAgcmV0dXJuIENhbGN1bGF0b3I7XG59KCkpO1xuZXhwb3J0cy5DYWxjdWxhdG9yID0gQ2FsY3VsYXRvcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSm1hV3hsSWpvaWMyaHZjblJsYzNSd1lYUm9jeTVxY3lJc0luTnZkWEpqWlZKdmIzUWlPaUlpTENKemIzVnlZMlZ6SWpwYklpNHVMeTR1TDFkbFlrTnZiR0V2YzNKakwzTm9iM0owWlhOMGNHRjBhSE11ZEhNaVhTd2libUZ0WlhNaU9sdGRMQ0p0WVhCd2FXNW5jeUk2SWpzN1FVRkJRU3h0UTBGQmJVUTdRVUZGYmtRN1NVRkRTU3h0UWtGQmJVSXNSVUZCVlN4RlFVRlRMRkZCUVdkQ08xRkJRVzVETEU5QlFVVXNSMEZCUml4RlFVRkZMRU5CUVZFN1VVRkJVeXhoUVVGUkxFZEJRVklzVVVGQlVTeERRVUZSTzBsQlFVa3NRMEZCUXp0SlFVTXZSQ3huUWtGQlF6dEJRVUZFTEVOQlFVTXNRVUZHUkN4SlFVVkRPMEZCUlVRN1NVRkRTU3hqUVVGdFFpeEZRVUZWTzFGQlFWWXNUMEZCUlN4SFFVRkdMRVZCUVVVc1EwRkJVVHRSUVVONlFpeEpRVUZKTEVOQlFVTXNWVUZCVlN4SFFVRkhMRVZCUVVVc1EwRkJRenRKUVVONlFpeERRVUZETzBsQlMwd3NWMEZCUXp0QlFVRkVMRU5CUVVNc1FVRlNSQ3hKUVZGRE8wRkJSVVE3U1VGRFNTeHZRa0ZCYlVJc1NVRkJWU3hGUVVGVExFbEJRV2RDTEVWQlFWTXNRMEZCVXp0UlFVRnlSQ3hUUVVGSkxFZEJRVW9zU1VGQlNTeERRVUZOTzFGQlFWTXNVMEZCU1N4SFFVRktMRWxCUVVrc1EwRkJXVHRSUVVGVExFMUJRVU1zUjBGQlJDeERRVUZETEVOQlFWRTdTVUZCUnl4RFFVRkRPMGxCUTJoR0xHbENRVUZETzBGQlFVUXNRMEZCUXl4QlFVWkVMRWxCUlVNN1FVRlRSRHRKUVVkSkxHOUNRVUZ0UWl4RFFVRlRMRVZCUVZNc1JVRkJWU3hGUVVGRkxHTkJRVzFETEVWQlFVVXNZMEZCYlVNc1JVRkJSU3hUUVVFNFFqdFJRVUYwU1N4TlFVRkRMRWRCUVVRc1EwRkJReXhEUVVGUk8xRkJRVk1zVDBGQlJTeEhRVUZHTEVWQlFVVXNRMEZCVVR0UlFVTXpReXhKUVVGSkxFTkJRVU1zVlVGQlZTeEhRVUZITEVsQlFVa3NTMEZCU3l4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU53UXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETzFGQlFVTXNUMEZCVHl4RFFVRkRMRVZCUVVVN1dVRkJSU3hKUVVGSkxFTkJRVU1zVlVGQlZTeERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRWxCUVVrc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlJUZEVMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zUlVGQlJTeERRVUZETEUxQlFVMHNRMEZCUXp0UlFVRkRMRTlCUVU4c1EwRkJReXhGUVVGRkxFVkJRVVU3V1VGRE5VSXNTVUZCU1N4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTnVRaXhKUVVGSkxFTkJRVU1zUjBGQlZ5eGpRVUZqTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhIUVVGWExHTkJRV01zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTnFSU3hKUVVGSkxFTkJRVU1zUjBGQlJ5eFRRVUZUTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkRja0lzU1VGQlNTeERRVUZETEZWQlFWVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhWUVVGVkxFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NVMEZCVXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFsQlEzaEVMRWxCUVVrc1EwRkJReXhWUVVGVkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNWVUZCVlN4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxGTkJRVk1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRUUVVNelJEdEpRVU5NTEVOQlFVTTdTVUZWUkN4dFEwRkJZeXhIUVVGa08xRkJRMGtzU1VGQlNTeERRVUZETEVkQlFVY3NTVUZCU1N4TFFVRkxMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlF6RkNMRXRCUVVzc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF5eEZRVUZGTzFsQlF6ZENMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNhMEpCUVd0Q0xFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVMEZEY2tNN1VVRkRSQ3hQUVVGUExFTkJRVU1zUTBGQlF6dEpRVU5pTEVOQlFVTTdTVUZSUkN4elEwRkJhVUlzUjBGQmFrSXNWVUZCYTBJc1MwRkJZVHRSUVVNelFpeFBRVUZQTEVsQlFVa3NRMEZCUXl4clFrRkJhMElzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXp0SlFVTXhReXhEUVVGRE8wbEJSVVFzZFVOQlFXdENMRWRCUVd4Q0xGVkJRVzFDTEV0QlFXRXNSVUZCUlN4SFFVRlhPMUZCUTNwRExFOUJRVThzU1VGQlNTeERRVUZETEd0Q1FVRnJRaXhEUVVGRExFdEJRVXNzUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXp0SlFVTXZReXhEUVVGRE8wbEJTMFFzYlVSQlFUaENMRWRCUVRsQ0xGVkJRMGtzUzBGQllTeEZRVU5pTEVkQlFWY3NSVUZEV0N4UlFVRTRRenRSUVVVNVF5eEpRVUZKTEVOQlFVTXNSMEZCUnl4SlFVRkpMSE5DUVVGaExFTkJRV0VzVlVGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4SlFVRkxMRTlCUVVFc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRldMRU5CUVZVc1EwRkJReXhGUVVOMlJDeERRVUZETEVkQlFWTXNTVUZCU1N4RFFVRkRMRlZCUVZVc1EwRkJReXhMUVVGTExFTkJRVU1zUlVGRGFFTXNSVUZCUlN4SFFVRmxMRWxCUVVrc1ZVRkJWU3hEUVVGRExFTkJRVU1zUlVGQlF5eEpRVUZKTEVWQlFVTXNRMEZCUXl4RFFVRkRMRVZCUTNwRExGZEJRVmNzUjBGQlJ5eEZRVUZGTEVOQlFVTTdVVUZEY2tJc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXp0UlFVTllMRTlCUVUwc1EwRkJReXhEUVVGRExFTkJRVU1zUzBGQlN5eEZRVUZGTEVWQlFVVTdXVUZEWkN4RlFVRkZMRWRCUVVjc1EwRkJReXhEUVVGRExFZEJRVWNzUlVGQlJTeERRVUZETzFsQlEySXNRMEZCUXl4SFFVRkhMRVZCUVVVc1EwRkJReXhKUVVGSkxFTkJRVU03V1VGRFdpeEpRVUZKTEVOQlFVTXNRMEZCUXl4RlFVRkZMRXRCUVVzc1IwRkJSeXhGUVVGRk8yZENRVU5rTEUxQlFVMDdZVUZEVkR0WlFVTkVMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eFZRVUZWTEVOQlFVTXNUVUZCVFN4RFFVRkRPMWxCUVVNc1QwRkJUeXhEUVVGRExFVkJRVVVzUlVGQlJUdG5Ra0ZEY2tNc1NVRkJTU3hUUVVGVExFZEJRVWNzUTBGQlF5eERRVUZETEZWQlFWVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkRNMElzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4VlFVRlZMRU5CUVVNc1UwRkJVeXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETzJkQ1FVZDBReXhKUVVGSkxFVkJRVVVzUTBGQlF5eEpRVUZKTEVsQlFVa3NRMEZCUXl4RFFVRkRMRVZCUVVVc1MwRkJTeXhGUVVGRkxFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4RlFVRkZPMjlDUVVGRkxGTkJRVk03WjBKQlNXeEVMRWxCUVVrc1RVRkJUU3hIUVVGSExFTkJRVU1zUTBGQlF5eEZRVUZGTEVkQlFVY3NSMEZCUnl4SFFVRkhMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU03WjBKQlF5OUNMRWxCUVVjc1RVRkJUU3hKUVVGSkxGZEJRVmNzU1VGQlNTeFhRVUZYTEVOQlFVTXNUVUZCVFN4RFFVRkRMRWxCUVVrc1JVRkJSU3hEUVVGRExFTkJRVU03YjBKQlEyNUVMRk5CUVZNN1owSkJSV0lzU1VGQlNTeEZRVUZGTEVkQlFVY3NSVUZCUlN4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zVVVGQlVTeERRVUZETEVWQlFVVXNRMEZCUXl4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFVkJRVVVzUlVGQlJTeERRVUZETEVOQlFVTXNSVUZCUlN4RlFVRkZMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVTjRSQ3hEUVVGRExFZEJRVWNzUlVGQlJTeERRVUZETEVOQlFVTXNSMEZCUnl4VFFVRlRMRU5CUVVNc1VVRkJVU3hIUVVGSExFVkJRVVVzUTBGQlF6dG5Ra0ZIZGtNc1YwRkJWeXhEUVVGRExFMUJRVTBzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0blFrRkRlRUlzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMRlZCUVZVc1EwRkJReXhEUVVGRExFVkJRVVVzUlVGQlJTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1lVRkRjRU03VTBGRFNqdFJRVU5FTEVsQlFVa3NTVUZCU1N4SFFVRlpMRVZCUVVVc1EwRkJRenRSUVVOMlFpeFBRVUZQTEVWQlFVVXNRMEZCUXl4SlFVRkpMRVZCUVVVN1dVRkRXaXhGUVVGRkxFZEJRVWNzUlVGQlJTeERRVUZETEVsQlFVa3NRMEZCUXp0WlFVTmlMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zUlVGQlJTeERRVUZETEVsQlFVa3NRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJRenRUUVVONlFqdFJRVU5FTEU5QlFVOHNTVUZCU1N4RFFVRkRPMGxCUTJoQ0xFTkJRVU03U1VGRlR5eDFRMEZCYTBJc1IwRkJNVUlzVlVGQk1rSXNTMEZCWVN4RlFVRkZMRWxCUVdsQ08xRkJRV3BDTEhGQ1FVRkJMRVZCUVVFc1VVRkJaMElzUTBGQlF6dFJRVU4yUkN4SlFVRkpMRU5CUVVNc1IwRkJSeXhKUVVGSkxITkNRVUZoTEVOQlFVOHNWVUZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhKUVVGTExFOUJRVUVzUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGV0xFTkJRVlVzUTBGQlF5eEZRVU5xUkN4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExGVkJRVlVzUTBGQlF5eE5RVUZOTEVWQlF6RkNMRU5CUVVNc1IwRkJZU3hKUVVGSkxFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTXZRaXhQUVVGUExFTkJRVU1zUlVGQlJTeEZRVUZGTzFsQlExSXNTVUZCU1N4SlFVRkpMRWRCUVZNc1NVRkJTU3hEUVVGRExGVkJRVlVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTndReXhKUVVGSkxFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNTMEZCU3l4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMR2xDUVVGcFFpeERRVUZETzFsQlEzQkVMRWxCUVVrc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRenRUUVVONlFqdFJRVU5FTEU5QlFVOHNRMEZCUXl4RFFVRkRMRU5CUVVNc1MwRkJTeXhGUVVGRkxFVkJRVVU3V1VGRlppeEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1IwRkJSeXhGUVVGRkxFTkJRVU03V1VGRGFFSXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUTJRc1NVRkJTU3hEUVVGRExFTkJRVU1zUlVGQlJTeExRVUZMTEVsQlFVa3NSVUZCUlR0blFrRkRaaXhKUVVGSkxFbEJRVWtzUjBGQllTeEZRVUZGTEVOQlFVTTdaMEpCUTNoQ0xFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0blFrRkRWaXhQUVVGUExFOUJRVThzUTBGQlF5eERRVUZETEVsQlFVa3NTMEZCU3l4WFFVRlhMRVZCUVVVN2IwSkJRMnhETEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXp0dlFrRkRja0lzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNN2FVSkJRMlE3WjBKQlEwUXNUMEZCVHl4SlFVRkpMRU5CUVVNN1lVRkRaanRaUVVORUxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNWVUZCVlN4RFFVRkRMRTFCUVUwc1EwRkJRenRaUVVGRExFOUJRVThzUTBGQlF5eEZRVUZGTEVWQlFVVTdaMEpCUTJwRExFbEJRVWtzVTBGQlV5eEhRVUZITEVOQlFVTXNRMEZCUXl4VlFVRlZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03WjBKQlEyaERMRWxCUVVrc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eFZRVUZWTEVOQlFVTXNVMEZCVXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRE8yZENRVU4wUXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEZOQlFWTXNRMEZCUXl4UlFVRlJMRU5CUVVNN1owSkJRMnBETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1MwRkJTeXhOUVVGTkxFTkJRVU1zVTBGQlV5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRk8yOUNRVU55UXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dHZRa0ZEVWl4RFFVRkRMRU5CUVVNc1NVRkJTU3hIUVVGSExFTkJRVU1zUTBGQlF6dHZRa0ZEV0N4RFFVRkRMRU5CUVVNc1UwRkJVeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRlZCUVVNc1EwRkJReXhGUVVGRExFTkJRVU1zU1VGQlJ5eFBRVUZCTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGUUxFTkJRVThzUTBGQlF5eERRVUZETzJsQ1FVTjJRenRoUVVOS08xTkJRMG83VVVGRFJDeFBRVUZQTEVOQlFVTXNRMEZCUXp0SlFVTmlMRU5CUVVNN1NVRkRUQ3hwUWtGQlF6dEJRVUZFTEVOQlFVTXNRVUZxU1VRc1NVRnBTVU03UVVGcVNWa3NaME5CUVZVaWZRPT0iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBQb3NpdGlvblN0YXRzID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBQb3NpdGlvblN0YXRzKHNjYWxlKSB7XG4gICAgICAgIHRoaXMuc2NhbGUgPSBzY2FsZTtcbiAgICAgICAgdGhpcy5BQiA9IDA7XG4gICAgICAgIHRoaXMuQUQgPSAwO1xuICAgICAgICB0aGlzLkEyID0gMDtcbiAgICB9XG4gICAgUG9zaXRpb25TdGF0cy5wcm90b3R5cGUuYWRkVmFyaWFibGUgPSBmdW5jdGlvbiAodikge1xuICAgICAgICB2YXIgYWkgPSB0aGlzLnNjYWxlIC8gdi5zY2FsZTtcbiAgICAgICAgdmFyIGJpID0gdi5vZmZzZXQgLyB2LnNjYWxlO1xuICAgICAgICB2YXIgd2kgPSB2LndlaWdodDtcbiAgICAgICAgdGhpcy5BQiArPSB3aSAqIGFpICogYmk7XG4gICAgICAgIHRoaXMuQUQgKz0gd2kgKiBhaSAqIHYuZGVzaXJlZFBvc2l0aW9uO1xuICAgICAgICB0aGlzLkEyICs9IHdpICogYWkgKiBhaTtcbiAgICB9O1xuICAgIFBvc2l0aW9uU3RhdHMucHJvdG90eXBlLmdldFBvc24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAodGhpcy5BRCAtIHRoaXMuQUIpIC8gdGhpcy5BMjtcbiAgICB9O1xuICAgIHJldHVybiBQb3NpdGlvblN0YXRzO1xufSgpKTtcbmV4cG9ydHMuUG9zaXRpb25TdGF0cyA9IFBvc2l0aW9uU3RhdHM7XG52YXIgQ29uc3RyYWludCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQ29uc3RyYWludChsZWZ0LCByaWdodCwgZ2FwLCBlcXVhbGl0eSkge1xuICAgICAgICBpZiAoZXF1YWxpdHkgPT09IHZvaWQgMCkgeyBlcXVhbGl0eSA9IGZhbHNlOyB9XG4gICAgICAgIHRoaXMubGVmdCA9IGxlZnQ7XG4gICAgICAgIHRoaXMucmlnaHQgPSByaWdodDtcbiAgICAgICAgdGhpcy5nYXAgPSBnYXA7XG4gICAgICAgIHRoaXMuZXF1YWxpdHkgPSBlcXVhbGl0eTtcbiAgICAgICAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy51bnNhdGlzZmlhYmxlID0gZmFsc2U7XG4gICAgICAgIHRoaXMubGVmdCA9IGxlZnQ7XG4gICAgICAgIHRoaXMucmlnaHQgPSByaWdodDtcbiAgICAgICAgdGhpcy5nYXAgPSBnYXA7XG4gICAgICAgIHRoaXMuZXF1YWxpdHkgPSBlcXVhbGl0eTtcbiAgICB9XG4gICAgQ29uc3RyYWludC5wcm90b3R5cGUuc2xhY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnVuc2F0aXNmaWFibGUgPyBOdW1iZXIuTUFYX1ZBTFVFXG4gICAgICAgICAgICA6IHRoaXMucmlnaHQuc2NhbGUgKiB0aGlzLnJpZ2h0LnBvc2l0aW9uKCkgLSB0aGlzLmdhcFxuICAgICAgICAgICAgICAgIC0gdGhpcy5sZWZ0LnNjYWxlICogdGhpcy5sZWZ0LnBvc2l0aW9uKCk7XG4gICAgfTtcbiAgICByZXR1cm4gQ29uc3RyYWludDtcbn0oKSk7XG5leHBvcnRzLkNvbnN0cmFpbnQgPSBDb25zdHJhaW50O1xudmFyIFZhcmlhYmxlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBWYXJpYWJsZShkZXNpcmVkUG9zaXRpb24sIHdlaWdodCwgc2NhbGUpIHtcbiAgICAgICAgaWYgKHdlaWdodCA9PT0gdm9pZCAwKSB7IHdlaWdodCA9IDE7IH1cbiAgICAgICAgaWYgKHNjYWxlID09PSB2b2lkIDApIHsgc2NhbGUgPSAxOyB9XG4gICAgICAgIHRoaXMuZGVzaXJlZFBvc2l0aW9uID0gZGVzaXJlZFBvc2l0aW9uO1xuICAgICAgICB0aGlzLndlaWdodCA9IHdlaWdodDtcbiAgICAgICAgdGhpcy5zY2FsZSA9IHNjYWxlO1xuICAgICAgICB0aGlzLm9mZnNldCA9IDA7XG4gICAgfVxuICAgIFZhcmlhYmxlLnByb3RvdHlwZS5kZmR2ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gMi4wICogdGhpcy53ZWlnaHQgKiAodGhpcy5wb3NpdGlvbigpIC0gdGhpcy5kZXNpcmVkUG9zaXRpb24pO1xuICAgIH07XG4gICAgVmFyaWFibGUucHJvdG90eXBlLnBvc2l0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gKHRoaXMuYmxvY2sucHMuc2NhbGUgKiB0aGlzLmJsb2NrLnBvc24gKyB0aGlzLm9mZnNldCkgLyB0aGlzLnNjYWxlO1xuICAgIH07XG4gICAgVmFyaWFibGUucHJvdG90eXBlLnZpc2l0TmVpZ2hib3VycyA9IGZ1bmN0aW9uIChwcmV2LCBmKSB7XG4gICAgICAgIHZhciBmZiA9IGZ1bmN0aW9uIChjLCBuZXh0KSB7IHJldHVybiBjLmFjdGl2ZSAmJiBwcmV2ICE9PSBuZXh0ICYmIGYoYywgbmV4dCk7IH07XG4gICAgICAgIHRoaXMuY091dC5mb3JFYWNoKGZ1bmN0aW9uIChjKSB7IHJldHVybiBmZihjLCBjLnJpZ2h0KTsgfSk7XG4gICAgICAgIHRoaXMuY0luLmZvckVhY2goZnVuY3Rpb24gKGMpIHsgcmV0dXJuIGZmKGMsIGMubGVmdCk7IH0pO1xuICAgIH07XG4gICAgcmV0dXJuIFZhcmlhYmxlO1xufSgpKTtcbmV4cG9ydHMuVmFyaWFibGUgPSBWYXJpYWJsZTtcbnZhciBCbG9jayA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQmxvY2sodikge1xuICAgICAgICB0aGlzLnZhcnMgPSBbXTtcbiAgICAgICAgdi5vZmZzZXQgPSAwO1xuICAgICAgICB0aGlzLnBzID0gbmV3IFBvc2l0aW9uU3RhdHModi5zY2FsZSk7XG4gICAgICAgIHRoaXMuYWRkVmFyaWFibGUodik7XG4gICAgfVxuICAgIEJsb2NrLnByb3RvdHlwZS5hZGRWYXJpYWJsZSA9IGZ1bmN0aW9uICh2KSB7XG4gICAgICAgIHYuYmxvY2sgPSB0aGlzO1xuICAgICAgICB0aGlzLnZhcnMucHVzaCh2KTtcbiAgICAgICAgdGhpcy5wcy5hZGRWYXJpYWJsZSh2KTtcbiAgICAgICAgdGhpcy5wb3NuID0gdGhpcy5wcy5nZXRQb3NuKCk7XG4gICAgfTtcbiAgICBCbG9jay5wcm90b3R5cGUudXBkYXRlV2VpZ2h0ZWRQb3NpdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5wcy5BQiA9IHRoaXMucHMuQUQgPSB0aGlzLnBzLkEyID0gMDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIG4gPSB0aGlzLnZhcnMubGVuZ3RoOyBpIDwgbjsgKytpKVxuICAgICAgICAgICAgdGhpcy5wcy5hZGRWYXJpYWJsZSh0aGlzLnZhcnNbaV0pO1xuICAgICAgICB0aGlzLnBvc24gPSB0aGlzLnBzLmdldFBvc24oKTtcbiAgICB9O1xuICAgIEJsb2NrLnByb3RvdHlwZS5jb21wdXRlX2xtID0gZnVuY3Rpb24gKHYsIHUsIHBvc3RBY3Rpb24pIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIGRmZHYgPSB2LmRmZHYoKTtcbiAgICAgICAgdi52aXNpdE5laWdoYm91cnModSwgZnVuY3Rpb24gKGMsIG5leHQpIHtcbiAgICAgICAgICAgIHZhciBfZGZkdiA9IF90aGlzLmNvbXB1dGVfbG0obmV4dCwgdiwgcG9zdEFjdGlvbik7XG4gICAgICAgICAgICBpZiAobmV4dCA9PT0gYy5yaWdodCkge1xuICAgICAgICAgICAgICAgIGRmZHYgKz0gX2RmZHYgKiBjLmxlZnQuc2NhbGU7XG4gICAgICAgICAgICAgICAgYy5sbSA9IF9kZmR2O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZGZkdiArPSBfZGZkdiAqIGMucmlnaHQuc2NhbGU7XG4gICAgICAgICAgICAgICAgYy5sbSA9IC1fZGZkdjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBvc3RBY3Rpb24oYyk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZGZkdiAvIHYuc2NhbGU7XG4gICAgfTtcbiAgICBCbG9jay5wcm90b3R5cGUucG9wdWxhdGVTcGxpdEJsb2NrID0gZnVuY3Rpb24gKHYsIHByZXYpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdi52aXNpdE5laWdoYm91cnMocHJldiwgZnVuY3Rpb24gKGMsIG5leHQpIHtcbiAgICAgICAgICAgIG5leHQub2Zmc2V0ID0gdi5vZmZzZXQgKyAobmV4dCA9PT0gYy5yaWdodCA/IGMuZ2FwIDogLWMuZ2FwKTtcbiAgICAgICAgICAgIF90aGlzLmFkZFZhcmlhYmxlKG5leHQpO1xuICAgICAgICAgICAgX3RoaXMucG9wdWxhdGVTcGxpdEJsb2NrKG5leHQsIHYpO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIEJsb2NrLnByb3RvdHlwZS50cmF2ZXJzZSA9IGZ1bmN0aW9uICh2aXNpdCwgYWNjLCB2LCBwcmV2KSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIGlmICh2ID09PSB2b2lkIDApIHsgdiA9IHRoaXMudmFyc1swXTsgfVxuICAgICAgICBpZiAocHJldiA9PT0gdm9pZCAwKSB7IHByZXYgPSBudWxsOyB9XG4gICAgICAgIHYudmlzaXROZWlnaGJvdXJzKHByZXYsIGZ1bmN0aW9uIChjLCBuZXh0KSB7XG4gICAgICAgICAgICBhY2MucHVzaCh2aXNpdChjKSk7XG4gICAgICAgICAgICBfdGhpcy50cmF2ZXJzZSh2aXNpdCwgYWNjLCBuZXh0LCB2KTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBCbG9jay5wcm90b3R5cGUuZmluZE1pbkxNID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbSA9IG51bGw7XG4gICAgICAgIHRoaXMuY29tcHV0ZV9sbSh0aGlzLnZhcnNbMF0sIG51bGwsIGZ1bmN0aW9uIChjKSB7XG4gICAgICAgICAgICBpZiAoIWMuZXF1YWxpdHkgJiYgKG0gPT09IG51bGwgfHwgYy5sbSA8IG0ubG0pKVxuICAgICAgICAgICAgICAgIG0gPSBjO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG07XG4gICAgfTtcbiAgICBCbG9jay5wcm90b3R5cGUuZmluZE1pbkxNQmV0d2VlbiA9IGZ1bmN0aW9uIChsdiwgcnYpIHtcbiAgICAgICAgdGhpcy5jb21wdXRlX2xtKGx2LCBudWxsLCBmdW5jdGlvbiAoKSB7IH0pO1xuICAgICAgICB2YXIgbSA9IG51bGw7XG4gICAgICAgIHRoaXMuZmluZFBhdGgobHYsIG51bGwsIHJ2LCBmdW5jdGlvbiAoYywgbmV4dCkge1xuICAgICAgICAgICAgaWYgKCFjLmVxdWFsaXR5ICYmIGMucmlnaHQgPT09IG5leHQgJiYgKG0gPT09IG51bGwgfHwgYy5sbSA8IG0ubG0pKVxuICAgICAgICAgICAgICAgIG0gPSBjO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG07XG4gICAgfTtcbiAgICBCbG9jay5wcm90b3R5cGUuZmluZFBhdGggPSBmdW5jdGlvbiAodiwgcHJldiwgdG8sIHZpc2l0KSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBlbmRGb3VuZCA9IGZhbHNlO1xuICAgICAgICB2LnZpc2l0TmVpZ2hib3VycyhwcmV2LCBmdW5jdGlvbiAoYywgbmV4dCkge1xuICAgICAgICAgICAgaWYgKCFlbmRGb3VuZCAmJiAobmV4dCA9PT0gdG8gfHwgX3RoaXMuZmluZFBhdGgobmV4dCwgdiwgdG8sIHZpc2l0KSkpIHtcbiAgICAgICAgICAgICAgICBlbmRGb3VuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgdmlzaXQoYywgbmV4dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZW5kRm91bmQ7XG4gICAgfTtcbiAgICBCbG9jay5wcm90b3R5cGUuaXNBY3RpdmVEaXJlY3RlZFBhdGhCZXR3ZWVuID0gZnVuY3Rpb24gKHUsIHYpIHtcbiAgICAgICAgaWYgKHUgPT09IHYpXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgdmFyIGkgPSB1LmNPdXQubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICB2YXIgYyA9IHUuY091dFtpXTtcbiAgICAgICAgICAgIGlmIChjLmFjdGl2ZSAmJiB0aGlzLmlzQWN0aXZlRGlyZWN0ZWRQYXRoQmV0d2VlbihjLnJpZ2h0LCB2KSlcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcbiAgICBCbG9jay5zcGxpdCA9IGZ1bmN0aW9uIChjKSB7XG4gICAgICAgIGMuYWN0aXZlID0gZmFsc2U7XG4gICAgICAgIHJldHVybiBbQmxvY2suY3JlYXRlU3BsaXRCbG9jayhjLmxlZnQpLCBCbG9jay5jcmVhdGVTcGxpdEJsb2NrKGMucmlnaHQpXTtcbiAgICB9O1xuICAgIEJsb2NrLmNyZWF0ZVNwbGl0QmxvY2sgPSBmdW5jdGlvbiAoc3RhcnRWYXIpIHtcbiAgICAgICAgdmFyIGIgPSBuZXcgQmxvY2soc3RhcnRWYXIpO1xuICAgICAgICBiLnBvcHVsYXRlU3BsaXRCbG9jayhzdGFydFZhciwgbnVsbCk7XG4gICAgICAgIHJldHVybiBiO1xuICAgIH07XG4gICAgQmxvY2sucHJvdG90eXBlLnNwbGl0QmV0d2VlbiA9IGZ1bmN0aW9uICh2bCwgdnIpIHtcbiAgICAgICAgdmFyIGMgPSB0aGlzLmZpbmRNaW5MTUJldHdlZW4odmwsIHZyKTtcbiAgICAgICAgaWYgKGMgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHZhciBicyA9IEJsb2NrLnNwbGl0KGMpO1xuICAgICAgICAgICAgcmV0dXJuIHsgY29uc3RyYWludDogYywgbGI6IGJzWzBdLCByYjogYnNbMV0gfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9O1xuICAgIEJsb2NrLnByb3RvdHlwZS5tZXJnZUFjcm9zcyA9IGZ1bmN0aW9uIChiLCBjLCBkaXN0KSB7XG4gICAgICAgIGMuYWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIG4gPSBiLnZhcnMubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICB2YXIgdiA9IGIudmFyc1tpXTtcbiAgICAgICAgICAgIHYub2Zmc2V0ICs9IGRpc3Q7XG4gICAgICAgICAgICB0aGlzLmFkZFZhcmlhYmxlKHYpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucG9zbiA9IHRoaXMucHMuZ2V0UG9zbigpO1xuICAgIH07XG4gICAgQmxvY2sucHJvdG90eXBlLmNvc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBzdW0gPSAwLCBpID0gdGhpcy52YXJzLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgdmFyIHYgPSB0aGlzLnZhcnNbaV0sIGQgPSB2LnBvc2l0aW9uKCkgLSB2LmRlc2lyZWRQb3NpdGlvbjtcbiAgICAgICAgICAgIHN1bSArPSBkICogZCAqIHYud2VpZ2h0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzdW07XG4gICAgfTtcbiAgICByZXR1cm4gQmxvY2s7XG59KCkpO1xuZXhwb3J0cy5CbG9jayA9IEJsb2NrO1xudmFyIEJsb2NrcyA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQmxvY2tzKHZzKSB7XG4gICAgICAgIHRoaXMudnMgPSB2cztcbiAgICAgICAgdmFyIG4gPSB2cy5sZW5ndGg7XG4gICAgICAgIHRoaXMubGlzdCA9IG5ldyBBcnJheShuKTtcbiAgICAgICAgd2hpbGUgKG4tLSkge1xuICAgICAgICAgICAgdmFyIGIgPSBuZXcgQmxvY2sodnNbbl0pO1xuICAgICAgICAgICAgdGhpcy5saXN0W25dID0gYjtcbiAgICAgICAgICAgIGIuYmxvY2tJbmQgPSBuO1xuICAgICAgICB9XG4gICAgfVxuICAgIEJsb2Nrcy5wcm90b3R5cGUuY29zdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHN1bSA9IDAsIGkgPSB0aGlzLmxpc3QubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoaS0tKVxuICAgICAgICAgICAgc3VtICs9IHRoaXMubGlzdFtpXS5jb3N0KCk7XG4gICAgICAgIHJldHVybiBzdW07XG4gICAgfTtcbiAgICBCbG9ja3MucHJvdG90eXBlLmluc2VydCA9IGZ1bmN0aW9uIChiKSB7XG4gICAgICAgIGIuYmxvY2tJbmQgPSB0aGlzLmxpc3QubGVuZ3RoO1xuICAgICAgICB0aGlzLmxpc3QucHVzaChiKTtcbiAgICB9O1xuICAgIEJsb2Nrcy5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24gKGIpIHtcbiAgICAgICAgdmFyIGxhc3QgPSB0aGlzLmxpc3QubGVuZ3RoIC0gMTtcbiAgICAgICAgdmFyIHN3YXBCbG9jayA9IHRoaXMubGlzdFtsYXN0XTtcbiAgICAgICAgdGhpcy5saXN0Lmxlbmd0aCA9IGxhc3Q7XG4gICAgICAgIGlmIChiICE9PSBzd2FwQmxvY2spIHtcbiAgICAgICAgICAgIHRoaXMubGlzdFtiLmJsb2NrSW5kXSA9IHN3YXBCbG9jaztcbiAgICAgICAgICAgIHN3YXBCbG9jay5ibG9ja0luZCA9IGIuYmxvY2tJbmQ7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEJsb2Nrcy5wcm90b3R5cGUubWVyZ2UgPSBmdW5jdGlvbiAoYykge1xuICAgICAgICB2YXIgbCA9IGMubGVmdC5ibG9jaywgciA9IGMucmlnaHQuYmxvY2s7XG4gICAgICAgIHZhciBkaXN0ID0gYy5yaWdodC5vZmZzZXQgLSBjLmxlZnQub2Zmc2V0IC0gYy5nYXA7XG4gICAgICAgIGlmIChsLnZhcnMubGVuZ3RoIDwgci52YXJzLmxlbmd0aCkge1xuICAgICAgICAgICAgci5tZXJnZUFjcm9zcyhsLCBjLCBkaXN0KTtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlKGwpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgbC5tZXJnZUFjcm9zcyhyLCBjLCAtZGlzdCk7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZShyKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgQmxvY2tzLnByb3RvdHlwZS5mb3JFYWNoID0gZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgdGhpcy5saXN0LmZvckVhY2goZik7XG4gICAgfTtcbiAgICBCbG9ja3MucHJvdG90eXBlLnVwZGF0ZUJsb2NrUG9zaXRpb25zID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmxpc3QuZm9yRWFjaChmdW5jdGlvbiAoYikgeyByZXR1cm4gYi51cGRhdGVXZWlnaHRlZFBvc2l0aW9uKCk7IH0pO1xuICAgIH07XG4gICAgQmxvY2tzLnByb3RvdHlwZS5zcGxpdCA9IGZ1bmN0aW9uIChpbmFjdGl2ZSkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB0aGlzLnVwZGF0ZUJsb2NrUG9zaXRpb25zKCk7XG4gICAgICAgIHRoaXMubGlzdC5mb3JFYWNoKGZ1bmN0aW9uIChiKSB7XG4gICAgICAgICAgICB2YXIgdiA9IGIuZmluZE1pbkxNKCk7XG4gICAgICAgICAgICBpZiAodiAhPT0gbnVsbCAmJiB2LmxtIDwgU29sdmVyLkxBR1JBTkdJQU5fVE9MRVJBTkNFKSB7XG4gICAgICAgICAgICAgICAgYiA9IHYubGVmdC5ibG9jaztcbiAgICAgICAgICAgICAgICBCbG9jay5zcGxpdCh2KS5mb3JFYWNoKGZ1bmN0aW9uIChuYikgeyByZXR1cm4gX3RoaXMuaW5zZXJ0KG5iKTsgfSk7XG4gICAgICAgICAgICAgICAgX3RoaXMucmVtb3ZlKGIpO1xuICAgICAgICAgICAgICAgIGluYWN0aXZlLnB1c2godik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgcmV0dXJuIEJsb2Nrcztcbn0oKSk7XG5leHBvcnRzLkJsb2NrcyA9IEJsb2NrcztcbnZhciBTb2x2ZXIgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFNvbHZlcih2cywgY3MpIHtcbiAgICAgICAgdGhpcy52cyA9IHZzO1xuICAgICAgICB0aGlzLmNzID0gY3M7XG4gICAgICAgIHRoaXMudnMgPSB2cztcbiAgICAgICAgdnMuZm9yRWFjaChmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgdi5jSW4gPSBbXSwgdi5jT3V0ID0gW107XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmNzID0gY3M7XG4gICAgICAgIGNzLmZvckVhY2goZnVuY3Rpb24gKGMpIHtcbiAgICAgICAgICAgIGMubGVmdC5jT3V0LnB1c2goYyk7XG4gICAgICAgICAgICBjLnJpZ2h0LmNJbi5wdXNoKGMpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5pbmFjdGl2ZSA9IGNzLm1hcChmdW5jdGlvbiAoYykgeyBjLmFjdGl2ZSA9IGZhbHNlOyByZXR1cm4gYzsgfSk7XG4gICAgICAgIHRoaXMuYnMgPSBudWxsO1xuICAgIH1cbiAgICBTb2x2ZXIucHJvdG90eXBlLmNvc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmJzLmNvc3QoKTtcbiAgICB9O1xuICAgIFNvbHZlci5wcm90b3R5cGUuc2V0U3RhcnRpbmdQb3NpdGlvbnMgPSBmdW5jdGlvbiAocHMpIHtcbiAgICAgICAgdGhpcy5pbmFjdGl2ZSA9IHRoaXMuY3MubWFwKGZ1bmN0aW9uIChjKSB7IGMuYWN0aXZlID0gZmFsc2U7IHJldHVybiBjOyB9KTtcbiAgICAgICAgdGhpcy5icyA9IG5ldyBCbG9ja3ModGhpcy52cyk7XG4gICAgICAgIHRoaXMuYnMuZm9yRWFjaChmdW5jdGlvbiAoYiwgaSkgeyByZXR1cm4gYi5wb3NuID0gcHNbaV07IH0pO1xuICAgIH07XG4gICAgU29sdmVyLnByb3RvdHlwZS5zZXREZXNpcmVkUG9zaXRpb25zID0gZnVuY3Rpb24gKHBzKSB7XG4gICAgICAgIHRoaXMudnMuZm9yRWFjaChmdW5jdGlvbiAodiwgaSkgeyByZXR1cm4gdi5kZXNpcmVkUG9zaXRpb24gPSBwc1tpXTsgfSk7XG4gICAgfTtcbiAgICBTb2x2ZXIucHJvdG90eXBlLm1vc3RWaW9sYXRlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG1pblNsYWNrID0gTnVtYmVyLk1BWF9WQUxVRSwgdiA9IG51bGwsIGwgPSB0aGlzLmluYWN0aXZlLCBuID0gbC5sZW5ndGgsIGRlbGV0ZVBvaW50ID0gbjtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgIHZhciBjID0gbFtpXTtcbiAgICAgICAgICAgIGlmIChjLnVuc2F0aXNmaWFibGUpXG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB2YXIgc2xhY2sgPSBjLnNsYWNrKCk7XG4gICAgICAgICAgICBpZiAoYy5lcXVhbGl0eSB8fCBzbGFjayA8IG1pblNsYWNrKSB7XG4gICAgICAgICAgICAgICAgbWluU2xhY2sgPSBzbGFjaztcbiAgICAgICAgICAgICAgICB2ID0gYztcbiAgICAgICAgICAgICAgICBkZWxldGVQb2ludCA9IGk7XG4gICAgICAgICAgICAgICAgaWYgKGMuZXF1YWxpdHkpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChkZWxldGVQb2ludCAhPT0gbiAmJlxuICAgICAgICAgICAgKG1pblNsYWNrIDwgU29sdmVyLlpFUk9fVVBQRVJCT1VORCAmJiAhdi5hY3RpdmUgfHwgdi5lcXVhbGl0eSkpIHtcbiAgICAgICAgICAgIGxbZGVsZXRlUG9pbnRdID0gbFtuIC0gMV07XG4gICAgICAgICAgICBsLmxlbmd0aCA9IG4gLSAxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB2O1xuICAgIH07XG4gICAgU29sdmVyLnByb3RvdHlwZS5zYXRpc2Z5ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5icyA9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLmJzID0gbmV3IEJsb2Nrcyh0aGlzLnZzKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmJzLnNwbGl0KHRoaXMuaW5hY3RpdmUpO1xuICAgICAgICB2YXIgdiA9IG51bGw7XG4gICAgICAgIHdoaWxlICgodiA9IHRoaXMubW9zdFZpb2xhdGVkKCkpICYmICh2LmVxdWFsaXR5IHx8IHYuc2xhY2soKSA8IFNvbHZlci5aRVJPX1VQUEVSQk9VTkQgJiYgIXYuYWN0aXZlKSkge1xuICAgICAgICAgICAgdmFyIGxiID0gdi5sZWZ0LmJsb2NrLCByYiA9IHYucmlnaHQuYmxvY2s7XG4gICAgICAgICAgICBpZiAobGIgIT09IHJiKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5icy5tZXJnZSh2KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChsYi5pc0FjdGl2ZURpcmVjdGVkUGF0aEJldHdlZW4odi5yaWdodCwgdi5sZWZ0KSkge1xuICAgICAgICAgICAgICAgICAgICB2LnVuc2F0aXNmaWFibGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHNwbGl0ID0gbGIuc3BsaXRCZXR3ZWVuKHYubGVmdCwgdi5yaWdodCk7XG4gICAgICAgICAgICAgICAgaWYgKHNwbGl0ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYnMuaW5zZXJ0KHNwbGl0LmxiKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5icy5pbnNlcnQoc3BsaXQucmIpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmJzLnJlbW92ZShsYik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW5hY3RpdmUucHVzaChzcGxpdC5jb25zdHJhaW50KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHYudW5zYXRpc2ZpYWJsZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodi5zbGFjaygpID49IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbmFjdGl2ZS5wdXNoKHYpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5icy5tZXJnZSh2KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFNvbHZlci5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuc2F0aXNmeSgpO1xuICAgICAgICB2YXIgbGFzdGNvc3QgPSBOdW1iZXIuTUFYX1ZBTFVFLCBjb3N0ID0gdGhpcy5icy5jb3N0KCk7XG4gICAgICAgIHdoaWxlIChNYXRoLmFicyhsYXN0Y29zdCAtIGNvc3QpID4gMC4wMDAxKSB7XG4gICAgICAgICAgICB0aGlzLnNhdGlzZnkoKTtcbiAgICAgICAgICAgIGxhc3Rjb3N0ID0gY29zdDtcbiAgICAgICAgICAgIGNvc3QgPSB0aGlzLmJzLmNvc3QoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY29zdDtcbiAgICB9O1xuICAgIFNvbHZlci5MQUdSQU5HSUFOX1RPTEVSQU5DRSA9IC0xZS00O1xuICAgIFNvbHZlci5aRVJPX1VQUEVSQk9VTkQgPSAtMWUtMTA7XG4gICAgcmV0dXJuIFNvbHZlcjtcbn0oKSk7XG5leHBvcnRzLlNvbHZlciA9IFNvbHZlcjtcbmZ1bmN0aW9uIHJlbW92ZU92ZXJsYXBJbk9uZURpbWVuc2lvbihzcGFucywgbG93ZXJCb3VuZCwgdXBwZXJCb3VuZCkge1xuICAgIHZhciB2cyA9IHNwYW5zLm1hcChmdW5jdGlvbiAocykgeyByZXR1cm4gbmV3IFZhcmlhYmxlKHMuZGVzaXJlZENlbnRlcik7IH0pO1xuICAgIHZhciBjcyA9IFtdO1xuICAgIHZhciBuID0gc3BhbnMubGVuZ3RoO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbiAtIDE7IGkrKykge1xuICAgICAgICB2YXIgbGVmdCA9IHNwYW5zW2ldLCByaWdodCA9IHNwYW5zW2kgKyAxXTtcbiAgICAgICAgY3MucHVzaChuZXcgQ29uc3RyYWludCh2c1tpXSwgdnNbaSArIDFdLCAobGVmdC5zaXplICsgcmlnaHQuc2l6ZSkgLyAyKSk7XG4gICAgfVxuICAgIHZhciBsZWZ0TW9zdCA9IHZzWzBdLCByaWdodE1vc3QgPSB2c1tuIC0gMV0sIGxlZnRNb3N0U2l6ZSA9IHNwYW5zWzBdLnNpemUgLyAyLCByaWdodE1vc3RTaXplID0gc3BhbnNbbiAtIDFdLnNpemUgLyAyO1xuICAgIHZhciB2TG93ZXIgPSBudWxsLCB2VXBwZXIgPSBudWxsO1xuICAgIGlmIChsb3dlckJvdW5kKSB7XG4gICAgICAgIHZMb3dlciA9IG5ldyBWYXJpYWJsZShsb3dlckJvdW5kLCBsZWZ0TW9zdC53ZWlnaHQgKiAxMDAwKTtcbiAgICAgICAgdnMucHVzaCh2TG93ZXIpO1xuICAgICAgICBjcy5wdXNoKG5ldyBDb25zdHJhaW50KHZMb3dlciwgbGVmdE1vc3QsIGxlZnRNb3N0U2l6ZSkpO1xuICAgIH1cbiAgICBpZiAodXBwZXJCb3VuZCkge1xuICAgICAgICB2VXBwZXIgPSBuZXcgVmFyaWFibGUodXBwZXJCb3VuZCwgcmlnaHRNb3N0LndlaWdodCAqIDEwMDApO1xuICAgICAgICB2cy5wdXNoKHZVcHBlcik7XG4gICAgICAgIGNzLnB1c2gobmV3IENvbnN0cmFpbnQocmlnaHRNb3N0LCB2VXBwZXIsIHJpZ2h0TW9zdFNpemUpKTtcbiAgICB9XG4gICAgdmFyIHNvbHZlciA9IG5ldyBTb2x2ZXIodnMsIGNzKTtcbiAgICBzb2x2ZXIuc29sdmUoKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBuZXdDZW50ZXJzOiB2cy5zbGljZSgwLCBzcGFucy5sZW5ndGgpLm1hcChmdW5jdGlvbiAodikgeyByZXR1cm4gdi5wb3NpdGlvbigpOyB9KSxcbiAgICAgICAgbG93ZXJCb3VuZDogdkxvd2VyID8gdkxvd2VyLnBvc2l0aW9uKCkgOiBsZWZ0TW9zdC5wb3NpdGlvbigpIC0gbGVmdE1vc3RTaXplLFxuICAgICAgICB1cHBlckJvdW5kOiB2VXBwZXIgPyB2VXBwZXIucG9zaXRpb24oKSA6IHJpZ2h0TW9zdC5wb3NpdGlvbigpICsgcmlnaHRNb3N0U2l6ZVxuICAgIH07XG59XG5leHBvcnRzLnJlbW92ZU92ZXJsYXBJbk9uZURpbWVuc2lvbiA9IHJlbW92ZU92ZXJsYXBJbk9uZURpbWVuc2lvbjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSm1hV3hsSWpvaWRuQnpZeTVxY3lJc0luTnZkWEpqWlZKdmIzUWlPaUlpTENKemIzVnlZMlZ6SWpwYklpNHVMeTR1TDFkbFlrTnZiR0V2YzNKakwzWndjMk11ZEhNaVhTd2libUZ0WlhNaU9sdGRMQ0p0WVhCd2FXNW5jeUk2SWpzN1FVRkJTVHRKUVV0SkxIVkNRVUZ0UWl4TFFVRmhPMUZCUVdJc1ZVRkJTeXhIUVVGTUxFdEJRVXNzUTBGQlVUdFJRVXBvUXl4UFFVRkZMRWRCUVZjc1EwRkJReXhEUVVGRE8xRkJRMllzVDBGQlJTeEhRVUZYTEVOQlFVTXNRMEZCUXp0UlFVTm1MRTlCUVVVc1IwRkJWeXhEUVVGRExFTkJRVU03U1VGRmIwSXNRMEZCUXp0SlFVVndReXh0UTBGQlZ5eEhRVUZZTEZWQlFWa3NRMEZCVnp0UlFVTnVRaXhKUVVGSkxFVkJRVVVzUjBGQlJ5eEpRVUZKTEVOQlFVTXNTMEZCU3l4SFFVRkhMRU5CUVVNc1EwRkJReXhMUVVGTExFTkJRVU03VVVGRE9VSXNTVUZCU1N4RlFVRkZMRWRCUVVjc1EwRkJReXhEUVVGRExFMUJRVTBzUjBGQlJ5eERRVUZETEVOQlFVTXNTMEZCU3l4RFFVRkRPMUZCUXpWQ0xFbEJRVWtzUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNN1VVRkRiRUlzU1VGQlNTeERRVUZETEVWQlFVVXNTVUZCU1N4RlFVRkZMRWRCUVVjc1JVRkJSU3hIUVVGSExFVkJRVVVzUTBGQlF6dFJRVU40UWl4SlFVRkpMRU5CUVVNc1JVRkJSU3hKUVVGSkxFVkJRVVVzUjBGQlJ5eEZRVUZGTEVkQlFVY3NRMEZCUXl4RFFVRkRMR1ZCUVdVc1EwRkJRenRSUVVOMlF5eEpRVUZKTEVOQlFVTXNSVUZCUlN4SlFVRkpMRVZCUVVVc1IwRkJSeXhGUVVGRkxFZEJRVWNzUlVGQlJTeERRVUZETzBsQlF6VkNMRU5CUVVNN1NVRkZSQ3dyUWtGQlR5eEhRVUZRTzFGQlEwa3NUMEZCVHl4RFFVRkRMRWxCUVVrc1EwRkJReXhGUVVGRkxFZEJRVWNzU1VGQlNTeERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhGUVVGRkxFTkJRVU03U1VGRGVrTXNRMEZCUXp0SlFVTk1MRzlDUVVGRE8wRkJRVVFzUTBGQlF5eEJRVzVDUkN4SlFXMUNRenRCUVc1Q1dTeHpRMEZCWVR0QlFYRkNNVUk3U1VGTFNTeHZRa0ZCYlVJc1NVRkJZeXhGUVVGVExFdEJRV1VzUlVGQlV5eEhRVUZYTEVWQlFWTXNVVUZCZVVJN1VVRkJla0lzZVVKQlFVRXNSVUZCUVN4blFrRkJlVUk3VVVGQk5VWXNVMEZCU1N4SFFVRktMRWxCUVVrc1EwRkJWVHRSUVVGVExGVkJRVXNzUjBGQlRDeExRVUZMTEVOQlFWVTdVVUZCVXl4UlFVRkhMRWRCUVVnc1IwRkJSeXhEUVVGUk8xRkJRVk1zWVVGQlVTeEhRVUZTTEZGQlFWRXNRMEZCYVVJN1VVRklMMGNzVjBGQlRTeEhRVUZaTEV0QlFVc3NRMEZCUXp0UlFVTjRRaXhyUWtGQllTeEhRVUZaTEV0QlFVc3NRMEZCUXp0UlFVY3pRaXhKUVVGSkxFTkJRVU1zU1VGQlNTeEhRVUZITEVsQlFVa3NRMEZCUXp0UlFVTnFRaXhKUVVGSkxFTkJRVU1zUzBGQlN5eEhRVUZITEV0QlFVc3NRMEZCUXp0UlFVTnVRaXhKUVVGSkxFTkJRVU1zUjBGQlJ5eEhRVUZITEVkQlFVY3NRMEZCUXp0UlFVTm1MRWxCUVVrc1EwRkJReXhSUVVGUkxFZEJRVWNzVVVGQlVTeERRVUZETzBsQlF6ZENMRU5CUVVNN1NVRkZSQ3d3UWtGQlN5eEhRVUZNTzFGQlEwa3NUMEZCVHl4SlFVRkpMRU5CUVVNc1lVRkJZU3hEUVVGRExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNVMEZCVXp0WlFVTjRReXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4TFFVRkxMRWRCUVVjc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eFJRVUZSTEVWQlFVVXNSMEZCUnl4SlFVRkpMRU5CUVVNc1IwRkJSenRyUWtGRGJrUXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhMUVVGTExFZEJRVWNzU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4UlFVRlJMRVZCUVVVc1EwRkJRenRKUVVOcVJDeERRVUZETzBsQlEwd3NhVUpCUVVNN1FVRkJSQ3hEUVVGRExFRkJha0pFTEVsQmFVSkRPMEZCYWtKWkxHZERRVUZWTzBGQmJVSjJRanRKUVUxSkxHdENRVUZ0UWl4bFFVRjFRaXhGUVVGVExFMUJRV3RDTEVWQlFWTXNTMEZCYVVJN1VVRkJOVU1zZFVKQlFVRXNSVUZCUVN4VlFVRnJRanRSUVVGVExITkNRVUZCTEVWQlFVRXNVMEZCYVVJN1VVRkJOVVVzYjBKQlFXVXNSMEZCWml4bFFVRmxMRU5CUVZFN1VVRkJVeXhYUVVGTkxFZEJRVTRzVFVGQlRTeERRVUZaTzFGQlFWTXNWVUZCU3l4SFFVRk1MRXRCUVVzc1EwRkJXVHRSUVV3dlJpeFhRVUZOTEVkQlFWY3NRMEZCUXl4RFFVRkRPMGxCU3l0RkxFTkJRVU03U1VGRmJrY3NkVUpCUVVrc1IwRkJTanRSUVVOSkxFOUJRVThzUjBGQlJ5eEhRVUZITEVsQlFVa3NRMEZCUXl4TlFVRk5MRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zVVVGQlVTeEZRVUZGTEVkQlFVY3NTVUZCU1N4RFFVRkRMR1ZCUVdVc1EwRkJReXhEUVVGRE8wbEJRM2hGTEVOQlFVTTdTVUZGUkN3eVFrRkJVU3hIUVVGU08xRkJRMGtzVDBGQlR5eERRVUZETEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1JVRkJSU3hEUVVGRExFdEJRVXNzUjBGQlJ5eEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRWxCUVVrc1IwRkJSeXhKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJRenRKUVVNNVJTeERRVUZETzBsQlIwUXNhME5CUVdVc1IwRkJaaXhWUVVGblFpeEpRVUZqTEVWQlFVVXNRMEZCTUVNN1VVRkRkRVVzU1VGQlNTeEZRVUZGTEVkQlFVY3NWVUZCUXl4RFFVRkRMRVZCUVVVc1NVRkJTU3hKUVVGTExFOUJRVUVzUTBGQlF5eERRVUZETEUxQlFVMHNTVUZCU1N4SlFVRkpMRXRCUVVzc1NVRkJTU3hKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNTVUZCU1N4RFFVRkRMRVZCUVhaRExFTkJRWFZETEVOQlFVTTdVVUZET1VRc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eFBRVUZQTEVOQlFVTXNWVUZCUVN4RFFVRkRMRWxCUVVjc1QwRkJRU3hGUVVGRkxFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4TFFVRkxMRU5CUVVNc1JVRkJaQ3hEUVVGakxFTkJRVU1zUTBGQlF6dFJRVU4wUXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFOUJRVThzUTBGQlF5eFZRVUZCTEVOQlFVTXNTVUZCUnl4UFFVRkJMRVZCUVVVc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4RlFVRmlMRU5CUVdFc1EwRkJReXhEUVVGRE8wbEJRM2hETEVOQlFVTTdTVUZEVEN4bFFVRkRPMEZCUVVRc1EwRkJReXhCUVhSQ1JDeEpRWE5DUXp0QlFYUkNXU3cwUWtGQlVUdEJRWGRDY2tJN1NVRk5TU3hsUVVGWkxFTkJRVmM3VVVGTWRrSXNVMEZCU1N4SFFVRmxMRVZCUVVVc1EwRkJRenRSUVUxc1FpeERRVUZETEVOQlFVTXNUVUZCVFN4SFFVRkhMRU5CUVVNc1EwRkJRenRSUVVOaUxFbEJRVWtzUTBGQlF5eEZRVUZGTEVkQlFVY3NTVUZCU1N4aFFVRmhMRU5CUVVNc1EwRkJReXhEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETzFGQlEzSkRMRWxCUVVrc1EwRkJReXhYUVVGWExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdTVUZEZUVJc1EwRkJRenRKUVVWUExESkNRVUZYTEVkQlFXNUNMRlZCUVc5Q0xFTkJRVmM3VVVGRE0wSXNRMEZCUXl4RFFVRkRMRXRCUVVzc1IwRkJSeXhKUVVGSkxFTkJRVU03VVVGRFppeEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU5zUWl4SlFVRkpMRU5CUVVNc1JVRkJSU3hEUVVGRExGZEJRVmNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTjJRaXhKUVVGSkxFTkJRVU1zU1VGQlNTeEhRVUZITEVsQlFVa3NRMEZCUXl4RlFVRkZMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU03U1VGRGJFTXNRMEZCUXp0SlFVZEVMSE5EUVVGelFpeEhRVUYwUWp0UlFVTkpMRWxCUVVrc1EwRkJReXhGUVVGRkxFTkJRVU1zUlVGQlJTeEhRVUZITEVsQlFVa3NRMEZCUXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hIUVVGSExFbEJRVWtzUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4SFFVRkhMRU5CUVVNc1EwRkJRenRSUVVONlF5eExRVUZMTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4TlFVRk5MRVZCUVVVc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeEZRVUZGTEVOQlFVTTdXVUZETlVNc1NVRkJTU3hEUVVGRExFVkJRVVVzUTBGQlF5eFhRVUZYTEVOQlFVTXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlEzUkRMRWxCUVVrc1EwRkJReXhKUVVGSkxFZEJRVWNzU1VGQlNTeERRVUZETEVWQlFVVXNRMEZCUXl4UFFVRlBMRVZCUVVVc1EwRkJRenRKUVVOc1F5eERRVUZETzBsQlJVOHNNRUpCUVZVc1IwRkJiRUlzVlVGQmJVSXNRMEZCVnl4RlFVRkZMRU5CUVZjc1JVRkJSU3hWUVVGcFF6dFJRVUU1UlN4cFFrRmpRenRSUVdKSExFbEJRVWtzU1VGQlNTeEhRVUZITEVOQlFVTXNRMEZCUXl4SlFVRkpMRVZCUVVVc1EwRkJRenRSUVVOd1FpeERRVUZETEVOQlFVTXNaVUZCWlN4RFFVRkRMRU5CUVVNc1JVRkJSU3hWUVVGRExFTkJRVU1zUlVGQlJTeEpRVUZKTzFsQlEzcENMRWxCUVVrc1MwRkJTeXhIUVVGSExFdEJRVWtzUTBGQlF5eFZRVUZWTEVOQlFVTXNTVUZCU1N4RlFVRkZMRU5CUVVNc1JVRkJSU3hWUVVGVkxFTkJRVU1zUTBGQlF6dFpRVU5xUkN4SlFVRkpMRWxCUVVrc1MwRkJTeXhEUVVGRExFTkJRVU1zUzBGQlN5eEZRVUZGTzJkQ1FVTnNRaXhKUVVGSkxFbEJRVWtzUzBGQlN5eEhRVUZITEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRE8yZENRVU0zUWl4RFFVRkRMRU5CUVVNc1JVRkJSU3hIUVVGSExFdEJRVXNzUTBGQlF6dGhRVU5vUWp0cFFrRkJUVHRuUWtGRFNDeEpRVUZKTEVsQlFVa3NTMEZCU3l4SFFVRkhMRU5CUVVNc1EwRkJReXhMUVVGTExFTkJRVU1zUzBGQlN5eERRVUZETzJkQ1FVTTVRaXhEUVVGRExFTkJRVU1zUlVGQlJTeEhRVUZITEVOQlFVTXNTMEZCU3l4RFFVRkRPMkZCUTJwQ08xbEJRMFFzVlVGQlZTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTJ4Q0xFTkJRVU1zUTBGQlF5eERRVUZETzFGQlEwZ3NUMEZCVHl4SlFVRkpMRWRCUVVjc1EwRkJReXhEUVVGRExFdEJRVXNzUTBGQlF6dEpRVU14UWl4RFFVRkRPMGxCUlU4c2EwTkJRV3RDTEVkQlFURkNMRlZCUVRKQ0xFTkJRVmNzUlVGQlJTeEpRVUZqTzFGQlFYUkVMR2xDUVUxRE8xRkJURWNzUTBGQlF5eERRVUZETEdWQlFXVXNRMEZCUXl4SlFVRkpMRVZCUVVVc1ZVRkJReXhEUVVGRExFVkJRVVVzU1VGQlNUdFpRVU0xUWl4SlFVRkpMRU5CUVVNc1RVRkJUU3hIUVVGSExFTkJRVU1zUTBGQlF5eE5RVUZOTEVkQlFVY3NRMEZCUXl4SlFVRkpMRXRCUVVzc1EwRkJReXhEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1dVRkROMFFzUzBGQlNTeERRVUZETEZkQlFWY3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRenRaUVVOMlFpeExRVUZKTEVOQlFVTXNhMEpCUVd0Q0xFTkJRVU1zU1VGQlNTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTNKRExFTkJRVU1zUTBGQlF5eERRVUZETzBsQlExQXNRMEZCUXp0SlFVZEVMSGRDUVVGUkxFZEJRVklzVlVGQlV5eExRVUUyUWl4RlFVRkZMRWRCUVZVc1JVRkJSU3hEUVVFd1FpeEZRVUZGTEVsQlFXMUNPMUZCUVc1SExHbENRVXRETzFGQlRHMUVMR3RDUVVGQkxFVkJRVUVzU1VGQll5eEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVGRkxIRkNRVUZCTEVWQlFVRXNWMEZCYlVJN1VVRkRMMFlzUTBGQlF5eERRVUZETEdWQlFXVXNRMEZCUXl4SlFVRkpMRVZCUVVVc1ZVRkJReXhEUVVGRExFVkJRVVVzU1VGQlNUdFpRVU0xUWl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUTI1Q0xFdEJRVWtzUTBGQlF5eFJRVUZSTEVOQlFVTXNTMEZCU3l4RlFVRkZMRWRCUVVjc1JVRkJSU3hKUVVGSkxFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEZGtNc1EwRkJReXhEUVVGRExFTkJRVU03U1VGRFVDeERRVUZETzBsQlMwUXNlVUpCUVZNc1IwRkJWRHRSUVVOSkxFbEJRVWtzUTBGQlF5eEhRVUZsTEVsQlFVa3NRMEZCUXp0UlFVTjZRaXhKUVVGSkxFTkJRVU1zVlVGQlZTeERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzU1VGQlNTeEZRVUZGTEZWQlFVRXNRMEZCUXp0WlFVTnFReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEZGQlFWRXNTVUZCU1N4RFFVRkRMRU5CUVVNc1MwRkJTeXhKUVVGSkxFbEJRVWtzUTBGQlF5eERRVUZETEVWQlFVVXNSMEZCUnl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRE8yZENRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1VVRkRNVVFzUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEU0N4UFFVRlBMRU5CUVVNc1EwRkJRenRKUVVOaUxFTkJRVU03U1VGRlR5eG5RMEZCWjBJc1IwRkJlRUlzVlVGQmVVSXNSVUZCV1N4RlFVRkZMRVZCUVZrN1VVRkRMME1zU1VGQlNTeERRVUZETEZWQlFWVXNRMEZCUXl4RlFVRkZMRVZCUVVVc1NVRkJTU3hGUVVGRkxHTkJRVThzUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEY0VNc1NVRkJTU3hEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETzFGQlEySXNTVUZCU1N4RFFVRkRMRkZCUVZFc1EwRkJReXhGUVVGRkxFVkJRVVVzU1VGQlNTeEZRVUZGTEVWQlFVVXNSVUZCUlN4VlFVRkRMRU5CUVVNc1JVRkJSU3hKUVVGSk8xbEJRMmhETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1VVRkJVU3hKUVVGSkxFTkJRVU1zUTBGQlF5eExRVUZMTEV0QlFVc3NTVUZCU1N4SlFVRkpMRU5CUVVNc1EwRkJReXhMUVVGTExFbEJRVWtzU1VGQlNTeERRVUZETEVOQlFVTXNSVUZCUlN4SFFVRkhMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU03WjBKQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenRSUVVNNVJTeERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTklMRTlCUVU4c1EwRkJReXhEUVVGRE8wbEJRMklzUTBGQlF6dEpRVVZQTEhkQ1FVRlJMRWRCUVdoQ0xGVkJRV2xDTEVOQlFWY3NSVUZCUlN4SlFVRmpMRVZCUVVVc1JVRkJXU3hGUVVGRkxFdEJRVEpETzFGQlFYWkhMR2xDUVZWRE8xRkJWRWNzU1VGQlNTeFJRVUZSTEVkQlFVY3NTMEZCU3l4RFFVRkRPMUZCUTNKQ0xFTkJRVU1zUTBGQlF5eGxRVUZsTEVOQlFVTXNTVUZCU1N4RlFVRkZMRlZCUVVNc1EwRkJReXhGUVVGRkxFbEJRVWs3V1VGRE5VSXNTVUZCU1N4RFFVRkRMRkZCUVZFc1NVRkJTU3hEUVVGRExFbEJRVWtzUzBGQlN5eEZRVUZGTEVsQlFVa3NTMEZCU1N4RFFVRkRMRkZCUVZFc1EwRkJReXhKUVVGSkxFVkJRVVVzUTBGQlF5eEZRVUZGTEVWQlFVVXNSVUZCUlN4TFFVRkxMRU5CUVVNc1EwRkJReXhGUVVOdVJUdG5Ra0ZEU1N4UlFVRlJMRWRCUVVjc1NVRkJTU3hEUVVGRE8yZENRVU5vUWl4TFFVRkxMRU5CUVVNc1EwRkJReXhGUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZETzJGQlEyeENPMUZCUTB3c1EwRkJReXhEUVVGRExFTkJRVU03VVVGRFNDeFBRVUZQTEZGQlFWRXNRMEZCUXp0SlFVTndRaXhEUVVGRE8wbEJTVVFzTWtOQlFUSkNMRWRCUVROQ0xGVkJRVFJDTEVOQlFWY3NSVUZCUlN4RFFVRlhPMUZCUTJoRUxFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTTdXVUZCUlN4UFFVRlBMRWxCUVVrc1EwRkJRenRSUVVONlFpeEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF6dFJRVU4wUWl4UFFVRk5MRU5CUVVNc1JVRkJSU3hGUVVGRk8xbEJRMUFzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU5zUWl4SlFVRkpMRU5CUVVNc1EwRkJReXhOUVVGTkxFbEJRVWtzU1VGQlNTeERRVUZETERKQ1FVRXlRaXhEUVVGRExFTkJRVU1zUTBGQlF5eExRVUZMTEVWQlFVVXNRMEZCUXl4RFFVRkRPMmRDUVVONFJDeFBRVUZQTEVsQlFVa3NRMEZCUXp0VFFVTnVRanRSUVVORUxFOUJRVThzUzBGQlN5eERRVUZETzBsQlEycENMRU5CUVVNN1NVRkhUU3hYUVVGTExFZEJRVm9zVlVGQllTeERRVUZoTzFGQlMzUkNMRU5CUVVNc1EwRkJReXhOUVVGTkxFZEJRVWNzUzBGQlN5eERRVUZETzFGQlEycENMRTlCUVU4c1EwRkJReXhMUVVGTExFTkJRVU1zWjBKQlFXZENMRU5CUVVNc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eEZRVUZGTEV0QlFVc3NRMEZCUXl4blFrRkJaMElzUTBGQlF5eERRVUZETEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVNM1JTeERRVUZETzBsQlJXTXNjMEpCUVdkQ0xFZEJRUzlDTEZWQlFXZERMRkZCUVd0Q08xRkJRemxETEVsQlFVa3NRMEZCUXl4SFFVRkhMRWxCUVVrc1MwRkJTeXhEUVVGRExGRkJRVkVzUTBGQlF5eERRVUZETzFGQlF6VkNMRU5CUVVNc1EwRkJReXhyUWtGQmEwSXNRMEZCUXl4UlFVRlJMRVZCUVVVc1NVRkJTU3hEUVVGRExFTkJRVU03VVVGRGNrTXNUMEZCVHl4RFFVRkRMRU5CUVVNN1NVRkRZaXhEUVVGRE8wbEJSMFFzTkVKQlFWa3NSMEZCV2l4VlFVRmhMRVZCUVZrc1JVRkJSU3hGUVVGWk8xRkJTMjVETEVsQlFVa3NRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhuUWtGQlowSXNRMEZCUXl4RlFVRkZMRVZCUVVVc1JVRkJSU3hEUVVGRExFTkJRVU03VVVGRGRFTXNTVUZCU1N4RFFVRkRMRXRCUVVzc1NVRkJTU3hGUVVGRk8xbEJRMW9zU1VGQlNTeEZRVUZGTEVkQlFVY3NTMEZCU3l4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU40UWl4UFFVRlBMRVZCUVVVc1ZVRkJWU3hGUVVGRkxFTkJRVU1zUlVGQlJTeEZRVUZGTEVWQlFVVXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFVkJRVVVzUlVGQlJTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJRenRUUVVOc1JEdFJRVVZFTEU5QlFVOHNTVUZCU1N4RFFVRkRPMGxCUTJoQ0xFTkJRVU03U1VGRlJDd3lRa0ZCVnl4SFFVRllMRlZCUVZrc1EwRkJVU3hGUVVGRkxFTkJRV0VzUlVGQlJTeEpRVUZaTzFGQlF6ZERMRU5CUVVNc1EwRkJReXhOUVVGTkxFZEJRVWNzU1VGQlNTeERRVUZETzFGQlEyaENMRXRCUVVzc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFMUJRVTBzUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRVZCUVVVc1EwRkJReXhGUVVGRk8xbEJRek5ETEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEYkVJc1EwRkJReXhEUVVGRExFMUJRVTBzU1VGQlNTeEpRVUZKTEVOQlFVTTdXVUZEYWtJc1NVRkJTU3hEUVVGRExGZEJRVmNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0VFFVTjJRanRSUVVORUxFbEJRVWtzUTBGQlF5eEpRVUZKTEVkQlFVY3NTVUZCU1N4RFFVRkRMRVZCUVVVc1EwRkJReXhQUVVGUExFVkJRVVVzUTBGQlF6dEpRVU5zUXl4RFFVRkRPMGxCUlVRc2IwSkJRVWtzUjBGQlNqdFJRVU5KTEVsQlFVa3NSMEZCUnl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNN1VVRkRiRU1zVDBGQlR5eERRVUZETEVWQlFVVXNSVUZCUlR0WlFVTlNMRWxCUVVrc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUTJoQ0xFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNVVUZCVVN4RlFVRkZMRWRCUVVjc1EwRkJReXhEUVVGRExHVkJRV1VzUTBGQlF6dFpRVU42UXl4SFFVRkhMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRPMU5CUXpOQ08xRkJRMFFzVDBGQlR5eEhRVUZITEVOQlFVTTdTVUZEWml4RFFVRkRPMGxCVTB3c1dVRkJRenRCUVVGRUxFTkJRVU1zUVVGc1MwUXNTVUZyUzBNN1FVRnNTMWtzYzBKQlFVczdRVUZ2UzJ4Q08wbEJSMGtzWjBKQlFXMUNMRVZCUVdNN1VVRkJaQ3hQUVVGRkxFZEJRVVlzUlVGQlJTeERRVUZaTzFGQlF6ZENMRWxCUVVrc1EwRkJReXhIUVVGSExFVkJRVVVzUTBGQlF5eE5RVUZOTEVOQlFVTTdVVUZEYkVJc1NVRkJTU3hEUVVGRExFbEJRVWtzUjBGQlJ5eEpRVUZKTEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVONlFpeFBRVUZQTEVOQlFVTXNSVUZCUlN4RlFVRkZPMWxCUTFJc1NVRkJTU3hEUVVGRExFZEJRVWNzU1VGQlNTeExRVUZMTEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRGVrSXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTTdXVUZEYWtJc1EwRkJReXhEUVVGRExGRkJRVkVzUjBGQlJ5eERRVUZETEVOQlFVTTdVMEZEYkVJN1NVRkRUQ3hEUVVGRE8wbEJSVVFzY1VKQlFVa3NSMEZCU2p0UlFVTkpMRWxCUVVrc1IwRkJSeXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU03VVVGRGJFTXNUMEZCVHl4RFFVRkRMRVZCUVVVN1dVRkJSU3hIUVVGSExFbEJRVWtzU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFVkJRVVVzUTBGQlF6dFJRVU4yUXl4UFFVRlBMRWRCUVVjc1EwRkJRenRKUVVObUxFTkJRVU03U1VGRlJDeDFRa0ZCVFN4SFFVRk9MRlZCUVU4c1EwRkJVVHRSUVVsWUxFTkJRVU1zUTBGQlF5eFJRVUZSTEVkQlFVY3NTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU03VVVGRE9VSXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdTVUZMZEVJc1EwRkJRenRKUVVWRUxIVkNRVUZOTEVkQlFVNHNWVUZCVHl4RFFVRlJPMUZCUzFnc1NVRkJTU3hKUVVGSkxFZEJRVWNzU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4TlFVRk5MRWRCUVVjc1EwRkJReXhEUVVGRE8xRkJRMmhETEVsQlFVa3NVMEZCVXl4SFFVRkhMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdVVUZEYUVNc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eE5RVUZOTEVkQlFVY3NTVUZCU1N4RFFVRkRPMUZCUTNoQ0xFbEJRVWtzUTBGQlF5eExRVUZMTEZOQlFWTXNSVUZCUlR0WlFVTnFRaXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4UlFVRlJMRU5CUVVNc1IwRkJSeXhUUVVGVExFTkJRVU03V1VGRGJFTXNVMEZCVXl4RFFVRkRMRkZCUVZFc1IwRkJSeXhEUVVGRExFTkJRVU1zVVVGQlVTeERRVUZETzFOQlNXNURPMGxCUTB3c1EwRkJRenRKUVVsRUxITkNRVUZMTEVkQlFVd3NWVUZCVFN4RFFVRmhPMUZCUTJZc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4TFFVRkxMRVZCUVVVc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eExRVUZMTEVOQlFVTXNTMEZCU3l4RFFVRkRPMUZCU1hoRExFbEJRVWtzU1VGQlNTeEhRVUZITEVOQlFVTXNRMEZCUXl4TFFVRkxMRU5CUVVNc1RVRkJUU3hIUVVGSExFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNUVUZCVFN4SFFVRkhMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU03VVVGRGJFUXNTVUZCU1N4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFMUJRVTBzUjBGQlJ5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRTFCUVUwc1JVRkJSVHRaUVVNdlFpeERRVUZETEVOQlFVTXNWMEZCVnl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFVkJRVVVzU1VGQlNTeERRVUZETEVOQlFVTTdXVUZETVVJc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0VFFVTnNRanRoUVVGTk8xbEJRMGdzUTBGQlF5eERRVUZETEZkQlFWY3NRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdXVUZETTBJc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0VFFVTnNRanRKUVV0TUxFTkJRVU03U1VGRlJDeDNRa0ZCVHl4SFFVRlFMRlZCUVZFc1EwRkJaME03VVVGRGNFTXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhQUVVGUExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdTVUZEZWtJc1EwRkJRenRKUVVkRUxIRkRRVUZ2UWl4SFFVRndRanRSUVVOSkxFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNUMEZCVHl4RFFVRkRMRlZCUVVFc1EwRkJReXhKUVVGSExFOUJRVUVzUTBGQlF5eERRVUZETEhOQ1FVRnpRaXhGUVVGRkxFVkJRVEZDTEVOQlFUQkNMRU5CUVVNc1EwRkJRenRKUVVOMFJDeERRVUZETzBsQlIwUXNjMEpCUVVzc1IwRkJUQ3hWUVVGTkxGRkJRWE5DTzFGQlFUVkNMR2xDUVdWRE8xRkJaRWNzU1VGQlNTeERRVUZETEc5Q1FVRnZRaXhGUVVGRkxFTkJRVU03VVVGRE5VSXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhQUVVGUExFTkJRVU1zVlVGQlFTeERRVUZETzFsQlEyWXNTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExGTkJRVk1zUlVGQlJTeERRVUZETzFsQlEzUkNMRWxCUVVrc1EwRkJReXhMUVVGTExFbEJRVWtzU1VGQlNTeERRVUZETEVOQlFVTXNSVUZCUlN4SFFVRkhMRTFCUVUwc1EwRkJReXh2UWtGQmIwSXNSVUZCUlR0blFrRkRiRVFzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRE8yZENRVU5xUWl4TFFVRkxMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRkJMRVZCUVVVc1NVRkJSU3hQUVVGQkxFdEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNSVUZCUlN4RFFVRkRMRVZCUVdZc1EwRkJaU3hEUVVGRExFTkJRVU03WjBKQlF6VkRMRXRCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdaMEpCUTJZc1VVRkJVU3hEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0aFFVdHdRanRSUVVOTUxFTkJRVU1zUTBGQlF5eERRVUZETzBsQlExQXNRMEZCUXp0SlFXOUNUQ3hoUVVGRE8wRkJRVVFzUTBGQlF5eEJRV3hJUkN4SlFXdElRenRCUVd4SVdTeDNRa0ZCVFR0QlFXOUlia0k3U1VGUFNTeG5Ra0ZCYlVJc1JVRkJZeXhGUVVGVExFVkJRV2RDTzFGQlFYWkRMRTlCUVVVc1IwRkJSaXhGUVVGRkxFTkJRVms3VVVGQlV5eFBRVUZGTEVkQlFVWXNSVUZCUlN4RFFVRmpPMUZCUTNSRUxFbEJRVWtzUTBGQlF5eEZRVUZGTEVkQlFVY3NSVUZCUlN4RFFVRkRPMUZCUTJJc1JVRkJSU3hEUVVGRExFOUJRVThzUTBGQlF5eFZRVUZCTEVOQlFVTTdXVUZEVWl4RFFVRkRMRU5CUVVNc1IwRkJSeXhIUVVGSExFVkJRVVVzUlVGQlJTeERRVUZETEVOQlFVTXNTVUZCU1N4SFFVRkhMRVZCUVVVc1EwRkJRenRSUVVrMVFpeERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTklMRWxCUVVrc1EwRkJReXhGUVVGRkxFZEJRVWNzUlVGQlJTeERRVUZETzFGQlEySXNSVUZCUlN4RFFVRkRMRTlCUVU4c1EwRkJReXhWUVVGQkxFTkJRVU03V1VGRFVpeERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEY0VJc1EwRkJReXhEUVVGRExFdEJRVXNzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJTWGhDTEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTBnc1NVRkJTU3hEUVVGRExGRkJRVkVzUjBGQlJ5eEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRlZCUVVFc1EwRkJReXhKUVVGTExFTkJRVU1zUTBGQlF5eE5RVUZOTEVkQlFVY3NTMEZCU3l4RFFVRkRMRU5CUVVNc1QwRkJUeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTTFSQ3hKUVVGSkxFTkJRVU1zUlVGQlJTeEhRVUZITEVsQlFVa3NRMEZCUXp0SlFVTnVRaXhEUVVGRE8wbEJSVVFzY1VKQlFVa3NSMEZCU2p0UlFVTkpMRTlCUVU4c1NVRkJTU3hEUVVGRExFVkJRVVVzUTBGQlF5eEpRVUZKTEVWQlFVVXNRMEZCUXp0SlFVTXhRaXhEUVVGRE8wbEJTVVFzY1VOQlFXOUNMRWRCUVhCQ0xGVkJRWEZDTEVWQlFWazdVVUZETjBJc1NVRkJTU3hEUVVGRExGRkJRVkVzUjBGQlJ5eEpRVUZKTEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhWUVVGQkxFTkJRVU1zU1VGQlN5eERRVUZETEVOQlFVTXNUVUZCVFN4SFFVRkhMRXRCUVVzc1EwRkJReXhEUVVGRExFOUJRVThzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRha1VzU1VGQlNTeERRVUZETEVWQlFVVXNSMEZCUnl4SlFVRkpMRTFCUVUwc1EwRkJReXhKUVVGSkxFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTTdVVUZET1VJc1NVRkJTU3hEUVVGRExFVkJRVVVzUTBGQlF5eFBRVUZQTEVOQlFVTXNWVUZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhKUVVGTExFOUJRVUVzUTBGQlF5eERRVUZETEVsQlFVa3NSMEZCUnl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRV1FzUTBGQll5eERRVUZETEVOQlFVTTdTVUZET1VNc1EwRkJRenRKUVVWRUxHOURRVUZ0UWl4SFFVRnVRaXhWUVVGdlFpeEZRVUZaTzFGQlF6VkNMRWxCUVVrc1EwRkJReXhGUVVGRkxFTkJRVU1zVDBGQlR5eERRVUZETEZWQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1NVRkJTeXhQUVVGQkxFTkJRVU1zUTBGQlF5eGxRVUZsTEVkQlFVY3NSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGNlFpeERRVUY1UWl4RFFVRkRMRU5CUVVNN1NVRkRla1FzUTBGQlF6dEpRVEpDVHl3MlFrRkJXU3hIUVVGd1FqdFJRVU5KTEVsQlFVa3NVVUZCVVN4SFFVRkhMRTFCUVUwc1EwRkJReXhUUVVGVExFVkJRek5DTEVOQlFVTXNSMEZCWlN4SlFVRkpMRVZCUTNCQ0xFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNVVUZCVVN4RlFVTnFRaXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEUxQlFVMHNSVUZEV2l4WFFVRlhMRWRCUVVjc1EwRkJReXhEUVVGRE8xRkJRM0JDTEV0QlFVc3NTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNSVUZCUlN4RFFVRkRMRVZCUVVVN1dVRkRlRUlzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRMklzU1VGQlNTeERRVUZETEVOQlFVTXNZVUZCWVR0blFrRkJSU3hUUVVGVE8xbEJRemxDTEVsQlFVa3NTMEZCU3l4SFFVRkhMRU5CUVVNc1EwRkJReXhMUVVGTExFVkJRVVVzUTBGQlF6dFpRVU4wUWl4SlFVRkpMRU5CUVVNc1EwRkJReXhSUVVGUkxFbEJRVWtzUzBGQlN5eEhRVUZITEZGQlFWRXNSVUZCUlR0blFrRkRhRU1zVVVGQlVTeEhRVUZITEV0QlFVc3NRMEZCUXp0blFrRkRha0lzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0blFrRkRUaXhYUVVGWExFZEJRVWNzUTBGQlF5eERRVUZETzJkQ1FVTm9RaXhKUVVGSkxFTkJRVU1zUTBGQlF5eFJRVUZSTzI5Q1FVRkZMRTFCUVUwN1lVRkRla0k3VTBGRFNqdFJRVU5FTEVsQlFVa3NWMEZCVnl4TFFVRkxMRU5CUVVNN1dVRkRha0lzUTBGQlF5eFJRVUZSTEVkQlFVY3NUVUZCVFN4RFFVRkRMR1ZCUVdVc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eE5RVUZOTEVsQlFVa3NRMEZCUXl4RFFVRkRMRkZCUVZFc1EwRkJReXhGUVVOc1JUdFpRVU5KTEVOQlFVTXNRMEZCUXl4WFFVRlhMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUXpGQ0xFTkJRVU1zUTBGQlF5eE5RVUZOTEVkQlFVY3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenRUUVVOd1FqdFJRVU5FTEU5QlFVOHNRMEZCUXl4RFFVRkRPMGxCUTJJc1EwRkJRenRKUVVsRUxIZENRVUZQTEVkQlFWQTdVVUZEU1N4SlFVRkpMRWxCUVVrc1EwRkJReXhGUVVGRkxFbEJRVWtzU1VGQlNTeEZRVUZGTzFsQlEycENMRWxCUVVrc1EwRkJReXhGUVVGRkxFZEJRVWNzU1VGQlNTeE5RVUZOTEVOQlFVTXNTVUZCU1N4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRE8xTkJRMnBETzFGQlNVUXNTVUZCU1N4RFFVRkRMRVZCUVVVc1EwRkJReXhMUVVGTExFTkJRVU1zU1VGQlNTeERRVUZETEZGQlFWRXNRMEZCUXl4RFFVRkRPMUZCUXpkQ0xFbEJRVWtzUTBGQlF5eEhRVUZsTEVsQlFVa3NRMEZCUXp0UlFVTjZRaXhQUVVGUExFTkJRVU1zUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4WlFVRlpMRVZCUVVVc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEZGQlFWRXNTVUZCU1N4RFFVRkRMRU5CUVVNc1MwRkJTeXhGUVVGRkxFZEJRVWNzVFVGQlRTeERRVUZETEdWQlFXVXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhOUVVGTkxFTkJRVU1zUlVGQlJUdFpRVU5xUnl4SlFVRkpMRVZCUVVVc1IwRkJSeXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEV0QlFVc3NSVUZCUlN4RlFVRkZMRWRCUVVjc1EwRkJReXhEUVVGRExFdEJRVXNzUTBGQlF5eExRVUZMTEVOQlFVTTdXVUZOTVVNc1NVRkJTU3hGUVVGRkxFdEJRVXNzUlVGQlJTeEZRVUZGTzJkQ1FVTllMRWxCUVVrc1EwRkJReXhGUVVGRkxFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMkZCUTNCQ08ybENRVUZOTzJkQ1FVTklMRWxCUVVrc1JVRkJSU3hEUVVGRExESkNRVUV5UWl4RFFVRkRMRU5CUVVNc1EwRkJReXhMUVVGTExFVkJRVVVzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4RlFVRkZPMjlDUVVWcVJDeERRVUZETEVOQlFVTXNZVUZCWVN4SFFVRkhMRWxCUVVrc1EwRkJRenR2UWtGRGRrSXNVMEZCVXp0cFFrRkRXanRuUWtGRlJDeEpRVUZKTEV0QlFVc3NSMEZCUnl4RlFVRkZMRU5CUVVNc1dVRkJXU3hEUVVGRExFTkJRVU1zUTBGQlF5eEpRVUZKTEVWQlFVVXNRMEZCUXl4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRE8yZENRVU0zUXl4SlFVRkpMRXRCUVVzc1MwRkJTeXhKUVVGSkxFVkJRVVU3YjBKQlEyaENMRWxCUVVrc1EwRkJReXhGUVVGRkxFTkJRVU1zVFVGQlRTeERRVUZETEV0QlFVc3NRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJRenR2UWtGRGVrSXNTVUZCU1N4RFFVRkRMRVZCUVVVc1EwRkJReXhOUVVGTkxFTkJRVU1zUzBGQlN5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRPMjlDUVVONlFpeEpRVUZKTEVOQlFVTXNSVUZCUlN4RFFVRkRMRTFCUVUwc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF6dHZRa0ZEYmtJc1NVRkJTU3hEUVVGRExGRkJRVkVzUTBGQlF5eEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRlZCUVZVc1EwRkJReXhEUVVGRE8ybENRVU40UXp0eFFrRkJUVHR2UWtGSlNDeERRVUZETEVOQlFVTXNZVUZCWVN4SFFVRkhMRWxCUVVrc1EwRkJRenR2UWtGRGRrSXNVMEZCVXp0cFFrRkRXanRuUWtGRFJDeEpRVUZKTEVOQlFVTXNRMEZCUXl4TFFVRkxMRVZCUVVVc1NVRkJTU3hEUVVGRExFVkJRVVU3YjBKQlMyaENMRWxCUVVrc1EwRkJReXhSUVVGUkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMmxDUVVONlFqdHhRa0ZCVFR0dlFrRkpTQ3hKUVVGSkxFTkJRVU1zUlVGQlJTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRwUWtGRGNFSTdZVUZEU2p0VFFVMUtPMGxCU1V3c1EwRkJRenRKUVVkRUxITkNRVUZMTEVkQlFVdzdVVUZEU1N4SlFVRkpMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU03VVVGRFppeEpRVUZKTEZGQlFWRXNSMEZCUnl4TlFVRk5MRU5CUVVNc1UwRkJVeXhGUVVGRkxFbEJRVWtzUjBGQlJ5eEpRVUZKTEVOQlFVTXNSVUZCUlN4RFFVRkRMRWxCUVVrc1JVRkJSU3hEUVVGRE8xRkJRM1pFTEU5QlFVOHNTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhSUVVGUkxFZEJRVWNzU1VGQlNTeERRVUZETEVkQlFVY3NUVUZCVFN4RlFVRkZPMWxCUTNaRExFbEJRVWtzUTBGQlF5eFBRVUZQTEVWQlFVVXNRMEZCUXp0WlFVTm1MRkZCUVZFc1IwRkJSeXhKUVVGSkxFTkJRVU03V1VGRGFFSXNTVUZCU1N4SFFVRkhMRWxCUVVrc1EwRkJReXhGUVVGRkxFTkJRVU1zU1VGQlNTeEZRVUZGTEVOQlFVTTdVMEZEZWtJN1VVRkRSQ3hQUVVGUExFbEJRVWtzUTBGQlF6dEpRVU5vUWl4RFFVRkRPMGxCY0V0TkxESkNRVUZ2UWl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRE8wbEJRemRDTEhOQ1FVRmxMRWRCUVVjc1EwRkJReXhMUVVGTExFTkJRVU03U1VGdlMzQkRMR0ZCUVVNN1EwRkJRU3hCUVhwTFJDeEpRWGxMUXp0QlFYcExXU3gzUWtGQlRUdEJRV2xNYmtJc1UwRkJaMElzTWtKQlFUSkNMRU5CUVVNc1MwRkJaMFFzUlVGQlJTeFZRVUZ0UWl4RlFVRkZMRlZCUVcxQ08wbEJSMnhKTEVsQlFVMHNSVUZCUlN4SFFVRmxMRXRCUVVzc1EwRkJReXhIUVVGSExFTkJRVU1zVlVGQlFTeERRVUZETEVsQlFVa3NUMEZCUVN4SlFVRkpMRkZCUVZFc1EwRkJReXhEUVVGRExFTkJRVU1zWVVGQllTeERRVUZETEVWQlFUZENMRU5CUVRaQ0xFTkJRVU1zUTBGQlF6dEpRVU55UlN4SlFVRk5MRVZCUVVVc1IwRkJhVUlzUlVGQlJTeERRVUZETzBsQlF6VkNMRWxCUVUwc1EwRkJReXhIUVVGSExFdEJRVXNzUTBGQlF5eE5RVUZOTEVOQlFVTTdTVUZEZGtJc1MwRkJTeXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVWQlFVVTdVVUZETlVJc1NVRkJUU3hKUVVGSkxFZEJRVWNzUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRXRCUVVzc1IwRkJSeXhMUVVGTExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUXpWRExFVkJRVVVzUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4VlFVRlZMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4SFFVRkhMRXRCUVVzc1EwRkJReXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMHRCUXpORk8wbEJRMFFzU1VGQlRTeFJRVUZSTEVkQlFVY3NSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVOc1FpeFRRVUZUTEVkQlFVY3NSVUZCUlN4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUlVGRGNrSXNXVUZCV1N4SFFVRkhMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEpRVUZKTEVkQlFVY3NRMEZCUXl4RlFVTm9ReXhoUVVGaExFZEJRVWNzUzBGQlN5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFZEJRVWNzUTBGQlF5eERRVUZETzBsQlF6RkRMRWxCUVVrc1RVRkJUU3hIUVVGaExFbEJRVWtzUlVGQlJTeE5RVUZOTEVkQlFXRXNTVUZCU1N4RFFVRkRPMGxCUTNKRUxFbEJRVWtzVlVGQlZTeEZRVUZGTzFGQlExb3NUVUZCVFN4SFFVRkhMRWxCUVVrc1VVRkJVU3hEUVVGRExGVkJRVlVzUlVGQlJTeFJRVUZSTEVOQlFVTXNUVUZCVFN4SFFVRkhMRWxCUVVrc1EwRkJReXhEUVVGRE8xRkJRekZFTEVWQlFVVXNRMEZCUXl4SlFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU03VVVGRGFFSXNSVUZCUlN4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxGVkJRVlVzUTBGQlF5eE5RVUZOTEVWQlFVVXNVVUZCVVN4RlFVRkZMRmxCUVZrc1EwRkJReXhEUVVGRExFTkJRVU03UzBGRE0wUTdTVUZEUkN4SlFVRkpMRlZCUVZVc1JVRkJSVHRSUVVOYUxFMUJRVTBzUjBGQlJ5eEpRVUZKTEZGQlFWRXNRMEZCUXl4VlFVRlZMRVZCUVVVc1UwRkJVeXhEUVVGRExFMUJRVTBzUjBGQlJ5eEpRVUZKTEVOQlFVTXNRMEZCUXp0UlFVTXpSQ3hGUVVGRkxFTkJRVU1zU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRPMUZCUTJoQ0xFVkJRVVVzUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4VlFVRlZMRU5CUVVNc1UwRkJVeXhGUVVGRkxFMUJRVTBzUlVGQlJTeGhRVUZoTEVOQlFVTXNRMEZCUXl4RFFVRkRPMHRCUXpkRU8wbEJRMFFzU1VGQlNTeE5RVUZOTEVkQlFVY3NTVUZCU1N4TlFVRk5MRU5CUVVNc1JVRkJSU3hGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZETzBsQlEyaERMRTFCUVUwc1EwRkJReXhMUVVGTExFVkJRVVVzUTBGQlF6dEpRVU5tTEU5QlFVODdVVUZEU0N4VlFVRlZMRVZCUVVVc1JVRkJSU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVWQlFVVXNTMEZCU3l4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eFZRVUZCTEVOQlFVTXNTVUZCU1N4UFFVRkJMRU5CUVVNc1EwRkJReXhSUVVGUkxFVkJRVVVzUlVGQldpeERRVUZaTEVOQlFVTTdVVUZETlVRc1ZVRkJWU3hGUVVGRkxFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMRkZCUVZFc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eFJRVUZSTEVOQlFVTXNVVUZCVVN4RlFVRkZMRWRCUVVjc1dVRkJXVHRSUVVNelJTeFZRVUZWTEVWQlFVVXNUVUZCVFN4RFFVRkRMRU5CUVVNc1EwRkJReXhOUVVGTkxFTkJRVU1zVVVGQlVTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRk5CUVZNc1EwRkJReXhSUVVGUkxFVkJRVVVzUjBGQlJ5eGhRVUZoTzB0QlEyaEdMRU5CUVVNN1FVRkRUaXhEUVVGRE8wRkJhRU5FTEd0RlFXZERReUo5Il19
