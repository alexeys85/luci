'use strict';
'require view';
'require fs';
'require poll';
'require ui';

var pollIval = 2;

var mrdb = {
    '224.0.0.0': 'Base Address',
    '224.0.0.1': 'All Systems on this Subnet',
    '224.0.0.2': 'All Routers on this Subnet',
    '224.0.0.106' : 'All-Snoopers',
    '224.0.0.107' : 'PTP-pdelay',
    '224.0.1.129' : 'PTP-primary',
    '224.0.1.130' : 'PTP-alternate1',
    '224.0.1.131' : 'PTP-alternate2',
    '224.0.1.132' : 'PTP-alternate3',
    '224.2.127.254' : 'SAPv1 Announcements',
    '224.2.127.255' : 'SAPv0 Announcements',
    '239.192.152.143' : 'BT Local Peer Discovery',
    '239.255.255.250' : 'SSDP'
};

function hexStrToIP(string) {
    var ip = parseInt(string, 16);

    var part1 = ip & 255;
    var part2 = ((ip >> 8) & 255);
    var part3 = ((ip >> 16) & 255);
    var part4 = ((ip >> 24) & 255);

    return [ part1, part2, part3, part4 ].join('.');
};

function formatNumber(num, base, decimals) {
    if (num === 0) 
        return 0;

    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];

    const i = Math.floor(Math.log(num) / Math.log(base));

    return parseFloat((num / Math.pow(base, i)).toFixed(dm)) + sizes[i];
};

function formatBytes(bytes, decimals = 2) {
    return formatNumber(bytes, 1024, decimals);
};

function formatBits(bits, decimals = 2) {
    return formatNumber(bits, 1000, decimals);
};

function formatPackets(pakets, decimals = 2) {
    return formatNumber(pakets, 1000, decimals);
};

function ifIdxToIface(idx, vif) {
    for (var i = 0; i < vif.length; i++) {
        if (vif[i][0] === idx)
            return vif[i][1];
    }
    return "not found";
};

function vifFlagsToName(flags) {
    var res = [];

    if (flags & 0x1)
        res.push("IPIP tunnel");
    if (flags & 0x2)
        res.push("NI");
    if (flags & 0x4)
        res.push("Regster vif");
    if (flags & 0x8)
        res.push("Use index over addr");

    return res;
};

function vifFlagHasUseIndex(flags) {
    return Boolean(flags & 0x8);
};

function prettyMac(mac) {
    return mac.match(/.{1,2}/g).join(':').toUpperCase();
};

function createValueCell(value, prettify) {
    return E('div', {
                        'class': 'nowrap',
                        //'style': raw ? raw_style : null,
                        'data-format': '%.2m',
                        'data-value': value
                    }, (prettify ? '%.2m' : '%d').format(value));
};

function map_uncheck_all(m) {
    for (var value of m.values()) {
        value.checked = false;
    }
};

function map_get_rate(m, key, bytes) {
    // в байтах/с
    var rate = m.has(key) ? (bytes - m.get(key).bytes) / pollIval : 0;
    // запоминаем значение принятых байт и помечаем интерфейс проверенным
    m.set(key, { bytes: bytes, checked: true} );

    return Math.max(rate, 0);
};

function map_cleanup(m) {
    for (const [key, value] of m) {
        if(!value.checked)
            m.delete(key);
    }
};

// Map { ifname, {bytesin, checked} }
const if_bytes_in_map = new Map();
const if_bytes_out_map = new Map();

function parseMrVif(s, prettify) {
    var lines = s.trim().split(/\n/),
        res = [];

    // Помечаем интерфейсы как не проверенные
    map_uncheck_all(if_bytes_in_map);
    map_uncheck_all(if_bytes_out_map);

    // Interface      BytesIn  PktsIn  BytesOut PktsOut Flags Local    Remote
    for (var i = 1; i < lines.length; i++) {
        var m = lines[i].trim().split(/\s+/),
            idx = +m[0],
            iface = m[1],
            bytesin = +m[2],
            pktsin = +m[3],
            bytesout = +m[4],
            pktsout = +m[5],
            flags = +m[6],
            local = m[7],
            remote = hexStrToIP(m[8]);

        if (flags) {
            if(local && vifFlagHasUseIndex(flags))
                local = parseInt(local, 16);

            flags = E('normal', {
                'data-tooltip': vifFlagsToName(flags).join("<br>")
            }, [ '0x' + parseInt(flags, 16).toString(16) ]);
        }

        // в байтах/с
        var rate_in  = map_get_rate(if_bytes_in_map,  iface, bytesin);
        var rate_out = map_get_rate(if_bytes_out_map, iface, bytesout); 

        res.push([
            idx,
            '<span class="ifacebadge nowrap">%s</span>'.format(iface),
            createValueCell(rate_in, prettify),
            createValueCell(bytesin, prettify),
            createValueCell(pktsin, prettify),
            createValueCell(rate_out, prettify),
            createValueCell(bytesout, prettify),
            createValueCell(pktsout, prettify),
            flags, local, remote
        ]);
    }

    // удаляем все непроверенные интерфейсы
    map_cleanup(if_bytes_in_map);
    map_cleanup(if_bytes_out_map);

    return res;
};

// Map { group_origin, {bytesin, checked} }
const group_bytes_map = new Map();

// Map { group, {rate, checked} }
const group_rates_map = new Map();

function parseMrCache(s, vif, prettify) {
    var lines = s.trim().split(/\n/),
        res = [];

    // Помечаем интерфейсы как не проверенные
    map_uncheck_all(group_bytes_map);
    map_uncheck_all(group_rates_map);
    for (var value of group_rates_map.values()) {
        value.rate = 0;
    }

    // Group    Origin   Iif     Pkts    Bytes    Wrong Oifs
    for (var i = 1; i < lines.length; i++) {
        var m = lines[i].split(/\s+/),
            group = hexStrToIP(m[0]),
            origin = hexStrToIP(m[1]),
            iif = ifIdxToIface(+m[2], vif),
            pkts = +m[3],
            bytes = +m[4],
            wrong = +m[5];

        var oifs = [];
        for (var j = 6; j < m.length; j++) {
            if(m[j]) {
                var iface_ttl = m[j].trim().split(':');
                oifs.push(ifIdxToIface(+iface_ttl[0], vif) + ':' + iface_ttl[1]);
            }
        }

        var gr_org = "%s_%s".format(group, origin);

        // в байтах/с
        var rate = map_get_rate(group_bytes_map, gr_org, bytes);

        if(group_rates_map.has(group)) {
            group_rates_map.get(group).rate += rate;
            group_rates_map.get(group).checked = true;
        } else
            group_rates_map.set(group, {rate : rate, checked : true});

        res.push([
            E('div', {
                        'data-tooltip': mrdb[group] ? mrdb[group] : null,
                        'has-oifs': oifs.length != 0
                    }, (group)),
            origin, iif, 
            createValueCell(rate, prettify),
            createValueCell(pkts, prettify),
            createValueCell(bytes, prettify),
            wrong, oifs.join('<br>')
        ]);
    }

    // удаляем все непроверенные группы
    map_cleanup(group_bytes_map);
    map_cleanup(group_rates_map);

    return res;
};

function getGroupRates(prettify) {
    var res = [];

    for (const [key, value] of group_rates_map) {
        res.push([
            E('div', {
                'data-tooltip': mrdb[key] ? mrdb[key] : null
            }, (key)),
            createValueCell(value.rate, prettify)
        ]);
    }

    return res;
};

function parseMcFilter(s) {
    var lines = s.trim().split(/\n/),
        res = [];

    // Idx Device        MCA        SRC    INC    EXC
    for (var i = 1; i < lines.length; i++) {
        var m = lines[i].split(/\s+/),
            idx = +m[0],
            dev = m[1],
            group = hexStrToIP(m[2]),
            source = hexStrToIP(m[3]),
            inc = +m[4],
            exc = +m[5];

        res.push([
            idx, 
            '<span class="ifacebadge nowrap">%s</span>'.format(dev),
            E('div', {
                        'data-tooltip': mrdb[group] ? mrdb[group] : null
                    }, (group)),
            source, inc, exc
        ]);
    }

    return res;
};

function parseIgmp(s, mships) {
    var lines = s.trim().split(/\n/),
        res = [];

    // Idx  Device    : Count Querier   Group    Users Timer    Reporter
    for(var i = 1; i < lines.length; i++) {
        var m = lines[i].split(/\s+/),
            idx = +m[0],
            dev = m[1],
            cnt = +m[3],
            qur = m[4];

        var groups = [], users = [], timer = [], repor = [];
        if(cnt) {
            for (var j = 0; j < cnt; j++) {
                m = lines[++i].trim().split(/\s+/);
                groups.push(hexStrToIP(m[0]));
                users.push(+m[1]);

                var tm = m[2].split(':');
                timer.push(tm[0] + ':' + parseInt(tm[1], 16));

                repor.push(+m[3]);
            }
            mships.value += cnt;
        }

        res.push([
            idx, 
            '<span class="ifacebadge nowrap">%s</span>'.format(dev), 
            cnt, qur, groups.join('<br>'), users.join('<br>'), timer.join('<br>'), repor.join('<br>')
        ]);
    }

    return res;
};

function parseDevMcast(s) {
    var lines = s.trim().split(/\n/),
        res = [];

    for(var i = 0; i < lines.length; i++) {
        var m = lines[i].split(/\s+/),
            idx   = +m[0],
            iface = m[1],
            users = +m[2],
            ref   = +m[3],
            mac   = prettyMac(m[4]);

        res.push([
            idx, 
            '<span class="ifacebadge nowrap">%s</span>'.format(iface), 
            users, ref, mac
        ]);
    }

    return res;
};

function progressbar(value, max) {
    var pc = Math.floor((100 / max) * value);

    return E('div', {
        'class': 'cbi-progressbar',
        'title': '%s / %s (%d%%)'.format(value, max, pc)
    }, E('div', { 'style': 'width:%.2f%%'.format(pc) }));
};

function pollMr() {
    return Promise.all([
            fs.trimmed('/proc/sys/net/ipv4/conf/all/mc_forwarding'),
            fs.trimmed('/proc/sys/net/ipv4/igmp_max_memberships'),
            fs.trimmed('/proc/net/ip_mr_vif'),
            fs.trimmed('/proc/net/ip_mr_cache'),
            fs.trimmed('/proc/net/igmp'),
            fs.trimmed('/proc/net/dev_mcast'),
            fs.trimmed('/proc/net/mcfilter')
        ]).then(function(data) {
            var enabled = +data[0],
                igmp_max = +data[1],
                mrvif = data[2],
                mrcache = data[3],
                mrigmp = data[4],
                mrdevmcast = data[5],
                mrmcfilter = data[6],
                res =[];

            var btn_pretty = document.getElementById('pretty_btn'),
                prettify = (btn_pretty.getAttribute('data-prettify') === 'true');

            var vif = parseMrVif(mrvif, prettify);

            cbi_update_table('#mrviftbl', vif,
                E('em', _('No entries available'))
            );

            var cache = parseMrCache(mrcache, vif, prettify);
            cbi_update_table('#mrcachetbl', cache,
                E('em', _('No entries available'))
            );

            // после parseMrCache
            var rates = getGroupRates(prettify);
            cbi_update_table('#mrratestbl', rates,
                E('em', _('No entries available'))
            );

            var filter = parseMcFilter(mrmcfilter);
            cbi_update_table('#mrmctbl', filter,
                E('em', _('No entries available'))
            );

            var hide_noifs = document.querySelector('[data-hide="true"]');
            document.querySelectorAll('[has-oifs]')
                .forEach(function(div) {
                    var hasoifs = div.getAttribute('has-oifs');
                    var currentRow = div.closest('tr');
                    if(hide_noifs && (hasoifs === 'false'))
                        currentRow.style.display = 'none';
                    else
                        currentRow.style.display = '';
            });

            var mships = {value : 0};
            cbi_update_table('#mrigmptbl', parseIgmp(mrigmp, mships),
                E('em', _('No entries available'))
            );

            res.push([
                'Multicast routing enabled', Boolean(enabled)
                ], [
                'VIFs created', progressbar(vif.length, 32)
                ], [
                'Memberships are currently held by the OS', progressbar(mships.value, igmp_max)
                ], [
                'Active multicast routes', cache.length
                ]); 

            cbi_update_table('#mrsetts', res,
                E('em', _('No entries available'))
            );

            cbi_update_table('#mrdevmcasttbl', parseDevMcast(mrdevmcast),
                E('em', _('No entries available'))
            );
        });
};

return view.extend({
    handlePrettify: function(ev) {
        var btn = ev.currentTarget,
            prettify = (btn.getAttribute('data-prettify') === 'false');

        btn.setAttribute('data-prettify', prettify);
        btn.firstChild.data = prettify ? _('Normal numbers') : _('Prettify numbers');
        btn.blur();

        document.querySelectorAll('[data-value]')
            .forEach(function(div) {
                var fmt = prettify ? div.getAttribute('data-format') : '%d';

                //div.style = prettify ? raw_style : '';
                div.innerText = fmt.format(div.getAttribute('data-value'));
            });
    },

    handleNoOifs: function(ev) {
        var btn = ev.currentTarget,
            hide = (btn.getAttribute('data-hide') === 'false');

        btn.setAttribute('data-hide', hide);
        btn.firstChild.data = hide ? _('Show routes without outbound interfaces') : _('Hide routes without outbound interfaces');
        btn.blur();

        document.querySelectorAll('[has-oifs]')
            .forEach(function(div) {
                var hasoifs = div.getAttribute('has-oifs');
                var currentRow = div.closest('tr');
                if(hide === true && hasoifs === 'false')
                    currentRow.style.display = 'none';
                else
                    currentRow.style.display = '';
        });
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
        var mrsetts = this.createTable('mrsetts', [
            'Setting', 'Value'
        ]);

        var mrviftbl = this.createTable('mrviftbl', [
            'VIF index', 'Interface', 'Rate in', 'Bytes in', 'Packets in', 'Rate out', 'Bytes out', 'Packets out', 'Flags', 'Local', 'Remote'
        ]);

        var mrcachetbl = this.createTable('mrcachetbl', [ 
            'Group', 'Origin', 'Iif', 'Rate', 'Packets', 'Bytes', 'Wrong if', 'Oifs:TTL' 
        ]);

        var mrratestbl = this.createTable('mrratestbl', [ 
            'Group', 'Rate' 
        ]);

        var mrmctbl = this.createTable('mrmctbl', [ 
            'Idx', 'Device', 'Group', 'Source', 'INC', 'EXC' 
        ]);

        var mrigmptbl = this.createTable('mrigmptbl', [
            'Idx', 'Device', 'Count', 'Querier', 'Group', 'Users', 'Timer', 'Reporter'
        ]);

        var mrdevmcasttbl = this.createTable('mrdevmcasttbl', [
            'Idx', 'Interface', 'Users', 'Refs', 'Address'
        ]);

        poll.add(pollMr.bind(this), pollIval);

        var view = E([], [
            E('h2', {}, [ _('Multicast') ]),
            E('div', { 'class': 'right', 'style': 'margin-bottom:-1.5em' }, [
                E('button', {
                    'id' : 'pretty_btn',
                    'class': 'cbi-button',
                    'data-prettify': false,
                    'click': ui.createHandlerFn(this, 'handlePrettify')
                }, [ _('Prettify numbers') ])
            ]),
            E('p', {}, [ _('The following rules are currently active on this system.') ]),
            E('div', {}, [
                E('div', { 'data-tab': 'ipv4mrouting', 'data-tab-title': _('IPv4 Multicast Routing') }, [
                    E('h3', {}, [ _('System wide multicast settings') ]),
                    mrsetts,

                    E('h3', {}, [ _('Multicast virtual interfaces') ]),
                    mrviftbl,

                    E('h3', {}, [ _('Active multicast routes') ]),
                    E('div', { 'class': 'right', 'style': 'margin-bottom: 0.5em'}, [
                        E('button', {
                            'id' : 'noifs_btn',
                            'class': 'cbi-button',
                            'data-hide': false,
                            'click': ui.createHandlerFn(this, 'handleNoOifs')
                        }, [ _('Hide routes without outbound interfaces') ])
                    ]),
                    mrcachetbl,

                    E('h3', {}, [ _('Group rates') ]),
                    mrratestbl,

                    E('h3', {}, [ _('IGMPv3 current kernel state') ]),
                    E('p', {}, [ _('Active IGMP SSM (S,G) joins') ]),
                    mrmctbl,

                    E('h3', {}, [ _('IGMP multicast information') ]),
                    E('p', {}, [ _('Lists the IP multicast addresses which this system joined, active IGMP ASM (*,G) joins') ]),
                    mrigmptbl,

                    E('h3', {}, [ _('Layer2 multicast groups which a device is listening to') ]),
                    mrdevmcasttbl
                ])
            ])
        ]);

        ui.tabs.initTabGroup(view.lastElementChild.childNodes);

        return view;
    },

    handleSaveApply: null,
    handleSave: null,
    handleReset: null
});
