import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import http from 'http'
import {Server} from 'socket.io'
import {fileURLToPath} from 'node:url'
import {dirname,join} from 'path'
const PORT = process.env.PORTS || 4000
const app  = express()

const server = http.createServer(app)
const io = new Server(server,{
    cors: {origin : "*"}
})
const __dirname = dirname(fileURLToPath(import.meta.url))

app.get('/',(req,res)=>{
    res.sendFile(join(__dirname,'server.html'))
})

io.on("connection",(socket)=>{
    console.log(`new user connected ID: ${socket.id}`)

    socket.on("message",(data)=>{
        console.log(`server received :${data}`)
    })

    socket.on("disconnect",()=>{
        console.log("user left")
    })
})

server.listen(PORT,()=>{
    console.log(`server running on port :${PORT}`)
})

