import mongoose from 'mongoose';
import Contract, { ContractStatus } from '../models/Contract.js';
import Carer from '../models/Carer.js';
import User from '../models/User.js';

export const CONTRACT_TEMPLATE_VERSION = 'mommate-carer-v1';
export const CONTRACT_TEMPLATE_TITLE = 'Hop dong hop tac carer MomMate';

const getName = (user: any) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || user?.email || 'Carer MomMate';

export const buildCarerContractText = (carer: any, user: any) => {
  const carerName = getName(user);
  const createdDate = new Date().toLocaleDateString('vi-VN');
  const platformFeePercent = Number(carer?.platformFeePercent ?? 10);

  return [
    `HOP DONG HOP TAC CUNG CAP DICH VU MOMMATE`,
    `Phien ban: ${CONTRACT_TEMPLATE_VERSION}`,
    `Ngay tao: ${createdDate}`,
    ``,
    `1. Thong tin cac ben`,
    `Ben A: Nen tang MomMate.`,
    `Ben B: ${carerName}. Email: ${user?.email || 'Chua cap nhat'}. So dien thoai: ${user?.phoneNumber || 'Chua cap nhat'}.`,
    `Noi lam viec: ${carer?.workplaceName || 'Chua cap nhat'}. Vi tri: ${carer?.position || 'Chua cap nhat'}. Khoa/bo phan: ${carer?.department || 'Chua cap nhat'}.`,
    ``,
    `2. Pham vi cong viec`,
    `Ben B cung cap cac dich vu cham soc me bau, me sau sinh, me va be theo booking duoc phan cong/xac nhan tren he thong MomMate.`,
    ``,
    `3. Cam ket chuyen mon va an toan`,
    `Ben B cam ket cung cap dich vu dung pham vi chuyen mon, uu tien an toan cua me va be, tu choi thuc hien cac yeu cau vuot qua nang luc hoac co rui ro y te can chuyen tuyen.`,
    ``,
    `4. Bao mat thong tin`,
    `Ben B khong chia se thong tin khach hang, ho so cham soc, dia chi, so dien thoai, hinh anh hoac noi dung trao doi cho ben thu ba neu khong co su dong y cua MomMate va khach hang.`,
    ``,
    `5. Nhan lich, huy lich va check-in/check-out`,
    `Ben B chi duoc nhan lich khi da ky hop dong nay. Ben B can phan hoi lich trong thoi gian he thong yeu cau, check-in khi bat dau va check-out khi hoan tat dich vu.`,
    ``,
    `6. Thanh toan va doi soat`,
    `Khach hang thanh toan cho MomMate qua cong thanh toan duoc tich hop. MomMate doi soat doanh thu va thanh toan thu lao cho Ben B theo ky doi soat noi bo. Phi nen tang hien tai: ${platformFeePercent}%.`,
    ``,
    `7. Bao cao su co`,
    `Ben B co trach nhiem bao cao kip thoi cac su co ve an toan, suc khoe, tre lich, vang mat, tranh chap voi khach hang hoac bat ky tinh huong nao can MomMate can thiep.`,
    ``,
    `8. Cham dut hop tac`,
    `MomMate co quyen tam dung hoac cham dut hop tac neu Ben B vi pham cam ket chuyen mon, bao mat, an toan, quy trinh van hanh hoac gay anh huong nghiem trong den khach hang va nen tang.`,
    ``,
    `9. Xac nhan dien tu`,
    `Bang viec tick dong y va ky tren he thong, Ben B xac nhan da doc, hieu va dong y voi noi dung hop dong nay.`,
  ].join('\n');
};

export const ensureContractForCarer = async (carerInput: any, createdByAdmin?: any) => {
  const carer = carerInput?.user?.email
    ? carerInput
    : await Carer.findById(carerInput?._id || carerInput).populate('user', '-password');

  if (!carer) {
    throw new Error('Carer not found');
  }

  const existingContract = await Contract.findOne({
    carer: carer._id,
    status: { $ne: ContractStatus.VOIDED },
  }).sort({ createdAt: -1 });

  if (existingContract) {
    return existingContract;
  }

  const user = carer.user?.email ? carer.user : await User.findById(carer.user).select('-password');

  if (!user) {
    throw new Error('Carer user not found');
  }

  const adminId =
    createdByAdmin && mongoose.Types.ObjectId.isValid(String(createdByAdmin)) ? createdByAdmin : undefined;

  return Contract.create({
    carer: carer._id,
    user: user._id,
    status: ContractStatus.PENDING,
    templateVersion: CONTRACT_TEMPLATE_VERSION,
    templateTitle: CONTRACT_TEMPLATE_TITLE,
    contractText: buildCarerContractText(carer, user),
    createdByAdmin: adminId,
  });
};

export const hasSignedContractForCarer = async (carerId: any) => {
  const contract = await Contract.findOne({
    carer: carerId,
    status: ContractStatus.SIGNED,
  }).select('_id');

  return Boolean(contract);
};
