import { listen } from 'vscode-ws-jsonrpc';
import { createMonacoServices } from 'monaco-languageclient';
import 'monaco-editor-core';

// import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import 'monaco-editor/esm/vs/editor/browser/controller/coreCommands';
import 'monaco-editor/esm/vs/editor/contrib/find/findController';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

// import 'monaco-editor/esm/vs/editor/editor.main';
import 'monaco-editor/esm/vs/basic-languages/php/php';
import 'monaco-editor/esm/vs/basic-languages/php/php.contribution';

import 'setimmediate';

import {
  createLanguageClient,
  createWebSocket,
} from './createHelper';

/* eslint-disable */
self.MonacoEnvironment = {
	getWorkerUrl: function (moduleId, label) {
		return './editor.worker.js';
	}
}

const LANGUAGEID = 'php';

/* eslint-enable */

monaco.languages.register({
  id: LANGUAGEID,
  extensions: ['.php'],
  aliases: ['PHP', 'php'],
  mimetypes: ['application/x-httpd-php'],
});

const value = `<?php
// 区分大小写的常量名
define("GREETING", "欢迎访问 Runoob.com");
echo GREETING;    // 输出 "欢迎访问 Runoob.com"
echo '<br>';
echo greeting;   // 输出 "greeting"
?>
`;

const editor = monaco.editor.create(document.getElementById('container'), {
  model: monaco.editor.createModel(value, LANGUAGEID, monaco.Uri.parse('inmemory://model.php')),
  language: LANGUAGEID,
  glyphMargin: true,
  lightbulb: {
    enabled: true,
  },
  theme: 'vs-dark',
});

const socketUrl = 'ws://localhost:4000/php-language-server';
const webSocket = createWebSocket(socketUrl);

const services = createMonacoServices(editor);

listen({
  webSocket,
  onConnection: (connection) => {
    const languageClient = createLanguageClient(connection, services);
    console.log(languageClient);
    const disposable = languageClient.start();
    connection.onClose(() => disposable.dispose());
  },
});

