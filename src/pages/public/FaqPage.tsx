import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

const faqs = [
  {
    q: 'How do I book a service with VATTAMS?',
    a: 'Simply register as a customer, select your city and service category, choose a date and time slot, and confirm your booking. You will receive a confirmation and a technician will be assigned to your request.',
  },
  {
    q: 'Are the technicians verified?',
    a: 'Yes. Every technician undergoes a background check and skill verification before joining our network. We also collect ratings and reviews after each completed service to maintain quality.',
  },
  {
    q: 'What areas do you currently serve?',
    a: 'We operate across major cities in Tamil Nadu including Chennai, Coimbatore, Madurai, Tiruchirappalli, Salem, Tirunelveli, Vellore, Erode, Dindigul, and Thanjavur. Check our Cities page for details.',
  },
  {
    q: 'How much do services cost?',
    a: 'Our pricing is transparent and upfront. Visit our Pricing page for starting rates on each service category. Final pricing may vary based on complexity and parts required, and you will always be informed before work begins.',
  },
  {
    q: 'Can I track my booking?',
    a: 'Yes. Once a technician is assigned, you can track the live status of your booking from your customer dashboard — from confirmation through to completion.',
  },
  {
    q: 'What if I am not satisfied with the service?',
    a: 'Your satisfaction is our priority. If you are not happy with the service, contact our support team via phone or WhatsApp. We will work to resolve the issue, including re-service or refunds where applicable.',
  },
  {
    q: 'How do I become a technician with VATTAMS?',
    a: 'Register as a technician, provide your skills, experience, and location details. After a one-time verification fee of ₹50, your application will be reviewed. Once approved, you can start receiving job assignments.',
  },
  {
    q: 'Is the verification fee refundable for technicians?',
    a: 'Yes. The ₹50 verification fee is refundable after you complete 4 eligible jobs on the platform. The refund is processed to your preferred payment method.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We support multiple payment methods including UPI, debit and credit cards, and net banking. Cash on service completion may also be available in select areas.',
  },
  {
    q: 'Do you offer a warranty on services?',
    a: 'Yes, most services come with a service warranty. The warranty period depends on the service type and will be communicated at the time of booking.',
  },
]

export function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">Frequently Asked Questions</h1>
        <p className="mt-3 text-lg text-gray-600">
          Find quick answers to common questions about VATTAMS services.
        </p>
      </div>

      <div className="mt-10 space-y-3">
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i
          return (
            <div key={i} className="rounded-lg border border-gray-200 bg-white">
              <button
                className="flex w-full items-center justify-between px-5 py-4 text-left"
                onClick={() => setOpenIndex(isOpen ? null : i)}
              >
                <span className="text-base font-medium text-gray-900">{faq.q}</span>
                {isOpen ? <ChevronUp className="h-5 w-5 flex-shrink-0 text-gray-500" /> : <ChevronDown className="h-5 w-5 flex-shrink-0 text-gray-500" />}
              </button>
              {isOpen && (
                <div className="border-t border-gray-100 px-5 py-4">
                  <p className="text-sm text-gray-600">{faq.a}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-12 rounded-lg bg-blue-50 p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Still have questions?</h2>
        <p className="mt-2 text-gray-600">Our support team is happy to help.</p>
        <a href="/contact" className="mt-4 inline-block rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Contact Us
        </a>
      </div>
    </div>
  )
}
