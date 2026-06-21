import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

export class FirebaseConfigurationError extends Error {
  code = 'FIREBASE_NOT_CONFIGURED';

  constructor(message = 'Firebase Admin credentials are not configured') {
    super(message);
    this.name = 'FirebaseConfigurationError';
  }
}

const normalizePrivateKey = (value?: string) => value?.replace(/\\n/g, '\n').trim();

const normalizeServiceAccount = (value: Record<string, unknown>) => {
  const projectId = String(value.projectId || value.project_id || '').trim();
  const clientEmail = String(value.clientEmail || value.client_email || '').trim();
  const privateKey = normalizePrivateKey(String(value.privateKey || value.private_key || ''));

  if (!projectId || !clientEmail || !privateKey) {
    throw new FirebaseConfigurationError('Firebase Admin credentials are incomplete');
  }

  return { projectId, clientEmail, privateKey };
};

const parseServiceAccount = () => {
  try {
    const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64?.trim();
    if (base64) {
      return normalizeServiceAccount(JSON.parse(Buffer.from(base64, 'base64').toString('utf8')));
    }

    const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
    if (json) {
      return normalizeServiceAccount(JSON.parse(json));
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

    if (!clientEmail && !privateKey) {
      return null;
    }

    if (!projectId || !clientEmail || !privateKey) {
      throw new FirebaseConfigurationError('Firebase Admin credentials are incomplete');
    }

    return normalizeServiceAccount({ projectId, clientEmail, privateKey });
  } catch (error) {
    if (error instanceof FirebaseConfigurationError) throw error;
    throw new FirebaseConfigurationError('Firebase Admin credentials are invalid');
  }
};

export const getFirebaseAuth = () => {
  if (!getApps().length) {
    const useServiceAccount = process.env.FIREBASE_USE_SERVICE_ACCOUNT === 'true';
    const serviceAccount = useServiceAccount ? parseServiceAccount() : null;
    const projectId = serviceAccount?.projectId || process.env.FIREBASE_PROJECT_ID?.trim();

    if (!projectId) {
      throw new FirebaseConfigurationError('FIREBASE_PROJECT_ID is not configured');
    }

    initializeApp(serviceAccount
      ? { credential: cert(serviceAccount), projectId }
      : { projectId });
  }

  return getAuth();
};
