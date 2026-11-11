import {Router} from 'express';import bcrypt from 'bcryptjs';import jwt from 'jsonwebtoken';import User from '../models/User.js';import {protect} from '../middleware/auth.js';
const r=Router();
r.post('/login',async(req,res)=>{const {email,password}=req.body;const user=await User.findOne({email:String(email||'').trim().toLowerCase()}).select('+password');if(!user||!user.active||!await bcrypt.compare(password||'',user.password))return res.status(401).json({message:'Invalid email or password.'});const token=jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:process.env.JWT_EXPIRES_IN||'8h'});res.json({token,user:{id:user._id,name:user.name,email:user.email,role:user.role,office:user.office}})});
r.get('/me',protect,(req,res)=>res.json({user:{id:req.user._id,name:req.user.name,email:req.user.email,role:req.user.role,office:req.user.office}}));
export default r;
