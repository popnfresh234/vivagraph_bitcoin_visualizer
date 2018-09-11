const SocketUtils = require('./socketUtils');
const webglUtils = require('./webgl-utils');

const graph = Viva.Graph.graph();

const layout = Viva.Graph.Layout.forceDirected(graph, {
  springLength: 80,
  springCoeff: 0.0002,
  dragCoeff: 0.009,
  gravity: -30,
  theta: 0.7,
});

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

const graphics = Viva.Graph.View.webglGraphics();
const circleNode = webglUtils.buildCircleNodeShader();
graphics.setNodeProgram(circleNode);
graphics.node((node => new WebglCircle(50, getNodeColor(node))));

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


SocketUtils.startSocket(graph, renderer, graphics);
