'use strict';
'require view';
'require fs';
'require poll';
'require ui';

const pollIval = 2;

//https://www.rfc-editor.org/rfc/rfc1213
const iphelp = [
    {key : 'Forwarding', text : '1 - acting as router, 2 - NOT acting as router', err : false},
    {key : 'DefaultTTL' , text : 'The default value inserted into the Time-To-Live field of\nthe IP header of datagrams originated at this entity', err : false},
    {key : 'InReceives', text : 'The total number of input datagrams received from\ninterfaces, including those received in error', err : false},
    {key : 'InDelivers', text : 'The total number of input datagrams successfully\ndelivered to IP user-protocols (including ICMP)', err : false},
    {key : 'ForwDatagrams', text : 'The number of input datagrams for which this\nentity was not their final IP destination, as a\nresult of which an attempt was made to find a\nroute to forward them to that final destination', err : false},
    {key : 'InAddrErrors' , text : 'The number of input datagrams discarded because\nthe IP address in their IP header\'s destination\nfield was not a valid address to be received at\nthis entity', err : true},
    {key : 'InDiscards' , text : 'The number of input IP datagrams for which no\nproblems were encountered to prevent their\ncontinued processing, but which were discarded\n(e.g., for lack of buffer space)', err : true},
    {key : 'OutRequests' , text : 'The total number of IP datagrams which local IP\nuser-protocols (including ICMP) supplied to IP in requests for transmission', err : false},
    {key : 'OutNoRoutes' , text : 'The number of IP datagrams discarded because\nno route could be found to transmit them to their destination', err : true},
    {key : 'FragCreates' , text : 'The number of IP datagram fragments that have been\ngenerated as a result of fragmentation at this entity', err : false},
    {key : 'FragFails' , text : 'The number of IP datagrams that have been discarded because\nthey needed to be fragmented at this entity but could not be,\ne.g., because their Don\'t Fragment flag was set', err : true},
    {key : 'FragOKs' , text : 'The number of IP datagrams that have been successfully fragmented at this entity', err : false},
    {key : 'InHdrErrors' , text : 'The number of input datagrams discarded due to\nerrors in their IP headers, including bad checksums,\nversion number mismatch, other format errors, time-to-live exceeded,\nerrors discovered in processing their IP options, etc', err : true},
    {key : 'InUnknownProtos' , text : 'The number of locally-addressed datagrams\nreceived successfully but discarded because of an\nunknown or unsupported protocol', err : true},
    {key : 'OutDiscards' , text : 'The number of output IP datagrams for which\nno problem was encountered to prevent their transmission\nto their destination, but which were discarded\n(e.g., for lack of buffer space)', err : true},
    {key : 'ReasmFails' , text : 'The number of failures detected by the IP\nre-assembly algorithm (for whatever reason: timed out, errors, etc)', err : true},
    {key : 'ReasmOKs' , text : 'The number of IP datagrams successfully re-assembled', err : false},
    {key : 'ReasmReqds' , text : 'The number of IP fragments received which needed\nto be reassembled at this entity', err : false},
    {key : 'ReasmTimeout' , text : 'The maximum number of seconds which received\nfragments are held while they are awaiting\nreassembly at this entity', err : true}
];

//https://datatracker.ietf.org/doc/html/draft-ietf-ipv6-rfc2011-update-10
const ipexthelp = [
    {key : 'InNoRoutes', text : 'The number of input IP datagrams discarded because\nno route could be found to transmit them to their destination', err : true},
    {key : 'InTruncatedPkts', text : 'The number of input IP datagrams discarded because\nthe datagram frame didn\'t carry enough data', err : true},
    {key : 'InMcastPkts', text : 'The number of IP multicast datagrams received', err : false},
    {key : 'OutMcastPkts', text : 'The number of IP multicast datagrams transmitted', err : false},
    {key : 'InBcastPkts', text : 'The number of IP broadcast datagrams received', err : false},
    {key : 'OutBcastPkts', text : 'The number of IP broadcast datagrams transmitted', err : false},
    {key : 'InOctets', text : 'The total number of octets received in input IP datagrams,\nincluding those received in error', err : false},
    {key : 'OutOctets', text : 'The total number of octets in IP datagrams\nto the lower layers for transmission', err : false},
    {key : 'InMcastOctets', text : 'The total number of octets received in IP multicast datagrams', err : false},
    {key : 'OutMcastOctets', text : 'The total number of octets transmitted in IP multicast datagrams', err : false},
    {key : 'InNoECTPkts', text : 'Number of packets received with NOECT', err : false},
    {key : 'InECT1Pkts', text : 'Number of packets received with ECT(1)', err : false},
    {key : 'InECT0Pkts', text : 'Number of packets received with ECT(0)', err : false},
    {key : 'InCEPkts', text : 'Number of packets received with Congestion Experimented', err : false},
    {key : 'InCsumErrors', text : 'Total number of IP Packets with checksum errors', err : true},
    {key : 'InBcastOctets', text : 'The total number of octets received in IP broadcast datagrams', err : false},
    {key : 'OutBcastOctets', text : 'The total number of octets transmitted in IP broadcast datagrams', err : false},
    {key : 'ReasmOverlaps', text : 'The total number of discarded datagrams with overlapping segments', err : true}
];

const udphelp = [
    {key : 'InDatagrams', text : 'The total number of UDP datagrams delivered to UDP users', err : false},
    {key : 'NoPorts', text : 'The total number of received UDP datagrams for\nwhich there was no application at the destination port', err : true},
    {key : 'InErrors', text : 'The number of received UDP datagrams that could\nnot be delivered for reasons other than the lack\nof an application at the destination port', err : true},
    {key : 'OutDatagrams', text : 'The total number of UDP datagrams sent from this entity', err : false},
    {key : 'RcvbufErrors', text : 'Increased when memory cannot be allocated to process an incoming UDP packet', err : true},
    {key : 'SndbufErrors', text : 'Increased when memory cannot be allocated to send an UDP packet', err : true},
    {key : 'InCsumErrors', text : 'Increased when a received UDP packet has an invalid checksum', err : true}
];

const icmphelp = [
    {key : "InAddrMaskReps", text : "The number of ICMP Address Mask Reply messages received", err : false},
    {key : "InAddrMasks", text : "The number of ICMP Address Mask Request messages received", err : false},    
    {key : "InDestUnreachs", text : "The number of ICMP Destination Unreachable messages received", err : false},
    {key : "InEchoReps", text : "The number of ICMP Echo Reply messages received", err : false},
    {key : "InEchos", text : "The number of ICMP Echo (request) messages received", err : false},
    {key : "InErrors", text : "The number of ICMP messages which the entity\nreceived but determined as having ICMP-specific\nerrors (bad ICMP checksums, bad length, etc.)", err : true},
    {key : "InMsgs", text : "The total number of ICMP messages which the\nentity received. Note that this counter includes\nall those counted by icmpInErrors", err : false},
    {key : "InParmProbs", text : "The number of ICMP Parameter Problem messages received", err : false}, 
    {key : "InRedirects", text : "The number of ICMP Redirect messages received", err : false},
    {key : "InSrcQuenchs", text : "The number of ICMP Source Quench messages received", err : false},
    {key : "InTimeExcds", text : "The number of ICMP Time Exceeded messages received", err : false},
    {key : "InTimestampReps", text : "The number of ICMP Timestamp Reply messages received", err : false},
    {key : "InTimestamps", text : "The number of ICMP Timestamp (request) messages received", err : false},
    {key : "OutAddrMaskReps", text : "The number of ICMP Address Mask Reply messages sent", err : false},
    {key : "OutAddrMasks", text : "The number of ICMP Address Mask Request messages sent", err : false},
    {key : "OutDestUnreachs", text : "The number of ICMP Destination Unreachable messages sent", err : false},
    {key : "OutEchoReps", text : "The number of ICMP Echo Reply messages sent", err : false},
    {key : "OutEchos", text : "The number of ICMP Echo (request) messages sent", err : false},
    {key : "OutErrors", text : "The number of ICMP messages which this entity did\nnot send due to problems discovered within ICMP\nsuch as a lack of buffers", err : true},
    {key : "OutMsgs", text : "The total number of ICMP messages which this\nentity attempted to send. Note that this counter\nincludes all those counted by icmpOutErrors", err : false},
    {key : "OutParmProbs", text : "The number of ICMP Parameter Problem messages sent", err : false},
    {key : "OutRedirects", text : "The number of ICMP Redirect messages sent", err : false},
    {key : "OutSrcQuenchs", text : "The number of ICMP Source Quench messages sent", err : false},
    {key : "OutTimeExcds", text : "The number of ICMP Time Exceeded messages sent", err : false},
    {key : "OutTimestampReps", text : "The number of ICMP Timestamp Reply messages sent", err : false},
    {key : "OutTimestamps", text : "The number of ICMP Timestamp (request) messages sent", err : false},
    {key : "InCsumErrors", text : "This counter indicates the checksum of the ICMP packet is\nwrong. Kernel verifies the checksum after\nupdating the IcmpInMsgs and before updating IcmpMsgInType", err : true}
];

const icmpmsghelp = [
    {key : 'InType3', text : 'Destination Unreachable', err : false},
    {key : 'InType8', text : 'Echo request', err : false},
    {key : 'InType11', text : 'Time Exceeded', err : false},
    {key : 'OutType0', text : 'Echo Reply', err : false},
    {key : 'OutType3', text : 'Destination Unreachable', err : false},
    {key : 'OutType8', text : 'Echo request', err : false},
    {key : 'OutType11', text : 'Time Exceeded', err : false}
];

const tcphelp = [
    {key : "ActiveOpens", text : "The number of times TCP connections have made a\ndirect transition to the SYN-SENT state from the\nCLOSED state", err : false},
    {key : "RtoMin", text : "The minimum value permitted by a TCP\nimplementation for the retransmission timeout, ms", err : false},
    {key : "RtoMax", text : "The maximum value permitted by a TCP\nimplementation for the retransmission timeout, ms", err : false},
    {key : "MaxConn", text : "The limit on the total number of TCP connections\nthe entity can support\n-1 - maximum number of connections is dynamic", err : false},
    {key : "AttemptFails", text : "failed connection attempts", err : true},
    {key : "CurrEstab", text : "The number of TCP connections for which the\ncurrent state is either ESTABLISHED or CLOSE-WAIT", err : false},
    {key : "EstabResets", text : "The number of times TCP connections have made\na direct transition to the CLOSED state from either\nthe ESTABLISHED state or the CLOSE-WAIT state", err : false},
    {key : "InErrs", text : "The total number of segments received in error\n(e.g., bad TCP checksums)", err : true},
    {key : "InSegs", text : "The total number of segments received, including\nthose received in error", err : false},
    {key : "OutRsts", text : "The number of TCP segments sent containing the RST flag", err : false},
    {key : "OutSegs", text : "The total number of segments sent, including\nthose on current connections but excluding those\ncontaining only retransmitted octets", err : false},
    {key : "PassiveOpens", text : "The number of times TCP connections have made a\ndirect transition to the SYN-RCVD state from the\nLISTEN state", err : false},
    {key : "RetransSegs", text : "The total number of segments retransmitted", err : false},
    {key : "RtoAlgorithm", text : "Algorithm used to determine the timeout value\nused for retransmitting unacknowledged octets:\n1 - other, 2 - const, 3 - rsre, 4 - vanj, 5 - rfc2988", err : false},
    {key : "InCsumErrors", text : "Increased when a TCP packet received has an incorrect checksum", err : true}
];

const tcpexthelp = [
    {key : "DelayedACKLocked", text : "delayed acks further delayed because of locked socket", err : false},
    {key : "DelayedACKLost", text : "Quick ack mode was activated times", err : false},
    {key : "DelayedACKs", text : "delayed acks sent", err : false},
    {key : "EmbryonicRsts", text : "resets received for embryonic SYN_RECV sockets", err : false},
    {key : "ListenDrops", text : "SYNs to LISTEN sockets dropped", err : false},
    {key : "ListenOverflows", text : "times the listen queue of a socket overflowed", err : true},
    {key : "LockDroppedIcmps", text : "ICMP packets dropped because socket was locked", err : false},
    {key : "OfoPruned", text : "packets dropped from out-of-order queue because of socket buffer overrun", err : true},
    {key : "OutOfWindowIcmps", text : "ICMP packets dropped because they were out-of-window", err : false},
    {key : "PAWSActive", text : "active connections rejected because of time stamp", err : false},
    {key : "PAWSEstab", text : "packets rejected in established connections because of timestamp", err : false},
    {key : "PAWSPassive", text : "passive connections rejected because of time stamp", err : false},
    {key : "PruneCalled", text : "packets pruned from receive queue because of socket buffer overrun", err : true},
    {key : "RcvPruned", text : "packets pruned from receive queue", err : false},
    {key : "SockMallocOOM", text : "Ran times out of system memory during packet sending", err : true},
    {key : "SyncookiesFailed", text : "invalid SYN cookies received", err : true},
    {key : "SyncookiesRecv", text : "SYN cookies received", err : false},
    {key : "SyncookiesSent", text : "SYN cookies sent", err : false},
    {key : "TCPAbortFailed", text : "times unable to send RST due to no memory", err : true},
    {key : "TCPAbortOnClose", text : "connections reset due to early user close", err : false},
    {key : "TCPAbortOnData", text : "connections reset due to unexpected data", err : false},
    {key : "TCPAbortOnLinger", text : "connections aborted after user close in linger timeout", err : false},
    {key : "TCPAbortOnMemory", text : "connections aborted due to memory pressure", err : true},
    {key : "TCPAbortOnSyn", text : "connections reset due to unexpected SYN", err : false},
    {key : "TCPAbortOnTimeout", text : "connections aborted due to timeout", err : true},
    {key : "TCPDirectCopyFromBacklog", text : "bytes directly in process context from backlog", err : false},
    {key : "TCPDirectCopyFromPrequeue", text : "bytes directly received in process context from prequeue", err : false},
    {key : "TCPDSACKOfoRecv", text : "DSACKs for out of order packets received", err : false},
    {key : "TCPDSACKOfoSent", text : "DSACKs sent for out of order packets", err : false},
    {key : "TCPDSACKOldSent", text : "DSACKs sent for old packets", err : false},
    {key : "TCPDSACKRecv", text : "DSACKs received", err : false},
    {key : "TCPDSackUndo", text : "congestion window recovered without slow start using DSACK", err : false},
    {key : "TCPDSACKUndo", text : "congestion windows recovered without slow start by DSACK", err : false},
    {key : "TCPFACKReorder", text : "Detected reordering times using FACK", err : false},
    {key : "TCPFastRetrans", text : "fast retransmits", err : false},
    {key : "TCPForwardRetrans", text : "forward retransmits", err : false},
    {key : "TCPFullUndo", text : "congestion windows fully recovered without slow start", err : false},
    {key : "TCPHPAcks", text : "predicted acknowledgments", err : false},
    {key : "TCPHPHits", text : "packet headers predicted", err : false},
    {key : "TCPHPHitsToUser", text : "packet headers predicted and directly queued to user", err : false},
    {key : "TCPLossFailures", text : "timeouts in loss state", err : false},
    {key : "TCPLoss", text : "TCP data loss events", err : true},
    {key : "TCPLossUndo", text : "congestion windows recovered without slow start after partial ack", err : false},
    {key : "TCPLostRetransmits", text : "retransmits lost", err : true},
    {key : "TCPMemoryPressures", text : "TCP ran low on memory times", err : true},
    {key : "TCPPartialUndo", text : "congestion windows partially recovered using Hoe heuristic", err : false},
    {key : "TCPPrequeued", text : "packets directly queued to recvmsg prequeue", err : false},
    {key : "TCPPrequeueDropped", text : "packets dropped from prequeue", err : true},
    {key : "TCPPureAcks", text : "acknowledgments not containing data payload received", err : false},
    {key : "TCPRcvCollapsed", text : "packets collapsed in receive queue due to low socket buffer", err : false},
    {key : "TCPRenoFailures", text : "timeouts after reno fast retransmit", err : false},
    {key : "TCPRenoRecoveryFailed", text : "reno fast retransmits failed", err : false},
    {key : "TCPRenoRecoveryFail", text : "classic Reno fast retransmits failed", err : false},
    {key : "TCPRenoRecovery", text : "times recovered from packet loss due to fast retransmit", err : false},
    {key : "TCPRenoReorder", text : "Detected reordering times using reno fast retransmit", err : false},
    {key : "TCPSackFailures", text : "timeouts after SACK recovery", err : false},
    {key : "TCPSackRecoveryFail", text : "SACK retransmits failed", err : true},
    {key : "TCPSackRecovery", text : "times recovered from packet loss by selective acknowledgements", err : false},
    {key : "TCPSACKReneging", text : "bad SACK blocks received", err : false},
    {key : "TCPSACKReorder", text : "Detected reordering times using SACK", err : false},
    {key : "TCPSchedulerFailed", text : "times receiver scheduled too late for direct processing", err : false},
    {key : "TCPSlowStartRetrans", text : "retransmits in slow start", err : false},
    {key : "TCPTimeouts", text : "other TCP timeouts", err : true},
    {key : "TCPTSReorder", text : "Detected reordering times using time stamp", err : false},
    {key : "TWKilled", text : "TCP sockets finished time wait in slow timer", err : false},
    {key : "TW", text : "TCP sockets finished time wait in fast timer", err : false},
    {key : "TWRecycled", text : "time wait sockets recycled by time stamp", err : false}
];

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

function findByKey(helper, key) {
    if(!helper)
        return null;

    for(var i=0; i < helper.length; i++) {
        if(helper[i].key == key)
            return { text : helper[i].text, err : helper[i].err };
    }

    return null;
};

//тут будут храниться имена таблиц, для которых заголовок уже был создан
var tablesWithTitles = [];

function fillTable(table, startCell, endCell, parsed, helper = null) {
    //заголовок достаточно создать один раз
    if(!tablesWithTitles.includes(table)) {
        var tit = document.getElementById('%s-table-titles'.format(table));

        //из первого массива создаём заголовок
        for(var i = startCell; i < endCell; i++) {
            var title = parsed[0][i],
                desc = findByKey(helper, title);

            tit.appendChild(E('th', { 
                'class': 'th', 
                'style' : desc ? (desc.err ? 'color:red' : null) : null, 
                'data-tooltip': desc ? desc.text : null 
                }, _(title) ));
        }

        tablesWithTitles.push(table);
    }

    //второй массив - сами данные
    cbi_update_table('#%s'.format(table), [ parsed[1].slice(startCell, endCell) ],
        E('em', _('No entries available'))
    );
};

function fillTables(tables, data, proto, helper = null) {
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
