import * as vscode from 'vscode';
import * as mdplantlibapi from "./mdplantlibapi"

export class GanttViewProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'GanttDiagram';

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

	public getLineContent(activeEditor: vscode.TextEditor) {
		let line = activeEditor.selection.active.line
        let range = new vscode.Range(activeEditor.document.lineAt(line).range.start, activeEditor.document.lineAt(line).range.end)
		let lineText = activeEditor.document.getText(range).replace(/\t/g, "    ")

		console.log("line text: " + lineText)

		return lineText
	}

	public doStartGantt(activeEditor: vscode.TextEditor, line: string) {
		console.log("doStartGantt")

		let output: string[] = []

		/**
		 * ```plantuml
		 * @startgantt
		 * 
		 * 
		 * 
		 * @endgantt
		 * ```
		 */
		let date = new Date()

		output.push("```plantuml")
		output.push("@startgantt")
		output.push("")
		output.push("saturday are closed")
		output.push("sunday are closed")
		output.push("Project starts the 1st of " + date.toLocaleString('en-US', { month: 'long' }) + " " + date.getFullYear())
		output.push("")
		output.push("[mdplant] starts " + date.getFullYear() + "-" + (date.getMonth() + 1) + "-4 and ends " + date.getFullYear() + "-" + (date.getMonth() + 1) + "-25")
		output.push("")
		output.push("@endgantt")
		output.push("```")

		return output
	}

	public doShortName(activeEditor: vscode.TextEditor, line: string) {
		console.log("doShortName")

		let output: string[] = []

		if (line.length > 0) {
			let regex = new RegExp("(\\s*)([^\\s].+)\\s+([^\\s]+)")
			let matchValue = regex.exec(line.trimRight())
			// console.log(matchValue)
			if (matchValue != null) {
				// output.push("[Prototype design] as [D]")
				output.push(matchValue[1] + "[" + matchValue[2] + "] as [" + matchValue[3] + "]")
			}
		}

		return output
	}

	public doProjectStarts(activeEditor: vscode.TextEditor, line: string) {
		console.log("doProjectStarts")

		let output: string[] = []

		if (line.length > 0) {
			let regex = new RegExp("(\\s*)(\\d{4}-\\d{1,2}-\\d{1,2})")
			let matchValue = regex.exec(line.trimRight().replace(/\./g, "-"))
			// console.log(matchValue)
			if (matchValue != null) {
				// output.push("Project starts 2020-07-01")
				output.push(matchValue[1] + "Project starts " + matchValue[2])
			}
		}

		return output
	}

	public doWorkRequires(activeEditor: vscode.TextEditor, line: string) {
		console.log("doWorkRequires")

		let output: string[] = []

		if (line.length > 0) {
			let regex = new RegExp("(\\s*)([^\\s].+)\\s+(\\d+)")
			let matchValue = regex.exec(line.trimRight().replace(/\./g, "-"))
			// console.log(matchValue)
			if (matchValue != null) {
				// output.push("[T2 (5 days)] requires 5 days")
				output.push(matchValue[1] + "[" + matchValue[2] + "] requires " + matchValue[3] + " days")
			}
		}

		return output
	}

	public doStarts(activeEditor: vscode.TextEditor, line: string) {
		console.log("doStarts")

		let output: string[] = []

		if (line.length > 0) {
			let regex = new RegExp("(\\s*)([^\\s].+)\\s+(\\d{4}-\\d{1,2}-\\d{1,2})")
			let matchValue = regex.exec(line.trimRight().replace(/\./g, "-"))
			// console.log(matchValue)
			if (matchValue != null) {
				// output.push("[Prototype design] starts 2020-07-01")
				output.push(matchValue[1] + "[" + matchValue[2] + "] starts " + matchValue[3])
			}
		}

		return output
	}

	public doEnds(activeEditor: vscode.TextEditor, line: string) {
		console.log("doEnds")

		let output: string[] = []

		if (line.length > 0) {
			let regex = new RegExp("(\\s*)([^\\s].+)\\s+(\\d{4}-\\d{1,2}-\\d{1,2})")
			let matchValue = regex.exec(line.trimRight().replace(/\./g, "-"))
			// console.log(matchValue)
			if (matchValue != null) {
				// output.push("[Prototype design] ends 2020-07-01")
				output.push(matchValue[1] + "[" + matchValue[2] + "] ends " + matchValue[3])
			}
		}

		return output
	}

	public doStartsEnds(activeEditor: vscode.TextEditor, line: string) {
		console.log("doStartsEnds")

		let output: string[] = []

		if (line.length > 0) {
			let regex = new RegExp("(\\s*)([^\\s].+)\\s+(\\d{4}-\\d{1,2}-\\d{1,2})\\s+(\\d{4}-\\d{1,2}-\\d{1,2})")
			let matchValue = regex.exec(line.trimRight().replace(/\./g, "-"))
			// console.log(matchValue)
			if (matchValue != null) {
				// output.push("[Prototype design] starts 2020-07-01 and ends 2020-07-15")
				output.push(matchValue[1] + "[" + matchValue[2] + "] starts " + matchValue[3] + " and ends " + matchValue[4])
			}
		}

		return output
	}

	public doStartsAt(activeEditor: vscode.TextEditor, line: string) {
		console.log("doStartsAt")

		let output: string[] = []

		if (line.length > 0) {
			let regex = new RegExp("(\\s*)([^\\s].+)\\s+([^\\s].+)")
			let matchValue = regex.exec(line.trimRight().replace(/\./g, "-"))
			// console.log(matchValue)
			if (matchValue != null) {
				// output.push("[Test prototype] starts at [Prototype design]'s end")
				output.push(matchValue[1] + "[" + matchValue[2] + "] starts at [" + matchValue[3] + "]'s end")
			}
		}

		return output
	}

	public doCompleted(activeEditor: vscode.TextEditor, line: string) {
		console.log("doCompleted")

		let output: string[] = []

		if (line.length > 0) {
			let regex = new RegExp("(\\s*)([^\\s].+)\\s+(\\d{1,3})")
			let matchValue = regex.exec(line.trimRight().replace(/\./g, "-"))
			// console.log(matchValue)
			if (matchValue != null) {
				// output.push("[foo] is 40% completed")
				output.push(matchValue[1] + "[" + matchValue[2] + "] is " + matchValue[3] + "% completed")
			}
		}

		return output
	}

	public doIds(id: string) {
		/**
		 * "shortName",
		 * "projectStarts",
		 * "workRequires",
		 * "starts",
		 * "ends",
		 * "startsEnds",
		 * "startsAt",
		 * "completed"
		 */
		let idsMaps = {
			"startGantt": this.doStartGantt,
			"shortName": this.doShortName,
			"projectStarts": this.doProjectStarts,
			"workRequires": this.doWorkRequires,
			"starts": this.doStarts,
			"ends": this.doEnds,
			"startsEnds": this.doStartsEnds,
			"startsAt": this.doStartsAt,
			"completed": this.doCompleted
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
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'assets/media', 'gantt.js'));

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
				<button class="add-color-button" id="startGantt">start gantt</button>
				<button class="add-color-button" id="shortName">short name</button>
				<button class="add-color-button" id="projectStarts">project starts</button>
				<button class="add-color-button" id="workRequires">work requires</button>
				<button class="add-color-button" id="starts">starts</button>
				<button class="add-color-button" id="ends">ends</button>
				<button class="add-color-button" id="startsEnds">starts ends</button>
				<button class="add-color-button" id="startsAt">starts at</button>
				<button class="add-color-button" id="completed">completed</button>

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
