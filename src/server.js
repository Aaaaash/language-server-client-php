import ws from 'ws';
import url from 'url';
import express from 'express';

import launch from './php-server-launch';

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception: ', err.toString());
  if (err.stack) {
    console.error(err.stack);
  }
});

const app = express();

app.use(express.static(__dirname));

const server = app.listen(4000);

const wss = new ws.Server({
  noServer: true,
  perMessageDeflate: false,
});

server.on('upgrade', (request, socket, head) => {
  const pathname = request.url ? url.parse(request.url).pathname : undefined;
  if (pathname === '/php-language-server') {
    wss.handleUpgrade(request, socket, head, (webSocket) => {
      const socketconnect = {
        send: content =>
          webSocket.send(content, (error) => {
            if (error) {
              throw error;
            }
          }),
        onMessage: cb => webSocket.on('message', cb),
        onError: cb => webSocket.on('error', cb),
        onClose: cb => webSocket.on('close', cb),
        dispose: () => webSocket.close(),
      };
      // launch the server when the web socket is opened
      if (webSocket.readyState === webSocket.OPEN) {
        launch(socketconnect);
      } else {
        webSocket.on('open', () => launch(socket));
      }
    });
  }
});

// if (module.hot) {
//   module.hot.accept('./php-server-launch', () => {
//     require('./php-server-launch');
//   });
// }
