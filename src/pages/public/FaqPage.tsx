import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

type Faq = { q: string; a: string }

const faqs: Faq[] = [
  { q: 'How do I book a service?', a: 'You can book a service by creating a customer account on our platform, selecting your desired service, choosing a date and time, and confirming your booking. You can also call us directly and our team will assist you.' },
  { q: 'What are the payment options?', a: 'We accept multiple payment methods including UPI, credit/debit cards, net banking, and cash after service completion. You can choose your preferred method at the time of booking or after the service is done.' },
  { q: 'Are the technicians verified?', a: 'Yes, all our technicians undergo background verification and are trained professionals. We ensure they meet our quality standards before they are assigned to any service request.' },
  { q: 'Can I cancel or reschedule a booking?', a: 'Yes, you can cancel or reschedule a booking from your dashboard. Cancellations made at least 2 hours before the scheduled time incur no charge. Late cancellations may be subject to a nominal fee.' },
  { q: 'Is there a warranty on the services?', a: 'Yes, we offer a 30-day service warranty on most services. If you face any issue related to the service within this period, we will send a technician to fix it at no additional cost.' },
  { q: 'How is the pricing determined?', a: 'Our pricing is transparent and based on the service category. Each service has a base price, and any additional work or spare parts required will be quoted by the technician before proceeding. There are no hidden charges.' },
  { q: 'What if I am not satisfied with the service?', a: 'Customer satisfaction is our priority. If you are not satisfied, please contact our support team within 48 hours. We will arrange a revisit or resolve the issue at no extra cost.' },
  { q: 'Do you provide service on weekends?', a: 'Yes, our technicians are available on weekends and public holidays. You can select your preferred date and time while booking, including weekend slots.' },
  { q: 'How long does a typical service take?', a: 'The duration depends on the type and complexity of the service. Most standard services take 1-2 hours. The technician will give you an estimated time upon assessment.' },
  { q: 'Can I provide feedback or rate the technician?', a: 'Absolutely! After every completed service, you can rate your technician and leave a review from your dashboard. Your feedback helps us maintain quality and improve our services.' },
]

export function FaqPage() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <div>
      <section className="bg-gradient-to-br from-blue-700 to-blue-800 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h1 className="text-4xl font-bold">Frequently Asked Questions</h1>
          <p className="mt-2 text-blue-100">Find answers to common questions about our services</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16">
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <Card key={i}>
              <CardContent className="p-0">
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="flex w-full items-center justify-between p-4 text-left"
                >
                  <span className="font-medium text-gray-900">{faq.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-gray-500 transition-transform ${
                      open === i ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {open === i && (
                  <div className="border-t px-4 py-3 text-sm text-gray-600">{faq.a}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
