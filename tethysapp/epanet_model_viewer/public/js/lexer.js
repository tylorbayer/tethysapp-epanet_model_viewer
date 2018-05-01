const INP_FILE_ERROR = "Input file incorrect";
const intType = {TITLE:"[TITLE]", JUNCTIONS:"[JUNCTIONS]", RESERVOIRS:"[RESERVOIRS]", 
TANKS:"[TANKS]", PIPES:"[PIPES]", PUMPS:"[PUMPS]", VALVES:"[VALVES]",
TAGS:"[TAGS]", DEMANDS:"[DEMANDS]", STATUS:"[STATUS]", PATTERNS:"[PATTERNS]",
CURVES:"[CURVES]", CONTROLS:"[CONTROLS]", RULES:"[RULES]", ENERGY:"[ENERGY]",
EMITTERS:"[EMITTERS]",QUALITY:"[QUALITY]", SOURCES:"[SOURCES]", REACTIONS1:"[REACTIONS]1", 
REACTIONS2:"[REACTIONS]2", MIXING:"[MIXING]", TIMES:"[TIMES]", REPORT:"[REPORT]",
OPTIONS:"[OPTIONS]", COORDINATES:"[COORDINATES]", VERTICES:"[VERTICES]",
LABELS:"[LABELS]", BACKDROP:"[BACKDROP]", END:"[END]"};


function Lexer(file_text, caller) {
    var input;
    if (caller == "fileInput")
        input = file_text.split('\r\n');
    else
        input = file_text.split('\n');
	var curType;

	var nodes = [];
	var edges = [];

    var nodeSpec ={};

	var title_text = "";

	if (input[0] == intType.TITLE) {
		curType = intType.TITLE;
	}
	else {
		throw INP_FILE_ERROR;
	}

	for (var i = 1; i < input.length; ++i) {
		if (input[i] == "")
			continue;

		switch(curType) {
			case intType.TITLE:
				if (input[i] == intType.JUNCTIONS) {
					curType = intType.JUNCTIONS;
					++i;
				}
				else {
					title_text += input[i];
				}
				break;

			case intType.JUNCTIONS:
				if (input[i] == intType.RESERVOIRS) {
					curType = intType.RESERVOIRS;
					++i;
				}
				else {
                    var junct = input[i].match(/\S+/g);

                    var lastVal = junct[3];
                    if (lastVal == ";")
                        lastVal = "";

                    nodeSpec[junct[0]] = {
                        type: "Junction",
                        values: [junct[1], junct[2], lastVal],
                        color: '#666'
                    };
				}
				break;
			case intType.RESERVOIRS:
				if (input[i] == intType.TANKS) {
					curType = intType.TANKS;
					++i;
				}
				else {
					var res = input[i].match(/\S+/g);

                    var lastVal = res[2];
                    if (lastVal == ";")
                        lastVal = "";

                    nodeSpec[res[0]] = {
                        type: "Reservoir",
                        values: [res[1], lastVal],
                        color: "#5F9EA0"
                    };
				}
				break;

			case intType.TANKS:
				if (input[i] == intType.PIPES) {
					curType = intType.PIPES;
					++i;

                    for (val in nodeSpec) {
                        console.log(nodeSpec[val]["type"]);
                    }
				}
				else {
                    var tank = input[i].match(/\S+/g);

                    var lastVal = tank[7];
                    if (lastVal == ";")
                        lastVal = "";

                    nodeSpec[tank[0]] = {
                        type: "Tank",
                        values: [tank[1], tank[2], tank[3], tank[4], tank[5], tank[6], lastVal],
                        color: '#8B4513'
                    };
				}
				break;

			case intType.PIPES:
				if (input[i] == intType.PUMPS) {
					curType = intType.PUMPS;
					++i;
				}
				else {
					var pipe = input[i].match(/\S+/g);

                    if (pipe != null) {
                        var edge = {
                            id: pipe[0],
                            label: 'Pipe ' + pipe[0],
							type: "Pipe",
                            values: [pipe[3], pipe[4], pipe[5], pipe[6], pipe[7]],
                            source: pipe[1],
                            target: pipe[2],
                            size: 2,
                            color: '#ccc',
                            hover_color: '#808080'
                        };
                        edges.push(edge);
                    }
				}
				break;

			case intType.PUMPS:
				if (input[i] == intType.VALVES) {
					curType = intType.VALVES;
					++i;
				}
				else {
					var pump = input[i].match(/\S+/g);

                    if (pump != null) {
                        var edge = {
                            id: pump[0],
                            label: 'Pump ' + pump[0],
							type: "Pump",
                            values: [pump[3], pump[4]],
                            source: pump[1],
                            target: pump[2],
                            size: 2,
                            color: '#D2B48C',
                            hover_color: '#DAA520'
                        };
                        edges.push(edge);
                    }
				}
				break;

			case intType.VALVES:
				console.log(curType);
				if (input[i] == intType.TAGS) {
					curType = intType.TAGS;
				}
				else {
					
				}
				break;

			case intType.TAGS:
				console.log(curType);
				if (input[i] == intType.DEMANDS) {
					curType = intType.DEMANDS;
					++i;
				}
				else {
					
				}
				break;

			case intType.DEMANDS:
				console.log(curType);
				if (input[i] == intType.STATUS) {
					curType = intType.STATUS;
					++i;
				}
				else {
					
				}
				break;

			case intType.STATUS:
				console.log(curType);
				if (input[i] == intType.PATTERNS) {
					curType = intType.PATTERNS;
					++i;
				}
				else {
					
				}
				break;

			case intType.PATTERNS:
				console.log(curType);
				if (input[i] == intType.CURVES) {
					curType = intType.CURVES;
					++i;
				}
				else {
					
				}
				break;

			case intType.CURVES:
				console.log(curType);
				if (input[i] == intType.CONTROLS) {
					curType = intType.CONTROLS;
				}
				else {
					
				}
				break;

			case intType.CONTROLS:
				console.log(curType);
				if (input[i] == intType.RULES) {
					curType = intType.RULES;
				}
				else {
					
				}
				break;

			case intType.RULES:
				console.log(curType);
				if (input[i] == intType.ENERGY) {
					curType = intType.ENERGY;
				}
				else {
					
				}
				break;

			case intType.ENERGY:
				console.log(curType);
				if (input[i] == intType.EMITTERS) {
					curType = intType.EMITTERS;
					++i;
				}
				else {
					
				}
				break;

			case intType.EMITTERS:
				console.log(curType);
				if (input[i] == intType.QUALITY) {
					curType = intType.QUALITY;
					++i;
				}
				else {
					
				}
				break;

			case intType.QUALITY:
				console.log(curType);
				if (input[i] == intType.SOURCES) {
					curType = intType.SOURCES;
					++i;
				}
				else {
					
				}
				break;

			case intType.SOURCES:
				console.log(curType);
				if (input[i] + "1" == intType.REACTIONS1) {
					curType = intType.REACTIONS1;
					++i;
				}
				else {
					
				}
				break;

			case intType.REACTIONS1:
				console.log(curType);
				if (input[i] + "2" == intType.REACTIONS2) {
					curType = intType.REACTIONS2;
				}
				else {
					
				}
				break;

			case intType.REACTIONS2:
				console.log(curType);
				if (input[i] == intType.MIXING) {
					curType = intType.MIXING;
					++i;
				}
				else {
					
				}
				break;

			case intType.MIXING:
				console.log(curType);
				if (input[i] == intType.TIMES) {
					curType = intType.TIMES;
				}
				else {
					
				}
				break;

			case intType.TIMES:
				console.log(curType);
				if (input[i] == intType.REPORT) {
					curType = intType.REPORT;
				}
				else {
					
				}
				break;

			case intType.REPORT:
				console.log(curType);
				if (input[i] == intType.OPTIONS) {
					curType = intType.OPTIONS;
				}
				else {
					
				}
				break;

			case intType.OPTIONS:
				console.log(curType);
				if (input[i] == intType.COORDINATES) {
					curType = intType.COORDINATES;
					++i;
				}
				else {
					
				}
				break;

			case intType.COORDINATES:
				if (input[i] == intType.VERTICES) {
					curType = intType.VERTICES;
					++i;
				}
				else {
					var coord = input[i].match(/\S+/g);

                    if (coord != null) {
                        var node = {
                            id: coord[0],
                            label: nodeSpec[coord[0]]["type"] + " " + coord[0],
                            x: coord[1],
                            y: -1 * coord[2],
                            type: nodeSpec[coord[0]]["type"],
                            values: nodeSpec[coord[0]]["values"],
                            size: 2,
                            color: nodeSpec[coord[0]]["color"],
                            hover_color: '#000'
                        };
                        nodes.push(node);
                    }
				}
				break;

			case intType.VERTICES:
				if (input[i] == intType.LABELS) {
					curType = intType.LABELS;
					++i;
				}
				else {
					var vert = input[i].match(/\S+/g);
                    if (vert != null) {
                        var curID = vert[0];
                        var vertNum = 0;

                        var node = {
                            id: vert[0] + vertNum,
                            label: 'Vert ' + vert[0] + vertNum,
                            x: vert[1],
                            y: -1 * vert[2],
                            size: 2,
                            color: '#666',
                            hover_color: '#000'
                        };
                        nodes.push(node);
                    }
					++i;

					while (input[i] != intType.LABELS) {
						vert = input[i].match(/\S+/g);

						if (vert != null) {
							if (curID == vert[0]) {
								++vertNum;
							}
							else {
								vertNum = 1;
							}
							node = {
								id: vert[0] + vertNum,
								label: 'Vert ' + vert[0] + vertNum,
							    x: vert[1],
							    y: -1 * vert[2],
							    size: 2,
                                color: '#666',
                                hover_color: '#000'
							};
							nodes.push(node);
							curID = vert[0];
						}
						++i;
					}
					curType = intType.LABELS;
				}
				break;

			case intType.LABELS:
				console.log(curType);
				if (input[i] == intType.BACKDROP) {
					curType = intType.BACKDROP;
				}
				else {
					
				}
				break;

			case intType.BACKDROP:
				console.log(curType);
				if (input[i] == intType.END) {
					curType = intType.END;
					++i;
				}
				else {
				}
				break;
		}
	}

	this.getNodes = function() {
		return nodes;
	}

	this.getEdges = function() {
		return edges;
	}
}
