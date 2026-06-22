import fs from 'fs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import Service from '../models/Service.js';
import Carer from '../models/Carer.js';

dotenv.config();

const run = async () => {
  await connectDB();
  
  const rawData = fs.readFileSync('services_dump.json', 'utf-8');
  const services = JSON.parse(rawData);
  
  // Filter out the 7 services with images
  const servicesToKeep = services.filter((s: any) => s.image && s.image.trim() !== '');
  
  console.log(`Found ${servicesToKeep.length} services with images to restore.`);
  
  // Delete all existing services in the production DB to avoid duplicates
  await Service.deleteMany({});
  
  const insertedServices = await Service.insertMany(servicesToKeep.map((s: any) => {
    const newService = { ...s };
    // Keep _id so relations don't break if any
    return newService;
  }));

  console.log(`Successfully restored ${insertedServices.length} services.`);

  // Update carers to use all these restored services
  const allServiceIds = insertedServices.map(s => s._id);
  await Carer.updateMany({}, { $set: { services: allServiceIds } });
  
  console.log('Updated carers to provide these services.');

  process.exit(0);
};

run().catch(err => {
  console.error(err);
  process.exit(1);
});
