import { Router } from 'express';
import mongoose from 'mongoose';
import { protect } from '../middleware/auth.js';
import MultipleDateTrip from '../models/MultipleDateTrip.js';
import Vehicle from '../models/Vehicle.js';

const router = Router();
router.post('/', protect, async (req, res) => {
  const { date, driverName, vehicleId, vehicleName, plateNumber, points } = req.body;
  const validDate = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
    && !Number.isNaN(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date;
  const text = (value) => typeof value === 'string' && value.trim().length > 0;
  const time = (value) => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  const odometer = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0;
  if (!validDate || !text(driverName) || !text(plateNumber) || !Array.isArray(points) || !points.length) {
    return res.status(400).json({ message: 'Enter the date, driver, plate number, and at least one trip point.' });
  }
  if (points.some((point) => !point || !text(point.from) || !text(point.to)
    || !time(point.departureTime) || !time(point.arrivalTime)
    || !odometer(point.departureOdo) || !odometer(point.arrivalOdo) || point.arrivalOdo < point.departureOdo)) {
    return res.status(400).json({ message: 'Each point needs From, To, valid departure and arrival times, and odometer readings. Arrival odometer must be at least departure odometer.' });
  }
  let savedVehicleName = vehicleName;
  if (vehicleId) {
    if (!mongoose.isValidObjectId(vehicleId)) return res.status(400).json({ message: 'Select a valid vehicle.' });
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(400).json({ message: 'Selected vehicle is no longer available.' });
    savedVehicleName = `${vehicle.make} ${vehicle.model}`;
  } else if (!text(vehicleName)) {
    return res.status(400).json({ message: 'Enter the vehicle name or model.' });
  }
  const trip = await MultipleDateTrip.create({
    date, driverName, vehicleId: vehicleId || null, vehicleName: savedVehicleName, plateNumber,
    points: points.map(({ from, to, departureTime, arrivalTime, departureOdo, arrivalOdo }) => ({ from, to, departureTime, arrivalTime, departureOdo, arrivalOdo })),
    createdBy: req.user._id,
  });
  res.status(201).json({ trip });
});

export default router;
