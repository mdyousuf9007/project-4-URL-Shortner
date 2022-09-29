const urlModel = require('../model/urlModel')
const shortId = require('shortid')
const validurl = require('valid-url')
const url = require('validator')







const createUrl = async function (req, res) {
    try {
        let data = req.body
        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, msg: "body is empty" })
        }
        if (!data.longUrl) {
            return res.status(400).send({ status: false, msg: "longUrl is required" })
        }

        if (typeof data.longUrl != "string") {
            return res.status(400).send({ status: false, msg: 'long url is invalid' })
        }
        if (!url.isURL(data.longUrl)) {
            return res.status(400).send({ status: false, msg: "long url is invalid" })
        }

        let checkurl = await urlModel.findOne({ longUrl: data.longUrl })
        if (checkurl) {
            return res.status(409).send({ status: false, msg: "longUrl is alresdy exist" })
        }

        let urlCode = shortId.generate().toLowerCase()
        let shortUrl = `http://localhost:3000/${urlCode}`
        data.urlCode = urlCode;
        data.shortUrl = shortUrl




        let createData = await urlModel.create(data)

        res.send({ data: createData })
    }
    catch (err) {
        return res.status(500).send({ msg: err.message })
    }
}

module.exports.createUrl = createUrl
