import api from './api';

export const downloadBookingInvoice = async (bookingId: string) => {
  const response = await api.get(`/bookings/${bookingId}/invoice`, { responseType: 'blob' });
  const contentDisposition = String(response.headers['content-disposition'] || '');
  const filename = contentDisposition.match(/filename="?([^"]+)"?/)?.[1] || `MomMate-${bookingId.slice(-8)}.html`;
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
