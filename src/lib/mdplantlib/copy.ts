import * as fs from "fs"
import * as fse from "fs-extra"
import { Logger } from "./logger"

const logger = new Logger("copy")

/**
 * 
 * @param {string} path
 * @param {string[]} subpath
 * @param {string} targetPath
 * @param {boolean} replace
 * @returns 
 */
function copyDocument(srcPath: string, subpath: string[], targetPath: string, replace: boolean): { status: boolean; content: string } {
    let content: string[] = []
    let linkMissingFiles = ["# *请确认索引缺失文件*", ""]
    let srcFilePath = ""
    let srcFileName = ""
    let srcFileIndex= ""
    let targetFilePath = ""
    let targetFileName = ""
    let targetFileIndex= ""
    let outputFilePath = ""

    logger.debug("path: " + srcPath + ", subpath: " + subpath + ", targetPath: " + targetPath)

    if (subpath.length == 0)
        subpath = ["images", "refers"]

    let pathRE = new RegExp("(.*)/((\\d{4})_[^/]*\.md)", "g")
    let matchValue = pathRE.exec(srcPath.replace(/\\/g, "/"))
    logger.debug(matchValue)
    if (matchValue != null) {
        if (matchValue[1] != undefined)
            srcFilePath = matchValue[1]
        else
            srcFilePath = "./"

        srcFileName = matchValue[2]
        srcFileIndex = matchValue[3]
    }

    pathRE = new RegExp("(.*)/((\\d{4})_[^/]*\.md)", "g")
    matchValue = pathRE.exec(targetPath.replace(/\\/g, "/"))
    logger.debug(matchValue)
    if (matchValue != null) {
        if (matchValue[1] != undefined)
            targetFilePath = matchValue[1]
        else
            targetFilePath = "./"

        targetFileName = matchValue[2]
        targetFileIndex = matchValue[3]
    }

    if (!replace) {
        let indexRegex = new RegExp("^(\\d{4})[_-]")
        let maxIndex = 0
        let files = fs.readdirSync(targetFilePath)
        files.forEach((dir => {
            let matchValue = indexRegex.exec(dir.trim())
            if (matchValue != null) {
                let index = Number(matchValue[1])
                if (index > maxIndex) {
                    maxIndex = index
                }
            }
        }))

        targetFileIndex = String(maxIndex + 1).padStart(4,'0')
    }
    
    for (var i = 0; i < subpath.length; i++) {
        if (fs.existsSync(srcFilePath + "/" + subpath[i])) {
            let files = fs.readdirSync(srcFilePath + "/" + subpath[i])

            let filesFilted = files.filter(e => e.startsWith(srcFileIndex))
            if (filesFilted.length != 0) {
                logger.debug(subpath[i] + "/" + filesFilted)
                for (var j = 0; j < filesFilted.length; j++) {
                    const inFilePath = srcFilePath + "/" + subpath[i] + "/" + filesFilted[j]
                    const outFilePath = targetFilePath + "/" + subpath[i] + "/" + filesFilted[j].replace(/^\d{4}[_-]/g, targetFileIndex + "_")
                    logger.debug(inFilePath + " -> " + outFilePath)
                    fse.copySync(inFilePath, outFilePath)
                }
            }
        }
    }

    const fileContent = fs.readFileSync(srcPath, 'utf8').split(/\r?\n/)
    for (let i = 0; i < fileContent.length; i++) {
        let linkIndexRegex = new RegExp("\\[(\\d{4}[_-].*)\\]\\(.*(\\d{4}[_-].*)\\)")
        let matchValue = linkIndexRegex.exec(fileContent[i].trim())
        // console.debug(matchValue)

        if (matchValue != null && ((matchValue[1] == matchValue[2]) || fileContent[i].trim().split(matchValue[1]).length == 3)) {
            if (matchValue[1].split(/[_-]/)[0] != srcFileIndex) {
                linkMissingFiles.push(fileContent[i])
                content.push(fileContent[i])
            } else {
                const targetLinkFile = matchValue[1].replace(/^\d{4}[_-]/g, targetFileIndex + "_")
                logger.debug(matchValue[1] + " -> " + targetLinkFile)

                content.push(fileContent[i].replace(new RegExp(matchValue[1], 'g'), targetLinkFile))
            }
        } else {
            content.push(fileContent[i])
        }
    }

    outputFilePath = targetFilePath + "/" + targetFileIndex + srcFileName.replace(srcFileIndex, "")
    if (linkMissingFiles.length > 2) {
        linkMissingFiles.push("")
        fs.writeFileSync(outputFilePath, linkMissingFiles.concat(content).join("\n"))
    } else {
        fs.writeFileSync(outputFilePath, content.join("\n"))
    }

    return {"status": true, "content": outputFilePath}
}

/**
 * 
 * @param {string[]} textBlock 
 * @param {string} rootPath 
 * @param {number} cursorOffset 
 * @returns 
 */
function isCopy(textBlock: string[], rootPath: string, cursorOffset: number): { status: boolean; content: string } {
    let found = false
    let content = ""

    logger.debug("enter isCopy")

    let startLine = 0
    for (let i = 0; i < textBlock.length; i++) {
        if (textBlock[i].trim().length != 0) {
            startLine = i
            break
        }
    }

    if (textBlock[startLine].trim().startsWith("copy ")) {
        logger.debug("copy block found")
        found = true
        content = textBlock[startLine].trim()
    }

    return {"status": found, "content": content}
}

export {
    copyDocument,
    isCopy
}
