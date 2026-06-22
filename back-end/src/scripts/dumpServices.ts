import fs from 'fs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import Service from '../models/Service.js';

dotenv.config();

const run = async () => {
  await connectDB();
  const services = await Service.find({}).lean();
  fs.writeFileSync('services_dump.json', JSON.stringify(services, null, 2));
  console.log('Dumped', services.length, 'services to services_dump.json');
  process.exit(0);
};

run().catch(err => {
  console.error(err);
  process.exit(1);
});
