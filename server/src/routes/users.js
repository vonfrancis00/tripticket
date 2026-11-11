import {allowRoles,protect} from '../middleware/auth.js';
import mongoose from 'mongoose';
import {normalizeRole} from '../utils/roles.js';
import {Router} from 'express';import bcrypt from 'bcryptjs';import User from '../models/User.js';
const r=Router();
r.get('/drivers',async(req,res)=>{const drivers=await User.find({role:/^\s*driver\s*$/i}).select('_id name').sort({name:1});res.json({drivers})});
r.use(protect);
r.use(allowRoles('admin')); 
r.get('/',async(req,res)=>{const users=await User.find().select('-password').sort({name:1});res.json({users})});
r.post('/',async(req,res)=>{const {name,email,password,role,office}=req.body;if(!name||!email||!password||password.length<8)return res.status(400).json({message:'Name, email, and password (at least 8 characters) are required.'});const exists=await User.findOne({email:email.toLowerCase()});if(exists)return res.status(409).json({message:'An account with this email already exists.'});const user=await User.create({name,email,password:await bcrypt.hash(password,12),role,office});res.status(201).json({user:{id:user._id,name:user.name,email:user.email,role:user.role,office:user.office}})});
r.put('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({message: 'Invalid user ID.'});
  const {name, email, password, role, office} = req.body;
  const normalizedRole = normalizeRole(role);
  if (typeof name !== 'string' || !name.trim() || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({message: 'A name and valid email are required.'});
  }
  if (!['admin', 'admin_officer', 'driver'].includes(normalizedRole)) return res.status(400).json({message: 'Select a valid role.'});
  if (office !== undefined && typeof office !== 'string') return res.status(400).json({message: 'Office must be text.'});
  if (password !== undefined && (typeof password !== 'string' || (password !== '' && password.length < 8))) {
    return res.status(400).json({message: 'Password must contain at least 8 characters.'});
  }
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({message: 'User not found.'});
  const normalizedEmail = email.trim().toLowerCase();
  const exists = await User.findOne({email: normalizedEmail, _id: {$ne: user._id}});
  if (exists) return res.status(409).json({message: 'An account with this email already exists.'});
  user.name = name.trim();
  user.email = normalizedEmail;
  user.role = normalizedRole;
  user.office = (office || '').trim();
  if (password) user.password = await bcrypt.hash(password, 12);
  try {
    await user.save();
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({message: 'An account with this email already exists.'});
    throw error;
  }
  const updated = user.toObject();
  delete updated.password;
  res.json({user: updated});
});
export default r;
