(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const SocketUtils = require('./socketUtils');
const webglUtils = require('./webgl-utils');

const graph = Viva.Graph.graph();
const scaleCoefficient = 4;

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
// graphics.scale(0.15, { x: window.innderWidth / 2, y: window.innerHeight / 2 });
const graphRect = layout.getGraphRect();
const graphSize = Math.min(graphRect.x2 - graphRect.x1, graphRect.y2 - graphRect.y1);
const screenSize = Math.min(document.body.clientWidth, document.body.clientHeight);
const desiredScale = screenSize / graphSize;

SocketUtils.startSocket(graph, renderer, graphics, layout);

},{"./socketUtils":2,"./webgl-utils":3}],2:[function(require,module,exports){

const pinId = 'pinNode';
const webglUtils = require('./webgl-utils');

const initalZoom = 0.04;


function createNodes(link, graph, renderer, graphics) {
  let node = null;
  if (link.type === 2) {
    graph.forEachNode((existingNode) => {
      if (existingNode.data.hash !== link.hash && existingNode.id.substring(0, existingNode.id.indexOf('transaction')) === link.source.substring(0, link.source.indexOf('transaction'))) {
        node = existingNode;
        const nodeUI = graphics.getNodeUI(existingNode.id);
        nodeUI.color = webglUtils.getMixedNodeColor();
        renderer.rerender();
      }
    });
    if (!node) {
      graph.addNode(link.source, { type: 2, hash: link.hash });
      graph.addLink(link.hash, link.source);
    } else {
      graph.addLink(node.id, link.target);
    }
  } else if (link.type === 3) {
    graph.forEachNode((existingNode) => {
      if (existingNode.data.hash !== link.hash && existingNode.id.substring(0, existingNode.id.indexOf('transaction')) === link.target.substring(0, link.target.indexOf('transaction'))) {
        node = existingNode;
        const nodeUI = graphics.getNodeUI(existingNode.id);
        nodeUI.color = webglUtils.getMixedNodeColor();
        renderer.rerender();
      }
    });
    if (!node) {
      graph.addNode(link.target, { type: 3, hash: link.hash });
      graph.addLink(link.target, link.hash);
    } else {
      graph.addLink(node.id, link.source);
    }
  }
}


module.exports = {
  startSocket(graph, renderer, graphics, layout) {
    console.log('start');
    const socket = new WebSocket('wss://ws.blockchain.info/inv');
    socket.addEventListener('open', () => {
      socket.send(JSON.stringify({ op: 'unconfirmed_sub' }));
    });

    socket.onmessage = (event) => {
      console.log(renderer.getTransform());
      while (renderer.getTransform().scale > initalZoom) {
        renderer.zoomOut();
      }
      const tx = JSON.parse(event.data);
      if (tx.op === 'utx') {
        const { inputs, out, hash } = tx.x;
        const links = [];
        graph.addNode(hash, { type: 1 });
        for (let i = 0; i < inputs.length; i++) {
          const input = inputs[i];
          if (input.prev_out.addr) {
            links.push({
              source: `${input.prev_out.addr}transactioninput${hash}${i}`,
              target: hash,
              hash,
              type: 2,
            });
          }
        }

        for (let j = 0; j < out.length; j++) {
          const output = out[j];
          if (output.addr) {
            links.push({
              source: hash,
              target: `${output.addr}transactionoutput${hash}${j}`,
              hash,
              type: 3,
            });
          }
        }

        for (let k = 0; k < links.length; k++) {
          const link = links[k];
          createNodes(link, graph, renderer, graphics);
        }
      }
    };
  },
};

},{"./webgl-utils":3}],3:[function(require,module,exports){
const txNodeColor = 0x1D84B5;
const inputNodeColor = 0x41D3BD;
const outputNodeColor = 0xE8E288;
const mixedNodeColor = 0xA14EBF;
const unknownNodeColor = 0xff0000;
const linkColor = '#5b5b5b';
const bgColor = '#02003f';


module.exports = {
  getTxNodeColor() {
    return txNodeColor;
  },

  getInputNodeColor() {
    return inputNodeColor;
  },

  getOutputNodeColor() {
    return outputNodeColor;
  },

  getMixedNodeColor() {
    return mixedNodeColor;
  },

  getUnknownNodeColor() {
    return unknownNodeColor;
  },

  getLinkColor() {
    return linkColor;
  },

  getBgColor() {
    return bgColor;
  },

  // Next comes the hard part - implementation of API for custom shader
  // program, used by webgl renderer:
  buildCircleNodeShader() {
  // For each primitive we need 4 attributes: x, y, color and size.
    let ATTRIBUTES_PER_PRIMITIVE = 4,
      nodesFS = [
        'precision mediump float;',
        'varying vec4 color;',
        'void main(void) {',
        '   if ((gl_PointCoord.x - 0.5) * (gl_PointCoord.x - 0.5) + (gl_PointCoord.y - 0.5) * (gl_PointCoord.y - 0.5) < 0.25) {',
        '     gl_FragColor = color;',
        '   } else {',
        '     gl_FragColor = vec4(0);',
        '   }',
        '}'].join('\n'),
      nodesVS = [
        'attribute vec2 a_vertexPos;',
        // Pack color and size into vector. First elemnt is color, second - size.
        // Since it's floating point we can only use 24 bit to pack colors...
        // thus alpha channel is dropped, and is always assumed to be 1.
        'attribute vec2 a_customAttributes;',
        'uniform vec2 u_screenSize;',
        'uniform mat4 u_transform;',
        'varying vec4 color;',
        'void main(void) {',
        '   gl_Position = u_transform * vec4(a_vertexPos/u_screenSize, 0, 1);',
        '   gl_PointSize = a_customAttributes[1] * u_transform[0][0];',
        '   float c = a_customAttributes[0];',
        '   color.b = mod(c, 256.0); c = floor(c/256.0);',
        '   color.g = mod(c, 256.0); c = floor(c/256.0);',
        '   color.r = mod(c, 256.0); c = floor(c/256.0); color /= 255.0;',
        '   color.a = 1.0;',
        '}'].join('\n');
    let program,
      gl,
      buffer,
      locations,
      utils,
      nodes = new Float32Array(64),
      nodesCount = 0,
      canvasWidth,
      canvasHeight,
      transform,
      isCanvasDirty;
    return {
    /**
                 * Called by webgl renderer to load the shader into gl context.
                 */
      load(glContext) {
        gl = glContext;
        webglUtils = Viva.Graph.webgl(glContext);
        program = webglUtils.createProgram(nodesVS, nodesFS);
        gl.useProgram(program);
        locations = webglUtils.getLocations(program, ['a_vertexPos', 'a_customAttributes', 'u_screenSize', 'u_transform']);
        gl.enableVertexAttribArray(locations.vertexPos);
        gl.enableVertexAttribArray(locations.customAttributes);
        buffer = gl.createBuffer();
      },
      /**
                 * Called by webgl renderer to update node position in the buffer array
                 *
                 * @param nodeUI - data model for the rendered node (WebGLCircle in this case)
                 * @param pos - {x, y} coordinates of the node.
                 */
      position(nodeUI, pos) {
        const idx = nodeUI.id;
        nodes[idx * ATTRIBUTES_PER_PRIMITIVE] = pos.x;
        nodes[idx * ATTRIBUTES_PER_PRIMITIVE + 1] = -pos.y;
        nodes[idx * ATTRIBUTES_PER_PRIMITIVE + 2] = nodeUI.color;
        nodes[idx * ATTRIBUTES_PER_PRIMITIVE + 3] = nodeUI.size;
      },
      /**
                 * Request from webgl renderer to actually draw our stuff into the
                 * gl context. This is the core of our shader.
                 */
      render() {
        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, nodes, gl.DYNAMIC_DRAW);
        if (isCanvasDirty) {
          isCanvasDirty = false;
          gl.uniformMatrix4fv(locations.transform, false, transform);
          gl.uniform2f(locations.screenSize, canvasWidth, canvasHeight);
        }
        gl.vertexAttribPointer(locations.vertexPos, 2, gl.FLOAT, false, ATTRIBUTES_PER_PRIMITIVE * Float32Array.BYTES_PER_ELEMENT, 0);
        gl.vertexAttribPointer(locations.customAttributes, 2, gl.FLOAT, false, ATTRIBUTES_PER_PRIMITIVE * Float32Array.BYTES_PER_ELEMENT, 2 * 4);
        gl.drawArrays(gl.POINTS, 0, nodesCount);
      },
      /**
                 * Called by webgl renderer when user scales/pans the canvas with nodes.
                 */
      updateTransform(newTransform) {
        transform = newTransform;
        isCanvasDirty = true;
      },
      /**
                 * Called by webgl renderer when user resizes the canvas with nodes.
                 */
      updateSize(newCanvasWidth, newCanvasHeight) {
        canvasWidth = newCanvasWidth;
        canvasHeight = newCanvasHeight;
        isCanvasDirty = true;
      },
      /**
                 * Called by webgl renderer to notify us that the new node was created in the graph
                 */
      createNode(node) {
        nodes = webglUtils.extendArray(nodes, nodesCount, ATTRIBUTES_PER_PRIMITIVE);
        nodesCount += 1;
      },
      /**
                 * Called by webgl renderer to notify us that the node was removed from the graph
                 */
      removeNode(node) {
        if (nodesCount > 0) { nodesCount -= 1; }
        if (node.id < nodesCount && nodesCount > 0) {
        // we do not really delete anything from the buffer.
        // Instead we swap deleted node with the "last" node in the
        // buffer and decrease marker of the "last" node. Gives nice O(1)
        // performance, but make code slightly harder than it could be:
          webglUtils.copyArrayPart(nodes, node.id * ATTRIBUTES_PER_PRIMITIVE, nodesCount * ATTRIBUTES_PER_PRIMITIVE, ATTRIBUTES_PER_PRIMITIVE);
        }
      },
      /**
                 * This method is called by webgl renderer when it changes parts of its
                 * buffers. We don't use it here, but it's needed by API (see the comment
                 * in the removeNode() method)
                 */
      replaceProperties(replacedNode, newNode) {},
    };
  },

};

},{}]},{},[1]);
