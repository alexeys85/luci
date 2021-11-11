/* Licensed to the public under the Apache License 2.0. */

'use strict';
'require baseclass';

return baseclass.extend({
	title: _('Firewall'),

	rrdargs: function(graph, host, plugin, plugin_instance, dtype) {
		return [{
			title: "%H: Firewall: Processed bits in %pi",
			vlabel: "Bits/s",
			number_format: "%5.1lf%sb/s",
			totals_format: "%5.1lf%sb",
			data: {
				types: [ "ipt_bytes" ],
				options: {
					ipt_bytes: {
						total: true,
						title: "%di",
						transform_rpn: "8,*"
					}
				}
			}
		}, {
			title: "%H: Firewall: Processed packets in %pi",
			vlabel: "Packets/s",
			number_format: "%5.1lf%sP/s",
			totals_format: "%5.1lf%s",
			data: {
				types: [ "ipt_packets" ],
				options: {
					ipt_packets: {
						total: true,
						title: "%di"
					}
				}
			}
		}];
	}
});
