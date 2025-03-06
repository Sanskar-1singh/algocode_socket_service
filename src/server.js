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
        origin:'*',//all address
        methods:["GET","POST"]//ony get and post allow>>
    }
});
/**
 * cors  is a browser issue browser only know about client address but inside client we are making request 
 * to another backend service which browser do not know thus browser raise cors error
 * to resolve this we set cors config in backend server
 * to check wheteher cors issue will raise  or not browser send preflight request
 * and when browser recieve response from server with properly set header then browser allow cliewnt
 * to make cross origin request hence it resolve cors error>> 
 */

io.on('connection',(socket)=>{
    console.log('user connected',socket.id);

    socket.on('setUserId',async (userId)=>{
        console.log('setting socketid to user id')
        await redisCache.set(userId.trim(), socket.id);

    });

    socket.on('getConnectionId',async (userId)=>{
        const connId=await redisCache.get(userId);
        console.log('getting connection id for user id',userId,connId);
         socket.emit('connectionId',connId);
    })
});
app.post('/sendPayload', async (req,res)=>{
    console.log(req.body);
    const {userId,response}=req.body;
    if(!userId || !response){
       return res.status(400).send('invalid request');
    }
    console.log(userId,response)
    const socketId=await redisCache.get(userId);
    console.log(socketId);
    if(socketId){
        io.to(socketId).emit('submissionPayload',response);
        return res.status(200).send('payload sent successfully');
    }
    else{
        return res.status(400).send('user not connected');
    }
})

httpServer.listen(3001,()=>{
    console.log('server is up at port 3001');
});
