import * as path from "path"
import { Logger } from "./logger"

const logger = new Logger("list")

/**
 * 
 * @param {string} lineText
 * @returns 
 */
function convert2List(lineText: string): { status: boolean; content: string } {
    let outputString = ""
    let imageSuffixArray = ['.xbm','.tif','.pjp','.svgz','.jpg','.jpeg','.ico','.tiff','.gif','.svg','.jfif','.webp','.png','.bmp','.pjpeg','.avif']
    let spaceString = lineText.substring(0, lineText.search(/\S/))
    let suffix = lineText.substring(lineText.lastIndexOf(".") + 1, lineText.length).toLowerCase()
    lineText = lineText.trim().replace(/\\/g, "/")

    if (lineText.length != 0) {
        // revert string
        if (lineText.startsWith("* ") || lineText.startsWith("![") || lineText.includes("](")) {
            if (lineText.indexOf("(") > -1 && lineText.indexOf(")") > -1) {
                if (lineText.indexOf("http") > -1) {
                    outputString = spaceString + lineText.split("[")[1].split("]")[0] + " " + lineText.split("(")[1].split(")")[0]
                } else {
                    let showString = lineText.split("(")[1].split(")")[0].replace(/%20/g, " ")
                    if (!showString.startsWith("/"))
                        outputString = spaceString + showString
                    else
                        outputString = spaceString + showString.replace("/", "")
                }
            }
        } else {
            if (lineText.indexOf(" http") > 0) {
                let lineTextSplit = lineText.split(" http")

                if (lineTextSplit.length = 2)
                    outputString = spaceString + "* [" + lineTextSplit[0].trim() + "](http" + lineTextSplit[1].trim() + ")"
            } else {
                if (imageSuffixArray.includes("." + suffix))
                    outputString = spaceString + "![" + path.basename(lineText) + "](" + (lineText).replace(/ /g, "%20") + ")"
                else
                    outputString = spaceString + "* [" + path.basename(lineText) + "](" + (lineText).replace(/ /g, "%20") + ")"
            }
        }
    }

    logger.debug(lineText + " --> " + outputString)

    return {"status": true, "content": outputString}
}

/**
 * 
 * @param {string[]} textBlock 
 * @param {string} rootPath 
 * @param {number} cursorOffset 
 * @returns 
 */
function isList(textBlock: string[], rootPath: string, cursorOffset: number): { status: boolean; content: string } {
    // https://remarkablemark.org/blog/2019/09/28/javascript-remove-punctuation/
    let punctuation = '\\/\\s!"#$%&\'()*+,./:;<=>?@[\\]^`{|}~';
    // 不能带g参数，使用了能够匹配宽度为0的正则表达式
    let fileRE = new RegExp("^\\/?([^" + punctuation + "]+/?)+(([^\\/]+)?\\.\\w+)?$")
    let refFileRE = new RegExp("^\\s*(src|refers|images)/\\d{4}_.*")
    let titleWithFileRE = new RegExp("^(.+)\\s+([^\\/ ]*/)*\\d{4}_([^\\.\\/]*)", "g")
    let listRE = new RegExp("^(^\\* |!)\\[(.*)\\]\\((.*)\\)$", "g")
    let copyRE = new RegExp("^(copy\\s).*", "g")
    let found = false
    let talbeSplit = "|"
    let matchValue

    logger.debug("enter isList")

    if (textBlock.length >= (cursorOffset + 1) 
            && cursorOffset >= 0 
            && !textBlock[cursorOffset].includes(talbeSplit)) {
        let lineText = textBlock[cursorOffset].trim()
        logger.debug("listText: " + lineText)

        if (lineText.length != 0) {
            if ((matchValue = copyRE.test(lineText))) {
                logger.debug("list skip copy file")
            } else if (lineText.includes(" http")) {
                // zengjf http://zengjf.fun
                logger.debug("list match http")
                found = true
            } else if ((matchValue = fileRE.test(lineText)) && lineText.includes(".")) {
                // docs/0002_unit_test.md
                logger.debug("list match file")
                found = true
            } else if ((matchValue = refFileRE.test(lineText))) {
                // (src|refers|images)/0002_*
                logger.debug("list match ref file")
                found = true
            } else if ((matchValue = listRE.exec(lineText))) {
                // * [0002_unit_test.md](/docs/0002_unit_test.md)
                // ![0002_unit_test.png](/docs/0002_unit_test.png)

                // skip menu
                if (!lineText.includes("](#")) {
                    logger.debug("list match markdown format list")
                    found = true
                }
            } else if ((matchValue = titleWithFileRE.exec(lineText))) {
                // zengjf docs/0002_unit_test.md

                // table test/refers/0004_table.json
                let tableRE = new RegExp("table[\\s:]*((\\d*)[x\\s*]*(\\d*)|([\\w\\/]*\\.(json|csv|xlsx|xls)))", "g")
                let plantumlRE = new RegExp("(plantuml[\\s:]*([\\w\\/]*\\.(puml|plantuml|iuml|pu)?))", "g")
                if (tableRE.exec(textBlock[cursorOffset].trim())) {
                    logger.debug("list skip match table")
                } else if (plantumlRE.exec(textBlock[cursorOffset].trim())) {
                    logger.debug("list skip plantuml file")
                } else {
                    logger.debug("list match title with file")
                    found = true
                }
            }
        }
    } else {
        logger.debug("error with cursorOffset: " + cursorOffset);
    }

    return {"status": found, "content": ""}
}

export {
    convert2List,
    isList,
}
