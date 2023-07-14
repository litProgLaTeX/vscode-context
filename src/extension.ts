
import { sync as commandExists } from 'command-exists'
import * as vscode from 'vscode'
import {
  ServerOptions,
  LanguageClientOptions,
  WorkDoneProgressCancelNotification
} from 'vscode-languageclient/node'
import { BuildStatus, TexLanguageClient } from './client'
import { CONTEXT_FILE, CONTEXT_UNTITLED } from './selectors'
import { Messages, StatusIcon } from './view'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const thingsToDispose : Array<{ dispose() : any }> = [];
let client : TexLanguageClient ;

export async function activate(_vsContext: vscode.ExtensionContext) {

  const serverName = 'context-langserver'

  if (! commandExists(serverName)) {
    throw new Error(Messages.SERVER_NOT_FOUND)
  }

  const serverOptions: ServerOptions = {
    run: { command: serverName, args: ['--stdio'] },
    debug: { command: serverName, args: ['--stdio'], options: { env: 'LPIC_LOG_LEVEL=0' } }
  }

  const clientOptions: LanguageClientOptions =  {
    documentSelector: [ CONTEXT_FILE, CONTEXT_UNTITLED ],
    outputChannelName: 'ConTeXt'
  }

  client = new TexLanguageClient(serverName, serverOptions, clientOptions)

  const icon = new StatusIcon()

  thingsToDispose.push(
    vscode.commands.registerTextEditorCommand('context.build', editor =>
      build(editor, client),
    ),
    vscode.commands.registerCommand('context.build.cancel', () =>
      client.sendNotification(WorkDoneProgressCancelNotification.type, {
        token: 'context-build-*',
      }),
    ),
    client.onDidChangeState(({ newState }) => {
      icon.update(newState)
    }),
    client,
    icon,
  )

  client.start()
}

export async function deactivate() {
  if (client) {
    client.stop();
  }
  thingsToDispose.forEach( (aDisposableThing) => 
    aDisposableThing.dispose()
  )
}

async function build(
  { document }: vscode.TextEditor,
  client: TexLanguageClient,
): Promise<void> {
  if (
    vscode.languages.match([CONTEXT_FILE], document) <=
      0 ||
    (document.isDirty && !(await document.save()))
  ) {
    return
  }

  const result = await client.build(document)
  switch (result.status) {
    case BuildStatus.Success:
    case BuildStatus.Cancelled:
      break
    case BuildStatus.Error:
      vscode.window.showErrorMessage(Messages.BUILD_ERROR)
      break
    case BuildStatus.Failure:
      vscode.window.showErrorMessage(Messages.BUILD_FAILURE)
      break
  }
}
