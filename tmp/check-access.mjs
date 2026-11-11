import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import tickets from '../server/src/routes/tickets.js';
import vehicles from '../server/src/routes/vehicles.js';
import users from '../server/src/routes/users.js';
import dashboard from '../server/src/routes/dashboard.js';
import auth from '../server/src/routes/auth.js';
import { protect } from '../server/src/middleware/auth.js';
import TripTicket from '../server/src/models/TripTicket.js';
import Vehicle from '../server/src/models/Vehicle.js';
import User from '../server/src/models/User.js';

// Exercise HTTP middleware with database calls stubbed; no database is modified.
const query = rows => ({ select(){return this}, sort(){return this}, limit(){return this}, lean(){return this}, then(resolve,reject){return Promise.resolve(rows).then(resolve,reject)} });
TripTicket.find = () => query([]);
TripTicket.countDocuments = async () => 0;
TripTicket.findOne = () => query(null);
TripTicket.create = async data => ({ ...data, _id: 'saved-ticket' });
Vehicle.find = () => query([]);
User.find = () => query([]);
User.findById = async () => ({ _id: 'staff', name: 'Staff', active: true, role: 'admin' });
process.env.JWT_SECRET = 'local-test-secret';
const token = jwt.sign({ id: 'staff' }, process.env.JWT_SECRET);
const app = express();
app.use(express.json());
app.use('/api/auth', auth);
app.use('/api/tickets', tickets);
app.use('/api/vehicles', vehicles);
app.use('/api/users', protect, users);
app.use('/api/dashboard', protect, dashboard);
const server = app.listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
const base = `http://127.0.0.1:${server.address().port}/api`;
try {
  for (const [method, path] of [['GET','/tickets'],['GET','/tickets/example'],['PUT','/tickets/example'],['PUT','/tickets/example/report'],['GET','/users'],['POST','/users'],['GET','/dashboard'],['GET','/vehicles'],['POST','/vehicles']]) {
    assert.equal((await fetch(base + path, { method })).status, 401, `${method} ${path}`);
  }
  assert.equal((await fetch(base + '/vehicles/options')).status, 200);
  const submitted = await fetch(base + '/tickets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ travelDate: '2026-11-10', driverName: 'Driver', passengerName: 'Passenger', destination: 'Office', purpose: 'Meeting' }) });
  assert.equal(submitted.status, 201);
  assert.ok((await submitted.json()).ticket.ticketNo);
  for (const path of ['/auth/me','/tickets','/users','/dashboard','/vehicles']) {
    assert.equal((await fetch(base + path, { headers: { Authorization: `Bearer ${token}` } })).status, 200, path);
  }
  console.log('Passed: public submission and vehicle options; anonymous management requests denied; authenticated management requests allowed.');
} finally {
  server.close();
}
