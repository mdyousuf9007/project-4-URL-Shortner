const express=require('express')
const route=require('./routes/route')
const mongoose= require('mongoose')
const app= express();

app.use(express.json())

mongoose.connect("mongodb+srv://upendra:wvUNUF1FjJ02PCPH@cluster0.b8yrh4n.mongodb.net/project04-db69",{
 useNewUrlParser:true


})
.then(()=> console.log("Mongodb is connected"))
.catch(err=>console.log(err))

app.use('/', route)

app.listen(3000, function(){
    console.log(`Express app runing on port ` +(3000))
})
