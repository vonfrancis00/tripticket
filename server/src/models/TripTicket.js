import mongoose from 'mongoose';
const reportSchema=new mongoose.Schema({
 departureTime:String,arrivalTime:String,destinationDepartureTime:String,returnTime:String,distanceTravelled:Number,
 fuelBalance:Number,fuelIssued:Number,fuelPurchased:Number,fuelUsed:Number,fuelEndingBalance:Number,
 gearOil:Number,lubricatingOil:Number,grease:Number,speedometerStart:Number,speedometerEnd:Number,
 speedometerDistance:Number,remarks:String,passengerSignedDate:Date,driverSubmittedAt:Date
},{_id:false});
const schema=new mongoose.Schema({
 ticketNo:{type:String,unique:true,index:true},travelDate:{type:Date,required:true},
 driverName:{type:String,required:true},vehicleId:{type:mongoose.Schema.Types.ObjectId,ref:'Vehicle',default:null},
 vehicleName:String,vehiclePlate:String,passengerName:{type:String,required:true},destination:{type:String,required:true},
 purpose:{type:String,required:true},approvedBy:String,
 report:{type:reportSchema,default:()=>({})},createdBy:{type:mongoose.Schema.Types.ObjectId,ref:'User',default:null}
},{timestamps:true});
schema.index({ticketNo:'text',driverName:'text',destination:'text',purpose:'text'});
export default mongoose.model('TripTicket',schema);