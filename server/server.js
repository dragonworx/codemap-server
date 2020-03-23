const chalk = require('chalk');
const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');
const stream = require('stream');
const path = require('path');
const commandLineArgs = require('command-line-args');
const serverOptions = commandLineArgs([
   { name: 'port', alias: 'p', type: Number, defaultValue: 3000 }
 ]);

 console.log(chalk.grey(JSON.stringify(serverOptions)));

const defaultRenderOptions = {
   format: 'png',
   fontSize: 12,
}

const publicPath = path.resolve(__dirname, 'public');

const kill = (err) => {
   console.log(chalk.bold.red(err));
   process.exit(-1);
};

class CodeMapServer {
   constructor(options) {
      this._template = fs.readFileSync(path.resolve(publicPath, 'index.html')).toString();
   }

   start() {
      return new Promise((resolve) => {
         const port = serverOptions.port;
         const app = express();

         app.get('/', async (req, res, next) => {
            console.log(chalk.grey(`GET ${req.url}`));
            const srcPathParam = req.query['src'];
            let srcPath;
            const mode = req.query['mode'];
            const fontSize = parseInt(req.query['fontSize'] || `${defaultRenderOptions.fontSize}`, 10);
            if (typeof srcPathParam === 'string') {
               srcPath = path.resolve(srcPathParam);
               if (!fs.existsSync(srcPath)) {
                  res.writeHead(404);
                  res.end(`Not found: ${srcPath}`);
               }
            }

            if (!mode) {
               // return html
               let html = this._template.replace('FONT_SIZE', `${fontSize}px`);
               if (srcPathParam) {
                  console.log(chalk.white(`Reading src: ${srcPath}`))
                  const srcContent = fs.readFileSync(srcPath).toString();
                  html = html.replace('<textarea id="code"></textarea>', `<textarea id="code">${srcContent}</textarea>`);
               }
               res.send(html);
            }
            
            if (mode === 'image') {
               // return image binary
               if (srcPathParam) {
                  const buffer = await this.render(srcPath, {
                     fontSize,
                  });
                  res.writeHead(200, {'Content-Type': 'image/png'});
                  res.end(buffer);
               }
            }
         });

         app.use(express.static(publicPath));

         console.log(chalk.cyan(`Starting express server on port ${port}...`));

         this._server = app.listen(port, async (err) => {
            if (err) {
               kill(`Could not start express server on port ${port}: ${err}`);
            }

            console.log(chalk.green(`Express server started successfully`));
            console.log(chalk.cyan(`Starting Puppeteer...`));

            try {
               this._browser = await puppeteer.launch();
               this._page = await this._browser.newPage();
               await this._page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
            } catch (e) {
               kill(`Could not start Puppeteer: ${e}`);
            }

            console.log(chalk.green(`CodeMapServer started successfully`));

            resolve(this);
         });
      })
   }

   async render(srcFilePath, options = defaultRenderOptions) {
      const srcFullPath = path.resolve(srcFilePath);
      const format = options.format || defaultRenderOptions.format;
      const fontSize = options.fontSize || defaultRenderOptions.fontSize;

      return new Promise((resolve, reject) => {
         console.log(chalk.cyan(`Reading ${srcFullPath}`));
         fs.readFile(srcFullPath, async (err, data) => {
            if (err) {
               kill(`Could not read source file ${srcFullPath}: ${e}`);
            }
            console.log(chalk.cyan(`Screenshotting ${format}`));
            const source = data.toString();
            const { width, height, gutterSize } = await this._page.evaluate((src, options) => {
               return window.setEditorValue(src, options);
            }, source, {
               fontSize,
            });
            await this._page.setViewport({ width: width + gutterSize, height });
            let buffer;
            if (format === 'png' || format === 'jpg') {
               buffer = await this._page.screenshot({type: format});
            } else if (format === 'pdf') {
               // TODO: buffer = await this._page.pdf({...});
            }
            console.log(chalk.green(`(${format}) Rendered successful! dimensions: (${width + gutterSize}px x ${height}px) bytes: ${buffer.length}`));
            resolve(buffer);
         });
      });
   }

   async close() {
      this._browser.close();
      await this._server.close();
      console.log(chalk.green('Code Server stopped'));
      process.exit(0);
   }
}

module.exports = CodeMapServer;
