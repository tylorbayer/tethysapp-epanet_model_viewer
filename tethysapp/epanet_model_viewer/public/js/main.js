/*****************************************************************************
 * FILE:    Main
 * DATE:    2/7/2018
 * AUTHOR:  Tylor Bayer
 * COPYRIGHT: (c) 2018 Brigham Young University
 * LICENSE: BSD 2-Clause
 *****************************************************************************/

/*****************************************************************************
 *                      LIBRARY WRAPPER
 *****************************************************************************/
(function packageEPANETModelViewer() {

    "use strict"; // And enable strict mode for this library

    /************************************************************************
     *                      MODULE LEVEL / GLOBAL VARIABLES
     *************************************************************************/
    let showLog = false,
        s = {},
        model = {},
        file_text,
        curNode = {},
        curEdge = {},
        // graphColors = {
        //     Junction: '#666',
        //     Vertex: "#666",
        //     Reservoir: '#5F9EA0',
        //     Tank: '#8B4513',
        //     Label: '#d6d6c2',
        //     Pipe: '#ccc',
        //     Pump: '#D2B48C',
        //     Valve: '#7070db' },
        hoverColors = {
            Pipe: '#808080',
            Pump: '#DAA520',
            Valve: '#3333cc' },
        edgeSource = null,
        isAddEdge = false,
        isAddNode = false,
        addType = "",
        colorMap,
        modelResults = {},
        animate = [];

    //  *********FUNCTIONS***********
    let addInitialEventListeners,
        initializeJqueryVariables,
        hideMainLoadAnim,
        setStateAfterLastModel,
        addLogEntry,
        showLoadingCompleteStatus,
        addModelToUI,
        addMetadataToUI,
        resetModelState,
        resetUploadState,
        populateModelOptions,
        populateNodeModal,
        nodeClick,
        edgeClick,
        populateEdgeModal,
        uploadModel,
        addDefaultBehaviorToAjax,
        checkCsrfSafe,
        getCookie,
        openModel,
        canvasClick,
        setGraphEventListeners;

    //  **********Query Selectors************
    let $modelOptions,
        $modalNode,
        $modalNodeLabel,
        $modalEdge,
        $modalEdgeLabel,
        $btnOpenModel,
        $chkDragNodes,
        $modalLog,
        $loadFromLocal,
        $fileDisplayArea,
        $chkOptionsEdit,
        $btnOptionsOk,
        $chkNodeEdit,
        $chkEdgeEdit,
        $btnNodeOk,
        $btnNodeCancel,
        $btnEdgeOk,
        $btnEdgeCancel,
        $inpUlTitle,
        $inpUlDescription,
        $inpUlKeywords,
        $btnUl,
        $btnUlCancel,
        $viewTabs,
        $nodeTabs,
        $edgeTabs,
        $loadingModel,
        $nodeEdgeSelect,
        $sideBar,
        $btnEditTools,
        $editToolbar,
        $initialModel,
        $btnEdgeDelete,
        $btnNodeDelete,
        $nodeX,
        $nodeY,
        $btnRunModel,
        $btnPlayModel,
        $btnResetModel,
        $viewNodeResults,
        $nodeResults,
        $viewEdgeResults,
        $edgeResults;

    //  *******Node/Edge Element Html********
    let nodeHtml = {
        Junction:
        "<tr><td><b>Id:</b></td><td><input type='text' id='node-id' class='inp-properties' readonly></td></tr>" +
        "<tr><td>Elev:</td><td><input type='number' class='inp-properties' readonly></td></tr>" +
        "<tr><td>Demand:</td><td><input type='number' class='inp-properties' readonly></td></tr>" +
        "<tr><td>Pattern:</td><td><input type='text' class='inp-properties' readonly></td></tr>" +
        "<tr><td>Quality:</td><td><input type='number' class='inp-properties' readonly></td></tr>",
        Reservoir:
        "<tr><td><b>Id:</b></td><td><input type='text' id='node-id' class='inp-properties' readonly></td></tr>" +
        "<tr><td>Head:</td><td><input type='text' class='inp-properties' readonly></td></tr>" +
        "<tr><td>Pattern:</td><td><input type='text' class='inp-properties' readonly></td></tr>" +
        "<tr><td>Quality:</td><td><input type='number' class='inp-properties' readonly></td></tr>",
        Tank: "<tr><td><b>Tank:</b></td><td><input type='text' id='node-id' class='inp-properties' readonly></td></tr>" +
        "<tr><td>Id:</td><td><input type='number' class='inp-properties' readonly></td></tr>" +
        "<tr><td>InitLevel:</td><td><input type='number' class='inp-properties' readonly></td></tr>" +
        "<tr><td>MinLevel:</td><td><input type='number' class='inp-properties' readonly></td></tr>" +
        "<tr><td>MaxLevel:</td><td><input type='number' class='inp-properties' readonly></td></tr>" +
        "<tr><td>Diameter:</td><td><input type='number' class='inp-properties' readonly></td></tr>" +
        "<tr><td>MinVol:</td><td><input type='number' class='inp-properties' readonly></td></tr>" +
        "<tr><td>VolCurve:</td><td><input type='text' class='inp-properties' readonly></td></tr>" +
        "<tr><td>Quality:</td><td><input type='number' class='inp-properties' readonly></td></tr>",
        Vertex:
            "<tr><td><b>Id:</b></td><td><input type='text' id='node-id' readonly></td></tr>",
        Label:
            "<tr><td><b>Label:</b></td><td><input type='text' id='node-id' readonly></td></tr>"
    };

    let edgeHtml = {
        Pipe:
        "<tr><td><b>Pipe:</b></td><td><input type='text' id='edge-id' class='inp-properties' readonly></td></tr>" +
        "<tr><td>Length:</td><td><input type='number' class='inp-properties' readonly></td></tr>" +
        "<tr><td>Roughness:</td><td><input type='number' class='inp-properties' readonly></td></tr>" +
        "<tr><td>Diameter:</td><td><input type='number' class='inp-properties' readonly></td></tr>" +
        "<tr><td>Minor Loss:</td><td><input type='number' class='inp-properties'readonly></td></tr>" +
        "<tr><td>Status:</td><td><input type='text' class='inp-properties'readonly><br><p>('Open', 'Closed', or 'CV')</p></td></tr>",
        Pump:
        "<tr><td><b>Pump:</b></td><td><input type='text' id='edge-id' class='inp-properties' readonly></td></tr>" +
        "<tr><td>Parameters:</td><td><input type='text' class='inp-properties'readonly><br>" +
        "<input type='text' class='inp-properties'readonly></td></tr>",
        Valve:
        "<tr><td><b>Valve:</b></td><td><input type='text' id='edge-id' class='inp-properties' readonly></td></tr>" +
        "<tr><td>Diameter:</td><td><input type='number' class='inp-properties'readonly></td></tr>" +
        "<tr><td>Type:</td><td><input type='text' class='inp-properties' readonly></td></tr>" +
        "<tr><td>Setting:</td><td><input type='number' class='inp-properties' readonly></td></tr>" +
        "<tr><td>Minor Loss:</td><td><input type='number' class='inp-properties' readonly></td></tr>"
    };

    /******************************************************
     **************FUNCTION DECLARATIONS*******************
     ******************************************************/

    addInitialEventListeners = function () {
        document.onkeydown = function(evt) {
            evt = evt || window.event;
            if (evt.keyCode === 27) {
                $('#btn-default-edit').click();
            }
        };

        $('#btn-model-rep').click(function () {
            let curURL = window.location.href;
            window.open(curURL.substring(0, curURL.indexOf('/apps/') + 6) + "epanet-model-repository/", "modelRepository");
        });

        $editToolbar.find('a').click(function () {
            addType = this.name;

            if ($(this).hasClass('active') && addType !== "Default")
                $('#btn-default-edit').click();
            else {
                $editToolbar.find('a').removeClass('active');
                $(this).addClass('active');

                if ($chkDragNodes.is(':checked'))
                    $chkDragNodes.click();

                isAddEdge = false;
                isAddNode = false;
                if (edgeSource) {
                    edgeSource.color = edgeSource.epaColor;
                    s.refresh();
                }
                edgeSource = null;

                if (addType === "Default") {
                    $('#model-display').css("cursor", "default");
                }
                else if (addType === "Junction" || addType === "Reservoir" || addType === "Tank" || addType === "Label") {
                    isAddNode = true;
                    $('#model-display').css("cursor", "crosshair");
                }
                else {
                    isAddEdge = true;
                    $('#model-display').css("cursor", "pointer");
                }
            }
        });

        $btnEditTools.click(function () {
            if ($editToolbar.is(':hidden')) {
                $editToolbar.removeClass('hidden');
                $btnEditTools.css("background-color", "#915F6D");
                $btnEditTools.css("color", "white");
            }
            else {
                $editToolbar.addClass('hidden');
                $editToolbar.find('a').removeClass('active');
                $('#btn-default-edit').addClass('active');
                $btnEditTools.css("background-color", "white");
                $btnEditTools.css("color", "#555");
                $('#model-display').css("cursor", "default");
                isAddEdge = false;
                isAddNode = false;
            }
        });

        $loadFromLocal.addEventListener('change', function() {
            let file = $loadFromLocal.files[0];

            let reader = new FileReader();

            reader.onload = function() {
                $fileDisplayArea.innerText = reader.result;
            };

            reader.readAsText(file);
        });

        $btnUl.click(function() {
            if ($inpUlTitle.val() !== '' && $inpUlDescription.val() !== '' && $inpUlKeywords.val() !== '') {
                $('#model-save-animation').removeAttr('hidden');
                model.title = [$inpUlTitle.val(), $inpUlDescription.val()];
                model.nodes = s.graph.nodes();
                model.edges = s.graph.edges();

                let epanetWriter = new EPANET_Writer(model);

                let data = new FormData();
                data.append('model_title', $inpUlTitle.val());
                data.append('model_description', $inpUlDescription.val());
                data.append('model_keywords', $inpUlKeywords.tagsinput('items'));
                data.append('model_file', epanetWriter.getFile());

                uploadModel(data);

                $('#modal-upload').modal('hide');
                resetUploadState();
            }
            else {
                alert("Fields not entered correctly. Cannot upload model to Hydroshare. Fill the correct fields in and try again.");
            }
        });

        $btnUlCancel.click(function() {
            resetUploadState();
        });

        $btnRunModel.click(function() {
            let data = {'model': file_text};

            $.ajax({
                type: 'GET',
                url: '/apps/epanet-model-viewer/run-epanet-model/',
                dataType: 'json',
                data: data,
                error: function () {
                    let message = 'An unexpected error occurred while uploading the model ';

                    addLogEntry('danger', message);
                },
                success: function (response) {
                    let message;

                    if (response.hasOwnProperty('success')) {
                        $('#model-save-animation').attr('hidden', true);

                        if (response.hasOwnProperty('message')) {
                            message = response.message;
                        }

                        if (!response.success) {
                            if (!message) {
                                message = 'An unexpected error occurred while uploading the model';
                            }

                            addLogEntry('danger', message);
                        } else {
                            if (message) {
                                addLogEntry('warning', message);
                            }
                            if (response.hasOwnProperty('results')) {
                                $('.ran-model').removeAttr('disabled');
                                $('.ran-model').removeClass('hidden');
                                modelResults = response.results;
                                console.log(modelResults);

                                for (let i in modelResults['nodes']) {
                                    s.graph.nodes().find(node => node.epaId === i).modelResults = modelResults['nodes'][i];
                                }

                                let data = [];

                                for (let i in modelResults['edges']) {
                                    s.graph.edges().find(edge => edge.epaId === i).modelResults = modelResults['edges'][i];
                                    data = data.concat(modelResults['edges'][i]['EN_VELOCITY']);
                                }

                                colorMap = chroma.scale('RdYlBu')
                                    .domain([Math.min(...data), Math.max(...data)]);
                            }
                        }
                    }
                }
            });
        });

        $btnPlayModel.click(function () {
            for (let j = 0; j < 11; ++j) {
                animate.push(setTimeout(function () {
                    for (let i in modelResults['edges']) {
                        s.graph.edges().find(edge => edge.epaId === i).color = colorMap(modelResults['edges'][i]['EN_VELOCITY'][j]).hex();
                    }
                    s.refresh();
                }, 1000*j));
            }
        });

        $viewNodeResults.find('select').change(function () {
            console.log(curNode.modelResults[$(this).val()]);

            let dataset = curNode.modelResults[$(this).val()];
            let x=[], y=[];
            for (let i in dataset) {
                y.push(dataset[i]);
                x.push(i);
            }

            let trace = {
                x: x,
                y: y,
                type: 'scatter'
            };

            let data = [trace];

            var layout = {
                title: $(this).find('option:selected').text() + " for Node " + curNode.id,
                xaxis: {
                    title: 'Timestep'
                },
                yaxis: {
                    title: $(this).find('option:selected').text()
                }
            };

            Plotly.newPlot('node-results', data, layout);
        });

        $viewEdgeResults.find('select').change(function () {
            console.log(curEdge.modelResults[$(this).val()]);

            let dataset = curEdge.modelResults[$(this).val()];
            let x=[], y=[];
            for (let i in dataset) {
                y.push(dataset[i]);
                x.push(i);
            }

            let trace = {
                x: x,
                y: y,
                type: 'scatter'
            };

            let data = [trace];

            var layout = {
                title: $(this).find('option:selected').text() + " for Edge " + curEdge.id,
                xaxis: {
                    title: 'Timestep'
                },
                yaxis: {
                    title: $(this).find('option:selected').text()
                }
            };

            Plotly.newPlot('edge-results', data, layout);
        });

        $('#node-view-tab').click(function () {
            $modalNode.find('.modal-dialog').css('width', '315px');
            $modalNode.find('.modal-dialog').css('height', '440px');
        });

        $('#node-results-tab').click(function () {
            $modalNode.find('.modal-dialog').css('width', '1000px');
            $modalNode.find('.modal-dialog').css('height', '750px');
        });

        $('#edge-view-tab').click(function () {
            $modalEdge.find('.modal-dialog').css('width', '315px');
            $modalEdge.find('.modal-dialog').css('height', '440px');
        });

        $('#edge-results-tab').click(function () {
            $modalEdge.find('.modal-dialog').css('width', '1000px');
            $modalEdge.find('.modal-dialog').css('height', '750px');
        });

        $btnResetModel.click(function () {
            animate.forEach(function(call) {
                clearTimeout(call);
            });

            for (let node in s.graph.nodes()) {
                s.graph.nodes()[node].color = s.graph.nodes()[node].epaColor;
            }
            for (let edge in s.graph.edges()) {
                s.graph.edges()[edge].color = s.graph.edges()[edge].epaColor;
            }
            s.refresh();
        });

        $chkDragNodes.click(function() {
            if ($chkDragNodes.is(':checked')) {
                $editToolbar.find('a').removeClass('active');
                isAddEdge = false;
                isAddNode = false;
                let dragListener = sigma.plugins.dragNodes(s, s.renderers[0]);

                dragListener.bind('startdrag', function(e) {
                    $('#model-display').css("cursor", "-webkit-grabbing");
                });
                dragListener.bind('drag', function(e) {
                    s.unbind('clickNodes');
                });
                dragListener.bind('dragend', function(e) {
                    $('#model-display').css("cursor", "-webkit-grab");

                    setTimeout(function(){
                        s.bind('clickNodes', function(e) {
                            nodeClick(e);
                        });
                    },250);
                });

                $('#model-display').css("cursor", "-webkit-grab");
            }
            else {
                $('#btn-default-edit').click();
                sigma.plugins.killDragNodes(s);

                $('#model-display').css("cursor", "default");
            }
        });

        $modalNode.on('hidden.bs.modal', function () {
            curNode.color = curNode.epaColor;
            if (edgeSource)
                edgeSource.color = edgeSource.epaColor;
            s.refresh();
            resetModelState();
        });

        $modalEdge.on('hidden.bs.modal', function () {
            if (curNode)
                curNode.color = curNode.epaColor;
            if (edgeSource)
                edgeSource.color = edgeSource.epaColor;

            curEdge.hover_color = curEdge.epaColor;
            s.refresh();
            resetModelState();
        });

        $chkOptionsEdit.click(function () {
            if ($chkOptionsEdit.is(':checked')) {
                $btnOptionsOk.removeAttr('disabled');

                $modelOptions.find('input').attr('readonly', false);
                $modelOptions.find('select').attr('disabled', false);
            }
            else {
                $btnOptionsOk.attr('disabled', true);

                $modelOptions.find('input').attr('readonly', true);
                $modelOptions.find('select').attr('disabled', true);

                populateModelOptions();
            }
        });

        $btnOptionsOk.click(function() {
            for(let key in model.options) {
                if(key === "unbalanced" || key === "quality" || key === "hydraulics") {
                    model.options[key][0] = $('#' + key + 1).val();
                    model.options[key][1] = $('#' + key + 2).val();
                }
                else
                    model.options[key] = $('#' + key).val();
            }

            $modelOptions.find('input').attr('readonly', true);
            $modelOptions.find('select').attr('disabled', true);
            resetModelState();
            populateModelOptions();
        });

        $chkNodeEdit.click(function() {
            if ($chkNodeEdit.is(':checked')) {
                $btnNodeOk.removeAttr('disabled');
                $btnNodeDelete.removeAttr('disabled');

                $modalNode.find('input').attr('readonly', false);
            }
            else {
                $btnNodeOk.attr('disabled', true);
                $btnNodeDelete.attr('disabled', true);

                $modalNode.find('input').attr('readonly', true);

                populateNodeModal(curNode);
            }
        });

        $chkEdgeEdit.click(function() {
            if ($chkEdgeEdit.is(':checked')) {
                $btnEdgeOk.removeAttr('disabled');
                $btnEdgeDelete.removeAttr('disabled');

                $modalEdge.find('input').attr('readonly', false);
            }
            else {
                $btnEdgeOk.attr('disabled', true);
                $btnEdgeDelete.attr('disabled', true);

                $modalEdge.find('input').attr('readonly', true);

                populateEdgeModal(curEdge);
            }
        });

        $btnNodeOk.click(function() {
            if ($('#node-id').val() === "")
                alert("Id must have a value");
            else {
                $modalNode.modal('hide');

                if (curNode.epaType !== "Label") {
                    let edges = s.graph.edges;
                    for (let i in edges) {
                        if (edges[i].type === "vert") {
                            for (let j in edges[i].vert) {
                                if (edges[i].vert[j] === curNode.epaId) {
                                    edges[i].vert[j] = $('#node-id').val();
                                }
                            }
                        }
                    }

                    curNode.epaId = $('#node-id').val();
                    curNode.label = curNode.epaType + ' ' + $('#node-id').val();

                    for (let i = 1; i < $modalNode.find('input').length; ++i) {
                        curNode.values[i - 1] = $modalNode.find('input')[i].value;
                    }
                }
                else {
                    curNode.label = $('#node-id').val();
                }

                if ($nodeX.html() !== "") {
                    if (curNode.epaType !== "Label") {
                        curNode.id = curNode.epaId;
                        curNode.label = curNode.epaType + " " + curNode.id;
                        curNode.size = 2;
                    }
                    else {
                        curNode.id = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(2, 10);
                        curNode.size = 1;
                        curNode.showLabel = true;
                    }

                    curNode.color = curNode.epaColor;
                    curNode.x = $nodeX.html();
                    curNode.y = $nodeY.html();

                    try {
                        s.graph.addNode(curNode);
                    }
                    catch (e) {
                        alert(e);
                    }

                    s.refresh();

                    $nodeX.empty();
                    $nodeY.empty();
                }
                resetModelState();
            }
        });

        $btnNodeDelete.click(function() {
            $modalNode.modal('hide');

            if (curNode.epaType === "Vertex") {
                try {
                    let verts = s.graph.edges().find(edge => edge.epaId === curNode.id.split(" ")[0]).vert;
                    verts.splice(verts.indexOf(curNode.epaId), 1);
                }
                catch (e) {
                    // vert edge is gone already
                }
            }
            s.graph.dropNode(curNode.id);

            resetModelState();
        });

        $btnNodeCancel.click(function() {
            resetModelState();
        });

        $btnEdgeOk.click(function() {
            if ($('#edge-id').val() === "")
                alert("Id must have a value");
            else {
                $modalEdge.modal('hide');

                curEdge.epaId = $('#edge-id').val();
                curEdge.label = curEdge.epaType + ' ' + $('#edge-id').val();

                for (let i = 1; i < $modalEdge.find('input').length; ++i) {
                    curEdge.values[i - 1] = $modalEdge.find('input')[i].value;
                }

                if (isAddEdge && edgeSource !== null) {
                    curEdge.id = curEdge.epaId;
                    curEdge.label = curEdge.epaType + " " + curEdge.epaId;
                    curEdge.color = curEdge.epaColor;
                    curEdge.hover_color = hoverColors[curEdge.epaType];
                    curEdge.size = 1;
                    curEdge.source = edgeSource.id;
                    curEdge.target = curNode.id;

                    try {
                        s.graph.addEdge(curEdge);
                    }
                    catch (e) {
                        alert(e);
                    }

                    edgeSource.color = edgeSource.epaColor;
                    edgeSource = null;
                    s.refresh();
                }

                resetModelState();
            }
        });

        $btnEdgeDelete.click(function() {
            $modalEdge.modal('hide');

            s.graph.dropEdge(curEdge.id);

            resetModelState();
        });

        $btnEdgeCancel.click(function() {
            resetModelState();
        });

        $('#file-display-area').bind("DOMSubtreeModified",function(){
            $('#view-tabs').removeClass('hidden');
            $('#loading-model').addClass('hidden');

            $viewTabs.tabs({ active: 0 });
            $nodeTabs.tabs({ active: 0 });
            $edgeTabs.tabs({ active: 0 });

            $("#model-container").remove();
            $("#model-display").append("<div id='model-container'></div>");

            file_text = $fileDisplayArea.innerText;

            let epanetReader = new EPANET_Reader(file_text, "not");

            model = epanetReader.getModel();
            console.log(model);
            populateModelOptions();

            s = new sigma({
                graph: model,
                renderer: {
                    container: $("#model-container")[0],
                    type: 'canvas'
                },
                settings: {
                    minNodeSize: 0,
                    maxNodeSize: 6.5,
                    minEdgeSize: 0.5,
                    maxEdgeSize: 4,
                    enableEdgeHovering: true,
                    edgeHoverSizeRatio: 1.5,
                    nodesPowRatio: 0.3,
                    edgesPowRatio: 0.2,
                    immutable: false
                }
            });

            s.cameras[0].goTo({ ratio: 1.2 });

            setGraphEventListeners();

            s.refresh();
        });
    };

    setGraphEventListeners = function () {
        s.bind('clickStage', function(e) {
            canvasClick(e);
        });

        s.bind('clickNodes', function(e) {
            nodeClick(e);
        });

        s.bind('clickEdges', function(e) {
            edgeClick(e);
        });
    };

    canvasClick = function(e) {
        if(!e.data.captor.isDragging && isAddNode) {
            $('#node-dialog').css({top: e.data.captor.clientY - 10, left: e.data.captor.clientX * 2 - 1600});

            curNode = {};

            let newX,
                newY;

            let _renderer = e.data.renderer,
                _camera = e.data.renderer.camera,
                _prefix = _renderer.options.prefix;

            let offset = calculateOffset(_renderer.container),
                x = event.clientX - offset.left,
                y = event.clientY - offset.top,
                cos = Math.cos(_camera.angle),
                sin = Math.sin(_camera.angle),
                nodes = s.graph.nodes(),
                ref = [];

            // Getting and derotating the reference coordinates.
            for (let i = 0; i < 2; i++) {
                let n = nodes[i];
                let aux = {
                    x: n.x * cos + n.y * sin,
                    y: n.y * cos - n.x * sin,
                    renX: n[_prefix + 'x'],
                    renY: n[_prefix + 'y'],
                };
                ref.push(aux);
            }

            // Applying linear interpolation.
            // if the nodes are on top of each other, we use the camera ratio to interpolate
            if (ref[0].x === ref[1].x && ref[0].y === ref[1].y) {
                let xRatio = (ref[0].renX === 0) ? 1 : ref[0].renX;
                let yRatio = (ref[0].renY === 0) ? 1 : ref[0].renY;
                x = (ref[0].x / xRatio) * (x - ref[0].renX) + ref[0].x;
                y = (ref[0].y / yRatio) * (y - ref[0].renY) + ref[0].y;
            } else {
                let xRatio = (ref[1].renX - ref[0].renX) / (ref[1].x - ref[0].x);
                let yRatio = (ref[1].renY - ref[0].renY) / (ref[1].y - ref[0].y);

                // if the coordinates are the same, we use the other ratio to interpolate
                if (ref[1].x === ref[0].x) {
                    xRatio = yRatio;
                }

                if (ref[1].y === ref[0].y) {
                    yRatio = xRatio;
                }

                x = (x - ref[0].renX) / xRatio + ref[0].x;
                y = (y - ref[0].renY) / yRatio + ref[0].y;
            }

            // Rotating the coordinates.
            newX = x * cos - y * sin;
            newY = y * cos + x * sin;

            $nodeX.html(newX);
            $nodeY.html(newY);

            curNode.epaType = addType;
            curNode.values = [];
            populateNodeModal();
            $chkNodeEdit.click();
            $btnNodeDelete.attr('disabled', true);
        }
    };

    function calculateOffset(element) {
        let style = window.getComputedStyle(element);
        let getCssProperty = function(prop) {
            return parseInt(style.getPropertyValue(prop).replace('px', '')) || 0;
        };
        return {
            left: element.getBoundingClientRect().left + getCssProperty('padding-left'),
            top: element.getBoundingClientRect().top + getCssProperty('padding-top')
        };
    }

    nodeClick = function (e) {
        if(!e.data.captor.isDragging) {
            $('#node-dialog').css({top: e.data.captor.clientY - 10, left: e.data.captor.clientX * 2 - 1600});

            let curNodes = e.data.node;
            if (curNodes.length > 1) {
                $nodeEdgeSelect.empty();
                $nodeEdgeSelect.append('<p>Select a Node to display</p>');

                let selectHtml = "<select id='select-node-edge'>";
                for (let i in curNodes) {
                    selectHtml += "<option value='" + i + "'>" + curNodes[i].epaType + " " + curNodes[i].epaId + "</option>";
                }
                selectHtml += "</select";
                $nodeEdgeSelect.append(selectHtml);
                $nodeEdgeSelect.dialog({
                    title: "Node Select",
                    dialogClass: "no-close",
                    resizable: false,
                    height: "auto",
                    width: 400,
                    modal: true,
                    buttons: {
                        Ok: function () {
                            curNode = curNodes[$('#select-node-edge').val()];
                            populateNodeModal();
                            $(this).dialog("close");
                        },
                        Cancel: function () {
                            $(this).dialog("close");
                        }
                    }
                });

                $nodeEdgeSelect.dialog("open");
            }
            else {
                curNode = curNodes[0];

                if (isAddEdge) {
                    if (curNode.epaType === "Label" || curNode.epaType === "Vertex")
                        alert("Can't create edges off of Verticies or Labels");
                    else {
                        if (edgeSource !== null) {
                            $('#edge-dialog').css({top: e.data.captor.clientY - 10, left: e.data.captor.clientX * 2 - 1600});

                            curEdge = {};
                            curNode.color = "#1affff";

                            curEdge.epaType = addType;
                            curEdge.values = [];
                            curEdge.epaId = "";
                            populateEdgeModal();
                            $chkEdgeEdit.click();
                            $btnEdgeDelete.attr('disabled', true);
                        }
                        else {
                            edgeSource = curNode;
                            edgeSource.color = "#1affff";
                        }
                    }
                }
                else {
                    populateNodeModal();
                }
            }
            s.refresh();
        }
    };

    edgeClick = function(e) {
        if(!e.data.captor.isDragging) {
            $('#edge-dialog').css({top: e.data.captor.clientY - 10, left: e.data.captor.clientX * 2 - 1600});

            let curEdges = e.data.edge;
            if (curEdges.length > 1) {
                $nodeEdgeSelect.empty();
                $nodeEdgeSelect.append('<p>Select an Edge to display</p>');

                let selectHtml = "<select id='select-node-edge'>";
                for (let i in curEdges) {
                    selectHtml += "<option value='" + i + "'>" + curEdges[i].epaType + " " + curEdges[i].epaId + "</option>";
                }
                selectHtml += "</select";
                $nodeEdgeSelect.append(selectHtml);

                $nodeEdgeSelect.dialog({
                    title: "Edge Select",
                    dialogClass: "no-close",
                    resizable: false,
                    height: "auto",
                    width: 400,
                    modal: true,
                    buttons: {
                        Ok: function () {
                            curEdge = curEdges[$('#select-node-edge').val()];
                            populateEdgeModal();
                            $(this).dialog("close");
                        },
                        Cancel: function () {
                            $(this).dialog("close");
                        }
                    }
                });

                $nodeEdgeSelect.dialog("open");
            }
            else {
                curEdge = curEdges[0];
                populateEdgeModal();
            }
            s.refresh();
        }
    };

    populateModelOptions = function () {
        for (let key in model.options) {
            if(key === "unbalanced" || key === "quality" || key === "hydraulics") {
                $('#' + key + 1).val(model.options[key][0]);
                $('#' + key + 2).val(model.options[key][1]);
            }
            else
                $('#' + key).val(model.options[key])
        }
    };

    populateNodeModal = function () {
        curNode.color = "#1affff";
        s.refresh();

        let values = curNode.values;

        let html = "<table class='table table-nonfluid'><tbody>" + nodeHtml[curNode.epaType] + "</tbody></table>";

        $modalNodeLabel.html(curNode.epaType);
        $modalNode.find('.modal-body-content').html(html);
        $modalNode.modal('show');

        if (curNode.epaType !== "Label") {
            $('#node-id').val(curNode.epaId);

            for (let i = 0; i < values.length - 1; ++i) {
                $modalNode.find('input')[i + 1].value = curNode.values[i];
            }

            if (!$('#node-results-view').hasClass('hidden')) {

            }
        }
        else
            $('#node-id').val(curNode.label);
    };

    populateEdgeModal = function () {
        curEdge.hover_color = "#1affff";
        s.refresh();

        let values = curEdge.values;

        let html = "<table class='table table-nonfluid'><tbody>" + edgeHtml[curEdge.epaType] + "</tbody></table>";

        $modalEdgeLabel.html(curEdge.epaType);
        $modalEdge.find('.modal-body-content').html(html);
        $modalEdge.modal('show');

        $('#edge-id').val(curEdge.epaId);

        for (let i = 0; i < values.length - 1; ++i) {
            $modalEdge.find('input')[i + 1].value = curEdge.values[i];
        }

        if (!$('#edge-results-view').hasClass('hidden')) {

        }
    };

    resetModelState = function() {
        s.refresh();
        $btnOptionsOk.attr('disabled', true);
        $chkOptionsEdit.attr('checked', false);
        $btnNodeOk.attr('disabled', true);
        $btnEdgeOk.attr('disabled', true);
        $btnNodeDelete.attr('disabled', true);
        $btnEdgeDelete.attr('disabled', true);
        $chkNodeEdit.attr('checked', false);
        $chkEdgeEdit.attr('checked', false);
        $viewNodeResults.find('select').val("");
        $nodeResults.empty();
        $viewEdgeResults.find('select').val("");
        $edgeResults.empty();
    };

    resetUploadState = function() {
        $inpUlTitle.val('');
        $inpUlDescription.val('');
        $inpUlKeywords.tagsinput('removeAll');
    };

    initializeJqueryVariables = function () {
        $btnOpenModel = $('#btn-open-model');
        $modelOptions = $('#model-options-view');
        $modalNode = $('#modal-node');
        $modalNodeLabel = $('#modal-node-label');
        $modalEdge = $('#modal-edge');
        $modalEdgeLabel = $('#modal-edge-label');
        $modalLog = $('#modalLog');
        $chkDragNodes = $('#chk-graph');
        $loadFromLocal = $("#load-from-local")[0];
        $fileDisplayArea = $("#file-display-area")[0];
        $btnOptionsOk = $('#btn-options-ok');
        $chkOptionsEdit = $('#chk-options');
        $chkNodeEdit = $('#chk-node');
        $chkEdgeEdit = $('#chk-edge');
        $btnNodeOk = $('#btn-node-ok');
        $btnNodeCancel = $('#btn-node-cancel');
        $btnEdgeOk = $('#btn-edge-ok');
        $btnEdgeCancel = $('#btn-edge-cancel');
        $inpUlTitle = $('#inp-upload-title');
        $inpUlDescription = $('#inp-upload-description');
        $inpUlKeywords = $('#tagsinp-upload-keywords');
        $btnUl = $('#btn-upload');
        $btnUlCancel = $('#btn-upload-cancel');
        $viewTabs = $('#view-tabs');
        $nodeTabs = $('#node-tabs');
        $edgeTabs = $('#edge-tabs');
        $loadingModel = $('#loading-model');
        $nodeEdgeSelect = $('#node-edge-select');
        $sideBar = $("#app-content-wrapper");
        $btnEditTools = $('#btn-edit-tools');
        $editToolbar = $('#edit-toolbar');
        $initialModel = $('#initial-model');
        $btnEdgeDelete = $('#btn-edge-delete');
        $btnNodeDelete = $('#btn-node-delete');
        $nodeX = $('#node-x');
        $nodeY = $('#node-y');
        $btnRunModel = $('#btn-run-model');
        $btnPlayModel = $('#btn-play');
        $btnResetModel = $('#btn-reset');
        $viewNodeResults = $('#node-results-view');
        $nodeResults = $('#node-results');
        $viewEdgeResults = $('#edge-results-view');
        $edgeResults = $('#edge-results');
    };

    openModel = function (modelId) {
        let data = {'model_id': modelId};

        $('#view-tabs').addClass('hidden');
        $('#loading-model').removeClass('hidden');

        $.ajax({
            type: 'GET',
            url: '/apps/epanet-model-viewer/get-epanet-model',
            dataType: 'json',
            data: data,
            error: function () {
                let message = 'An unexpected error ocurred while processing the following model ' +
                    '<a href="https://www.hydroshare.org/resource/' + modelId + '" target="_blank">' +
                    modelId + '</a>. An app admin has been notified.';

                addLogEntry('danger', message);
            },
            success: function (response) {
                let message;

                if (response.hasOwnProperty('success')) {
                    if (response.hasOwnProperty('message')) {
                        message = response.message;
                    }

                    if (!response.success) {
                        if (!message) {
                            message = 'An unexpected error ocurred while processing the following model ' +
                                '<a href="https://www.hydroshare.org/resource/' + modelId + '" target="_blank">' +
                                modelId + '</a>. An app admin has been notified.';
                        }

                        addLogEntry('danger', message);
                    } else {
                        if (message) {
                            addLogEntry('warning', message);
                        }
                        if (response.hasOwnProperty('results')) {
                            addModelToUI(response.results);
                            addMetadataToUI(response.metadata);
                        }
                    }
                }
            }
        });
    };

    uploadModel = function (data) {
        $.ajax({
            type: 'POST',
            url: '/apps/epanet-model-viewer/upload-epanet-model/',
            dataType: 'json',
            processData: false,
            contentType: false,
            data: data,
            error: function () {
                let message = 'An unexpected error occurred while uploading the model ';

                addLogEntry('danger', message);
            },
            success: function (response) {
                let message;

                if (response.hasOwnProperty('success')) {
                    $('#model-save-animation').attr('hidden', true);

                    if (response.hasOwnProperty('message')) {
                        message = response.message;
                    }

                    if (!response.success) {
                        if (!message) {
                            message = 'An unexpected error occurred while uploading the model';
                        }

                        addLogEntry('danger', message);
                    } else {
                        if (message) {
                            addLogEntry('warning', message);
                        }
                        alert("Model has successfully been uploaded to HydroShare.");
                    }
                }
            }
        });
    };

    setStateAfterLastModel = function () {
        hideMainLoadAnim();
        if (showLog) {
            $modalLog.modal('show');
            showLog = false;
        } else {
            showLoadingCompleteStatus(true, 'Resource(s) added successfully!');
        }
    };

    hideMainLoadAnim = function () {
        $('#div-loading').addClass('hidden');
        $('#upload-container').removeAttr('hidden');
    };

    showLoadingCompleteStatus = function (success, message) {
        let successClass = success ? 'success' : 'error';
        let $modelLoadingStatus = $('#model-load-status');
        let $statusText = $('#status-text');
        let showTime = success ? 2000 : 4000;
        $statusText.text(message)
            .removeClass('success error')
            .addClass(successClass);
        $modelLoadingStatus.removeClass('hidden');
        setTimeout(function () {
            $modelLoadingStatus.addClass('hidden');
        }, showTime);
    };

    addModelToUI = function (result) {
        $fileDisplayArea.innerText = result;

        setStateAfterLastModel();
    };

    addMetadataToUI = function (metadata) {
        let metadataDisplayArea = $('#metadata-display-area')[0];
        let metadataHTML = '<p><h1>' + metadata['title'] + '</h1><h6>' + metadata['description'] + '</h6>' +
            '<a href="' + metadata['identifiers'][0]['url'] + '" style="color:#3366ff">View the Model in HydroShare</a><br><br>' +
            'Created: ' + metadata['dates'][1]['start_date'].substring(0, 10) +
            ', &emsp;Last Modified: ' + metadata['dates'][1]['start_date'].substring(0, 10) +
            '<br>Author: ' + metadata['creators'][0]['name'] + '<br>Rights: ' + metadata['rights'];

        let subjects = "";
        let i;
        for (i in metadata['subjects']) {
            subjects += metadata['subjects'][i]['value'] + ', ';
        }
        metadataHTML += '<br>Subjects: ' + subjects.substring(0, subjects.length - 2);


        try {
            metadataHTML += '<br> Program: ' + '<a href="' + metadata['executed_by']['modelProgramIdentifier'] +
                '" style="color:#3366ff">' + metadata['executed_by']['modelProgramName'] + '</a>';
        }
        catch (error) {
            //    No program included in metadata
        }


        metadataHTML += '</p><br>';

        metadataHTML += '<div class="panel panel-default"><div class="panel-heading"><h4 class="panel-title"><a data-toggle="collapse" href="#metadata-json">&nbsp; Raw Metadata JSON<span class="glyphicon glyphicon-minus pull-left"></span></a></h4></div><div id="metadata-json" class="filter-list panel-collapse collapse"><pre>' + JSON.stringify(metadata, null, 2) + '</pre></div></div>';

        metadataDisplayArea.innerHTML = metadataHTML;
    };

    addLogEntry = function (type, message, show) {
        let icon;
        let timeStamp;

        switch (type) {
            case 'success':
                icon = 'ok';
                break;
            case 'danger':
                icon = 'remove';
                showLog = true;
                break;
            default:
                icon = type;
                showLog = true;
        }

        timeStamp = new Date().toISOString();

        $('#logEntries').prepend('<div class="alert-' + type + '">' +
            '<span class="glyphicon glyphicon-' + icon + '-sign" aria-hidden="true"></span>  '
            + timeStamp + ' *** \t'
            + message +
            '</div><br>');

        if (show) {
            $modalLog.modal('show');
            showLog = false;
        }
    };

    /*-----------------------------------------------
     ************TO ENABLE PROPER UPLOAD*************
     ----------------------------------------------*/
    addDefaultBehaviorToAjax = function () {
        $.ajaxSetup({
            beforeSend: function (xhr, settings) {
                if (!checkCsrfSafe(settings.type) && !this.crossDomain) {
                    xhr.setRequestHeader("X-CSRFToken", getCookie("csrftoken"));
                }
            }
        });
    };

    checkCsrfSafe = function (method) {
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    };

    getCookie = function (name) {
        let cookie;
        let cookies;
        let cookieValue = null;
        let i;

        if (document.cookie && document.cookie !== '') {
            cookies = document.cookie.split(';');
            for (i = 0; i < cookies.length; i += 1) {
                cookie = $.trim(cookies[i]);
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    };


    /*-----------------------------------------------
     **************ONLOAD FUNCTION*******************
     ----------------------------------------------*/
    $(function () {
        initializeJqueryVariables();
        addInitialEventListeners();

        if ($initialModel.length) {
            openModel($initialModel.html());
        }
        else {
            $('#upload-container').removeAttr('hidden');

            $btnEditTools.click();
            s = new sigma({
                graph: {
                    nodes: [
                        {
                            id: 'rando1',
                            size: 0,
                            x: 0,
                            y: 0
                        },
                        {
                            id: 'rando2',
                            size: 0,
                            x: 100,
                            y: 100
                        }
                    ]
                },
                renderer: {
                    container: $("#model-container")[0],
                    type: 'canvas'
                },
                settings: {
                    minNodeSize: 0,
                    maxNodeSize: 6.5,
                    minEdgeSize: 0.5,
                    maxEdgeSize: 4,
                    enableEdgeHovering: true,
                    edgeHoverSizeRatio: 1.5,
                    nodesPowRatio: 0.3,
                    edgesPowRatio: 0.2,
                    immutable: false
                }
            });
            setGraphEventListeners();
        }

        $("#app-content-wrapper").removeClass('show-nav');
        $('[data-toggle="tooltip"]').tooltip();

        addDefaultBehaviorToAjax();

        $viewTabs.tabs({ active: 0 });
        $nodeEdgeSelect.dialog({ autoOpen: false });

        // Custom edge render for edges with vertices
        sigma.utils.pkg('sigma.canvas.edges');
        sigma.canvas.edges.vert = function(edge, source, target, context, settings) {
            let color = edge.color,
                prefix = settings('prefix') || '';

            context.strokeStyle = color;
            context.lineWidth = edge[prefix + 'size'];

            context.beginPath();
            context.moveTo(
                source[prefix + 'x'],
                source[prefix + 'y']
            );

            let verticies = edge.vert;

            for (let i = 0; i < verticies.length; ++i) {
                try {
                    let nodesOnScreen = s.renderers["0"].nodesOnScreen;
                    let nextVert = nodesOnScreen.find(node => node.epaId === verticies[i]);

                    context.lineTo(
                        nextVert[prefix + 'x'],
                        nextVert[prefix + 'y']
                    );
                }
                catch (e) {
                    // nothing
                }
            }

            context.lineTo(
                target[prefix + 'x'],
                target[prefix + 'y']
            );

            context.stroke();
        };

        sigma.utils.pkg('sigma.canvas.edgehovers');
        sigma.canvas.edgehovers.vert = function(edge, source, target, context, settings) {
            let color = edge.color,
                prefix = settings('prefix') || '',
                size = settings('edgeHoverSizeRatio') * (edge[prefix + 'size'] || 1),
                edgeColor = settings('edgeColor'),
                defaultNodeColor = settings('defaultNodeColor'),
                defaultEdgeColor = settings('defaultEdgeColor'),
                sX = source[prefix + 'x'],
                sY = source[prefix + 'y'],
                tX = target[prefix + 'x'],
                tY = target[prefix + 'y'];

            if (!color)
                switch (edgeColor) {
                    case 'source':
                        color = source.color || defaultNodeColor;
                        break;
                    case 'target':
                        color = target.color || defaultNodeColor;
                        break;
                    default:
                        color = defaultEdgeColor;
                        break;
                }

            if (settings('edgeHoverColor') === 'edge') {
                color = edge.hover_color || color;
            } else {
                color = edge.hover_color || settings('defaultEdgeHoverColor') || color;
            }

            context.strokeStyle = color;
            context.lineWidth = size;
            context.beginPath();
            context.moveTo(sX, sY);
            let verticies = edge.vert;
            for (let i = 0; i < verticies.length; ++i) {
                try {
                    let nodesOnScreen = s.renderers["0"].nodesOnScreen;
                    let nextVert = nodesOnScreen.find(node => node.epaId === verticies[i]);

                    context.lineTo(
                        nextVert[prefix + 'x'],
                        nextVert[prefix + 'y']
                    );
                }
                catch (e) {
                    // nothing
                }
            }
            context.lineTo(tX, tY);
            context.stroke();
        };
    });

    /*-----------------------------------------------
     ***************INVOKE IMMEDIATELY***************
     ----------------------------------------------*/

    sigma.utils.pkg('sigma.canvas.nodes');

    showLog = false;
}()); // End of package wrapper
// NOTE: that the call operator (open-closed parenthesis) is used to invoke the library wrapper
// function immediately after being parsed.