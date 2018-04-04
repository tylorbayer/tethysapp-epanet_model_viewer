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
    var addListenersToHsResTable,
        addInitialEventListeners,
        buildHSResTable,
        generateResourceList,
        initializeJqueryVariables,
        redrawDataTable,
        onClickAddRes,
        showMainLoadAnim,
        addNonGenericRes,
        hideMainLoadAnim,
        setStateAfterLastResource,
        addLogEntry,
        showLoadingCompleteStatus,
        addLayerToUI;

    //  **********Query Selectors************
    var $modalAddRes,
        $nodeModal,
        $nodeModalLabel,
        $edgeModal,
        $edgeModalLabel,
        $btnAddRes,
        $modalLog,
        $fileInput,
        $fileDisplayArea;

    /******************************************************
     **************FUNCTION DECLARATIONS*******************
     ******************************************************/

    addListenersToHsResTable = function () {
        $modalAddRes.find('tbody tr').on('click', function () {
            $btnAddRes.prop('disabled', false);
            $(this)
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
        $modalAddRes.on('shown.bs.modal', function () {
            if (dataTableLoadRes) {
                redrawDataTable(dataTableLoadRes, $(this));
            }
        });

        $btnAddRes.on('click', onClickAddRes);

        $fileInput.addEventListener('change', function() {
            var file = $fileInput.files[0];

            var reader = new FileReader();

            reader.onload = function() {
                $fileDisplayArea.innerText = reader.result;
            };

            reader.readAsText(file);
        });

        $('#fileDisplayArea').bind("DOMSubtreeModified",function(){
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
                console.log(e.type, e.data.node, e.data.captor);
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
                console.log(e.type, e.data.edge, e.data.captor);
                $edgeModalLabel.html("Pipe Properties");
                $edgeModal.find('.modal-body').html("Pipe: " + e.data.edge.id + "<br>Length: " + e.data.edge.length +
                    "<br>Roughness: " + e.data.edge.roughness + "<br>Diameter: " + e.data.edge.diameter + "<br>Minor Loss: " +
                    e.data.edge.minorLoss + "<br>Status: " + e.data.edge.status);
                $edgeModal.modal('show');
                s.refresh();
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
        $modalAddRes.find('.modal-body').html(resTableHtml);
        addListenersToHsResTable();
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
                    $modalAddRes.find('.modal-body').html('<div class="error">An unexpected error was encountered while attempting to load resources.</div>');
                }
            },
            success: function (response) {
                if (response.hasOwnProperty('success')) {
                    if (!response.success) {
                        $modalAddRes.find('.modal-body').html('<div class="error">' + response.message + '</div>');
                    } else {
                        if (response.hasOwnProperty('res_list')) {
                            buildHSResTable(response.res_list);
                        }
                        $btnAddRes.add('#div-chkbx-res-auto-close').removeClass('hidden');
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
        $btnAddRes = $('#btn-upload-res');
        $modalAddRes = $('#modalLoadRes');
        $nodeModal = $('#node-modal');
        $nodeModalLabel = $('#node-modal-label');
        $edgeModal = $('#edge-modal');
        $edgeModalLabel = $('#edge-modal-label');
        $modalLog = $('#modalLog');
        $fileInput = $("#fileInput")[0];
        $fileDisplayArea = $("#fileDisplayArea")[0];
    };

    onClickAddRes = function () {
        var $rdoRes = $('.rdo-res:checked');
        var resId = $rdoRes.val();
        var resType = $rdoRes.parent().parent().find('.res_type').text();
        var resTitle = $rdoRes.parent().parent().find('.res_title').text();

        showMainLoadAnim();
        $modalAddRes.modal('hide');

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
                console.log(message);
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
                        }
                    }
                }
                console.log(message);
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