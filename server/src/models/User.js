import {normalizeRole} from '../utils/roles.js';
import mongoose from 'mongoose';
const userSchema=new mongoose.Schema({name:{type:String,required:true,trim:true},email:{type:String,required:true,unique:true,lowercase:true,trim:true},password:{type:String,required:true,select:false},role:{type:String,set:normalizeRole,enum:['admin','admin_officer','driver'],default:'driver'},office:{type:String,trim:true,default:''},active:{type:Boolean,default:true}},{timestamps:true});
export default mongoose.model('User',userSchema);