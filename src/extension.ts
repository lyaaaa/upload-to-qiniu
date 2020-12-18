// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'
import { upImageToQiniu } from './util/upload'
import { getHoverHttpLink, translateImageUrlToBase64 } from './util/handleHover'

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let texteditor = vscode.commands.registerTextEditorCommand(
    'extension.choosedImage',
    async (textEditor, edit, args) => {
      const qiniuConfig = vscode.workspace.getConfiguration('upload_qiniu_config')
      const uri = await vscode.window.showOpenDialog({
        canSelectFolders: false,
        canSelectMany: false,
        filters: {
          images: ['png', 'jpg'],
        },
      })
      if (!uri) {
        return
      }
      const upConfig = {
        accessKey: qiniuConfig.accessKey,
        secretKey: qiniuConfig.secretKey,
        domain: qiniuConfig.domain,
        gzip: qiniuConfig.gzip,
        scope: qiniuConfig.scope,
      }
      vscode.window.showInformationMessage(`uri: ${uri}, ${JSON.stringify(uri)}`)
      vscode.window.showInformationMessage(`uri[0]: ${JSON.stringify(uri[0])}`)
      vscode.window.showInformationMessage(`uri[0]path: ${JSON.stringify(uri[0].path)}`)
      console.log('uri', uri)
      const loaclFile = uri[0].fsPath
      upImageToQiniu(
        loaclFile,
        (res: string) => {
          let url = res
          // 将图片链接写入编辑器
          addImageUrlToEditor(url)
        },
        upConfig
      )
    }
  )

  // 鼠标悬浮预览图片
  vscode.languages.registerHoverProvider('*', {
    async provideHover(document, position) {
      try {
        const { character } = position
        // 当前行的文本内容
        const currentLineText = document.lineAt(position).text
        // 匹配当前行内
        const httpLink = getHoverHttpLink(currentLineText, character)
        var strToBase64 = await translateImageUrlToBase64(httpLink)
        const markString = strToBase64 ? new vscode.MarkdownString(`![](${strToBase64})`, true) : ''
        return {
          contents: [markString],
        }
      } catch (err) {
        console.log('error', err)
      }
    },
  })
  context.subscriptions.push(texteditor)
}

// 将图片链接写入编辑器
function addImageUrlToEditor(url: string) {
  let editor = vscode.window.activeTextEditor
  if (!editor) {
    return
  }
  // 替换内容
  const selection = editor.selection
  editor.edit((editBuilder) => {
    editBuilder.replace(selection, url)
  })
}

// this method is called when your extension is deactivated
export function deactivate() {}
