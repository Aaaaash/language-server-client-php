import { createConnection, TextDocuments, TextDocumentSyncKind } from 'vscode-languageserver';
// import Uri from 'vscode-uri';
import { Intelephense } from 'intelephense';

let initialisedAt;


function elapsed(st) {
  if (!st) {
    return -1;
  }
  const diff = process.hrtime(st);
  return diff[0] * 1000 + diff[1] / 1000000;
}


export class PhpServer {
  constructor(connection) {
    this.connection = connection;
    this.documents = new TextDocuments();
    this.workspaceRoot = undefined;
    // this.LanguageService = getLanguageService({
    //   schemaRequestService: this.resovleSchema.bind(this),
    // });
    this.pendingValidationRequests = new Map();

    this.documents.listen(this.connection);
    // this.documents.onDidChangeContent(change => this.validate(change.document));
    // this.documents.onDidClose((event) => {
    //   this.cleanPendingValidation(event.document);
    //   this.cleanDiagnostics(event.document);
    // });

    this.connection.onInitialize((params) => {
      initialisedAt = process.hrtime();
      this.connection.console.info('Initialising');
      const initOptions = {
        storagePath: undefined,
        logWriter: {
          info: connection.console.info,
          warn: connection.console.warn,
          error: connection.console.error,
        },
        clearCache: undefined,
      };

      return Intelephense.initialise(initOptions).then(() => {
        Intelephense.onPublishDiagnostics((args) => {
          connection.sendDiagnostics(args);
        });
        connection.console.info(`Initialised in ${elapsed(initialisedAt).toFixed()} ms`);

        return {
          capabilities: {
            textDocumentSync: TextDocumentSyncKind.Incremental,
            documentSymbolProvider: true,
            workspaceSymbolProvider: true,
            completionProvider: {
              triggerCharacters: [
                '$',
                '>',
                ':',
                '\\', // php
                '.',
                '<',
                '/', // html/js
              ],
            },
            signatureHelpProvider: {
              triggerCharacters: ['(', ','],
            },
            definitionProvider: true,
            // documentFormattingProvider: true,
            documentRangeFormattingProvider: true,
            referencesProvider: true,
            documentLinkProvider: { resolveProvider: true },
            hoverProvider: true,
            documentHighlightProvider: true,
          },
        };
      });
    });

    this.connection.onCodeAction((params) => {
      this.codeAction(params);
    });

    this.connection.onHover((params) => {
      console.log(params);
      return Intelephense.provideHover(params.textDocument.uri, params.position);
    });

    // this.connection.onCompletion((params) => this.completion(params));
    // this.connection.onCompletionResolve(item => this.resolveCompletion(item));
    // this.connection.onExecuteCommand((params) => this.executeCommand(params));
    // this.connection.onDocumentSymbol((params) => this.findDocumentSymbols(params));
    // this.connection.onDocumentRangeFormatting((params) => this.format(params));
    this.connection.onDocumentHighlight(params =>
      Intelephense.provideHighlights(params.textDocument.uri, params.position));

    this.connection.onDidOpenTextDocument((params) => {
      if (params.textDocument.text.length > 1000000) {
        connection.console.warn(`${params.textDocument.uri} not opened -- over max file size.`);
        return;
      }
      Intelephense.openDocument(params.textDocument);
    });

    this.connection.onDidChangeTextDocument(params =>
      Intelephense.editDocument(params.textDocument, params.contentChanges));

    this.connection.onDidCloseTextDocument(params =>
      Intelephense.closeDocument(params.textDocument));

    this.connection.onDocumentSymbol(params => Intelephense.documentSymbols(params.textDocument));

    this.connection.onWorkspaceSymbol(params => Intelephense.workspaceSymbols(params.query));

    connection.onReferences(params =>
      Intelephense.provideReferences(params.textDocument, params.position, params.context));

    connection.onCompletion(params =>
      Intelephense.provideCompletions(params.textDocument, params.position));

    connection.onSignatureHelp(params =>
      Intelephense.provideSignatureHelp(params.textDocument, params.position));

    connection.onDefinition(params =>
      Intelephense.provideDefinition(params.textDocument, params.position));

    connection.onDocumentRangeFormatting(params =>
      Intelephense.provideDocumentRangeFormattingEdits(
        params.textDocument,
        params.range,
        params.options,
      ));

    connection.onShutdown(Intelephense.shutdown);

    connection.onRequest('discoverSymbols', (params) => {
      if (params.textDocument.text.length > 1000000) {
        connection.console.warn(`${params.textDocument.uri} exceeds max file size.`);
        return 0;
      }

      return Intelephense.discoverSymbols(params.textDocument);
    });

    connection.onRequest('discoverReferences', (params) => {
      if (params.textDocument.text.length > 1000000) {
        connection.console.warn(`${params.textDocument.uri} exceeds max file size.`);
        return 0;
      }
      return Intelephense.discoverReferences(params.textDocument);
    });

    connection.onRequest('forget', params => Intelephense.forget(params.uri));

    connection.onRequest('importSymbol', params =>
      Intelephense.provideContractFqnTextEdits(params.uri, params.position, params.alias));

    connection.onRequest('knownDocuments', () => Intelephense.knownDocuments());

    connection.onRequest('documentLanguageRanges', params =>
      Intelephense.documentLanguageRanges(params.textDocument));
  }

  start() {
    this.connection.listen();
  }

  codeAction(params) {
    return [
      {
        title: 'Upper Case Document',
        command: 'php.documentUpper',
        arguments: [
          Object.assign({}, params.textDocument, {
            version: this.documents.get(params.textDocument.uri).version,
          }),
        ],
      },
    ];
  }
}

export function start(reader, writer) {
  const connection = createConnection(reader, writer);
  const server = new PhpServer(connection);
  server.start();
  return server;
}
