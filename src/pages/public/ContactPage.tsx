import { useState } from 'react';
import { Phone, Mail, MapPin, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PRIMARY_PHONE_DISPLAY, SUPPORT_PHONE_DISPLAY, telLink, PRIMARY_PHONE, SUPPORT_PHONE } from '@/lib/constants';

export function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('contact_messages').insert({
        name, email, phone, message,
      });
      if (error) throw error;
      toast({ title: 'Message sent!', description: 'We will get back to you soon.', variant: 'success' });
      setName(''); setEmail(''); setPhone(''); setMessage('');
    } catch (err) {
      toast({ title: 'Failed to send message', description: (err as Error).message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-gray-900">Contact Us</h1>
        <p className="mt-2 text-lg text-gray-600">We're here to help with any questions</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Contact Info */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-4 text-xl font-semibold">Contact Information</h2>
              <div className="space-y-4">
                <a href={telLink(PRIMARY_PHONE)} className="flex items-center gap-4 hover:text-blue-600">
                  <div className="rounded-full bg-blue-50 p-3">
                    <Phone className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Primary Phone</p>
                    <p className="font-semibold">{PRIMARY_PHONE_DISPLAY}</p>
                  </div>
                </a>
                <a href={telLink(SUPPORT_PHONE)} className="flex items-center gap-4 hover:text-blue-600">
                  <div className="rounded-full bg-blue-50 p-3">
                    <Phone className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Support Phone</p>
                    <p className="font-semibold">{SUPPORT_PHONE_DISPLAY}</p>
                  </div>
                </a>
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-blue-50 p-3">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-semibold">support@vattams.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-blue-50 p-3">
                    <MapPin className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Coverage Area</p>
                    <p className="font-semibold">Tamil Nadu (38 Districts)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Form */}
        <Card>
          <CardHeader>
            <CardTitle>Send a Message</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" placeholder="9876543210" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" placeholder="How can we help you?" value={message} onChange={(e) => setMessage(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : <>Send Message <Send className="ml-2 h-4 w-4" /></>}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
