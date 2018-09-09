
const txLimit = 1500;

function createNodes(link, graph, renderer, layout) {
  console.log(graph.getNode[0]);
  if (link.type === 1) {
    const node = graph.getNode(link.source);
    if (!node) {
      graph.addNode(link.source, { type: link.type });
    } else if (node.type === 2) {
      node.type = 3;
      renderer.rerender();
    }
  } else if (link.type === 2) {
    const outNode = graph.getNode(link.target);
    if (!outNode) {
      graph.addNode(link.target, { type: link.type });
    } else if (outNode.type === 1) {
      outNode.type = 3;
      renderer.rerender();
    }
  }
}

module.exports = {
  startSocket(graph, renderer, layout) {
    const socket = new WebSocket('wss://ws.blockchain.info/inv');
    socket.addEventListener('open', () => {
      socket.send(JSON.stringify({ op: 'unconfirmed_sub' }));
    });

    socket.onmessage = (event) => {
      const tx = JSON.parse(event.data);
      if (tx.op === 'utx') {
        const { inputs, out, hash } = tx.x;
        const links = [];

        for (let i = 0; i < inputs.length; i++) {
          const input = inputs[i];
          if (input.prev_out.addr) {
            links.push({
              source: input.prev_out.addr,
              target: hash,
              type: 1,
            });
          }
        }

        for (let j = 0; j < out.length; j++) {
          const output = out[j];
          if (output.addr) {
            links.push({
              source: hash,
              target: output.addr,
              type: 2,
            });
          }
        }

        for (let k = 0; k < links.length; k++) {
          const link = links[k];
          createNodes(link, graph, renderer, layout);
          graph.addLink(link.source, link.target);
        }
      }
    };
  },
};
