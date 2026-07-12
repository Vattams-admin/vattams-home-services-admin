import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type Faq = { q: string; a: string }

const faqs: Faq[] = [
  {
    q: 'How do I book a service with VATTAMS?',
    a: 'You can book a service by creating a customer account on our platform, selecting your service, city, and preferred time slot. Once booked, you will receive a confirmation and our team will assign a verified technician to your booking.',
  },
  {
    q: 'Which cities does VATTAMS currently serve?',
    a: 'We currently serve 10 major cities across Tamil Nadu including Chennai, Coimbatore, Madurai, Tiruchirappalli, Salem, Tirunelveli, Vellore, Erode, Dindigul, and Thanjavur. We are expanding to more cities soon.',
  },
  {
    q: 'Are the technicians verified and background-checked?',
    a: 'Yes. Every technician on our platform goes through a verification process including identity verification, background checks, and skill assessment. Only approved technicians are assigned to customer bookings.',
  },
  {
    q: 'How is pricing determined for services?',
    a: 'We offer transparent pricing with a clear price list for each service category. The starting price is shown upfront, and the final quote is provided before the service begins. There are no hidden charges.',
  },
  {
    q: 'What if I am not satisfied with the service?',
    a: 'Customer satisfaction is our priority. If you are not satisfied with the service, please contact our support team within 48 hours. We will work to resolve the issue, including re-service or refund where applicable.',
  },
  {
    q: 'Can I track my booking in real-time?',
    a: 'Yes. Once a technician is assigned and accepts your booking, you can track the live status of your service from confirmation through completion, including when the technician is on the way and has arrived.',
  },
  {
    q: 'How do I become a technician with VATTAMS?',
    a: 'You can register as a technician on our platform. After registration, you will need to pay a small verification fee and complete document verification. Once approved by our admin team, you can start receiving job assignments.',
  },
  {
    q: 'Is there a verification fee for technicians?',
    a: 'Yes, there is a nominal one-time verification fee of ₹50 to cover background checks and document verification. This fee is refundable after you complete 4 eligible jobs on our platform.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'We accept multiple payment methods including UPI, debit/credit cards, and cash. The available payment options will be shown at the time of booking and invoice generation.',
  },
  {
    q: 'Do you offer any warranty on services?',
    a: 'Yes, our service plans include warranty periods ranging from 7 days for basic repairs to 30 days for standard services. Annual maintenance plans include coverage for the full subscription period.',
  },
]

export function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="py-12">
      <div className="mx-auto max-w-3xl px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">Frequently Asked Questions</h1>
          <p className="mx-auto mt-3 max-w-2xl text-gray-600">
            Find answers to common questions about VATTAMS services, booking, pricing, and more.
          </p>
        </div>

        <div className="mt-10 space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i
            return (
              <div key={i} className="rounded-lg border border-gray-200 bg-white">
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                >
                  <span className="font-medium text-gray-900">{faq.q}</span>
                  <ChevronDown
                    className={cn('h-5 w-5 flex-shrink-0 text-gray-400 transition-transform', isOpen && 'rotate-180')}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-sm text-gray-600">
                    {faq.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-10 rounded-lg bg-blue-50 p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900">Still have questions?</h2>
          <p className="mt-2 text-gray-600">Our support team is here to help you.</p>
          <a href="/contact" className="mt-4 inline-block">
            <span className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Contact Support
            </span>
          </a>
        </div>
      </div>
    </div>
  )
}
