'use strict';
'require view';
'require fs';
'require poll';
'require ui';

const pollIval = 2;

function hexStrToIP(string) {
    var ip = parseInt(string, 16);

    var part1 = ip & 255;
    var part2 = ((ip >> 8) & 255);
    var part3 = ((ip >> 16) & 255);
    var part4 = ((ip >> 24) & 255);

    return [ part1, part2, part3, part4 ].join('.');
};

const ipproto = {
    1 : 'imcp',
    2 : 'igmp',
    4 : 'ipip',
    6 : 'tcp',
    9 : 'egp',
    17 : 'udp',
    47 : 'gre',
    103 : 'pim'
};

function parseIpPort(s) {
    var parsed = s.split(':');

    return [ hexStrToIP(parsed[0]), parseInt(parsed[1], 16) ];
};

function tcpUdpState(state) {
    if(state == 1)
        return 'ESTAB';
    else if(state == 2)
        return 'SYN-SENT';
    else if(state == 3)
        return 'SYN-RECV';
    else if(state == 4)
        return 'FIN-WAIT-1';
    else if(state == 5)
        return 'FIN-WAIT-2';
    else if(state == 6)
        return 'TIME-WAIT';
    else if(state == 7)
        return 'UNCONN';
    else if(state == 8)
        return 'CLOSE-WAIT';
    else if(state == 9)
        return 'LAST-ACK';
    else if(state == 10)
        return 'LISTEN';
    else if(state == 10)
        return 'CLOSING';
    else
        return 'UNKNOWN';
};

function parseRawAndUdp(s, ipproto_map = null) {
    var lines = s.trim().split(/\n/),
        res = [];

    //sl  local_address rem_address   st tx_queue rx_queue tr tm->when retrnsmt   uid  timeout inode ref pointer drops
    for(var i=1; i < lines.length; i++){
        var m = lines[i].trim().split(/\s+/),
            ipport_loc = parseIpPort(m[1]),
            ipport_rem = parseIpPort(m[2]),
            st = parseInt(m[3], 16),
            queue = m[4].split(':'),
            txq = parseInt(queue[0], 16),
            rxq = parseInt(queue[1], 16),
            uid = +m[7],
            drops = +m[12];

        if(ipproto_map) {
            //тултипом показываем название raw протокола
            res.push([ E('normal', { 'data-tooltip': ipproto_map[ipport_loc[1]] }, [ ipport_loc.join(':') ]), 
                       E('normal', { 'data-tooltip': ipproto_map[ipport_rem[1]] }, [ ipport_rem.join(':') ]), 
                       tcpUdpState(st), txq, rxq, uid, drops ]);
        } else
            res.push([ ipport_loc.join(':'), ipport_rem.join(':'), tcpUdpState(st), txq, rxq, uid, drops ]);
    }
    return res;
};

function unixSockType(type) {
    if(type == 1)
        return 'SOCK_STREAM';
    else if(type == 2)
        return 'SOCK_DGRAM';
    else if(type == 3)
        return 'SOCK_RAW';
    else if(type == 4)
        return 'SOCK_RDM';
    else if(type == 5)
        return 'SOCK_SEQPACKET';
    return 'SOCK_UNKNOWN';
};

function unixSockState(state) {
    if(state == 0)
        return 'SS_FREE';
    else if(state == 1)
        return 'SS_UNCONNECTED';
    else if(state == 2)
        return 'SS_CONNECTING';
    else if(state == 3)
        return 'SS_CONNECTED';
    else if(state == 4)
        return 'SS_DISCONNECTING';
    return 'SS_UNKNOWN';
};

function parseUnix(s) {
    var lines = s.trim().split(/\n/),
        res = [];

    //Num       RefCount Protocol Flags    Type St Inode Path
    for(var i=1; i < lines.length; i++){
        var m = lines[i].trim().split(/\s+/),
            type = parseInt(m[4], 16),
            st = parseInt(m[5], 16),
            path = m[7];

        res.push([ unixSockType(type), unixSockState(st), path ]);
    }
    return res;
};

function pollMr() {
    return Promise.all([
            fs.trimmed('/proc/net/udp'),
            fs.trimmed('/proc/net/raw'),
            fs.trimmed('/proc/net/unix'),
            fs.trimmed('/proc/net/tcp')
        ]).then(function(data) {
            var udp = data[0],
                raw = data[1],
                unix = data[2],
                tcp = data[3];

            var rawparsed = parseRawAndUdp(raw, ipproto);
            cbi_update_table('#rawtbl', rawparsed,
                E('em', _('No entries available'))
            );

            var udpparsed = parseRawAndUdp(udp);
            cbi_update_table('#udptbl', udpparsed,
                E('em', _('No entries available'))
            );

            var unixparsed = parseUnix(unix);
            cbi_update_table('#unixtbl', unixparsed,
                E('em', _('No entries available'))
            );
        });
};

return view.extend({
    createTable: function(id, title, tooltips = []) {
        //const raw_style = 'font-family:monospace;font-size:smaller;text-align:right';

        var titlehdr = E('tr', { 'class': 'tr table-titles', 'id' : '%s-table-titles'.format(id) });
        for(var i = 0; i < title.length; i++)
            titlehdr.appendChild(E('th', { 'class': 'th', 'data-tooltip': tooltips ? tooltips[i] : null }, _(title[i]) ));

        var tbl = E('table', { 'class': 'table', 'id' : id });
        tbl.appendChild(titlehdr);
        return tbl;
    },

    render: function() {
        var rawtbl = this.createTable('rawtbl',
            //заголовок
            [ 'Local', 'Remote', 'State', 'TX-Q', 'RX-Q', 'uid', 'Drops' ],
            //tolltips для заголовка
            [ 'Local address of the socket and port number', 
            'Remote address of the socket and port number',
            'The state of the socket', 
            'The amount of memory allocated in the kernel for outgoing datagrams', 
            'The amount of memory allocated in the kernel for incoming datagrams',
            'The effective user id of the user who created this socket', 
            'The number of datagram drops associated with this socket,\nthis is only incremented in receive paths']
        );

        var udptbl = this.createTable('udptbl',
            //заголовок
            [ 'Local', 'Remote', 'State', 'TX-Q', 'RX-Q', 'uid', 'Drops' ],
            //tolltips для заголовка
            ['Local address of the socket and port number', 
            'Remote address of the socket and port number',
            'The state of the socket', 
            'The amount of memory allocated in the kernel for outgoing datagrams', 
            'The amount of memory allocated in the kernel for incoming datagrams',
            'The effective user id of the user who created this socket', 
            'The number of datagram drops associated with this socket,\nthis is only incremented in receive paths']
        );

        var unixtbl = this.createTable('unixtbl', [ 'Type', 'State', 'Path' ]);

        poll.add(pollMr.bind(this), pollIval);

        var view = E([], [
            E('h2', {}, [ _('Socket statistic') ]),
                E('h3', {}, [ _('Raw sockets') ]),
                rawtbl,

                E('h3', {}, [ _('UDP sockets') ]),
                udptbl,

                E('h3', {}, [ _('UNIX sockets') ]),
                unixtbl
            ]);

        return view;
    },

    handleSaveApply: null,
    handleSave: null,
    handleReset: null
});
