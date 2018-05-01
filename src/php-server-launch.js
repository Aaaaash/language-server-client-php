import * as rpc from 'vscode-ws-jsonrpc';
import { start } from './php-server';

export default function launch(socket) {
  const reader = new rpc.WebSocketMessageReader(socket);
  const writer = new rpc.WebSocketMessageWriter(socket);
  start(reader, writer);
}
