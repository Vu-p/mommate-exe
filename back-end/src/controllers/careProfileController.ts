import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import CareProfile from '../models/CareProfile.js';

export const getCareProfiles = async (req: AuthRequest, res: Response) =>
  res.json(await CareProfile.find({ owner: req.user!._id, isDeleted: false }).sort({ isPrimary: -1, createdAt: 1 }));

export const createCareProfile = async (req: AuthRequest, res: Response) => {
  const profile = await CareProfile.create({ ...req.body, owner: req.user!._id });
  res.status(201).json(profile);
};

export const updateCareProfile = async (req: AuthRequest, res: Response) => {
  const profile = await CareProfile.findOneAndUpdate(
    { _id: req.params.id, owner: req.user!._id, isDeleted: false },
    { $set: req.body },
    { new: true, runValidators: true }
  );
  if (!profile) return res.status(404).json({ message: 'Care profile not found' });
  res.json(profile);
};

export const deleteCareProfile = async (req: AuthRequest, res: Response) => {
  const profile = await CareProfile.findOneAndUpdate(
    { _id: req.params.id, owner: req.user!._id, isDeleted: false },
    { $set: { isDeleted: true } },
    { new: true }
  );
  if (!profile) return res.status(404).json({ message: 'Care profile not found' });
  res.status(204).send();
};
