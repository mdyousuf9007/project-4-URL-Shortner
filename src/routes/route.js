const express=require('express')
const router= express.Router()
const urlController=require('../controller/urlController')






router.post("/test-me", urlController.createUrl)


module.exports=router