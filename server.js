require('dotenv').config()
const express = require ('express')
const app =express()
const port = process.env.PORT
const cors = require('cors')
const configureDb = require('./config/db')

const userRoute = require('./app/routes/user-routes')
const dnsRoute = require('./app/routes/dns-routes')
const domainRoute =require('./app/routes/domain-routes')

configureDb()
app.use(cors())
app.use(express.json())

app.use(userRoute)
app.use(dnsRoute)
app.use(domainRoute)

app.listen(port,()=>{
    console.log( `Server is running on ${port}`)
})

app.get("/",(req,res)=>{
    res.send("<h1> Hello Server</h1>");
  })