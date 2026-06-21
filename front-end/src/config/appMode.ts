export type AppMode = 'public' | 'admin';

export const appMode: AppMode = import.meta.env.VITE_APP_MODE === 'admin' ? 'admin' : 'public';

export const isAdminApp = appMode === 'admin';

export const adminAppUrl = import.meta.env.VITE_ADMIN_APP_URL?.trim() || '';

export const redirectToAdminApp = () => {
  if (!adminAppUrl) return false;

  const adminUrl = new URL(adminAppUrl);
  adminUrl.pathname = '/auth';
  adminUrl.search = '?mode=login';
  window.location.assign(adminUrl.toString());
  return true;
};

export const openAdminArea = (navigate: (path: string) => void) => {
  if (redirectToAdminApp()) return;
  navigate('/admin/dashboard');
};
