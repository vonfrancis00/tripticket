import mongoose from 'mongoose';
const schema=new mongoose.Schema({make:{type:String,required:true},model:{type:String,required:true},plateNumber:{type:String,required:true,unique:true,uppercase:true,trim:true},year:String,status:{type:String,enum:['active','maintenance','inactive'],default:'active'}},{timestamps:true});
export default mongoose.model('Vehicle',schema);