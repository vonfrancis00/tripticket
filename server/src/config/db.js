import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import mongoose from 'mongoose';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
export async function connectDB(){
  if(!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required.');
  const options={serverSelectionTimeoutMS:15000};
  let certDirectory;
  if(process.env.MONGO_CA_CERT?.trim()) {
    certDirectory=fs.mkdtempSync(path.join(os.tmpdir(),'trip-ticket-mongo-'));
    options.tls=true;
    options.tlsCAFile=path.join(certDirectory,'ca.crt');
    fs.writeFileSync(options.tlsCAFile,process.env.MONGO_CA_CERT,{mode:0o600});
  }
  try {
  await mongoose.connect(process.env.MONGODB_URI,options);
  if (process.env.SEED_ADMIN === 'true') {
    const email = (process.env.SEED_ADMIN_EMAIL || 'admin@ched.gov.ph').trim().toLowerCase();
    if (!await User.exists({ email })) {
      const password = process.env.SEED_ADMIN_PASSWORD;
      if (!password || password.length < 8) throw new Error('SEED_ADMIN_PASSWORD must contain at least 8 characters.');
      await User.create({ name: process.env.SEED_ADMIN_NAME || 'System Administrator', email, password: await bcrypt.hash(password, 12), role: 'admin' });
    }
  }
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
  } catch(error) {
    await mongoose.disconnect();
    if(certDirectory) fs.rmSync(certDirectory,{recursive:true,force:true});
    throw error;
  }
  if(certDirectory) process.once('exit',()=>fs.rmSync(certDirectory,{recursive:true,force:true}));
}
