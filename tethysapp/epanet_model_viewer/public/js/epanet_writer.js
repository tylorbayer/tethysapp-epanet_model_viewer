const opts = {units:'Units\t\t', headloss:'Headloss\t', specific:'Specific Gravity', viscosity:'Viscosity\t', trials:'Trials\t\t',
    accuracy:'Accuracy\t', checkfreq:'CHECKFREQ\t', maxcheck:'MAXCHECK\t', damplimit:'DAMPLIMIT\t', unbalanced:'Unbalanced\t',
    pattern:'Pattern\t', demand:'Demand Multiplier', emitter:'Emitter Exponent', quality:'Quality\t', diffusivity:'Diffusivity\t',
    tolerance:'Tolerance\t', map:'Map\t'};

const tims = {duration:'Duration\t', hydraulic:'Hydraulic Timestep', quality:'Quality Timestep', pattern:['Pattern Timestep',
        'Pattern Start\t'], report:['Report Timestep', 'Report Start\t'], start:'Start ClockTime', statistic:'Statistic\t'};


function EPANET_Writer(model) {
    let file_text = "";

    let titleText = "[TITLE]\n";
    let junctText = "[JUNCTIONS]\n;ID\t\t\tElev\t\tDemand\t\tPattern\n";
    let resText = "[RESERVOIRS]\n;ID\t\t\tHead\t\tPattern\n";
    let tankText = "[TANKS]\n;ID\t\t\tElevation\tInitLevel\tMinLevel\tMaxLevel\tDiameter\tMinVol\t\tVolCurve\n";
    let pipeText = "[PIPES]\n;ID\t\t\tNode1\t\t\tNode2\t\t\tLength\t\tDiameter\tRoughness\tMinorLoss\tStatus\n";
    let pumpText = "[PUMPS]\n;ID\t\t\tNode1\t\t\tNode2\t\t\tParameters\n";
    let valvText = "[VALVES]\n;ID\t\t\tNode1\t\t\tNode2\t\t\tDiameter\tType\tSetting\t\tMinorLoss\n";
    let tagText = "[TAGS]\n";
    let demandText = "[DEMANDS]\n;Junction\tDemand\tPattern\tCategory\n";
    let statusText = "[STATUS]\n;ID\tStatus/Setting\n";
    let patternText = "[PATTERNS]\n;ID\tMultipliers;\n";
    let curvText = "[CURVES]\n;ID\tX-Value\tY-Value\n";
    let controlText = "[CONTROLS]\n";
    let ruleText = "[RULES]\n";
    let energyText = "[ENERGY]\n";
    let emmitText = "[EMITTERS]\n;Junction\tCoefficient\n";
    let qualText = "[QUALITY]\n;Node\t\tInitQual\n";
    let sourceText = "[SOURCES]\n;Node\tType\tQuality\tPattern\t\n";
    let react1Text = "[REACTIONS]\n;Type\tPipe/Tank\tCoefficient\n";
    let react2Text = "[REACTIONS]\n";
    let mixText = "[MIXING]\n;Tank\tModel\n";
    let timeText = "[TIMES]\n";
    let reportText = "[REPORT]\n";
    let optText = "[OPTIONS]\n";
    let coordText = "[COORDINATES]\n;Node\t\t\tX-Coord\t\t\tY-Coord\n";
    let vertText = "[VERTICES]\n;Link\t\t\tX-Coord\t\t\tY-Coord\n";
    let labelText = "[LABELS]\n;X-Coord\tY-Coord\tLabel & Anchor Node\n";
    let backText = "[BACKDROP]\n";
    let endText = "[END]";

    let nodes = model.nodes;
    let edges = model.edges;
    let patterns = model.patterns;
    let options = model.options;
    let times = model.times;
    let report = model.report;
    let curves = model.curves;
    let quality = model.quality;
    let reactions = model.reactions;
    let backdrop = model.backdrop;
    let energy = model.energy;

    titleText += model.title.join('\n') + '\n\n';

    nodes.forEach(function (node) {
        if (node.epaType === "Junction") {
            junctText += ' ' + node.epaId + '\t\t\t' + node.values.slice(0, 3).join('\t\t') + '\t\t\t;\n';
            popNodeCoord(node);
        }
        else if (node.epaType === "Reservoir") {
            resText += ' ' + node.epaId + '\t\t\t' + node.values.slice(0, 2).join('\t\t') + '\t\t\t;\n';
            popNodeCoord(node);
        }
        else if (node.epaType === "Tank") {
            tankText += ' ' + node.epaId + '\t\t\t' + node.values.slice(0, 7).join('\t\t') + '\t\t\t;\n';
            popNodeCoord(node);
        }
        else if (node.epaType === "Label") {
            labelText += " " +  node.x + '\t\t' + -1 * node.y + '\t\t' + node.label + '\n'
        }
        else {
            vertText += ' ' + node.epaId.split(' ')[0] + '\t\t' + node.x + '\t\t' + -1 * node.y + '\n';
        }
        if (node.tags) {
            for (let i in node.tags) {
                tagText += " NODE\t\t" + node.epaId + '\t\t' + node.tags[i] + '\n';
            }
        }
        if (node.demands) {
            for (let i in node.demands) {
                demandText += ' ' + node.epaId + '\t\t' + node.demands[i].join('\t\t') + '\n';
            }
        }
    });

    junctText += '\n';
    resText += '\n';
    tankText += '\n';
    vertText += '\n';
    labelText += '\n';
    coordText += '\n';

    edges.forEach(function (edge) {
        edge.source = nodes.find(node => edge.source === node.id).epaId;
        edge.target = nodes.find(node => edge.target === node.id).epaId;

        if (edge.epaType === "Pipe") {
            pipeText += ' ' + edge.epaId + '\t\t\t' + edge.source + '\t\t\t' + edge.target + '\t\t\t' + edge.values.join('\t\t') + '\t;\n';
        }
        else if (edge.epaType === "Pump") {
            pumpText += ' ' + edge.epaId + '\t\t\t' + edge.source + '\t\t\t' + edge.target + '\t\t\t' + edge.values.join(' ') + '\t;\n';
        }
        else {
            valvText += ' ' + edge.epaId + '\t\t\t' + edge.source + '\t\t\t' + edge.target + '\t\t\t' + edge.values[0] + '\t\t' +
                edge.values[1] + '\t' + edge.values[2] + '\t\t' + edge.values[3] + '\t\t;\n';
        }
        if (edge.tags) {
            for (let i in edge.tags) {
                tagText += " LINK\t\t" + edge.epaId + '\t\t' + edge.tags[i] + '\n';
            }
        }
    });

    pipeText += '\n';
    pumpText += '\n';
    valvText += '\n';

    for (let key in patterns) {
        patternText += ' ' + key + '\t' +  patterns[key].join('\t') + '\n';
    }

    for (let key in options) {
        if(key === "unbalanced" || key === "quality" || key === "hydraulics")
            optText += ' ' + opts[key] + '\t' + options[key][0] + ' ' + options[key][1] + '\n';
        else
            optText += ' ' + opts[key] + '\t' + options[key] + '\n';
    }

    for (let key in times) {
        if (key === "start")
            timeText += ' ' + tims[key] + '\t' + times[key][0] + ' ' + times[key][1] + '\n';
        else if (key === 'pattern' || key === 'report') {
            timeText += ' ' + tims[key][0] + '\t' + times[key][0] + '\n' + ' ' + tims[key][1] + '\t' + times[key][1] + '\n';
        }
        else
            timeText += ' ' + tims[key] + '\t' + times[key] + '\n';
    }

    for (let key in report) {
        reportText += ' ' + key + '\t\t' + report[key] + '\n';
    }

    for (let key in curves) {
        curvText += ';' + curves[key]['type'] + ': \n';
        curvText += ' ' + key + '\t' + curves[key]['values'].join('\t') + '\n';
    }

    for (let key in quality) {
        qualText += ' ' + key + '\t\t' + quality[key] + '\n';
    }

    for (let key in reactions) {
        react2Text += ' ' + key + '\t\t' + reactions[key] + '\n';
    }

    for (let key in backdrop) {
        backText += ' ' + key + '\t\t' + backdrop[key].join('\t') + '\n';
    }

    for (let key in energy) {
        energyText += ' ' + key + '\t\t' + energy[key] + '\n';
    }

    qualText += '\n';
    optText += '\n';
    tagText += '\n';
    demandText += '\n';
    statusText += '\n';
    patternText += '\n';
    curvText += '\n';
    controlText += '\n';
    ruleText += '\n';
    energyText += '\n';
    emmitText += '\n';
    sourceText += '\n';
    react1Text += '\n';
    react2Text += '\n';
    mixText += '\n';
    timeText += '\n';
    reportText += '\n';
    backText += '\n';
    endText += '\n';

    file_text += titleText + junctText + resText + tankText + pipeText + pumpText + valvText + tagText + demandText + statusText +
        patternText + curvText + controlText + ruleText + energyText + emmitText + qualText + sourceText + react1Text + react2Text +
        mixText + timeText + reportText + optText + coordText + vertText + labelText + backText + endText;

    this.getFile = function() {
        return file_text;
    };

    function popNodeCoord(node) {
        coordText += ' ' + node.epaId + '\t\t\t' + node.x + '\t\t' + -1 * node.y + '\n';
    }
}
