'use strict';
'require baseclass';
'require fs';

return baseclass.extend({
	title: _('AM335X Features'),

	load: function() {
		return Promise.all([
            L.resolveDefault(fs.exec('/usr/bin/hexdump', ['-d', '/sys/bus/nvmem/devices/omap_rtc_scratch0/nvmem']), {})
		]);
	},

	render: function(data) {
		var scratch_regs= data[0].stdout;

        //всего 3 регитра, состоящие из 2х-байтовых десятичных чисел,
        //первое и последнне число - столбики смещения, нам же нужно последнее число
        var regs = scratch_regs.trim().split(/\s+/);
        var bootcount = parseInt(regs[6], 10);
        //swap
        bootcount = ((bootcount & 0xFF) << 8) | ((bootcount >> 8) & 0xFF);

		var fields = [
            _('Boot count'),       bootcount
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
