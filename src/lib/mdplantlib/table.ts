import * as fs from "fs"
import * as path from "path"
import * as xlsx from "node-xlsx"
import { Logger } from "./logger"

const logger = new Logger("table")

type TableLink = { title?: string; link?: string }
type TableCell = string | number | boolean | TableLink | TableLink[]
type TableEntry = { titles: string[]; datas: TableCell[][] }

function fileAbstract(fileContentArr: string[]): string {
    let startAbstract = false

    for (let i = 0; i < fileContentArr.length; i++) {
        let element = fileContentArr[i].trim()

        if (element.startsWith("# ") && (startAbstract == false)) {
            startAbstract = true
            continue
        }

        if (startAbstract) {
            if (element.length > 0) {
                if (element.startsWith("#"))
                    return "Empty Abstract"
                else
                    return element
            }
        }
    }

    return "Empty Abstract"
}

function fileAuthor(fileContentArr: string[]): string {
    let startAuthorInfoTable = false

    for (let i = 0; i < fileContentArr.length; i++) {
        let element = fileContentArr[i].trim()

        if (element.includes("Date") && element.includes("Author") && element.includes("Email") && (startAuthorInfoTable == false)) {
            let nextElement = fileContentArr[i + 1].trim()
            if (nextElement.includes("-") && nextElement.includes("|")) {
                startAuthorInfoTable = true

                i++
                continue
            }
        }

        if (startAuthorInfoTable && element.includes("|")) {
            let authorInfos = element.split("|")
            if (authorInfos.length == 4) {
                return authorInfos[1].trim()
            }
        }
    }

    return "N/A"
}

/**
 * 
 * @param {string | null | undefined} outputFile 
 * @param {string} subProjectDocsDir 
 * @param {boolean} author
 * @returns 
 */
function refreshReadmeDocsTable(outputFile: string | null | undefined, subProjectDocsDir: string, author: boolean = false): { status: boolean; content: string } {

    if (subProjectDocsDir == undefined || subProjectDocsDir == null)
        return {"status": true, "content": ""}

    logger.debug("refresh readme: " + subProjectDocsDir)

    let subProjectDocsDirName = path.basename(subProjectDocsDir)
    let subProjectIndexRegex = new RegExp("^(\\d{0,4})_")
    let outputString = "NO.  |文件名称|摘要"
    if (author)
        outputString += "|作者"
    outputString += "\n"

    outputString += ":---:|:--|:--"
    if (author)
        outputString += "|:--"
    outputString += "\n"

    let outputStringArray: string[] = []

    let dirs = fs.readdirSync(subProjectDocsDir)
    dirs.forEach((dir) => {
        let dirFlag = false
        let subProjectWorkFile = ""

        if (fs.lstatSync(subProjectDocsDir + "/" + dir).isDirectory()) {
            subProjectWorkFile = subProjectDocsDir + "/" + dir + "/README.md"

            dirFlag = true
        } else {
            subProjectWorkFile = subProjectDocsDir + "/" + dir
        }

        if (!subProjectWorkFile.endsWith(".md"))
            return

        if (fs.existsSync(subProjectWorkFile)) {
            let indexMatch = subProjectIndexRegex.exec(dir.toString())
            if (indexMatch) {
                let subPorjectIndex = indexMatch[1]
                const fileContent = fs.readFileSync(subProjectWorkFile, 'utf8').split(/\r?\n/)
                let fabs = fileAbstract(fileContent)
                let fAuthor = fileAuthor(fileContent)

                if (dirFlag) {
                    if (author)
                        outputStringArray.push(subPorjectIndex + " | [" + dir.toString().split(subPorjectIndex + "_").join("") + "](" + (subProjectDocsDirName + "/" + dir + "/README.md").replace(/ /g, "%20") + ") | " + fabs + " | " + fAuthor)
                    else
                        outputStringArray.push(subPorjectIndex + " | [" + dir.toString().split(subPorjectIndex + "_").join("") + "](" + (subProjectDocsDirName + "/" + dir + "/README.md").replace(/ /g, "%20") + ") | " + fabs)
                } else {
                    if (author)
                        outputStringArray.push(subPorjectIndex + " | [" + dir.toString().split(subPorjectIndex + "_").join("").split("\.md").join("") + "](" + (subProjectDocsDirName + "/" + dir).replace(/ /g, "%20") + ") | " + fabs + " | " + fAuthor)
                    else
                        outputStringArray.push(subPorjectIndex + " | [" + dir.toString().split(subPorjectIndex + "_").join("").split("\.md").join("") + "](" + (subProjectDocsDirName + "/" + dir).replace(/ /g, "%20") + ") | " + fabs)
                }
            }
        }
    })

    outputString += outputStringArray.reverse().join("\n")

    if (outputFile != undefined || outputFile != null) {
        const fileContent = fs.readFileSync(outputFile, 'utf8').split(/\r?\n/)
        var outFile = fs.createWriteStream(outputFile)
        var docsFlag = false

        for (let row = 0; row < fileContent.length; row++) {
            // 写入docs部分
            if (fileContent[row].startsWith("#") && fileContent[row].includes("# docs")) {
                outFile.write(fileContent[row] + "\n\n")
                outFile.write(outputString + "\n")

                docsFlag = true

                continue
            }

            // 判断docs部分是否结束
            if (docsFlag && fileContent[row].startsWith("#") && fileContent[row].includes("# ")){
                outFile.write("\n")
                docsFlag = false
            }

            // 原来的docs部分不用写，忽略
            if (docsFlag)
                continue

            if (row == (fileContent.length - 1)) {
                if (fileContent[row].trim().length == 0)
                    break
            }

            outFile.write(fileContent[row] + "\n")
        }
        outFile.close()
    }

    return {"status": true, "content": outputString}
}

/**
 * 
 * @param {string} rootPath 
 * @param {string} relativePath 
 * @param {string} suffix
 * @returns 
 */
function generateIndexTable(rootPath: string, relativePath: string, suffix: string = ""): { status: boolean; content: string } {

    logger.debug("generate index table: " + rootPath + "/" + relativePath)

    let subProjectIndexRegex = new RegExp("^(\\d{0,4})_")
    let outputString = "NO.  |文件名称\n"
    outputString += ":---:|:--\n"
    let outputStringArray: string[] = []
    let subProjectDocsDir = rootPath + "/" + relativePath

    let dirs = fs.readdirSync(subProjectDocsDir)
    dirs.forEach((dir) => {
        let subProjectWorkFile = subProjectDocsDir + "/" + dir

        if ((suffix.length != 0) && (!subProjectWorkFile.endsWith(suffix)))
            return

        // just for file
        if (!fs.lstatSync(subProjectWorkFile).isDirectory()) {
            if (fs.existsSync(subProjectWorkFile)) {
                let indexMatch = subProjectIndexRegex.exec(dir.toString())
                if (indexMatch) {
                    let subPorjectIndex = indexMatch[1]

                    outputStringArray.push(subPorjectIndex + " | [" + dir.toString().split(subPorjectIndex + "_").join("") + "](" + (relativePath+ "/" + dir).replace(/ /g, "%20") + ")")
                }
            }
        }
    })

    outputString += outputStringArray.reverse().join("\n")

    return {"status": true, "content": outputString}
}

function ZHCharLength(str: string): number {
    // 中文
    var re = /[\u4E00-\u9FA5]/g
    // 中文标点
    var reg = /[\u3002|\uff1f|\uff01|\uff0c|\u3001|\uff1b|\uff1a|\u201c|\u201d|\u2018|\u2019|\uff08|\uff09|\u300a|\u300b|\u3008|\u3009|\u3010|\u3011|\u300e|\u300f|\u300c|\u300d|\ufe43|\ufe44|\u3014|\u3015|\u2026|\u2014|\uff5e|\ufe4f|\uffe5]/g
    var hanziNum = 0
    var biaodianNum = 0
    var value = str
    let hanziMatches = value.match(re)
    if(hanziMatches != null){
        hanziNum = hanziMatches.length
    }
    let punctuationMatches = value.match(reg)
    if(punctuationMatches != null){
        biaodianNum = punctuationMatches.length
    }

    //中文字及符号均为两个字节
    return hanziNum + biaodianNum
}

/**
 * 
 * @param {string} configPath 
 * @param {string} table json key
 * @returns 
 */
function convertJSON2Table(configPath: string, table: string): { status: boolean; content: string } {
    let outputStringArray: string[] = []
    let splitString = " | "
    let tableEntry: TableEntry = { titles: [], datas: [] }
    let maxColume = 0

    try {
        const data = fs.readFileSync(configPath, 'utf8')

        // parse JSON string to JSON object
        const config = JSON.parse(data)
        tableEntry = eval('config.' + table) as TableEntry
    } catch (err) {
        logger.debug(`Error reading file from disk: ${err}`)

        return {"status": false, "content": ""}
    }

    if (tableEntry.hasOwnProperty("titles") && tableEntry.hasOwnProperty("datas")) {
        let countColume = 0
        let countRow = 1
        let rowString: (string | number | boolean)[] = []

        rowString = []
        tableEntry.titles.forEach(element => {
            if (countColume == 0)
                rowString.push(element.padEnd(4, " "))
            else
                rowString.push(element)

            countColume++
            if (countColume > maxColume)
                maxColume = countColume
        })
        outputStringArray.push(rowString.join(splitString))

        tableEntry.datas.forEach(e => {
            rowString = []
            countColume = 0

            e.forEach(element => {
                if (typeof(element) == "string" && element.trim() == "*" && countColume == 0) {
                    rowString.push(("" + countRow).padStart(4, "0"))
                } else if (Array.isArray(element)) {
                    let arrayString: string[] = []
                    arrayString.push("<ul>")

                    element.forEach(link => {
                        if (link.hasOwnProperty("title") && link.hasOwnProperty("link")) {
                            arrayString.push("<li> [" + link.title+ "](" + link.link + ") </li>")
                        }
                    })
                    arrayString.push("</ul>")
                    rowString.push(arrayString.join(" "))
                } else if (typeof(element) == "object") {
                    if (element.hasOwnProperty("title") && element.hasOwnProperty("link")) {
                        rowString.push("[" + element.title+ "](" + element.link + ")")
                    }
                } else {
                    if (countColume == 0) {
                        rowString.push(("" + element).padStart(4, "0"))
                    } else {
                        rowString.push(element)
                    }
                }

                countColume++
                if (countColume > maxColume)
                    maxColume = countColume
            })

            outputStringArray.push(rowString.join(splitString))
            countRow++
        })

        let titleLengthIndex = outputStringArray[0].split(splitString).length - 1
        rowString = []
        for (let i = 0; i < maxColume; i ++) {
            rowString.push("-----")

            if (titleLengthIndex < i)
                outputStringArray[0] += splitString + "empty"
        }
        outputStringArray.splice(1, 0, rowString.join(splitString.trim()))
    }
    
    return {"status": true, "content": outputStringArray.join("\n")}
}

/**
 * 
 * @param {string} configPath 
 * @returns 
 */
function convertExcel2Table(configPath: string): { status: boolean; content: string } {
    let outputString: string[] = []
    let splitString = " | "
    let workSheetsFromFile: { name: string; data: unknown[][] }[]

    try {
        workSheetsFromFile = xlsx.parse<unknown[]>(configPath);
    } catch (err) {
        logger.debug(`Error reading file from disk: ${err}`)

        return {"status": false, "content": ""}
    }

    workSheetsFromFile.forEach(sheet => {
        const rows = sheet.data
        if (rows.length == 0)
            return

        let workSheet: string[] = []
        let workSheetTmp: string[][] = []
        let countRow = 0
        let maxColume = 0
        let rowString: string[] = []
        let colAlignSize: number[] = []
        rows.forEach(row => {
            if (row.length == 0)
                return

            let rowString: string[] = []
            let countColume = 0
            let i = 0
            row.forEach(element => {
                if (colAlignSize.length < (i + 1))
                    colAlignSize.push(0)

                if (typeof(element) == "string") {
                    const cell = element.trim()
                    if (countColume == 0) {
                        if (cell == "*") {
                            rowString.push(("" + countRow).padStart(4, "0"))
                        } else {
                            if (countRow == 0)
                                rowString.push(cell.padEnd(4, " "))
                            else
                                rowString.push(cell.padStart(4, "0"))
                        }
                    } else {
                        rowString.push(cell)
                    }
                } else {
                    rowString.push("" + element)
                }

                let lastCell = rowString[rowString.length - 1]
                let elementLength = lastCell.length + ZHCharLength(lastCell)
                if (colAlignSize[i] < elementLength)
                    colAlignSize[i] = elementLength

                countColume++
                i++
            })

            workSheetTmp.push(rowString)

            countRow++

            if (maxColume < countColume)
                maxColume = countColume
        })

        console.log(colAlignSize)

        workSheetTmp.forEach(element => {
            for (let i = 0; i < element.length; i++) {
                element[i] = element[i].toString().padEnd(colAlignSize[i] - ZHCharLength(element[i].toString()), " ")
            }

            workSheet.push(element.join(splitString))
        })

        let titleLengthIndex = workSheet[0].split(splitString).length - 1
        rowString = []
        for (let i = 0; i < maxColume; i ++) {
            rowString.push("".padEnd(colAlignSize[i], "-"))

            if (titleLengthIndex < i)
                workSheet[0] += splitString + "empty"
        }
        workSheet.splice(1, 0, rowString.join(splitString.replace(/ /g, "-")))

        outputString.push(workSheet.join("\n"))
    })

    return {"status": true, "content": outputString.join("\n\n")}
}

/**
 * 
 * @param {string} configPath 
 * @returns 
 */
function convertCSV2Table(configPath: string): { status: boolean; content: string } {
    let outputString: string[] = []
    let outputStringTmp: string[][] = []
    let splitString = " | "
    let data

    try {
        data = fs.readFileSync(configPath, 'utf8')
    } catch (err) {
        logger.debug(`Error reading file from disk: ${err}`)

        return {"status": false, "content": ""}
    }

    let countRow = 0
    let maxColume = 0
    let rowString: string[] = []
    let colAlignSize: number[] = []
    data.split(/\r?\n/).forEach(e => {
        let countColume = 0
        let rowString: string[] = []
        let i = 0

        e.split(",").forEach(element => {
            element = element.trim()

            if (colAlignSize.length < (i + 1))
                colAlignSize.push(0)

            if (countColume == 0) {
                if (element.trim() == "*") {
                    rowString.push(("" + countRow).padStart(4, "0"))
                } else {
                    if (countRow == 0)
                        rowString.push(element.padEnd(4, " "))
                    else
                        rowString.push(element.padStart(4, "0"))
                }
            } else {
                rowString.push(element)
            }

            let lastCell = rowString[rowString.length - 1]
            let elementLength = lastCell.length + ZHCharLength(lastCell)
            if (colAlignSize[i] < elementLength)
                colAlignSize[i] = elementLength

            countColume++
            i++
        })

        outputStringTmp.push(rowString)

        countRow++

        if (maxColume < countColume)
            maxColume = countColume
    })

    console.log(colAlignSize)

    outputStringTmp.forEach(element => {
        for (let i = 0; i < element.length; i++) {
            element[i] = element[i].toString().padEnd(colAlignSize[i] - ZHCharLength(element[i].toString()), " ")
        }

        outputString.push(element.join(splitString))
    })

    let titleLengthIndex = outputString[0].split(splitString).length - 1
    rowString = []
    for (let i = 0; i < maxColume; i ++) {
        rowString.push("".padEnd(colAlignSize[i], "-"))

        if (titleLengthIndex < i)
            outputString[0] += splitString + "empty"
    }
    outputString.splice(1, 0, rowString.join(splitString.replace(/ /g, "-")))

    return {"status": true, "content": outputString.join("\n")}
}

/**
 * 
 * @param {string} lineValue 
 * @returns 
 */
function convertRowColume2Table(lineValue: string): { status: boolean; content: string } {
    let tableRegex = new RegExp("\\s*table[\\s:]*(\\d*)[x\\s*]*(\\d*)\\s*")
    let outputString = ""
    let status = false

    let tableMatchValue = tableRegex.exec(lineValue)
    if (tableMatchValue != null) {
        let rows = Number(tableMatchValue[1])
        let cols = Number(tableMatchValue[2])

        for (let row = 0; row < rows + 2; row++) {
            for (let col = 0; col < cols; col++) {
                if (row == 0) {
                    if (col == 0) {
                        outputString += "NO.  "
                    } else {
                        outputString += "col " + (col + 1)
                    }

                    if (col != (cols - 1)) {
                        outputString += " | "
                    }
                }

                if (row == 1) {
                    outputString += "-----"

                    if (col != (cols - 1)) {
                        outputString += "-|-"
                    }
                }

                if (row > 1) {

                    if (col == 0) {
                        outputString += (" " + ((row - 2) + 1)).padEnd(5, ' ')
                    } else {
                        outputString += "     "
                    }

                    if (col != (cols - 1)) {
                        outputString += " | "
                    }
                }
            }

            if (row != (rows + 2 - 1))
                outputString += "\n"
        }

        status = true
    }

    return {"status": status, "content": outputString}
}

/**
 * 
 * @param {string} lineValue 
 * @param {string} rootPath 
 * @returns 
 */
function convert2Table(lineValue: string, rootPath: string): { status: boolean; content: string } {
    let tableRowColumeRegex = new RegExp("\\s*table[\\s:]*(\\d*)[x\\s*]*(\\d*)\\s*", "g")
    let tableRegex = new RegExp("\\s*table[\\s:]*([\\w\\/]*\\.(json|csv|txt|xlsx|xls))", "g")

    let tableMatchValue = tableRowColumeRegex.exec(lineValue)
    if (tableMatchValue != null && tableMatchValue[1].length != 0 && tableMatchValue[2].length != 0) {
        // logger.debug("row colume: " + tableMatchValue)
        return convertRowColume2Table(lineValue)
    }

    tableMatchValue = tableRegex.exec(lineValue)
    if (tableMatchValue != null) {
        // logger.debug("json: " + tableMatchValue)
        if (tableMatchValue[2] == "json")
            return convertJSON2Table(rootPath + "/" + tableMatchValue[1], "table")
        else if (tableMatchValue[2] == "csv" || tableMatchValue[2] == "txt")
            return convertCSV2Table(rootPath + "/" + tableMatchValue[1])
        else if (tableMatchValue[2] == "xlsx" || tableMatchValue[2] == "xls")
            return convertExcel2Table(rootPath + "/" + tableMatchValue[1])
    }

    return {"status": false, "content": ""}
}

/**
 * 
 * @param {string[]} textBlock 
 * @param {string} rootPath 
 * @param {number} cursorOffset 
 * @returns 
 */
function isTable(textBlock: string[], rootPath: string, cursorOffset: number): { status: boolean; content: string } {
    let found = false
    let content = ""
    let matchValue
    // let tableRE = new RegExp("^table[\\s:]*((\\d*)[x\\s*]*(\\d*)|([\\w\\/]*\\.(json|csv|xlsx|xls)))$", "g")
    let tableRE = new RegExp("\\s*(table[\\s:]*([\\w\\/]*\\.(json|csv|txt|xlsx|xls)?))", "g")
    let tableRowColumeRegex = new RegExp("\\s*(table[\\s:]*(\\d*)[x\\s*]*(\\d*))\\s*", "g")

    logger.debug("enter isTable")

    if (textBlock[cursorOffset].trim().length == 0)
        return {"status": false, "content": content}

    let startLine = 0
    for (let i = 0; i < textBlock.length; i++) {
        if (textBlock[i].trim().length != 0) {
            startLine = i
            break
        }
    }

    if (textBlock[startLine].trim().replace(/\s*/gi, "").startsWith("NO.|文件名称|摘要")) {
        logger.debug("table for docs found")
        found = true
        content = "docs"
    }else if (textBlock[startLine].trim().replace(/\s*/gi, "") == "NO.|文件名称") {
        logger.debug("table for index found")
        found = true
        content = "index"
    } else if ((matchValue = tableRE.exec(textBlock[cursorOffset].trim()))
            || (matchValue = tableRowColumeRegex.exec(textBlock[cursorOffset].trim()))){
        logger.debug("table cmd found")
        found = true
        content = matchValue[1]
    } else if ((matchValue = tableRE.exec(textBlock[startLine].trim()))
            || (matchValue = tableRowColumeRegex.exec(textBlock[startLine].trim()))) {
        logger.debug("table found")
        found = true
        content = matchValue[1]
    }

    return {"status": found, "content": content}
}

export {
    refreshReadmeDocsTable,
    convertJSON2Table,
    convertExcel2Table,
    convertRowColume2Table,
    convert2Table,
    isTable,
    generateIndexTable,
}
