import { protect } from '../middleware/auth.js';
import { Router } from 'express';
import mongoose from 'mongoose';
import Vehicle from '../models/Vehicle.js';

const r = Router();
const fields = ['make', 'model', 'plateNumber', 'year', 'status'];
const vehicleData = (body) => Object.fromEntries(fields.filter((key) => body[key] !== undefined).map((key) => [key, body[key]]));
const saveError = (res, error) => res.status(400).json({ message: error.code === 11000 ? 'Plate number already exists.' : error.message });
r.get('/options', async (req, res) => {
  const vehicles = await Vehicle.find().select('make model plateNumber').sort({ plateNumber: 1 });
  res.json({ vehicles });
});
r.use(protect);
r.get('/', async (req, res) => {
  const vehicles = await Vehicle.find().sort({ plateNumber: 1 });
  res.json({ vehicles });
});
r.post('/', async (req, res) => {
  try {
    const vehicle = await Vehicle.create(vehicleData(req.body));
    res.status(201).json({ vehicle });
  } catch (error) { saveError(res, error); }
});
r.param('id', (req, res, next, id) => {
  if (!mongoose.isObjectIdOrHexString(id)) return res.status(400).json({ message: 'Invalid vehicle ID.' });
  next();
});
r.put('/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, vehicleData(req.body), { new: true, runValidators: true });
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found.' });
    res.json({ vehicle });
  } catch (error) { saveError(res, error); }
});
r.delete('/:id', async (req, res) => {
  const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found.' });
  res.json({ message: 'Vehicle removed.' });
});
export default r;
