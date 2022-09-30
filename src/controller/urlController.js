const urlModel = require('../model/urlModel')
const shortId = require('shortid')
const url = require('validator')



const urlregex = /^[A-Za-z0-9 _\-]{7,14}$/









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
            return res.status(409).send({ status: false, msg: "this url is already exist", shortUrl: checkurl.shortUrl })
        }

        let urlCode = shortId.generate().toLowerCase()
        let shortUrl = `http://localhost:3000/${urlCode}`
        data.urlCode = urlCode;
        data.shortUrl = shortUrl




        let createData = await urlModel.create(data)

       return res.status(201).send({ status:true,data: createData })
    }
    catch (err) {
        return res.status(500).send({ msg: err.message })
    }
}


const getUrl= async function(req,res){
    let urlCode=req.params.urlCode
   
    


    let urlData= await urlModel.findOne({urlCode:urlCode})
    if(!urlData){
        return res.status(404).send({status:false,msg:"URL not found"})
    }
   
   return res.status(302).redirect(urlData.longUrl)
}

module.exports.createUrl = createUrl
module.exports.getUrl=getUrl
