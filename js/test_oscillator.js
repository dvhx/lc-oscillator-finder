// For current netlist test oscillator (simulate, measure, write stats.json and gifs)
// linter: ngspicejs-lint
"use strict";

ngspicejs_version(2);

function test_oscillator(aStableTime, aUsableVoltageNodes) {
    // For current netlist test oscillator (simulate, measure, write stats.json)
    //   aStableTime = manually provided time when oscillator becomes stable
    //   aUsableVoltageNodes = array of internal node names which can be used for voltage output

    // count vcc/gnd components from netlist
    var components = {resistor: 0, inductor: 0, capacitor: 0, npn: 0};
    var vcc = {resistor: 0, inductor: 0, capacitor: 0, collector: 0, base: 0, emitter: 0};
    var gnd = {resistor: 0, inductor: 0, capacitor: 0, collector: 0, base: 0, emitter: 0};
    netlist_devices.filter((d) => d.is_net_device).forEach((d) => {
        // get nets
        var n = d.get_nets();

        // r,l,c
        if (['resistor', 'inductor', 'capacitor'].includes(d.type)) {
            components[d.type]++;
            if (n.anode === 'bat') {
                vcc[d.type]++;
            }
            if (n.cathode === 'bat') {
                vcc[d.type]++;
            }
            if (n.anode === 0) {
                gnd[d.type]++;
            }
            if (n.cathode === 0) {
                gnd[d.type]++;
            }
        }
        // npn
        if (d.type === 'npn') {
            components[d.type]++;
            if (n.b === 'bat') {
                vcc.base++;
            }
            if (n.e === 'bat') {
                vcc.emitter++;
            }
            if (n.c === 'bat') {
                vcc.collector++;
            }
            if (n.b === 0) {
                gnd.base++;
            }
            if (n.e === 0) {
                gnd.emitter++;
            }
            if (n.c === 0) {
                gnd.collector++;
            }
        }
    });
    //echo_json(components);
    //echo_json(vcc);
    //echo_json(gnd);
    // run transient analysis
    var t = tran().step('1u').interval('20m').run();
    var stable_index = t.index_at(aStableTime || 0.010);
    // battery current
    var bd = t.data['I(U1)'].slice(stable_index);
    // coil current chart and stats
    t.chart('I(L1.L0)').last_chart.gif('coil_current.gif');
    var cd = t.data['I(L1.L0)'].slice(stable_index);
    var currents = {
        battery: {
            min: bd.min(),
            max: bd.max(),
            avg: -bd.avg(),
            rms: bd.rms(),
            amplitude: bd.amplitude()
        },
        coil: {
            min: cd.min(),
            max: cd.max(),
            avg: cd.avg(),
            rms: cd.rms(),
            amplitude: cd.amplitude()
        }
    };
    // nodes usable for voltage output, we use multiple nodes here because
    // sometimes different nodes have different and more usefull offsets
    // e.g. near middle of rails, or have better/cleaner shape
    t.chart(aUsableVoltageNodes.concat('bat').map((n) => 'V(' + n + ')'),
        {min_y: 0, max_y: 4, max_x: aStableTime}).last_chart.gif('voltages.gif');
    // find their min/max range, offset
    var voltages = {};
    aUsableVoltageNodes.forEach((n) => {
        var d = t.data['V(' + n + ')'].slice(stable_index);
        voltages[n] = {
            min: d.min(),
            max: d.max(),
            avg: d.avg(),
            rms: d.rms(),
            amplitude: d.amplitude()
        };
    });

    // find fundamental frequency
    var f = fft().fstop('100k').interval(0.5).run('I(L1.L0)').chart_db('I(L1.L0)');
    f.last_chart.gif('fft.gif');
    var frequency = f.f0().frequency;
    echo('Fundamental frequency', frequency);

    // now that we know frequency, we can show exactly one halfwave to see shape
    var last_two_cycles = 0.020 - 2 * 1 / frequency;
    t.chart(aUsableVoltageNodes.filter((n) => n !== 'bat').map((n) => 'V(' + n + ')'),
        {min_x: last_two_cycles,
        min_y: 0
        }
    ).last_chart.gif('voltages_detail.gif');
    t.chart(['I(L1.L0)', 'I(U1)'], {min_x: last_two_cycles}).last_chart.gif('coil_current_detail.gif');

    var ret = {
        oscillator: file_name(dir_current().replace(/\/$/, '')),
        components,
        vcc,
        gnd,
        stable_time: aStableTime,
        stable_index,
        currents,
        gain_rms: currents.coil.rms / currents.battery.rms,
        gain_amplitude_avg: currents.coil.amplitude / currents.battery.avg,
        voltages,
        frequency
    };

    file_write_json('stats.json', ret, 4);
    echo('DONE');
    beep();
    return ret;
}

globalThis.exports = test_oscillator;
