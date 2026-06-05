import dotenv from 'dotenv';
import User from '../models/User.js';
import Carer from '../models/Carer.js';
import connectDB from '../config/db.js';

dotenv.config();

const asianCarerAvatars = [
  'https://images.pexels.com/photos/15752232/pexels-photo-15752232.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/32254665/pexels-photo-32254665.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/15641080/pexels-photo-15641080.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/19963165/pexels-photo-19963165.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80',
];

const updateCarerAvatars = async () => {
  try {
    await connectDB();

    const carers = await Carer.find({ isDeleted: false }).select('user').sort({ createdAt: 1 });

    if (carers.length === 0) {
      console.log('No active carers found. Nothing was updated.');
      process.exit(0);
    }

    const results = await Promise.all(
      carers.map((carer, index) =>
        User.updateOne(
          { _id: carer.user },
          { $set: { avatar: asianCarerAvatars[index % asianCarerAvatars.length] } }
        )
      )
    );

    const modifiedCount = results.reduce((total, result) => total + result.modifiedCount, 0);

    console.log(`Updated ${modifiedCount}/${carers.length} carer avatars.`);
    console.log('Services and other carer data were not changed.');
    process.exit(0);
  } catch (error) {
    console.error('Error updating carer avatars:', error);
    process.exit(1);
  }
};

updateCarerAvatars();
