const INP_FILE_ERROR = "Input file incorrect";
const intType = {TITLE:"[TITLE]", JUNCTIONS:"[JUNCTIONS]", RESERVOIRS:"[RESERVOIRS]",
    TANKS:"[TANKS]", PIPES:"[PIPES]", PUMPS:"[PUMPS]", VALVES:"[VALVES]",
    TAGS:"[TAGS]", DEMANDS:"[DEMANDS]", STATUS:"[STATUS]", PATTERNS:"[PATTERNS]",
    CURVES:"[CURVES]", CONTROLS:"[CONTROLS]", RULES:"[RULES]", ENERGY:"[ENERGY]",
    EMITTERS:"[EMITTERS]",QUALITY:"[QUALITY]", SOURCES:"[SOURCES]", REACTIONS1:"[REACTIONS]1",
    REACTIONS2:"[REACTIONS]2", MIXING:"[MIXING]", TIMES:"[TIMES]", REPORT:"[REPORT]",
    OPTIONS:"[OPTIONS]", COORDINATES:"[COORDINATES]", VERTICES:"[VERTICES]",
    LABELS:"[LABELS]", BACKDROP:"[BACKDROP]", END:"[END]"};


function EPANET_Reader(file_text, caller) {
    let input;
    if (caller === "fileInput")
        input = file_text.split('\r\n');
    else
        input = file_text.split('\n');
    let curType;

    let model ={};

    let title = [];
    let nodes = [];
    let edges = [];
    let patterns = {};
    let curves = [];
    let controls = [];
    let rules = {};
    let energy = [];
    let reactions = [];
    let times = [];
    let report = [];
    let options = {};
    let backdrop = {};

    let nodeSpec = {};

    let next;
    let lastVal = '';
    let reaction = 1;

    for (let i = 0; i < input.length; ++i) {
        if (input[i] === "[REACTIONS]") {
            input[i] += reaction;
            ++reaction;
        }

        for (let type in intType) {
            if (intType[type] === input[i]) {
                curType = intType[type];
                ++i;
                break;
            }
        }

        if (input[i] === "")
            continue;

        switch(curType) {
            case intType.TITLE:
                title.push(input[i]);
                break;

            case intType.JUNCTIONS:
                if (input[i].charAt(0) === ';')
                    break;

                let junct = input[i].match(/\S+/g);

                lastVal = junct[3];
                if (lastVal === ";")
                    lastVal = "";

                nodeSpec[junct[0]] = {
                    epaType: "Junction",
                    values: [junct[1], junct[2], lastVal],
                    color: '#666'
                };
                break;
            case intType.RESERVOIRS:
                if (input[i].charAt(0) === ';')
                    break;

                let res = input[i].match(/\S+/g);

                lastVal = res[2];
                if (lastVal === ";")
                    lastVal = "";

                nodeSpec[res[0]] = {
                    epaType: "Reservoir",
                    values: [res[1], lastVal],
                    color: "#5F9EA0"
                };

                break;

            case intType.TANKS:
                if (input[i].charAt(0) === ';')
                    break;

                let tank = input[i].match(/\S+/g);

                lastVal = tank[7];
                if (lastVal === ";")
                    lastVal = "";

                nodeSpec[tank[0]] = {
                    epaType: "Tank",
                    values: [tank[1], tank[2], tank[3], tank[4], tank[5], tank[6], lastVal],
                    color: '#8B4513'
                };

                break;

            case intType.PIPES:
                if (input[i].charAt(0) === ';')
                    break;

                let pipe = input[i].match(/\S+/g);

                if (pipe !== null) {
                    let edge = {
                        id: pipe[0],
                        epaId: pipe[0],
                        label: 'Pipe ' + pipe[0],
                        epaType: "Pipe",
                        values: [pipe[3], pipe[4], pipe[5], pipe[6], pipe[7]],
                        source: pipe[1],
                        target: pipe[2],
                        size: 1,
                        color: '#ccc',
                        hover_color: '#808080'
                    };
                    edges.push(edge);
                }
                break;

            case intType.PUMPS:
                if (input[i].charAt(0) === ';')
                    break;
                let pump = input[i].match(/\S+/g);

                if (pump !== null) {
                    let edge = {
                        id: pump[0],
                        epaId: pump[0],
                        label: 'Pump ' + pump[0],
                        epaType: "Pump",
                        values: [pump[3], pump[4]],
                        source: pump[1],
                        target: pump[2],
                        size: 1,
                        color: '#D2B48C',
                        hover_color: '#DAA520'
                    };
                    edges.push(edge);
                }

                break;

            case intType.VALVES:
                if (input[i].charAt(0) === ';')
                    break;
                let valve = input[i].match(/\S+/g);

                if (valve !== null) {
                    let edge = {
                        id: valve[0],
                        epaId: valve[0],
                        label: 'Valve ' + valve[0],
                        epaType: "Valve",
                        values: [valve[3], valve[4], valve[5], valve[6]],
                        source: valve[1],
                        target: valve[2],
                        size: 1,
                        color: '#7070db',
                        hover_color: '#3333cc'
                    };
                    edges.push(edge);
                }
                break;

            case intType.TAGS:
                if (input[i].charAt(0) === ';')
                    break;
                let tag = input[i].match(/\S+/g);

                if (tag[0] === "NODE") {
                    if (!nodeSpec[tag[1]].tags) {
                        nodeSpec[tag[1]]["tags"] = [];
                    }
                    nodeSpec[tag[1]]["tags"].push(tag[2]);
                }
                else {
                    if (!edges[tags[1]].tags) {
                        edges[tags[1]]["tags"] = [];
                    }
                    edges[tags[1]]["tags"].push(tag[2]);
                }

                break;

            case intType.DEMANDS:
                if (input[i].charAt(0) === ';')
                    break;

                let demand = input[i].match(/\S+/g);

                if (!nodeSpec[demand[0]].demands) {
                    nodeSpec[demand[0]]["demands"] = []
                }
                nodeSpec[demand[0]]["demands"].push(demand.slice(1,3));
                break;

            case intType.STATUS:
                if (input[i].charAt(0) === ';')
                    break;

                let status = input[i].match(/\S+/g);

                if (!edges[status[1]].status) {
                    edges[status[1]]["status"] = [];
                }
                edges[status[1]]["status"].push(status[1]);
                break;

            case intType.PATTERNS:
                let pattern = input[i];
                patterns[pattern] = [];
                ++i;

                next = false;
                while(!next) {
                    if (input[i].charAt(0) === ";" || input[i] === '')
                        next = true;
                    else {
                        let period = input[i].match(/\S+/g);
                        patterns[pattern].push(period);
                        ++i;
                    }
                }
                break;

            case intType.CURVES:
                let curve = input[i];
                ++i;

                next = false;
                if (curve.charAt(0) === ";") {
                    let values = [];
                    while (!next) {
                        if (input[i].charAt(0) === ";" || input[i] === '')
                            next = true;
                        else {
                            values.push(input[i].match(/\S+/g));
                            ++i;
                        }
                    }
                    curves.push([curve, values]);
                    --i;
                }
                break;

            case intType.CONTROLS:
                if (input[i].charAt(0) === ';')
                    ++i;
                controls.push(input[i]);
                break;

            case intType.RULES:
                let rule = input[i];
                rules[rule] = [];
                ++i;

                next = false;
                while(!next) {
                    if (input[i] === '')
                        next = true;
                    else {
                        let statement = input[i];
                        rules[rule].push(statement);
                        ++i;
                    }
                }
                break;

            case intType.ENERGY:
                energy.push(input[i]);
                break;

            case intType.EMITTERS:
                if (input[i].charAt(0) === ';')
                    break;

                let emitter = input[i].match(/\S+/g);

                nodeSpec[emitter[0]]["emitter"] = emitter[1];
                break;

            case intType.QUALITY:
                if (input[i].charAt(0) === ';')
                    break;

                let quality = input[i].match(/\S+/g);
                nodeSpec[quality[0]]["values"].push(quality[1]);

                break;

            case intType.SOURCES:
                if (input[i].charAt(0) === ';')
                    break;

                let source = input[i].match(/\S+/g);

                nodeSpec[source[0]]["source"] = source.slice(1,4);
                break;

            case intType.REACTIONS1:
                // not sure
                break;

            case intType.REACTIONS2:
                let reaction = input[i].match(/\S+/g);

                for (let j in reaction) {
                    if (!isNaN(reaction[j])) {
                        reactions.push([reaction.slice(0,j).join(' '), reaction[j]]);
                        break;
                    }
                }
                break;

            case intType.MIXING:
                if (input[i].charAt(0) === ';')
                    break;

                let mix = input[i].match(/\S+/g);

                nodeSpec[mix[0]]["mixing"] = mix.slice(1,3);
                break;

            case intType.TIMES:
                times.push(input[i]);
                break;

            case intType.REPORT:
                report.push(input[i]);
                break;

            case intType.OPTIONS:
                if (input[i].charAt(0) === ';')
                    break;
                let option = input[i].match(/\S+/g);

                if (option[0].toLowerCase() === "unbalanced" || option[0].toLowerCase() === "quality" || option[0].toLowerCase() === "hydraulics")
                    options[option[0].toLowerCase()] = [option[option.length - 2], option[option.length - 1]];
                else
                    options[option[0].toLowerCase()] = option[option.length - 1];
                break;

            case intType.COORDINATES:
                if (input[i].charAt(0) === ';')
                    break;

                let coord = input[i].match(/\S+/g);

                if (coord !== null) {
                    let node = {
                        id: coord[0],
                        epaId: coord[0],
                        label: nodeSpec[coord[0]]["epaType"] + " " + coord[0],
                        x: 1 * coord[1],
                        y: -1 * coord[2],
                        epaType: nodeSpec[coord[0]]["epaType"],
                        values: nodeSpec[coord[0]]["values"],
                        size: 2,
                        color: nodeSpec[coord[0]]["color"],
                        hover_color: '#000',
                        source: nodeSpec[coord[0]]["source"] || [],
                        emitter: nodeSpec[coord[0]]["emitter"] || '',
                        mixing: nodeSpec[coord[0]]["mixing"] || []
                    };
                    nodes.push(node);
                }
                break;

            case intType.VERTICES:
                if (input[i].charAt(0) === ';')
                    break;
                let vert = input[i].match(/\S+/g);
                if (vert !== null) {
                    let edge = edges.find(edge => edge.id === vert[0]);
                    if (!edge.type) {
                        edge["type"] = "vert";
                        edge["vert"] = [];
                    }

                    let node = {
                        id: vert[0] + ' vert ' + edge.vert.length,
                        epaId: vert[0] + ' vert ' + edge.vert.length,
                        label: vert[0] + ' vert ' + edge.vert.length,
                        x: 1 * vert[1],
                        y: -1 * vert[2],
                        epaType: "Vertex",
                        values: [],
                        size: 0.3,
                        color: '#666',
                        hover_color: '#000'
                    };
                    nodes.push(node);
                    edge["vert"].push(node.id);
                }
                break;

            case intType.LABELS:
                if (input[i].charAt(0) === ';')
                    break;
                let label = input[i].match(/\S+/g);

                let node = {
                    id: Math.random().toString(36).replace(/[^a-z]+/g, '').substr(2, 10),
                    label: label[2],
                    x: 1 * label[0],
                    y: -1 * label[1],
                    size: 0,
                    showLabel: true
                };

                nodes.push(node);
                break;

            case intType.BACKDROP:
                let backdropInfo = input[i].match(/\S+/g);

                if (backdropInfo[0].toLowerCase() === "dimensions")
                    backdrop[backdropInfo[0].toLowerCase()] = [backdropInfo[1], backdropInfo[2], backdropInfo[3], backdropInfo[4]];
                else if (backdropInfo[0].toLowerCase() === "offset")
                    backdrop[backdropInfo[0].toLowerCase()] = [backdropInfo[1], backdropInfo[2]];
                else
                    backdrop[backdropInfo[0].toLowerCase()] = backdropInfo[1];
                break;
        }
    }

    model.title = title;
    model.nodes = nodes;
    model.edges = edges;
    model.patterns = patterns;
    model.curves = curves;
    model.controls = controls;
    model.rules = rules;
    model.energy = energy;
    model.reactions = reactions;
    model.times = times;
    model.report = report;
    model.options = options;
    model.backdrop = backdrop;

    this.getModel = function() {
        return model;
    }
}
