
const txLimit = 1500;
const webglUtils = require('./webgl-utils');

const txs = [{
  op: 'utx',
  x: {
    lock_time: 0,
    ver: 1,
    size: 223,
    inputs: [{
      sequence: 4294967295,
      prev_out: {
        spent: true, tx_index: 371493091, type: 0, addr: '13hZD3s3efJ3uETmpifWDnhRLB6vfZYMx4', value: 176339, n: 1, script: '76a91403efea7c0cdc09a07481b40fbdb8a8885f0e618a88ac',
      },
      script: '47304402202952cf2b881975558e4083afe23a9c5fbf5ae5aab7fc0d944c98361f6c55659402201e13743ef550d223abfa3d10dcd3fbf473f3180dbb2921e492b45f66284b6bc60121030e3ea08971059f1225342e758e3c93a9bc021a4a5ea827999060c2163900c662',
    }],
    time: 1536121911,
    tx_index: 371774235,
    vin_sz: 1,
    hash: '4c82c9d5d0f970ec6f758c1dc7db356cadad63e50983a66aa1f021b14f57fc95',
    vout_sz: 2,
    relayed_by: '127.0.0.1',
    out: [{
      spent: false, tx_index: 371774235, type: 0, addr: '112ZCyjqdmESWg3xUZcsAoEzaqbsUnjX4f', value: 85770, n: 0, script: 'a914240d12b28620512a6336ce1fc99735ef90e27ca487',
    }, {
      spent: false, tx_index: 371774235, type: 0, addr: '13hZD3s3efJ3uETmpifWDnhRLB6vfZYMx4', value: 87631, n: 1, script: '76a9148cbcb71cfc903c0f5e37911a95627b499c8808d588ac',
    }],
  },
},
];

const cleanTxs = txs.map(tx => ({
  hash: tx.x.hash,
  inputs: tx.x.inputs.map(input => (input.prev_out.addr)),
  outputs: tx.x.out.map(output => (output.addr)),
}));

console.log(cleanTxs);


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
    txs.forEach((tx) => {
      if (tx.op === 'utx') {
        const { inputs, out, hash } = tx.x;
        const links = [];
        graph.addNode(hash, { type: 1, note: 'TRANSACTIOn' });
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
    });
    let counter = 0;
    graph.forEachNode((node) => {
      counter++;
      if (!node.data) {
        console.log(node.data.type);
      }
    });
    console.log(`THERE ARE ${counter} NODES`);
  },
};
