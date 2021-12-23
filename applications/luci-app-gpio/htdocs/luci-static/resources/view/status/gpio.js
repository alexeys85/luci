'use strict';
'require view';
'require fs';
'require poll';
'require ui';

const known_gpio = [
    'code0', 'code1', 'code2', 'code3', 'parity', 'diag',
    'tst4', 'tst6'
];

function parseGpioList(s) {
    var lines = s.trim().split(/\n/),
        res = [];

    //gpio-5   (P9_17 [spi0_cs0]    |code1               ) in  lo IRQ
    //gpio-6   ([mmc0_cd]           |cd                  ) in  lo IRQ ACTIVE LOW
    for(var i = 0; i < lines.length; i++) {
        var m = lines[i].trim().split(/\s+/),
            name = m[0];

        const contains = known_gpio.some(element => {
  			if (lines[i].indexOf(element) !== -1)
    			return true;

  			return false;
		});

		if(!contains)
			continue;

        var line_name = m[1].substring(1),
            label,
            dir,
            val,
            details = "",
            j;
        if(m[2].charAt(0) == '[') {
            line_name += ' ' + m[2];
            j = 3;
        } else {
            j = 2;
        }
        label = m[j++].substring(1);
        dir = m[++j].toUpperCase();
        val = m[++j].toUpperCase();
        for (j++; j < m.length; j++) {
            details += m[j];
        }

        res.push([
            name, line_name, label, dir, val, details
        ]);

        if(res.length === known_gpio.length)
            break;
    }

    return res;
};

function pollGp() {
    return Promise.all([
            fs.read_direct('/sys/kernel/debug/gpio', 'text')
        ]).then(function(data) {
            var gpio_list = data[0];

            var res = parseGpioList(gpio_list);

            cbi_update_table('#gpiotbl', res,
                E('em', _('No entries available'))
            );
        });
};

return view.extend({
    createTable: function(id, title) {
        var titlehdr = E('tr', { 'class': 'tr table-titles' });
        for(var i = 0; i < title.length; i++)
            titlehdr.appendChild(E('th', { 'class': 'th' }, _(title[i]) ));

        var tbl = E('table', { 'class': 'table', 'id' : id });
        tbl.appendChild(titlehdr);
        return tbl;
    },

    render: function() {
        var gpiotbl = this.createTable('gpiotbl', [
            'Name', 'Line name', 'Label', 'Direction', 'Value', 'Details'
        ]);

        poll.add(pollGp.bind(this), 2);

        var view = E([], [
            E('h2', {}, [ _('GPIO lines state') ]),
                gpiotbl
        ]);

        return view;
    },

    handleSaveApply: null,
    handleSave: null,
    handleReset: null
});
