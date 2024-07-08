// Return LCCRT oscillator signature, e.g. CB.VB.VC.VB.VB.VBE
// It defines where are LCCRT components connected
// C=collector, B=base, E=emitter, V=battery, G=ground
// linter: ngspicejs-lint
"use strict";

var known_signatures = {
    "BC.BG.CG.BV.CBG": "LCCRT1",
    "BC.BG.CG.CV.CBG": "LCCRT2",
    "BC.BG.CV.BV.CBG": "LCCRT3",
    "BC.BG.CV.CV.CBG": "LCCRT4",
    "BC.BV.CG.BV.CBG": "LCCRT5",
    "BC.BV.CG.CV.CBG": "LCCRT6",
    "BC.BV.CV.BV.CBG": "LCCRT7",
    "BC.BV.CV.CV.CBG": "LCCRT8",
    "BV.BE.EG.EG.VBE": "LCCRT9",
    "BV.BE.EV.EG.VBE": "LCCRT10",
    "CV.CE.EG.EG.CVE": "LCCRT11",
    "CV.CE.EV.EG.CVE": "LCCRT12"
};

function lccrt_signature() {
    // Return LCCRT oscillator signature, e.g. CB.VB.VC.VB.VB.VBE
    var ss = netlist_devices.filter((d) => d.is_net_device).map((d) => d.attr.name).sort().join(',');
    if (ss !== 'C1,C2,L1,R1,T1,U1') {
        return 'NOT LCCRT';
    }
    var l1 = netlist_devices.find((d) => d.attr.name === 'L1');
    var c1 = netlist_devices.find((d) => d.attr.name === 'C1');
    var c2 = netlist_devices.find((d) => d.attr.name === 'C2');
    var r1 = netlist_devices.find((d) => d.attr.name === 'R1');
    var t1 = netlist_devices.find((d) => d.attr.name === 'T1');
    var names = {
        "bat": "V",
        "collector": "C",
        "base": "B",
        "emitter": "E",
        "0": "G"
    };
    var ret = [
        [names[l1.attr.anode], names[l1.attr.cathode]].sort().join(''),
        [
            [names[c1.attr.anode], names[c1.attr.cathode]].sort().join(''),
            [names[c2.attr.anode], names[c2.attr.cathode]].sort().join(''),
        ].sort().join('.'),
        [names[r1.attr.anode], names[r1.attr.cathode]].sort().join(''),
        [names[t1.attr.c], names[t1.attr.b], names[t1.attr.e]].join(''),
    ];
    ret = ret.join('.');
    return ret + (known_signatures[ret] ? ' (' + known_signatures[ret] + ')' : '');
}

globalThis.exports = lccrt_signature;
