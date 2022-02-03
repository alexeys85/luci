'use strict';
'require baseclass';
'require fs';

return baseclass.extend({
	title: _('AM335X Features'),

	load: function() {
		return Promise.all([
			fs.read_direct('/tmp/sysinfo/am335x_info.json', 'json'),
			fs.trimmed('/sys/class/mmc_host/mmc1/mmc1:0001/life_time'),
			fs.trimmed('/sys/class/mmc_host/mmc1/mmc1:0001/pre_eol_info')
		]);
	},

	swap32: function(val) {
		return ((val & 0xFF) << 24)
		   | ((val & 0xFF00) << 8)
		   | ((val >> 8) & 0xFF00)
		   | ((val >> 24) & 0xFF);
	},

	reason_str: function(val) {
		if(val & (1 << 0))
			return "Power-on (cold) reset";
		else if(val & (1 << 1))
			return "Global warm software reset";
		else if(val & (1 << 4))
			return "Watchdog1 timer reset";
		else if(val & (1 << 5))
			return "External warm reset event";
		else if(val & (1 << 9))
			return "IcePick reset event";
		else
			return "Unknown reason: 0x%08X".format(val);
	},

	emmcEOL: function(eol) {
		var text = "";
		var color = null
		if(eol == 1)
			text = 'Normal: consumed < 80% of the reserved blocks';
		else if(eol == 2) {
			text = 'Warning: consumed 80% of the reserved blocks';
			color = 'color:orange';
		}
		else if(eol == 3) {
			text = 'Urgent: consumed 90% of the reserved blocks';
			color = 'color:red';
		}
		else
			text = 'undefined';

		return E('td', { 
				'style' : color
				}, _(text) );
	},

	emmcLifeTime: function(s) {
		var m = s.split(/\s+/);

		return { slc : parseInt(m[0], 16),
				 mlc : parseInt(m[1], 16)
				};
	},

	render: function(data) {
		var bootcount = data[0].hasOwnProperty("boot_count_reg") ? 
						this.swap32(+data[0].boot_count_reg) & 0xFFFF : "Unknown";

		var reset_reg = data[0].hasOwnProperty("reset_reason_reg") ? 
						this.reason_str(+data[0].reset_reason_reg) : "Unknown";

		var emmcLt = this.emmcLifeTime(data[1]);
		var emmEol = this.emmcEOL(parseInt(data[2], 16));

		var fields = [
			_('Boot count'),       bootcount,
			_('Reset reason'),     reset_reg,
			_('eMMC life time used for SLC eraseblocks'), '%d - %d\%'.format((emmcLt.slc -1) * 10, emmcLt.slc * 10),
			_('eMMC life time used for MLC eraseblocks'), '%d - %d\%'.format((emmcLt.mlc -1) * 10, emmcLt.slc * 10),
			_('eMMC status for reserved blocks'), emmEol
		];

		var table = E('table', { 'class': 'table' });

		for (var i = 0; i < fields.length; i += 2) {
			table.appendChild(E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td left', 'width': '33%' }, [ fields[i] ]),
				E('td', { 'class': 'td left' }, [ (fields[i + 1] != null) ? fields[i + 1] : '?' ])
			]));
		}

		return table;
	}
});
