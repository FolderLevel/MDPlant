import * as fs from "fs"
import * as path from "path"
import { Logger } from "./logger"
import * as menujs from "./menu"

const logger = new Logger("merge")

/**
 * 
 * @param {string} rootPath
 * @param {string} srcPath
 * @returns 
 */
function mergeDocument(rootPath: string, srcPath: string): { status: boolean; content: string } {

    logger.debug(rootPath)
    logger.debug(srcPath)

    let files: string[] = []
    let needToMergeFiles: string[] = []
    let contentArray = ["\n"]
    let docsPathDir = ""
    let mergeDocName = ""

    let pathRE = new RegExp("(.*/)?(docs|src)/((\\d{4})_[^./]*.md)", "g")
    let matchValue = pathRE.exec(srcPath)
    if (matchValue != null) {
        if (matchValue[1] == undefined) {
            docsPathDir = rootPath + "/" + matchValue[2]
            mergeDocName = path.basename(rootPath)
        } else {
            docsPathDir = rootPath + "/" + matchValue[1] + "/" + matchValue[2]
            mergeDocName = path.basename(matchValue[1])
        }

        files = fs.readdirSync(docsPathDir)
        files.forEach((dir => {
            let indexRegex = new RegExp("^(\\d{4})_")
            let indexMatchValue = indexRegex.exec(dir.trim())
            if (indexMatchValue != null && !(dir.startsWith("0000_"))) {
                needToMergeFiles.push(dir)
            }
        }))

        for (let i = 0; i < needToMergeFiles.length; i++) {
            let startLine = -1
            let convertFirstLevelHeadings = true

            let fileContent = fs.readFileSync(docsPathDir + "/" + needToMergeFiles[i], 'utf8').split(/\r?\n/)

            for (let j = 0; j < fileContent.length; j++) {
                if(fileContent[j].trim().length != 0 && startLine == -1) {
                    startLine = j + 1

                    continue
                }

                if (startLine != -1) {
                    let menuRegex = new RegExp("^(#{1,} ).*")
                    let menuMatchValue = menuRegex.exec(fileContent[j])
                    if (menuMatchValue != null && fileContent[j - 1].trim() == ""
                            && ((j + 1 < fileContent.length) && fileContent[j + 1].trim() == "")) {
                        
                        if (menuMatchValue[1] == "## ")
                            convertFirstLevelHeadings = false

                        break
                    }
                }
            }

            if (convertFirstLevelHeadings) {
                menujs.generateMenuIndex("", fileContent, true, true, true)

                let menuStart = -1
                let menuEnd = -1
                for (let j = startLine; j < fileContent.length; j++) {

                    if (fileContent[j].trim().toLowerCase().startsWith("# menu")
                            || (fileContent[j].trim().toLowerCase().startsWith("# 目录"))) {
                        menuStart = j

                        continue
                    }
                    
                    if (fileContent[j].trim().toLowerCase().startsWith("#") && menuStart != -1) {
                        menuEnd = j

                        break
                    }
                    
                }

                fileContent = fileContent.slice(0, menuStart).concat(fileContent.slice(menuEnd, fileContent.length))

                for (let j = startLine; j < fileContent.length; j++) {
                    let menuRegex = new RegExp("^([#]+ ).*")
                    let menuMatchValue = menuRegex.exec(fileContent[j])
                    let docLinkRegex = new RegExp("\\[([^\\\/]*)\\]\\((([^\\\/]*\\/)*([^\\\/]*))\\)")
                    let docLinkMatchValue = docLinkRegex.exec(fileContent[j])

                    if (menuMatchValue != null && fileContent[j - 1].trim() == ""
                            && ((j + 1 < fileContent.length) && fileContent[j + 1].trim() == "")) {
                        fileContent[j] = fileContent[j].replace(/# /, "## ")
                    }

                    if (docLinkMatchValue != null) {
                        if (docLinkMatchValue[1] == docLinkMatchValue[4]) {
                            let suffix = path.extname(docLinkMatchValue[1]).toLowerCase()
                            let imageSuffixArray = ['.xbm','.tif','.pjp','.svgz','.jpg','.jpeg','.ico','.tiff','.gif','.svg','.jfif','.webp','.png','.bmp','.pjpeg','.avif']
                            if (!imageSuffixArray.includes(suffix)) {
                                logger.info(docLinkMatchValue[0] + " --> " + docLinkMatchValue[2])
                                fileContent[j] = fileContent[j].replace(docLinkMatchValue[0], docLinkMatchValue[2])
                            }
                        }
                    }
                }
            }

            contentArray = contentArray.concat(fileContent)
        }
    }

    menujs.generateMenuIndex("", contentArray, true, false, false)

    let mergedFilePath = docsPathDir + "/" + (mergeDocName.replace(/^\d{0,4}[_-]/, "") + ".md")

    fs.writeFileSync(mergedFilePath, "<h1 align=\"center\"> " + mergeDocName.replace(/^\d{0,4}[_-]/, "") + " </h1>\n\n# Menu\n\n" + menujs.generateMenu(contentArray).content + contentArray.join("\n"))

    return {"status": true, "content": mergedFilePath}
}

export {
    mergeDocument,
}
