const express=require('express');
const {createServer}=require('http');
const Redis=require('ioredis');
const {Server}=require('socket.io');
const bodyparser=require('body-parser');
const app=express();
app.use(bodyparser.json());
const httpServer=createServer(app);
const redisCache=new Redis();

const io=new Server(httpServer,{
    cors:{
        origin:'*',
        methods:["GET","POST"]
    }
});

io.on('connection',(socket)=>{
    console.log('user connected',socket.id);

    socket.on('setUserId',(userId)=>{
        redisCache.set(userId,socket.id);
    });

    socket.on('getConnectionId',async (userId)=>{
        const connId=await redisCache.get(userId);
        console.log('getting connection id for user id',userId,connId);
         socket.emit('connectionId',connId);
    })
});
app.post('/sendPayload', async (req,res)=>{
    const {userId,payload}=req.body;
    if(!userId || !payload){
        res.status(400).send('invalid request');
    }
    const socketId=await redisCache.get(userId);
    if(socketId){
        io.to(socketId).emit('submissionPayload',payload);
        res.status(200).send('payload sent successfully');
    }
    else{
        res.status(400).send('user not connected');
    }
})

httpServer.listen(3000,()=>{
    console.log('server is up at port 3000');
});
