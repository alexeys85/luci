'use strict';
'require baseclass';
'require fs';
'require uci';
'require form';

return baseclass.extend({
	title: _('Nftables Plugin Configuration'),
	description: _('The nftables plugin will monitor selected firewall rules and collect information about processed bytes and packets per rule.'),

	addFormOptions: function(s) {
		var o, ss;

		o = s.option(form.Flag, 'enable', _('Enable this plugin'));
	},

	configSummary: function(section) {
		return _('Rule monitoring enabled');
	}
});
