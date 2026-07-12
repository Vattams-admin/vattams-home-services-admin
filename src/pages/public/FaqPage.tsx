import { useState } from 'react';
import { ChevronDown, CircleHelp as HelpCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const faqs = [
  {
    q: 'How do I book a service on VATTAMS?',
    a: 'Simply click "Book Now", select your service, choose a date and time, enter your address, and confirm. You can also book via WhatsApp or phone call.',
  },
  {
    q: 'Are the technicians verified?',
    a: 'Yes, all VATTAMS technicians are background-checked, skill-verified, and trained professionals. We ensure quality and safety for every service.',
  },
  {
    q: 'What areas do you cover?',
    a: 'We currently cover all 38 districts of Tamil Nadu. You can check if your area is serviceable on our Cities page.',
  },
  {
    q: 'How is the pricing determined?',
    a: 'Each service has a base price displayed on the Services page. The final price may vary based on the complexity of work and materials required. You will always get an upfront quote before the service begins.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'We accept UPI, credit/debit cards, net banking, and cash. Online payments can be made securely through our platform after the service is completed.',
  },
  {
    q: 'Can I cancel or reschedule a booking?',
    a: 'Yes, you can cancel or reschedule a booking from your dashboard at any time before the technician is assigned. Cancellations after assignment may incur a nominal fee.',
  },
];

export function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
          <HelpCircle className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900">Frequently Asked Questions</h1>
        <p className="mt-2 text-lg text-gray-600">Find answers to common questions</p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <Card key={index}>
            <CardContent className="p-0">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="flex w-full items-center justify-between p-5 text-left"
              >
                <span className="font-semibold text-gray-900">{faq.q}</span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-gray-500 transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-5 pb-5">
                  <p className="text-gray-600">{faq.a}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
