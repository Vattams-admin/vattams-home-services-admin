import { useEffect, useState } from 'react'
import { Download, FileText, Loader as Loader2, Wallet } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { supabase } from '@/lib/supabase'
import type { Invoice } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'

const statusVariant = (s: string) =>
  s === 'paid' ? 'success' : s === 'pending' ? 'warning' : 'default'

export function CustomerPaymentsPage() {
  const { profile } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ paid: 0, pending: 0 })

  useEffect(() => {
    if (!profile?.id) return
    let mounted = true
    ;(async () => {
      setLoading(true)
      const { data } = await supabase
        .from('invoices')
        .select('*')
        .eq('customer_id', profile.id)
        .order('created_at', { ascending: false })
      if (!mounted) return
      const all = (data ?? []) as Invoice[]
      setInvoices(all)
      setStats({
        paid: all.filter((i) => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0),
        pending: all.filter((i) => i.status === 'pending').reduce((s, i) => s + Number(i.amount), 0),
      })
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [profile?.id])

  const downloadInvoice = (inv: Invoice) => {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('VATTAMS HOME SERVICES', 105, 22, { align: 'center' })
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Invoice', 105, 30, { align: 'center' })

    autoTable(doc, {
      startY: 40,
      head: [['Field', 'Details']],
      body: [
        ['Invoice Number', inv.invoice_number],
        ['Date', formatDate(inv.created_at)],
        ['Service', inv.service_name],
        ['Amount', formatCurrency(inv.amount)],
        ['Status', inv.status.toUpperCase()],
      ],
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] },
    })

    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
    doc.setFontSize(9)
    doc.text('Thank you for choosing VATTAMS Home Services.', 105, finalY + 15, { align: 'center' })

    doc.save(`invoice-${inv.invoice_number}.pdf`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Payments & Invoices</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-green-100 p-3"><Wallet className="h-6 w-6 text-green-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Total Paid</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.paid)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-amber-100 p-3"><Wallet className="h-6 w-6 text-amber-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Total Pending</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.pending)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {invoices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-500">No invoices yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => (
            <Card key={inv.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="min-w-0 space-y-1">
                  <p className="font-semibold text-gray-900">{inv.service_name}</p>
                  <p className="text-sm text-gray-500">{inv.invoice_number} · {formatDate(inv.created_at)}</p>
                  <Badge variant={statusVariant(inv.status)}>{inv.status}</Badge>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-lg font-bold text-gray-900">{formatCurrency(inv.amount)}</span>
                  <Button size="sm" variant="outline" onClick={() => downloadInvoice(inv)}>
                    <Download className="mr-2 h-3.5 w-3.5" /> Invoice
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
