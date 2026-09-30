import { Logger } from "./logger"

const logger = new Logger("author")

/**
 * 
 * @param {string[]} authorInfo
 * @param {Object<string, string>} info 
 * @returns
 */
function generateAuthorInfo(authorInfo: string[], info: { [key: string]: string }): string[] {
    logger.debug("enter generateAuthorInfo")
    let authorInfoContent = ""

    let objectDate = new Date();
    let dateStr = "" + objectDate.getFullYear() + "-" + (objectDate.getMonth() + 1)  + "-" +  objectDate.getDate()

    let userName = info["user.name"]
    let userEmail = info["user.email"]
    if (userName == undefined)
        userName = "N/A"
    if (userEmail == undefined)
        userEmail = "N/A"

    if (authorInfo.length == 0) {
        authorInfoContent = " Date ".padEnd(dateStr.length + 1) + "|" + " Author ".padEnd(userName.length + 2) + "|" + " Email ".padEnd(userEmail.length + 2) + "| Description"
        authorInfo.push(authorInfoContent)

        authorInfoContent = "---".padEnd(dateStr.length + 1, "-") + "|" + "---".padEnd(userName.length + 2, "-") + "|" + "---".padEnd(userEmail.length + 2, "-") + "|------------"
        authorInfo.push(authorInfoContent)

        authorInfoContent = ""
        authorInfoContent += dateStr
        authorInfoContent += " | " + userName
        authorInfoContent += " | " + userEmail
        authorInfoContent += " | " + "N/A"
        authorInfo.push(authorInfoContent)
    } else {
        const authorInfoDetails: string[][] = []
        let maxDateLen = dateStr.length
        let maxAuthorLen = userName.length
        let maxEmailLen = userEmail.length

        for (let i = 2; i < authorInfo.length; i++) {
            const authorInfoSplits = authorInfo[i].split("|")

            if (maxDateLen < authorInfoSplits[0].trim().length)
                maxDateLen = authorInfoSplits[0].trim().length
            if (maxAuthorLen < authorInfoSplits[1].trim().length)
                maxAuthorLen = authorInfoSplits[1].trim().length
            if (maxEmailLen < authorInfoSplits[2].trim().length)
                maxEmailLen = authorInfoSplits[2].trim().length

            authorInfoDetails.push([authorInfoSplits[0].trim(), authorInfoSplits[1].trim(), authorInfoSplits[2].trim(), authorInfoSplits[3].trim()])
        }
        authorInfoDetails.push([dateStr, userName, userEmail, "N/A"])

        authorInfo = []
        authorInfoContent = " Date ".padEnd(maxDateLen + 1) + " | " + " Author ".padEnd(maxAuthorLen + 2) + " | " + " Email ".padEnd(maxEmailLen + 2) + " | Description"
        authorInfo.push(authorInfoContent)

        authorInfoContent = "---".padEnd(maxDateLen + 1, "-") + "-|-" + "---".padEnd(maxAuthorLen + 2, "-") + "-|-" + "---".padEnd(maxEmailLen + 2, "-") + "-|------------"
        authorInfo.push(authorInfoContent)

        for (let i = 0; i < authorInfoDetails.length; i++) {
            const authorInfoItem = authorInfoDetails[i]
            authorInfoContent = ""
            authorInfoContent += authorInfoItem[0].padEnd(maxDateLen + 1, " ")
            authorInfoContent += " | " + authorInfoItem[1].padEnd(maxAuthorLen + 2, " ")
            authorInfoContent += " | " + authorInfoItem[2].padEnd(maxEmailLen + 2, " ")
            authorInfoContent += " | " + authorInfoItem[3]
            authorInfo.push(authorInfoContent)
        }
    }

    return authorInfo
}

/**
 * 
 * @param {string[]} textBlock 
 * @param {string} rootPath 
 * @param {number} cursorOffset 
 * @returns 
 */
function isAuthor(textBlock: string[], rootPath: string, cursorOffset: number): { status: boolean; content: string } {
    let found = false
    let content = ""

    logger.debug("enter isAuthorInfo")

    if (textBlock[cursorOffset].trim().length == 0)
        return {"status": false, "content": content}

    let startLine = 0
    for (let i = 0; i < textBlock.length; i++) {
        if (textBlock[i].trim().length != 0) {
            startLine = i
            break
        }
    }

    let checkLine = textBlock[startLine].trim()
    if (checkLine.includes("Date") && checkLine.includes("Author") && checkLine.includes("Email")){
        logger.debug("authro info found")
        found = true
        content = "author info"
    }

    return {"status": found, "content": content}
}

export {
    generateAuthorInfo,
    isAuthor,
}
