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
    connectionStateRecovery: {}
})

const __dirname = dirname(fileURLToPath(import.meta.url))

app.get('/',(req,res)=>{
    res.sendFile(join(__dirname,'server.html'))
})

const users = {}

io.on("connection",(socket)=>{
    console.log(`new user connected ID: ${socket.id}`)

    socket.on("username",(username)=> {
        users[socket.id] = username

        socket.join(username)

        console.log(`new user registered: ${username}`)
    })

    socket.on("chat room",(room)=>{
        socket.join(room)
        socket.emit("chat",`you are in room ${room}`)
    })

    socket.on("private message",({to,message})=>{
        const from = users[socket.id]

        console.log(`server received :${message}`)

        io.to(to).emit("chat",`(Private) ${from}: ${message}`)
    })

    socket.on("group chat",({to,message})=>{
        const from = users[socket.id]

        console.log("group received :",message)

        io.to(to).emit("chat",`${from}: ${message}`)
    })

    socket.on("disconnect",()=>{
        console.log("user left")
        delete users[socket.id]
    })
})

server.listen(PORT,()=>{
    console.log(`server running on port :${PORT}`)
})