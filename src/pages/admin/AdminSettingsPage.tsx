import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Settings } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { createAuditLog } from '@/lib/notifications'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingScreen } from '@/components/LoadingScreen'
import { Save, Building2 } from 'lucide-react'

export function AdminSettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<{
    company_name: string; upi_id: string; gst_number: string; working_hours: string
    customer_support_phone: string; technician_support_phone: string; whatsapp_number: string; updated_at?: string | null
  }>({
    company_name: '', upi_id: '', gst_number: '', working_hours: '',
    customer_support_phone: '', technician_support_phone: '', whatsapp_number: '', updated_at: null,
  })

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.from('settings').select('*').eq('id', 1).maybeSingle()
      if (mounted && data) {
        const s = data as Settings
        setForm({
          company_name: s.company_name || '', upi_id: s.upi_id || '', gst_number: s.gst_number || '',
          working_hours: s.working_hours || '', customer_support_phone: s.customer_support_phone || '',
          technician_support_phone: s.technician_support_phone || '', whatsapp_number: s.whatsapp_number || '',
          updated_at: s.updated_at,
        })
      }
      if (mounted) setLoading(false)
    })()
    return () => { mounted = false }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('settings').update({ ...form, updated_at: new Date().toISOString() }).eq('id', 1)
    if (error) {
      toast('Failed to save settings', 'error')
    } else {
      await createAuditLog('', 'update_settings', 'settings', '1', 'Updated company settings')
      toast('Settings saved successfully', 'success')
    }
    setSaving(false)
  }

  if (loading) return <LoadingScreen message="Loading settings..." />

  const fields: { key: keyof typeof form; label: string; placeholder: string }[] = [
    { key: 'company_name', label: 'Company Name', placeholder: 'VATTAMS Home Services' },
    { key: 'upi_id', label: 'UPI ID', placeholder: 'vattams@upi' },
    { key: 'gst_number', label: 'GST Number', placeholder: '33XXXXX1234X1ZX' },
    { key: 'working_hours', label: 'Working Hours', placeholder: '9:00 AM - 8:00 PM' },
    { key: 'customer_support_phone', label: 'Customer Support Phone', placeholder: '9876543210' },
    { key: 'technician_support_phone', label: 'Technician Support Phone', placeholder: '9876543210' },
    { key: 'whatsapp_number', label: 'WhatsApp Number', placeholder: '919876543210' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-blue-600" />Company Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((f) => (
                <div key={f.key}>
                  <Label htmlFor={f.key}>{f.label}</Label>
                  <Input id={f.key} value={form[f.key] || ''} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder} />
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}><Save className="h-4 w-4 mr-2" />{saving ? 'Saving...' : 'Save Settings'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
