import * as fs from "fs"
import * as fse from "fs-extra"
import * as path from "path"
import { Logger } from "./logger"
import * as projectjs from "./project"
import * as tablejs from "./table"

const logger = new Logger("sort")

/**
 * 
 * @param {string} srcPath
 * @param {string} targetPath
 * @returns 
 */
function replaceDocumentIndex(srcPath: string, targetPath: string): void {
    let content: string[] = []
    let linkMissingFiles = ["# *请确认索引缺失文件*", ""]
    const fileContent = fs.readFileSync(srcPath, 'utf8').split(/\r?\n/)
    let srcFileIndex = path.basename(srcPath).split("_")[0]
    let targetFileIndex = path.basename(targetPath).split("_")[0]

    for (let i = 0; i < fileContent.length; i++) {
        let linkIndexRegex = new RegExp("\\[(\\d{4}[_-].*)\\]\\(.*(\\d{4}[_-].*)\\)")
        let matchValue = linkIndexRegex.exec(fileContent[i].trim())

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

    if (linkMissingFiles.length > 2) {
        linkMissingFiles.push("")
        fs.writeFileSync(targetPath, linkMissingFiles.concat(content).join("\n"))
    } else {
        fs.writeFileSync(targetPath, content.join("\n"))
    }
}

/**
 * 
 * @param {string} rootPath
 * @param {string} relPath
 * @param {string} srcIndex
 * @param {string} destIndex
 * @returns 
 */
function sortSubProjectFiles(rootPath: string, relPath: string, srcIndex: string, destIndex: string): void {
    let needToSortFiles: string[] = []
    let files = fs.readdirSync(rootPath + "/" + relPath)

    files.forEach((f => {
        logger.debug(f)

        if ((f.startsWith(srcIndex))) {
            needToSortFiles.push(f)
        }
    }))

    for (let i = 0; i < needToSortFiles.length; i++) {
        let indexRegex = new RegExp("^(\\d{4})_(.*)")
        let indexMatchValue = indexRegex.exec(needToSortFiles[i])

        if (indexMatchValue != null) {
            const targetFilePath = rootPath + "/" + relPath + "/" + destIndex + "_" + indexMatchValue[2]
            const srcFilePath = rootPath + "/" + relPath + "/" + needToSortFiles[i]

            if (!(fs.existsSync(targetFilePath))) {
                logger.debug(srcFilePath + " --> " + targetFilePath)
                fse.moveSync(srcFilePath, targetFilePath)
            }
        }
    }
}

/**
 * 
 * @param {string} rootPath
 * @param {string} relPath
 * @param {string} sortDir
 * @param {number} index
 * @returns 
 */
function sortSubProjectDocs(rootPath: string, relPath: string, sortDir: boolean, srcName: string = "", index: number = 0): void {
    let needToSortFiles: string[] = []
    let needToSortDirs: string[] = []
    let targetFileIndex = ""
    let targetFilePath = ""
    let srcFilePath = ""
    let files = fs.readdirSync(rootPath + "/" + relPath)

    files.forEach((dir => {
        let indexRegex = new RegExp("^(\\d{4})_")
        let indexMatchValue = indexRegex.exec(dir.trim())
        if (indexMatchValue != null && !(dir.startsWith("0000_"))) {
            if ((srcName != "") && (srcName == dir.trim()))
                return

            if (fs.lstatSync(rootPath + "/" + relPath + "/" + dir).isFile()) {
                if (parseInt(srcName.split("_")[0]) > index){
                    if ((index != 0) && (parseInt(indexMatchValue[1]) == index)) {
                        needToSortFiles.push(srcName)
                    }

                    needToSortFiles.push(dir)
                } else {
                    needToSortFiles.push(dir)

                    if ((index != 0) && (parseInt(indexMatchValue[1]) == index)) {
                        needToSortFiles.push(srcName)
                    }
                }
            }

            if (fs.lstatSync(rootPath + "/" + relPath + "/" + dir).isDirectory()) {
                if (parseInt(srcName.split("_")[0]) > index){
                    if ((index != 0) && (parseInt(indexMatchValue[1]) == index)) {
                        needToSortDirs.push(srcName)
                    }

                    needToSortDirs.push(dir)
                } else {
                    needToSortDirs.push(dir)

                    if ((index != 0) && (parseInt(indexMatchValue[1]) == index)) {
                        needToSortDirs.push(srcName)
                    }
                }
            }
        }
    }))

    if (sortDir && needToSortDirs.length == 0)
        sortDir = false

    if (sortDir) {
        logger.debug(needToSortDirs)
        for (let i = 0; i < needToSortDirs.length; i++) {
            let indexRegex = new RegExp("^(\\d{4})_(.*)")
            let indexMatchValue = indexRegex.exec(needToSortDirs[i])

            if (indexMatchValue != null) {
                targetFileIndex = String(i + 1).padStart(4,'0')
                targetFilePath = rootPath + "/" + relPath + "/" + targetFileIndex + "_" + indexMatchValue[2]
                srcFilePath = rootPath + "/" + relPath + "/" + needToSortDirs[i]

                if (!(fs.existsSync(targetFilePath))) {
                    logger.debug(srcFilePath + " --> " + targetFilePath)
                    fse.moveSync(srcFilePath, targetFilePath)
                }
            }
        }
    } else {
        logger.debug(needToSortFiles)

        if (index != 0 && srcName != "") {
            // 缓存附件索引
            if (fs.existsSync(rootPath + "/" + relPath + "/images"))
                sortSubProjectFiles(rootPath, relPath + "/images", srcName.split("_")[0], "9999")

            if (fs.existsSync(rootPath + "/" + relPath + "/refers"))
                sortSubProjectFiles(rootPath, relPath + "/refers", srcName.split("_")[0], "9999")

            // 由于resort to是将重新排序的放在指定位置，然后重新排序，所以要采用逆序整合，防止后移踩踏
            for (let i = (needToSortFiles.length - 1); i >= 0; i--) {
                let indexRegex = new RegExp("^(\\d{4})_(.*)")
                let indexMatchValue = indexRegex.exec(needToSortFiles[i])

                if (indexMatchValue != null) {
                    targetFileIndex = String(i + 1).padStart(4,'0')
                    targetFilePath = rootPath + "/" + relPath + "/" + targetFileIndex + "_" + indexMatchValue[2]
                    srcFilePath = rootPath + "/" + relPath + "/" + needToSortFiles[i]

                    if (!(fs.existsSync(targetFilePath))) {
                        logger.debug(srcFilePath + " --> " + targetFilePath)

                        replaceDocumentIndex(srcFilePath, targetFilePath)
                        fse.removeSync(srcFilePath)

                        // 当前resort to的文件的附件已经调整到了9999索引，这里不需要动，后面单独处理
                        if (index != 0 && srcName != "" && needToSortFiles[i] == srcName)
                            continue

                        if (fs.existsSync(rootPath + "/" + relPath + "/images"))
                            sortSubProjectFiles(rootPath, relPath + "/images", indexMatchValue[1], targetFileIndex)

                        if (fs.existsSync(rootPath + "/" + relPath + "/refers"))
                            sortSubProjectFiles(rootPath, relPath + "/refers", indexMatchValue[1], targetFileIndex)
                    }
                }
            }

            // 修正附件索引
            if (fs.existsSync(rootPath + "/" + relPath + "/images"))
                sortSubProjectFiles(rootPath, relPath + "/images", "9999", String(index).padStart(4,'0'))

            if (fs.existsSync(rootPath + "/" + relPath + "/refers"))
                sortSubProjectFiles(rootPath, relPath + "/refers", "9999", String(index).padStart(4,'0'))
        } else {
            // 由于resort是将重新排序的放在最后，然后重新排序，所以要采用顺序整合
            for (let i = 0; i < needToSortFiles.length; i++) {
                let indexRegex = new RegExp("^(\\d{4})_(.*)")
                let indexMatchValue = indexRegex.exec(needToSortFiles[i])

                if (indexMatchValue != null) {
                    targetFileIndex = String(i + 1).padStart(4,'0')
                    targetFilePath = rootPath + "/" + relPath + "/" + targetFileIndex + "_" + indexMatchValue[2]
                    srcFilePath = rootPath + "/" + relPath + "/" + needToSortFiles[i]

                    if (!(fs.existsSync(targetFilePath))) {
                        logger.debug(srcFilePath + " --> " + targetFilePath)

                        replaceDocumentIndex(srcFilePath, targetFilePath)
                        fse.removeSync(srcFilePath)

                        if (fs.existsSync(rootPath + "/" + relPath + "/images"))
                            sortSubProjectFiles(rootPath, relPath + "/images", indexMatchValue[1], targetFileIndex)

                        if (fs.existsSync(rootPath + "/" + relPath + "/refers"))
                            sortSubProjectFiles(rootPath, relPath + "/refers", indexMatchValue[1], targetFileIndex)
                    }
                }
            }
        }
    }
}

/**
 * 
 * @param {string} rootPath
 * @param {string} srcPath
 * @returns 
 */
function sortDocument(rootPath: string, srcPath: string): { status: boolean } {
    let projectDirPathInfo = new RegExp("(([^./]*/\\d{0,4}_[^./]*/)*[^./]*)(/\\d{0,4}_[^./]*)$")
    let projectFilePathInfo = new RegExp("(([^./]*/\\d{0,4}_[^/]*/)*[^./]+)/\\d{0,4}_[^./]*\\.md$")
    let projectSrcPathInfo = new RegExp("(([^./]*/\\d{0,4}_[^/]*/)*(src|docs))$")
    let srcRelativePath = srcPath.trim().replace(rootPath, "").replace(/\\/g, "/").replace(/^\//, "")
    let refreshReadmePath =  ""
    let refreshReadmeSubPath = ""

    logger.debug("rootPath: " + rootPath + " srcPath: " + srcPath + " relative path: " + srcRelativePath)
    let matchValue = projectDirPathInfo.exec(srcRelativePath)
    if (matchValue != null) {
        sortSubProjectDocs(rootPath, matchValue[1], true)

        refreshReadmePath = rootPath + "/" + srcRelativePath.replace(matchValue[3], "") + "/../README.md"
        refreshReadmeSubPath = rootPath + "/" + srcRelativePath.replace(matchValue[3], "")
    }

    matchValue = projectFilePathInfo.exec(srcRelativePath)
    if (matchValue != null) {
        sortSubProjectDocs(rootPath, matchValue[1], false)

        refreshReadmePath = rootPath + "/" + matchValue[1] + "/../README.md"
        refreshReadmeSubPath = rootPath + "/" + matchValue[1]
    }

    matchValue = projectSrcPathInfo.exec(srcRelativePath)
    if (matchValue != null) {
        let files = fs.readdirSync(rootPath + "/" + matchValue[1])

        if (files.length > 0 && files[0].endsWith(".md")) {
            sortSubProjectDocs(rootPath, matchValue[1], false)
        } else {
            sortSubProjectDocs(rootPath, matchValue[1], true)
        }

        refreshReadmePath =  rootPath + "/" + srcRelativePath + "/../" + "README.md"
        refreshReadmeSubPath = rootPath + "/" + srcRelativePath
    }

    tablejs.refreshReadmeDocsTable(refreshReadmePath, refreshReadmeSubPath)

    return {"status": true}
}

/**
 * 
 * @param {string} rootPath
 * @param {string} srcPath
 * @returns 
 */
function resortDocument(rootPath: string, srcPath: string): { status: boolean } {
    let projectDirPathInfo = new RegExp("(([^./]*/\\d{0,4}_[^./]*/)*[^./]*)(/(\\d{0,4})_([^./]*))$")
    let projectFilePathInfo = new RegExp("(([^./]*/\\d{0,4}_[^/]*/)*[^./]+)(/(\\d{0,4})_([^./]*\\.md))$")
    let srcRelativePath = srcPath.trim().replace(rootPath, "").replace(/\\/g, "/").replace(/^\//, "")
    let lastIndex = 0
    let currentIndex = 0
    let srcFilePath = ""
    let targetFileIndex = ""
    let targetFilePath = ""
    let relPath = ""

    logger.debug("resort rootPath: " + rootPath + " srcPath: " + srcPath + " relative path: " + srcRelativePath)
    let matchValue = projectDirPathInfo.exec(srcRelativePath)
    if (matchValue != null) {
        lastIndex = projectjs.getLastDocInfo(rootPath + "/" + matchValue[1]).index
        currentIndex = parseInt(matchValue[4])

        if (lastIndex > currentIndex) {
            srcFilePath = rootPath + "/" + srcRelativePath
            targetFileIndex = String(lastIndex + 1).padStart(4,'0')
            targetFilePath = rootPath + "/" + matchValue[1] + "/" + targetFileIndex + "_" + matchValue[5]

            logger.debug(srcFilePath + " --> " + targetFilePath)
            if (!(fs.existsSync(targetFilePath))) {
                fse.moveSync(srcFilePath, targetFilePath)
            }
        }
    }

    matchValue = projectFilePathInfo.exec(srcRelativePath)
    if (matchValue != null) {
        lastIndex = projectjs.getLastDocInfo(rootPath + "/" + matchValue[1]).index
        currentIndex = parseInt(matchValue[4])

        if (lastIndex > currentIndex) {
            targetFileIndex = String(lastIndex + 1).padStart(4,'0')
            targetFilePath = rootPath + "/" + matchValue[1] + "/" + targetFileIndex + "_" + matchValue[5]
            srcFilePath = rootPath + "/" + srcRelativePath
            relPath = matchValue[1]

            if (!(fs.existsSync(targetFilePath))) {
                logger.debug(srcFilePath + " --> " + targetFilePath)

                replaceDocumentIndex(srcFilePath, targetFilePath)
                fse.removeSync(srcFilePath)

                if (fs.existsSync(rootPath + "/" + relPath + "/images"))
                    sortSubProjectFiles(rootPath, relPath + "/images", matchValue[4], targetFileIndex)

                if (fs.existsSync(rootPath + "/" + relPath + "/refers"))
                    sortSubProjectFiles(rootPath, relPath + "/refers", matchValue[4], targetFileIndex)
            }
        }
    }

    sortDocument(rootPath, srcPath)

    return {"status": true}
}

/**
 * 
 * @param {string} rootPath
 * @param {string} srcPath
 * @param {number} index
 * @returns 
 */
function resortDocumentTo(rootPath: string, srcPath: string, index: number): { status: boolean } {
    let projectDirPathInfo   = new RegExp("(([^./]*/\\d{0,4}_[^./]*/)*[^./]*)(/\\d{0,4}_[^./]*)$")
    let projectFilePathInfo  = new RegExp("(([^./]*/\\d{0,4}_[^/]*/)*[^./]+)/\\d{0,4}_[^./]*\\.md$")
    let srcRelativePath      = srcPath.trim().replace(rootPath, "").replace(/\\/g, "/").replace(/^\//, "")
    let refreshReadmePath    = ""
    let refreshReadmeSubPath = ""

    logger.debug("rootPath: " + rootPath + " srcPath: " + srcPath + " relative path: " + srcRelativePath)
    let matchValue = projectDirPathInfo.exec(srcRelativePath)
    if (matchValue != null) {
        sortSubProjectDocs(rootPath, matchValue[1], true, path.basename(srcPath), index)

        refreshReadmePath = rootPath + "/" + srcRelativePath.replace(matchValue[3], "") + "/../README.md"
        refreshReadmeSubPath = rootPath + "/" + srcRelativePath.replace(matchValue[3], "")
    }

    matchValue = projectFilePathInfo.exec(srcRelativePath)
    if (matchValue != null) {
        sortSubProjectDocs(rootPath, matchValue[1], false, path.basename(srcPath), index)

        refreshReadmePath = rootPath + "/" + matchValue[1] + "/../README.md"
        refreshReadmeSubPath = rootPath + "/" + matchValue[1]
    }

    tablejs.refreshReadmeDocsTable(refreshReadmePath, refreshReadmeSubPath)

    return {"status": true}
}

export {
    sortDocument,
    resortDocument,
    resortDocumentTo,
}
