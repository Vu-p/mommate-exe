import type { Response } from 'express';
import Contract, { ContractStatus } from '../models/Contract.js';
import Carer from '../models/Carer.js';
import type { AuthRequest } from '../middleware/auth.js';
import { ensureContractForCarer } from '../utils/contracts.js';
import { createNotification } from '../services/notificationService.js';
import { writeAudit } from '../utils/audit.js';

const getClientIp = (req: AuthRequest) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (Array.isArray(forwardedFor)) return forwardedFor[0];
  return forwardedFor || req.ip;
};

const isValidSignatureImage = (signatureImage: unknown) =>
  typeof signatureImage === 'string' &&
  (signatureImage.startsWith('data:image/') || signatureImage.startsWith('http')) &&
  signatureImage.length > 20;

// @desc    Get current carer's contract
// @route   GET /api/contracts/me
// @access  Private/Carer
export const getMyContract = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'carer') {
      return res.status(403).json({ message: 'Only carers can view their contract' });
    }

    const carer = await Carer.findOne({ user: req.user!._id, isDeleted: false }).populate('user', '-password');

    if (!carer) {
      return res.status(404).json({ message: 'Carer profile not found' });
    }

    const contract = await ensureContractForCarer(carer);
    res.json(contract);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Sign current carer's contract
// @route   POST /api/contracts/me/sign
// @access  Private/Carer
export const signMyContract = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'carer') {
      return res.status(403).json({ message: 'Only carers can sign their contract' });
    }

    const { signatureImage, acceptedTerms } = req.body;

    if (!acceptedTerms) {
      return res.status(400).json({ message: 'You must accept the contract terms before signing' });
    }

    if (!isValidSignatureImage(signatureImage)) {
      return res.status(400).json({ message: 'Signature image is required' });
    }

    const carer = await Carer.findOne({ user: req.user!._id, isDeleted: false }).populate('user', '-password');

    if (!carer) {
      return res.status(404).json({ message: 'Carer profile not found' });
    }

    const contract = await ensureContractForCarer(carer);

    if (contract.status === ContractStatus.SIGNED) {
      return res.json(contract);
    }

    contract.status = ContractStatus.SIGNED;
    contract.signatureImage = signatureImage;
    contract.signedAt = new Date();
    contract.signedIp = String(getClientIp(req) || '');
    contract.signedUserAgent = req.get('user-agent') || '';

    const signedContract = await contract.save();
    await createNotification({
      userId: req.user!._id,
      type: 'contract_signed',
      title: 'Hợp đồng đã được ký',
      body: `Hợp đồng ${contract.templateTitle} đã được ghi nhận thành công.`,
      data: { contractId: contract._id },
    });
    await writeAudit(req, 'contract.sign', 'Contract', contract._id, { after: { status: contract.status, signedAt: contract.signedAt } });
    res.json(signedContract);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Admin views a carer's contract
// @route   GET /api/contracts/admin/carer/:carerId
// @access  Private/Admin
export const getAdminCarerContract = async (req: AuthRequest, res: Response) => {
  try {
    const carer = await Carer.findOne({ _id: req.params.carerId, isDeleted: false }).populate('user', '-password');

    if (!carer) {
      return res.status(404).json({ message: 'Carer not found' });
    }

    const contract = await ensureContractForCarer(carer, req.user!._id);
    res.json(contract);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};
