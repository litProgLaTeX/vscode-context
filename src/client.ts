import * as vscode from 'vscode'
import {
  LanguageClient,
  RequestType,
  TextDocumentIdentifier,
} from 'vscode-languageclient/node'

export enum BuildStatus {
  /**
   * The build process terminated without any errors.
   */
  Success = 0,

  /**
   * The build process terminated with errors.
   */
  Error = 1,

  /**
   * The build process failed to start or crashed.
   */
  Failure = 2,

  /**
   * The build process was cancelled.
   */
  Cancelled = 3,
}

export interface BuildResult {
  /**
   * The status of the build process.
   */
  status: BuildStatus
}

interface BuildTextDocumentParams {
  /**
   * The text document to build.
   */
  textDocument: TextDocumentIdentifier
}

abstract class BuildTextDocumentRequest {
  public static type = new RequestType<
    BuildTextDocumentParams,
    BuildResult,
    void
  >('textDocument/build')
}

export class TexLanguageClient extends LanguageClient {
  public async build(document: vscode.TextDocument): Promise<BuildResult> {
    const params: BuildTextDocumentParams = {
      textDocument: this.code2ProtocolConverter.asTextDocumentIdentifier(
        document,
      ),
    }

    return this.sendRequest(BuildTextDocumentRequest.type, params)
  }

}
