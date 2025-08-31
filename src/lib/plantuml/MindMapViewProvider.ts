import * as vscode from 'vscode';
import * as mdplantlibapi from "../../mdplantlibapi"

export class MindMapViewProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'MindMapDiagram';

	private _view?: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri,
	) { }

	public updateContent(activeEditor: vscode.TextEditor, content: string[]) {
		let line = activeEditor.selection.active.line

		if (content == null || content == undefined || content.length == 0)
			return

		activeEditor.edit(edit => {
			let range = new vscode.Range(activeEditor.document.lineAt(line).range.start, activeEditor.document.lineAt(line).range.end)

			if (content.length > 0)
				edit.replace(range, content.join("\n"))
		}).then(value => {
			mdplantlibapi.cursor(activeEditor, line)
		})
	}

	public updateCodeBlockContent(activeEditor: vscode.TextEditor, textBlock: any) {
		activeEditor.edit(edit => {
			let range = new vscode.Range(activeEditor.document.lineAt(textBlock.codeStart).range.start, activeEditor.document.lineAt(textBlock.codeEnd).range.end)

			if (textBlock.codeBlock.length > 0)
				edit.replace(range, textBlock.codeBlock.join("\n"))
		}).then(value => {
			mdplantlibapi.cursor(activeEditor, textBlock.cursor)
		})
	}

	public getLineContent(activeEditor: vscode.TextEditor) {
		let line = activeEditor.selection.active.line
		let range = new vscode.Range(activeEditor.document.lineAt(line).range.start, activeEditor.document.lineAt(line).range.end)
		let lineText = activeEditor.document.getText(range).replace(/\t/g, "    ")

		console.log("line text: " + lineText)

		return lineText
	}

	public doStartMindmap(activeEditor: vscode.TextEditor, line: string) {
		console.log("doStartMindmap")

		if (line.length > 0)
			return []

		let output = [
			"```plantuml",
			"@startmindmap",
			"* root node",
			"  * some first level node",
			"    * second level node",
			"    * another second level node",
			"  * another first level node",
			"@endmindmap",
			"```"
		]

		return output
	}

	public doMindmap(activeEditor: vscode.TextEditor, textBlock: any) {
		console.log("doMindmap")

		let codeBlock = textBlock.codeBlock
		let preIndex = codeBlock[0].split("```")[0]
		if (!codeBlock[0].includes("plantuml")) {
			codeBlock[0] = preIndex + "```plantuml"
		}
		codeBlock.splice((codeBlock.length - 1), 0, preIndex + "@endmindmap")
		codeBlock.splice(1, 0, preIndex + "@startmindmap")

		return textBlock
	}

	public doIds(id: string) {
		let idsMaps = {
			'startmindmap': this.doStartMindmap,
			'mindmap': this.doMindmap,
		}

		const activeEditor = vscode.window.activeTextEditor
		if (activeEditor) {
			for (const [key, value] of Object.entries(idsMaps)) {
				if (key == id) {
					let line = activeEditor.selection.active.line
					let textBlock = mdplantlibapi.getTextBlock(activeEditor, line, true)
					let startLine = textBlock.start
					let textBlockInfo = mdplantlibapi.parseTextBlock(textBlock.textBlock, mdplantlibapi.getRootPath(activeEditor), line - startLine)
					console.log(textBlockInfo)

					if (textBlockInfo.status && textBlockInfo.type == mdplantlibapi.projectTextBlockTypeEnum.indent) {
						this.doMindmap(activeEditor, textBlock)

						console.log(textBlock)
						this.updateCodeBlockContent(activeEditor, textBlock)

						return
					}


					let lineContent = this.getLineContent(activeEditor)
					this.updateContent(activeEditor, value(activeEditor, lineContent))

					return
				}
			}
		}
	}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [
				this._extensionUri
			]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(data => {
			switch (data.type) {
				case 'functionSelected':
					{
						console.log("function: " + data.value)

						this.doIds(data.value)
						break;
					}
			}
		});
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		// Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'assets/media', 'mindmap.js'));

		// Do the same for the stylesheet.
		const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'assets/media', 'reset.css'));
		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'assets/media', 'vscode.css'));
		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'assets/media', 'main.css'));

		// Use a nonce to only allow a specific script to be run.
		const nonce = getNonce();

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading styles from our extension directory,
					and only allow scripts that have a specific nonce.
					(See the 'webview-sample' extension sample for img-src content security policy examples)
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">

				<title>PlantUML Tools</title>
			</head>
			<body>
				<button class="add-color-button add-color-button-line" id="startmindmap">mindmap template</button>
				<button class="add-color-button add-color-button-line" id="mindmap">mindmap list</button>

				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
