import { useEffect, useState } from 'react'
import { Loader as Loader2, Settings as SettingsIcon, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Settings } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AdminSettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Settings | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      const { data } = await supabase.from('settings').select('*').eq('id', 1).maybeSingle()
      if (!mounted) return
      setForm(data as Settings | null)
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [])

  const update = (field: keyof Settings, value: string) => {
    setForm((prev) => prev ? { ...prev, [field]: value } : prev)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return
    setSaving(true)
    try {
      const { updated_at, ...updateData } = form
      const { error } = await supabase.from('settings').update(updateData).eq('id', 1)
      if (error) throw error
      toast({ title: 'Settings updated successfully', variant: 'success' })
    } catch (err) {
      toast({ title: 'Update failed', description: (err as Error).message, variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const fields: { key: keyof Settings; label: string; placeholder: string }[] = [
    { key: 'company_name', label: 'Company Name', placeholder: 'VATTAMS Home Services' },
    { key: 'upi_id', label: 'UPI ID', placeholder: 'vattams@upi' },
    { key: 'gst_number', label: 'GST Number', placeholder: '33ABCDE1234F1Z5' },
    { key: 'working_hours', label: 'Working Hours', placeholder: '9:00 AM - 8:00 PM' },
    { key: 'customer_support_phone', label: 'Customer Support Phone', placeholder: '+91 98765 43210' },
    { key: 'technician_support_phone', label: 'Technician Support Phone', placeholder: '+91 98765 43211' },
    { key: 'whatsapp_number', label: 'WhatsApp Number', placeholder: '+91 98765 43212' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">Manage company settings and support information.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-gray-500" />
            Company Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {fields.map((f) => (
                <div key={f.key}>
                  <Label>{f.label}</Label>
                  <Input
                    className="mt-1"
                    placeholder={f.placeholder}
                    value={(form?.[f.key] as string) ?? ''}
                    onChange={(e) => update(f.key, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
