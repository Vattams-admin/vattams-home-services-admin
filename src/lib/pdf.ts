import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import QRCode from 'qrcode'
import type { Invoice, Booking } from '@/lib/supabase'
import { formatCurrency, formatDate } from '@/lib/utils'

export async function generateInvoicePDF(invoice: Invoice, booking: Booking | null, upiId: string) {
  const doc = new jsPDF()
  doc.setFontSize(20); doc.text('VATTAMS Home Services', 14, 20)
  doc.setFontSize(10); doc.text(`Invoice: ${invoice.invoice_number}`, 14, 30)
  doc.text(`Date: ${formatDate(invoice.created_at)}`, 14, 36)
  doc.text(`Status: ${invoice.status}`, 14, 42)
  if (booking) {
    doc.text(`Service: ${booking.service_name}`, 14, 52)
    doc.text(`Scheduled: ${formatDate(booking.scheduled_date)}`, 14, 58)
    doc.text(`Address: ${booking.address}, ${booking.city}`, 14, 64)
  }
  autoTable(doc, { startY: 72, head: [['Description', 'Amount']], body: [[invoice.service_name, formatCurrency(invoice.amount)]] })
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
  doc.text(`Total: ${formatCurrency(invoice.amount)}`, 14, finalY + 10)
  if (upiId) {
    try {
      const qr = await QRCode.toDataURL(`upi://pay?pa=${upiId}&pn=VATTAMS&am=${invoice.amount}&cu=INR`)
      doc.addImage(qr, 'PNG', 140, finalY + 15, 40, 40)
      doc.text('Scan to Pay', 150, finalY + 60)
    } catch {}
  }
  doc.save(`invoice-${invoice.invoice_number}.pdf`)
}

export function generateReportPDF(title: string, headers: string[], rows: (string | number)[][]) {
  const doc = new jsPDF()
  doc.setFontSize(16); doc.text(title, 14, 20)
  autoTable(doc, { startY: 30, head: [headers], body: rows.map(r => r.map(String)) })
  doc.save(`${title.toLowerCase().replace(/\s+/g, '-')}.pdf`)
}

export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}
