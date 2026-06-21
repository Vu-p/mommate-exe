import type { Response } from 'express';
import mongoose from 'mongoose';
import type { AuthRequest } from '../middleware/auth.js';
import CareProfile from '../models/CareProfile.js';

const editableFields = [
  'type',
  'displayName',
  'birthDate',
  'recoveryStatus',
  'deliveryMethod',
  'allergies',
  'medicalHistory',
  'notes',
  'weightKg',
  'heightCm',
  'bloodType',
  'isPrimary',
] as const;

const cleanStringArray = (value: unknown) =>
  (Array.isArray(value) ? value : [])
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .slice(0, 20);

const careProfilePayload = (body: Record<string, any>, partial = false) => {
  const payload: Record<string, any> = {};
  for (const field of editableFields) {
    if (body[field] !== undefined) payload[field] = body[field];
  }

  if (!partial || payload.displayName !== undefined) {
    payload.displayName = String(payload.displayName || '').trim();
    if (payload.displayName.length < 2 || payload.displayName.length > 80) {
      throw new Error('Tên hồ sơ phải có từ 2 đến 80 ký tự');
    }
  }
  if (!partial || payload.type !== undefined) {
    if (!['mother', 'baby'].includes(payload.type)) throw new Error('Loại hồ sơ không hợp lệ');
  }
  if (payload.birthDate) {
    const birthDate = new Date(payload.birthDate);
    if (Number.isNaN(birthDate.getTime()) || birthDate > new Date()) throw new Error('Ngày sinh không hợp lệ');
    payload.birthDate = birthDate;
  } else if (payload.birthDate === '') {
    payload.birthDate = null;
  }
  if (payload.weightKg !== undefined && payload.weightKg !== '') {
    payload.weightKg = Number(payload.weightKg);
    if (!Number.isFinite(payload.weightKg) || payload.weightKg <= 0 || payload.weightKg > 300) throw new Error('Cân nặng không hợp lệ');
  } else if (payload.weightKg === '') {
    payload.weightKg = null;
  }
  if (payload.heightCm !== undefined && payload.heightCm !== '') {
    payload.heightCm = Number(payload.heightCm);
    if (!Number.isFinite(payload.heightCm) || payload.heightCm <= 0 || payload.heightCm > 250) throw new Error('Chiều cao không hợp lệ');
  } else if (payload.heightCm === '') {
    payload.heightCm = null;
  }
  if (payload.allergies !== undefined) payload.allergies = cleanStringArray(payload.allergies);
  if (payload.medicalHistory !== undefined) payload.medicalHistory = cleanStringArray(payload.medicalHistory);
  for (const field of ['recoveryStatus', 'notes', 'bloodType']) {
    if (payload[field] !== undefined) payload[field] = String(payload[field] || '').trim().slice(0, field === 'notes' ? 2000 : 200);
  }
  return payload;
};

export const getCareProfiles = async (req: AuthRequest, res: Response) => {
  const items = await CareProfile.find({ owner: req.user!._id, isDeleted: false }).sort({ isPrimary: -1, createdAt: 1 });
  res.json({ items, pagination: { page: 1, limit: items.length || 1, total: items.length, totalPages: 1 } });
};

export const createCareProfile = async (req: AuthRequest, res: Response) => {
  try {
    const count = await CareProfile.countDocuments({ owner: req.user!._id, isDeleted: false });
    if (count >= 10) return res.status(400).json({ message: 'Mỗi tài khoản chỉ được tạo tối đa 10 hồ sơ chăm sóc' });
    const payload = careProfilePayload(req.body);
    if (payload.isPrimary) {
      await CareProfile.updateMany({ owner: req.user!._id, isDeleted: false, type: payload.type }, { $set: { isPrimary: false } });
    }
    const profile = await CareProfile.create({ ...payload, owner: req.user!._id });
    res.status(201).json(profile);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Dữ liệu hồ sơ chăm sóc không hợp lệ' });
  }
};

export const updateCareProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Care profile not found' });
    const existing = await CareProfile.findOne({ _id: req.params.id, owner: req.user!._id, isDeleted: false });
    if (!existing) return res.status(404).json({ message: 'Care profile not found' });
    const payload = careProfilePayload(req.body, true);
    const resolvedType = payload.type || existing.type;
    if (payload.isPrimary) {
      await CareProfile.updateMany(
        { owner: req.user!._id, isDeleted: false, type: resolvedType, _id: { $ne: existing._id } },
        { $set: { isPrimary: false } },
      );
    }
    Object.assign(existing, payload);
    await existing.save();
    res.json(existing);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Dữ liệu hồ sơ chăm sóc không hợp lệ' });
  }
};

export const deleteCareProfile = async (req: AuthRequest, res: Response) => {
  const profile = await CareProfile.findOneAndUpdate(
    { _id: req.params.id, owner: req.user!._id, isDeleted: false },
    { $set: { isDeleted: true, isPrimary: false } },
    { new: true },
  );
  if (!profile) return res.status(404).json({ message: 'Care profile not found' });
  res.status(204).send();
};
