import { listen } from 'vscode-ws-jsonrpc';
import { createMonacoServices, MonacoLanguages, MonacoToProtocolConverter, ProtocolToMonacoConverter } from 'monaco-languageclient';


import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import 'monaco-editor/esm/vs/editor/browser/controller/coreCommands';
import 'monaco-editor/esm/vs/editor/contrib/find/findController';
// import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

import 'monaco-editor/esm/vs/editor/editor.all';
import 'monaco-editor/esm/vs/basic-languages/php/php';
import 'monaco-editor/esm/vs/basic-languages/php/php.contribution';

import 'setimmediate';

import {
  createLanguageClient,
  createWebSocket,
} from './createHelper';

/* eslint-disable */
self.MonacoEnvironment = {
  getWorkerUrl: () => './editor.worker.bundle.js'
}

const LANGUAGEID = 'php';

/* eslint-enable */

monaco.languages.register({
  id: 'php',
  extensions: ['.php'],
  // aliases: ['PHP', 'php'],
  // mimetypes: ['application/x-httpd-php'],
});

const value = `<?php
/*
 * This file is part of the overtrue/laravel-wechat.
 *
 * (c) overtrue <i@overtrue.me>
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Overtrue\LaravelWeChat;

use Illuminate\Cache\Repository;
use Psr\SimpleCache\CacheInterface;

class CacheBridge implements CacheInterface
{
    /**
     * @var \Illuminate\Cache\Repository
     */
    protected $repository;

    /**
     * @param \Illuminate\Cache\Repository $repository
     */
    public function __construct(Repository $repository)
    {
        $this->repository = $repository;
    }

    public function get($key, $default = null)
    {
        return $this->repository->get($key, $default);
    }

    public function set($key, $value, $ttl = null)
    {
        return $this->repository->put($key, $value, $this->toMinutes($ttl));
    }

    public function delete($key)
    {
    }

    public function clear()
    {
    }

    public function getMultiple($keys, $default = null)
    {
    }

    public function setMultiple($values, $ttl = null)
    {
    }

    public function deleteMultiple($keys)
    {
    }

    public function has($key)
    {
        return $this->repository->has($key);
    }

    protected function toMinutes($ttl = null)
    {
        if (!is_null($ttl)) {
            return $ttl / 60;
        }
    }
}
`;

const editor = monaco.editor.create(document.getElementById('container'), {
  model: monaco.editor.createModel(value, 'php', monaco.Uri.parse('inmemory://model.php')),
  language: 'php',
  glyphMargin: true,
  lightbulb: {
    enabled: true,
  },
  theme: 'vs-dark',
});

const socketUrl = 'ws://localhost:4000/php-language-server';
const webSocket = createWebSocket(socketUrl);

const services = createMonacoServices(editor);

let serverconnection;
listen({
  webSocket,
  onConnection: (connection) => {
    const languageClient = createLanguageClient(connection, services);
    const disposable = languageClient.start();
    serverconnection = connection;
    connection.onClose(() => disposable.dispose());
  },
});

monaco.languages.registerHoverProvider('php', {
  provideHover(model, position) {
    return serverconnection.sendRequest('textDocument/hover', {
      position: {
        character: position.column,
        line: position.lineNumber,
      },
      textDocument: {
        uri: 'inmemory://model.php',
      },
    });
  },
});
