import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import http from 'http'
import {Server} from 'socket.io'
import {fileURLToPath} from 'node:url'
import {dirname,join} from 'path'
import sqlite3 from 'sqlite3'
import {open} from 'sqlite'
import { availableParallelism } from 'node:os'
import cluster from "node:cluster"
import { createAdapter,setupPrimary } from '@socket.io/cluster-adapter'

if(cluster.isPrimary){
    const CPUnums = availableParallelism()

    for(let i = 0; i<CPUnums;i++){
      cluster.fork({
        PORT: 3000 + i
      })
    }

setupPrimary()
}
else {

const db = await open({
    filename:"chat.db",
    driver: sqlite3.Database
})


    await db.exec(`
        CREATE TABLE IF NOT EXISTS messages(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_offset TEXT UNIQUE,
        receiver TEXT,
        content TEXT
        );
        `)

const PORT = process.env.PORTS || 4000
const app  = express()

const server = http.createServer(app)
const io = new Server(server,{
    connectionStateRecovery: {},
    adapter: createAdapter()
}
)

const __dirname = dirname(fileURLToPath(import.meta.url))

app.get('/',(req,res)=>{
    res.sendFile(join(__dirname,'server.html'))
})

const users = {}

io.on("connection",async(socket)=>{
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

    socket.on("private message",async({to,message},clientOffset,callback)=>{
        let result;
        try{
          result = await db.run("INSERT INTO messages (receiver,content,client_offset) VALUES (?,?,?) ",[to,message,clientOffset])
          if(callback)callback()
        }
        catch(e){
            if(e.errno === 19){
            if(callback)callback()
                return
            console.error('storage error:',e.message)
            }
           else{
            return 
           }
        }
        const from = users[socket.id]

        console.log(`server received :${message}`)

        io.to(to).emit("chat",`(Private) ${from}: ${message}`)
        if(callback)callback()
    })


    socket.on("group chat",async({to,message},clientOffset,callback)=>{
        let outcome;
        try{
            outcome = await db.run('INSERT INTO messages (receiver,content,client_offset) VALUES (?,?,?) ',[to,message,clientOffset])
            if(callback)callback()
        }catch(e){
            if(e.errno === 19){
                if(callback)callback()
                    return;
                console.error("_grpstorage error",e.message)
            }
            else{
            return;
            }
        }
        const from = users[socket.id]

        console.log("group received :",message)

        io.to(to).emit("chat",`${from}: ${message}`)
       if(callback)callback()
    })



    //sending recoveries manually
       if(!socket.recovered){

        try{
            await db.each('SELECT receiver,content FROM messages WHERE id > ?',
                [socket.handshake.auth.serverOffset || 0],
                (_err,row) => {
                    socket.emit("chat",`from : ${row.receiver}  message:${row.content}`)
                }
            )
        }catch(e){
            console.error('recover error:',e.message)
        }
    }


    socket.on("disconnect",()=>{
        console.log("user left")
        delete users[socket.id]
    })
})
server.listen(PORT,()=>{
    console.log(`server running on port :${PORT}`)
})
}