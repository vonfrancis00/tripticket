import 'express-async-errors';
import dotenv from 'dotenv';import fs from 'node:fs';import express from 'express';import cors from 'cors';import helmet from 'helmet';import morgan from 'morgan';import path from 'node:path';import {fileURLToPath} from 'node:url';import mongoose from 'mongoose';
import multipleDateTripRoutes from './routes/multipleDateTrips.js';
import authRoutes from './routes/auth.js';import {protect} from './middleware/auth.js';
import {connectDB} from './config/db.js';import ticketRoutes from './routes/tickets.js';import vehicleRoutes from './routes/vehicles.js';import userRoutes from './routes/users.js';import dashboardRoutes from './routes/dashboard.js';
const __dirname=path.dirname(fileURLToPath(import.meta.url));
dotenv.config({path:path.resolve(__dirname,'../.env')});
const app=express();
let databaseReady=false;
mongoose.connection.on('disconnected',()=>{databaseReady=false});
mongoose.connection.on('connected',()=>{databaseReady=true});
app.set('trust proxy',1);app.use(helmet({crossOriginResourcePolicy:{policy:'cross-origin'},contentSecurityPolicy:false}));app.use(cors({origin:process.env.NODE_ENV==='production'?true:(process.env.CLIENT_ORIGIN||'http://localhost:5173')}));app.use(express.json({limit:'1mb'}));app.use(morgan('combined'));
app.get('/api/health',(req,res)=>res.status(databaseReady?200:503).json({status:databaseReady?'ok':'unavailable',service:'CHED Trip Ticket API',database:databaseReady?'connected':'disconnected'}));
app.use('/api',(req,res,next)=>databaseReady?next():res.status(503).json({message:'Database connection unavailable. Please try again shortly.'}));
app.use('/api/multiple-date-trips',multipleDateTripRoutes);app.use('/api/auth',authRoutes);app.use('/api/tickets',ticketRoutes);app.use('/api/vehicles',vehicleRoutes);app.use('/api/users',userRoutes);app.use('/api/dashboard',protect,dashboardRoutes);
const clientDist=path.resolve(__dirname,'../../client/dist');if(fs.existsSync(clientDist)){app.use(express.static(clientDist));app.get('*',(req,res)=>res.sendFile(path.join(clientDist,'index.html')))}
app.use((err,req,res,next)=>{console.error(err);res.status(500).json({message:process.env.NODE_ENV==='production'?'An unexpected server error occurred.':err.message})});
const port=process.env.PORT||8080;
async function connectWithRetry(){
  try {
    await connectDB();
    databaseReady=true;
  } catch(error) {
    databaseReady=false;
    console.error(`Database connection failed (${error.code||error.name}). Check MongoDB connectivity, DNS, credentials and trusted sources. Retrying in 10 seconds.`);
    setTimeout(connectWithRetry,10000);
  }
}
const server=app.listen(port,'0.0.0.0',()=>{
  console.log(`Server listening on ${port}`);
  void connectWithRetry();
});
server.on('error',error=>{
  console.error(error.code==='EADDRINUSE'?`Port ${port} is already in use. Stop the other backend or change PORT.`:`HTTP server failed (${error.code||error.name}).`);
  process.exit(1);
});
