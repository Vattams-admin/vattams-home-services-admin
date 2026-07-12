import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import QRCode from 'qrcode'
import type { Invoice, Booking, Profile, Settings } from '@/lib/supabase'
import { formatCurrency, formatDate } from '@/lib/utils'

export async function generateInvoicePDF(invoice: Invoice, booking: Booking | null, customer: Profile | null, technician: Profile | null, settings: Settings | null) {
  const doc = new jsPDF()
  const upiId = settings?.upi_id || 'vattams@upi'
  const companyName = settings?.company_name || 'VATTAMS Home Services'
  const invoicePrefix = settings?.invoice_prefix || 'VAT'
  doc.setFontSize(22); doc.setTextColor(37, 99, 235); doc.text(companyName, 14, 20)
  doc.setFontSize(10); doc.setTextColor(100); doc.text('Professional Home Services', 14, 26)
  doc.setFontSize(16); doc.setTextColor(0); doc.text('INVOICE', 196, 20, { align: 'right' })
  doc.setFontSize(10); doc.setTextColor(100)
  doc.text(`Invoice #: ${invoicePrefix}-${invoice.invoice_number}`, 196, 26, { align: 'right' })
  doc.text(`Date: ${formatDate(invoice.created_at)}`, 196, 32, { align: 'right' })
  doc.setDrawColor(200); doc.line(14, 38, 196, 38)
  doc.setFontSize(10); doc.setTextColor(0); doc.text('Billed To:', 14, 48)
  doc.setFontSize(12); doc.text(customer?.name || 'Customer', 14, 55)
  doc.setFontSize(10); doc.setTextColor(80)
  if (customer?.mobile) doc.text(`Phone: ${customer.mobile}`, 14, 61)
  if (customer?.address) doc.text(`Address: ${customer.address}`, 14, 67)
  if (booking?.city) doc.text(`${booking.city}, ${booking.district}`, 14, 73)
  doc.setFontSize(10); doc.setTextColor(0); doc.text('Service Details:', 120, 48)
  doc.setFontSize(12); doc.text(booking?.service_name || invoice.service_name || 'Service', 120, 55)
  doc.setFontSize(10); doc.setTextColor(80)
  doc.text(`Booking #: ${booking?.booking_number || ''}`, 120, 61)
  doc.text(`Date: ${booking ? formatDate(booking.scheduled_date) : ''}`, 120, 67)
  if (technician?.name) doc.text(`Technician: ${technician.name}`, 120, 73)
  autoTable(doc, { startY: 82, head: [['Description', 'Amount']], body: [[booking?.service_name || invoice.service_name || 'Service', formatCurrency(invoice.amount)]], foot: [['Total', formatCurrency(invoice.amount)]], theme: 'striped', headStyles: { fillColor: [37, 99, 235] }, footStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' } })
  const qrData = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(companyName)}&am=${invoice.amount}&cu=INR`
  try { const qrDataUrl = await QRCode.toDataURL(qrData, { width: 120, margin: 1 }); const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10; doc.addImage(qrDataUrl, 'PNG', 14, finalY, 40, 40); doc.setFontSize(9); doc.setTextColor(80); doc.text('Scan to pay via UPI', 14, finalY + 45); doc.text(`UPI ID: ${upiId}`, 14, finalY + 51) } catch (e) { console.error('QR generation failed:', e) }
  doc.setFontSize(9); doc.setTextColor(120); doc.text('Thank you for choosing VATTAMS Home Services!', 14, 280); doc.text('This is a computer-generated invoice.', 14, 285)
  doc.save(`Invoice-${invoice.invoice_number}.pdf`)
}

export function generateReportPDF(title: string, headers: string[], rows: (string | number)[][], summary?: { label: string; value: string }[]) {
  const doc = new jsPDF()
  doc.setFontSize(18); doc.setTextColor(37, 99, 235); doc.text(title, 14, 20)
  doc.setFontSize(10); doc.setTextColor(100); doc.text(`Generated: ${formatDate(new Date())}`, 14, 28)
  if (summary && summary.length > 0) { let y = 38; summary.forEach(s => { doc.text(`${s.label}: ${s.value}`, 14, y); y += 6 }); autoTable(doc, { startY: y + 4, head: [headers], body: rows, theme: 'striped', headStyles: { fillColor: [37, 99, 235] } }) } else { autoTable(doc, { startY: 34, head: [headers], body: rows, theme: 'striped', headStyles: { fillColor: [37, 99, 235] } }) }
  doc.save(`${title.replace(/\s+/g, '-')}.pdf`)
}

export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}
