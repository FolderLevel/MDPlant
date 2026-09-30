import * as fs from "fs"
import * as fse from "fs-extra"
import * as path from "path"
import * as indentjs from "./indent"
import * as tablejs from "./table"
import * as plantumljs from "./plantuml"
import * as listjs from "./list"
import * as menujs from "./menu"
import * as copyjs from "./copy"
import * as authorjs from "./author"
import { Logger } from "./logger"

const logger = new Logger("project")

/**
 * 
 * @param {string} outputDir 
 * @param {string} author 
 * @param {boolean} flag
 * @returns {boolean}
 */
function newProject(outputDir: string, author: string, flag: boolean): boolean {
    if (flag)
        fse.copySync(__dirname + "/res/mainProjectTemplate", outputDir)
    else {
        let files = fs.readdirSync(__dirname + "/res/mainProjectTemplate")
        let skipFiles = ["README.md", ".gitignore"]
        files.forEach((dir => {
            if (!(dir in skipFiles)) {
                fse.copySync(__dirname + "/res/mainProjectTemplate/" + dir, outputDir + "/" + dir)
            }
        }))
    }

    // custom conf.py
    const fileContent = fs.readFileSync(outputDir + "/sphinx/html/conf.py.template", 'utf8').split(/\r?\n/)
    let confFile = fs.createWriteStream(outputDir + "/sphinx/html/conf.py")
    for (let i = 0; i < fileContent.length; i++) {
        let line = fileContent[i]
        if (line.startsWith("author = ")) {
            line = "author = '" + author + "'"
            fileContent[i] = line
        }
        confFile.write(line + "\n")
    }
    confFile.close()
    fs.unlinkSync(outputDir + "/sphinx/html/conf.py.template")

    return true
}

/**
 *
 * @param {string} docsPath
 * @returns
 */
function getLastDocInfo(docsPath: string): { type: string; index: number } {
    let maxIndex = 0
    let type = "dir"
    let regex = new RegExp("^(\\d{0,4})_")

    let files = fs.readdirSync(docsPath)
    files.forEach((dir => {
        let matchValue = regex.exec(dir.trim())
        if (matchValue != null) {
            let index = Number(matchValue[1])
            if (index > maxIndex) {
                maxIndex = index
            }

            if (type == "dir") {
                if (fs.lstatSync(docsPath + "/" + dir).isFile()) {
                    console.log(docsPath + "/" + dir)
                    type = "file"
                }
            }
        }
    }))

    return {"type": type, "index": maxIndex}
}

/**
 * 
 * @param {string} subProjectDir 
 */
function newSubProject(subProjectDir: string): void {
    let dirs = ["docs/images", "docs/refers"]

    logger.debug("new subproject at: " + subProjectDir)

    fs.mkdirSync(subProjectDir)
    fse.copySync(__dirname + "/res/subProjectTemplate", subProjectDir)

    dirs.forEach(val => {
        fs.mkdirSync(subProjectDir + "/" + val)
    })
}

/**
 * 
 * @param {string} srcPath 
 * @param {string} subProjectDir 
 */
function convertToSubProject(srcPath: string, subProjectDir: string): void {

    logger.debug("convertToSubProject from: " + srcPath + " to " + subProjectDir)

    fs.mkdirSync(subProjectDir)
    fs.mkdirSync(subProjectDir + "/docs")
    fse.copySync(srcPath + "/../README.md", subProjectDir + "/README.md")

    let files = fs.readdirSync(srcPath)
    files.forEach((val => {
        if (val != path.basename(subProjectDir)) {
            logger.debug("move: " + srcPath + "/" + val + " --> " + subProjectDir + "/docs/" + val)
            fse.moveSync(srcPath + "/" + val, subProjectDir + "/docs/" + val, { overwrite: true })
        }
    }))
}

/**
 * 
 * @param {string} srcPath
 * @param {string} fileIndex
 */
function formatIndex(srcPath: string, fileIndex: string): void {
    logger.debug(srcPath + ", fileIndex: " + fileIndex)

    let regex = new RegExp("^(\\d{1,4})_")
    let lastIndex = getLastDocInfo(path.dirname(srcPath) + "/..").index
    let filePrefix = String(lastIndex).padStart(4,'0')

    if (fileIndex.length != 0) {
        let subFix = path.extname(path.basename(srcPath))
        let fileName = path.basename(srcPath).replace(subFix, "").replace(".", "_") + subFix
        let matchValue = regex.exec(path.basename(srcPath))
        if (matchValue != null) {
            fse.moveSync(srcPath, path.dirname(srcPath) + "/" + (fileName.replace(matchValue[1], fileIndex).replace(/\s/g, "_")))
        } else {
            fse.moveSync(srcPath, path.dirname(srcPath) + "/" + (fileIndex + "_" + fileName.replace(/\s/g, "_")))
        }

        filePrefix = fileIndex
    }

    let scanPath = path.dirname(srcPath)
    let files = fs.readdirSync(scanPath)
    files.forEach((dir => {
        if (fs.lstatSync(scanPath + "/" + dir).isDirectory()) {
            let matchValue = regex.exec(dir.trim())
            if (matchValue == null) {
                const inputPath = scanPath + "/" + dir
                const outputPath = scanPath + "/" + filePrefix + "_" + (dir.replace(/\s/g, "_"))

                logger.debug(inputPath + " --> " + outputPath)
                fse.moveSync(inputPath, outputPath)
            }
        } else {
            let subFix = path.extname(path.basename(srcPath))
            let fileName = path.basename(srcPath).replace(subFix, "").replace(".", "_") + subFix
            let matchValue = regex.exec(dir.trim())
            if (matchValue == null) {
                const inputPath = scanPath + "/" + dir
                const outputPath = scanPath + "/" + filePrefix + "_" + (fileName.replace(/\s/g, "_"))

                logger.debug(inputPath + " --> " + outputPath)
                fse.moveSync(inputPath, outputPath)
            }
        }
    }))

}

/**
 * 
 * @param {string} outputFile 
 * @param {Object<string, string>} info 
 */
function newSubProjectWorkFile(outputFile: string, info: { [key: string]: string }): void {
    let fileName = path.basename(outputFile)
    let objectDate = new Date();

    logger.debug(outputFile)

    let fileContent = "# " + fileName.replace(/^\d{1,4}_/, "").split(".")[0].replace(/_/gi, " ") + "\n"
    fileContent += "\n"
    fileContent += "一行摘要简介...\n"
    fileContent += "\n"

    fileContent += "# Author Info\n"
    fileContent += "\n"
    let dateStr = "" + objectDate.getFullYear() + "-" + (objectDate.getMonth() + 1)  + "-" +  objectDate.getDate()

    let userName = info["user.name"]
    let userEmail = info["user.email"]
    if (userName == undefined)
        userName = "N/A"
    if (userEmail == undefined)
        userEmail = "N/A"

    fileContent += " Date ".padEnd(dateStr.length + 1) + "|" + " Author ".padEnd(userName.length + 2) + "|" + " Email ".padEnd(userEmail.length + 2) + "| Description\n"
    fileContent += "---".padEnd(dateStr.length + 1, "-") + "|" + "---".padEnd(userName.length + 2, "-") + "|" + "---".padEnd(userEmail.length + 2, "-") + "|------------\n"
    fileContent += "" + dateStr
    fileContent += " | " + userName
    fileContent += " | " + userEmail
    fileContent += " | " + "N/A"
    fileContent += "\n"
    fileContent += "\n"
    fileContent += "# 参考文档\n"
    fileContent += "\n"
    fileContent += "* 思考\n"
    fileContent += "* 思考\n"
    fileContent += "* 思考\n"
    fileContent += "\n"

    fs.writeFileSync(outputFile, fileContent)
}

const projectPathTypeEnum = {
    none: 0,
    dir: 1,
    file: 2,
    readme: 3,
    src: 4,
}

/**
 * * dir
 *   ```
 *   [
 *     'src/0002_bring_up/docs/0003_bring_up/docs/0004_bring_up/docs/images',
 *     'src/0002_bring_up/docs/0003_bring_up/',
 *     'docs/0003_bring_up/',
 *     'docs',
 *     '0003',
 *     'bring_up',
 *     'docs/0004_bring_up',
 *     'docs',
 *     '0004',
 *     'bring_up',
 *     'docs',
 *     'images',
 *     index: 1,
 *     input: '/src/0002_bring_up/docs/0003_bring_up/docs/0004_bring_up/docs/images',
 *     groups: undefined
 *   ]
 *   ```
 * * file
 *   ```
 *   [
 *     'src/0002_bring_up/docs/0003_bring_up/docs/0071_typescript_declare.md',
 *     'src/0002_bring_up/docs/0003_bring_up/',
 *     'docs/0003_bring_up/',
 *     'docs',
 *     '0003',
 *     'bring_up',
 *     'docs',
 *     '0071',
 *     'typescript_declare',
 *     index: 0,
 *     input: 'src/0002_bring_up/docs/0003_bring_up/docs/0071_typescript_declare.md',
 *     groups: undefined
 *   ]
 *   ```
 * * readme
 *   ```
 *   [
 *     'src/0002_bring_up/docs/0003_bring_up/README.md',
 *     'src/0002_bring_up/docs/0003_bring_up/',
 *     'docs/0003_bring_up/',
 *     'docs',
 *     '0003',
 *     'bring_up',
 *     'README.md',
 *     index: 0,
 *     input: 'src/0002_bring_up/docs/0003_bring_up/README.md',
 *     groups: undefined
 *   ]
 *   ```
 */
let projectPathInfoEnum = {
    prefixPathIndex: 1,
    dirSubPathIndex: 6,
    dirSubSrcIndex: 10,
    fileSubRelativePathIndex: 6,
    fileSubSrcIndex: 7,
    readmePrefixPathIndex: 1,
    readmeSubPathIndex: 2,
    readmeSubSrcIndex: 3,
    rootSubSrcIndex: 1,
}

/**
 * * dir
 *   * mainPath
 *   * subPath
 *   * subSrcPath
 * * file
 *   * subPath
 *   * subSrcPath
 *   * subFileRelativePath
 * * readme
 *   * mainPath
 *   * subPath
 *   * subSrcPath
 * 
 * @param {string} rootPath 
 * @param {string} filePath 
 * @returns 
 */
function parsePath(rootPath: string, filePath: string): {
    status: boolean
    pathType: number
    mainPath: string
    subPath: string
    subrelativePath: string
    subSrcPath: string
} {
    let workspaceFolderFlag = false
    let pathType = projectPathTypeEnum.none
    let subPath = ""
    let subFileRelativePath = ""
    let subSrcPath = ""
    let mainPath = ""

    // logger.debug(rootPath)
    if (filePath.includes(rootPath)) {
        let projectRelativePath = filePath.replace(rootPath, "").replace(/\\/gi, "/").replace(/^\/*/, "")
        let projectDirPathInfo = new RegExp("((([^./]*)/(\\d{0,4})_([^./]*)/)*)(([^./]*)/(\\d{0,4})_([^./]*))/?([^./]*)?/?([^./]*)?$")
        let projectFilePathInfo = new RegExp("((([^./]*)/(\\d{0,4})_([^/]*)/)*)(([^./]+)/(images|refers)?/?(\\d{0,4}_[^/]*))$")
        let projectReadmePathInfo = new RegExp("((([^./]*)/(\\d{0,4})_([^/]*)/)*)([^./]*\.md)$")
        let projectSrcPathInfo = new RegExp("^(\\w+)$")
        // logger.debug(projectRelativePath)

        let matchValue = projectDirPathInfo.exec(projectRelativePath)
        if (matchValue != null) {
            /**
             * [
             *   'src/0002_bring_up/docs/0003_bring_up/docs/0004_bring_up/docs/refers',
             *   'src/0002_bring_up/docs/0003_bring_up/',
             *   'docs/0003_bring_up/',
             *   'docs',
             *   '0003',
             *   'bring_up',
             *   'docs/0004_bring_up',
             *   'docs',
             *   '0004',
             *   'bring_up',
             *   'docs',
             *   'refers',
             *   index: 0,
             *   input: 'src/0002_bring_up/docs/0003_bring_up/docs/0004_bring_up/docs/refers',
             *   groups: undefined
             * ]
             */

            pathType = projectPathTypeEnum.dir
            mainPath = matchValue[projectPathInfoEnum.prefixPathIndex]
            subPath = matchValue[projectPathInfoEnum.prefixPathIndex] + matchValue[projectPathInfoEnum.dirSubPathIndex]
            if (matchValue[projectPathInfoEnum.dirSubSrcIndex]) {
                subSrcPath = matchValue[projectPathInfoEnum.dirSubSrcIndex]

                let docInfo = getLastDocInfo(rootPath + "/" + subPath + "/" + subSrcPath)
                logger.debug(docInfo)
                if (docInfo.type == "file") {
                    pathType = projectPathTypeEnum.file
                }
            }
        } else if((matchValue = projectFilePathInfo.exec(projectRelativePath)) !== null) {
            /**
             * [
             *   'src/0002_bring_up/docs/0003_bring_up/src/images/0071_typescript_declare.png',
             *   'src/0002_bring_up/docs/0003_bring_up/',
             *   'docs/0003_bring_up/',
             *   'docs',
             *   '0003',
             *   'bring_up',
             *   'src/images/0071_typescript_declare.png',
             *   'src',
             *   'images',
             *   '0071_typescript_declare.png',
             *   index: 0,
             *   input: 'src/0002_bring_up/docs/0003_bring_up/src/images/0071_typescript_declare.png',
             *   groups: undefined
             * ]
             */

            pathType = projectPathTypeEnum.file
            subPath = matchValue[projectPathInfoEnum.prefixPathIndex]
            subSrcPath = matchValue[projectPathInfoEnum.fileSubSrcIndex]
            subFileRelativePath = matchValue[projectPathInfoEnum.fileSubRelativePathIndex]
        } else if ((matchValue = projectReadmePathInfo.exec(projectRelativePath)) != null) {
            /**
             * [
             *   'src/0002_bring_up/README.md',
             *   'src/0002_bring_up/',
             *   'src/0002_bring_up/',
             *   'src',
             *   '0002',
             *   'bring_up',
             *   'README.md',
             *   index: 0,
             *   input: 'src/0002_bring_up/README.md',
             *   groups: undefined
             * ]
             */

            pathType = projectPathTypeEnum.readme
            if (matchValue[projectPathInfoEnum.readmePrefixPathIndex].length == 0 
                    && matchValue[projectPathInfoEnum.readmeSubPathIndex] == undefined) {
                mainPath = matchValue[projectPathInfoEnum.readmePrefixPathIndex]
            } else {
                mainPath = matchValue[projectPathInfoEnum.readmePrefixPathIndex].replace(matchValue[projectPathInfoEnum.readmeSubPathIndex], "")
                subPath = matchValue[projectPathInfoEnum.readmePrefixPathIndex]
                subSrcPath = matchValue[projectPathInfoEnum.readmeSubSrcIndex]
            }
        } else if ((matchValue = projectSrcPathInfo.exec(projectRelativePath)) != null) {
            /**
             * {
             *   status: true,
             *   pathType: 0,
             *   mainPath: '',
             *   subPath: '',
             *   subrelativePath: '',
             *   subSrcPath: 'src'
             * }
             */
            pathType = projectPathTypeEnum.readme
            subSrcPath = matchValue[projectPathInfoEnum.rootSubSrcIndex]
        }

        // logger.debug("workspace project path match value: " + matchValue)
        logger.debug(matchValue)
        workspaceFolderFlag = true
    }

    return {
                "status": workspaceFolderFlag, 
                "pathType": pathType, 
                "mainPath": mainPath,
                "subPath": subPath,
                "subrelativePath": subFileRelativePath,
                "subSrcPath": subSrcPath,
            }
}

const projectTextBlockTypeEnum = {
    none: 0,
    menu: 1,
    list: 2,
    table: 3,
    plantuml: 4,
    indent: 5,
    copy: 6,
    author: 7,
}

/**
 * 
 * @param {string[]} textBlock 
 * @param {string} rootPath 
 * @param {number} cursorOffset 
 * @returns 
 */
function parseTextBlock(textBlock: string[], rootPath: string, cursorOffset: number): { status: boolean; type: number; content: string } {

    let status = false
    let type = projectTextBlockTypeEnum.none
    let content = ""

    for (let i = 0; i < textBlock.length; i++)  {
        textBlock[i] = textBlock[i].replace(/\\/gi, "/")
    }

    logger.debug(textBlock)
    logger.debug("cursor offset: " + cursorOffset)

    let checkOutput: { status: boolean; content: string } = { status: false, content: "" }
    if (textBlock.length >= (cursorOffset + 1) && cursorOffset >= 0) {
        if ((checkOutput = listjs.isList(textBlock, rootPath, cursorOffset)).status) {
            type = projectTextBlockTypeEnum.list
            logger.debug("parseTextBlock found list")
        } else if ((checkOutput = indentjs.isIndent(textBlock, rootPath, cursorOffset)).status) {
            type = projectTextBlockTypeEnum.indent
            logger.debug("parseTextBlock found indent")
        } else if ((checkOutput = plantumljs.isPlantuml(textBlock, rootPath, cursorOffset)).status) {
            type = projectTextBlockTypeEnum.plantuml
            logger.debug("parseTextBlock found plantuml")
        } else if ((checkOutput = tablejs.isTable(textBlock, rootPath, cursorOffset)).status) {
            type = projectTextBlockTypeEnum.table
            logger.debug("parseTextBlock found table")
        } else if ((checkOutput = menujs.isMenu(textBlock, rootPath, cursorOffset)).status) {
            type = projectTextBlockTypeEnum.menu
            logger.debug("parseTextBlock found menu")
        } else if ((checkOutput = copyjs.isCopy(textBlock, rootPath, cursorOffset)).status) {
            type = projectTextBlockTypeEnum.copy
            logger.debug("parseTextBlock found copy")
        } else if ((checkOutput = authorjs.isAuthor(textBlock, rootPath, cursorOffset)).status) {
            type = projectTextBlockTypeEnum.author
            logger.debug("parseTextBlock found author")
        } else {
            logger.debug("parseTextBlock not found any type")
        }
    } else {
        logger.debug("cursor offset: " + cursorOffset + " is larger than text block length: " + textBlock.length)
    }

    if (type != projectTextBlockTypeEnum.none) {
        logger.debug(checkOutput)

        status = true
        content = checkOutput.content
    } 

    return {"status": status, "type": type, "content": content}
}

export {
    newProject,
    newSubProject,
    convertToSubProject,
    newSubProjectWorkFile,
    parsePath,
    projectPathTypeEnum,
    parseTextBlock,
    projectTextBlockTypeEnum,
    getLastDocInfo,
    formatIndex,
}
