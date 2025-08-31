import * as vscode from 'vscode';
import * as mdplantlibapi from "../../mdplantlibapi"
import * as path from 'path'

export class ClassViewProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'ClassDiagram';
	private linkFrom: string[] = []

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

	public updateCodeBlockContent(activeEditor: vscode.TextEditor, textBlock: any) {
		activeEditor.edit(edit => {
			let range = new vscode.Range(activeEditor.document.lineAt(textBlock.codeStart).range.start, activeEditor.document.lineAt(textBlock.codeEnd).range.end)

			if (textBlock.codeBlock.length > 0)
				edit.replace(range, textBlock.codeBlock.join("\n"))
		}).then(value => {
			mdplantlibapi.cursor(activeEditor, textBlock.cursor)
		})
	}

	public appendContent(activeEditor: vscode.TextEditor, line: any) {
		console.log("appendContent")
		activeEditor.edit(edit => {
			let range = new vscode.Range(activeEditor.document.lineAt(activeEditor.document.lineCount - 1).range.end, activeEditor.document.lineAt(activeEditor.document.lineCount - 1).range.end)

			if (line.length > 0)
				edit.replace(range, line + "\n")
		})
	}

	public doStartStruct(activeEditor: vscode.TextEditor, line: any) {
		console.log("doStartStruct")

		if (line.length > 0)
			return []

		let output = [
			"```plantuml",
			"@startuml",
			"",
			"struct platform_device {",
			"	const char	*name;",
			"	int		id;",
			"	bool		id_auto;",
			"	struct device	dev;",
			"	u64		platform_dma_mask;",
			"	struct device_dma_parameters dma_parms;",
			"	u32		num_resources;",
			"	struct resource	*resource;",
			"",
			"	const struct platform_device_id	*id_entry;",
			"	/*",
			"	 * Driver name to force a match.  Do not set directly, because core",
			"	 * frees it.  Use driver_set_override() to set or clear it.",
			"	 */",
			"	const char *driver_override;",
			"",
			"	/* MFD cell pointer */",
			"	struct mfd_cell *mfd_cell;",
			"",
			"	/* arch specific additions */",
			"	struct pdev_archdata	archdata;",
			"};",
			"",
			"struct device {",
			"	struct kobject kobj;",
			"	struct device		*parent;",
			"",
			"	struct device_private	*p;",
			"",
			"	const char		*init_name; /* initial name of the device */",
			"	const struct device_type *type;",
			"",
			"	const struct bus_type	*bus;	/* type of bus device is on */",
			"	struct device_driver *driver;	/* which driver has allocated this",
			"					   device */",
			"	void		*platform_data;	/* Platform specific data, device",
			"					   core doesn't touch it */",
			"	void		*driver_data;	/* Driver data, set and get with",
			"					   dev_set_drvdata/dev_get_drvdata */",
			"	struct mutex		mutex;	/* mutex to synchronize calls to",
			"					 * its driver.",
			"					 */",
			"",
			"	struct dev_links_info	links;",
			"	struct dev_pm_info	power;",
			"	struct dev_pm_domain	*pm_domain;",
			"",
			"#ifdef CONFIG_ENERGY_MODEL",
			"	struct em_perf_domain	*em_pd;",
			"#endif",
			"",
			"#ifdef CONFIG_PINCTRL",
			"	struct dev_pin_info	*pins;",
			"#endif",
			"}",
			"",
			"",
			"",
			"@enduml",
			"```"
		]

		return output
	}

	public doArrowTo(activeEditor: vscode.TextEditor, line: any) {
		console.log("doArrowTo")

		let output: string[] = []

		if (line.length > 0) {
			let regex = new RegExp("(\\s*)([^\\s]+)\\s+([^\\s]+)\\s+(.*)")
			let matchValue = regex.exec(line.trimRight())
			// console.log(matchValue)
			if (matchValue != null) {
				output.push(matchValue[1] + matchValue[2] + " --> " + matchValue[3] + ": " + matchValue[4])
			} else {
				regex = new RegExp("(\\s*)([^\\s]+)\\s+(.*)")
				matchValue = regex.exec(line.trimRight())
				// console.log(matchValue)
				if (matchValue != null) {
					output.push(matchValue[1] + matchValue[2] + " --> " + matchValue[3])
				}
			}
		}

		return output
	}

	public doNoteLeft(activeEditor: vscode.TextEditor, line: any) {
		console.log("doNoteLeft")

		let output: string[] = []

		if (line.length >= 0) {
			let regex = new RegExp("(\\s*)([^\\s].*)")
			let matchValue = regex.exec(line.trimRight())
			// console.log(matchValue)
			if (matchValue != null) {
				output.push(matchValue[1] + "note left of "+ matchValue[2])
				output.push(matchValue[1] + "" )
				output.push(matchValue[1] + "end note")
			}
		}

		return output
	}

	public doNoteRight(activeEditor: vscode.TextEditor, line: any) {
		console.log("doNoteRight")

		let output: string[] = []

		if (line.length >= 0) {
			let regex = new RegExp("(\\s*)([^\\s].*)")
			let matchValue = regex.exec(line.trimRight())
			// console.log(matchValue)
			if (matchValue != null) {
				output.push(matchValue[1] + "note right of " + matchValue[2])
				output.push(matchValue[1] + "")
				output.push(matchValue[1] + "end note")
			}
		}

		return output
	}

	public doTrimStruct(activeEditor: vscode.TextEditor, textBlock: any) {
		console.log("doTrimStruct")

		let codeBlock = []
		let ifdef = false
		let codeComments = false
		let funcBlock = false
		let funcBlocks = []
		let i = 1

		codeBlock.push(textBlock.codeBlock[0])
		for (; i < textBlock.codeBlock.length - 1; i++) {
			let line = textBlock.codeBlock[i]
			// console.log(line)

			let regexPrefix = new RegExp("^(\\s*).*")
			let matchValue = regexPrefix.exec(line.trimRight())
			// console.log(matchValue)
			let linePrefixSpace = ""
			if (matchValue != null) {
				linePrefixSpace = matchValue[1]
			}

			if (line.trim().length == 0)
				continue

			if ((line.indexOf("#ifdef") != -1) || (line.indexOf("#if defined") != -1)) {
				ifdef = true
				continue
			}
			if (line.indexOf("#endif") != -1) {
				ifdef = false
				continue
			}
			if (ifdef)
				continue

			if (line.indexOf("//") != -1) {
				let data = line.split("//")[0].trim()
				if (data.length > 0)
					codeBlock.push(linePrefixSpace + data.replace(/\s+/g, " "))

				continue
			}

			if ((line.indexOf("/*") != -1) && (line.indexOf("*/") != -1)) {
				let data = line.split("/*")[0].trim()
				if (data.length > 0)
					codeBlock.push(linePrefixSpace + data.replace(/\s+/g, " "))

				continue
			}

			if (line.indexOf("/*") != -1) {
				codeComments = true
				continue
			}
			if (line.indexOf("*/") != -1) {
				codeComments = false
				continue
			}
			if (codeComments)
				continue

			if (line.indexOf("ANDROID_KABI_RESERVE") != -1)
				continue

			if (!funcBlock && (line.indexOf(")(") != -1) && (line.trimRight().substr(-2) != ");")) {
				funcBlock = true
				funcBlocks.push(line)
				continue
			}
			if (funcBlock && line.trimRight().substr(-2) == ");") {
				funcBlocks.push(line)
				codeBlock.push(linePrefixSpace + funcBlocks.join(" ").trim().replace(/\s+/g, " "))

				funcBlock = false
				funcBlocks = []
				continue
			}
			if (funcBlock) {
				funcBlocks.push(line)
				continue
			}

			codeBlock.push(linePrefixSpace + line.trim().replace(/\s+/g, " "))
		}

		codeBlock.push(textBlock.codeBlock[i].split(";")[0].trimRight())

		textBlock.codeBlock = codeBlock

		return textBlock
	}

	public doLinkStruct(activeEditor: vscode.TextEditor, textBlock: any) {
		console.log("doLinkStruct")

		let lineOffset = textBlock.cursor - textBlock.codeStart
		let line = textBlock.codeBlock[lineOffset]
		console.log(line)

		let regexSrc = new RegExp("\\s*(class|struct)\\s*([^\\s]+)\\s+([^\\s]+)?")
		let regexSnk = new RegExp("\\s*(const\\s*)?(class|struct)\\s*([^\\s]+)\\s+\\*?([^\\s;\\*]+);?")
		let matchValueSrc = regexSrc.exec(textBlock.codeBlock[0])
		let matchValueSnk = regexSnk.exec(line.trimRight())
		console.log(matchValueSrc)
		console.log(matchValueSnk)
		if (matchValueSrc != null && matchValueSnk != null) {
			return matchValueSrc[2] + "::" + matchValueSnk[4] + " --> " + matchValueSnk[3]
		}

		return ""
	}

	public doLinkStructProperty(activeEditor: vscode.TextEditor, textBlock: any, status: number = 0) {
		console.log("doLinkStructProperty")

		let lineOffset = textBlock.cursor - textBlock.codeStart
		let line = textBlock.codeBlock[lineOffset]
		console.log(line)

		let regexSrc = new RegExp("\\s*(struct|class)\\s*([^\\s]+)\\s+([^\\s]+)?")
		let regexSnkFunc = new RegExp("\\s*(.*)\\(\\*([^\\s;\\*]+)\\)\\(.*\\);")

		let matchValueSrc = regexSrc.exec(textBlock.codeBlock[0])
		let matchValueSnkFunc = regexSnkFunc.exec(line.trimRight())
		console.log(matchValueSrc)
		console.log(matchValueSnkFunc)

		if (matchValueSrc != null && matchValueSnkFunc != null) {
			return [matchValueSrc[2], matchValueSnkFunc[2], undefined]
		}

		let regexSnk = new RegExp("\\s*(const\\s*)?((struct|class)\\s*)?([^\\s]+)\\s+\\*?([^\\s;\\*\\(\\))]+);?")
		let matchValueSnk = regexSnk.exec(line.trimRight())
		console.log(matchValueSnk)

		if (matchValueSrc != null && matchValueSnk != null) {
			return [matchValueSrc[2], matchValueSnk[5], matchValueSnk[4]]
		}

		return []
	}

	public doIds(id: string, status: number) {
		let idsMaps = {
			'startStruct': {
				"type": "line",
				"func": this.doStartStruct
			},
			'arrowTo': {
				"type": "line",
				"func": this.doArrowTo,
			},
			'noteLeft': {
				"type": "line",
				"func": this.doNoteLeft,
			},
			'noteRight': {
				"type": "line",
				"func": this.doNoteRight,
			},
			'trimStruct': {
				"type": "block",
				"func": this.doTrimStruct,
			},
			'linkStruct': {
				"type": "block",
				"func": this.doLinkStruct,
			},
			'linkStructProperty': {
				"type": "block",
				"func": this.doLinkStructProperty,
			},
		}

		const activeEditor = vscode.window.activeTextEditor
		if (activeEditor) {
			let fileExt = path.extname(activeEditor.document.fileName)
			for (const [key, value] of Object.entries(idsMaps)) {
				if (key == id) {
					if (value.type == "line") {
						let lineContent = this.getLineContent(activeEditor)
						this.updateContent(activeEditor, value.func(activeEditor, lineContent))

						return
					} else if (value.type == "block") {
						if (key == "trimStruct") {
							let structBlock = mdplantlibapi.getStructBlock(activeEditor)
							console.log(structBlock)

							if (structBlock.codeStart == -1 || structBlock.codeEnd == -1)
								return

							value.func(activeEditor, structBlock)

							console.log(structBlock)
							this.updateCodeBlockContent(activeEditor, structBlock)

							return
						}

						if (key == "linkStruct") {
							let structBlock = mdplantlibapi.getStructBlock(activeEditor, false)
							console.log(structBlock)

							if (structBlock.codeStart == -1 || structBlock.codeEnd == -1)
								return

							let connectValue = value.func(activeEditor, structBlock)
							if (connectValue.length > 0) {
								if (fileExt == ".plantuml" || fileExt == ".puml") {
									this.appendContent(activeEditor, connectValue)
								} else {
									let line = activeEditor.selection.active.line
									let textBlock = mdplantlibapi.getTextBlock(activeEditor, line, true)
									textBlock.codeBlock.splice((textBlock.codeBlock.length - 2), 0, connectValue)
									this.updateCodeBlockContent(activeEditor, textBlock)
								}
							}

							return
						}

						if (key == "linkStructProperty") {

							let structBlock = mdplantlibapi.getStructBlock(activeEditor, false)
							console.log(structBlock)

							if (structBlock.codeStart == -1 || structBlock.codeEnd == -1) {
								this.linkFrom = []
								return
							}

							if (status == 0) {
								this.linkFrom = value.func(activeEditor, structBlock, status)
								console.log(this.linkFrom)
							} else if (status == 1) {
								if (this.linkFrom.length == 0)
									return

								let linkTo = value.func(activeEditor, structBlock, status)
								console.log(linkTo)

								// if ((linkTo.length != 0) && (linkTo[2] == undefined || this.linkFrom[2] == undefined || this.linkFrom[2] == linkTo[0])) {
								if (linkTo.length != 0) {
									let connectValue = this.linkFrom[0] + "::" + this.linkFrom[1] + " --> " + linkTo[0] + "::" + linkTo[1]

									if (fileExt == ".plantuml" || fileExt == ".puml") {
										this.appendContent(activeEditor, connectValue)
									} else {
										let line = activeEditor.selection.active.line
										let textBlock = mdplantlibapi.getTextBlock(activeEditor, line, true)
										textBlock.codeBlock.splice((textBlock.codeBlock.length - 2), 0, connectValue)
										this.updateCodeBlockContent(activeEditor, textBlock)
									}
								}
							}

							return
						}
					}
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

						this.doIds(data.value, data.status)
						break;
					}
			}
		});
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		// Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'assets/media', 'class.js'));

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
					<legend align="center">struct</legend>
					<button class="add-color-button add-color-button-line" id="startStruct">struct template</button>
					<button class="add-color-button" id="trimStruct">trim struct</button>
					<button class="add-color-button" id="linkStruct">link struct</button>
					<button class="add-color-button" id="linkStructProperty">link struct property</button>
					<button class="add-color-button" id="linkStructPropertyCancel">cancel link</button>
				</fieldset>
				<fieldset>
					<legend align="center">other</legend>
					<button class="add-color-button" id="noteLeft">note left</button>
					<button class="add-color-button" id="noteRight">note right</button>
					<button class="add-color-button" id="arrowTo">A --> B</button>
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
