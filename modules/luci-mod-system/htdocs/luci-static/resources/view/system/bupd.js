'use strict';
'require view';
'require form';
'require fs';
'require uci';
'require rpc';

return view.extend({
	load: function() {
		return Promise.all([
			L.resolveDefault(fs.trimmed('/sys/devices/system/cpu/cpu0/cpufreq/scaling_available_governors')),
			uci.load('bupd')
		])
	},

	render: function(data) {
		var m, s, o, govs=data[0].split(' ');

		m = new form.Map('bupd', _('BUPD configuration'), _(''));

		s = m.section(form.NamedSection, 'main', 'bupd', _(''));
		s.anonymous = false;
		s.addremove = false;

		o = s.option(form.Value, 'mbt_conf_path', _('MBT configuration directory'), _('Path to MBT configuration scripts/files'));
		o.readonly    = false;

		o = s.option(form.Value, 'net_conf_path', _('Network configuration directory'), _('Path to network configuration scripts/files'));
		o.readonly    = false;

		o = s.option(form.Value, 'smc_conf_path', _('SMCRoute configuration directory'), _('Path to SMCRoute configuration scripts/files'));
		o.readonly    = false;

		o = s.option(form.Value, 'fw_conf_path', _('Firewall configuration directory'), _('Path to firewall configuration scripts/files'));
		o.readonly    = false;

		o = s.option(form.ListValue, 'force_role', _('Force role'), _('Force specific role regardless of the GPIO signals'));
		uci.sections('bupd', 'role').forEach(function(val, index) {
			o.value(val['.name']);
		});
		o.value('')
		o.readonly    = false;
		o.default     = '';

		o = s.option(form.Value, 'role_file', _('Role file'), _('Full path to file with active role'));
		o.readonly    = false;

		o = s.option(form.ListValue, 'cpu_governer', _('CPU governor'), _('Scaling governors implement the algorithms to compute the desired CPU frequency'));
		govs.forEach((gov) => {
  			o.value(gov)
		});
		o.readonly    = false;

		s = m.section(form.GridSection, 'role', 'Known roles');
		s.anonymous = false;
		s.addremove = false;
		s.sortable = false;
		s.nodescriptions = false;

		o = s.option(form.Flag, 'run_mbt', _('Run MBT'));
		o.default  = o.disabled;

		o = s.option(form.Flag, 'run_smc', _('Run SMCRoute'));
		o.default  = o.disabled;

		o = s.option(form.Flag, 'run_ptp', _('Run PTP'));
		o.default  = o.disabled;

		o = s.option(form.Flag, 'adv1000', _('Enable 1000M'));
		o.default  = o.disabled;

		o = s.option(form.Value, 'gpio_code', _('GPIO code'));
		o.readonly    = false;

		o = s.option(form.Value, 'num', _('Direction'));
		o.readonly    = false;

		o = s.option(form.Value, 'net_conf', _('Net conf file'));
		o.readonly    = false;

		o = s.option(form.Value, 'fw_conf', _('Fw conf file'));
		o.readonly    = false;

		o = s.option(form.Value, 'smc_conf', _('SMCRoute conf file'));
		o.readonly    = false;

		return m.render();
	}
});
