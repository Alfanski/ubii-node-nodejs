const { UbiiClientNode} = require('../src/index');
const config = require('./config.json');
const WebsiteRenderer = require('../src/processing/WebsiteRenderer');

(async function () {
  let ubiiNode = new UbiiClientNode('test-node-nodejs', config.masterNode.services, config.masterNode.topicdata);
  await ubiiNode.initialize();
  try {
    const wR = new WebsiteRenderer(ubiiNode);
    await wR.init("https://excalidraw.com/");
  } catch(e){
    console.log("Error while rendering the webiste: ", e);
    exit();
  }
})();
