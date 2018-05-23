;(function(undefined) {
    'use strict';

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

        for (let i = 0; i < edge.vert.length; ++i) {
            try {
                let nodesOnScreen = s.renderers["0"].nodesOnScreen;
                let nextVert = nodesOnScreen.find(node => node.id === edge.vert[i]);

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
})();