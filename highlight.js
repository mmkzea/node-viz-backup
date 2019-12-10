
export const updateActiveElement = (
    oldActiveElement,
    newActiveElement,
    [
        normalClass = 'link',
        highLightClass = 'link-high-light',
    ],
) => {
    updateStyle(oldActiveElement, normalClass);
    updateStyle(newActiveElement, `${normalClass} ${highLightClass}`);
    return newActiveElement;
};


export const highLightLinksOfNode = (nodeName, adjList) => {
    const links = adjList[nodeName] || {};
    const [soureLines, soureNodes] = highLightLinks(nodeName, links.sourceList, false);
    const [targetLines, targetNodes] = highLightLinks(nodeName, links.targetList, true);
    return [
        [...soureLines, ...targetLines],
        [...soureNodes, ...targetNodes],
    ];
};

import { nodeToId } from './util.js';

export const resetLinkStyle = (lines) => {
    resetElementStyle(lines, 'link');
};


export const resetNodeStyle = (nodes) => {
    resetElementStyle(nodes, 'node');
};


function highLightLinks (oneNode, nodesList, isFromSource) {
    if (!nodesList || nodesList.size === 0 ) {
        return [[], []];
    }

    const lines = [];
    const nodes = [];

    [...nodesList].forEach(node => {
        const lineId = isFromSource ? `${oneNode}-link-to-${node}` : `${node}-link-to-${oneNode}`;
        lines.push(`#${lineId}`);
        nodes.push(`rect#${nodeToId(node)}`);

        updateStyle(`#${lineId}`, `link link-high-light ${isFromSource ? 'link-source' : 'link-target'}`);
        updateStyle(`rect#${nodeToId(node)}`, 'node node-high-light');
    });

    return [
        lines,
        nodes,
    ];
};


function updateStyle(element, className) {
    if (element) {
        d3.select(element)
          .attr('class', className);
    }
}


function resetElementStyle(elements, className) {
    if(!Array.isArray(elements) || elements.length === 0 ) {
        return;
    }

    elements.forEach(elementId => {
        d3.select(`${elementId}`)
          .attr('class', className);
    });
};
