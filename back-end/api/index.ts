import app from '../src/app.js';
import connectDB from '../src/config/db.js';

let isConnected = false;

const ensureDb = async () => {
  if (isConnected) return;
  await connectDB();
  isConnected = true;
};

export default async function handler(req: any, res: any) {
  await ensureDb();
  return app(req, res);
}
