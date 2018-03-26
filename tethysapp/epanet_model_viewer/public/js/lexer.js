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
				console.log(curType);
				if (input[i] == intType.JUNCTIONS) {
					console.log(title_text);
					curType = intType.JUNCTIONS;
					++i;
				}
				else {
					title_text += input[i];
				}
				break;

			case intType.JUNCTIONS:
				console.log(curType);
				if (input[i] == intType.RESERVOIRS) {
					curType = intType.RESERVOIRS;
					++i;
				}
				else {

				}
				break;
			case intType.RESERVOIRS:
				console.log(curType);
				if (input[i] == intType.TANKS) {
					curType = intType.TANKS;
					++i;
				}
				else {
					
				}
				break;

			case intType.TANKS:
				console.log(curType);
				if (input[i] == intType.PIPES) {
					curType = intType.PIPES;
					++i;
				}
				else {
					
				}
				break;

			case intType.PIPES:
				console.log(curType);
				if (input[i] == intType.PUMPS) {
					curType = intType.PUMPS;
					++i;
				}
				else {
					var pipe = input[i].split('\t');

					var edge = {
						id: 'e ' + pipe[0],
					    source: 'n ' + pipe[1],
					    target: 'n ' + pipe[2],
					    size: 2
					};
					edges.push(edge);
				}
				break;

			case intType.PUMPS:
				console.log(curType);
				if (input[i] == intType.VALVES) {
					curType = intType.VALVES;
					++i;
				}
				else {
					var pump = input[i].split('\t');

					var edge = {
						id: 'p' + pump[0],
					    source: 'n ' + pump[1],
					    target: 'n ' + pump[2],
					    size: 2
					};
					edges.push(edge);
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
				console.log(curType);
				if (input[i] == intType.VERTICES) {
					curType = intType.VERTICES;
					++i;
				}
				else {
					var coord = input[i].split('\t');

					var node = {
						id: 'n' + coord[0],
						label: 'Node ' + coord[0],
					    x: coord[1],
					    y: -1 * coord[2],
					    size: 3
					};
					nodes.push(node);
                    console.log(node);
				}
				break;

			case intType.VERTICES:
				console.log(curType);
				if (input[i] == intType.LABELS) {
					curType = intType.LABELS;
					++i;
				}
				else {
					var vert = input[i].split('\t');
					var curID = vert[0];
					var vertNum = 0;

					var node = {
						id: 'v' + vert[0] + vertNum,
						label: 'Vert ' + vert[0] + vertNum,
					    x: vert[1],
					    y: -1 * vert[2],
					    size: 2
					};
					nodes.push(node);
					++i;

					while (input[i] != intType.LABELS) {
						vert = input[i].split('\t');

						if (vert.length > 1) {
							console.log(vert[1] + vert[2]);
							if (curID == vert[0]) {
								++vertNum;
							}
							else {
								vertNum = 1;
							}
							node = {
								id: 'v' + vert[0] + vertNum,
								label: 'Vert ' + vert[0] + vertNum,
							    x: vert[1],
							    y: -1 * vert[2],
							    size: 2
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
