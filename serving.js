import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import http from 'http'
import {fileURLToPath} from 'node:url'
import {dirname,join} from 'path'
const PORT = process.env.PORTS || 4000
const app  = express()

const server = http.createServer(app)

const __dirname = dirname(fileURLToPath(import.meta.url))

app.get('/',(req,res)=>{
    res.sendFile(join(__dirname,'server.html'))
})

server.listen(PORT,()=>{
    console.log(`server running on port :${PORT}`)
})

