import type { AuthRequest } from '../middleware/auth.js';
import AuditLog from '../models/AuditLog.js';

export const writeAudit = async (
  req: AuthRequest,
  action: string,
  entityType: string,
  entityId?: unknown,
  details: { before?: unknown; after?: unknown; metadata?: Record<string, unknown> } = {}
) => {
  await AuditLog.create({
    actor: req.user?._id,
    action,
    entityType,
    entityId: entityId as any,
    ...details,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
};
