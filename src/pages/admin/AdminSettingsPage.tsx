import { useEffect, useState } from 'react'
import { Save, Building2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingScreen } from '@/components/LoadingScreen'

interface SettingsForm {
  company_name: string
  upi_id: string
  gst_number: string
  working_hours: string
  customer_support_phone: string
  technician_support_phone: string
  whatsapp_number: string
  updated_at?: string
}

export function AdminSettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<SettingsForm>({
    company_name: '', upi_id: '', gst_number: '', working_hours: '',
    customer_support_phone: '', technician_support_phone: '', whatsapp_number: '',
  })

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.from('settings').select('*').eq('id', 1).maybeSingle()
      if (!mounted) return
      if (data) {
        const d = data as Record<string, unknown>
        setForm({
          company_name: (d.company_name as string) || '',
          upi_id: (d.upi_id as string) || '',
          gst_number: (d.gst_number as string) || '',
          working_hours: (d.working_hours as string) || '',
          customer_support_phone: (d.customer_support_phone as string) || '',
          technician_support_phone: (d.technician_support_phone as string) || '',
          whatsapp_number: (d.whatsapp_number as string) || '',
        })
      }
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase.from('settings').upsert({
      id: 1, company_name: form.company_name, upi_id: form.upi_id, gst_number: form.gst_number,
      working_hours: form.working_hours, customer_support_phone: form.customer_support_phone,
      technician_support_phone: form.technician_support_phone, whatsapp_number: form.whatsapp_number,
      updated_at: new Date().toISOString(),
    })
    setSaving(false)
    if (error) { toast('Failed to save settings', 'error'); return }
    toast('Settings saved successfully', 'success')
  }

  if (loading) return <LoadingScreen message="Loading settings..." />

  const fields: { key: keyof SettingsForm; label: string; placeholder: string }[] = [
    { key: 'company_name', label: 'Company Name', placeholder: 'VATTAMS Home Services' },
    { key: 'upi_id', label: 'UPI ID', placeholder: 'vattams@upi' },
    { key: 'gst_number', label: 'GST Number', placeholder: '33AAAAA0000A1Z5' },
    { key: 'working_hours', label: 'Working Hours', placeholder: '9:00 AM - 9:00 PM' },
    { key: 'customer_support_phone', label: 'Customer Support Phone', placeholder: '8189800757' },
    { key: 'technician_support_phone', label: 'Technician Support Phone', placeholder: '8189800757' },
    { key: 'whatsapp_number', label: 'WhatsApp Number', placeholder: '918189800757' },
  ]

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Settings</h1><p className="text-sm text-gray-500">Manage platform configuration</p></div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            <CardTitle>Company Settings</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.key}>
                <Label htmlFor={f.key}>{f.label}</Label>
                <Input id={f.key} value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder} />
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={handleSave} disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? 'Saving...' : 'Save Settings'}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
