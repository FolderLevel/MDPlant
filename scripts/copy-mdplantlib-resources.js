const fs = require("fs")
const path = require("path")

const source = path.join(__dirname, "../src/lib/mdplantlib/res")
const destination = path.join(__dirname, "../out/lib/mdplantlib/res")

fs.cpSync(source, destination, { recursive: true })
