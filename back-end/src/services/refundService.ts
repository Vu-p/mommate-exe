type RefundInput = {
  amount: number;
  providerReference?: string;
  reason: string;
};

export type RefundResult = {
  provider: 'manual';
  status: 'completed';
  providerReference: string;
};

export const processRefund = async (input: RefundInput): Promise<RefundResult> => {
  const provider = String(process.env.REFUND_PROVIDER || 'manual').toLowerCase();
  if (provider !== 'manual') throw new Error(`Unsupported refund provider: ${provider}`);
  if (!Number.isFinite(input.amount) || input.amount <= 0) throw new Error('Refund amount must be greater than zero');

  const providerReference = String(input.providerReference || '').trim();
  if (!providerReference) throw new Error('Manual refund requires a bank or PayOS payout reference');

  return { provider: 'manual', status: 'completed', providerReference };
};
