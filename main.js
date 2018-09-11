const SocketUtils = require('./socketUtils');
const webglUtils = require('./webgl-utils');

const graph = Viva.Graph.graph();
const scaleCoefficient = 4;
const INITIAL_ZOOM = 0.04;
const forceConfig = {
  springLength: 80 * scaleCoefficient,
  springCoeff: 0.0002,
  dragCoeff: 0.009,
  gravity: -30 * scaleCoefficient,
  theta: 0.7,
};

const layout = Viva.Graph.Layout.forceDirected(graph, forceConfig);

function WebglCircle(size, color) {
  this.size = size;
  this.color = color;
}

function getNodeColor(node) {
  const colorMap = {
    1: () => webglUtils.getTxNodeColor(),
    2: () => webglUtils.getInputNodeColor(),
    3: () => webglUtils.getOutputNodeColor(),
    4: () => webglUtils.getMixedNodeColor(),
  };
  if (node.data && colorMap[node.data.type]) {
    return colorMap[node.data.type]();
  } return webglUtils.getUnknownNodeColor();
}
const graphicsOptions = {
  clearColor: true,
  clearColorValue: {
    r: 0.0078,
    g: 0,
    b: 0.2471,
    a: 1,
  },
};
const graphics = Viva.Graph.View.webglGraphics(graphicsOptions);
const circleNode = webglUtils.buildCircleNodeShader();
graphics.setNodeProgram(circleNode);
graphics.node((node => new WebglCircle(50 * scaleCoefficient, getNodeColor(node))));
graphics.link(link => Viva.Graph.View.webglLine(webglUtils.getLinkColor()));

const renderer = Viva.Graph.View.renderer(
  graph,
  {
    layout,
    graphics,
    renderLinks: true,
    prerender: true,
  },
);

const events = Viva.Graph.webglInputEvents(graphics, graph);
events.mouseEnter((node) => {
  console.log(node);
});


renderer.run();
while (renderer.getTransform().scale > INITIAL_ZOOM) {
  renderer.zoomOut();
}

SocketUtils.startSocket(graph, renderer, graphics, layout);
