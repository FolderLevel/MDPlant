import * as vscode from 'vscode';
import * as mdplantlibapi from "../../mdplantlibapi"

export class SequenceViewProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'SequenceDiagram';

	private _view?: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri,
	) { }

	public updateContent(activeEditor: vscode.TextEditor, content: string[]) {
		let line = activeEditor.selection.active.line

		if (content == null || content == undefined || content.length == 0)
			return

		activeEditor.edit(edit => {
			let selection = activeEditor.selection
			let range = undefined
			if (selection.start.line == selection.end.line) {
				range = new vscode.Range(activeEditor.document.lineAt(selection.active.line).range.start, activeEditor.document.lineAt(selection.active.line).range.end)
			} else {
				range = new vscode.Range(activeEditor.document.lineAt(selection.start.line).range.start, activeEditor.document.lineAt(selection.end.line).range.end)
			}

			if (content.length > 0)
				edit.replace(range, content.join("\n"))
		}).then(value => {
			mdplantlibapi.cursor(activeEditor, line)
		})
	}

	public getLineContent(activeEditor: vscode.TextEditor) {
		let selection = activeEditor.selection
		let lineText = ""
		if (selection.start.line == selection.end.line) {
			let line = selection.active.line
			let range = new vscode.Range(activeEditor.document.lineAt(line).range.start, activeEditor.document.lineAt(line).range.end)
			lineText = activeEditor.document.getText(range).replace(/\t/g, "    ")
		} else {
			let selectionRange = new vscode.Range(activeEditor.document.lineAt(selection.start.line).range.start, activeEditor.document.lineAt(selection.end.line).range.end)
			lineText = activeEditor.document.getText(selectionRange)
		}

		console.log("line text: " + lineText)

		return lineText
	}

	public doStartuml(activeEditor: vscode.TextEditor, line: string) {
		console.log("doStartuml")

		let output = [
			"```plantuml",
			"@startuml",
			"'",
			"' The message is not displayed",
			"'",
			"",
			"title Example Title",
			"",
			"skinparam backgroundColor #EEEBDC",
			"",
			"",
			"",
			"@enduml",
			"```"
		]

		return output
	}

	public doAtoB(activeEditor: vscode.TextEditor, line: string) {
		console.log("doAtoB")

		let output: string[] = []

		if (line.length > 0) {
			let regex = new RegExp("(\\s*)([^\\s]+)\\s+([^\\s]+)\\s+(.*)")
			let matchValue = regex.exec(line.trimRight())
			// console.log(matchValue)
			if (matchValue != null) {
				// output.push("A -> B: text")
				output.push(matchValue[1] + matchValue[2] + " -> " + matchValue[3] + ": " + matchValue[4])
			} else {
				regex = new RegExp("(\\s*)([^\\s]+)\\s+(.*)")
				matchValue = regex.exec(line.trimRight())
				// console.log(matchValue)
				if (matchValue != null) {
					// output.push("A -> B: text")
					output.push(matchValue[1] + matchValue[2] + " -> " + matchValue[2] + ": " + matchValue[3])
				}
			}
		}

		return output
	}

	public doAtoBPlus(activeEditor: vscode.TextEditor, line: string) {
		console.log("doAtoB")

		let output: string[] = []

		if (line.length > 0) {
			let regex = new RegExp("(\\s*)([^\\s]+)\\s+([^\\s]+)\\s+(.*)")
			let matchValue = regex.exec(line.trimRight())
			// console.log(matchValue)
			if (matchValue != null) {
				// output.push("A -> B: text")
				output.push(matchValue[1] + matchValue[2] + " -> " + matchValue[3] + " ++: " + matchValue[4])
			} else {
				regex = new RegExp("(\\s*)([^\\s]+)\\s+(.*)")
				matchValue = regex.exec(line.trimRight())
				// console.log(matchValue)
				if (matchValue != null) {
					// output.push("A -> B: text")
					output.push(matchValue[1] + matchValue[2] + " -> " + matchValue[2] + " ++: " + matchValue[3])
				}
			}
		}

		return output
	}

	public doBtoA(activeEditor: vscode.TextEditor, line: string) {
		console.log("doBtoA")

		let output: string[] = []

		if (line.length > 0) {
			let regex = new RegExp("(\\s*)([^\\s]+)\\s+([^\\s]+)\\s+(.*)")
			let matchValue = regex.exec(line.trimRight())
			// console.log(matchValue)
			if (matchValue != null) {
				// output.push("A <- B: text")
				output.push(matchValue[1] + matchValue[2] + " <- " + matchValue[3] + ": " + matchValue[4])
			} else {
				regex = new RegExp("(\\s*)([^\\s]+)\\s+(.*)")
				matchValue = regex.exec(line.trimRight())
				// console.log(matchValue)
				if (matchValue != null) {
					// output.push("A <- B: text")
					output.push(matchValue[1] + matchValue[2] + " <- " + matchValue[2] + ": " + matchValue[3])
				}
			}
		}

		return output
	}

	public doBDashToA(activeEditor: vscode.TextEditor, line: string) {
		console.log("doBDashToA")

		let output: string[] = []

		if (line.length > 0) {
			let regex = new RegExp("(\\s*)([^\\s]+)\\s+([^\\s]+)\\s+(.*)")
			let matchValue = regex.exec(line.trimRight())
			// console.log(matchValue)
			if (matchValue != null) {
				// output.push("A --> B: text")
				output.push(matchValue[1] + matchValue[2] + " <-- " + matchValue[3] + ": " + matchValue[4])
			} else {
				regex = new RegExp("(\\s*)([^\\s]+)\\s+(.*)")
				matchValue = regex.exec(line.trimRight())
				// console.log(matchValue)
				if (matchValue != null) {
					// output.push("A --> B: text")
					output.push(matchValue[1] + matchValue[2] + " <-- " + matchValue[2] + ": " + matchValue[3])
				}
			}
		}

		return output
	}

	public doAtoBAndDashToA(activeEditor: vscode.TextEditor, line: string) {
		console.log("doAtoBAndDashToA")

		let output: string[] = []

		if (line.length > 0) {
			let regex = new RegExp("(\\s*)([^\\s]+)\\s+([^\\s]+)\\s+(.*)")
			let matchValue = regex.exec(line.trimRight())
			// console.log(matchValue)
			if (matchValue != null) {
				// output.push("A -> B ++: text")
				// output.push("A <-- B --:")
				output.push(matchValue[1] + matchValue[2] + " -> " + matchValue[3] + " ++: " + matchValue[4])
				output.push(matchValue[1] + matchValue[2] + " <-- " + matchValue[3] + " --:")
			} else {
				regex = new RegExp("(\\s*)([^\\s]+)\\s+(.*)")
				matchValue = regex.exec(line.trimRight())
				// console.log(matchValue)
				if (matchValue != null) {
					// output.push("A -> B ++: text")
					// output.push("A <-- B --:")
					output.push(matchValue[1] + matchValue[2] + " -> " + matchValue[2] + " ++: " + matchValue[3])
					output.push("deactivate " + matchValue[2])
				}
			}
		}

		return output
	}

	public doAltWithAtoB(activeEditor: vscode.TextEditor, line: string) {
		console.log("doAltWithAtoB")

		let output: string[] = []

		if (line.length == 0) {
			output.push("alt text1")
			output.push("    A -> B: text")
			output.push("else text2")
			output.push("    A -> B: text")
			output.push("end")
		}
		
		return output
	}

	public doLoopWithAtoB(activeEditor: vscode.TextEditor, line: string) {
		console.log("doLoopWithAtoB")

		let output: string[] = []

		if (line.length == 0) {
			output.push("loop text")
			output.push("    A -> B: text")
			output.push("end")
		}

		return output
	}

	public doNoteRight(activeEditor: vscode.TextEditor, line: string) {
		console.log("doNoteRight")

		let output: string[] = []

		if (line.length >= 0) {
			let regex = new RegExp("(\\s*)([^\\s].*)")
			let matchValue = regex.exec(line.trimRight())
			// console.log(matchValue)
			if (matchValue != null) {
				output.push(matchValue[1] + "note right: " + matchValue[2])
			}
		}

		return output
	}

	public doNoteBlock(activeEditor: vscode.TextEditor, line: string) {
		console.log("doNoteBlock")

		let output: string[] = []

		if (line.length >= 0) {
			let regex = new RegExp("(\\s*)([^\\s].*)")
			let matchValue = regex.exec(line.trimRight())
			// console.log(matchValue)
			if (matchValue != null) {
				output.push(matchValue[1] + "note right")
				output.push(line)
				output.push(matchValue[1] + "end note")
			}
		}

		return output
	}

	public doIds(id: string) {
		let idsMaps = {
			'startuml': this.doStartuml,
			'AtoB': this.doAtoB,
			'AtoBPlus': this.doAtoBPlus,
			'BtoA': this.doBtoA,
			'BdashToA': this.doBDashToA,
			'AtoBAndDashToA': this.doAtoBAndDashToA,
			'altWithAtoB': this.doAltWithAtoB,
			'loopWithAtoB': this.doLoopWithAtoB,
			'noteRight': this.doNoteRight,
			'noteBlock': this.doNoteBlock,
		}
		const activeEditor = vscode.window.activeTextEditor

		if (activeEditor) {
			for (const [key, value] of Object.entries(idsMaps)) {
				if (key == id) {
					let lineContent = this.getLineContent(activeEditor)
					this.updateContent(activeEditor, value(activeEditor, lineContent))

					break
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
						console.log(data.value)

						this.doIds(data.value)
						break;
					}
			}
		});
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		// Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'assets/media', 'sequence.js'));

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
				<fieldset>
					<legend align="center">sequence</legend>
					<button class="add-color-button add-color-button-line" id="startuml">sequence template</button>
					<button class="add-color-button" id="AtoB">A -> B</button>
					<button class="add-color-button" id="BtoA">A <- B</button>
					<button class="add-color-button" id="AtoBPlus">A ->+ B</button>
					<button class="add-color-button" id="BdashToA">A <-- B</button>
					<button class="add-color-button" id="AtoBAndDashToA">A -> B --> A</button>
					<!--
					<button class="add-color-button" id="altWithAtoB">alt A -> B</button>
					<button class="add-color-button" id="loopWithAtoB">loop A -> B</button>
					-->
				</fieldset>
				<fieldset>
					<legend align="center">note</legend>
					<button class="add-color-button" id="noteRight">note right</button>
					<button class="add-color-button" id="noteBlock">note block</button>
				</fieldset>

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
