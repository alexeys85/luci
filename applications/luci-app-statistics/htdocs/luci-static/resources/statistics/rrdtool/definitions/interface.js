/* Licensed to the public under the Apache License 2.0. */

'use strict';
'require baseclass';

return baseclass.extend({
	title: _('Interfaces'),

	rrdargs: function(graph, host, plugin, plugin_instance, dtype) {
		/*
		 * traffic diagram
		 */
		var traffic = {

			/* draw this diagram for each plugin instance */
			per_instance: true,
			title: "%H: Transfer on %pi",
			vlabel: "Bits/s",
			number_format: "%5.1lf%sb/s",
			totals_format: "%5.1lf%sb",

			/* diagram data description */
			data: {
				/* defined sources for data types, if omitted assume a single DS named "value" (optional) */
				sources: {
					if_octets: [ "tx", "rx" ]
				},

				/* special options for single data lines */
				options: {
					if_octets__tx: {
						transform_rpn: "8,*",
						total: true,		/* report total amount of bytes */
						color: "00ff00",	/* tx is green */
						title: "Bits (TX)"
					},

					if_octets__rx: {
						transform_rpn: "8,*",
						flip : true,		/* flip rx line */
						total: true,		/* report total amount of bytes */
						color: "0000ff",	/* rx is blue */
						title: "Bits (RX)"
					}
				}
			}
		};

		/*
		 * packet diagram
		 */
		var packets = {

			/* draw this diagram for each plugin instance */
			per_instance: true,
			title: "%H: Packets on %pi",
			vlabel: "Packets/s",
			number_format: "%5.1lf%sP/s",
			totals_format: "%5.1lf%s",

			/* diagram data description */
			data: {
				/* data type order */
				types: [ "if_packets", "if_errors" ],

				/* defined sources for data types */
				sources: {
					if_packets: [ "tx", "rx" ],
					if_errors : [ "tx", "rx" ]
				},

				/* special options for single data lines */
				options: {
					/* processed packets (tx DS) */
					if_packets__tx: {
						weight : 1,
						overlay: true,		/* don't summarize */
						total  : true,		/* report total amount of bytes */
						color  : "00ff00",	/* processed tx is green */
						title  : "Processed (TX)"
					},

					/* processed packets (rx DS) */
					if_packets__rx: {
						weight : 2,
						overlay: true,		/* don't summarize */
						flip   : true,		/* flip rx line */
						total  : true,		/* report total amount of bytes */
						color  : "0000ff",	/* processed rx is blue */
						title  : "Processed (RX)"
					},

					/* packet errors (tx DS) */
					if_errors__tx: {
						weight : 0,
						overlay: true,		/* don't summarize */
						total  : true,		/* report total amount of packets */
						color  : "ff5500",	/* tx errors are orange */
						title  : "Errors    (TX)"
					},

					/* packet errors (rx DS) */
					if_errors__rx: {
						weight : 3,
						overlay: true,		/* don't summarize */
						flip   : true,		/* flip rx line */
						total  : true,		/* report total amount of packets */
						color  : "ff0000",	/* rx errors are red */
						title  : "Errors    (RX)"
					}
				}
			}
		};

		return [ traffic, packets ];
	}
});
