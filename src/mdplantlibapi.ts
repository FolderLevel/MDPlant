import * as vscode from 'vscode'
import * as path from 'path'
import * as fs from 'fs'
import * as child_process from 'child_process'
import * as mdplantlib from 'mdplantlib'

export let projectPathTypeEnum      = mdplantlib.projectPathTypeEnum
export let projectTextBlockTypeEnum = mdplantlib.projectTextBlockTypeEnum
export let Loggger                  = mdplantlib.Logger
const logger                        = new Loggger("mdplantlib", true)

/**
 * 获取Git配置信息
 */
export function getGitConfig(){
    let configSrcs = ["--global", "--local"]
    let gitConfigDict: { [key: string]: string } = {"user.name": "N/A", "user.email": "N/A"};
    let rootPath = getRootPath(undefined)

    logger.debug(`getGitConfig: ${rootPath}`)
    configSrcs.forEach(configSrc => {
        try {
            let command = ""
            if (configSrc == "--global") {
                command = `git config ${configSrc} --list`;
            } else {
                command = `git config --list -f ${rootPath}/.git/config`;
            }

            const output = child_process.execSync(command).toString().trim();
            const configLines = output.split('\n');
            configLines.forEach(line => {
                const [key, value] = line.split('=');
                gitConfigDict[key] = value;
            });
        } catch (error) {
            // 忽略非Git仓库的错误
            logger.debug(`Error getting Git config ${configSrc}: ${error}`);
        }
    });

    return gitConfigDict;
}

/**
 * 
 * @param editor 
 * @param index 
 * @param direction 
 * @returns 
 * 
 * 1. 代码块标记
 * 2. 空白行
 * 3. 不包含边界
 */
export function findBoundary(editor: vscode.TextEditor, index: number, direction: number, boundary: boolean = true) {
    let boundaryLine = ["```"]
    let line =index
    let foundFlag = false
    let textBlock: string[] = []

    while ((line >= 0) && (line < editor.document.lineCount)) {
        let editorLine = editor.document.lineAt(line)
        let range = new vscode.Range(editorLine.range.start, editorLine.range.end)
        let lineText = editor.document.getText(range)

        for (let i = 0; i < boundaryLine.length; i++) {
            if (lineText.trim().startsWith(boundaryLine[i]) || lineText.trim().length == 0) {
                if (lineText.trim().startsWith(boundaryLine[i]) && boundary)
                    textBlock.push(lineText)
                else {
                    if (line != index)
                        line -= direction
                }

                foundFlag = true
                break
            }
        }
        if (foundFlag) {
            if (textBlock.length == 0)          // 空白行，但是可能存在空白字符
                textBlock.push(lineText)

            break
        }

        textBlock.push(lineText)

        line += direction
    }

    if (line < 0)
        line = 0

    if (line >= editor.document.lineCount)
        line = (editor.document.lineCount - 1)

    return {"index": line, "textBlock": textBlock}
}

/**
 * 
 * @param editor 
 * @param index 
 * @returns 
 * 
 * 包含代码块标记、空白行
 */
export function getTextBlock(editor: vscode.TextEditor, index: number, boundary: boolean = true) {
    /*
    let MDP_UP = -1
    let MDP_DOWN = 1
    let textBlock: string[] = []

    let upInfo = findBoundary(editor, index, MDP_UP, boundary)
    let downInfo = findBoundary(editor, index, MDP_DOWN, boundary)

    textBlock = textBlock.concat(upInfo.textBlock.reverse())
    if (downInfo.textBlock.length > 1) {
        downInfo.textBlock.splice(0, 1)
        textBlock = textBlock.concat(downInfo.textBlock)
    }

    return {"start": upInfo.index, "end": downInfo.index, "textBlock": textBlock, "cursor": index}
    */

    let textInfo = getTextBlockV2(editor, boundary)

    // 兼容就的属性数据
    return {
        "start"     : textInfo.spaceStart,
        "end"       : textInfo.spaceEnd,
        "spaceStart": textInfo.spaceStart,
        "spaceEnd"  : textInfo.spaceEnd,
        "textBlock" : textInfo.textBlock,
        "codeStart" : textInfo.codeStart,
        "codeEnd"   : textInfo.codeEnd,
        "codeBlock" : textInfo.codeBlock,
        "cursor"    : index
    }
}

function countLeadingSpaces(str: string) {  
    let regex = new RegExp("^(\\s+).*")
    let matchValue = regex.exec(str)

    if (matchValue != null) {
        return matchValue[1].length
    } else {
        return 0
    }
}  

/**
 * 
 * @param editor 
 * @param index 
 * @returns 
 * 
 * 包含代码块标记、空白行
 */
export function getTextBlockV2(editor: vscode.TextEditor, boundary: boolean = true) {
    let textBlock: string[] = []
    let codeBlock: string[] = []
    var index               = editor.selection.active.line
    let contentArray        = editor.document.getText().split(/\r?\n/)
    let codeStart           = -1
    let codeEnd             = -1
    let codeIndent          = 1024
    let spaceStart          = -1
    let spaceEnd            = -1

    // 从index往上扫描
    for (let i = index; i >= 0; i--) {
        if (contentArray[i].trim().length == 0 && spaceStart == -1) {
            spaceStart = i
        }

        if (contentArray[i].trim().startsWith("```") && codeStart == -1) {
            codeStart = i

            if (i == 0) {
                spaceStart = i
            } else {
                if (spaceStart == -1) {
                    if (contentArray[i - 1].trim().length == 0) {
                        spaceStart = i - 1
                    } else {
                        spaceStart = i
                    }
                }
            }

            break
        }
    }

    // 从index往下扫描
    for (let i = (index); i < contentArray.length; i++) {
        if (contentArray[i].trim().length == 0 && spaceEnd == -1) {
            spaceEnd= i
        }

        if (contentArray[i].trim().startsWith("```") && codeEnd == -1) {
            codeEnd = i

            if (spaceEnd == -1) {
                if (contentArray.length <= (i + 1)) {                   // last line
                    spaceEnd = i
                } else if (contentArray[i + 1].trim().length == 0) {    // next space line
                    spaceEnd = i + 1
                } else {                                                // ``` line
                    spaceEnd = i
                }
            }

            break
        }
    }

    logger.info({
        "codeStart" : codeStart,
        "codeEnd"   : codeEnd,
        "spaceStart": spaceStart,
        "spaceEnd"  : spaceEnd,
        "cursor"    : index,
        "boundary"  : boundary
    })

    if (codeStart == -1) {
        codeEnd = -1
    }

    if (codeStart != -1 && codeEnd == -1) {
        codeStart = -1
    }

    if (spaceStart == -1) {
        spaceStart = 0
    }

    if (spaceStart != -1 && spaceEnd == -1) {
        spaceEnd = contentArray.length - 1
    }

    // 判定成对的```
    if (codeStart != -1 && codeEnd != -1 && (contentArray[codeStart].indexOf("```") != contentArray[codeEnd].indexOf("```"))) {
        codeStart = -1
        codeEnd   = -1
    }

    if (spaceStart <= codeStart && spaceEnd >= codeEnd) {
        spaceStart = codeStart
        spaceEnd   = codeEnd
    }

    if (codeStart != -1) {
        /**
         * 代码段包含边界，因为有语言信息用于信息判断
         */
        /*
        if (boundary) {
            codeBlock = contentArray.slice(codeStart, codeEnd + 1)
        } else {
            codeBlock = contentArray.slice(codeStart + 1, codeEnd)
        }
        */

        codeBlock = contentArray.slice(codeStart, codeEnd + 1)
    }

    if (spaceStart != -1) {
        if (!boundary) {
            if (spaceStart == codeStart && spaceEnd == codeEnd) {
                spaceStart = spaceStart + 1
                spaceEnd   = spaceEnd - 1
            } else {
                if (spaceStart != spaceEnd) {
                    if (contentArray[spaceStart].trim().length == 0)
                        spaceStart = spaceStart + 1

                    if (contentArray[spaceEnd].trim().length == 0)
                        spaceEnd = spaceEnd - 1
                }
            }
        }

        if ((spaceStart == spaceEnd) && (contentArray[spaceStart].trim().length == 0)) {
            textBlock = contentArray.slice(spaceStart, spaceEnd)
        } else
            textBlock = contentArray.slice(spaceStart, spaceEnd + 1)
    }

    // 检查代码块是否属于同一代码块
    if (codeBlock != undefined && codeBlock.length > 0){
        // 检查缩紧
        for (let i = 0; i < codeBlock.length; i++) {
            // 空白行忽略
            if (codeBlock[i].trim().length == 0)
                continue

            let leadingSpaces = countLeadingSpaces(codeBlock[i])

            if (leadingSpaces < codeIndent)
                codeIndent = leadingSpaces
        }

        let leadingSpaces = countLeadingSpaces(codeBlock[0])
        logger.info("leading space: " + leadingSpaces + ", code indent: " + codeIndent)
        if (leadingSpaces > codeIndent) {
            codeBlock = []
            codeStart = -1
            codeEnd   = -1
        } else {
            // 标记了是哪种语言的代码块
            logger.info("code mark start: " + codeBlock[0].length + ", code mark end: " + codeBlock[codeBlock.length - 1].length)
            if (codeBlock[0].length < codeBlock[codeBlock.length - 1].length) {
                codeBlock = []
                codeStart = -1
                codeEnd   = -1
            }
        }
    }

    console.log({
        "codeStart" : codeStart,
        "codeEnd"   : codeEnd,
        "spaceStart": spaceStart,
        "spaceEnd"  : spaceEnd,
        "textBlock" : textBlock,
        "codeBlock" : codeBlock,
        "cursor"    : index
    })

    return {
        "codeStart" : codeStart,
        "codeEnd"   : codeEnd,
        "spaceStart": spaceStart,
        "spaceEnd"  : spaceEnd,
        "textBlock" : textBlock,
        "codeBlock" : codeBlock,
        "cursor"    : index
    }
}

export function getStructBlock(editor: vscode.TextEditor, cursorChange: boolean = true) {
    let codeBlock: string[] = []
    var index               = editor.selection.active.line
    let contentArray        = editor.document.getText().split(/\r?\n/)
    let codeStart           = -1
    let codeEnd             = -1
    let regexStart          = new RegExp("^(struct|class)\\s+[^\\s]+\\s+\{\\s*")
    let regexEnd            = new RegExp("^\};?\\s*")
    let matchValue          = null

    // 从index往上扫描
    for (let i = index; i >= 0; i--) {
		matchValue = regexStart.exec(contentArray[i].trimRight())
		// console.log(matchValue)
		if (matchValue != null) {
            codeStart = i
            break
        }

		matchValue = regexEnd.exec(contentArray[i].trimRight())
		if (matchValue != null) {
            codeStart = -1
            break
        }
    }

    if (codeStart != -1) {
        // 从index往下扫描
        for (let i = (index); i < contentArray.length; i++) {
            matchValue = regexEnd.exec(contentArray[i].trimRight())
            // console.log(matchValue)
            if (matchValue != null) {
                codeEnd = i
                break
            }

            matchValue = regexStart.exec(contentArray[i].trimRight())
            // console.log(matchValue)
            if (matchValue != null) {
                codeStart = -1
                codeEnd = -1
                break
            }
        }

        if (codeStart != -1 && codeEnd != -1)
            codeBlock = contentArray.slice(codeStart, codeEnd + 1)
    }

    if (cursorChange)
        index = codeStart

    return {
        "codeStart" : codeStart,
        "codeEnd"   : codeEnd,
        "codeBlock" : codeBlock,
        "cursor"    : index
    }
}

export function getClassBlock(editor: vscode.TextEditor, cursorChange: boolean = true) {
    let codeBlock: string[] = []
    var index               = editor.selection.active.line
    let contentArray        = editor.document.getText().split(/\r?\n/)
    let codeStart           = -1
    let codeEnd             = -1
    let regexStart          = new RegExp("(\\s*)(.+)\\s+class\\s+[^\\s]+\\s+(.+)?\{\\s*")
    let regexEnd            = new RegExp("^(\\s*)\};?\\s*$")
	let matchValue          = null
    let preSpace            = null

    // 从index往上扫描
    for (let i = index; i >= 0; i--) {
		matchValue = regexStart.exec(contentArray[i].trimRight())
		// console.log(matchValue)
		if (matchValue != null) {
            codeStart = i
            preSpace = matchValue[1]
            break
        }

		matchValue = regexEnd.exec(contentArray[i].trimRight())
		if (matchValue != null && matchValue[1] == "") {
            codeStart = -1
            preSpace = null
            break
        }
    }

    if (codeStart != -1) {
        // 从index往下扫描
        for (let i = (index); i < contentArray.length; i++) {
            matchValue = regexEnd.exec(contentArray[i].trimRight())
            // console.log(matchValue)
            if (matchValue != null && preSpace == matchValue[1]) {
                codeEnd = i
                break
            }

            matchValue = regexStart.exec(contentArray[i].trimRight())
            // console.log(matchValue)
            if (matchValue != null) {
                codeStart = -1
                codeEnd = -1
                preSpace = null
                break
            }
        }

        if (codeStart != -1 && codeEnd != -1)
            codeBlock = contentArray.slice(codeStart, codeEnd + 1)
    }

    if (cursorChange)
        index = codeStart

    return {
        "codeStart" : codeStart,
        "codeEnd"   : codeEnd,
        "codeBlock" : codeBlock,
        "cursor"    : index
    }
}

export function getRootPath(editor: vscode.TextEditor | undefined) {
    let output = ""
    let workspaceFolders = vscode.workspace.workspaceFolders

    if (workspaceFolders?.length == 1 || editor == undefined) {
        if (workspaceFolders)
            output = workspaceFolders[0].uri.fsPath
    } else {
        workspaceFolders?.forEach(workspaceFolder => {
            if (editor?.document.uri.fsPath.includes(workspaceFolder.uri.fsPath)) {
                output = workspaceFolder.uri.fsPath
            }
        })
    }

    return output
}

export function getWorkspaceFolder(editor: vscode.TextEditor) {
    return getRootPath(editor)
}

export function getRelativePath(filePath: string) {
    let rootPath = getRootPath(undefined)

    return filePath.replace(rootPath, "").replace(/[\\]/gi, "/").replace(/^\/*/, "")
}

export function getRelativeDir(editor: vscode.TextEditor) {
    return path.dirname(getRelativePath(editor.document.uri.fsPath))
}

export function getAbsoluteDir(editor: vscode.TextEditor) {
    return path.dirname(editor.document.uri.fsPath)
}

export function doList(textLine: string) {
    return mdplantlib.convert2List(textLine).content
}

export function saveClipboardImage(imagePath: string) {
    return mdplantlib.saveClipboardImage(imagePath)
}

export function doIndent(contentArray: string[], startLine: number) {
    let columnInterval = 2
    let skipLevel = contentArray[0].indexOf("* ") / columnInterval

    if (contentArray[1].indexOf("─ ") > 0) {
        mdplantlib.revert2List(contentArray, skipLevel)
    } else {
        let countLeaderIndent = 0
        let flagIndex = -1

        // check list start with "* "
        for (var i = 0; i < contentArray.length; i++) {
            flagIndex = contentArray[i].indexOf("* ")
            if ( flagIndex < 0 || (flagIndex % 2) != 0) {
                vscode.window.showInformationMessage("检查数据格式：两个空格 * n + '* ' + 数据 (错误行：" + (startLine + i + 1) + ")")
                return false
            }

            if (flagIndex == 0)
                countLeaderIndent += 1
        }

        if (countLeaderIndent > 1) {
            vscode.window.showInformationMessage("只能有一个根节点，请检查格式，发现: " + countLeaderIndent)
            return false
        }

        mdplantlib.convert2Tree(contentArray, skipLevel)
    }

    return true
}

export function convert2Table(lineValue: string, rootPath: string) {
    return mdplantlib.convert2Table(lineValue, rootPath).content
}

export function doMenu(contentArray: string[]) {
    return mdplantlib.generateMenu(contentArray).content.split("\n")
}

export function doMenuIndex(fileName:string, contentArray: string[]) {
    return mdplantlib.generateMenuIndex("", contentArray, true, true, false).content.split("\n")
}

export function refreshReadmeDocsTable(outputFile: string | null | undefined, subProjectDocsDir: string) {
    let author = getConfig("MDPlant.docs.author", false)
    return mdplantlib.refreshReadmeDocsTable(outputFile, subProjectDocsDir, author).content
}

export function generateIndexTable(rootPath: string, relativePath: string | undefined, suffix: string) {
    if (relativePath == undefined)
        return ""
    else 
        return mdplantlib.generateIndexTable(rootPath, relativePath, suffix).content
}

export function newProject(outputDir: string, author: string, flag: boolean) {
    return mdplantlib.newProject(outputDir, author, flag)
}

export function parsePath(rootPath: string, filePath: string) {
    return mdplantlib.parsePath(rootPath, filePath)
}

export function newSubProject(subProjectDir: string) {
    return mdplantlib.newSubProject(subProjectDir)
}

export function convertToSubProject(srcPath: string, subProjectDir: string) {
    return mdplantlib.convertToSubProject(srcPath, subProjectDir)
}

export function newSubProjectWorkFile(outputFile: string, info: { [key: string]: string }) {
    return mdplantlib.newSubProjectWorkFile(outputFile, info)
}

export function cursor(editor: vscode.TextEditor, cursor: number) {
    let selections = editor.selections.map(s => {
        return new vscode.Selection(new vscode.Position(cursor, 0), new vscode.Position(cursor, 0));
    });
    editor.selections = selections;
}

export function parseTextBlock(textBlock: string[], rootPath: string, cursorOffset: number) {
    return mdplantlib.parseTextBlock(textBlock, rootPath, cursorOffset)
}

export function convert2SequenceDiagram(contentArray: string[], startLine: number) {

    let columnInterval = 2
    let skipLevel = contentArray[0].indexOf("* ") / columnInterval
    let countLeaderIndent = 0
    let flagIndex = -1

    // check list start with "* "
    for (var i = 0; i < contentArray.length; i++) {
        flagIndex = contentArray[i].indexOf("* ")
        if ( flagIndex < 0 || (flagIndex % 2) != 0) {
            vscode.window.showInformationMessage("检查数据格式：两个空格 * n + '* ' + 数据 (错误行：" + (startLine + i + 1) + ")")
            return []
        }

        if (flagIndex == 0)
            countLeaderIndent += 1
    }

    if (countLeaderIndent > 1) {
        vscode.window.showInformationMessage("只能有一个根节点，请检查格式，发现: " + countLeaderIndent)
        return []
    }

    return mdplantlib.convert2SequenceDiagram(contentArray, skipLevel).content.split("\n")
}

export function getConfig(name: string, defaultValue: any) {
    return vscode.workspace.getConfiguration().get(name) || defaultValue
}

export function setConfig(name: string, value: any) {
    return vscode.workspace.getConfiguration().update(name, value)
}

export function getHTTPPlantumlImage(contentArray: string[], suffix: string, filePath: string, callback: (status: boolean) => void) {
    let plantumlServer :string = getConfig('MDPlant.plantuml.server', "http://www.plantuml.com/plantuml")
    mdplantlib.getHTTPPlantumlImage(contentArray.join("\n"), plantumlServer, suffix, filePath, callback)
}

export async function saveImageFile(activeEditor: vscode.TextEditor, callback: (imageFileRelativePath: string) => void) {
    let currentEditorFile = activeEditor.document.uri.fsPath
    let editFileName = path.basename(currentEditorFile)
    let currentFileDir = getRelativeDir(activeEditor)

    const indexRE = new RegExp("^\\d{1,4}_.*", "g")
    let filePrefix = ""
    if (indexRE.test(editFileName)) {
        filePrefix = editFileName.split("_")[0] + "_"
    }

    var fileNumber = 0
    var editorFullPath = path.dirname(currentEditorFile)
    if (fs.existsSync(editorFullPath + "/images")) {
        var allImages = fs.readdirSync(editorFullPath + "/images")
        for (var image in allImages) {
            var imageName = allImages[image]

            if (imageName.startsWith(filePrefix)) {
                var fileNumberString = imageName.split("_")[1].split(".")[0]
                var currentFileNumber = Number(fileNumberString)
                if (!Number.isNaN(currentFileNumber) && currentFileNumber >= fileNumber) {
                    fileNumber = currentFileNumber + 1
                }
            }
        }

        filePrefix += String(fileNumber).padStart(4,'0')
    }

    await vscode.window.showInputBox(
    {    // 这个对象中所有参数都是可选参数
        password: false,                           // 输入内容是否是密码
        ignoreFocusOut: true,                      // 默认false，设置为true时鼠标点击别的地方输入框不会消失
        // placeHolder: 'input file name: ',       // 在输入框内的提示信息
        value: filePrefix,
        prompt:'save image name',        // 在输入框下方的提示信息
    }).then(msg => {
        if (msg != undefined && msg.length > 0) {
            let imageFileRelativePath = ""
            if (fs.existsSync(getRootPath(activeEditor) + "/" + currentFileDir + "/images")) {
                imageFileRelativePath = "images/" + msg
            } else {
                imageFileRelativePath = msg
            }

            callback(imageFileRelativePath)
        }
    })
}

export function copyDocument(srcPath: string, subpath: string[], targetPath: string, replace: boolean) {
    let rootPath = getRootPath(undefined)

    if (!(srcPath.startsWith("/")) && !(srcPath.charAt(1) == ":"))
        srcPath = rootPath + "/" + srcPath

    if (!(targetPath.startsWith("/")) && !(targetPath.charAt(1) == ":"))
        targetPath = rootPath + "/" + targetPath

    return mdplantlib.copyDocument(srcPath, subpath, targetPath, replace)
}

export function sortDocument(srcPath: string) {
    let rootPath = getRootPath(undefined)

    return mdplantlib.sortDocument(rootPath, srcPath)
}

export function resortDocument(srcPath: string) {
    let rootPath = getRootPath(undefined)

    return mdplantlib.resortDocument(rootPath, srcPath)
}

export function resortDocumentTo(srcPath: string, index: number) {
    let rootPath = getRootPath(undefined)

    return mdplantlib.resortDocumentTo(rootPath, srcPath, index)
}

export function mergeDocument(rootPath:string, srcPath: string) {
    return mdplantlib.mergeDocument(rootPath, srcPath)
}

export function formatIndex(srcPath: string, fileIndex: string = "") {
    return mdplantlib.formatIndex(srcPath, fileIndex)
}

export function generateAuthorInfo(authorInfo: string[], info: { [key: string]: string }) {
    return mdplantlib.generateAuthorInfo(authorInfo, info)
}