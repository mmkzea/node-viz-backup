import {
    buildLinks,
    renameLinks,
    removeSelfConnections,
    addMissingNodes,
    buildGraph,
} from './graph-builder.js';

const width = 3200;
const height = 2000;

// setup d3, cola and svg
const color = d3.scaleOrdinal(d3.schemeCategory20);
const cola = window.cola.d3adaptor(d3)
                        .linkDistance(300)
                        .avoidOverlaps(true)
                        .handleDisconnected(false)
                        .jaccardLinkLengths(300, 0.7)
                        .size([width, height]);

const svg = d3.select("body")
              .append("svg")
              .attr("width", width)
              .attr("height", height);

// define arrow markers for graph links
[
    ['end-arrow', '#000'],
    ['highlight-end-arrow', 'red'],
    ['highlight-source-end-arrow', 'green'],
    ['highlight-end-arrow', 'red'],
    ['highlight-target-end-arrow', 'blue']
].forEach(([id, color]) => {
    svg.append('svg:defs')
       .append('svg:marker')
       .attr('id', id)
       .attr('viewBox', '0 -5 10 10')
       .attr('refX', 5)
       .attr('markerWidth', 3)
       .attr('markerHeight', 3)
       .attr('orient', 'auto')
       .append('svg:path')
       .attr('d', 'M0,-5L10,0L0,5L2,0')
       .attr('stroke-width', '0px')
       .attr('fill', color);
});

// draw the graph
const {resultId, resultDir} = (function () {
    const query = new Map(
        window.location
              .search
              .replace(/(^\?)/,'')
              .split("&")
              .map(setting => setting.split('='))
    );
    
    const [mode, resultId] = [query.get('mode'), query.get('task')];
    if (!resultId) {
        document.write('result id not found');
        return null;
    }
    
    return {
        resultId,
        resultDir: mode === 'local' ? `http://${location.host}/output` : `http://sos.tusimple.ai/dps/result`,
    };
})();


d3.json(`${resultDir}/${resultId}/parent_task.json`, (error, parentTask) => {
    console.log('parent task: ', parentTask);
    if (error) {
        console.error('error during reading parent task: ', error);
        window.alert('error during reading parent task: ', error);
        return;
    }

    d3.queue()
      .defer(d3.json, `${resultDir}/${parentTask.result_id}/index.json`)
      .defer(d3.json, `${resultDir}/${resultId}/graph.json`)
      .await((error, indexJson, rawGraph) => {
          console.log('indexJson ', indexJson);
          console.log('rawGraph ', rawGraph);

          if (error) {
              console.error('error during reading jsons: ', error);
              window.alert('error during reading jsons: ', error);
              return;
          }

          const links = removeSelfConnections(buildLinks(indexJson), rawGraph.nodes);
          addMissingNodes(links, rawGraph.nodes);

          buildGraph(
              cola,
              svg,
              color,
              {
                ...rawGraph,
                links: renameLinks(links, rawGraph.nodes),
              },
          );
      });

});
