const SocketUtils = require('./socketUtils');
const webglUtils = require('./webgl-utils');

const graph = Viva.Graph.graph();


const layout = Viva.Graph.Layout.forceDirected(graph, {
  springLength: 30,
  springCoeff: 0.0002,
  dragCoeff: 0.009,
  gravity: -0.1,
  theta: 0.7,
});

function WebglCircle(size, color) {
  this.size = size;
  this.color = color;
}

console.log(new WebglCircle(1, 1));
const graphics = Viva.Graph.View.webglGraphics();
const circleNode = webglUtils.buildCircleNodeShader();
graphics.setNodeProgram(circleNode);
graphics.node(node => new WebglCircle(12, 0x009ee8));

const renderer = Viva.Graph.View.renderer(
  graph,
  {
    layout,
    graphics,
    renderLinks: true,
    prerender: true,
  },
);


renderer.run();


SocketUtils.startSocket(graph, renderer, layout);
