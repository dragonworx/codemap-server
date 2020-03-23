const CodeMapServer = require('./server');
const fs = require('fs');

(new CodeMapServer()).start().then(async server => {
  // const buffer = await server.render('./test.js');
  // fs.writeFileSync('./test.png', buffer);
  // server.close();
});