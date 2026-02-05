// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'

import * as mdplantlibapi from "./mdplantlibapi"
import * as SequenceVP from "./lib/plantuml/SequenceViewProvider"
import * as GanttVP from "./lib/plantuml/GanttViewProvider"
import * as MindMapVP from "./lib/plantuml/MindMapViewProvider"
import * as WelcomPageVP from "./lib/plantuml/WelcomePageProvider"
import * as ClassVP from "./lib/plantuml/ClassViewProvider"
import { getLastDocInfo } from 'mdplantlib/lib/project'

const logger = new mdplantlibapi.Loggger("mdplant", true)

export function doPlantumlLineShortcut(activeEditor: vscode.TextEditor, lineText:string = "")
{
    var line = activeEditor.selection.active.line
    let textBlock = mdplantlibapi.getTextBlock(activeEditor, line, false)
    let startLine = textBlock.start
    let endLine = textBlock.end
    let contentArray: string[] = textBlock.textBlock
    let plantumlRE = new RegExp("\\s*(plantuml[\\s:]*([\\w\\/]*\\.(puml|plantuml|iuml|pu)?))", "g")
    logger.info(textBlock)
    logger.info("doPlantumlLineShortcut")

    if (lineText.trim().startsWith("plantuml")) {
        let matchValue = plantumlRE.exec(lineText)
        if (matchValue) {
            logger.debug(matchValue[2])
            contentArray = fs.readFileSync(path.join(mdplantlibapi.getRootPath(activeEditor), matchValue[2])).toString().split(/\r?\n/)
            logger.debug(contentArray)

            mdplantlibapi.saveImageFile(activeEditor, imageFileRelativePath => {
                let suffix = mdplantlibapi.getConfig("MDPlant.plantuml.image.suffix", "svg")
                imageFileRelativePath += "." + suffix

                let currentFileDir = mdplantlibapi.getRelativeDir(activeEditor)
                let imageAbsolutePath = mdplantlibapi.getRootPath(activeEditor) + "/" + currentFileDir + "/" + imageFileRelativePath

                mdplantlibapi.getHTTPPlantumlImage(contentArray, suffix, imageAbsolutePath, status => {
                    logger.info("status: " + status + ", path: " + imageAbsolutePath)
                    activeEditor.edit(edit => {
                        let range = new vscode.Range(activeEditor.document.lineAt(startLine).range.start, activeEditor.document.lineAt(endLine).range.end)
                        let rawText = activeEditor.document.getText(range)
                        if (rawText.trim().length != 0) {
                            // edit.delete(range)
                            let spaceString = "<!-- " + lineText + " -->\n" + rawText.match(/^\s*/)
                            edit.replace(range, spaceString + "![" + path.basename(imageFileRelativePath) + "](" + imageFileRelativePath + ")")
                        }
                    }).then(value => {
                        mdplantlibapi.cursor(activeEditor, startLine)
                    })
                })
            })
        }
    }
}

export async function doAuthor(activeEditor: vscode.TextEditor) {
    logger.info("doAuthor")

    var line = activeEditor.selection.active.line
    let textBlock = mdplantlibapi.getTextBlock(activeEditor, line, false)
    let gitAuthor = mdplantlibapi.getGitConfig()

    let startLine = textBlock.start
    let endLine = textBlock.end
    if (startLine > endLine) {
        startLine = textBlock.end
        endLine = textBlock.start
    }

    logger.info(textBlock)

    if (!textBlock.textBlock.join("").includes(gitAuthor["user.name"])
            || !textBlock.textBlock.join("").includes(gitAuthor["user.email"])) {
        let authorInfo = mdplantlibapi.generateAuthorInfo(textBlock.textBlock, gitAuthor)

        logger.info(authorInfo)

        activeEditor.edit(edit => {
            let range = new vscode.Range(activeEditor.document.lineAt(startLine).range.start, activeEditor.document.lineAt(endLine).range.end)
            edit.replace(range, authorInfo.join("\n"))
        }).then(value => {
            mdplantlibapi.cursor(activeEditor, startLine)
        })
    } else {
        logger.info("this author is already exists")
    }
}

export async function doPlantuml(activeEditor: vscode.TextEditor)
{
    var line = activeEditor.selection.active.line
    let textBlock = mdplantlibapi.getTextBlock(activeEditor, line, false)
    let startLine = textBlock.codeStart + 1
    let endLine = textBlock.codeEnd - 1
    let contentArray: string[] = textBlock.codeBlock.slice(1, textBlock.codeBlock.length - 1)
    logger.info("doPlantuml")

    if (contentArray.length > 1) {
        if (contentArray[0].trim().startsWith("* ")) {
            contentArray =  mdplantlibapi.convert2SequenceDiagram(contentArray, startLine)

            let currentEditorFile = activeEditor.document.uri.fsPath
            let editFileName = path.basename(currentEditorFile)
            let currentFileDir = mdplantlibapi.getRelativeDir(activeEditor)

            const indexRE = new RegExp("^\\d{1,4}_.*", "g")
            let filePrefix = ""
            if (indexRE.test(editFileName)) {
                filePrefix = editFileName.split("_")[0] + "_"
            }

            await vscode.window.showInputBox(
            {    // 这个对象中所有参数都是可选参数
                password: false,                           // 输入内容是否是密码
                ignoreFocusOut: true,                      // 默认false，设置为true时鼠标点击别的地方输入框不会消失
                // placeHolder: 'input file name: ',       // 在输入框内的提示信息
                value: filePrefix,
                prompt:'save file name',        // 在输入框下方的提示信息
            }).then(msg => {
                if (msg != undefined && msg.length > 0) {
                    let imageFileRelativePath = ""
                    if (fs.existsSync(mdplantlibapi.getRootPath(activeEditor) + "/" + currentFileDir + "/refers")) {
                        imageFileRelativePath = "refers/" + msg + ".puml"
                    } else {
                        imageFileRelativePath = msg + ".puml"
                    }

                    fs.writeFileSync(mdplantlibapi.getRootPath(activeEditor) + "/" + currentFileDir + "/" + imageFileRelativePath, contentArray.join("\n"))
                }
            })

            return
        }

        let targetFileName = ""

        if ((startLine - 2) >= 0) {
            let range = new vscode.Range(activeEditor.document.lineAt(startLine - 2).range.start, activeEditor.document.lineAt(startLine - 1).range.start)
            let rawText = activeEditor.document.getText(range)
            if (rawText.trim().length != 0) {
                let regex = new RegExp("!\\[(\\d+_.*)\\]\\(.*\\)")
                let matchValue = regex.exec(rawText.trim())
                if (matchValue != null) {
                    targetFileName = matchValue[1]
                }
            }
        }

        let suffix = mdplantlibapi.getConfig("MDPlant.plantuml.image.suffix", "svg")

        if (targetFileName == "") {
            mdplantlibapi.saveImageFile(activeEditor, imageFileRelativePath => {
                imageFileRelativePath += "." + suffix

                let currentFileDir = mdplantlibapi.getRelativeDir(activeEditor)
                let imageAbsolutePath = mdplantlibapi.getRootPath(activeEditor) + "/" + currentFileDir + "/" + imageFileRelativePath

                mdplantlibapi.getHTTPPlantumlImage(contentArray, suffix, imageAbsolutePath, status => {
                    logger.info("status: " + status + ", path: " + imageAbsolutePath)
                    activeEditor.edit(edit => {
                        if ((startLine - 2) >= 0) {
                            let range = new vscode.Range(activeEditor.document.lineAt(startLine - 2).range.start, activeEditor.document.lineAt(startLine - 1).range.start)
                            let rawText = activeEditor.document.getText(range)
                            if (rawText.trim().length != 0) {
                                let regex = new RegExp("!\\[(\\d+_.*)\\]\\(.*\\)")
                                let matchValue = regex.exec(rawText.trim())
                                if (matchValue != null) {
                                    targetFileName = matchValue[1]
                                }

                                startLine -= 1
                                edit.delete(range)
                            }
                        }
                    }).then ( value => {
                        activeEditor.edit(edit => {
                            let range = new vscode.Range(activeEditor.document.lineAt(startLine - 1).range.start, activeEditor.document.lineAt(startLine - 1).range.end)
                            let rawText = activeEditor.document.getText(range)
                            let spaceString = rawText.match(/^\s*/)
                            edit.replace(range, spaceString + "![" + path.basename(imageFileRelativePath) + "](" + imageFileRelativePath + ")" + "\n" + rawText)
                        }).then(value => {
                            mdplantlibapi.cursor(activeEditor, startLine - 1)
                        })
                    })
                })
            })
        } else {
            let currentFileDir = mdplantlibapi.getRelativeDir(activeEditor)
            let imageAbsolutePath = mdplantlibapi.getRootPath(activeEditor) + "/" + currentFileDir + "/images/" + targetFileName

            mdplantlibapi.getHTTPPlantumlImage(contentArray, suffix, imageAbsolutePath, status => {
                logger.info("status: " + status + ", path: " + imageAbsolutePath)
                activeEditor.edit(edit => {
                    if ((startLine - 2) >= 0) {
                        let range = new vscode.Range(activeEditor.document.lineAt(startLine - 2).range.start, activeEditor.document.lineAt(startLine - 1).range.start)
                        let rawText = activeEditor.document.getText(range)
                        if (rawText.trim().length != 0) {
                            let regex = new RegExp("!\\[(\\d+_.*)\\]\\(.*\\)")
                            let matchValue = regex.exec(rawText.trim())
                            if (matchValue != null) {
                                targetFileName = matchValue[1]
                            }

                            startLine -= 1
                            edit.delete(range)
                        }
                    }
                }).then ( value => {
                    activeEditor.edit(edit => {
                        let range = new vscode.Range(activeEditor.document.lineAt(startLine - 1).range.start, activeEditor.document.lineAt(startLine - 1).range.end)
                        let rawText = activeEditor.document.getText(range)
                        let spaceString = rawText.match(/^\s*/)
                        let imageFileRelativePath = "images/" + targetFileName
                        edit.replace(range, spaceString + "![" + path.basename(imageFileRelativePath) + "](" + imageFileRelativePath + ")" + "\n" + rawText)
                    }).then(value => {
                        mdplantlibapi.cursor(activeEditor, startLine - 1)
                    })
                })
            })
        }
    }
}

export function doExcel(activeEditor: vscode.TextEditor, clipboardContent = "")
{
    if (clipboardContent.length > 0) {
        // 1. 按行分割
        let excelLines = clipboardContent.split("\n").map(line => line.replace(/\r$/, ''));
        let rows = excelLines.map(line => line.split("\t"));

        // 2. 统计每列最大宽度
        let colWidths: number[] = [];
        rows.forEach(row => {
            row.forEach((cell, idx) => {
                let len = cell.length;
                if (!colWidths[idx] || len > colWidths[idx]) {
                    colWidths[idx] = len;
                }
            });
        });

        // 3. 补齐每个单元格内容
        function padCell(cell: string, width: number) {
            return cell + " ".repeat(width - cell.length);
        }

        let paddedRows = rows.map(row =>
            row.map((cell, idx) => padCell(cell, colWidths[idx]))
        );

        // 4. 生成 Markdown 表格字符串
        let header = paddedRows[0].join(" | ");
        let separator = colWidths.map(w => "-".repeat(w)).join(" | ");
        let body = paddedRows.slice(1).map(row => row.join(" | ")).join("\n");
        let markdownTable = `${header}\n${separator}\n${body}`;

        // 5. 替换当前行内容
        var line = activeEditor.selection.active.line;
        activeEditor.edit(edit => {
            let range = new vscode.Range(activeEditor.document.lineAt(line).range.start, activeEditor.document.lineAt(line).range.end);
            edit.replace(range, markdownTable);
        }).then(value => {
            mdplantlibapi.cursor(activeEditor, line);
        });
    }
}

export function doList(activeEditor: vscode.TextEditor, clipboardContent = "")
{
    let line = activeEditor.selection.active.line
    let currentFileDir = mdplantlibapi.getRelativeDir(activeEditor)
    let rootPath = mdplantlibapi.getRootPath(activeEditor)

    activeEditor.edit(edit => {
        let range = new vscode.Range(activeEditor.document.lineAt(line).range.start, activeEditor.document.lineAt(line).range.end)
        let lineText = activeEditor.document.getText(range).replace(/\\/g, "/")

        if (clipboardContent != "") {
            lineText += clipboardContent
        }

        if (lineText.trim().length <= 0)
            return 

        if (lineText.trim().startsWith(rootPath))
            lineText = lineText.replace(rootPath + "/", "")

        if (lineText.trim().startsWith(currentFileDir)) {
            lineText = lineText.replace(currentFileDir + "/", "")
        } else {
            if (fs.existsSync(mdplantlibapi.getWorkspaceFolder(activeEditor) + "/" + lineText.trim())) {
                if (!lineText.trim().startsWith("/")) {
                    let spaceString = lineText.match(/^\s*/)
                    lineText = spaceString + "/" + lineText.trim()
                }
            }
        }

        let output = mdplantlibapi.doList(lineText)
        if (output.length > 0)
            edit.replace(range, output)
    }).then(value => {
        mdplantlibapi.cursor(activeEditor, line)
    })
}

export async function doPaste(activeEditor: vscode.TextEditor)
{
    mdplantlibapi.saveImageFile(activeEditor, imageFileRelativePath => {
        imageFileRelativePath += "." + mdplantlibapi.getConfig("MDPlant.paste.image.suffix", "png")

        let currentFileDir = mdplantlibapi.getRelativeDir(activeEditor)
        let targetFilePath = mdplantlibapi.getRootPath(activeEditor) + "/" + currentFileDir + "/" + imageFileRelativePath

        if (fs.existsSync(targetFilePath)) {
            vscode.window.showInformationMessage("image existed: " + currentFileDir + "/" + imageFileRelativePath)
            return
        }

        let ret = mdplantlibapi.saveClipboardImage(targetFilePath)
        if (ret.status) {
            var editor = vscode.window.activeTextEditor
            var line = activeEditor.selection.active.line
            if (editor != undefined) {
                editor.edit(edit => {
                    let range = new vscode.Range(activeEditor.document.lineAt(line).range.start, activeEditor.document.lineAt(line).range.end)
                    let rawText = activeEditor.document.getText(range)
                    let spaceString = rawText.match(/^\s*/)
                    edit.replace(range, spaceString + "![" + path.basename(imageFileRelativePath) + "](" + imageFileRelativePath + ")")

                    logger.info("doPaste: " + imageFileRelativePath)
                }).then(value => {
                    mdplantlibapi.cursor(activeEditor, line)
                })
            }
        } else {
            vscode.window.showInformationMessage("save image error: " + ret.content)
        }
    })
}

export function doMenu(activeEditor: vscode.TextEditor)
{
    var line = activeEditor.selection.active.line
    let textBlock = mdplantlibapi.getTextBlock(activeEditor, line)
    let startLine = textBlock.start
    let endLine = textBlock.end
    let curseLine = startLine

    activeEditor.edit(edit => {
        let range = new vscode.Range(activeEditor.document.lineAt(startLine).range.start, activeEditor.document.lineAt(endLine).range.end)
        edit.delete(range)
    }).then((value) => {
        activeEditor.edit(edit => {
            let docs = activeEditor.document.getText().split(/\r?\n/)
            let menus:string[] = mdplantlibapi.doMenu(docs)

            if (startLine != endLine) {
                menus = ([""].concat(menus))
                menus.push("")

                curseLine += 1
            }
            edit.insert(new vscode.Position(startLine, 0), menus.join("\n"))

            logger.info("doMenu:  start: " + startLine + ", end: " + endLine)
        }).then( value => {
            mdplantlibapi.cursor(activeEditor, curseLine)
        })
    })
}

export function doMenuIndex(activeEditor: vscode.TextEditor)
{
    let docs = activeEditor.document.getText().split(/\r?\n/)

    let contentArray = mdplantlibapi.doMenuIndex("", docs)

    var line = activeEditor.selection.active.line
    let startLine = 0
    let endLine = activeEditor.document.lineCount - 1

    if (contentArray.length > 1) {
        activeEditor.edit(edit => {
            edit.replace(new vscode.Range(activeEditor.document.lineAt(startLine).range.start, activeEditor.document.lineAt(endLine).range.end), contentArray.join("\n"))
            logger.info("doMenuIndex: finished")
        }).then(value => {
            mdplantlibapi.cursor(activeEditor, line)
        })
    }
}

export function doIndent(activeEditor: vscode.TextEditor)
{
    var line = activeEditor.selection.active.line
    let textBlock = mdplantlibapi.getTextBlock(activeEditor, line, false)
    let startLine = textBlock.start
    let endLine = textBlock.end
    let contentArray: string[] = textBlock.textBlock

    if (contentArray.length > 1) {
        activeEditor.edit(edit => {
            if (mdplantlibapi.doIndent(contentArray, startLine)) {
                edit.replace(new vscode.Range(activeEditor.document.lineAt(startLine).range.start, activeEditor.document.lineAt(endLine).range.end), contentArray.join("\n"))
                logger.info("doIndent: finished")
            }
        }).then(value => {
            mdplantlibapi.cursor(activeEditor, line)
        })
    }
}

export async function doTableLineShortcut(activeEditor: vscode.TextEditor, lineValue: string) {
    let output: string = ""
    var line = activeEditor.selection.active.line
    let textBlock = mdplantlibapi.getTextBlock(activeEditor, line, false)
    let startLine = textBlock.start
    let endLine = textBlock.end
    let currentFileDir = mdplantlibapi.getRelativeDir(activeEditor)
    let relativeFilePath = lineValue.replace(currentFileDir + "/", "")
    let prefixLine = "<!-- " + relativeFilePath + " -->\n"

    if (textBlock.textBlock[0].trim() == "table") {
        let clipboardContent = (await vscode.env.clipboard.readText()).trim()
        // excel table paste
        if (clipboardContent.length > 0 && clipboardContent.includes("\t") && clipboardContent.includes("\n")) {
            let range = new vscode.Range(activeEditor.document.lineAt(line).range.start, activeEditor.document.lineAt(line).range.end)
            let lineText = activeEditor.document.getText(range)
            if (lineText.trim().startsWith("table")) {
                logger.info("excel clipboard: \n" + clipboardContent)

                doExcel(activeEditor, clipboardContent)
                vscode.env.clipboard.writeText("")
            }
        }

        return true
    } else {
        output = mdplantlibapi.convert2Table(relativeFilePath, mdplantlibapi.getRootPath(activeEditor) + "/" + currentFileDir)
    }

    
    if (output.length > 0) {
        activeEditor.edit(edit => {
            let range = new vscode.Range(activeEditor.document.lineAt(startLine).range.start, activeEditor.document.lineAt(endLine).range.end)
            edit.replace(range, prefixLine + output)
        }).then(value => {
            mdplantlibapi.cursor(activeEditor, line)
        })

        return true
    } else
        return false
}

export function doCopyShortcut(activeEditor: vscode.TextEditor, lineValue: string) {
    let currentEditorFile = activeEditor.document.uri.fsPath
    let lineValueArray = lineValue.trim().split(/\s+/)
    let output = ""

    if (lineValueArray.length == 2) {
        output = mdplantlibapi.copyDocument(lineValueArray[1], [], currentEditorFile, false).content
    } else if (lineValueArray.length == 3) {
        output = mdplantlibapi.copyDocument(lineValueArray[1], [], lineValueArray[2], true).content
    }

    if (output.length > 0) {
        let preLineStart = activeEditor.selection.active.line - 1
        let preLineEnd = activeEditor.selection.active.line + 1

        activeEditor.edit(edit => {
            if (preLineStart < 0)
                preLineStart = 0
            else {
                let preRange = new vscode.Range(activeEditor.document.lineAt(preLineStart).range.start, activeEditor.document.lineAt(preLineStart).range.end)
                let preLineStartText = activeEditor.document.getText(preRange).trim()

                console.log(preLineStart)
                console.log(preLineStartText.length)

                if (preLineStartText.length != 0)
                    preLineStart = activeEditor.selection.active.line

                if (preLineEnd >= (activeEditor.document.lineCount - 1))
                    preLineEnd = activeEditor.document.lineCount - 1
            }

            console.log(preLineStart)
            console.log(preLineEnd)
            let range = new vscode.Range(activeEditor.document.lineAt(preLineStart).range.start, activeEditor.document.lineAt(preLineEnd).range.end)
            edit.delete(range)
        }).then(async value => {
            // mdplantlibapi.cursor(activeEditor, preLine)

            doFile(output)

            await vscode.workspace.openTextDocument(vscode.Uri.parse(output)).then( async doc => {
                await vscode.window.showTextDocument(doc, { preview: false }).then(async editor => {
                    logger.info("show file success...")

                    vscode.workspace.saveAll()
                })
            })
        })

        return true
    } else
        return false
}

function doDelete(filePath: string) {
    let rootPath = mdplantlibapi.getRootPath(undefined)
    let pathInfo = mdplantlibapi.parsePath(rootPath, filePath)

    logger.info(pathInfo)

    // README.md修改
    if (pathInfo.pathType == mdplantlibapi.projectPathTypeEnum.dir) {
        mdplantlibapi.refreshReadmeDocsTable(rootPath + "/" + pathInfo.mainPath + "/README.md", rootPath + "/" + path.dirname(pathInfo.subPath))
    } else if (pathInfo.pathType == mdplantlibapi.projectPathTypeEnum.file) {
        const indexRE = new RegExp("^\\d{1,4}_.*", "g")
        if (!indexRE.test(path.basename(filePath)) || !filePath.endsWith(".md")) {
            logger.info("skip file: " + filePath)
            return
        }

        mdplantlibapi.refreshReadmeDocsTable(rootPath + "/" + pathInfo.subPath + "/README.md", rootPath + "/" + pathInfo.subPath + "/" + pathInfo.subSrcPath)
    }
}

function doFile(filePath: string) {
    let rootPath = mdplantlibapi.getRootPath(undefined)
    let relativePath = filePath.replace(rootPath + "", "").replace(/[\\]/gi, "/").replace(/^\//, "")
    let pathInfo = mdplantlibapi.parsePath(rootPath, filePath)

    logger.info(pathInfo)

    const indexRE = new RegExp("^\\d{1,4}_.*", "g")
    if (path.basename(filePath) != "README.md" && (!indexRE.test(path.basename(filePath)) || !filePath.endsWith(".md"))) {
        logger.info("skip file: " + filePath)
        return
    }

    // 顶层目录的README.md修改不需要做任何处理
    if (relativePath == "README.md") {
        logger.info("skip root README.md")

        return
    }

    // README.md修改
    if (pathInfo.pathType == mdplantlibapi.projectPathTypeEnum.readme) {
        mdplantlibapi.refreshReadmeDocsTable(rootPath + "/" + pathInfo.mainPath + "/README.md", rootPath + "/" + pathInfo.mainPath + "/" + pathInfo.subSrcPath)
    } else if (pathInfo.pathType == mdplantlibapi.projectPathTypeEnum.file) {
        mdplantlibapi.refreshReadmeDocsTable(rootPath + "/" + pathInfo.subPath + "/README.md", rootPath + "/" + pathInfo.subPath + "/" + pathInfo.subSrcPath)
    }
}
export async function doSort(filePath: string) {
    logger.info("doSort: " + filePath)

    mdplantlibapi.sortDocument(filePath)
}

export async function doResort(filePath: string) {
    logger.info("doResort: " + filePath)

    mdplantlibapi.resortDocument(filePath)
}

export async function doResortTo(filePath: string) {
    logger.info("doResort: " + filePath)

    let lastIndex = getLastDocInfo(path.dirname(filePath)).index
    let regex = new RegExp("^(\\d{0,4})_")
    let fileName = path.basename(filePath)

    let matchValue = regex.exec(fileName.trim())
    if (matchValue != null) {
        await vscode.window.showInputBox(
        {   // 这个对象中所有参数都是可选参数
            password:false,                       // 输入内容是否是密码
            ignoreFocusOut:true,                  // 默认false，设置为true时鼠标点击别的地方输入框不会消失
            // placeHolder:'input file name：',   // 在输入框内的提示信息
            value: String(lastIndex).padStart(4,'0'),
            prompt:'Modify Index',            // 在输入框下方的提示信息
        }).then(async msg => {
            if (matchValue != null && msg != undefined && msg.length > 0 && !isNaN(parseFloat(msg))) {
                logger.info("New File Index: " + matchValue[1] + " -> " + msg)

                if (msg == matchValue[1])
                    return

                if (parseInt(msg) > lastIndex) {
                    doResort(filePath)

                    return
                }

                mdplantlibapi.resortDocumentTo(filePath, parseInt(msg))
            }
        })
    }
}

export async function doMerge(filePath: string) {
    logger.info("doMerge: " + filePath)

    mdplantlibapi.mergeDocument(mdplantlibapi.getRootPath(undefined), mdplantlibapi.getRelativePath(filePath))
}

export async function doSubproject(filePath: string) {
    logger.info("doSubproject: " + filePath)

    let rootPath = mdplantlibapi.getRootPath(undefined)
    let regex = new RegExp("^(\\d{0,4})_")
    let docsPathRegex = new RegExp("[\\/\\\\](docs|src)[\\/\\\\]\\d{0,4}_[^\\/\\\\]*.md$")
    let maxIndex = 0
    let currentFileDir = ""

    let matchValue = docsPathRegex.exec(filePath)
    if (matchValue != null) {
        currentFileDir = filePath.replace(matchValue[0], "") + "/" + matchValue[1]
    }

    logger.info(currentFileDir)
    let pathInfo = mdplantlibapi.parsePath(rootPath, currentFileDir)
    logger.info(pathInfo)
    if (pathInfo.status) {
        if (pathInfo.pathType == mdplantlibapi.projectPathTypeEnum.file) {
            let docsPath = currentFileDir
            logger.info("doDir docs path: " + docsPath)

            let files = fs.readdirSync(docsPath)
            files.forEach((dir => {
                if (fs.lstatSync(currentFileDir + "/" + dir).isDirectory()) {
                    let matchValue = regex.exec(dir.trim())
                    if (matchValue != null) {
                        let index = Number(matchValue[1])
                        if (index > maxIndex) {
                            maxIndex = index
                        }
                    }
                }
            }))

            if (maxIndex == 0) {
                let filePrefix = String(maxIndex + 1).padStart(4,'0')
                await vscode.window.showInputBox(
                {   // 这个对象中所有参数都是可选参数
                    password:false,                       // 输入内容是否是密码
                    ignoreFocusOut:true,                  // 默认false，设置为true时鼠标点击别的地方输入框不会消失
                    // placeHolder:'input file name：',   // 在输入框内的提示信息
                    value: filePrefix + "_",
                    prompt:'sub project name',            // 在输入框下方的提示信息
                }).then(async msg => {
                    if (msg != undefined && msg.length > 0) {
                        mdplantlibapi.convertToSubProject(docsPath, docsPath + "/" + msg)

                        doFile(docsPath + "/" + msg + "/README.md")

                        await vscode.workspace.openTextDocument(docsPath + "/" + msg + "/README.md").then( async doc => {
                            await vscode.window.showTextDocument(doc, { preview: false }).then(async editor => {
                                logger.info("show file success...")

                                vscode.workspace.saveAll()
                            })
                        })
                    }
                })
            }
        }
    }
}

export async function doFormatIndex(filePath: string) {
    logger.info("doFormatIndex: " + filePath)

    let regex = new RegExp("^(\\d{0,4})_")
    let fileName = path.basename(filePath)

    let matchValue = regex.exec(fileName.trim())
    if (matchValue != null) {
        await vscode.window.showInputBox(
        {   // 这个对象中所有参数都是可选参数
            password:false,                       // 输入内容是否是密码
            ignoreFocusOut:true,                  // 默认false，设置为true时鼠标点击别的地方输入框不会消失
            // placeHolder:'input file name：',   // 在输入框内的提示信息
            value: matchValue[1],
            prompt:'Modify File Index',            // 在输入框下方的提示信息
        }).then(async msg => {
            if (matchValue != null && msg != undefined && msg.length > 0 && !isNaN(parseFloat(msg))) {
                logger.info("New File Index: " + matchValue[1] + " -> " + msg)

                if (msg == matchValue[1])
                    return

                mdplantlibapi.formatIndex(filePath, msg)
            }
        })
    } else
        mdplantlibapi.formatIndex(filePath)
}

export async function doFormatIndexTo(filePath: string) {
    logger.info("doFormatIndexTo: " + filePath)

    let regex = new RegExp("^(\\d{0,4})_")
    let fileName = path.basename(filePath)

    let matchValue = regex.exec(fileName.trim())
    if (matchValue != null) {
        await vscode.window.showInputBox(
        {   // 这个对象中所有参数都是可选参数
            password:false,                       // 输入内容是否是密码
            ignoreFocusOut:true,                  // 默认false，设置为true时鼠标点击别的地方输入框不会消失
            // placeHolder:'input file name：',   // 在输入框内的提示信息
            value: matchValue[1],
            prompt:'Modify File Index',            // 在输入框下方的提示信息
        }).then(async msg => {
            if (matchValue != null && msg != undefined && msg.length > 0 && !isNaN(parseFloat(msg))) {
                logger.info("New File Index: " + matchValue[1] + " -> " + msg)

                if (msg == matchValue[1])
                    return

                mdplantlibapi.formatIndex(filePath, msg)
            }
        })
    } else {
        let lastIndex = getLastDocInfo(path.dirname(filePath) + "/..").index
        await vscode.window.showInputBox(
        {   // 这个对象中所有参数都是可选参数
            password:false,                       // 输入内容是否是密码
            ignoreFocusOut:true,                  // 默认false，设置为true时鼠标点击别的地方输入框不会消失
            // placeHolder:'input file name：',   // 在输入框内的提示信息
            value: String(lastIndex).padStart(4,'0'),
            prompt:'Modify File Index',            // 在输入框下方的提示信息
        }).then(async msg => {
            if (msg != undefined && msg.length > 0 && !isNaN(parseFloat(msg))) {
                logger.info("New File Index: " + msg)

                mdplantlibapi.formatIndex(filePath, msg)
            }
        })
    }
}

export async function doDir(filePath: string) {
    let rootPath = mdplantlibapi.getRootPath(undefined)
    let regex = new RegExp("^(\\d{0,4})_")
    let maxIndex = 0

    logger.info("doDir: " + filePath)

    // 空文件夹，拷贝整个参考模板目录
    if (filePath == rootPath) {
        let authorName = ""
        let newProjectFlag = true

        if (fs.existsSync(rootPath + "/" + "conf.py")) {
            const fileContent = fs.readFileSync(rootPath + "/" + "conf.py", 'utf8').split(/\r?\n/)
            for (let i = 0; i < fileContent.length; i++) {
                if(fileContent[i].trim().startsWith("author")) {
                    authorName = fileContent[i].trim().split("=")[1].trim().replace(/'/g, "")
                    newProjectFlag = false

                    break
                }
            }
        }

        await vscode.window.showInputBox(
        {   // 这个对象中所有参数都是可选参数
            password:false,             // 输入内容是否是密码
            ignoreFocusOut:true,        // 默认false，设置为true时鼠标点击别的地方输入框不会消失
            value: authorName,
            prompt:'author name',       // 在输入框下方的提示信息
        }).then(msg => {
            if (msg != undefined && msg.length > 0) {
                if (!mdplantlibapi.newProject(rootPath, msg, newProjectFlag)) {
                    vscode.window.showInformationMessage("请清空目录及隐藏文件")
                }
            }
        })
    // 针对src、docs目录，创建子项目目录，兼容win、linux
    } else {
        let pathInfo = mdplantlibapi.parsePath(rootPath, filePath)
        logger.info(pathInfo)
        if (pathInfo.status) {
            if (pathInfo.pathType == mdplantlibapi.projectPathTypeEnum.dir) {
                let docsPath = ""

                if (pathInfo.subSrcPath != "") {
                    docsPath = rootPath + "/" + pathInfo.subPath
                    docsPath += "/" + pathInfo.subSrcPath
                } else
                    docsPath = rootPath + "/" + path.dirname(pathInfo.subPath)
                logger.info("doDir docs path: " + docsPath)

                let files = fs.readdirSync(docsPath)
                files.forEach((dir => {
                    let matchValue = regex.exec(dir.trim())
                    if (matchValue != null) {
                        let index = Number(matchValue[1])
                        if (index > maxIndex) {
                            maxIndex = index
                        }
                    }
                }))

                let filePrefix = String(maxIndex + 1).padStart(4,'0')
                await vscode.window.showInputBox(
                {   // 这个对象中所有参数都是可选参数
                    password:false,                       // 输入内容是否是密码
                    ignoreFocusOut:true,                  // 默认false，设置为true时鼠标点击别的地方输入框不会消失
                    // placeHolder:'input file name：',   // 在输入框内的提示信息
                    value: filePrefix + "_",
                    prompt:'sub project name',            // 在输入框下方的提示信息
                }).then(async msg => {
                    if (msg != undefined && msg.length > 0) {
                        mdplantlibapi.newSubProject(docsPath + "/" + msg)

                        doFile(docsPath + "/" + msg + "/README.md")

                        await vscode.workspace.openTextDocument(docsPath + "/" + msg + "/README.md").then( async doc => {
                            await vscode.window.showTextDocument(doc, { preview: false }).then(async editor => {
                                logger.info("show file success...")
                            })
                        })
                    }
                })
            } else if (pathInfo.pathType == mdplantlibapi.projectPathTypeEnum.file) {

                let docsPath = rootPath + "/" + pathInfo.subPath + "/" + pathInfo.subSrcPath
                let files = fs.readdirSync(docsPath)

                logger.info("doDir docs path: " + docsPath)

                files.forEach((dir => {
                    let matchValue = regex.exec(dir.trim())
                    if (matchValue != null) {
                        let index = Number(matchValue[1])
                        if (index > maxIndex) {
                            maxIndex = index
                        }
                    }
                }))

                let filePrefix = String(maxIndex + 1).padStart(4,'0')
                await vscode.window.showInputBox(
                {   // 这个对象中所有参数都是可选参数
                    password:false,                          // 输入内容是否是密码
                    ignoreFocusOut:true,                     // 默认false，设置为true时鼠标点击别的地方输入框不会消失
                    // placeHolder:'input file name: ',      // 在输入框内的提示信息
                    value: filePrefix + "_",
                    prompt:'file name',                      // 在输入框下方的提示信息
                }).then(async msg => {
                    if (msg != undefined && msg.length > 0) {
                        if (msg.indexOf(".md") == -1)
                            msg += ".md"

                        mdplantlibapi.newSubProjectWorkFile(docsPath + "/" + msg, mdplantlibapi.getGitConfig())

                        await vscode.workspace.openTextDocument(docsPath + "/" + msg).then( async doc => {
                            await vscode.window.showTextDocument(doc, { preview: false }).then(async editor => {
                                logger.info("show file success...")
                            })
                        })
                    }
                })
            } else if (pathInfo.pathType == mdplantlibapi.projectPathTypeEnum.src
                    || pathInfo.subSrcPath.trim().length != 0) {

                let docsPath = rootPath + "/" + pathInfo.subSrcPath
                let files = fs.readdirSync(docsPath)

                logger.info("doDir docs path: " + docsPath)

                files.forEach((dir => {
                    let matchValue = regex.exec(dir.trim())
                    if (matchValue != null) {
                        let index = Number(matchValue[1])
                        if (index > maxIndex) {
                            maxIndex = index
                        }
                    }
                }))

                if (pathInfo.subSrcPath != "docs") {
                    let filePrefix = String(maxIndex + 1).padStart(4,'0')
                    await vscode.window.showInputBox(
                    {   // 这个对象中所有参数都是可选参数
                        password:false,                       // 输入内容是否是密码
                        ignoreFocusOut:true,                  // 默认false，设置为true时鼠标点击别的地方输入框不会消失
                        // placeHolder:'input file name：',   // 在输入框内的提示信息
                        value: filePrefix + "_",
                        prompt:'sub project name',            // 在输入框下方的提示信息
                    }).then(async msg => {
                        if (msg != undefined && msg.length > 0) {
                            mdplantlibapi.newSubProject(docsPath + "/" + msg)

                            doFile(docsPath + "/" + msg + "/README.md")

                            await vscode.workspace.openTextDocument(docsPath + "/" + msg + "/README.md").then( async doc => {
                                await vscode.window.showTextDocument(doc, { preview: false }).then(async editor => {
                                    logger.info("show file success...")
                                })
                            })
                        }
                    })
                } else {
                    let filePrefix = String(maxIndex + 1).padStart(4,'0')
                    await vscode.window.showInputBox(
                    {   // 这个对象中所有参数都是可选参数
                        password:false,                          // 输入内容是否是密码
                        ignoreFocusOut:true,                     // 默认false，设置为true时鼠标点击别的地方输入框不会消失
                        // placeHolder:'input file name: ',      // 在输入框内的提示信息
                        value: filePrefix + "_",
                        prompt:'file name',                      // 在输入框下方的提示信息
                    }).then(async msg => {
                        if (msg != undefined && msg.length > 0) {
                            if (msg.indexOf(".md") == -1)
                                msg += ".md"

                            mdplantlibapi.newSubProjectWorkFile(docsPath + "/" + msg, mdplantlibapi.getGitConfig())

                            await vscode.workspace.openTextDocument(docsPath + "/" + msg).then( async doc => {
                                await vscode.window.showTextDocument(doc, { preview: false }).then(async editor => {
                                    logger.info("show file success...")
                                })
                            })
                        }
                    })
                }
            }
        }
    }
}

export async function doIndex(activeEditor: vscode.TextEditor)
{
    var line = activeEditor.selection.active.line
    let textBlock = mdplantlibapi.getTextBlock(activeEditor, line)

    await vscode.window.showInputBox(
        {   // 这个对象中所有参数都是可选参数
            password:false,                           // 输入内容是否是密码
            ignoreFocusOut:true,                      // 默认false，设置为true时鼠标点击别的地方输入框不会消失
            placeHolder:'input relative direcotry: ', // 在输入框内的提示信息
            prompt:'docs',                            // 在输入框下方的提示信息
            validateInput:function(text){             // 校验输入信息，返回null表示检查OK
                if (text.trim().length > 0)
                    return null
                else
                    return "请输入文件相对目录"
            }
        }).then( msg => {
            if (msg == undefined)
                return 

            if (msg == "") {
                msg = "docs"
                logger.info("use default sub dir: " + msg)
            }

            let startLine = textBlock.start
            let endLine = textBlock.end
            let currentFileDir = mdplantlibapi.getRelativeDir(activeEditor)
            let folderPath = mdplantlibapi.getRootPath(activeEditor) + "/" + currentFileDir + "/" + msg
            logger.info(folderPath)

            if (fs.existsSync(folderPath)) {
                activeEditor.edit(edit => {
                    let range = new vscode.Range(activeEditor.document.lineAt(startLine).range.start, activeEditor.document.lineAt(endLine).range.end)
                    edit.delete(range)
                }).then((value) => {
                    activeEditor.edit(edit => {
                        let outputString = mdplantlibapi.generateIndexTable(mdplantlibapi.getRootPath(activeEditor) + "/" + currentFileDir, msg, "")

                        if (startLine != endLine)
                            outputString = "\n" + outputString + "\n"

                        edit.insert(new vscode.Position(startLine, 0), outputString)
                    }).then(value => {
                        mdplantlibapi.cursor(activeEditor, startLine)
                    })
                })
            } else {
                vscode.window.showInformationMessage("folder Path: " + folderPath + " not exist")
            }
        }
    )
}

export async function doRefers(activeEditor: vscode.TextEditor)
{
    logger.info("doRefers")

    let refersDir = path.dirname(activeEditor.document.uri.fsPath) + "/refers"
    if (fs.existsSync(refersDir)) {
        let line = activeEditor.selection.active.line
        let files = fs.readdirSync(refersDir)
        let needListFiles: string[] = []
        let indexRegex = new RegExp("^(\\d{4})_(.*)")

        files.forEach((f => {
            // logger.debug(f)
            let indexMatchValue = indexRegex.exec(f)

            if ((indexMatchValue != null) && (indexMatchValue[1] == path.basename(activeEditor.document.uri.fsPath).split("_")[0])) {
                needListFiles.push(f)
            }
        }))

        console.log(needListFiles)
        activeEditor.edit(edit => {
            let outputString = ""
            needListFiles.forEach(element => {
                outputString += "* [" + element + "](refers/" + element + ")\n"
            });

            let range = new vscode.Range(activeEditor.document.lineAt(line).range.start, activeEditor.document.lineAt(line).range.end)
            edit.replace(range, outputString)
        }).then(value => {
            mdplantlibapi.cursor(activeEditor, line)
        })
    }
}

export async function doTable(activeEditor: vscode.TextEditor)
{
    var line = activeEditor.selection.active.line
    let textBlock = mdplantlibapi.getTextBlock(activeEditor, line, false)

    await vscode.window.showInputBox(
        {   // 这个对象中所有参数都是可选参数
            password:false,                           // 输入内容是否是密码
            ignoreFocusOut:true,                      // 默认false，设置为true时鼠标点击别的地方输入框不会消失
            placeHolder:'input relative direcotry: ', // 在输入框内的提示信息
            prompt:'docs',                            // 在输入框下方的提示信息
            validateInput:function(text){             // 校验输入信息，返回null表示检查OK
                return null
            }
        }).then( msg => {
            if (msg == undefined)
                return

            if (msg == "") {
                let mdDirs = ["docs", "src"]

                for (let i = 0; i < mdDirs.length; i++) {
                    let checkDocsPath = mdplantlibapi.getRootPath(activeEditor)
                            + "/" + mdplantlibapi.getRelativeDir(activeEditor)
                            + "/" + mdDirs[i]

                    if (fs.existsSync(checkDocsPath)) {
                        let files = fs.readdirSync(checkDocsPath)
                        let regex = new RegExp("^(\\d{0,4})_")

                        for (let j = 0; j < files.length; j++) {
                            let matchValue = regex.exec(files[j].trim())
                            if (matchValue != null) {
                                msg = mdDirs[i]

                                break
                            }
                        }
                    }

                    if (msg != "")
                        break
                }

                if (msg == "")
                    msg = "docs"

                logger.info("use default sub dir: " + msg)
            }

            let startLine = textBlock.start
            let endLine = textBlock.end
            if (textBlock.start > textBlock.end) {
                startLine = textBlock.end
                endLine = textBlock.start
            }

            let currentFileDir = mdplantlibapi.getRelativeDir(activeEditor)
            let folderPath = mdplantlibapi.getRootPath(activeEditor) + "/" + currentFileDir + "/" + msg
            logger.info(folderPath)

            if (fs.existsSync(folderPath)) {
                activeEditor.edit(edit => {
                    let range = new vscode.Range(activeEditor.document.lineAt(startLine).range.start, activeEditor.document.lineAt(endLine).range.end)
                    edit.delete(range)
                }).then((value) => {
                    activeEditor.edit(edit => {
                        let outputString = mdplantlibapi.refreshReadmeDocsTable(undefined, folderPath)
                        if (textBlock.textBlock.length != 0)
                            edit.insert(new vscode.Position(startLine, 0), outputString)
                        else
                            edit.insert(new vscode.Position(startLine, 0), "\n" + outputString + "\n")
                    }).then(value => {
                        mdplantlibapi.cursor(activeEditor, startLine)
                    })
                })
            } else {
                vscode.window.showInformationMessage("folder Path: " + folderPath + " not exist")
            }
        }
    )
}
export async function doSelectText(activeEditor: vscode.TextEditor)
{
    let selection = activeEditor.selection
    let selectionRange = new vscode.Range(selection.start.line, selection.start.character, selection.end.line, selection.end.character);
    let selectionText = activeEditor.document.getText(selectionRange)
    console.log("doSelectText: " + selectionText)

    if (selectionText.length > 0) {
        if (selectionText.indexOf("</li> <li>") > 0){
            selectionText = selectionText.replace("<ul><li>", "").replace("</li></ul>", "")
            selectionText = selectionText.replace("</li> <li>", "\n")

            activeEditor.edit(edit => {
                edit.replace(selectionRange, selectionText)
            }).then(value => {
                mdplantlibapi.cursor(activeEditor, selection.active.line)
            })
        }else if (selectionText.startsWith("**") && selectionText.endsWith("**")){
            activeEditor.edit(edit => {
                edit.replace(selectionRange, selectionText.replace(/^\*\*/g, "").replace(/\*\*$/g, ""))
            }).then(value => {
                mdplantlibapi.cursor(activeEditor, selection.active.line)
            })
        } else {
            selectionText = selectionText.replace(/\r?\n/g, "|").replace(/ ?\| ?/g, "|")
            let datas = selectionText.split("|")
            console.log("splited datas: " + datas)

            if (selectionText.indexOf("|") > 0){
                let listString = "<ul>"

                for (let i = 0; i < datas.length; i++) {
                    if (i == 0) {
                        listString += "<li>" + datas[i] + "</li>"
                    } else {
                        listString += " <li>" + datas[i] + "</li>"
                    }
                }

                listString += "</ul>"
                // console.log(listString)

                activeEditor.edit(edit => {
                    edit.replace(selectionRange, listString)
                }).then(value => {
                    mdplantlibapi.cursor(activeEditor, selection.active.line)
                })
            } else {
                activeEditor.edit(edit => {
                    edit.replace(selectionRange, "**" + selectionText + "**")
                }).then(value => {
                    mdplantlibapi.cursor(activeEditor, selection.active.line)
                })
            }
        }

        return true
    } else {
        return false
    }
}

function provideHover(document: vscode.TextDocument, position: vscode.Position) {
    const fileName = document.fileName;
    if (fileName.endsWith(".md")) {
        console.log('provideHover');

        // Get the current line where mouse is hovering
        const line = position.line;
        const lineText = document.lineAt(line).text;

        // Check for Markdown inline code (text between backticks)
        const inlineCodeRegex = /`([^`]+)`/g;
        let match;

        while ((match = inlineCodeRegex.exec(lineText)) !== null) {
            const codeContent = match[1];
            const startIndex = match.index;
            const endIndex = startIndex + match[0].length;

            // Check if cursor is within this code block
            if (position.character >= startIndex && position.character <= endIndex) {
                const range = new vscode.Range(
                    new vscode.Position(line, startIndex),
                    new vscode.Position(line, endIndex)
                );

                // Create hover message with command link
                const hoverMessage = new vscode.MarkdownString(
                    `[Send to Terminal](command:mdplant.sendToTerminal?${encodeURIComponent(JSON.stringify([codeContent]))})`
                );
                hoverMessage.isTrusted = true;

                return new vscode.Hover(hoverMessage, range);
            }
        }
    }
}

export async function doTerminal(activeEditor: vscode.TextEditor, activeTerminal: vscode.Terminal) {
    // console.log(activeTerminal.name)
    logger.info("doTerminal")

    var line = activeEditor.selection.active.line
    let range = new vscode.Range(activeEditor.document.lineAt(line).range.start, activeEditor.document.lineAt(line).range.end)
    let rawText = activeEditor.document.getText(range)
    let inLineCodeRE = new RegExp("\\`(.*)\\`", "g")
    let pathRE = new RegExp(/.*(\\\d{4}_).*/, "g")
    let cmd = ""
    let currentFileDir = mdplantlibapi.getRelativeDir(activeEditor)
    let rootPath = mdplantlibapi.getRootPath(activeEditor).replace(/\\/g, "/")

    let terminal = vscode.window.activeTerminal
    if (terminal == undefined) {
        terminal = vscode.window.createTerminal("MDPlant")
        terminal.show()
    }

    if (rootPath == undefined || rootPath[0] == undefined) {
        logger.info("root path is undefined")

        let matchValue = inLineCodeRE.exec(rawText)
        if (matchValue) {
            cmd = matchValue[1]
            logger.info(cmd)

            activeTerminal.sendText(cmd, true)
        }

        return true
    }

    let rootPathUp = rootPath[0].toUpperCase() + rootPath.substring(1)

    if (rawText.trimLeft().startsWith("```"))
        return false

    let matchValue = inLineCodeRE.exec(rawText)
    // logger.info(matchValue)
    if (matchValue) {
        let cmdData = matchValue[1].replace(/\\/g, "/")
        if (cmdData.includes(currentFileDir) || cmdData.includes(rootPath) || cmdData.includes(rootPathUp)) {
            let outputList = rawText.split(" ")
            for (let i = 0; i < outputList.length; i++) {
                let currentData = outputList[i].replace(/\\/g, "/")
                if (currentData.includes(rootPath))
                    outputList[i] = currentData.split(rootPath + "/").join("")

                if (currentData.includes(rootPathUp))
                    outputList[i] = currentData.split(rootPathUp + "/").join("")

                if (currentData.includes(currentFileDir))
                    outputList[i] = currentData.split(currentFileDir + "/").join("")
            }

            let output = outputList.join(" ")
            logger.info("relative cmd: " + output)

            activeEditor.edit(edit => {
                edit.replace(range, output)
            })

            return true
        }

        let matchValuePath = pathRE.exec(rawText)
        // logger.info(matchValuePath)
        if (matchValuePath) {
            let outputList = rawText.split(" ")
            for (let i = 0; i < outputList.length; i++) {
                if (outputList[i].includes("refers/"))
                    outputList[i] = outputList[i].replace(/\\/g, "/")
            }

            let output = outputList.join(" ")
            logger.info("path to linux: " + output)

            activeEditor.edit(edit => {
                edit.replace(range, output)
            })

            return true
        }

        cmd = matchValue[1]
        currentFileDir = mdplantlibapi.getAbsoluteDir(activeEditor)
        let terminalCwd = activeTerminal.shellIntegration?.cwd?.path
        logger.info("current file dir: " + currentFileDir)
        logger.info("terminal cwd:     " + terminalCwd)
        if (terminalCwd != undefined) {
            if (currentFileDir.startsWith(terminalCwd)) {
                currentFileDir = currentFileDir.replace(terminalCwd, "").replace(/\\/g, "/").substring(1)
            }
        }

        if (cmd.includes(" refers/")) {
            // cmd = cmd.replace(" refers/", " " + mdplantlibapi.getRelativeDir(activeEditor) + "/" + "refers/")
            cmd = cmd.replace(/ refers\//g, " " + currentFileDir + "/refers/")
        } else if (cmd.startsWith("refers/")) {
            cmd = cmd.replace(/refers\//g, currentFileDir + "/refers/")
        } else if (cmd.startsWith("/")) {
            cmd = currentFileDir + cmd
        }

        if (terminalCwd != undefined && terminalCwd != null) {
            if (rootPath != terminalCwd.replace(/\\/g, "/")) {
                currentFileDir = rootPath

                if (cmd.includes(" out/")) {
                    cmd = cmd.replace(/ out\//g, " " + currentFileDir + "/out/")
                }
                if (cmd.includes(" out ")) {
                    cmd = cmd.replace(/ out /g, " " + currentFileDir + "/out ")
                }
                if (cmd.endsWith(" out")) {
                    cmd = cmd.replace(/ out/g, " " + currentFileDir + "/out")
                }
            }
        }

        logger.info(cmd)
        activeTerminal?.sendText(cmd, true)

        return true
    }

    return false
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (logger.info) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    logger.info('Congratulations, your extension "mdplant" is now active!')

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable

    disposable = vscode.commands.registerCommand('extension.mdindex', () => {

        const activeEditor = vscode.window.activeTextEditor
        if (activeEditor) {
            doIndex(activeEditor)
        }
    })

    context.subscriptions.push(disposable)

    disposable = vscode.commands.registerCommand('extension.mdlist', () => {

        const activeEditor = vscode.window.activeTextEditor
        if (activeEditor) {
            doList(activeEditor)
        }
    })

    context.subscriptions.push(disposable)

    disposable = vscode.commands.registerCommand('extension.mdtable', () => {

        const activeEditor = vscode.window.activeTextEditor
        if (activeEditor) {
            doTable(activeEditor)
        }
    })

    context.subscriptions.push(disposable)

    disposable = vscode.commands.registerCommand('extension.mdindent', () => {

        const activeEditor = vscode.window.activeTextEditor
        if (activeEditor) {
            doIndent(activeEditor)
        }
    })

    context.subscriptions.push(disposable)

    disposable = vscode.commands.registerCommand('extension.mdmenu', () => {

        const activeEditor = vscode.window.activeTextEditor
        if (activeEditor) {
            doMenu(activeEditor)
        }
    })

    context.subscriptions.push(disposable)

    disposable = vscode.commands.registerCommand('extension.mddir', (uri:vscode.Uri) => {
        doDir(uri.fsPath)
    })
    context.subscriptions.push(disposable)

    disposable = vscode.commands.registerCommand('extension.mdpaste', async () => {

        // just use the keybindings do more
        const activeEditor = vscode.window.activeTextEditor
        const activeTerminal = vscode.window.activeTerminal

        if (activeEditor != undefined && activeTerminal != undefined) {
            if (await doTerminal(activeEditor, activeTerminal))
                return
        }

        if (activeEditor != undefined) {

            if (await doSelectText(activeEditor)) {
                return
            }

            var line = activeEditor.selection.active.line
            let textBlock = mdplantlibapi.getTextBlock(activeEditor, line, true)
            let startLine = textBlock.start
            let endLine = textBlock.end

            logger.info(textBlock)

            let textBlockInfo = mdplantlibapi.parseTextBlock(textBlock.textBlock, mdplantlibapi.getRootPath(activeEditor), line - startLine)
            logger.info(textBlockInfo)

            if (textBlockInfo.status) {
                switch(textBlockInfo.type) {
                    case mdplantlibapi.projectTextBlockTypeEnum.indent:
                        doIndent(activeEditor)
                        break
                    case mdplantlibapi.projectTextBlockTypeEnum.list:
                        doList(activeEditor)
                        break
                    case mdplantlibapi.projectTextBlockTypeEnum.table:
                        if (textBlockInfo.content== "docs") {
                            doTable(activeEditor)
                        } else if (textBlockInfo.content == "index") {
                            doIndex(activeEditor)
                        } else if (textBlockInfo.content.startsWith("table")) {
                            doTableLineShortcut(activeEditor, textBlockInfo.content)
                        }
                        break
                    case mdplantlibapi.projectTextBlockTypeEnum.menu:
                        if (textBlockInfo.content == "")
                            doMenu(activeEditor)
                        else if (textBlockInfo.content == "menu index")
                            doMenuIndex(activeEditor)
                        break
                    case mdplantlibapi.projectTextBlockTypeEnum.plantuml:
                        if (textBlockInfo.content.startsWith("plantuml")) {
                            doPlantumlLineShortcut(activeEditor, textBlockInfo.content)
                        } else {
                            doPlantuml(activeEditor)
                        }
                        break
                    case mdplantlibapi.projectTextBlockTypeEnum.copy:
                        doCopyShortcut(activeEditor, textBlockInfo.content)
                        break
                    case mdplantlibapi.projectTextBlockTypeEnum.author:
                        doAuthor(activeEditor)
                        break
                    default:
                        break
                }

                return
            }

            textBlockInfo = mdplantlibapi.parseTextBlock(textBlock.codeBlock, mdplantlibapi.getRootPath(activeEditor), line - textBlock.codeStart)
            if (textBlockInfo.status) {
                switch(textBlockInfo.type) {
                    case mdplantlibapi.projectTextBlockTypeEnum.plantuml:
                        if (textBlockInfo.content.startsWith("plantuml")) {
                            doPlantumlLineShortcut(activeEditor, textBlockInfo.content)
                        } else {
                            doPlantuml(activeEditor)
                        }
                        break
                    default:
                        break
                }

                return
            }

            let clipboardContent = (await vscode.env.clipboard.readText()).trim()
            if (clipboardContent.length > 0 && fs.existsSync(mdplantlibapi.getRootPath(undefined) + "/" + mdplantlibapi.getRelativePath(clipboardContent))) {
                logger.info("clipboard: " + clipboardContent)

                doList(activeEditor, mdplantlibapi.getRelativePath(clipboardContent))
                vscode.env.clipboard.writeText("")

                return
            } 

            // check table and create menu
            for (var i = (startLine - 1); i >= 0; i--) {
                let range = new vscode.Range(activeEditor.document.lineAt(i).range.start, activeEditor.document.lineAt(i).range.end)
                let lineText = activeEditor.document.getText(range)

                if (lineText.trim().length == 0)
                    continue

                if (lineText.startsWith("NO.|文件名称|摘要")) {
                    let range = new vscode.Range(activeEditor.document.lineAt(i + 1).range.start, activeEditor.document.lineAt(i + 1).range.end)
                    let lineText = activeEditor.document.getText(range)
                    if (lineText.startsWith(":--:|:--|:--")) {
                        doTable(activeEditor)
                        return
                    }
                }

                if (lineText.startsWith("# ") || lineText.startsWith("## ")) {
                    var fragments = lineText.trim().split(" ")
                    if (fragments.length >= 2) {
                        if (fragments[1].toLowerCase() == "docs"  || fragments[1].toLowerCase() == "文档索引") {
                            doTable(activeEditor)
                            return
                        }

                        if (fragments[1].toLowerCase() == "menu" || fragments[1].toLowerCase() == "目录") {
                            doMenu(activeEditor)
                            return
                        }

                        if (fragments[1].toLowerCase() == "index" || fragments[1].toLowerCase() == "索引") {
                            doIndex(activeEditor)
                            return
                        }

                        if (fragments[1].toLowerCase() == "refers" || fragments[1].toLowerCase() == "参考文档") {
                            doRefers(activeEditor)
                            return
                        }

                        if (fragments[1].toLowerCase() == "author" || fragments[1].toLowerCase() == "作者信息") {
                            doAuthor(activeEditor)
                            return
                        }
                    }

                    break
                }
            }

            let range = new vscode.Range(activeEditor.document.lineAt(line).range.start, activeEditor.document.lineAt(line).range.end)
            let lineText = activeEditor.document.getText(range)
            if (lineText.trim().length == 0) {
                doPaste(activeEditor)
            }
        }
    })

    context.subscriptions.push(disposable)

    let onDidSaveTextDocumentEventDispose = vscode.workspace.onDidSaveTextDocument(function(event){
        logger.info("doFile: " + event.uri.fsPath)
        doFile(event.uri.fsPath)
    })

    context.subscriptions.push(onDidSaveTextDocumentEventDispose)

    let onDidDeleteFilesEventDispose  = vscode.workspace.onDidDeleteFiles(function(event){
        logger.info("doDelete: " + event.files[0].fsPath)
        doDelete(event.files[0].fsPath)
    })

    context.subscriptions.push(onDidDeleteFilesEventDispose)

    disposable = vscode.commands.registerCommand('extension.mdsort', (uri:vscode.Uri) => {
        doSort(uri.fsPath)
    })
    context.subscriptions.push(disposable)

    disposable = vscode.commands.registerCommand('extension.mdresort', (uri:vscode.Uri) => {
        doResort(uri.fsPath)
    })
    context.subscriptions.push(disposable)

    disposable = vscode.commands.registerCommand('extension.mdresortto', (uri:vscode.Uri) => {
        doResortTo(uri.fsPath)
    })
    context.subscriptions.push(disposable)

    disposable = vscode.commands.registerCommand('extension.mdmerge', (uri:vscode.Uri) => {
        doMerge(uri.fsPath)
    })
    context.subscriptions.push(disposable)

    disposable = vscode.commands.registerCommand('extension.mdsubproject', (uri:vscode.Uri) => {
        doSubproject(uri.fsPath)
    })
    context.subscriptions.push(disposable)

    disposable = vscode.commands.registerCommand('extension.mdformatIndex', (uri:vscode.Uri) => {
        doFormatIndex(uri.fsPath)
    })
    context.subscriptions.push(disposable)

    disposable = vscode.commands.registerCommand('extension.mdformatIndexTo', (uri:vscode.Uri) => {
        doFormatIndexTo(uri.fsPath)
    })
    context.subscriptions.push(disposable)

    vscode.commands.executeCommand('setContext', 'ext.unSupportedProjectPath', [
        'README.md',
        'images',
        'refers',
        'docs',
        'src',
        'drawio',
    ]);

    vscode.commands.executeCommand('setContext', 'ext.unSupportedSortPath', [
        'README.md',
        'images',
        'refers',
        'docs',
        'src',
        'drawio',
        path.basename(mdplantlibapi.getRootPath(undefined)),
    ]);

    const welcomPageProvider = new WelcomPageVP.WelcomePageProvider(context.extensionUri);
	context.subscriptions.push(vscode.window.registerWebviewViewProvider(WelcomPageVP.WelcomePageProvider.viewType, welcomPageProvider));

    const sequenceProvider = new SequenceVP.SequenceViewProvider(context.extensionUri);
	context.subscriptions.push(vscode.window.registerWebviewViewProvider(SequenceVP.SequenceViewProvider.viewType, sequenceProvider));

    /*
    const ganttProvider = new GanttVP.GanttViewProvider(context.extensionUri);
	context.subscriptions.push(vscode.window.registerWebviewViewProvider(GanttVP.GanttViewProvider.viewType, ganttProvider));
    */

    const mindmapProvider = new MindMapVP.MindMapViewProvider(context.extensionUri);
	context.subscriptions.push(vscode.window.registerWebviewViewProvider(MindMapVP.MindMapViewProvider.viewType, mindmapProvider));

    const classProvider = new ClassVP.ClassViewProvider(context.extensionUri);
	context.subscriptions.push(vscode.window.registerWebviewViewProvider(ClassVP.ClassViewProvider.viewType, classProvider));

    context.subscriptions.push(vscode.languages.registerHoverProvider('markdown', {
        provideHover
    }));

    // Register command for sending code to terminal
    disposable = vscode.commands.registerCommand('mdplant.sendToTerminal', async (args: string) => {
        console.log("sendToTerminal args: " + args)

        let terminal = vscode.window.activeTerminal
        if (terminal != undefined) {
            terminal.sendText(args);
        } else {
            terminal = vscode.window.createTerminal("MDPlant")
            terminal.show()
            terminal.sendText(args);
        }
    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
