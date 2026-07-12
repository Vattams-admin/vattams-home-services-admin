import { supabase } from '@/lib/supabase';
import { UPI_ID, UPI_PAYEE_NAME, buildUpiUrl } from '@/lib/constants';
import type { Payment, Booking } from '@/lib/supabase';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function createPayment(bookingId: string, customerId: string, amount: number): Promise<Payment | null> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .insert({ booking_id: bookingId, customer_id: customerId, amount, status: 'pending', method: 'upi' })
      .select('*')
      .single();
    if (error) throw error;
    return data as Payment;
  } catch (err) {
    console.error('Failed to create payment:', err);
    return null;
  }
}

export async function updatePaymentStatus(paymentId: string, status: 'pending'|'paid'|'failed', transactionId?: string): Promise<void> {
  try {
    const updates: Record<string, unknown> = { status };
    if (status === 'paid') { updates.paid_at = new Date().toISOString(); updates.transaction_id = transactionId; }
    await supabase.from('payments').update(updates).eq('id', paymentId);
  } catch (err) { console.error('Failed to update payment:', err); }
}

export async function generateUpiQrCode(amount: number, note: string): Promise<string> {
  const upiUrl = buildUpiUrl(amount, note);
  try {
    return await QRCode.toDataURL(upiUrl, { width: 256, margin: 2 });
  } catch {
    return '';
  }
}

export async function getPaymentsByCustomer(customerId: string): Promise<Payment[]> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*, booking:bookings(booking_number, service_name)')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    if (error) return [];
    return (data || []) as Payment[];
  } catch { return []; }
}

export async function getAllPayments(): Promise<Payment[]> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*, booking:bookings(booking_number, service_name)')
      .order('created_at', { ascending: false });
    if (error) return [];
    return (data || []) as Payment[];
  } catch { return []; }
}

export function generateInvoicePDF(booking: Booking, payment: Payment): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(20);
  doc.setTextColor(37, 99, 235);
  doc.text('VATTAMS Home Services', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Professional Home Services Across Tamil Nadu', pageWidth / 2, 27, { align: 'center' });
  doc.text('Phone: +91 81898 00757 | Support: +91 81898 00767', pageWidth / 2, 33, { align: 'center' });

  doc.setDrawColor(37, 99, 235);
  doc.line(14, 38, pageWidth - 14, 38);

  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('INVOICE', 14, 48);
  doc.setFontSize(10);
  doc.text(`Invoice #: ${payment.payment_number || 'INV-' + Date.now()}`, 14, 55);
  doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 14, 61);
  doc.text(`Booking #: ${booking.booking_number}`, 14, 67);

  doc.text('Bill To:', pageWidth - 80, 48);
  doc.text(booking.customer?.full_name || 'Customer', pageWidth - 80, 55);
  doc.text(booking.customer?.mobile || '', pageWidth - 80, 61);
  doc.text(booking.address || '', pageWidth - 80, 67);

  autoTable(doc, {
    startY: 78,
    head: [['Service', 'Date', 'Status', 'Amount']],
    body: [[
      booking.service_name,
      booking.scheduled_date || '-',
      payment.status.toUpperCase(),
      `Rs. ${Number(booking.amount).toFixed(2)}`,
    ]],
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235] },
  });

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  doc.setFontSize(12);
  doc.text('Total:', pageWidth - 60, finalY + 15);
  doc.text(`Rs. ${Number(booking.amount).toFixed(2)}`, pageWidth - 25, finalY + 15);

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text('Thank you for choosing VATTAMS!', pageWidth / 2, finalY + 30, { align: 'center' });
  doc.text('This is a computer-generated invoice.', pageWidth / 2, finalY + 36, { align: 'center' });

  doc.save(`invoice-${booking.booking_number}.pdf`);
}

export function generateReportPDF(title: string, headers: string[], rows: string[][], summary?: { label: string; value: string }[]): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(18);
  doc.setTextColor(37, 99, 235);
  doc.text('VATTAMS Home Services', pageWidth / 2, 18, { align: 'center' });

  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text(title, pageWidth / 2, 28, { align: 'center' });

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, pageWidth / 2, 35, { align: 'center' });

  let startY = 45;
  if (summary && summary.length > 0) {
    autoTable(doc, {
      startY,
      head: [['Metric', 'Value']],
      body: summary.map(s => [s.label, s.value]),
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] },
    });
    startY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  autoTable(doc, {
    startY,
    head: [headers],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235] },
  });

  doc.save(`${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`);
}
