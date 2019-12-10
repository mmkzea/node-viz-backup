import {
    updateActiveElement,
    highLightLinksOfNode,
    resetLinkStyle,
    resetNodeStyle,
} from './highlight.js';

import { nodeToId } from './util.js';


const getTextSize = (text, fontSize=16) => {
    document.body.insertAdjacentHTML('afterbegin', `
        <div id="cal-text" class="node label">
            ${text}
        </div>
    `);
    const textElement = document.getElementById('cal-text');
    textElement.style.fontSize = fontSize;
    
    const [height, width] = [textElement.clientHeight, textElement.clientWidth];
    document.body.removeChild(textElement);

    return [width, height];
};


const buildGraphAdjList = (links = [], nodes = []) => {
    const idxToName = idx => (nodes[idx] || {}).name || 'undefined';

    const adjList = {};
    links.forEach(({source, target}) => {
        const [sourceName, targetName] = [idxToName(source), idxToName(target)];
        adjList[sourceName] = adjList[sourceName] || {};
        adjList[sourceName].targetList = adjList[sourceName].targetList || new Set();
        adjList[sourceName].targetList.add(targetName);

        adjList[targetName] = adjList[targetName] || {};
        adjList[targetName].sourceList = adjList[targetName].sourceList || new Set();
        adjList[targetName].sourceList.add(sourceName);

    });

    return adjList;
};


const buildTopics = (indexJson) => {
    const topicDictionary = {};
    indexJson
        .filter(({name}) => name.startsWith('Input') || name.startsWith('Output'))
        .forEach(({
            heartbeat_id: nodeName,
            node: linkValue,
            name: fullTopic,
    }) => {
        const isFromSource = fullTopic.startsWith('Input');
        const topic = fullTopic.split(' ')[2] || '/void';
        const realTopic = topic[0] === '/' ? topic : `/${topic}`;

        topicDictionary[realTopic] = topicDictionary[realTopic] || {
            inputNodes: new Set(),
            outputNodes: new Set(),
        }

        if (isFromSource) {
            topicDictionary[realTopic].outputNodes.add(nodeName);
        } else {
            topicDictionary[realTopic].inputNodes.add(nodeName);
        }
    })

    return topicDictionary;
};


export const buildLinks = (indexJson) => {

    const topicDictionary = buildTopics(indexJson);

    const links = {};
    Object.entries(topicDictionary)
          .forEach(([topic, {inputNodes, outputNodes}]) => {
            inputNodes.forEach(inputNode => {
                outputNodes.forEach(outputNode => {
                    const linkId = `${inputNode}-linked-to->${outputNode}`;
                    links[linkId] = links[linkId] || {
                        source: inputNode,
                        target: outputNode,
                        value: topic,
                    };
                    links[linkId].value = topic;
                });
            });
        });
    console.log('new links: ', links);

    return links;
};

export const addMissingNodes = (linksMap, nodesList) => {
    /**
     * !! side effect on nodeesList here is necessary
     */
    Object.entries(linksMap)
          .forEach(([key, {source, target, value}]) => {
                [source, target].forEach(nodeName => {
                    if (-1 === nodesList.findIndex(node => node.name === nodeName)) {
                        nodesList.push({
                            name: nodeName,
                            group: 'undefined',
                        })
                    }
                })
          });
};


export const removeSelfConnections = (linksMap, nodesList) => {
    return Object.entries(linksMap)
                 .filter(([key, {source, target, value}]) => source !== target)
                 .map(([key, {source, target, value}]) => ({
                    key,
                    source,
                    target,
                    value,
                }));
};


export const renameLinks = (linksMap, nodesList) => {
    const nameToIndex = name => nodesList.findIndex(node => node.name === name);

    return Object.entries(linksMap)
                        .map(([, {source, target, value}]) => ({
                            source: nameToIndex(source),
                            target: nameToIndex(target),
                            value,
                        }));
};


export const buildGraph = (cola, svg, color, graph) => {
    const groupMap = {};
    graph.nodes.forEach((node, index) => {
        const groupId = node.group;
        groupMap[groupId] = groupMap[groupId] || [];
        groupMap[groupId].push(index);

        [node.width, node.height] = getTextSize(node.name);
    });

    const adjList = buildGraphAdjList(graph.links, graph.nodes);
    const groups = Object.entries(groupMap)
                         .map(([id, leaves]) => ({
                            id,
                            leaves,
                         }));

    // setup graph group
    cola
        .nodes(graph.nodes)
        .links(graph.links)
        .groups(groups)
        .start();

    const group = svg.selectAll(".group")
                     .data(groups)
                     .enter()
                     .append("rect")
                     .attrs({
                        'rx': 8,
                        'ry': 8,
                        'class': 'group',
                     })
                     .style("fill", (d) => color(d.id))
                     .call(cola.drag);

    let activeLink = null;
    let activeLinks = null;

    let activeNode = null;
    let activeNodes = null;
    let activeSourceNode = null;
    let activeTargetNode = null;

    const link = svg.selectAll(".link")
                    .data(graph.links)
                    .enter()
                    .append("line")
                    .attrs({
                        'class': 'link',
                        'id': d => `${d.source.name}-link-to-${d.target.name}`,
                    })
                    .on('mouseover', function(d) {
                        activeLink = updateActiveElement(activeLink, this, ['link', 'link-high-light']);
                        // to-do: show value somewhere?

                        activeSourceNode = updateActiveElement(activeSourceNode, `rect#${nodeToId(d.source.name)}`, ['node', 'node-high-light']);
                        activeTargetNode = updateActiveElement(activeTargetNode, `rect#${nodeToId(d.target.name)}`, ['node', 'node-high-light']);
                    });

    link.append('title')
        .text(data => data.value);

    const margin = 6, pad = 12;
    const node = svg.selectAll(".node")
                    .data(graph.nodes)
                    .enter()
                    .append("rect")
                    .attrs({
                        'class': 'node',
                        'width': (d) => d.width - 2 * pad,
                        'height': (d) => d.height - 2 * pad,
                        'rx': 5,
                        'ry': 5,
                        'id': d => nodeToId(d.name),
                    })
                    .style("fill", (data) => color(data.group))
                    .on('mouseover', function(d) {
                         // disable active link first
                        updateActiveElement(activeLink, null, ['link', 'link-high-light']);

                        // highlight all the links
                        [activeLinks, activeNodes] = highLightLinksOfNode(d.name, adjList);
                    })
                    .on('mouseout', () => {
                        resetLinkStyle(activeLinks);
                        resetNodeStyle(activeNodes);
                        updateActiveElement(activeNode, null, ['node', 'node-high-light']);
                    })
                    .call(cola.drag);

    const label = svg.selectAll(".label")
                     .data(graph.nodes)
                     .enter()
                     .append("text")
                     .attr("class", "label")
                     .on('mouseover', function(d) {
                         // disable active link first
                         updateActiveElement(activeLink, null, ['link', 'link-high-light']);

                         // high current node and linked links and nodes
                         activeNode = updateActiveElement(activeNode, `rect#${nodeToId(d.name)}`, ['node', 'node-high-light']);
                         [activeLinks, activeNodes] = highLightLinksOfNode(d.name, adjList);
                     })
                     .on('mouseout', () => {
                        resetLinkStyle(activeLinks);
                        resetNodeStyle(activeNodes);
                        updateActiveElement(activeNode, null, ['node', 'node-high-light']);
                    })
                     .text((d) => d.name)
                     .call(cola.drag);

    cola.on("tick",  () => {
        node.each((d) => {
            d.innerBounds = d.bounds.inflate(- margin);
        });

        link.each((d) => {
            d.route = window.cola.makeEdgeBetween(d.source.innerBounds, d.target.innerBounds, 5);
        });

        link.attrs({
            'x1': d => d.route.sourceIntersection.x,
            'y1': d => d.route.sourceIntersection.y,
            'x2': d => d.route.arrowStart.x,
            'y2': d => d.route.arrowStart.y,
        });

        node.attrs({
            'x': d => d.innerBounds.x,
            'y': d => d.innerBounds.y,
            'width': d => d.innerBounds.width(),
            'height': d => d.innerBounds.height(),
        });

        group.attrs({
            'x': ({bounds}) => bounds.x,
            'y': ({bounds}) => bounds.y,
            'width': ({bounds}) => bounds.width(),
            'height': ({bounds}) => bounds.height(),
        });

        label.attrs({
            'x': d => d.x,
            'y': function (d) {
                return d.y + this.getBBox().height / 4;
            }
        });
    });
};
