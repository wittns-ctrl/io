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
const io = new Server(server, {
    cors : {origin: "*"}
},{
    connectionStateRecovery: {}
})
const __dirname = dirname(fileURLToPath(import.meta.url))

app.get('/',(req,res)=>{
    res.sendFile(join(__dirname,'server.html'))
})
//const users = {}
const messageStore = []


io.use((socket,next)=>{
const username = socket.handshake.auth.username;

if(!username) {
    return next(new Error("no username"))
}

socket.username = username
next()
})

io.on("connection",(socket)=>{
    console.log(`new user connected ID: ${socket.id}`)

    socket.on("username",(username)=> {
        socket.username = username
       socket.join(username)
        console.log(`new user registered: ${username}`)
    })

    socket.on("chat room",(room)=>{
        socket.join(room)
        socket.emit("chat message",`you are in room ${room}`)
    })

    socket.on("private message",({to,message})=>{
        console.log(`server received :${message}`)
        const username = socket.username
        io.to(to).emit("chat message",`from : ${username} ${message}` )
    })

    socket.on("group chat",({to,message})=>{
        const username = socket.username

        console.log("group received :",message)

        io.to(to).emit("chat message",`from: ${username}  message: ${message}`)
    })

    socket.on("disconnect",()=>{
        console.log("user left")
    })
})

server.listen(PORT,()=>{
    console.log(`server running on port :${PORT}`)
})

