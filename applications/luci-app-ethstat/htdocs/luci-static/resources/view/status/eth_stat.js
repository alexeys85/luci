'use strict';
'require view';
'require fs';
'require poll';
'require ui';
'require dom';
'require rpc';

var callNetDevStatus = rpc.declare({
	object: 'network.device',
	method: 'status',
	params: [ 'name' ]
});

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

function progressbar(value, max, show_max = true) {
    var pc = Math.floor((100 / max) * value);

    return E('div', {
        'class': 'cbi-progressbar',
        'title': show_max ? '%s / %s (%d%%)'.format(value, max, pc) :
                            '%s (%d%%)'.format(value, pc)
    }, E('div', { 'style': 'width:%.2f%%'.format(pc) }));
};

function parseSatistics(eth0_stat, eth1_stat) {
	const params = [
		{name : "collisions",       	err : true, tooltip : "Number of collisions during packet transmissions"},
		{name : "rx_frame_errors",   	err : true, tooltip : "Receiver frame alignment errors"},
		{name : "tx_compressed",  		err : false, tooltip : "Number of transmitted compressed packets"},
		{name : "multicast",  			err : false, tooltip : "Multicast packets received"},
		{name : "rx_length_errors", 	err : true, tooltip : "Number of packets dropped due to invalid length"},
		{name : "tx_dropped",  			err : true, tooltip : "Number of packets dropped on their way to transmission, e.g. due to lack of resources."},
		{name : "rx_bytes",       		err : false, tooltip : "Number of good received bytes, corresponding to rx_packets."},
		{name : "rx_missed_errors", 	err : true, tooltip : "Counts number of packets dropped by the device due to lack of buffer space"},
		{name : "tx_errors",  			err : true, tooltip : "Total number of transmit problems"},
		{name : "rx_compressed",  		err : false, tooltip : "Number of correctly received compressed packets"},
		{name : "rx_over_errors", 		err : true, tooltip : "Receiver FIFO overflow event counter"},
		{name : "tx_fifo_errors", 		err : true, tooltip : "Number of frame transmission errors due to device FIFO underrun / underflow"},
		{name : "rx_crc_errors", 		err : true, tooltip : "Number of packets received with a CRC error"},
		{name : "rx_packets", 			err : false, tooltip : "Number of good packets received by the interface"},
		{name : "tx_heartbeat_errors", 	err : true, tooltip : "Number of Heartbeat / SQE Test errors for old half-duplex Ethernet"},
		{name : "rx_dropped", 			err : true, tooltip : "Number of packets received but not processed, e.g. due to lack of resources or unsupported protocol"},
		{name : "tx_aborted_errors", 	err : true, tooltip : "Part of aggregate “carrier” errors in /proc/net/dev"},
		{name : "tx_packets", 			err : false, tooltip : "Number of packets successfully transmitted"},
		{name : "rx_errors", 			err : true, tooltip : "Total number of bad packets received on this network device"},
		{name : "tx_bytes", 			err : false, tooltip : "Number of good transmitted bytes, corresponding to tx_packets"},
		{name : "tx_window_errors", 	err : true, tooltip : "Number of frame transmission errors due to late collisions"},
		{name : "rx_fifo_errors", 		err : true, tooltip : "Receiver FIFO error counter"},
		{name : "tx_carrier_errors", 	err : true, tooltip : "Number of frame transmission errors due to loss of carrier during transmission"}
	];

	var res = [];

	if(!eth0_stat.hasOwnProperty("statistics") || !eth1_stat.hasOwnProperty("statistics"))
		return res;

	for(var i = 0; i < params.length; ++i) {
		var val_eth0, val_eth1;
		var color = params[i].err ? 'color:red' : null;

		if(eth0_stat.statistics.hasOwnProperty(params[i].name)) {
			val_eth0 = eth0_stat.statistics[params[i].name];
			val_eth0 = E('td', { 'style' : color }, _(val_eth0) );
		}
		if(eth1_stat.statistics.hasOwnProperty(params[i].name)) {
			val_eth1 = eth1_stat.statistics[params[i].name];
			val_eth1 = E('td', { 'style' : color }, _(val_eth1) );
		}

		var name = E('td', { 'data-tooltip' : params[i].tooltip, 'style' : color }, 
							 _(params[i].name) );

		res.push([ name, val_eth0, val_eth1 ]);
	}
	res.sort((a, b) => {
		return a[0].innerText.localeCompare(b[0].innerText);
	});
	return res;
}

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
            params[i].name, progressbar(map1.get(params[i].text), total1, false), 
                            progressbar(map2.get(params[i].text), total2, false)
        ]);

    res.push(["Total", total1, total2]);

    return res;
};

function getFrameTypeDistrib(map1, map2) {
    var eth0_rx_total = map1.get("Good Rx Frames"),
        eth0_tx_total = map1.get("Good Tx Frames"),
        eth1_rx_total = map2.get("Good Rx Frames"),
        eth1_tx_total = map2.get("Good Tx Frames");

    var eth0_bcast_rx = map1.get("Broadcast Rx Frames"),
        eth0_mcast_rx = map1.get("Multicast Rx Frames"),
        eth1_bcast_rx = map2.get("Broadcast Rx Frames"),
        eth1_mcast_rx = map2.get("Multicast Rx Frames");

    var eth0_bcast_tx = map1.get("Broadcast Tx Frames"),
        eth0_mcast_tx = map1.get("Multicast Tx Frames"),
        eth1_bcast_tx = map2.get("Broadcast Tx Frames"),
        eth1_mcast_tx = map2.get("Multicast Tx Frames");

    var res = [];

    res.push(["Unicast",    progressbar(eth0_rx_total - eth0_mcast_rx - eth0_bcast_rx, eth0_rx_total, false), 
                            progressbar(eth0_tx_total - eth0_mcast_tx - eth0_bcast_tx, eth0_tx_total, false),
                            progressbar(eth1_rx_total - eth1_mcast_rx - eth1_bcast_rx, eth1_rx_total, false), 
                            progressbar(eth1_tx_total - eth1_mcast_tx - eth1_bcast_tx, eth1_tx_total, false)]);

    res.push(["Multicast",  progressbar(eth0_mcast_rx, eth0_rx_total, false), progressbar(eth0_mcast_tx, eth0_tx_total, false),
                            progressbar(eth1_mcast_rx, eth1_rx_total, false), progressbar(eth1_mcast_tx, eth1_tx_total, false)]);
    res.push(["Broadcast",  progressbar(eth0_bcast_rx, eth0_rx_total, false), progressbar(eth0_bcast_tx, eth0_tx_total, false),
                            progressbar(eth1_bcast_rx, eth1_rx_total, false), progressbar(eth1_bcast_tx, eth1_tx_total, false)]);

    res.push(["Total",  progressbar(eth0_rx_total, eth0_rx_total + eth0_tx_total),
                        progressbar(eth0_tx_total, eth0_rx_total + eth0_tx_total),
                        progressbar(eth1_rx_total, eth1_rx_total + eth1_tx_total),
                        progressbar(eth1_tx_total, eth1_rx_total + eth1_tx_total)]);

    return res;
};

function getFrameErrors(map1, map2) {
    const params = [
        {text : "Pause Rx Frames", tooltip : "The total number of IEEE 802.3X pause frames received\nby the port (whether acted upon or not)"}, 
        {text : "Rx CRC Errors", tooltip : "The total number of frames received on\nthe port that experienced a CRC error"},
        {text : "Rx Align/Code Errors", tooltip : "The total number of frames received on the\nport that experienced an alignment error or code error"},
        {text : "Oversize Rx Frames", tooltip : "The total number of oversized frames received on the port"},
        {text : "Rx Jabbers", tooltip : "he total number of jabber frames received on the port"},
        {text : "Undersize (Short) Rx Frames", tooltip : "The total number of undersized frames received on the port"},
        {text : "Rx Fragments", tooltip : "The total number of frame fragments received on the port"},
        {text : "Rx Start of Frame Overruns", tooltip : "The total number of frames received on the port that\nhad a CPDMA start of frame (SOF) overrun or were\ndropped by due to FIFO resource limitations"}, 
        {text : "Rx Middle of Frame Overruns", tooltip : "The total number of frames received on the\nport that had a CPDMA middle of frame (MOF) overrun"}, 
        {text : "Rx DMA Overruns", tooltip : "The total number of frames received on the\nport that had either a DMA start of\nframe (SOF) overrun or a DMA MOF overrun"},

        {text : "Pause Tx Frames", tooltip : "The number of IEEE 802.3X pause frames transmitted by the port"}, 
        {text : "Deferred Tx Frames", tooltip : "The total number of frames transmitted on the port\nthat first experienced deferment"}, 
        {text : "Collisions", tooltip : "The total number of times that the port experienced a collision"},
        {text : "Single Collision Tx Frames", tooltip : "The total number of frames transmitted on the port\nthat experienced exactly one collision"},
        {text : "Multiple Collision Tx Frames", tooltip : "The total number of frames transmitted on the port\nthat experienced multiple collisions"},
        {text : "Excessive Collisions", tooltip : "The total number of frames for which transmission\nwas abandoned due to excessive collisions"}, 
        {text : "Late Collisions", tooltip : "The total number of frames on the port for which transmission\nwas abandoned because they experienced a late collision"},
        {text : "Tx Underrun", tooltip : "There should be no transmitted frames that experience underrun"}, 
        {text : "Carrier Sense Errors", tooltip : "The total number of frames received on the port\nthat had a CPDMA middle of frame (MOF) overrun"}
    ];

    var res = [];

    for(var i = 0; i < params.length; ++i) {
        var val = E('td', { 'data-tooltip' : params[i].tooltip }, _(params[i].text) );
        res.push([val, map1.get(params[i].text), map2.get(params[i].text)]);
    }

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
            L.resolveDefault(fs.exec('/usr/sbin/ethtool', ['-S', 'eth1']), {}),
            L.resolveDefault(callNetDevStatus("eth0"), {}),
            L.resolveDefault(callNetDevStatus("eth1"), {})
        ]).then(function(data) {
            var eth0_stat = parseEthtool(data[0].stdout),
                eth1_stat = parseEthtool(data[1].stdout);

            var distr = getFrameDistrib(eth0_stat, eth1_stat);

            cbi_update_table('#fr_dist', distr,
                E('em', _('No entries available'))
            );

            //pie('fr_dist_eth0_pie', formatPieDitrib(distr, 0));
            //pie('fr_dist_eth1_pie', formatPieDitrib(distr, 1));

            var type_dist = getFrameTypeDistrib(eth0_stat, eth1_stat);

            cbi_update_table('#fr_type_dist', type_dist,
                E('em', _('No entries available'))
            );

            var errors = getFrameErrors(eth0_stat, eth1_stat);

            cbi_update_table('#fr_err', errors,
                E('em', _('No entries available'))
            );

            var eth_kern_stat = parseSatistics(data[2], data[3]);

            cbi_update_table('#fr_stat', eth_kern_stat,
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
        /*document.addEventListener('tooltip-open', L.bind(function(ev) {
            this.renderHostDetail(ev.detail.target, ev.target);
        }, this));*/

        if ('ontouchstart' in window) {
            document.addEventListener('touchstart', function(ev) {
                var tooltip = document.querySelector('.cbi-tooltip');
                if (tooltip === ev.target || tooltip.contains(ev.target))
                    return;

                ui.hideTooltip(ev);
            });
        }

        var fr_stat = this.createTable('fr_stat', [
            'Parameter', 'Eth0', 'Eth1'
        ]);

        var fr_dist = this.createTable('fr_dist', [
            'Size RX+TX', 'Eth0', 'Eth1'
        ]);

        var fr_type_dist = this.createTable('fr_type_dist', [
            'Type', 'Eth0 RX', 'Eth0 TX', 'Eth1 RX', 'Eth1 TX'
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
            E('h5', [ _('In Dual Standalone EMAC mode hardware statistics is common for all ports') ]),
            E('div', [
            	E('div', { 'class': 'cbi-section', 'data-tab': 'statistics', 'data-tab-title': _('Statistics') }, [
                    fr_stat
                ]),
                E('div', { 'class': 'cbi-section', 'data-tab': 'distribution', 'data-tab-title': _('Frames distribution') }, [
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
                    fr_type_dist
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
