import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const faqs = [
  { q: 'How do I book a service with VATTAMS?', a: 'You can book a service online by clicking "Book Now" and creating a customer account. Select your service, choose a date and time, and our verified technician will arrive at your doorstep.' },
  { q: 'Which cities does VATTAMS serve?', a: 'We currently serve Chennai, Coimbatore, Madurai, Tiruchirappalli, Salem, Tirunelveli, Vellore, Erode, Dindigul, and Thanjavur. We are expanding to more cities across Tamil Nadu.' },
  { q: 'Are your technicians verified?', a: 'Yes, all our technicians undergo a thorough background check and skill verification process. We ensure only qualified and trusted professionals serve you.' },
  { q: 'What services do you offer?', a: 'We offer AC service, washing machine repair, refrigerator repair, plumbing, electrical work, general repairs, CCTV installation, and pest control services.' },
  { q: 'How much do your services cost?', a: 'Our pricing is transparent and starts from ₹249 for basic services. The final cost depends on the service type, complexity, and parts required. You can view our pricing page for more details.' },
  { q: 'Do you provide a warranty on services?', a: 'Yes, we provide a warranty on all our services ranging from 30 days to 6 months depending on the service plan you choose.' },
  { q: 'How can I pay for the service?', a: 'We accept multiple payment methods including UPI, debit/credit cards, and cash. Payment is collected after the service is completed to your satisfaction.' },
  { q: 'Can I cancel or reschedule my booking?', a: 'Yes, you can cancel or reschedule your booking through your customer dashboard. Please try to do so at least 2 hours before the scheduled time.' },
  { q: 'How do I become a technician with VATTAMS?', a: 'You can register as a technician by clicking "Register" and selecting the technician role. After registration, you will need to complete a verification process and pay a small verification fee.' },
  { q: 'What is the technician verification fee?', a: 'The technician verification fee is ₹50. This is a one-time fee that covers background verification and onboarding. The fee is refundable after completing 4 jobs with VATTAMS.' },
  { q: 'Do you offer same-day service?', a: 'Yes, we offer same-day service for most bookings depending on technician availability in your area. Emergency same-day service may have an additional charge.' },
  { q: 'How can I leave a review for a service?', a: 'After your service is completed, you can leave a review through your customer dashboard. Your feedback helps us maintain quality and helps other customers.' },
]

export function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="py-12">
      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-10 text-center">
          <h1 className="mb-3 text-4xl font-bold text-gray-900">Frequently Asked Questions</h1>
          <p className="text-gray-600">Find answers to common questions about VATTAMS Home Services.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <span className="font-semibold text-gray-900">{faq.q}</span>
                <ChevronDown
                  className={cn('h-5 w-5 flex-shrink-0 text-gray-400 transition-transform', openIndex === i && 'rotate-180')}
                />
              </button>
              {openIndex === i && (
                <div className="px-5 pb-4">
                  <p className="text-sm text-gray-600">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-lg bg-blue-50 p-8 text-center">
          <h2 className="mb-2 text-2xl font-bold text-gray-900">Still Have Questions?</h2>
          <p className="mb-4 text-gray-600">Our support team is here to help you.</p>
          <a href="/contact" className="inline-block rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700">
            Contact Us
          </a>
        </div>
      </div>
    </div>
  )
}
