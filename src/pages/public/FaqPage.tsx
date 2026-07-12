import { useState } from 'react'
import { ChevronDown, ChevronUp, CircleHelp as HelpCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Link } from 'react-router-dom'

const faqs = [
  {
    q: 'How do I book a service with VATTAMS?',
    a: 'Simply register as a customer, navigate to the booking page, select your service, choose a date and time, and confirm. A verified technician will be assigned to your booking.',
  },
  {
    q: 'What areas do you serve?',
    a: 'We currently serve major cities across Tamil Nadu including Chennai, Coimbatore, Madurai, Tiruchirappalli, Salem, Tirunelveli, Vellore, Erode, Dindigul, and Thanjavur. Check our Cities page for the full list.',
  },
  {
    q: 'How are technicians verified?',
    a: 'Every technician undergoes a background check, skill assessment, and document verification. They also pay a verification fee before being approved to accept jobs on our platform.',
  },
  {
    q: 'What is the verification fee for technicians?',
    a: 'Technicians pay a one-time verification fee of ₹50 during registration. This fee is refundable after completing 4 jobs on the platform, as part of our commitment to technician welfare.',
  },
  {
    q: 'How do I track my booking?',
    a: 'Once your booking is confirmed and a technician is assigned, you can track the real-time status from your customer dashboard. You will receive notifications at each stage of the service.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'We accept UPI, credit/debit cards, net banking, and cash on completion. You can choose your preferred payment method at the time of booking or after the service is completed.',
  },
  {
    q: 'Can I cancel or reschedule a booking?',
    a: 'Yes, you can cancel or reschedule a booking from your dashboard. Cancellations are free if done before the technician is assigned. Rescheduling is subject to technician availability.',
  },
  {
    q: 'Do you provide a warranty on services?',
    a: 'Yes, all our services come with a quality guarantee. If you face any issue with the service within the warranty period, we will send a technician to fix it at no additional cost.',
  },
  {
    q: 'How do I become a technician with VATTAMS?',
    a: 'Register as a technician on our platform, provide your skills, experience, and location details. After paying the verification fee and passing the review, you can start accepting jobs.',
  },
  {
    q: 'Is there a customer support helpline?',
    a: 'Yes, you can reach our customer support via phone or WhatsApp. Visit our Contact page for all available support channels and timings.',
  },
]

export function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="py-12">
      <div className="mx-auto max-w-3xl px-4">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
            <HelpCircle className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="mt-4 text-4xl font-bold text-gray-900">Frequently Asked Questions</h1>
          <p className="mt-3 text-lg text-gray-600">
            Find answers to common questions about VATTAMS Home Services.
          </p>
        </div>

        <div className="mt-10 space-y-4">
          {faqs.map((faq, i) => (
            <Card key={i}>
              <CardContent className="p-0">
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left"
                >
                  <span className="font-semibold text-gray-900">{faq.q}</span>
                  {openIndex === i ? (
                    <ChevronUp className="h-5 w-5 flex-shrink-0 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 flex-shrink-0 text-gray-400" />
                  )}
                </button>
                {openIndex === i && (
                  <div className="px-6 pb-4">
                    <p className="text-sm text-gray-600">{faq.a}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 rounded-lg bg-blue-50 p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900">Still have questions?</h3>
          <p className="mt-1 text-sm text-gray-600">
            Our support team is here to help.{' '}
            <Link to="/contact" className="font-medium text-blue-600 hover:text-blue-700">
              Contact us
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
