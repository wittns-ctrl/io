import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import http from 'http'
import {Server} from 'socket.io'
const PORT = process.env.PORT || 3000

const app = express()
app.use(express.static('.'))

const httpServer = http.createServer(app)

const io = new Server(httpServer,{
    cors: {origin:"*"}
})

io.on("connection",(socket)=>{
    console.log('connection made',socket.id)

    socket.on('message',(data)=>{
        const message = JSON.stringify(data)
        console.log(`message received ${message}`)

            io.emit('message',data)
    })



    socket.on('disconnect',()=>{
        console.log('user disconnected:',socket.id)
    })
})

httpServer.listen(PORT,()=>{
    console.log(`server running on PORT : ${PORT}`)
})