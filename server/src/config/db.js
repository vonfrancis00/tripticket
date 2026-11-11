import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import mongoose from 'mongoose';
export async function connectDB(){
  if(!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required.');
  const options={serverSelectionTimeoutMS:15000};
  if(process.env.MONGO_CA_CERT?.trim()) options.tls=true,options.tlsCAFile='/tmp/do-mongo-ca.crt';
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
}