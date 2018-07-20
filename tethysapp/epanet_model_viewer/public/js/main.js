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
        graphColors = {
            Junction: '#666',
            Vertex: "#666",
            Reservoir: '#5F9EA0',
            Tank: '#8B4513',
            Label: '#d6d6c2',
            Pipe: '#ccc',
            Pump: '#D2B48C',
            Valve: '#7070db' },
        hoverColors = {
            Pipe: '#808080',
            Pump: '#DAA520',
            Valve: '#3333cc' },
        edgeSource = null,
        isAddEdge = false,
        isAddNode = false,
        addType = "",
        nodeAnimColor,
        edgeAnimColor,
        modelResults = {},
        animate = [],
        animationMaxStep = 0,
        playing = false,
        animationDelay = 1000,
        nodeModalLeft = 0,
        edgeModalLeft = 0,
        edgeVerts = [],
        ranModel = false;

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
        setGraphEventListeners,
        resetPlay,
        resetNodeAnim,
        resetEdgeAnim,
        stopAnimation,
        resetAnimation;

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
        $btnAnimateTools,
        $editToolbar,
        $animateToolbar,
        $initialModel,
        $btnEdgeDelete,
        $btnNodeDelete,
        $nodeX,
        $nodeY,
        $btnRunModel,
        $btnPlayAnimation,
        $btnStopAnimation,
        $viewNodeResults,
        $nodeResults,
        $viewEdgeResults,
        $edgeResults,
        $loadingAnimation,
        $animationSpeed,
        $animationSlider,
        $nodeLegend,
        $edgeLegend,
        $chkNode,
        $chkEdge,
        $nodeAnimColor,
        $nodeAnimType,
        $edgeAnimColor,
        $edgeAnimType;

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
        Tank:
        "<tr><td><b>Id:</b></td><td><input type='text' id='node-id' class='inp-properties' readonly></td></tr>" +
        "<tr><td>Elev:</td><td><input type='number' class='inp-properties' readonly></td></tr>" +
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
        "<tr><td><b>Id:</b></td><td><input type='text' id='edge-id' class='inp-properties' readonly></td></tr>" +
        "<tr><td>Length:</td><td><input type='number' class='inp-properties' readonly></td></tr>" +
        "<tr><td>Roughness:</td><td><input type='number' class='inp-properties' readonly></td></tr>" +
        "<tr><td>Diameter:</td><td><input type='number' class='inp-properties' readonly></td></tr>" +
        "<tr><td>Minor Loss:</td><td><input type='number' class='inp-properties'readonly></td></tr>" +
        "<tr><td>Status:</td><td><input type='text' class='inp-properties'readonly><br><p>('Open', 'Closed', or 'CV')</p></td></tr>",
        Pump:
        "<tr><td><b>Id:</b></td><td><input type='text' id='edge-id' class='inp-properties' readonly></td></tr>" +
        "<tr><td>Parameters:</td><td><input type='text' class='inp-properties'readonly><br>" +
        "<input type='text' class='inp-properties'readonly></td></tr>",
        Valve:
        "<tr><td><b>Id:</b></td><td><input type='text' id='edge-id' class='inp-properties' readonly></td></tr>" +
        "<tr><td>Diameter:</td><td><input type='number' class='inp-properties'readonly></td></tr>" +
        "<tr><td>Type:</td><td><input type='text' class='inp-properties' readonly></td></tr>" +
        "<tr><td>Setting:</td><td><input type='number' class='inp-properties' readonly></td></tr>" +
        "<tr><td>Minor Loss:</td><td><input type='number' class='inp-properties' readonly></td></tr>"
    };

    let animationLegends = {
        RdYlBu: '<div class="gradient"><span class="grad-step" style="background-color:#313695"></span><span class="grad-step" style="background-color:#333c98"></span><span class="grad-step" style="background-color:#35439b"></span><span class="grad-step" style="background-color:#37499e"></span><span class="grad-step" style="background-color:#394fa1"></span><span class="grad-step" style="background-color:#3b56a5"></span><span class="grad-step" style="background-color:#3d5ca8"></span><span class="grad-step" style="background-color:#3f62ab"></span><span class="grad-step" style="background-color:#4168ae"></span><span class="grad-step" style="background-color:#436fb1"></span><span class="grad-step" style="background-color:#4575b4"></span><span class="grad-step" style="background-color:#4a7bb7"></span><span class="grad-step" style="background-color:#4e80ba"></span><span class="grad-step" style="background-color:#5386bd"></span><span class="grad-step" style="background-color:#588bc0"></span><span class="grad-step" style="background-color:#5d91c3"></span><span class="grad-step" style="background-color:#6197c5"></span><span class="grad-step" style="background-color:#669cc8"></span><span class="grad-step" style="background-color:#6ba2cb"></span><span class="grad-step" style="background-color:#6fa7ce"></span><span class="grad-step" style="background-color:#74add1"></span><span class="grad-step" style="background-color:#7ab1d3"></span><span class="grad-step" style="background-color:#7fb6d6"></span><span class="grad-step" style="background-color:#85bad8"></span><span class="grad-step" style="background-color:#8abfdb"></span><span class="grad-step" style="background-color:#90c3dd"></span><span class="grad-step" style="background-color:#95c7df"></span><span class="grad-step" style="background-color:#9bcce2"></span><span class="grad-step" style="background-color:#a0d0e4"></span><span class="grad-step" style="background-color:#a6d5e7"></span><span class="grad-step" style="background-color:#abd9e9"></span><span class="grad-step" style="background-color:#b0dceb"></span><span class="grad-step" style="background-color:#b6deec"></span><span class="grad-step" style="background-color:#bbe1ee"></span><span class="grad-step" style="background-color:#c0e3ef"></span><span class="grad-step" style="background-color:#c5e6f1"></span><span class="grad-step" style="background-color:#cbe9f2"></span><span class="grad-step" style="background-color:#d0ebf4"></span><span class="grad-step" style="background-color:#d5eef5"></span><span class="grad-step" style="background-color:#dbf0f7"></span><span class="grad-step" style="background-color:#e0f3f8"></span><span class="grad-step" style="background-color:#e3f4f2"></span><span class="grad-step" style="background-color:#e6f5ed"></span><span class="grad-step" style="background-color:#e9f7e7"></span><span class="grad-step" style="background-color:#ecf8e1"></span><span class="grad-step" style="background-color:#eff9dc"></span><span class="grad-step" style="background-color:#f3fad6"></span><span class="grad-step" style="background-color:#f6fbd0"></span><span class="grad-step" style="background-color:#f9fdca"></span><span class="grad-step" style="background-color:#fcfec5"></span><span class="grad-step" style="background-color:#ffffbf"></span><span class="grad-step" style="background-color:#fffcba"></span><span class="grad-step" style="background-color:#fff9b6"></span><span class="grad-step" style="background-color:#fff6b1"></span><span class="grad-step" style="background-color:#fff3ac"></span><span class="grad-step" style="background-color:#ffefa7"></span><span class="grad-step" style="background-color:#feeca3"></span><span class="grad-step" style="background-color:#fee99e"></span><span class="grad-step" style="background-color:#fee699"></span><span class="grad-step" style="background-color:#fee395"></span><span class="grad-step" style="background-color:#fee090"></span><span class="grad-step" style="background-color:#fedb8b"></span><span class="grad-step" style="background-color:#fed687"></span><span class="grad-step" style="background-color:#fed182"></span><span class="grad-step" style="background-color:#fecc7d"></span><span class="grad-step" style="background-color:#fec778"></span><span class="grad-step" style="background-color:#fdc274"></span><span class="grad-step" style="background-color:#fdbd6f"></span><span class="grad-step" style="background-color:#fdb86a"></span><span class="grad-step" style="background-color:#fdb366"></span><span class="grad-step" style="background-color:#fdae61"></span><span class="grad-step" style="background-color:#fca85e"></span><span class="grad-step" style="background-color:#fba15b"></span><span class="grad-step" style="background-color:#fa9b58"></span><span class="grad-step" style="background-color:#f99455"></span><span class="grad-step" style="background-color:#f98e52"></span><span class="grad-step" style="background-color:#f8874f"></span><span class="grad-step" style="background-color:#f7814c"></span><span class="grad-step" style="background-color:#f67a49"></span><span class="grad-step" style="background-color:#f57346"></span><span class="grad-step" style="background-color:#f46d43"></span><span class="grad-step" style="background-color:#f16740"></span><span class="grad-step" style="background-color:#ee613d"></span><span class="grad-step" style="background-color:#eb5b3b"></span><span class="grad-step" style="background-color:#e85538"></span><span class="grad-step" style="background-color:#e64f35"></span><span class="grad-step" style="background-color:#e34832"></span><span class="grad-step" style="background-color:#e0422f"></span><span class="grad-step" style="background-color:#dd3c2d"></span><span class="grad-step" style="background-color:#da362a"></span><span class="grad-step" style="background-color:#d73027"></span><span class="grad-step" style="background-color:#d22b27"></span><span class="grad-step" style="background-color:#cd2627"></span><span class="grad-step" style="background-color:#c82227"></span><span class="grad-step" style="background-color:#c31d27"></span><span class="grad-step" style="background-color:#be1827"></span><span class="grad-step" style="background-color:#b91326"></span><span class="grad-step" style="background-color:#b40e26"></span><span class="grad-step" style="background-color:#af0a26"></span><span class="grad-step" style="background-color:#aa0526"></span><span class="grad-step" style="background-color:#a50026"></span><span class="domain-min"></span><span class="domain-med"></span><span class="domain-max"></span></div>',
        YlGnBu: '<div class="gradient"><span class="grad-step" style="background-color:#ffffd9"></span><span class="grad-step" style="background-color:#fefed6"></span><span class="grad-step" style="background-color:#fcfed3"></span><span class="grad-step" style="background-color:#fbfdcf"></span><span class="grad-step" style="background-color:#f9fdcc"></span><span class="grad-step" style="background-color:#f8fcc9"></span><span class="grad-step" style="background-color:#f6fcc6"></span><span class="grad-step" style="background-color:#f5fbc3"></span><span class="grad-step" style="background-color:#f3fbbf"></span><span class="grad-step" style="background-color:#f2fabc"></span><span class="grad-step" style="background-color:#f1f9b9"></span><span class="grad-step" style="background-color:#eff9b6"></span><span class="grad-step" style="background-color:#eef8b3"></span><span class="grad-step" style="background-color:#ebf7b1"></span><span class="grad-step" style="background-color:#e8f6b1"></span><span class="grad-step" style="background-color:#e5f5b2"></span><span class="grad-step" style="background-color:#e2f4b2"></span><span class="grad-step" style="background-color:#dff3b2"></span><span class="grad-step" style="background-color:#dcf1b2"></span><span class="grad-step" style="background-color:#d9f0b3"></span><span class="grad-step" style="background-color:#d6efb3"></span><span class="grad-step" style="background-color:#d3eeb3"></span><span class="grad-step" style="background-color:#d0edb3"></span><span class="grad-step" style="background-color:#cdebb4"></span><span class="grad-step" style="background-color:#caeab4"></span><span class="grad-step" style="background-color:#c7e9b4"></span><span class="grad-step" style="background-color:#c1e7b5"></span><span class="grad-step" style="background-color:#bbe5b5"></span><span class="grad-step" style="background-color:#b6e2b6"></span><span class="grad-step" style="background-color:#b0e0b6"></span><span class="grad-step" style="background-color:#aadeb7"></span><span class="grad-step" style="background-color:#a4dcb7"></span><span class="grad-step" style="background-color:#9fd9b8"></span><span class="grad-step" style="background-color:#99d7b8"></span><span class="grad-step" style="background-color:#93d5b9"></span><span class="grad-step" style="background-color:#8dd3ba"></span><span class="grad-step" style="background-color:#88d0ba"></span><span class="grad-step" style="background-color:#82cebb"></span><span class="grad-step" style="background-color:#7dccbb"></span><span class="grad-step" style="background-color:#78cabc"></span><span class="grad-step" style="background-color:#73c8bd"></span><span class="grad-step" style="background-color:#6ec7be"></span><span class="grad-step" style="background-color:#69c5be"></span><span class="grad-step" style="background-color:#64c3bf"></span><span class="grad-step" style="background-color:#5fc1c0"></span><span class="grad-step" style="background-color:#5abfc0"></span><span class="grad-step" style="background-color:#55bdc1"></span><span class="grad-step" style="background-color:#50bcc2"></span><span class="grad-step" style="background-color:#4bbac3"></span><span class="grad-step" style="background-color:#46b8c3"></span><span class="grad-step" style="background-color:#41b6c4"></span><span class="grad-step" style="background-color:#3eb3c4"></span><span class="grad-step" style="background-color:#3bb0c3"></span><span class="grad-step" style="background-color:#38adc3"></span><span class="grad-step" style="background-color:#35aac3"></span><span class="grad-step" style="background-color:#33a7c2"></span><span class="grad-step" style="background-color:#30a4c2"></span><span class="grad-step" style="background-color:#2da1c2"></span><span class="grad-step" style="background-color:#2a9ec1"></span><span class="grad-step" style="background-color:#279bc1"></span><span class="grad-step" style="background-color:#2498c1"></span><span class="grad-step" style="background-color:#2195c0"></span><span class="grad-step" style="background-color:#1e92c0"></span><span class="grad-step" style="background-color:#1d8fbf"></span><span class="grad-step" style="background-color:#1e8bbd"></span><span class="grad-step" style="background-color:#1e87bb"></span><span class="grad-step" style="background-color:#1e83b9"></span><span class="grad-step" style="background-color:#1f7fb7"></span><span class="grad-step" style="background-color:#1f7bb5"></span><span class="grad-step" style="background-color:#2076b4"></span><span class="grad-step" style="background-color:#2072b2"></span><span class="grad-step" style="background-color:#206eb0"></span><span class="grad-step" style="background-color:#216aae"></span><span class="grad-step" style="background-color:#2166ac"></span><span class="grad-step" style="background-color:#2262aa"></span><span class="grad-step" style="background-color:#225ea8"></span><span class="grad-step" style="background-color:#225ba6"></span><span class="grad-step" style="background-color:#2257a5"></span><span class="grad-step" style="background-color:#2354a3"></span><span class="grad-step" style="background-color:#2351a2"></span><span class="grad-step" style="background-color:#234da0"></span><span class="grad-step" style="background-color:#234a9e"></span><span class="grad-step" style="background-color:#24469d"></span><span class="grad-step" style="background-color:#24439b"></span><span class="grad-step" style="background-color:#24409a"></span><span class="grad-step" style="background-color:#243c98"></span><span class="grad-step" style="background-color:#253996"></span><span class="grad-step" style="background-color:#253695"></span><span class="grad-step" style="background-color:#243392"></span><span class="grad-step" style="background-color:#22318d"></span><span class="grad-step" style="background-color:#1f2f88"></span><span class="grad-step" style="background-color:#1d2e83"></span><span class="grad-step" style="background-color:#1b2c7e"></span><span class="grad-step" style="background-color:#182a7a"></span><span class="grad-step" style="background-color:#162875"></span><span class="grad-step" style="background-color:#142670"></span><span class="grad-step" style="background-color:#11246b"></span><span class="grad-step" style="background-color:#0f2366"></span><span class="grad-step" style="background-color:#0d2162"></span><span class="grad-step" style="background-color:#0a1f5d"></span><span class="grad-step" style="background-color:#081d58"></span><span class="domain-min"></span><span class="domain-med"></span><span class="domain-max"></span></div>',
        OrRd: '<div class="gradient"><span class="grad-step" style="background-color:#fff7ec"></span><span class="grad-step" style="background-color:#fff6e9"></span><span class="grad-step" style="background-color:#fff5e6"></span><span class="grad-step" style="background-color:#fff3e3"></span><span class="grad-step" style="background-color:#fff2e0"></span><span class="grad-step" style="background-color:#fff1de"></span><span class="grad-step" style="background-color:#fff0db"></span><span class="grad-step" style="background-color:#feefd8"></span><span class="grad-step" style="background-color:#feedd5"></span><span class="grad-step" style="background-color:#feecd2"></span><span class="grad-step" style="background-color:#feebcf"></span><span class="grad-step" style="background-color:#feeacc"></span><span class="grad-step" style="background-color:#fee9c9"></span><span class="grad-step" style="background-color:#fee7c6"></span><span class="grad-step" style="background-color:#fee6c3"></span><span class="grad-step" style="background-color:#fee4c0"></span><span class="grad-step" style="background-color:#fee2bc"></span><span class="grad-step" style="background-color:#fee1b9"></span><span class="grad-step" style="background-color:#fedfb6"></span><span class="grad-step" style="background-color:#fddeb2"></span><span class="grad-step" style="background-color:#fddcaf"></span><span class="grad-step" style="background-color:#fddaab"></span><span class="grad-step" style="background-color:#fdd9a8"></span><span class="grad-step" style="background-color:#fdd7a5"></span><span class="grad-step" style="background-color:#fdd6a1"></span><span class="grad-step" style="background-color:#fdd49e"></span><span class="grad-step" style="background-color:#fdd29c"></span><span class="grad-step" style="background-color:#fdd09a"></span><span class="grad-step" style="background-color:#fdce98"></span><span class="grad-step" style="background-color:#fdcc96"></span><span class="grad-step" style="background-color:#fdca94"></span><span class="grad-step" style="background-color:#fdc892"></span><span class="grad-step" style="background-color:#fdc68f"></span><span class="grad-step" style="background-color:#fdc48d"></span><span class="grad-step" style="background-color:#fdc28b"></span><span class="grad-step" style="background-color:#fdc089"></span><span class="grad-step" style="background-color:#fdbe87"></span><span class="grad-step" style="background-color:#fdbc85"></span><span class="grad-step" style="background-color:#fdb982"></span><span class="grad-step" style="background-color:#fdb57f"></span><span class="grad-step" style="background-color:#fdb27b"></span><span class="grad-step" style="background-color:#fdae78"></span><span class="grad-step" style="background-color:#fdaa75"></span><span class="grad-step" style="background-color:#fda771"></span><span class="grad-step" style="background-color:#fca36e"></span><span class="grad-step" style="background-color:#fc9f6a"></span><span class="grad-step" style="background-color:#fc9c67"></span><span class="grad-step" style="background-color:#fc9863"></span><span class="grad-step" style="background-color:#fc9460"></span><span class="grad-step" style="background-color:#fc915c"></span><span class="grad-step" style="background-color:#fc8d59"></span><span class="grad-step" style="background-color:#fb8a58"></span><span class="grad-step" style="background-color:#fa8756"></span><span class="grad-step" style="background-color:#f98355"></span><span class="grad-step" style="background-color:#f88054"></span><span class="grad-step" style="background-color:#f77d52"></span><span class="grad-step" style="background-color:#f67a51"></span><span class="grad-step" style="background-color:#f5774f"></span><span class="grad-step" style="background-color:#f4734e"></span><span class="grad-step" style="background-color:#f3704d"></span><span class="grad-step" style="background-color:#f26d4b"></span><span class="grad-step" style="background-color:#f16a4a"></span><span class="grad-step" style="background-color:#f06749"></span><span class="grad-step" style="background-color:#ee6346"></span><span class="grad-step" style="background-color:#ec5f43"></span><span class="grad-step" style="background-color:#ea5a40"></span><span class="grad-step" style="background-color:#e8563d"></span><span class="grad-step" style="background-color:#e65239"></span><span class="grad-step" style="background-color:#e44e36"></span><span class="grad-step" style="background-color:#e34933"></span><span class="grad-step" style="background-color:#e1452f"></span><span class="grad-step" style="background-color:#df412c"></span><span class="grad-step" style="background-color:#dd3d29"></span><span class="grad-step" style="background-color:#db3826"></span><span class="grad-step" style="background-color:#d93422"></span><span class="grad-step" style="background-color:#d7301f"></span><span class="grad-step" style="background-color:#d42c1d"></span><span class="grad-step" style="background-color:#d1281a"></span><span class="grad-step" style="background-color:#ce2418"></span><span class="grad-step" style="background-color:#cb2115"></span><span class="grad-step" style="background-color:#c91d13"></span><span class="grad-step" style="background-color:#c61910"></span><span class="grad-step" style="background-color:#c3150e"></span><span class="grad-step" style="background-color:#c0110b"></span><span class="grad-step" style="background-color:#bd0d09"></span><span class="grad-step" style="background-color:#ba0a06"></span><span class="grad-step" style="background-color:#b70604"></span><span class="grad-step" style="background-color:#b40201"></span><span class="grad-step" style="background-color:#b10000"></span><span class="grad-step" style="background-color:#ad0000"></span><span class="grad-step" style="background-color:#a90000"></span><span class="grad-step" style="background-color:#a40000"></span><span class="grad-step" style="background-color:#a00000"></span><span class="grad-step" style="background-color:#9c0000"></span><span class="grad-step" style="background-color:#980000"></span><span class="grad-step" style="background-color:#940000"></span><span class="grad-step" style="background-color:#900000"></span><span class="grad-step" style="background-color:#8b0000"></span><span class="grad-step" style="background-color:#870000"></span><span class="grad-step" style="background-color:#830000"></span><span class="grad-step" style="background-color:#7f0000"></span><span class="domain-min"></span><span class="domain-med"></span><span class="domain-max"></span></div>',
        Spectral: '<div class="gradient"><span class="grad-step" style="background-color:#5e4fa2"></span><span class="grad-step" style="background-color:#5a55a5"></span><span class="grad-step" style="background-color:#555aa7"></span><span class="grad-step" style="background-color:#5160aa"></span><span class="grad-step" style="background-color:#4c66ad"></span><span class="grad-step" style="background-color:#486cb0"></span><span class="grad-step" style="background-color:#4471b2"></span><span class="grad-step" style="background-color:#3f77b5"></span><span class="grad-step" style="background-color:#3b7db8"></span><span class="grad-step" style="background-color:#3682ba"></span><span class="grad-step" style="background-color:#3288bd"></span><span class="grad-step" style="background-color:#378ebb"></span><span class="grad-step" style="background-color:#3c94b8"></span><span class="grad-step" style="background-color:#4299b6"></span><span class="grad-step" style="background-color:#479fb3"></span><span class="grad-step" style="background-color:#4ca5b1"></span><span class="grad-step" style="background-color:#51abaf"></span><span class="grad-step" style="background-color:#56b1ac"></span><span class="grad-step" style="background-color:#5cb6aa"></span><span class="grad-step" style="background-color:#61bca7"></span><span class="grad-step" style="background-color:#66c2a5"></span><span class="grad-step" style="background-color:#6dc5a5"></span><span class="grad-step" style="background-color:#74c7a5"></span><span class="grad-step" style="background-color:#7bcaa5"></span><span class="grad-step" style="background-color:#82cda5"></span><span class="grad-step" style="background-color:#89d0a5"></span><span class="grad-step" style="background-color:#8fd2a4"></span><span class="grad-step" style="background-color:#96d5a4"></span><span class="grad-step" style="background-color:#9dd8a4"></span><span class="grad-step" style="background-color:#a4daa4"></span><span class="grad-step" style="background-color:#abdda4"></span><span class="grad-step" style="background-color:#b1dfa3"></span><span class="grad-step" style="background-color:#b7e2a2"></span><span class="grad-step" style="background-color:#bde4a0"></span><span class="grad-step" style="background-color:#c3e79f"></span><span class="grad-step" style="background-color:#c8e99e"></span><span class="grad-step" style="background-color:#ceeb9d"></span><span class="grad-step" style="background-color:#d4ee9c"></span><span class="grad-step" style="background-color:#daf09a"></span><span class="grad-step" style="background-color:#e0f399"></span><span class="grad-step" style="background-color:#e6f598"></span><span class="grad-step" style="background-color:#e8f69c"></span><span class="grad-step" style="background-color:#ebf7a0"></span><span class="grad-step" style="background-color:#edf8a4"></span><span class="grad-step" style="background-color:#f0f9a8"></span><span class="grad-step" style="background-color:#f3faab"></span><span class="grad-step" style="background-color:#f5fbaf"></span><span class="grad-step" style="background-color:#f8fcb3"></span><span class="grad-step" style="background-color:#fafdb7"></span><span class="grad-step" style="background-color:#fdfebb"></span><span class="grad-step" style="background-color:#ffffbf"></span><span class="grad-step" style="background-color:#fffcba"></span><span class="grad-step" style="background-color:#fff9b5"></span><span class="grad-step" style="background-color:#fff6af"></span><span class="grad-step" style="background-color:#fff3aa"></span><span class="grad-step" style="background-color:#ffefa5"></span><span class="grad-step" style="background-color:#feeca0"></span><span class="grad-step" style="background-color:#fee99b"></span><span class="grad-step" style="background-color:#fee695"></span><span class="grad-step" style="background-color:#fee390"></span><span class="grad-step" style="background-color:#fee08b"></span><span class="grad-step" style="background-color:#fedb87"></span><span class="grad-step" style="background-color:#fed683"></span><span class="grad-step" style="background-color:#fed17e"></span><span class="grad-step" style="background-color:#fecc7a"></span><span class="grad-step" style="background-color:#fec776"></span><span class="grad-step" style="background-color:#fdc272"></span><span class="grad-step" style="background-color:#fdbd6e"></span><span class="grad-step" style="background-color:#fdb869"></span><span class="grad-step" style="background-color:#fdb365"></span><span class="grad-step" style="background-color:#fdae61"></span><span class="grad-step" style="background-color:#fca85e"></span><span class="grad-step" style="background-color:#fba15b"></span><span class="grad-step" style="background-color:#fa9b58"></span><span class="grad-step" style="background-color:#f99455"></span><span class="grad-step" style="background-color:#f98e52"></span><span class="grad-step" style="background-color:#f8874f"></span><span class="grad-step" style="background-color:#f7814c"></span><span class="grad-step" style="background-color:#f67a49"></span><span class="grad-step" style="background-color:#f57346"></span><span class="grad-step" style="background-color:#f46d43"></span><span class="grad-step" style="background-color:#f16844"></span><span class="grad-step" style="background-color:#ee6445"></span><span class="grad-step" style="background-color:#eb5f47"></span><span class="grad-step" style="background-color:#e85a48"></span><span class="grad-step" style="background-color:#e55649"></span><span class="grad-step" style="background-color:#e1514a"></span><span class="grad-step" style="background-color:#de4c4b"></span><span class="grad-step" style="background-color:#db474d"></span><span class="grad-step" style="background-color:#d8434e"></span><span class="grad-step" style="background-color:#d53e4f"></span><span class="grad-step" style="background-color:#d0384e"></span><span class="grad-step" style="background-color:#ca324c"></span><span class="grad-step" style="background-color:#c42c4b"></span><span class="grad-step" style="background-color:#bf264a"></span><span class="grad-step" style="background-color:#ba2049"></span><span class="grad-step" style="background-color:#b41947"></span><span class="grad-step" style="background-color:#af1346"></span><span class="grad-step" style="background-color:#a90d45"></span><span class="grad-step" style="background-color:#a40743"></span><span class="grad-step" style="background-color:#9e0142"></span><span class="domain-min"></span><span class="domain-med"></span><span class="domain-max"></span></div>'
    };

    /******************************************************
     **************FUNCTION DECLARATIONS*******************
     ******************************************************/

    addInitialEventListeners = function () {
        // $('#model-display').contextmenu(function (e) {
        //     e.preventDefault();
        // });
        // $('.modal').contextmenu(function (e) {
        //     e.preventDefault();
        // });

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
                    curNode.color = curNode.epaColor;
                    s.refresh();
                }
                edgeSource = null;

                if (addType === "Default") {
                    $('#model-container').css("cursor", "default");
                    s.refresh();
                }
                else if (addType === "Junction" || addType === "Reservoir" || addType === "Tank" || addType === "Label") {
                    isAddNode = true;
                    $('#model-container').css("cursor", "crosshair");
                }
                else {
                    isAddEdge = true;
                    $('#model-container').css("cursor", "pointer");
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
                $('#model-container').css("cursor", "default");
                isAddEdge = false;
                isAddNode = false;
            }
        });

        $btnAnimateTools.click(function () {
            if ($animateToolbar.is(':hidden')) {
                $animateToolbar.removeClass('hidden');
                $btnAnimateTools.css("background-color", "#915F6D");
                $btnAnimateTools.css("color", "white");
            }
            else {
                $animateToolbar.addClass('hidden');
                $btnAnimateTools.css("background-color", "white");
                $btnAnimateTools.css("color", "#555");
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
                $loadingAnimation.removeAttr('hidden');
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

            $('#loading-animation-run').removeAttr('hidden');

            $.ajax({
                type: 'POST',
                url: '/apps/epanet-model-viewer/run-epanet-model/',
                dataType: 'json',
                data: data,
                error: function () {
                    $loadingAnimation.attr('hidden', true);
                    let message = 'An unexpected error occurred while uploading the model ';

                    addLogEntry('danger', message, true);
                },
                success: function (response) {
                    $('#loading-animation-run').attr('hidden', true);
                    let message;

                    if (response.hasOwnProperty('success')) {
                        $loadingAnimation.attr('hidden', true);

                        if (response.hasOwnProperty('message')) {
                            message = response.message;
                        }

                        if (!response.success) {
                            if (!message) {
                                message = 'An unexpected error occurred while uploading the model';
                            }

                            addLogEntry('danger', message, true);
                        } else {
                            if (message) {
                                addLogEntry('warning', message, true);
                            }
                            if (response.hasOwnProperty('results')) {
                                $('.ran-model').removeAttr('disabled');
                                $('.ran-model').removeClass('hidden');
                                modelResults = response.results;
                                console.log(modelResults);

                                for (let i in modelResults['nodes']) {
                                    s.graph.nodes().find(node => node.epaId === i).modelResults = modelResults['nodes'][i];
                                    if (animationMaxStep === 0)
                                        animationMaxStep = modelResults['nodes'][i]['EN_DEMAND'].length;
                                }

                                $('#total-timesteps').val(animationMaxStep);

                                for (let i in modelResults['edges']) {
                                    s.graph.edges().find(edge => edge.epaId === i).modelResults = modelResults['edges'][i];
                                }

                                $animationSlider.slider({
                                    value: 0,
                                    min: 0,
                                    max: animationMaxStep - 1,
                                    step: 1, //Assigning the slider step based on the depths that were retrieved in the controller
                                    animate: "fast",
                                    slide: function( event, ui ) {
                                        stopAnimation();
                                        playing = false;
                                        $btnPlayAnimation.click();
                                    }
                                });

                                resetNodeAnim();
                                resetEdgeAnim();

                                ranModel = true;
                            }
                        }
                    }
                }
            });
        });

        $chkNode.click(function () {
            let reStart = playing;

            playing = true;
            $btnPlayAnimation.click();
            if (!$(this).is(':checked')) {
                for (let node in s.graph.nodes()) {
                    s.graph.nodes()[node].color = s.graph.nodes()[node].epaColor;
                }
                s.refresh();
            }
            resetNodeAnim();

            if (reStart)
                $btnPlayAnimation.click();
        });

        $nodeAnimType.change(function () {
            let reStart = playing;

            playing = true;
            $btnPlayAnimation.click();
            resetNodeAnim();

            if (reStart)
                $btnPlayAnimation.click();
        });

        $nodeAnimColor.change(function () {
            let reStart = playing;

            playing = true;
            $btnPlayAnimation.click();
            resetNodeAnim();

            if (reStart)
                $btnPlayAnimation.click();
        });

        $chkEdge.click(function () {
            let reStart = playing;
            
            playing = true;
            $btnPlayAnimation.click();
            if (!$(this).is(':checked')) {
                for (let edge in s.graph.edges()) {
                    s.graph.edges()[edge].color = s.graph.edges()[edge].epaColor;
                }
                s.refresh();
            }
            resetEdgeAnim();

            if (reStart)
                $btnPlayAnimation.click();
        });

        $edgeAnimType.change(function () {
            let reStart = playing;

            playing = true;
            $btnPlayAnimation.click();
            resetEdgeAnim();

            if (reStart)
                $btnPlayAnimation.click();
        });

        $edgeAnimColor.change(function () {
            let reStart = playing;

            playing = true;
            $btnPlayAnimation.click();
            resetEdgeAnim();

            if (reStart)
                $btnPlayAnimation.click();
        });

        $btnPlayAnimation.click(function () {
            if ($chkNode.is(':checked') || $chkEdge.is(':checked')) {
                if (playing === false) {
                    resetPlay();

                    let delayStep = -1;
                    for (let j = $animationSlider.slider("value"); j <= animationMaxStep; ++j) {
                        delayStep++;
                        animate.push(setTimeout(function () {
                            $animationSlider.slider("value", j);
                            $('#timestep').val(j);
                            if (j === animationMaxStep)
                                resetAnimation();
                            else {
                                if ($chkNode.is(':checked')) {
                                    for (let node in s.graph.nodes()) {
                                        try {
                                            s.graph.nodes()[node].color = nodeAnimColor(s.graph.nodes()[node].modelResults[$nodeAnimType.val()][j]).hex();
                                        }
                                        catch (e) {
                                            // nothing
                                        }
                                    }
                                }

                                if ($chkEdge.is(':checked')) {
                                    for (let edge in s.graph.edges()) {
                                        try {
                                            s.graph.edges()[edge].color = edgeAnimColor(s.graph.edges()[edge].modelResults[$edgeAnimType.val()][j]).hex();
                                        }
                                        catch (e) {
                                            // nothing
                                        }
                                    }
                                }
                                s.refresh();
                            }
                        }, animationDelay * delayStep));
                    }
                }
                else {
                    resetPlay();

                    stopAnimation();
                }
            }
            else {
                $btnStopAnimation.click();
            }
        });

        $btnStopAnimation.click(resetAnimation);

        $("#btn-increase").on("click", function() {
            if ($animationSpeed.val() < 99) {
                $animationSpeed.val(parseInt($animationSpeed.val()) + 1);
                animationDelay = 1000 / $animationSpeed.val();
            }
            if (playing === true) {
                stopAnimation();
                playing = false;
                $btnPlayAnimation.click();
            }
        });

        $("#btn-decrease").on("click", function() {
            if ($animationSpeed.val() > 1) {
                $animationSpeed.val(parseInt($animationSpeed.val()) - 1);
                animationDelay = 1000 / $animationSpeed.val();
            }
            if (playing === true) {
                stopAnimation();
                playing = false;
                $btnPlayAnimation.click();
            }
        });

        $viewNodeResults.find('select').change(function () {
            try {
                let dataset = curNode.modelResults[$(this).val()];
                let x = [], y = [];
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
                    title: $(this).find('option:selected').text() + " for " + curNode.epaType + " " + curNode.id,
                    xaxis: {
                        title: 'Timestep'
                    },
                    yaxis: {
                        title: $(this).find('option:selected').text()
                    },
                };

                Plotly.newPlot('node-results', data, layout);
            }
            catch (e) {
                $('#node-results').html('<p>Results data for this node have not been computed</p>');
            }
        });

        $viewEdgeResults.find('select').change(function () {
            try {
                let dataset = curEdge.modelResults[$(this).val()];
                let x = [], y = [];
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
                    title: $(this).find('option:selected').text() + " for " + curEdge.epaType + " " + curEdge.id,
                    xaxis: {
                        title: 'Timestep'
                    },
                    yaxis: {
                        title: $(this).find('option:selected').text()
                    }
                };

                Plotly.newPlot('edge-results', data, layout);
            }
            catch (e) {
                $('#edge-results').html('<p>Results data for this edge have not been computed</p>');
            }
        });

        $('#node-view-tab').click(function () {
            $modalNode.find('.modal-dialog').css('left', nodeModalLeft);
            $modalNode.find('.modal-dialog').css('width', '315px');
            $modalNode.find('.modal-dialog').css('height', '440px');
        });

        $('#node-results-tab').click(function () {
            $modalNode.find('.modal-dialog').css('left', '0');
            $modalNode.find('.modal-dialog').css('width', '1000px');
            $modalNode.find('.modal-dialog').css('height', '750px');
        });

        $('#edge-view-tab').click(function () {
            $modalEdge.find('.modal-dialog').css('left', edgeModalLeft);
            $modalEdge.find('.modal-dialog').css('width', '315px');
            $modalEdge.find('.modal-dialog').css('height', '440px');
        });

        $('#edge-results-tab').click(function () {
            $modalEdge.find('.modal-dialog').css('left', '0');
            $modalEdge.find('.modal-dialog').css('width', '1000px');
            $modalEdge.find('.modal-dialog').css('height', '750px');
        });

        $chkDragNodes.click(function() {
            if ($chkDragNodes.is(':checked')) {
                $editToolbar.find('a').removeClass('active');
                isAddEdge = false;
                isAddNode = false;
                let dragListener = sigma.plugins.dragNodes(s, s.renderers[0]);

                dragListener.bind('startdrag', function(e) {
                    $('#model-container').css("cursor", "-webkit-grabbing");
                });
                dragListener.bind('drag', function(e) {
                    s.unbind('clickNodes');
                });
                dragListener.bind('dragend', function(e) {
                    $('#model-container').css("cursor", "-webkit-grab");

                    setTimeout(function(){
                        s.bind('clickNodes', function(e) {
                            nodeClick(e);
                        });
                    },250);
                });

                $('#model-container').css("cursor", "-webkit-grab");
            }
            else {
                $('#btn-default-edit').click();
                sigma.plugins.killDragNodes(s);

                $('#model-container').css("cursor", "default");
            }
        });

        $modalNode.on('hidden.bs.modal', function () {
            if (edgeVerts.length === 0) {
                curNode.color = graphColors[curNode.epaType];
                if (edgeSource)
                    edgeSource.color = graphColors[edgeSource.epaType];
                s.refresh();
                resetModelState();
            }
        });

        $modalNode.on('shown.bs.modal', function () {
            if (ranModel && !isAddNode && (curNode.epaType !== "Vertex" && curNode.epaType !== "Label"))
                $('#node-results-view').find('select').change();
            else {
                $modalNode.find('input')[0].focus();
                $modalNode.find('input').keyup(function(event) {
                    if (event.keyCode === 13) {
                        $btnNodeOk.click();
                    }
                });
            }
        });

        $modalEdge.on('hidden.bs.modal', function () {
            curEdge.hover_color = hoverColors[curEdge.epaType];
            s.refresh();
            resetModelState();
        });

        $modalEdge.on('shown.bs.modal', function () {
            if (ranModel && isAddEdge === false)
                $('#edge-results-view').find('select').change();
            else {
                $modalEdge.find('input')[0].focus();
                $modalEdge.find('input').keyup(function(event) {
                    if (event.keyCode === 13) {
                        $btnEdgeOk.click();
                    }
                });
            }
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

                $modalNode.find('input')[0].focus();
                $modalNode.find('input')[0].select();
                $modalNode.find('input').keyup(function(event) {
                    if (event.keyCode === 13) {
                        $btnNodeOk.click();
                    }
                });
            }
            else {
                $btnNodeOk.attr('disabled', true);
                $btnNodeDelete.attr('disabled', true);

                $modalNode.find('input').attr('readonly', true);

                populateNodeModal(true);
            }
        });

        $chkEdgeEdit.click(function() {
            if ($chkEdgeEdit.is(':checked')) {
                $btnEdgeOk.removeAttr('disabled');
                $btnEdgeDelete.removeAttr('disabled');

                $modalEdge.find('input').attr('readonly', false);

                $modalEdge.find('input')[0].focus();
                $modalEdge.find('input')[0].select();
                $modalEdge.find('input').keyup(function(event) {
                    if (event.keyCode === 13) {
                        $btnEdgeOk.click();
                    }
                });
            }
            else {
                $btnEdgeOk.attr('disabled', true);
                $btnEdgeDelete.attr('disabled', true);

                $modalEdge.find('input').attr('readonly', true);

                populateEdgeModal(true);
            }
        });

        $btnNodeOk.click(function() {
            if ($('#node-id').val() === "" && curNode.epaType !== "Vertex")
                alert("Id must have a value");
            else {
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

                    if (curNode.epaType !== "Vertex") {
                        curNode.epaId = $('#node-id').val();
                        curNode.label = curNode.epaType + ' ' + $('#node-id').val();
                        for (let i = 1; i < $modalNode.find('input').length; ++i) {
                            curNode.values[i - 1] = $modalNode.find('input')[i].value;
                        }
                    }
                    else {
                        curNode.epaId = "vert " + edgeVerts.length;
                        curNode.label = "vert " + edgeVerts.length;
                    }
                }
                else {
                    curNode.label = $('#node-id').val();
                }

                if ($nodeX.html() !== "") {
                    if (curNode.epaType === "Vertex") {
                        curNode.id = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(2, 10);
                        curNode.size = 0.6;
                        edgeVerts.push(curNode.epaId);
                    }
                    else if (curNode.epaType !== "Label") {
                        curNode.id = curNode.epaId;
                        curNode.label = curNode.epaType + " " + curNode.id;
                        curNode.size = 2;
                    }
                    else {
                        curNode.id = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(2, 10);
                        curNode.size = 1;
                        curNode.showLabel = true;
                    }

                    curNode.color = graphColors[curNode.epaType];
                    curNode.x = $nodeX.html();
                    curNode.y = $nodeY.html();

                    try {
                        s.graph.addNode(curNode);
                        $modalNode.modal('hide');
                    }
                    catch (e) {
                        alert(e);
                        return;
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
                    let edge = s.graph.edges().find(edge => edge.epaId === curNode.id.split(" ")[0]);
                    let verts = edge.vert;
                    if (verts.length === 1) {
                        delete edge.vert;
                        delete edge.type;
                    }
                    else
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
                curEdge.epaId = $('#edge-id').val();
                curEdge.label = curEdge.epaType + ' ' + $('#edge-id').val();

                for (let i = 1; i < $modalEdge.find('input').length; ++i) {
                    curEdge.values[i - 1] = $modalEdge.find('input')[i].value;
                }

                if (isAddEdge && edgeSource !== null) {
                    curEdge.id = curEdge.epaId;
                    curEdge.label = curEdge.epaType + " " + curEdge.epaId;
                    curEdge.color = graphColors[curEdge.epaType];
                    curEdge.hover_color = hoverColors[curEdge.epaType];
                    curEdge.size = 1;
                    curEdge.source = edgeSource.id;
                    curEdge.target = curNode.id;

                    if (edgeVerts.length > 0) {
                        curEdge.type = "vert";

                        for (let vert in edgeVerts) {
                            let node = s.graph.nodes().find(node => node.epaId === edgeVerts[vert]);
                            s.graph.dropNode(node.id);
                            node.epaId = curEdge.id + " " + edgeVerts[vert].substr(edgeVerts[vert].indexOf('vert'));
                            node.id = node.epaId;
                            node.label = node.epaId;
                            edgeVerts[vert] = node.id;

                            try {
                                s.graph.addNode(node);
                            }
                            catch (e) {
                                alert(e);
                                return;
                            }
                        }

                        curEdge.vert = edgeVerts;
                    }

                    try {
                        s.graph.addEdge(curEdge);
                        $modalEdge.modal('hide');
                        edgeVerts = [];
                    }
                    catch (e) {
                        alert(e);
                        return;
                    }

                    edgeSource.color = graphColors[edgeSource.epaType];
                    edgeSource = null;
                    curNode.color = graphColors[curNode.epaType];
                    s.refresh();
                }

                resetModelState();
            }
        });

        $btnEdgeDelete.click(function() {
            $modalEdge.modal('hide');

            s.graph.dropEdge(curEdge.id);

            if (curEdge.type === "vert") {
                for (let vert in curEdge.vert) {
                    s.graph.dropNode(curEdge.vert[vert]);
                }
            }

            resetModelState();
        });

        $btnEdgeCancel.click(function() {
            resetModelState();
        });

        $('#file-display-area').bind("DOMSubtreeModified",function(){
            $('#view-tabs').removeClass('hidden');
            $('#loading-model').addClass('hidden');

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

    stopAnimation = function() {
        animate.forEach(function(call) {
            clearTimeout(call);
        });
    };

    resetPlay = function() {
        if (playing === false) {
            playing = true;
            $btnPlayAnimation.find('span').removeClass('glyphicon-play');
            $btnPlayAnimation.find('span').addClass('glyphicon-pause');
            $btnPlayAnimation.removeClass('btn-success');
            $btnPlayAnimation.addClass('btn-warning');
        }
        else {
            playing = false;
            $btnPlayAnimation.find('span').addClass('glyphicon-play');
            $btnPlayAnimation.find('span').removeClass('glyphicon-pause');
            $btnPlayAnimation.removeClass('btn-warning');
            $btnPlayAnimation.addClass('btn-success');
        }
    };

    resetAnimation = function() {
        playing = true;
        resetPlay();

        stopAnimation();

        $animationSlider.slider("value", 0);
        $('#timestep').val(0);

        for (let node in s.graph.nodes()) {
            s.graph.nodes()[node].color = s.graph.nodes()[node].epaColor;
        }
        for (let edge in s.graph.edges()) {
            s.graph.edges()[edge].color = s.graph.edges()[edge].epaColor;
        }

        s.refresh();
    };

    resetNodeAnim = function() {
        let nodeData = [];
        for (let node in s.graph.nodes()) {
            try {
                nodeData = nodeData.concat(s.graph.nodes()[node].modelResults[$nodeAnimType.val()]);
            }
            catch (e) {
                // nothing
            }
        }

        $nodeLegend.html(animationLegends[$nodeAnimColor.val()]);
        $nodeLegend.find('.domain-min').html(Math.floor(Math.min(...nodeData)));
        $nodeLegend.find('.domain-med').html(Math.round((Math.max(...nodeData) + Math.min(...nodeData))/2));
        $nodeLegend.find('.domain-max').html(Math.ceil(Math.max(...nodeData)));

        nodeAnimColor = chroma.scale($nodeAnimColor.val())
            .domain([Math.max(...nodeData), Math.min(...nodeData)]);

    };

    resetEdgeAnim = function() {
        let edgeData = [];
        for (let edge in s.graph.edges()) {
            try {
                edgeData = edgeData.concat(s.graph.edges()[edge].modelResults[$edgeAnimType.val()]);
            }
            catch (e) {
                // nothing
            }
        }

        $edgeLegend.html(animationLegends[$edgeAnimColor.val()]);
        $edgeLegend.find('.domain-min').html(Math.floor(Math.min(...edgeData)));
        $edgeLegend.find('.domain-med').html(Math.round((Math.max(...edgeData) + Math.min(...edgeData))/2));
        $edgeLegend.find('.domain-max').html(Math.ceil(Math.max(...edgeData)));

        edgeAnimColor = chroma.scale($edgeAnimColor.val())
            .domain([Math.max(...edgeData), Math.min(...edgeData)]);
    };

    setGraphEventListeners = function () {
        s.bind('clickStage', function(e) {
            canvasClick(e);
        });

        // s.bind('rightClickStage', function(e) {
        //     addVertClick(e);
        // });

        s.bind('clickNodes', function(e) {
            nodeClick(e);
        });

        s.bind('clickEdges', function(e) {
            edgeClick(e);
        });
    };

    canvasClick = function(e) {
        if(!e.data.captor.isDragging && (isAddNode || edgeSource !== null)) {
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

            if (edgeSource !== null) {
                curNode.epaType = "Vertex";
                populateNodeModal(true);
                $btnNodeOk.click();
            }
            else {
                curNode.epaType = addType;
                curNode.values = [];
                populateNodeModal();
                $chkNodeEdit.click();
                $btnNodeDelete.attr('disabled', true);
            }
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
            nodeModalLeft = e.data.captor.clientX * 2 - 1600;
            $('#node-dialog').css({top: e.data.captor.clientY - 10, left: nodeModalLeft});

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
                        if (edgeSource !== null && edgeSource.epaId !== curNode.epaId) {
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
            edgeModalLeft = e.data.captor.clientX * 2 - 1600;
            $('#edge-dialog').css({top: e.data.captor.clientY - 10, left: edgeModalLeft});

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

    populateNodeModal = function (nOpen) {
        curNode.color = "#1affff";
        s.refresh();

        let values = curNode.values;

        let html = "<table class='table table-nonfluid'><tbody>" + nodeHtml[curNode.epaType] + "</tbody></table>";

        $modalNodeLabel.html(curNode.epaType);
        $modalNode.find('.modal-body-content').html(html);

        if (ranModel && !isAddNode && curNode.epaType !== "Vertex" && curNode.epaType !== "Label" && typeof nOpen === 'undefined') {
            $('#node-results-tab').removeClass('hidden');
            $nodeTabs.tabs({active: 1});
            $('#node-results-tab').click();
        }
        else {
            $('#node-results-tab').addClass('hidden');
            $nodeTabs.tabs({active: 0});
            $('#node-view-tab').click();
        }

        if (typeof nOpen === 'undefined')
            $modalNode.modal('show');

        if (curNode.epaType !== "Label") {
            $('#node-id').val(curNode.epaId);

            if (curNode.epaType !== "Vertex") {
                for (let i = 0; i < values.length - 1; ++i) {
                    $modalNode.find('input')[i + 1].value = curNode.values[i];
                }
            }
        }
        else
            $('#node-id').val(curNode.label);
    };

    populateEdgeModal = function (nOpen) {
        curEdge.hover_color = "#1affff";
        s.refresh();

        let values = curEdge.values;

        let html = "<table class='table table-nonfluid'><tbody>" + edgeHtml[curEdge.epaType] + "</tbody></table>";

        $modalEdgeLabel.html(curEdge.epaType);
        $modalEdge.find('.modal-body-content').html(html);

        if (ranModel && isAddEdge === false) {
            $edgeTabs.tabs({active: 1});
            $('#edge-results-tab').click();
        }
        else {
            $edgeTabs.tabs({active: 0});
            $('#edge-view-tab').click();
        }

        if (typeof nOpen === 'undefined')
            $modalEdge.modal('show');

        $('#edge-id').val(curEdge.epaId);

        for (let i = 0; i < values.length - 1; ++i) {
            $modalEdge.find('input')[i + 1].value = curEdge.values[i];
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
        $nodeResults.empty();
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
        $chkDragNodes = $('#chk-drag');
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
        $btnPlayAnimation = $('#btn-play');
        $btnStopAnimation = $('#btn-stop');
        $viewNodeResults = $('#node-results-view');
        $nodeResults = $('#node-results');
        $viewEdgeResults = $('#edge-results-view');
        $edgeResults = $('#edge-results');
        $loadingAnimation = $('#loading-animation');
        $animationSpeed = $("#speed");
        $animationSlider = $("#slider");
        $btnAnimateTools = $('#btn-animate-tools');
        $animateToolbar = $('#animate-toolbar');
        $nodeLegend = $("#node-leg");
        $edgeLegend = $("#edge-leg");
        $chkNode = $('#chk-nodes');
        $chkEdge = $('#chk-edges');
        $nodeAnimColor = $('#node-anim-color');
        $nodeAnimType = $('#node-anim-type');
        $edgeAnimColor = $('#edge-anim-color');
        $edgeAnimType = $('#edge-anim-type');
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
                    $loadingAnimation.attr('hidden', true);

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
        $('#model-tools-container').removeAttr('hidden');
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
            $('#model-tools-container').removeAttr('hidden');

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
        $viewTabs.tabs({ active: 0 });
        $nodeTabs.tabs({ active: 0 });
        $edgeTabs.tabs({ active: 0 });
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