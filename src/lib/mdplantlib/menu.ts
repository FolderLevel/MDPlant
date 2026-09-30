import { Logger } from "./logger"

const logger = new Logger("menu")

/**
 * 
 * @param {string[]} contentArray 
 * @returns 
 */
function generateMenu(contentArray: string[]): { status: boolean; content: string } {
    let menus: string[] = []

    for (let i = 0; i < contentArray.length; i++) {
        if (contentArray[i].trim().startsWith("#") && (contentArray[i].trim().toLowerCase().indexOf("menu") >= 0
                || contentArray[i].trim().toLowerCase().indexOf("目录") >= 0))
            continue

        if (contentArray[i].trim().startsWith("#") && (contentArray[i].trim().toLowerCase().indexOf("author") >= 0
                || contentArray[i].trim().toLowerCase().indexOf("作者") >= 0))
            continue

        let matchValue
        let fileRE = new RegExp("^(#{1,}) ", "g")
        if (matchValue = fileRE.exec(contentArray[i].trim())) {
            if ((i > 0 && contentArray[i - 1].trim().length == 0) && ((i < (contentArray.length - 1)) && contentArray[i + 1].trim().length == 0)) {
                let prefix = matchValue[1].replace(/^#/, "").replace(/#/g, "  "); 
                let content = contentArray[i].substring(contentArray[i].lastIndexOf("#") + 1).trim()
                var chinese_reg = /[\u3002|\uff1f|\uff01|\uff0c|\u3001|\uff1b|\uff1a|\u201c|\u201d|\u2018|\u2019|\uff08|\uff09|\u300a|\u300b|\u3008|\u3009|\u3010|\u3011|\u300e|\u300f|\u300c|\u300d|\ufe43|\ufe44|\u3014|\u3015|\u2026|\u2014|\uff5e|\ufe4f|\uffe5]/g
                menus.push(prefix + "* [" + content + "](#" + content.replace(/ /g, "-").replace(chinese_reg, "").replace(/[\\'!"#$%&()*+,.\/:;<=>?@\[\]^`{|}~]/g, "") + ")")
            }
        }
    }

    return {"status": true, "content": menus.join("\n")}
}

/**
 * 1. JavaScript 阿拉伯数字与中文数字互相转换
 *   https://juejin.cn/post/6844903473255809038
 * 
 * @param {number|string} digit
 */
function toZhDigit(digit: number | string): string {
    const digits = String(digit)
    const zh = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    const unit = ['千', '百', '十', ''];
    const quot = ['万', '亿', '兆', '京', '垓', '秭', '穰', '沟', '涧', '正', '载', '极', '恒河沙', '阿僧祗', '那由他', '不可思议', '无量', '大数'];

    let breakLen = Math.ceil(digits.length / 4);
    let notBreakSegment = digits.length % 4 || 4;
    let segment: string;
    let zeroFlag: string[] = [], allZeroFlag: string[] = [];
    let result = '';

    while (breakLen > 0) {
        if (!result) { // 第一次执行
            segment = digits.slice(0, notBreakSegment);
            let segmentLen = segment.length;
            for (let i = 0; i < segmentLen; i++) {
                if (segment[i] !== "0") {
                    if (zeroFlag.length > 0) {
                        result += '零' + zh[Number(segment[i])] + unit[4 - segmentLen + i];
                        // 判断是否需要加上 quot 单位
                        if (i === segmentLen - 1 && breakLen > 1) {
                            result += quot[breakLen - 2];
                        }
                        zeroFlag.length = 0;
                    } else {
                        result += zh[Number(segment[i])] + unit[4 - segmentLen + i];
                        if (i === segmentLen - 1 && breakLen > 1) {
                            result += quot[breakLen - 2];
                        }
                    }
                } else {
                    // 处理为 0 的情形
                    if (segmentLen == 1) {
                        result += zh[Number(segment[i])];
                        break;
                    }
                    zeroFlag.push(segment[i]);
                    continue;
                }
            }
        } else {
            segment = digits.slice(notBreakSegment, notBreakSegment + 4);
            notBreakSegment += 4;

            for (let j = 0; j < segment.length; j++) {
                if (segment[j] !== "0") {
                    if (zeroFlag.length > 0) {
                        // 第一次执行zeroFlag长度不为0，说明上一个分区最后有0待处理
                        if (j === 0) {
                            result += quot[breakLen - 1] + zh[Number(segment[j])] + unit[j];
                        } else {
                            result += '零' + zh[Number(segment[j])] + unit[j];
                        }
                        zeroFlag.length = 0;
                    } else {
                        result += zh[Number(segment[j])] + unit[j];
                    }
                    // 判断是否需要加上 quot 单位
                    if (j === segment.length - 1 && breakLen > 1) {
                        result += quot[breakLen - 2];
                    }
                } else {
                    // 第一次执行如果zeroFlag长度不为0, 且上一划分不全为0
                    if (j === 0 && zeroFlag.length > 0 && allZeroFlag.length === 0) {
                        result += quot[breakLen - 1];
                        zeroFlag.length = 0;
                        zeroFlag.push(segment[j]);
                    } else if (allZeroFlag.length > 0) {
                        // 执行到最后
                        if (breakLen == 1) {
                            result += '';
                        } else {
                            zeroFlag.length = 0;
                        }
                    } else {
                        zeroFlag.push(segment[j]);
                    }

                    if (j === segment.length - 1 && zeroFlag.length === 4 && breakLen !== 1) {
                        // 如果执行到末尾
                        if (breakLen === 1) {
                            allZeroFlag.length = 0;
                            zeroFlag.length = 0;
                            result += quot[breakLen - 1];
                        } else {
                            allZeroFlag.push(segment[j]);
                        }
                    }
                    continue;
                }
            }


            --breakLen;
        }

        return result;
    }

    return result
}

/**
 * start: 包含开始
 * end:   包含结束
 * 
 * @param {string[]} menus 
 * @param {int} level 
 * @param {int} start 
 * @param {int} end 
 * @param {string[]} innerIndex 
 */
function menuIndexStr(menus: string[], level: number, start: number, end: number, innerIndex: string[]): void {
    let indexs: number[] = []
    let count = 0

    // console.log("-------------------start-------------------")
    // console.log("level: " + level + ", start: " + start + ", end: " + end)

    for (let i = 0; i < ((end - start) + 1); i++) {
        if (menus[i + start][level + 1] == " ")
            indexs.push(i + start)
    } 

    // console.log("detect indexs: [" + indexs.join(" ") + "]")

    if (indexs.length == 0)
        return
    
    for (let i = 0; i < ((end - start) + 1); i++) {
        if (indexs.includes((i + start))) {
            count++

            // convert to zh
            // if (level == 0) {
            //     innerIndex[i + start] += toZhDigit(count) + "."

            //     continue
            // }
        }

        innerIndex[i + start] += count + "."
    }

    indexs.push(end + 1)

    // console.log(indexs)
    // console.log(innerIndex)
    // console.log("-----------------------end---------------")
    for (let i = 0; i < (indexs.length - 1); i++) {
        if (indexs[i + 1] - indexs[i] > 0) {
            menuIndexStr(menus, level + 1, indexs[i] + 1, indexs[i + 1] - 1,  innerIndex)
        }
    }
}

/**
 * 
 * @param {string} fileName
 * @param {string[]} contentArray 
 * @param {boolean} skipMenu
 * @param {boolean} skipTitle
 * @param {boolean} remove
 * @returns 
 */
function generateMenuIndex(prefix: string, contentArray: string[], skipMenu: boolean, skipTitle = true, remove = false): { status: boolean; content: string } {
    let menus: string[] = []
    let menusFileIndex: number[] = []
    let menusInnerIndex: string[] = []
    let startLine = 0
    let indexFlag = false

    for (let i = 0; i < contentArray.length; i++) {
        if (contentArray[i].trim().startsWith("# ")) {
            startLine = i

            break
        }
    }

    let menuStart = -1
    let menuEnd = -1
    for (let j = startLine; j < contentArray.length; j++) {

        if (contentArray[j].trim().toLowerCase().startsWith("# menu")
                || (contentArray[j].trim().toLowerCase().startsWith("# 目录"))) {
            menuStart = j

            continue
        }

        if (contentArray[j].trim().toLowerCase().startsWith("#") && menuStart != -1) {
            menuEnd = j

            break
        }

    }

    // contentArray = contentArray.slice(0, menuStart).concat(contentArray.slice(menuEnd, contentArray.length))

    if (skipTitle)
        startLine += 1

    for (let i = startLine; i < contentArray.length; i++) {

        if (skipMenu) {
            if (contentArray[i].trim().startsWith("#")
                    && (contentArray[i].toLowerCase().includes("menu")
                        || (contentArray[i].toLowerCase().includes("目录"))
                    ))
                continue

            if (contentArray[i].trim().startsWith("#")
                    && (contentArray[i].toLowerCase().includes("author")
                        || (contentArray[i].toLowerCase().includes("作者"))
                    ))
                continue
        }

        if (contentArray[i].trim().startsWith("#") 
                && (contentArray[i - 1].trim() == "") 
                && ((i < (contentArray.length - 1)) && (contentArray[i + 1].trim() == "")))
        {
            let fileRE = new RegExp("^(#{1,}) ", "g")
            let matchValue = fileRE.exec(contentArray[i].trim())
            if (matchValue) {
                menus.push(contentArray[i].trim())
                menusFileIndex.push(i)
                menusInnerIndex.push(prefix)
            }
        }
    }

    for (let i = 0; i < menus.length; i++) {
        let menuIndexRE = new RegExp("^#{1,} (\\d+\\.)*\\d+ .*", "g")
        let matchValue = menuIndexRE.exec(menus[i].trim())

        logger.info(matchValue)
        if (matchValue) {
            indexFlag = true

            break
        }
    }

    // logger.info(menus)
    // logger.info(menusFileIndex)
    // logger.info(menusInnerIndex)
    // logger.info(fileIndex)
    // logger.info(toZhDigit(fileIndex))
    // logger.info(indexFlag)

    // let titleLine = contentArray[startLine].split(/ /)
    // // titleLine[1] = toZhDigit(fileIndex) + "、" + titleLine[1]
    // titleLine.splice(1, 0, toZhDigit(fileIndex))
    // contentArray[startLine] = titleLine.join(" ")

    if (indexFlag || remove) {
        for (let i = 0; i < menus.length; i++) {
            let menuIndexRE = new RegExp("^(#{1,} )(\\d+\\.)*\\d+ (.*)", "g")
            let matchValue = menuIndexRE.exec(menus[i].trim())

            if (matchValue) {
                contentArray[menusFileIndex[i]] = matchValue[1] + matchValue[3]
                menus[i] = matchValue[1] + matchValue[3]
            }
        }
    } else {
        menuIndexStr(menus, 0, 0, menus.length - 1, menusInnerIndex)

        for(let i = 0; i < menus.length; i++) {
            let menuArray = menus[i].split(/ /)
            menusInnerIndex[i] = menusInnerIndex[i].slice(0, menusInnerIndex[i].length - 1)
            menuArray.splice(1, 0, menusInnerIndex[i])
            menus[i] = menuArray.join(" ")

            contentArray[menusFileIndex[i]] = menuArray.join(" ")
        }
    }

    if (menuStart != -1) {
        let menuArrayList = generateMenu(contentArray).content.split("\n")
        let contentArrayTmp = contentArray.slice(0, menuStart + 1)

        if (menuEnd == -1)
            menuEnd = contentArray.length - 1

        contentArrayTmp.push("")
        contentArrayTmp = contentArrayTmp.concat(menuArrayList)
        contentArrayTmp.push("")
        contentArrayTmp = contentArrayTmp.concat(contentArray.slice(menuEnd, contentArray.length))

        contentArray = contentArrayTmp
    }

    logger.info(menusInnerIndex)
    logger.info(menus)

    return {"status": true, "content": contentArray.join("\n")}
}

/**
 * 
 * @param {string[]} textBlock 
 * @param {string} rootPath 
 * @param {number} cursorOffset 
 * @returns 
 */
function isMenu(textBlock: string[], rootPath: string, cursorOffset: number): { status: boolean; content: string } {
    let found = false
    let content = ""
    let menuRE = new RegExp("^(#{1,}) ", "g")
    let startLine = 0

    logger.debug("enter isMenu")

    for (let i = 0; i < textBlock.length; i++) {
        if (textBlock[i].trim().length != 0) {
            startLine = i
            break
        }
    }

    if (textBlock[startLine].trim().includes("](#")) {
        logger.debug("menu block found")
        found = true
    }

    let matchValue = menuRE.exec(textBlock[startLine].trim())
    if (matchValue) {
        logger.debug("menu block found")
        found = true

        content = "menu index"
    }

    return {"status": found, "content": content}
}

export {
    toZhDigit,
    generateMenu,
    generateMenuIndex,
    isMenu
}
