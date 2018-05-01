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
    var dataTableLoadRes,
        showLog,
        s;

    //  *********FUNCTIONS***********
    var addListenersToModelRepTable,
        addInitialEventListeners,
        buildHSResTable,
        generateResourceList,
        initializeJqueryVariables,
        redrawDataTable,
        onClickOpenModel,
        showMainLoadAnim,
        addNonGenericRes,
        hideMainLoadAnim,
        setStateAfterLastResource,
        addLogEntry,
        showLoadingCompleteStatus,
        addLayerToUI,
        addMetadata;

    //  **********Query Selectors************
    var $modalModelRep,
        $nodeModal,
        $nodeModalLabel,
        $edgeModal,
        $edgeModalLabel,
        $btnUploadModel,
        $modalLog,
        $loadFromLocal,
        $fileDisplayArea;

    /******************************************************
     **************FUNCTION DECLARATIONS*******************
     ******************************************************/

    addListenersToModelRepTable = function () {
        $modalModelRep.find('tbody tr').on('click', function () {
            $btnUploadModel.prop('disabled', false);
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
            if (dataTableLoadRes) {
                redrawDataTable(dataTableLoadRes, $(this));
            }
        });

        $btnUploadModel.on('click', onClickOpenModel);

        $loadFromLocal.addEventListener('change', function() {
            var file = $loadFromLocal.files[0];

            var reader = new FileReader();

            reader.onload = function() {
                $fileDisplayArea.innerText = reader.result;
            };

            reader.readAsText(file);
        });

        $('#fileDisplayArea').bind("DOMSubtreeModified",function(){
            $( "#view-tabs" ).tabs({ active: 0 });

            var g = {
                nodes: [],
                edges: []
            };

            $("#graph-container").remove();
            $("#container").append("<div id='graph-container'></div>");

            var file_text = $fileDisplayArea.innerText;

            var lexer = new Lexer(file_text, "not");

            g.nodes = lexer.getNodes();
            g.edges = lexer.getEdges();

            s = new sigma({
                graph: g,
                renderer: {
                    // IMPORTANT:
                    // This works only with the canvas renderer, so the
                    // renderer type set as "canvas" is necessary here.
                    container: $("#graph-container")[0],
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

                var html = "";
                var values = e.data.node.values;

                if (e.data.node.type == "Junction") {
                    html += "<p><b>Junction " + e.data.node.id + "</b><br>";
                    html += "Elev: " + values[0] + "<br>Demand: " + values[1] + "<br>Pattern: " + values[2] + "</p>";
                }
                else if (e.data.node.type == "Reservoir") {
                    html += "<p><b>Reservoir " + e.data.node.id + "</b><br>";
                    html += "Head: " + values[0] + "<br>Pattern: " + values[1] + "</p>";
                }
                else {
                    html += "<p><b>Tank " + e.data.node.id + "</b><br>";
                    html += "Elevation: " + values[0] + "<br>InitLevel: " + values[1] + "<br>MinLevel: " + values[2] +
                        "<br>MaxLevel: " + values[3] + "<br>Diameter: " + values[4] + "<br>MinVol: " + values[5] + "<br>VolCurve: " + values[6] + "</p>";

                }
                $nodeModalLabel.html(e.data.node.type + " Properties");
                $nodeModal.find('.modal-body').html(html);
                $nodeModal.modal('show');
                s.refresh();
            });

            s.bind('clickEdge', function(e) {
                $('#edge-dialog').css({ top: e.data.captor.clientY, left: e.data.captor.clientX - 500});

                var html = "";
                var values = e.data.edge.values;

                if (e.data.edge.type == "Pipe") {
                    html += "<p><b>Pipe: " + e.data.edge.id  + "</b><br>";
                    html += "Length: " + values[0] + "<br>Roughness: " + values[1] + "<br>Diameter: " + values[2] +
                        "<br>Minor Loss: " + values[3] + "<br>Status: " + values[4] + "</p>";
                }
                else {
                    html += "<p><b>Pump: " + e.data.edge.id  + "</b><br>";
                    html += "Parameters: " + values[0] + " " + values[1] + "</p>";
                }

                s.refresh();

                $edgeModalLabel.html(e.data.edge.type + " Properties");
                $edgeModal.find('.modal-body').html(html);
                $edgeModal.modal('show');
            });

            s.refresh();
        });
    };

    buildHSResTable = function (resList) {
        var resTableHtml;

        resList = typeof resList === 'string' ? JSON.parse(resList) : resList;
        resTableHtml = '<table id="tbl-resources"><thead><th></th><th>Title</th><th>Subjects</th><th>Type</th><th>Owner</th></thead><tbody>';

        resList.forEach(function (resource) {
            var subjects = "";

            for (var subject in resource.subjects) {
                subjects += subject + " ";
            }

            resTableHtml += '<tr>' +
                '<td><input type="radio" name="resource" class="rdo-res" value="' + resource.id + '"></td>' +
                '<td class="res_title">' + resource.title + '</td>' +
                '<td class="res_subjects">' + resource.subjects + '</td>' +
                '<td class="res_type">' + resource.type + '</td>' +
                '<td class="res_owner">' + resource.owner + '</td>' +
                '</tr>';
        });
        resTableHtml += '</tbody></table>';
        $modalModelRep.find('.modal-body').html(resTableHtml);
        addListenersToModelRepTable();
        dataTableLoadRes = $('#tbl-resources').DataTable({
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

    generateResourceList = function (numRequests) {
        $.ajax({
            type: 'GET',
            url: '/apps/epanet-model-viewer/get-hs-res-list',
            dataType: 'json',
            error: function () {
                if (numRequests < 5) {
                    numRequests += 1;
                    setTimeout(generateResourceList(), 3000);
                } else {
                    $modalModelRep.find('.modal-body').html('<div class="error">An unexpected error was encountered while attempting to load resources.</div>');
                }
            },
            success: function (response) {
                if (response.hasOwnProperty('success')) {
                    if (!response.success) {
                        $modalModelRep.find('.modal-body').html('<div class="error">' + response.message + '</div>');
                    } else {
                        if (response.hasOwnProperty('res_list')) {
                            buildHSResTable(response.res_list);
                        }
                        $btnUploadModel.add('#div-chkbx-res-auto-close').removeClass('hidden');
                    }
                }
            }
        });
    };

    redrawDataTable = function (dataTable, $modal) {
        var interval;
        interval = window.setInterval(function () {
            if ($modal.css('display') !== 'none' && $modal.find('table').length > 0) {
                $modal.find('.dataTables_scrollBody').css('height', $modal.find('.modal-body').height().toString() - 160 + 'px');
                dataTable.columns.adjust().draw();
                window.clearInterval(interval);
            }
        }, 100);
    };

    initializeJqueryVariables = function () {
        $btnUploadModel = $('#btn-upload-model');
        $modalModelRep = $('#modalModelRep');
        $nodeModal = $('#node-modal');
        $nodeModalLabel = $('#node-modal-label');
        $edgeModal = $('#edge-modal');
        $edgeModalLabel = $('#edge-modal-label');
        $modalLog = $('#modalLog');
        $loadFromLocal = $("#load-from-local")[0];
        $fileDisplayArea = $("#fileDisplayArea")[0];
    };

    onClickOpenModel = function () {
        var $rdoRes = $('.rdo-res:checked');
        var resId = $rdoRes.val();
        var resType = $rdoRes.parent().parent().find('.res_type').text();
        var resTitle = $rdoRes.parent().parent().find('.res_title').text();

        showMainLoadAnim();
        $modalModelRep.modal('hide');

        addNonGenericRes(resId, resType, resTitle, true, null);
    };

    addNonGenericRes = function (resId, resType, resTitle, isLastResource, additionalResources) {
        var data = {'res_id': resId};

        if (resType) {
            data.res_type = resType;
        }
        if (resTitle) {
            data.res_title = resTitle;
        }

        $.ajax({
            type: 'GET',
            url: '/apps/epanet-model-viewer/add-hs-res',
            dataType: 'json',
            data: data,
            error: function () {
                var message = 'An unexpected error ocurred while processing the following resource ' +
                    '<a href="https://www.hydroshare.org/resource/' + resId + '" target="_blank">' +
                    resId + '</a>. An app admin has been notified.';

                addLogEntry('danger', message);
                setStateAfterLastResource();
            },
            success: function (response) {
                var message;

                if (response.hasOwnProperty('success')) {
                    if (response.hasOwnProperty('message')) {
                        message = response.message;
                    }

                    if (!response.success) {
                        if (!message) {
                            message = 'An unexpected error ocurred while processing the following resource ' +
                                '<a href="https://www.hydroshare.org/resource/' + resId + '" target="_blank">' +
                                resId + '</a>. An app admin has been notified.';
                        }

                        addLogEntry('danger', message);
                        setStateAfterLastResource();
                    } else {
                        if (message) {
                            addLogEntry('warning', message);
                        }
                        if (response.hasOwnProperty('results')) {
                            addLayerToUI(response.results, isLastResource, additionalResources);
                            addMetadata(response.metadata);
                        }
                    }
                }
            }
        });
    };

    setStateAfterLastResource = function () {
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
        var $resLoadingStatus = $('#res-load-status');
        var $statusText = $('#status-text');
        var showTime = success ? 2000 : 4000;
        $statusText.text(message)
            .removeClass('success error')
            .addClass(successClass);
        $resLoadingStatus.removeClass('hidden');
        setTimeout(function () {
            $resLoadingStatus.addClass('hidden');
        }, showTime);
    };

    addLayerToUI = function (result) {
        var fileDisplayArea = $("#fileDisplayArea")[0];
        fileDisplayArea.innerText = result;

        setStateAfterLastResource();
    };

    addMetadata = function (metadata) {
        var metadataDisplayArea = $('#metadataDisplayArea')[0];
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


    /*-----------------------------------------------
     **************ONLOAD FUNCTION*******************
     ----------------------------------------------*/
    $(function () {
        initializeJqueryVariables();
        addInitialEventListeners();

        $( "#view-tabs" ).tabs({ active: 0 });
    });

    /*-----------------------------------------------
     ***************INVOKE IMMEDIATELY***************
     ----------------------------------------------*/
    generateResourceList();

    sigma.utils.pkg('sigma.canvas.nodes');

    showLog = false;
}()); // End of package wrapper
// NOTE: that the call operator (open-closed parenthesis) is used to invoke the library wrapper
// function immediately after being parsed.