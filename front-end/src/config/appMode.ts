export type AppMode = 'public' | 'admin';

export const appMode: AppMode = import.meta.env.VITE_APP_MODE === 'admin' ? 'admin' : 'public';

export const isAdminApp = appMode === 'admin';
