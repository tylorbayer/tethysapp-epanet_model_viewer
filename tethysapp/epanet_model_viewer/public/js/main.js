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
    var dataTableLoadModels,
        showLog,
        s,
        curModel,
        file_text,
        curNode,
        curEdge,
        graphColors = {
            Junction: '#666',
            Vertex: "#666",
            Reservoir: '#5F9EA0',
            Tank: '#8B4513',
            Pipe: '#808080',
            Pump: '#DAA520',
            Valve: '#3333cc' };

    //  *********FUNCTIONS***********
    var addListenersToModelRepTable,
        addInitialEventListeners,
        buildModelRepTable,
        generateModelList,
        initializeJqueryVariables,
        redrawModelTable,
        onClickOpenModel,
        showMainLoadAnim,
        openModel,
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
        openInitialModel;

    //  **********Query Selectors************
    var $modalModelRep,
        $modelOptions,
        $modalNode,
        $uploadContainer,
        $modalNodeLabel,
        $modalEdge,
        $modalEdgeLabel,
        $btnOpenModel,
        $chkGraphEdit,
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
        $loadingModel,
        $nodeEdgeSelect;

    /******************************************************
     **************FUNCTION DECLARATIONS*******************
     ******************************************************/

    addListenersToModelRepTable = function () {
        $modalModelRep.find('tbody tr').on('click', function () {
            $btnOpenModel.prop('disabled', false);
            $(this)
                .unbind().dblclick(function () {
                onClickOpenModel();
            })
                .css({
                    'background-color': '#1abc9c',
                    'color': 'white'
                })
                .find('input').prop('checked', true);
            $('tr').not($(this)).css({
                'background-color': '',
                'color': ''
            });
        });
    };

    addInitialEventListeners = function () {
        $('#btn-model-rep').click(function () {
            var curURL = window.location.href;
            window.open(curURL.substring(0, curURL.indexOf('/apps/') + 6) + "epanet-model-repository/", "_self");
        });

        $modalModelRep.on('shown.bs.modal', function () {
            if (dataTableLoadModels) {
                redrawModelTable(dataTableLoadModels, $(this));
            }
        });

        $btnOpenModel.on('click', onClickOpenModel);

        $loadFromLocal.addEventListener('change', function() {
            var file = $loadFromLocal.files[0];

            var reader = new FileReader();

            reader.onload = function() {
                $fileDisplayArea.innerText = reader.result;
            };

            reader.readAsText(file);
        });

        $btnUl.click(function() {
            if ($inpUlTitle.val() != '' && $inpUlDescription.val() != '' && $inpUlKeywords.val() != '') {
                curModel.title = [$inpUlTitle.val(), $inpUlDescription.val()];

                var epanetWriter = new EPANET_Writer(curModel);

                var data = new FormData();
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

        $chkGraphEdit.click(function() {
            if ($chkGraphEdit.is(':checked')) {
                var dragListener = sigma.plugins.dragNodes(s, s.renderers[0]);

                dragListener.bind('startdrag', function(e) {
                    $('#model-display').css("cursor", "-webkit-grabbing");
                });
                dragListener.bind('drag', function(e) {
                    s.unbind('clickNodes');
                });
                // dragListener.bind('drop', function(e) {
                //     console.log(e);
                // });
                dragListener.bind('dragend', function(e) {
                    $('#model-display').css("cursor", "-webkit-grab");

                    setTimeout(function(){
                        s.bind('clickNodes', function(e) {
                            nodeClick(e);
                        });
                    },250);

                    var myNode = curModel.nodes.find(node => node.id === e.data.node.id);
                    myNode.x = Math.round(e.data.node.x * 100) / 100;
                    myNode.y = Math.round(e.data.node.y * 100) / 100;
                });

                $('#model-display').css("cursor", "-webkit-grab");
            }
            else {
                sigma.plugins.killDragNodes(s);

                $('#model-display').css("cursor", "default");
            }
        });

        $modalNode.on('hidden.bs.modal', function () {
            curNode.color = graphColors[curNode.type];
            s.refresh();
        });

        $modalEdge.on('hidden.bs.modal', function () {
            curEdge.hover_color = graphColors[curEdge.type];
            s.refresh();
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
            for(var key in curModel.options) {
                if(key == "unbalanced" || key == "quality" || key == "hydraulics") {
                    curModel.options[key][0] = $('#' + key + 1).val();
                    curModel.options[key][1] = $('#' + key + 2).val();
                }
                else
                    curModel.options[key] = $('#' + key).val();
            }

            $modelOptions.find('input').attr('readonly', true);
            $modelOptions.find('select').attr('disabled', true);
            resetModelState();
            populateModelOptions();
        });

        $chkNodeEdit.click(function() {
            if ($chkNodeEdit.is(':checked')) {
                $btnNodeOk.removeAttr('disabled');

                $modalNode.find('input').attr('readonly', false);
            }
            else {
                $btnNodeOk.attr('disabled', true);

                $modalNode.find('input').attr('readonly', true);

                populateNodeModal(curNode);
            }
        });

        $chkEdgeEdit.click(function() {
            if ($chkEdgeEdit.is(':checked')) {
                $btnEdgeOk.removeAttr('disabled');

                $modalEdge.find('input').attr('readonly', false);
            }
            else {
                $btnEdgeOk.attr('disabled', true);

                $modalEdge.find('input').attr('readonly', true);

                populateEdgeModal(curEdge);
            }
        });

        $btnNodeOk.click(function() {
            $modalNode.modal('hide');

            curNode.id = $('#node-id').val();
            curNode.label = curNode.type + ' ' + $('#node-id').val();

            for (var i = 1; i < $modalNode.find('input').length - 1; ++i) {
                curNode.values[i - 1] = $modalNode.find('input')[i].value;
            }

            resetModelState();
        });

        $btnNodeCancel.click(function() {
            resetModelState();
        });

        $btnEdgeOk.click(function() {
            $modalEdge.modal('hide');

            curEdge.id = $('#edge-id').val();
            curEdge.label = curEdge.type + ' ' + $('#edge-id').val();

            for (var i = 1; i < $modalEdge.find('input').length - 1; ++i) {
                curEdge.values[i - 1] = $modalEdge.find('input')[i].value;
            }

            resetModelState();
        });

        $btnEdgeCancel.click(function() {
            resetModelState();
        });

        $('#file-display-area').bind("DOMSubtreeModified",function(){
            $('#view-tabs').removeClass('hidden');
            $('#loading-model').addClass('hidden');
            $uploadContainer.removeClass('hidden');

            $viewTabs.tabs({ active: 0 });

            curModel = {
                nodes: [],
                edges: [],
                options: {}
            };

            $("#model-container").remove();
            $("#model-display").append("<div id='model-container'></div>");

            file_text = $fileDisplayArea.innerText;

            var epanetReader = new EPANET_Reader(file_text, "not");

            curModel.nodes = epanetReader.getNodes();
            curModel.edges = epanetReader.getEdges();

            curModel.options = epanetReader.getOptions();
            populateModelOptions();

            s = new sigma({
                graph: curModel,
                renderer: {
                    // IMPORTANT:
                    // This works only with the canvas renderer, so the
                    // renderer type set as "canvas" is necessary here.
                    container: $("#model-container")[0],
                    type: 'canvas'
                },
                settings: {
                    minNodeSize: 0.2,
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

            s.bind('clickNodes', function(e) {
                nodeClick(e);
            });

            s.bind('clickEdges', function(e) {
                edgeClick(e);
            });

            s.refresh();
        });
    };

    nodeClick = function (e) {
        if(!e.data.captor.isDragging) {
            $('#node-dialog').css({top: e.data.captor.clientY - 10, left: e.data.captor.clientX - 500});

            var curNodes = e.data.node;
            if (curNodes.length > 1) {
                $nodeEdgeSelect.empty();
                $nodeEdgeSelect.append('<p>Select a Node to display</p>');

                var selectHtml = "<select id='select-node-edge'>";
                for (var i in curNodes) {
                    selectHtml += "<option value='" + i + "'>" + curNodes[i].type + " " + curNodes[i].id + "</option>";
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
                populateNodeModal();
            }
            s.refresh();
        }
    };

    edgeClick = function(e) {
        if(!e.data.captor.isDragging) {
            $('#edge-dialog').css({top: e.data.captor.clientY, left: e.data.captor.clientX - 500});

            var curEdges = e.data.edge;
            if (curEdges.length > 1) {
                $nodeEdgeSelect.empty();
                $nodeEdgeSelect.append('<p>Select an Edge to display</p>');

                var selectHtml = "<select id='select-node-edge'>";
                for (var i in curEdges) {
                    selectHtml += "<option value='" + i + "'>" + curEdges[i].type + " " + curEdges[i].id + "</option>";
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
        for(var key in curModel.options) {
            if(key == "unbalanced" || key == "quality" || key == "hydraulics") {
                $('#' + key + 1).val(curModel.options[key][0]);
                $('#' + key + 2).val(curModel.options[key][1]);
            }
            else
                $('#' + key).val(curModel.options[key])
        }
    };

    populateNodeModal = function () {
        curNode.color = "#1affff";
        s.refresh();

        var html = "<table class='table table-nonfluid'><tbody>";
        var values = curNode.values;

        if (curNode.type == "Junction") {
            html +=
                "<tr><td><b>Junction:</b></td><td><input type='text' id='node-id' class='inp-properties' value='" + curNode.id + "' readonly></td></tr>" +
                "<tr><td>Elev:</td><td><input type='number' class='inp-properties' value='" + values[0] + "' readonly></td></tr>" +
                "<tr><td>Demand:</td><td><input type='number' class='inp-properties' value='" + values[1] + "' readonly></td></tr>" +
                "<tr><td>Pattern:</td><td><input type='text' class='inp-properties' value='" + values[2] + "' readonly></td></tr>" +
                "<tr><td>Quality:</td><td><input type='number' class='inp-properties' value='" + values[3] + "' readonly></td></tr>";
        }
        else if (curNode.type == "Reservoir") {
            html +=
                "<tr><td><b>Reservoir:</b></td><td><input type='text' id='node-id' class='inp-properties' value='" + curNode.id + "' readonly></td></tr>" +
                "<tr><td>Head:</td><td><input type='text' class='inp-properties' value='" + values[0] + "' readonly></td></tr>" +
                "<tr><td>Pattern:</td><td><input type='text' class='inp-properties' value='" + values[1] + "' readonly></td></tr>" +
                "<tr><td>Quality:</td><td><input type='number' class='inp-properties' value='" + values[2] + "' readonly></td></tr>";
        }
        else if (curNode.type == "Tank") {
            html +=
                "<tr><td><b>Tank:</b></td><td><input type='text' id='node-id' class='inp-properties' value='" + curNode.id + "' readonly></td></tr>" +
                "<tr><td>Elevation:</td><td><input type='number' class='inp-properties' value='" + values[0] + "' readonly></td></tr>" +
                "<tr><td>InitLevel:</td><td><input type='number' class='inp-properties' value='" + values[1] + "' readonly></td></tr>" +
                "<tr><td>MinLevel:</td><td><input type='number' class='inp-properties' value='" + values[2] + "' readonly></td></tr>" +
                "<tr><td>MaxLevel:</td><td><input type='number' class='inp-properties' value='" + values[3] + "' readonly></td></tr>" +
                "<tr><td>Diameter:</td><td><input type='number' class='inp-properties' value='" + values[4] + "' readonly></td></tr>" +
                "<tr><td>MinVol:</td><td><input type='number' class='inp-properties' value='" + values[5] + "' readonly></td></tr>" +
                "<tr><td>VolCurve:</td><td><input type='text' class='inp-properties' value='" + values[6] + "' readonly></td></tr>" +
                "<tr><td>Quality:</td><td><input type='number' class='inp-properties' value='" + values[7] + "' readonly></td></tr>";
        }
        else {
             html += "<tr><td><b>Vertex:</b></td><td><input type='number' id='node-id' value='" + curNode.id + "' readonly></td></tr>";
        }
        html += "</tbody></table>";

        $modalNodeLabel.html(curNode.type + " Properties");
        $modalNode.find('.modal-body').html(html);
        $modalNode.modal('show');
    };

    populateEdgeModal = function () {
        curEdge.hover_color = "#1affff";
        s.refresh();

        var html = "<table class='table table-nonfluid'><tbody>";
        var values = curEdge.values;

        if (curEdge.type == "Pipe") {
            html +=
                "<tr><td><b>Pipe:</b></td><td><input type='number' id='edge-id' class='inp-properties' value='" + curEdge.id + "' readonly></td></tr>" +
                "<tr><td>Length:</td><td><input type='number' class='inp-properties' value='" + values[0] + "' readonly></td></tr>" +
                "<tr><td>Roughness:</td><td><input type='number' class='inp-properties' value='" + values[1] + "' readonly></td></tr>" +
                "<tr><td>Diameter:</td><td><input type='number' class='inp-properties' value='" + values[2] + "' readonly></td></tr>" +
                "<tr><td>Minor Loss:</td><td><input type='number' class='inp-properties' value='" + values[3] + "' readonly></td></tr>" +
                "<tr><td>Status:</td><td><input type='text' class='inp-properties' value='" + values[4] + "' readonly><br><p>('Open' or 'Closed')</p></td></tr>";
        }
        else if (curEdge.type == "Pump") {
            html +=
                "<tr><td><b>Pump:</td><td><input type='number' id='edge-id' class='inp-properties' value='" + curEdge.id + "' readonly></td></tr>" +
                "<tr><td>Parameters:</td><td><input type='text' class='inp-properties' value='" + values[0] + "' readonly><br>" +
                "<input type='text' class='inp-properties' value='" + values[1] + "' readonly></td></tr>";
        }
        else {
            html +=
                "<div><b>Valve:</td><td><input type='number' id='edge-id' class='inp-properties' value='" + curEdge.id + "' readonly></td></tr>" +
                "<tr><td>Diameter:</td><td><input type='number' class='inp-properties' value='" + values[0] + "' readonly></td></tr>" +
                "<tr><td>Type:</td><td><input type='text' class='inp-properties' value='" + values[1] + "' readonly></td></tr>" +
                "<tr><td>Setting:</td><td><input type='number' class='inp-properties' value='" + values[2] + "' readonly></td></tr>" +
                "<tr><td>Minor Loss:</td><td><input type='number' class='inp-properties' value='" + values[3] + "' readonly></td></tr>";
        }
        html += "</tbody></table>";

        $modalEdgeLabel.html(curEdge.type + " Properties");
        $modalEdge.find('.modal-body').html(html);
        $modalEdge.modal('show');
    };

    resetModelState = function() {
        $btnOptionsOk.attr('disabled', true);
        $chkOptionsEdit.attr('checked', false);
        $btnNodeOk.attr('disabled', true);
        $btnEdgeOk.attr('disabled', true);
        $chkNodeEdit.attr('checked', false);
        $chkEdgeEdit.attr('checked', false);
    };

    resetUploadState = function() {
        $inpUlTitle.val('');
        $inpUlDescription.val('');
        $inpUlKeywords.tagsinput('removeAll');
    };

    buildModelRepTable = function (modelList) {
        var modelTableHtml;

        modelList = typeof modelList === 'string' ? JSON.parse(modelList) : modelList;
        modelTableHtml = '<table id="tbl-models"><thead><th></th><th>Title</th><th>Subjects</th><th>Type</th><th>Owner</th></thead><tbody>';

        modelList.forEach(function (model) {
            var subjects = "";

            for (var subject in model.subjects) {
                subjects += subject + " ";
            }

            modelTableHtml += '<tr>' +
                '<td><input type="radio" name="model" class="rdo-model" value="' + model.id + '"></td>' +
                '<td class="model_title">' + model.title + '</td>' +
                '<td class="model_subjects">' + model.subjects + '</td>' +
                '<td class="model_type">' + model.type + '</td>' +
                '<td class="model_owner">' + model.owner + '</td>' +
                '</tr>';
        });
        modelTableHtml += '</tbody></table>';
        $modalModelRep.find('.modal-body').html(modelTableHtml);
        addListenersToModelRepTable();
        dataTableLoadModels = $('#tbl-models').DataTable({
            'order': [[1, 'asc']],
            'columnDefs': [{
                'orderable': false,
                'targets': 0
            }],
            "scrollY": '500px',
            "scrollCollapse": true,
            fixedHeader: {
                header: true,
                footer: true
            }
        });
    };

    generateModelList = function (numRequests) {
        $.ajax({
            type: 'GET',
            url: '/apps/epanet-model-viewer/get-epanet-model-list',
            dataType: 'json',
            error: function () {
                if (numRequests < 5) {
                    numRequests += 1;
                    setTimeout(generateModelList(), 3000);
                } else {
                    $modalModelRep.find('.modal-body').html('<div class="error">An unexpected error was encountered while attempting to load models.</div>');
                }
            },
            success: function (response) {
                if (response.hasOwnProperty('success')) {
                    if (!response.success) {
                        $modalModelRep.find('.modal-body').html('<div class="error">' + response.message + '</div>');
                    } else {
                        if (response.hasOwnProperty('model_list')) {
                            buildModelRepTable(response.model_list);
                        }
                        $btnOpenModel.add('#div-chkbx-model-auto-close').removeClass('hidden');
                    }
                }
            }
        });
    };

    openInitialModel = function () {
        var $initialModel = $('#initial-model');
        if ($initialModel.length){
            openModel($initialModel.html());
        }
    };

    redrawModelTable = function (modelTable, $modal) {
        var interval;
        interval = window.setInterval(function () {
            if ($modal.css('display') !== 'none' && $modal.find('table').length > 0) {
                $modal.find('.dataTables_scrollBody').css('height', $modal.find('.modal-body').height().toString() - 160 + 'px');
                modelTable.columns.adjust().draw();
                window.clearInterval(interval);
            }
        }, 100);
    };

    initializeJqueryVariables = function () {
        $btnOpenModel = $('#btn-open-model');
        $modelOptions = $('#model-options-view');
        $modalModelRep = $('#modal-model-rep');
        $uploadContainer = $('#upload-container');
        $modalNode = $('#modal-node');
        $modalNodeLabel = $('#modal-node-label');
        $modalEdge = $('#modal-edge');
        $modalEdgeLabel = $('#modal-edge-label');
        $modalLog = $('#modalLog');
        $chkGraphEdit = $('#chk-graph');
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
        $loadingModel = $('#loading-model');
        $nodeEdgeSelect = $('#node-edge-select');
    };

    onClickOpenModel = function () {
        var $rdoRes = $('.rdo-model:checked');
        var modelId = $rdoRes.val();

        showMainLoadAnim();
        $modalModelRep.modal('hide');
        $uploadContainer.addClass('hidden');

        openModel(modelId);
    };

    openModel = function (modelId) {
        var data = {'model_id': modelId};

        $('#view-tabs').addClass('hidden');
        $('#loading-model').removeClass('hidden');

        $.ajax({
            type: 'GET',
            url: '/apps/epanet-model-viewer/get-epanet-model',
            dataType: 'json',
            data: data,
            error: function () {
                var message = 'An unexpected error ocurred while processing the following model ' +
                    '<a href="https://www.hydroshare.org/resource/' + modelId + '" target="_blank">' +
                    modelId + '</a>. An app admin has been notified.';

                addLogEntry('danger', message);
            },
            success: function (response) {
                var message;

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
                var message = 'An unexpected error occurred while uploading the model ';

                addLogEntry('danger', message);
            },
            success: function (response) {
                var message;

                if (response.hasOwnProperty('success')) {
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
                        if (response.hasOwnProperty('results') && response.hasOwnProperty('metadata')) {
                            addModelToUI(response.results);
                            addMetadataToUI(response.metadata);
                            $modalModelRep.find('.modal-body').html('<img src="/static/epanet_model_viewer/images/loading-animation.gif">' +
                                '<br><p><b>Loading model repository...</b></p><p>Note: Loading will continue if dialog is closed.</p>');
                            alert("Model has successfully been uploaded to HydroShare.");
                            generateModelList();
                        }
                        else {
                            $uploadContainer.addClass('hidden');
                            $modalModelRep.find('.modal-body').html('<img src="/static/epanet_model_viewer/images/loading-animation.gif">' +
                                '<br><p><b>Loading model repository...</b></p><p>Note: Loading will continue if dialog is closed.</p>');
                            alert("Model has successfully been uploaded to HydroShare.");
                            generateModelList();
                        }
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

    showMainLoadAnim = function () {
        $('#div-loading').removeClass('hidden');
    };

    hideMainLoadAnim = function () {
        $('#div-loading').addClass('hidden');
    };

    showLoadingCompleteStatus = function (success, message) {
        var successClass = success ? 'success' : 'error';
        var $modelLoadingStatus = $('#model-load-status');
        var $statusText = $('#status-text');
        var showTime = success ? 2000 : 4000;
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
        var metadataDisplayArea = $('#metadata-display-area')[0];
        var metadataHTML = '<p><h1>' + metadata['title'] + '</h1><h6>' + metadata['description'] + '</h6>' +
            '<a href="' + metadata['identifiers'][0]['url'] + '" style="color:#3366ff">View the Model in HydroShare</a><br><br>' +
            'Created: ' + metadata['dates'][1]['start_date'].substring(0, 10) +
            ', &emsp;Last Modified: ' + metadata['dates'][1]['start_date'].substring(0, 10) +
            '<br>Author: ' + metadata['creators'][0]['name'] + '<br>Rights: ' + metadata['rights'];

        var subjects = "";
        var i;
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
        var icon;
        var timeStamp;

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

    addDefaultBehaviorToAjax = function () {
        // Add CSRF token to appropriate ajax requests
        $.ajaxSetup({
            beforeSend: function (xhr, settings) {
                if (!checkCsrfSafe(settings.type) && !this.crossDomain) {
                    xhr.setRequestHeader("X-CSRFToken", getCookie("csrftoken"));
                }
            }
        });
    };

    // Find if method is CSRF safe
    checkCsrfSafe = function (method) {
        // these HTTP methods do not require CSRF protection
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    };

    getCookie = function (name) {
        var cookie;
        var cookies;
        var cookieValue = null;
        var i;

        if (document.cookie && document.cookie !== '') {
            cookies = document.cookie.split(';');
            for (i = 0; i < cookies.length; i += 1) {
                cookie = $.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
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
        openInitialModel();
        initializeJqueryVariables();
        addInitialEventListeners();
        addDefaultBehaviorToAjax();

        $viewTabs.tabs({ active: 0 });
        $nodeEdgeSelect.dialog({ autoOpen: false });
    });

    /*-----------------------------------------------
     ***************INVOKE IMMEDIATELY***************
     ----------------------------------------------*/
    // generateModelList();

    sigma.utils.pkg('sigma.canvas.nodes');

    showLog = false;
}()); // End of package wrapper
// NOTE: that the call operator (open-closed parenthesis) is used to invoke the library wrapper
// function immediately after being parsed.