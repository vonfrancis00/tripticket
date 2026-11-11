import 'express-async-errors';
import 'dotenv/config';import fs from 'node:fs';import express from 'express';import cors from 'cors';import helmet from 'helmet';import morgan from 'morgan';import path from 'node:path';import {fileURLToPath} from 'node:url';
import authRoutes from './routes/auth.js';import {protect} from './middleware/auth.js';
import {connectDB} from './config/db.js';import ticketRoutes from './routes/tickets.js';import vehicleRoutes from './routes/vehicles.js';import userRoutes from './routes/users.js';import dashboardRoutes from './routes/dashboard.js';
const __dirname=path.dirname(fileURLToPath(import.meta.url));
if(process.env.MONGO_CA_CERT?.trim()){fs.writeFileSync('/tmp/do-mongo-ca.crt',process.env.MONGO_CA_CERT,{mode:0o600});}const app=express();
app.set('trust proxy',1);app.use(helmet({crossOriginResourcePolicy:{policy:'cross-origin'},contentSecurityPolicy:false}));app.use(cors({origin:process.env.NODE_ENV==='production'?true:(process.env.CLIENT_ORIGIN||'http://localhost:5173')}));app.use(express.json({limit:'1mb'}));app.use(morgan('combined'));
app.get('/api/health',(req,res)=>res.json({status:'ok',service:'CHED Trip Ticket API'}));app.use('/api/auth',authRoutes);app.use('/api/tickets',ticketRoutes);app.use('/api/vehicles',vehicleRoutes);app.use('/api/users',userRoutes);app.use('/api/dashboard',protect,dashboardRoutes);
const clientDist=path.resolve(__dirname,'../../client/dist');if(fs.existsSync(clientDist)){app.use(express.static(clientDist));app.get('*',(req,res)=>res.sendFile(path.join(clientDist,'index.html')))}
app.use((err,req,res,next)=>{console.error(err);res.status(500).json({message:process.env.NODE_ENV==='production'?'An unexpected server error occurred.':err.message})});
const port=process.env.PORT||8080;
connectDB().then(()=>{app.listen(port,'0.0.0.0',()=>console.log(`Server listening on ${port}`))}).catch(e=>{console.error('Startup failed:',e);process.exit(1)});
