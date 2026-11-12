import mongoose from 'mongoose';

const pointSchema = new mongoose.Schema({
  from: { type: String, required: true, trim: true },
  to: { type: String, required: true, trim: true },
  departureTime: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
  arrivalTime: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
  departureOdo: { type: Number, required: true, min: 0 },
  arrivalOdo: {
    type: Number, required: true, min: 0,
    validate: { validator(value) { return value >= this.departureOdo; }, message: 'Arrival odometer must be at least the departure odometer.' },
  },
}, { _id: false });

const schema = new mongoose.Schema({
  date: { type: Date, required: true },
  driverName: { type: String, required: true, trim: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', default: null },
  vehicleName: { type: String, required: true, trim: true },
  plateNumber: { type: String, required: true, trim: true },
  points: {
    type: [pointSchema], required: true,
    validate: { validator: (value) => value.length > 0, message: 'Add at least one trip point.' },
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export default mongoose.model('MultipleDateTrip', schema);
