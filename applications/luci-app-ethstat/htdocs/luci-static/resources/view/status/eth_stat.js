'use strict';
'require view';
'require fs';
'require poll';
'require ui';
'require dom';

var pollIval = 2;

var chartRegistry = {},
    trafficPeriods = [],
    trafficData = { columns: [], data: [] },
    hostNames = {},
    hostInfo = {},
    ouiData = [];

function createValueCell(value, prettify) {
    return E('div', {
                        'class': 'nowrap',
                        //'style': raw ? raw_style : null,
                        'data-format': '%.2m',
                        'data-value': value
                    }, (prettify ? '%.2m' : '%d').format(value));
};

function progressbar(value, max) {
    var pc = Math.floor((100 / max) * value);

    return E('div', {
        'class': 'cbi-progressbar',
        'title': '%s / %s (%d%%)'.format(value, max, pc)
    }, E('div', { 'style': 'width:%.2f%%'.format(pc) }));
};

function parseEthtool(s) {
    var lines = s.trim().split(/\n/),
        res = new Map;

    //Good Rx Frames: 978190
    for(var i = 1; i < lines.length; i++) {
        var m = lines[i].trim().split(/\:+/),
            param = m[0],
            val = +m[1];

        if(param.includes("Rx DMA chan 0"))
            break;

        res.set(param, val);
    }

    return res;
};

function getFrameDistrib(map1, map2) {
    const params = [
        {name : "64",       text : "Rx + Tx 64 Octet Frames"},
        {name : "65-127",   text : "Rx + Tx 65-127 Octet Frames"},
        {name : "128-255",  text : "Rx + Tx 128-255 Octet Frames"},
        {name : "256-511",  text : "Rx + Tx 256-511 Octet Frames"},
        {name : "512-1023", text : "Rx + Tx 512-1023 Octet Frames"},
        {name : "1024-Up",  text : "Rx + Tx 1024-Up Octet Frames"},
    ];

    var total1 = 0,
        total2 = 0;

    for(var i = 0; i < params.length; ++i) {
        total1 += map1.get(params[i].text);
        total2 += map2.get(params[i].text);
    }

    var res = [];

    for(var i = 0; i < params.length; ++i)
        res.push([
            params[i].name, progressbar(map1.get(params[i].text), total1), 
                            progressbar(map2.get(params[i].text), total2)
        ]);

    return res;
};

function getFrameErrors(map1, map2) {
    const params = [
        "Pause Rx Frames", 
        "Rx CRC Errors", 
        "Rx Align/Code Errors",
        "Oversize Rx Frames",
        "Rx Jabbers",
        "Undersize (Short) Rx Frames", 
        "Rx Fragments", 
        "Rx Start of Frame Overruns", 
        "Rx Middle of Frame Overruns", 
        "Rx DMA Overruns",

        "Pause Tx Frames", 
        "Deferred Tx Frames", 
        "Collisions", 
        "Single Collision Tx Frames", 
        "Multiple Collision Tx Frames", 
        "Excessive Collisions", 
        "Late Collisions",
        "Tx Underrun", 
        "Carrier Sense Errors"
    ];

    var res = [];

    for(var i = 0; i < params.length; ++i)
        res.push([params[i], map1.get(params[i]), map2.get(params[i])]);

    return res;
};

function formatPieDitrib(distr, num) {
    var distrData = [];

    for(var i = 0; i < distr.length; ++i) {
        var cell = E('div', distr[i][0]);

        distrData.push({
            value: distr[i][1 + num],
            label: [distr[i][0], cell]
        });
    }

    return distrData;
};

function pollMr() {
    return Promise.all([
            L.resolveDefault(fs.exec('/usr/sbin/ethtool', ['-S', 'eth0']), {}),
            L.resolveDefault(fs.exec('/usr/sbin/ethtool', ['-S', 'eth1']), {})
        ]).then(function(data) {
            var eth0_stat = parseEthtool(data[0].stdout),
                eth1_stat = parseEthtool(data[1].stdout);

            var distr = getFrameDistrib(eth0_stat, eth1_stat);

            cbi_update_table('#fr_dist', distr,
                E('em', _('No entries available'))
            );

            //pie('fr_dist_eth0_pie', formatPieDitrib(distr, 0));
            //pie('fr_dist_eth1_pie', formatPieDitrib(distr, 1));

            var errors = getFrameErrors(eth0_stat, eth1_stat);

            cbi_update_table('#fr_err', errors,
                E('em', _('No entries available'))
            );
        });
};


function pie(id, data) {
    var total = data.reduce(function(n, d) { return n + d.value }, 0);

    data.sort(function(a, b) { return b.value - a.value });

    if (total === 0)
        data = [{
            value: 1,
            color: '#cccccc',
            label: [ _('no traffic') ]
        }];

    for (var i = 0; i < data.length; i++) {
        if (!data[i].color) {
            var hue = 120 / (data.length-1) * i;
            data[i].color = 'hsl(%u, 80%%, 50%%)'.format(hue);
            data[i].label.push(hue);
        }
    }

    var node = L.dom.elem(id) ? id : document.getElementById(id),
        key = L.dom.elem(id) ? id.id : id,
        ctx = node.getContext('2d');

    if (chartRegistry.hasOwnProperty(key))
        chartRegistry[key].destroy();

    chartRegistry[key] = new Chart(ctx).Doughnut(data, {
        segmentStrokeWidth: 1,
        percentageInnerCutout: 30
    });

    return chartRegistry[key];
};

return view.extend({
    off: function(elem) {
        var val = [0, 0];
        do {
            if (!isNaN(elem.offsetLeft) && !isNaN(elem.offsetTop)) {
                val[0] += elem.offsetLeft;
                val[1] += elem.offsetTop;
            }
        }
        while ((elem = elem.offsetParent) != null);
        return val;
    },

    kpi: function(id, val1, val2, val3) {
        var e = L.dom.elem(id) ? id : document.getElementById(id);

        if (val1 && val2 && val3)
            e.innerHTML = _('%s, %s and %s').format(val1, val2, val3);
        else if (val1 && val2)
            e.innerHTML = _('%s and %s').format(val1, val2);
        else if (val1)
            e.innerHTML = val1;

        e.parentNode.style.display = val1 ? 'list-item' : '';
    },

    setupCharts: function() {
        Chart.defaults.global.customTooltips = L.bind(function(tooltip) {
            var tooltipEl = document.getElementById('chartjs-tooltip');

            if (!tooltipEl) {
                tooltipEl = document.createElement('div');
                tooltipEl.setAttribute('id', 'chartjs-tooltip');
                document.body.appendChild(tooltipEl);
            }

            if (!tooltip) {
                if (tooltipEl.row)
                    tooltipEl.row.style.backgroundColor = '';

                tooltipEl.style.opacity = 0;
                return;
            }

            var pos = this.off(tooltip.chart.canvas);

            tooltipEl.className = tooltip.yAlign;
            tooltipEl.innerHTML = tooltip.text[0];

            tooltipEl.style.opacity = 1;
            tooltipEl.style.left = pos[0] + tooltip.x + 'px';
            tooltipEl.style.top = pos[1] + tooltip.y - tooltip.caretHeight - tooltip.caretPadding + 'px';

            //var row = findParent(tooltip.text[1], '.tr'),
            var row = Array.from(document.querySelectorAll('tr'))
                        .find(el => el.textContent.includes(tooltip.text[0]))
                        .closest('tr'),
                hue = tooltip.text[2];

            if (row && !isNaN(hue)) {
                row.style.backgroundColor = 'hsl(%u, 100%%, 80%%)'.format(hue);
                tooltipEl.row = row;
            }
        }, this);

        Chart.defaults.global.tooltipFontSize = 10;
        Chart.defaults.global.animation = 0;
        Chart.defaults.global.tooltipTemplate = function(tip) {
            tip.label[0] = tip.label[0].format(tip.value);
            return tip.label;
        };
    },

    createTable: function(id, title) {
        var titlehdr = E('tr', { 'class': 'tr table-titles' });
        for(var i = 0; i < title.length; i++)
            titlehdr.appendChild(E('th', { 'class': 'th' }, _(title[i]) ));

        var tbl = E('table', { 'class': 'table', 'id' : id });
        tbl.appendChild(titlehdr);
        return tbl;
    },

    render: function() {
        document.addEventListener('tooltip-open', L.bind(function(ev) {
            this.renderHostDetail(ev.detail.target, ev.target);
        }, this));

        if ('ontouchstart' in window) {
            document.addEventListener('touchstart', function(ev) {
                var tooltip = document.querySelector('.cbi-tooltip');
                if (tooltip === ev.target || tooltip.contains(ev.target))
                    return;

                ui.hideTooltip(ev);
            });
        }

        var fr_dist = this.createTable('fr_dist', [
            'Size RX+TX', 'Eth0', 'Eth1'
        ]);

        var fr_err = this.createTable('fr_err', [
            'Parameter', 'Eth0', 'Eth1'
        ]);

        poll.add(pollMr.bind(this), pollIval);

        var node = E([], [
            E('link', { 'rel': 'stylesheet', 'href': L.resource('view/nlbw.css') }),
            E('script', {
                'type': 'text/javascript',
                'src': L.resource('nlbw.chart.js'),
                'load': L.bind(this.setupCharts, this)
            }),

            E('h2', [ _('Ethernet statistics') ]),
            E('h5', [ _('In Dual Standalone EMAC mode hardware statistics is common for all the ports') ]),
            E('div', [
                E('div', { 'class': 'cbi-section', 'data-tab': 'distribution', 'data-tab-title': _('Frames per frame size distribution') }, [
                    /*E('div', { 'class': 'head' }, [
                        E('div', { 'class': 'pie' }, [
                            E('label', [ _('Eth0') ]),
                            E('canvas', { 'id': 'fr_dist_eth0_pie', 'width': 200, 'height': 200 })
                        ]),

                        E('div', { 'class': 'pie' }, [
                            E('label', [ _('Eth1') ]),
                            E('canvas', { 'id': 'fr_dist_eth1_pie', 'width': 200, 'height': 200 })
                        ])
                    ]),*/
                    fr_dist,
                ]),
                E('div', { 'class': 'cbi-section', 'data-tab': 'errors', 'data-tab-title': _('Errors') }, [
                    fr_err
                ])
            ])
        ]);

        ui.tabs.initTabGroup(node.lastElementChild.childNodes);

        return node;
    },

    handleSaveApply: null,
    handleSave: null,
    handleReset: null
});
