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
        curNode,
        curEdge,
        curFile;

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
        populateNodeModal,
        populateEdgeModal,
        uploadModel,
        addDefaultBehaviorToAjax,
        checkCsrfSafe,
        getCookie,
        openInitialModel;

    //  **********Query Selectors************
    var $modalModelRep,
        $modalNode,
        $uploadContainer,
        $modalNodeLabel,
        $modalEdge,
        $modalEdgeLabel,
        $btnOpenModel,
        $modalLog,
        $loadFromLocal,
        $fileDisplayArea,
        $chkNodeEdit,
        $chkEdgeEdit,
        $btnNodeOk,
        $btnNodeCancel,
        $btnEdgeOk,
        $btnEdgeCancel,
        $inpUlTitle,
        $inpUlDescription,
        $inpUlKeyworkds,
        $btnUl,
        $btnUlCancel,
        $viewTabs,
        $loadingModel;

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
                curFile = reader.result;
                $fileDisplayArea.innerText = curFile;
                $uploadContainer.removeClass('hidden');
            };

            reader.readAsText(file);
        });

        $btnUl.click(function() {
            if ($inpUlTitle.val() != '' && $inpUlDescription.val() != '' && $inpUlKeyworkds.val() != '') {
                var data = new FormData();
                data.append('model_title', $inpUlTitle.val());
                data.append('model_description', $inpUlDescription.val());
                data.append('model_keywords', $inpUlKeyworkds.tagsinput('items'));
                data.append('model_file', curFile);

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

        $chkNodeEdit.click(function() {
            if ($chkNodeEdit.is(':checked')) {
                $btnNodeOk.removeAttr('disabled');

                $modalNode.find('.inp-properties').attr('readonly', false);
            }
            else {
                $btnNodeOk.attr('disabled', true);

                $modalNode.find('.inp-properties').attr('readonly', true);

                populateNodeModal(curNode);
            }
        });

        $chkEdgeEdit.click(function() {
            if ($chkEdgeEdit.is(':checked')) {
                $btnEdgeOk.removeAttr('disabled');

                $modalEdge.find('.inp-properties').attr('readonly', false);
            }
            else {
                $btnEdgeOk.attr('disabled', true);

                $modalEdge.find('.inp-properties').attr('readonly', true);

                populateEdgeModal(curEdge);
            }
        });

        $btnNodeOk.click(function() {
            $('#modal-node').modal('hide');
            resetModelState();
        });

        $btnNodeCancel.click(function() {
            resetModelState();
        });

        $btnEdgeOk.click(function() {
            $('#modal-edge').modal('hide');
            resetModelState();
        });

        $btnEdgeCancel.click(function() {
            resetModelState();
        });

        $('#file-display-area').bind("DOMSubtreeModified",function(){
            $('#view-tabs').removeClass('hidden');
            $('#loading-model').addClass('hidden');
            
            $viewTabs.tabs({ active: 0 });

            curModel = {
                nodes: [],
                edges: []
            };

            $("#model-container").remove();
            $("#model-display").append("<div id='model-container'></div>");

            var file_text = $fileDisplayArea.innerText;

            var epanetLexer = new EPANET_Lexer(file_text, "not");

            curModel.nodes = epanetLexer.getNodes();
            curModel.edges = epanetLexer.getEdges();

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
                    minEdgeSize: 0.5,
                    maxEdgeSize: 4,
                    enableEdgeHovering: true,
                    edgeHoverSizeRatio: 1.5
                }
            });

            s.cameras[0].goTo({ ratio: 1.2 });

            s.bind('clickNode', function(e) {
                $('#node-dialog').css({ top: e.data.captor.clientY - 10, left: e.data.captor.clientX - 500});

                curNode = e.data.node;
                populateNodeModal(curNode);
            });

            s.bind('clickEdge', function(e) {
                $('#edge-dialog').css({ top: e.data.captor.clientY, left: e.data.captor.clientX - 500});

                curEdge = e.data.edge;
                populateEdgeModal(curEdge);
            });

            s.refresh();
        });
    };

    populateNodeModal = function (node) {
        var html = "";
        var values = node.values;

        if (node.type == "Junction") {
            html += "<div><b>Junction: <input type='text' class='inp-properties' value='" + node.id + "' readonly></b><br>" +
                "Elev: <input type='text' class='inp-properties' value='" + values[0] + "' readonly><br>" +
                "Demand: <input type='text' class='inp-properties' value='" + values[1] + "' readonly><br>" +
                "Pattern: <input type='text' class='inp-properties' value='" + values[2] + "' readonly><br></div>";
        }
        else if (node.type == "Reservoir") {
            html += "<div><b>Reservoir: <input type='text' class='inp-properties' value='" + node.id + "' readonly></b><br>" +
                "Head: <input type='text' class='inp-properties' value='" + values[0] + "' readonly><br>" +
                "Pattern: <input type='text' class='inp-properties' value='" + values[1] + "' readonly><br></div>";
        }
        else {
            html += "<div><b>Tank: <input type='text' class='inp-properties' value='" + node.id + "' readonly></b><br>" +
                "Elevation: <input type='text' class='inp-properties' value='" + values[0] + "' readonly><br>" +
                "InitLevel: <input type='text' class='inp-properties' value='" + values[1] + "' readonly><br>" +
                "MinLevel: <input type='text' class='inp-properties' value='" + values[2] + "' readonly><br>" +
                "MaxLevel: <input type='text' class='inp-properties' value='" + values[3] + "' readonly><br>" +
                "Diameter: <input type='text' class='inp-properties' value='" + values[4] + "' readonly><br>" +
                "MinVol: <input type='text' class='inp-properties' value='" + values[5] + "' readonly><br>" +
                "VolCurve: <input type='text' class='inp-properties' value='" + values[6] + "' readonly><br></div>";

        }
        $modalNodeLabel.html(node.type + " Properties");
        $modalNode.find('.modal-body').html(html);
        $modalNode.modal('show');
    };

    populateEdgeModal = function (edge) {
        var html = "";
        var values = edge.values;

        if (edge.type == "Pipe") {
            html += "<div><b>Pipe: <input type='text' class='inp-properties' value='" + edge.id + "' readonly></b><br>" +
                "Length: <input type='text' class='inp-properties' value='" + values[0] + "' readonly><br>" +
                "Roughness: <input type='text' class='inp-properties' value='" + values[1] + "' readonly><br>" +
                "Diameter: <input type='text' class='inp-properties' value='" + values[2] + "' readonly><br>" +
                "Minor Loss: <input type='text' class='inp-properties' value='" + values[3] + "' readonly><br>" +
                "Status: <input type='text' class='inp-properties' value='" + values[4] + "' readonly><br></div>";
        }
        else {
            html += "<p><b>Pump: <input type='text' class='inp-properties' value='" + edge.id + "' readonly></b><br>" +
                "Parameters: <input type='text' class='inp-properties' value='" + values[0] + "' readonly>" +
                "<input type='text' class='inp-properties' value='" + values[1] + "' readonly></p>";
        }

        s.refresh();

        $modalEdgeLabel.html(edge.type + " Properties");
        $modalEdge.find('.modal-body').html(html);
        $modalEdge.modal('show');
    };

    resetModelState = function() {
        $btnNodeOk.attr('disabled', true);
        $btnEdgeOk.attr('disabled', true);
        $chkNodeEdit.attr('checked', false);
        $chkEdgeEdit.attr('checked', false);
    };

    resetUploadState = function() {
        $inpUlTitle.val('');
        $inpUlDescription.val('');
        $inpUlKeyworkds.tagsinput('removeAll');
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
        $modalModelRep = $('#modal-model-rep');
        $uploadContainer = $('#upload-container');
        $modalNode = $('#modal-node');
        $modalNodeLabel = $('#modal-node-label');
        $modalEdge = $('#modal-edge');
        $modalEdgeLabel = $('#modal-edge-label');
        $modalLog = $('#modalLog');
        $loadFromLocal = $("#load-from-local")[0];
        $fileDisplayArea = $("#file-display-area")[0];
        $chkNodeEdit = $('#chk-node');
        $chkEdgeEdit = $('#chk-edge');
        $btnNodeOk = $('#btn-node-ok');
        $btnNodeCancel = $('#btn-node-cancel');
        $btnEdgeOk = $('#btn-edge-ok');
        $btnEdgeCancel = $('#btn-edge-cancel');
        $inpUlTitle = $('#inp-upload-title');
        $inpUlDescription = $('#inp-upload-description');
        $inpUlKeyworkds = $('#tagsinp-upload-keywords');
        $btnUl = $('#btn-upload');
        $btnUlCancel = $('#btn-upload-cancel');
        $viewTabs = $('#view-tabs');
        $loadingModel = $('#loading-model');
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
                setStateAfterLastModel();
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
                        setStateAfterLastModel();
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
                setStateAfterLastModel();
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
                        setStateAfterLastModel();
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
                                '<br><p><b>Loading model repository...</b></p><p>Note: Loading will continue if dialog is closed.</p>"');
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
        var metadataHTML = '<h1><a href="' + metadata['identifiers'][0]['url'] + '" style="color:#3366ff">' + metadata['title'] + '</a></h1>';
        metadataHTML += '<p><h6>' + metadata['description'] + "</h6>";

        metadataHTML += '<br>Created: ' + metadata['dates'][1]['start_date'].substring(0, 10);
        metadataHTML += ', &emsp;Last Modified: ' + metadata['dates'][1]['start_date'].substring(0, 10);

        metadataHTML += '<br>Author: ' + metadata['creators'][0]['name'];
        metadataHTML += '<br>Rights: ' + metadata['rights'];

        var subjects = "";
        var i;
        for (i in metadata['subjects']) {
            subjects += metadata['subjects'][i]['value'] + ', ';
        }
        metadataHTML += '<br>Subjects: ' + subjects.substring(0, subjects.length - 2);



        metadataHTML += '<br> Program: ' + '<a href="' + metadata['executed_by']['modelProgramIdentifier'] +
            '" style="color:#3366ff">' + metadata['executed_by']['modelProgramName'] + '</a>';

        metadataHTML += '</p>';

        metadataHTML += '<pre>' + JSON.stringify(metadata, null, 2) + '</pre>';

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
    });

    /*-----------------------------------------------
     ***************INVOKE IMMEDIATELY***************
     ----------------------------------------------*/
    generateModelList();

    sigma.utils.pkg('sigma.canvas.nodes');

    showLog = false;
}()); // End of package wrapper
// NOTE: that the call operator (open-closed parenthesis) is used to invoke the library wrapper
// function immediately after being parsed.