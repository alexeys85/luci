'use strict';
'require view';
'require fs';
'require poll';
'require ui';

const pollIval = 2;

//https://www.rfc-editor.org/rfc/rfc1213
const iphelp = {
    'Forwarding' : '1 - acting as router, 2 - NOT acting as router',
    'DefaultTTL' : 'The default value inserted into the Time-To-Live field of\nthe IP header of datagrams originated at this entity',
    'InReceives': 'The total number of input datagrams received from\ninterfaces, including those received in error',
    'InDelivers': 'The total number of input datagrams successfully\ndelivered to IP user-protocols (including ICMP)',
    'ForwDatagrams': 'The number of input datagrams for which this\nentity was not their final IP destination, as a\nresult of which an attempt was made to find a\nroute to forward them to that final destination',
    'InAddrErrors' : 'The number of input datagrams discarded because\nthe IP address in their IP header\'s destination\nfield was not a valid address to be received at\nthis entity',
    'InDiscards' : 'The number of input IP datagrams for which no\nproblems were encountered to prevent their\ncontinued processing, but which were discarded\n(e.g., for lack of buffer space)',
    'OutRequests' : 'The total number of IP datagrams which local IP\nuser-protocols (including ICMP) supplied to IP in requests for transmission',
    'OutNoRoutes' : 'The number of IP datagrams discarded because\nno route could be found to transmit them to their destination',
    'FragCreates' : 'The number of IP datagram fragments that have been\ngenerated as a result of fragmentation at this entity',
    'FragFails' : 'The number of IP datagrams that have been discarded because\nthey needed to be fragmented at this entity but could not be,\ne.g., because their Don\'t Fragment flag was set',
    'FragOKs' : 'The number of IP datagrams that have been successfully fragmented at this entity',
    'InHdrErrors' : 'The number of input datagrams discarded due to\nerrors in their IP headers, including bad checksums,\nversion number mismatch, other format errors, time-to-live exceeded,\nerrors discovered in processing their IP options, etc',
    'InUnknownProtos' : 'The number of locally-addressed datagrams\nreceived successfully but discarded because of an\nunknown or unsupported protocol',
    'OutDiscards' : 'The number of output IP datagrams for which\nno problem was encountered to prevent their transmission\nto their destination, but which were discarded\n(e.g., for lack of buffer space)',
    'ReasmFails' : 'The number of failures detected by the IP\nre-assembly algorithm (for whatever reason: timed out, errors, etc)',
    'ReasmOKs' : 'The number of IP datagrams successfully re-assembled',
    'ReasmReqds' : 'The number of IP fragments received which needed\nto be reassembled at this entity',
    'ReasmTimeout' : 'The maximum number of seconds which received\nfragments are held while they are awaiting\nreassembly at this entity'
};

//https://datatracker.ietf.org/doc/html/draft-ietf-ipv6-rfc2011-update-10
const ipexthelp = {
    'InNoRoutes' : 'The number of input IP datagrams discarded because\nno route could be found to transmit them to their destination',
    'InTruncatedPkts' : 'The number of input IP datagrams discarded because\nthe datagram frame didn\'t carry enough data',
    'InMcastPkts' : 'The number of IP multicast datagrams received',
    'OutMcastPkts' : 'The number of IP multicast datagrams transmitted',
    'InBcastPkts' : 'The number of IP broadcast datagrams received',
    'OutBcastPkts' : 'The number of IP broadcast datagrams transmitted',
    'InOctets' : 'The total number of octets received in input IP datagrams,\nincluding those received in error',
    'OutOctets' : 'The total number of octets in IP datagrams\nto the lower layers for transmission',
    'InMcastOctets' : 'The total number of octets received in IP multicast datagrams',
    'OutMcastOctets' : 'The total number of octets transmitted in IP multicast datagrams',
    'InNoECTPkts' : 'Number of packets received with NOECT',
    'InECT1Pkts' : 'Number of packets received with ECT(1)',
    'InECT0Pkts' : 'Number of packets received with ECT(0)',
    'InCEPkts' : 'Number of packets received with Congestion Experimented',
    'InCsumErrors' : 'Total number of IP Packets with checksum errors',
    'InBcastOctets' : 'The total number of octets received in IP broadcast datagrams',
    'OutBcastOctets' : 'The total number of octets transmitted in IP broadcast datagrams',
    'ReasmOverlaps' : 'The total number of discarded datagrams with overlapping segments'
}

const udphelp = {
    'InDatagrams': 'The total number of UDP datagrams delivered to UDP users',
    'NoPorts': 'The total number of received UDP datagrams for\nwhich there was no application at the destination port',
    'InErrors': 'The number of received UDP datagrams that could\nnot be delivered for reasons other than the lack\nof an application at the destination port',
    'OutDatagrams' : 'The total number of UDP datagrams sent from this entity',
    'RcvbufErrors' : 'Increased when memory cannot be allocated to process an incoming UDP packet',
    'SndbufErrors' : 'Increased when memory cannot be allocated to send an UDP packet',
    'InCsumErrors' : 'Increased when a received UDP packet has an invalid checksum'
};

const icmphelp = {
    "InAddrMaskReps" : "The number of ICMP Address Mask Reply messages received",
    "InAddrMasks" : "The number of ICMP Address Mask Request messages received",    
    "InDestUnreachs" : "The number of ICMP Destination Unreachable messages received",
    "InEchoReps" : "The number of ICMP Echo Reply messages received",
    "InEchos" : "The number of ICMP Echo (request) messages received",
    "InErrors" : "The number of ICMP messages which the entity\nreceived but determined as having ICMP-specific\nerrors (bad ICMP checksums, bad length, etc.)",
    "InMsgs" : "The total number of ICMP messages which the\nentity received. Note that this counter includes\nall those counted by icmpInErrors",
    "InParmProbs" : "The number of ICMP Parameter Problem messages received", 
    "InRedirects" : "The number of ICMP Redirect messages received",
    "InSrcQuenchs" : "The number of ICMP Source Quench messages received",
    "InTimeExcds" : "The number of ICMP Time Exceeded messages received",
    "InTimestampReps" : "The number of ICMP Timestamp Reply messages received",
    "InTimestamps" : "The number of ICMP Timestamp (request) messages received",
    "OutAddrMaskReps" : "The number of ICMP Address Mask Reply messages sent",
    "OutAddrMasks" : "The number of ICMP Address Mask Request messages sent",
    "OutDestUnreachs" : "The number of ICMP Destination Unreachable messages sent",
    "OutEchoReps" : "The number of ICMP Echo Reply messages sent",
    "OutEchos" : "The number of ICMP Echo (request) messages sent",
    "OutErrors" : "The number of ICMP messages which this entity did\nnot send due to problems discovered within ICMP\nsuch as a lack of buffers",
    "OutMsgs" : "The total number of ICMP messages which this\nentity attempted to send. Note that this counter\nincludes all those counted by icmpOutErrors",
    "OutParmProbs" : "The number of ICMP Parameter Problem messages sent",
    "OutRedirects" : "The number of ICMP Redirect messages sent",
    "OutSrcQuenchs" : "The number of ICMP Source Quench messages sent",
    "OutTimeExcds" : "The number of ICMP Time Exceeded messages sent",
    "OutTimestampReps" : "The number of ICMP Timestamp Reply messages sent",
    "OutTimestamps" : "The number of ICMP Timestamp (request) messages sent",
    "InCsumErrors" : "This counter indicates the checksum of the ICMP packet is\nwrong. Kernel verifies the checksum after\nupdating the IcmpInMsgs and before updating IcmpMsgInType"
};

const icmpmsghelp = {
    'InType3': 'Destination Unreachable',
    'InType8': 'Echo request',
    'InType11': 'Time Exceeded',
    'OutType0' : 'Echo Reply',
    'OutType3' : 'Destination Unreachable',
    'OutType8': 'Echo request',
    'OutType11' : 'Time Exceeded'
};

const tcphelp = {
    "ActiveOpens" : "The number of times TCP connections have made a\ndirect transition to the SYN-SENT state from the\nCLOSED state",
    "RtoMin" : "The minimum value permitted by a TCP\nimplementation for the retransmission timeout, ms",
    "RtoMax" : "The maximum value permitted by a TCP\nimplementation for the retransmission timeout, ms",
    "MaxConn" : "The limit on the total number of TCP connections\nthe entity can support\n-1 - maximum number of connections is dynamic",
    "AttemptFails" : "failed connection attempts",
    "CurrEstab" : "The number of TCP connections for which the\ncurrent state is either ESTABLISHED or CLOSE-WAIT",
    "EstabResets" : "The number of times TCP connections have made\na direct transition to the CLOSED state from either\nthe ESTABLISHED state or the CLOSE-WAIT state",
    "InErrs" : "The total number of segments received in error\n(e.g., bad TCP checksums)",
    "InSegs" : "The total number of segments received, including\nthose received in error",
    "OutRsts" : "The number of TCP segments sent containing the RST flag",
    "OutSegs" : "The total number of segments sent, including\nthose on current connections but excluding those\ncontaining only retransmitted octets",
    "PassiveOpens" : "The number of times TCP connections have made a\ndirect transition to the SYN-RCVD state from the\nLISTEN state",
    "RetransSegs" : "The total number of segments retransmitted",
    "RtoAlgorithm" : "Algorithm used to determine the timeout value\nused for retransmitting unacknowledged octets:\n1 - other, 2 - const, 3 - rsre, 4 - vanj, 5 - rfc2988",
    "InCsumErrors" : "Increased when a TCP packet received has an incorrect checksum"
};

const tcpexthelp = {
    "DelayedACKLocked" : "delayed acks further delayed because of locked socket",
    "DelayedACKLost" : "Quick ack mode was activated times",
    "DelayedACKs" : "delayed acks sent",
    "EmbryonicRsts" : "resets received for embryonic SYN_RECV sockets",
    "ListenDrops" : "SYNs to LISTEN sockets dropped",
    "ListenOverflows" : "times the listen queue of a socket overflowed",
    "LockDroppedIcmps" : "ICMP packets dropped because socket was locked",
    "OfoPruned" : "packets dropped from out-of-order queue because of socket buffer overrun",
    "OutOfWindowIcmps" : "ICMP packets dropped because they were out-of-window",
    "PAWSActive" : "active connections rejected because of time stamp",
    "PAWSEstab" : "packets rejected in established connections because of timestamp",
    "PAWSPassive" : "passive connections rejected because of time stamp",
    "PruneCalled" : "packets pruned from receive queue because of socket buffer overrun",
    "RcvPruned" : "packets pruned from receive queue",
    "SockMallocOOM" : "Ran times out of system memory during packet sending",
    "SyncookiesFailed" : "invalid SYN cookies received",
    "SyncookiesRecv" : "SYN cookies received",
    "SyncookiesSent" : "SYN cookies sent",
    "TCPAbortFailed" : "times unable to send RST due to no memory",
    "TCPAbortOnClose" : "connections reset due to early user close",
    "TCPAbortOnData" : "connections reset due to unexpected data",
    "TCPAbortOnLinger" : "connections aborted after user close in linger timeout",
    "TCPAbortOnMemory" : "connections aborted due to memory pressure",
    "TCPAbortOnSyn" : "connections reset due to unexpected SYN",
    "TCPAbortOnTimeout" : "connections aborted due to timeout",
    "TCPDirectCopyFromBacklog" : "bytes directly in process context from backlog",
    "TCPDirectCopyFromPrequeue" : "bytes directly received in process context from prequeue",
    "TCPDSACKOfoRecv" : "DSACKs for out of order packets received",
    "TCPDSACKOfoSent" : "DSACKs sent for out of order packets",
    "TCPDSACKOldSent" : "DSACKs sent for old packets",
    "TCPDSACKRecv" : "DSACKs received",
    "TCPDSackUndo" : "congestion window recovered without slow start using DSACK",
    "TCPDSACKUndo" : "congestion windows recovered without slow start by DSACK",
    "TCPFACKReorder" : "Detected reordering times using FACK",
    "TCPFastRetrans" : "fast retransmits",
    "TCPForwardRetrans" : "forward retransmits",
    "TCPFullUndo" : "congestion windows fully recovered without slow start",
    "TCPHPAcks" : "predicted acknowledgments",
    "TCPHPHits" : "packet headers predicted",
    "TCPHPHitsToUser" : "packet headers predicted and directly queued to user",
    "TCPLossFailures" : "timeouts in loss state",
    "TCPLoss" : "TCP data loss events",
    "TCPLossUndo" : "congestion windows recovered without slow start after partial ack",
    "TCPLostRetransmits" : "retransmits lost",
    "TCPMemoryPressures" : "TCP ran low on memory times",
    "TCPPartialUndo" : "congestion windows partially recovered using Hoe heuristic",
    "TCPPrequeued" : "packets directly queued to recvmsg prequeue",
    "TCPPrequeueDropped" : "packets dropped from prequeue",
    "TCPPureAcks" : "acknowledgments not containing data payload received",
    "TCPRcvCollapsed" : "packets collapsed in receive queue due to low socket buffer",
    "TCPRenoFailures" : "timeouts after reno fast retransmit",
    "TCPRenoRecoveryFailed" : "reno fast retransmits failed",
    "TCPRenoRecoveryFail" : "classic Reno fast retransmits failed",
    "TCPRenoRecovery" : "times recovered from packet loss due to fast retransmit",
    "TCPRenoReorder" : "Detected reordering times using reno fast retransmit",
    "TCPSackFailures" : "timeouts after SACK recovery",
    "TCPSackRecoveryFail" : "SACK retransmits failed",
    "TCPSackRecovery" : "times recovered from packet loss by selective acknowledgements",
    "TCPSACKReneging" : "bad SACK blocks received",
    "TCPSACKReorder" : "Detected reordering times using SACK",
    "TCPSchedulerFailed" : "times receiver scheduled too late for direct processing",
    "TCPSlowStartRetrans" : "retransmits in slow start",
    "TCPTimeouts" : "other TCP timeouts",
    "TCPTSReorder" : "Detected reordering times using time stamp",
    "TWKilled" : "TCP sockets finished time wait in slow timer",
    "TW" : "TCP sockets finished time wait in fast timer",
    "TWRecycled" : "time wait sockets recycled by time stamp"
};

function parseProto(s, proto) {
    var lines = s.trim().split(/\n/),
        res = [];

    //IcmpMsg: InType3 InType8 InType11 OutType0 OutType3 OutType11
    //IcmpMsg: 224478 93750 3 93750 1084220 21
    //парсим и сохраняем 2 строки: заголовок и сами данные, отрезая первый элемент
    for(var i = 0; i < lines.length - 1; i++) {
        var m1 = lines[i + 0].split(/\s+/),
            m2 = lines[i + 1].split(/\s+/);
        if(m1[0].includes(proto) && m2[0].includes(proto)) {
            m1.shift();
            res.push(m1);
            m2.shift();
            res.push(m2);
            break;
        }
    }
    return res;
};

//тут будут храниться имена таблиц, для которых заголовок уже был создан
var tablesWithTitles = [];

function fillTable(table, startCell, endCell, parsed, helper = {}) {
    //заголовок достаточно создать один раз
    if(!tablesWithTitles.includes(table)) {
        var tit = document.getElementById('%s-table-titles'.format(table));

        //из первого массива создаём заголовок
        for(var i = startCell; i < endCell; i++) {
            var title = parsed[0][i];
            tit.appendChild(E('th', { 'class': 'th', 'data-tooltip': helper ? helper[title] : null }, _(title) ));
        }

        tablesWithTitles.push(table);
    }

    //второй массив - сами данные
    cbi_update_table('#%s'.format(table), [ parsed[1].slice(startCell, endCell) ],
        E('em', _('No entries available'))
    );
};

function fillTables(tables, data, proto, helper = {}) {
    var parsed = parseProto(data, proto);

    if(parsed.length != 2 || parsed[0].length == 0 || parsed[0].length != parsed[1].length || tables.length == 0)
        return;
    //кол-во колонок в одной таблице
    var itemsPerTable = Math.ceil(parsed[0].length / tables.length),
        t = 0;

    for(; t < tables.length - 1; t++)
        fillTable(tables[t], itemsPerTable*t, itemsPerTable*(t+1), parsed, helper);

    //добиваем остатки
    fillTable(tables[t], itemsPerTable*t, parsed[0].length, parsed, helper);
};

function parseSoftnet(s) {
    var lines = s.trim().split(/\n/),
        res = [];

    //total dropped squeezed j1 j2 j3 j4 j5 collision rps flow_limit_count
    //1fdf72e1 0000033d 00000015 00000000 00000000 00000000 00000000 00000000 00000000 11b2ccb4 00000000
    //кол-во строк = кол-ву процессоров
    for(var i = 0; i < lines.length; i++) {
        var m = lines[i].split(/\s+/);
        for(var j=0; j < m.length; j++)
            m[j] = parseInt(m[j], 16);
        m.unshift(i);
        res.push(m);
    }
    return res;
};

function pollMr() {
    return Promise.all([
            fs.trimmed('/proc/net/snmp'),
            fs.trimmed('/proc/net/netstat'),
            fs.trimmed('/proc/net/softnet_stat')
        ]).then(function(data) {
            var snmp = data[0],
                netstat = data[1],
                softnet = data[2];

            //таблицы получаются длинными, разбиваем данные на несколько таблиц
            fillTables(["iptbl", "iptbl2"],                   snmp, "Ip", iphelp);
            fillTables(["ipexttbl", "ipexttbl2"],             netstat, "IpExt", ipexthelp);
            fillTables(["icmptbl", "icmptbl2", "icmptbl3"],   snmp, "Icmp", icmphelp);
            fillTables(["icmpmsgtbl"],                        snmp, "IcmpMsg", icmpmsghelp);
            fillTables(["tcptbl", "tcptbl2"],                 snmp, "Tcp", tcphelp);
            fillTables(["udptbl"],                            snmp, "Udp", udphelp);
            fillTables(["udplite"],                           snmp, "UdpLite");
            fillTables(["tcpexttbl", "tcpexttbl2", "tcpexttbl3",
                       "tcpexttbl4", "tcpexttbl5",
                       "tcpexttbl6", "tcpexttbl7",
                       "tcpexttbl8", "tcpexttbl9",
                       "tcpexttbl10", "tcpexttbl11",
                       "tcpexttbl12" ], netstat, "TcpExt", tcpexthelp);

            var sn_parsed = parseSoftnet(softnet);
            cbi_update_table('#sntbl', sn_parsed,
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
        var sntbl = this.createTable('sntbl',
            //заголовок
            [ 'cpu', 'total', 'dropped', 'squeezed', 'j1', 'j2', 'j3', 'j4', 'j5', 'collision', 'received_rps', 'flow_limit_count' ],
            //tolltips для заголовка
            [ null, 'Number of frames received by the interrupt handler', 'Number of frames dropped due to netdev_max_backlog being exceeded',
            'Number of times ksoftirqd ran out of netdev_budget\nor CPU time when there was still work to be done', null, null, null, null, null,
            'Number of times there is a conflict when obtaining a lock to send a packet', 'Number of times this CPU has been woken up to process packets',
            'Number of times the flow limit has been reached']
        );

        //таблицы создаём с пустым заголовком, он создаётся из заголовка получаемых данных
        var iptbl = this.createTable('iptbl', [ ]);
        var iptbl2 = this.createTable('iptbl2', [ ]);

        var ipexttbl = this.createTable('ipexttbl', [ ]);
        var ipexttbl2 = this.createTable('ipexttbl2', [ ]);

        var icmptbl = this.createTable('icmptbl', [ ]);
        var icmptbl2 = this.createTable('icmptbl2', [ ]);
        var icmptbl3 = this.createTable('icmptbl3', [ ]);

        var icmpmsgtbl = this.createTable('icmpmsgtbl', [ ]);

        var tcptbl = this.createTable('tcptbl', [ ]);
        var tcptbl2 = this.createTable('tcptbl2', [ ]);

        var udptbl = this.createTable('udptbl', [ ]);

        var udplite = this.createTable('udplite', []);

        var tcpexttbl = this.createTable('tcpexttbl', []);
        var tcpexttbl2 = this.createTable('tcpexttbl2', []);
        var tcpexttbl3 = this.createTable('tcpexttbl3', []);
        var tcpexttbl4 = this.createTable('tcpexttbl4', []);
        var tcpexttbl5 = this.createTable('tcpexttbl5', []);
        var tcpexttbl6 = this.createTable('tcpexttbl6', []);
        var tcpexttbl7 = this.createTable('tcpexttbl7', []);
        var tcpexttbl8 = this.createTable('tcpexttbl8', []);
        var tcpexttbl9 = this.createTable('tcpexttbl9', []);
        var tcpexttbl10 = this.createTable('tcpexttbl10', []);
        var tcpexttbl11 = this.createTable('tcpexttbl11', []);
        var tcpexttbl12 = this.createTable('tcpexttbl12', []);

        poll.add(pollMr.bind(this), pollIval);

        var view = E([], [
            E('h2', {}, [ _('SNMP counters') ]),
                E('h3', {}, [ _('Stats from network devices') ]),
                sntbl,

                E('h3', {}, [ _('IP') ]),
                iptbl, iptbl2,

                E('h3', {}, [ _('IP Ext') ]),
                ipexttbl, ipexttbl2,

                E('h3', {}, [ _('UDP') ]),
                udptbl,

                E('h3', {}, [ _('ICMP') ]),
                icmptbl, icmptbl2, icmptbl3,

                E('h3', {}, [ _('ICMP msg') ]),
                icmpmsgtbl,

                E('h3', {}, [ _('TCP') ]),
                tcptbl, tcptbl2,

                E('h3', {}, [ _('TCP Ext') ]),
                tcpexttbl, tcpexttbl2, tcpexttbl3,
                tcpexttbl4, tcpexttbl5, tcpexttbl6,
                tcpexttbl7, tcpexttbl8, tcpexttbl9,
                tcpexttbl10, tcpexttbl11, tcpexttbl12,

                E('h3', {}, [ _('UDP Lite') ]),
                udplite
            ]);

        return view;
    },

    handleSaveApply: null,
    handleSave: null,
    handleReset: null
});
