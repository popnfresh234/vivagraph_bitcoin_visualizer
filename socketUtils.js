
const txLimit = 1500;
const webglUtils = require('./webgl-utils');


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
  startSocket(graph, renderer, graphics) {
    console.log('start');
    const socket = new WebSocket('wss://ws.blockchain.info/inv');
    socket.addEventListener('open', () => {
      socket.send(JSON.stringify({ op: 'unconfirmed_sub' }));
    });

    socket.onmessage = (event) => {
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
