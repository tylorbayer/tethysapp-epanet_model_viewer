const opts = {units:'Units\t\t', headloss:'Headloss\t', specific:'Specific Gravity', viscosity:'Viscosity\t', trials:'Trials\t\t',
    accuracy:'Accuracy\t', checkfreq:'CHECKFREQ\t', maxcheck:'MAXCHECK\t', damplimit:'DAMPLIMIT\t', unbalanced:'Unbalanced\t',
    pattern:'Pattern\t', demand:'Demand Multiplier', emitter:'Emitter Exponent', quality:'Quality\t', diffusivity:'Diffusivity\t',
    tolerance:'Tolerance\t', map:'Map\t'};


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
    let patternText = "[PATTERNS]\n;ID\tMultipliers;\nEdited Curve\n";
    let curvText = "[CURVES]\n;ID\tX-Value\tY-Value\n";
    let controlText = "[CONTROLS]\n";
    let ruleText = "[RULES]\n";
    let energyText = "[ENERGY]\n";
    let emmitText = "[EMITTERS]\n;Junction\tCoefficient\n";
    let qualText = "[QUALITY]\n;Node\t\t\tInitQual\n";
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
    let options = model.options;

    titleText += model.title.join('\n') + '\n\n';

    nodes.forEach(function (node) {
        if (node.type === "Junction") {
            junctText += ' ' + node.id + '\t\t\t' + node.values.slice(0, 3).join('\t\t') + '\t\t\t;\n';
            popNodeQC(node, node.values.length > 3);
        }
        else if (node.type === "Reservoir") {
            resText += ' ' + node.id + '\t\t\t' + node.values.slice(0, 2).join('\t\t') + '\t\t\t;\n';
            popNodeQC(node, node.values.length > 2);
        }
        else if (node.type === "Tank") {
            tankText += ' ' + node.id + '\t\t\t' + node.values.slice(0, 7).join('\t\t') + '\t\t\t;\n';
            popNodeQC(node, node.values.length > 7);
        }
        else {
            vertText += ' ' + node.id.substring(0, 2) + '\t\t\t' + node.x + '\t\t' + -1 * node.y + '\n';
        }
    });

    junctText += '\n';
    resText += '\n';
    tankText += '\n';
    vertText += '\n';
    qualText += '\n';
    coordText += '\n';

    edges.forEach(function (edge) {
        if (edge.type === "Pipe") {
           pipeText += ' ' + edge.id + '\t\t\t' + edge.source + '\t\t\t' + edge.target + '\t\t\t' + edge.values.join('\t\t') + '\t;\n';
        }
        else if (edge.type === "Pump") {
            pumpText += ' ' + edge.id + '\t\t\t' + edge.source + '\t\t\t' + edge.target + '\t\t\t' + edge.values.join(' ') + '\t;\n';
        }
        else {
            valvText += ' ' + edge.id + '\t\t\t' + edge.source + '\t\t\t' + edge.target + '\t\t\t' + edge.values[0] + '\t\t' +
                edge.values[1] + '\t' + edge.values[2] + '\t\t' + edge.values[3] + '\t\t;\n';
        }
    });

    pipeText += '\n';
    pumpText += '\n';
    valvText += '\n';

    for(let key in options) {
            if(key === "unbalanced" || key === "quality" || key === "hydraulics") {
                optText += ' ' + opts[key] + '\t' + options[key][0] + ' ' + options[key][1] + '\n'
            }
            else
                optText += ' ' + opts[key] + '\t' + options[key] + '\n'
        }

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
    labelText += '\n';
    backText += '\n';
    endText += '\n';

    file_text += titleText + junctText + resText + tankText + pipeText + pumpText + valvText + tagText + demandText + statusText +
        patternText + curvText + controlText + ruleText + energyText + emmitText + qualText + sourceText + react1Text + react2Text +
        mixText + timeText + reportText + optText + coordText + vertText + labelText + backText + endText;

    console.log(file_text);

    this.getFile = function() {
        return file_text;
    };

    function popNodeQC(node, hasQuality) {
        if (hasQuality)
            qualText += ' ' + node.id + '\t\t\t' + node.values[node.values.length - 1] + '\n';

        coordText += ' ' + node.id + '\t\t\t' + node.x + '\t\t' + -1 * node.y + '\n';
    }
}
