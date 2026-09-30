import { Logger } from "./logger"
const logger = new Logger("indent")

/**
 * 
 * @param {string[]} contentArray 
 * @param {number} level 
 * @param {number} start 
 * @param {number} end 
 * @param {number} columnInterval 
 * @param {boolean} debug 
 * @param {number} skipLevel 
 * @returns {number[]}
 */
function findIndexsWithSkip(contentArray: string[], level: number, start: number, end: number, columnInterval: number, debug: boolean, skipLevel: number): number[] {

    let indexs = []

    if (debug) {
        logger.debug("------------level " + level + " --------------")
        logger.debug("level = " + level)
        logger.debug("start = " + start)
        logger.debug("end = " + end)
        logger.debug("columnInterval = " + columnInterval)
    }

    for (let i = start; i < end; i++) {
        // level * columnInterval: 当前行本身缩进
        // (level - 1) * columnInterval: 额外添加的行缩进，目前是每个level添加2个空格，为了更方便的阅读
        let line = contentArray[i]
        if (level > 0) {
            if (line.length > ((level + skipLevel) * columnInterval) && line[(2 * level - 1 + skipLevel) * columnInterval] == "*") {
                indexs.push(i)
            }
        } else {    // level <= 0
            level = 0
            if (line.length > 0 && line[0] == "*") {
                indexs.push(i)
            }
        }
    }

    return indexs
}

/**
 * 
 * @param {string[]} contentArray 
 * @param {number} level 
 * @param {number} start 
 * @param {number} end 
 * @param {number} columnInterval 
 * @param {boolean} debug 
 * @param {number} skipLevel 
 * @returns 
 */
function listToTreeWithSkip(contentArray: string[], level: number, start: number, end: number, columnInterval: number, debug: boolean, skipLevel: number): void {
    if (debug) {
        logger.debug("------------level " + level + " --------------")
        logger.debug("level = " + level)
        logger.debug("start = " + start)
        logger.debug("end = " + end)
        logger.debug("columnInterval = " + columnInterval)

        for (let i = start; i < end - start; i++) {
            logger.debug(contentArray[i])
        }
    }

    // 因为传入的是包前不包后，排除第一行
    start += 1

    // 查找子索引数组
    let indexs = findIndexsWithSkip(contentArray, level + 1, start, end, columnInterval, debug, skipLevel)
    if (debug) {
        logger.debug("indexs:")
        logger.debug(indexs)
    }

    if (indexs.length > 0) {
        if (debug)
            logger.debug("-------padding space--------")
        // 额外添加的行缩进，目前是每个level添加2个空格，为了更方便的阅读，2 + 2 = 4 space
        for (let i = start; i < end; i++) {
            contentArray[i] = contentArray[i].substring(0, (2 * level + skipLevel) * columnInterval) + "  " + contentArray[i].substring((2 * level + skipLevel) * columnInterval)
            if (debug)
                logger.debug(contentArray[i])
        }

        if (debug)
            logger.debug("-------replace with | --------")
        // 绘制当前的标记的列，range是前闭后开，所以要+1，因为前面为每个level增加了2个空格，替换字符位置是(2 * level + 1) * columnInterval为基准
        for (let i = start; i < (indexs[indexs.length - 1] + 1); i++) {
            contentArray[i] = contentArray[i].substring(0, (2 * level + 1 + skipLevel) * columnInterval) + "│" + contentArray[i].substring((2 * level + 1 + skipLevel) * columnInterval + 1)
            if (debug)
                logger.debug(contentArray[i])
        }

        if (debug)
            logger.debug("-------replace with └── /├──--------")
        // 绘制当前标记的行，由于需要替换掉*号，所以行范围需要range内要+1，由于前面额外的每个level添加了2个空格，所以要以(2 * level + 1) * columnInterval为基准
        indexs.forEach(value => {
            if (value == indexs[indexs.length - 1])
                contentArray[value] = contentArray[value].substring(0, (2 * level + 1 + skipLevel) * columnInterval) + "└──" + contentArray[value].substring((2 * level + 1 + skipLevel) * columnInterval + 3)
            else
                contentArray[value] = contentArray[value].substring(0, (2 * level + 1 + skipLevel) * columnInterval) + "├──" + contentArray[value].substring((2 * level + 1 + skipLevel) * columnInterval + 3)

        })

        if (debug)
            logger.debug("-------recursion--------")
        /**
         * 1. 当前递归的区域的最后一行放入indexs集合，当作结束范围，这样就可以囊括整个子区域
         * 2. 示例 1，不用添加最后一行
         *      * indent 1
         *        * indent 2
         *      * indent 1
         *      * indent 1
         * 3. 示例 2，需要添加最后一行
         *      * indent 1
         *        * indent 2
         *      * indent 1
         *        * indent 2
         *        * indent 2
         *    -> 这个位置就是：indexs.push(end) <-
         * 4. 综上两个示例，统一添加最后一行，在内部判断start、end不相等才递归
         */
        indexs.push(end)
        for (let i = 0; i < indexs.length; i++) {
            if (debug) {
                logger.debug("-------start next recursion" + i + "--------")
                logger.debug("start = " + start)
                logger.debug("end = " + indexs[i])
            }

            // skip start == end
            if (start != indexs[i])
                listToTreeWithSkip(contentArray, level + 1, start, indexs[i], columnInterval, debug, skipLevel)

            // 下一个子区域
            start = indexs[i]
        }
    } else
        return

    if (debug) {
        if (level == 0) {
            logger.debug("-------output--------")
            for (let i = 0; i < contentArray.length; i++) {
                logger.debug(contentArray[i])
            }
        }
    }
}

/**
 * 
 * @param {string[]} contentArray 
 * @param {boolean} debug 
 * @param {number} columnInterval 
 * @param {number} skipLevel 
 */
function treeToListWithSkip(contentArray: string[], debug: boolean, columnInterval: number, skipLevel: number): void {
    let skipSpaces = skipLevel * columnInterval
    /**
     * 1. 所有的节点都是以'─ '开头
     * 2. 前面level是4的倍数；
     * 3. 保留2个space，也就是index / 2
     */
    for (let i = 0; i < contentArray.length; i++) {
        let index = contentArray[i].indexOf("─ ") - skipSpaces
        if (index > 0) {
            contentArray[i] = "".padStart(index / 2 + skipSpaces) + "* " + contentArray[i].substring(index + 2 + skipSpaces)
        }
    }

    if (debug) {
        logger.debug("-------output--------")
        for (let i = 0; i < contentArray.length; i++) {
            logger.debug(contentArray[i])
        }
    }
}

/**
 * 
 * @param {string[]} contentArray 
 * @param {number} skipLevel 
 * @returns 
 */
function convert2Tree(contentArray: string[], skipLevel: number): { status: boolean; content: string } {
    let status = false
    let content = ""

    if (findIndexsWithSkip(contentArray, 0, 0, contentArray.length, 2, false, skipLevel).length = 1) {
        listToTreeWithSkip(contentArray, 0, 0, contentArray.length, 2, false, skipLevel)
        content = contentArray.join("\n")

        status = true
    }

    return {"status": status, "content": content}
}

/**
 * 
 * @param {string[]} contentArray 
 * @param {number} skipLevel 
 * @returns 
 */
function revert2List(contentArray: string[], skipLevel: number): { status: boolean; content: string } {
    let status = true

    treeToListWithSkip(contentArray, false, 2, skipLevel)

    return {"status": status, "content": contentArray.join("\n")}
}

/**
 * 
 * @param {string[]} textBlock 
 * @param {string} rootPath 
 * @param {number} cursorOffset 
 * @returns 
 */
function isIndent(textBlock: string[], rootPath: string, cursorOffset: number): { status: boolean; content: string } {
    let found = false
    let content = ""

    logger.debug("enter isIndent")

    if (textBlock.length > 1 && textBlock[cursorOffset].trim().length > 0) {
        if (((textBlock[0].trim().startsWith("```") && !textBlock[0].trim().startsWith("```plantuml"))) 
              && textBlock[1].trim().startsWith("* ")
              && (textBlock[0].indexOf("`") <= textBlock[1].indexOf("*"))) {
            logger.debug("indent block found")
            found = true
        }
    }

    return {"status": found, "content": content}
}

export {
    convert2Tree,
    revert2List,
    isIndent,
}
