import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown, Search, Phone, MessageCircle, CircleHelp as HelpCircle, Calendar, CreditCard, Wrench, ShieldCheck, ArrowRight, User, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  PRIMARY_PHONE,
  WHATSAPP_NUMBER,
  telLink,
  whatsappLink,
} from '@/lib/constants'

interface FAQItem {
  question: string
  answer: string
  category: string
}

const faqCategories = [
  { id: 'all', label: 'All Questions', icon: HelpCircle },
  { id: 'booking', label: 'Booking', icon: Calendar },
  { id: 'pricing', label: 'Pricing & Payment', icon: CreditCard },
  { id: 'technicians', label: 'Technicians', icon: Wrench },
  { id: 'service', label: 'Service & Warranty', icon: ShieldCheck },
]

const faqItems: FAQItem[] = [
  // Booking
  {
    category: 'booking',
    question: 'How do I book a service with VATTAMS?',
    answer: "Booking a service is easy! You can book online through our website by clicking the \"Book Now\" button, or you can call us directly at 8189800757. You can also message us on WhatsApp to book a service. Simply choose your service, select a convenient time slot, and we'll assign a verified technician to your booking.",
  },
  {
    category: 'booking',
    question: 'How far in advance do I need to book?',
    answer: 'You can book a service as early as one day in advance. For urgent requirements, we also offer same-day service in most cities, subject to technician availability. We recommend booking at least 2-4 hours in advance for same-day service.',
  },
  {
    category: 'booking',
    question: 'Can I reschedule or cancel my booking?',
    answer: 'Yes, you can reschedule or cancel your booking at no extra cost if done at least 2 hours before the scheduled time. Simply log into your account or call our customer support at 8189800757 to make changes to your booking.',
  },
  {
    category: 'booking',
    question: 'What time slots are available for booking?',
    answer: 'We offer flexible time slots from 7:00 AM to 10:00 PM, seven days a week. You can choose from 2-hour slots such as 7-9 AM, 9-11 AM, 11 AM-1 PM, 1-3 PM, 3-5 PM, 5-7 PM, and 7-9 PM. Emergency services are available 24/7 in select cities.',
  },
  {
    category: 'booking',
    question: 'Do I need to create an account to book a service?',
    answer: 'While you can book without an account by calling us, we recommend creating an account for a better experience. With an account, you can track your bookings, view service history, make payments online, and earn referral rewards.',
  },

  // Pricing & Payment
  {
    category: 'pricing',
    question: 'How is the pricing determined?',
    answer: 'Our pricing is transparent and upfront. Each service has a base starting price which you can view on our Services and Pricing pages. The final price may vary based on the complexity of the job, materials required, and any additional parts needed. You will always be informed of the final price before the technician begins the work.',
  },
  {
    category: 'pricing',
    question: 'Are there any hidden charges?',
    answer: 'No, there are absolutely no hidden charges. The price quoted to you at the time of booking is what you pay. If additional work or parts are needed, the technician will inform you and get your approval before proceeding. Any additional charges will be clearly communicated.',
  },
  {
    category: 'pricing',
    question: 'What payment methods do you accept?',
    answer: 'We accept multiple payment methods for your convenience: UPI (Google Pay, PhonePe, Paytm), debit/credit cards, net banking, and cash. You can pay online after the service is completed or pay cash directly to the technician.',
  },
  {
    category: 'pricing',
    question: 'Do you offer any discounts or coupons?',
    answer: 'Yes! We regularly offer discounts and coupons, especially for first-time customers, festival seasons, and referrals. You can check available coupons on the booking page or follow us on social media for the latest offers. You can also earn referral rewards by inviting friends.',
  },
  {
    category: 'pricing',
    question: 'Is there a visit charge if no repair is done?',
    answer: 'A nominal visit charge of ₹99 applies if the technician visits but no service is performed (e.g., if you cancel after the technician arrives or if the issue requires parts that are not available). This charge is waived if you proceed with the repair.',
  },

  // Technicians
  {
    category: 'technicians',
    question: 'Are your technicians verified and trained?',
    answer: 'Yes, absolutely. Every technician at VATTAMS undergoes a thorough background verification process including identity verification, address verification, and skill assessment. They are also trained in customer service and safety protocols. Only verified and approved technicians are assigned to customer bookings.',
  },
  {
    category: 'technicians',
    question: 'Can I choose a specific technician?',
    answer: "While you cannot choose a specific technician at the time of booking, you can request the same technician for future services if you were happy with their work. Simply mention the technician's name or ID when booking, and we will try our best to assign them, subject to availability.",
  },
  {
    category: 'technicians',
    question: 'What if I am not satisfied with the technician?',
    answer: "Your satisfaction is our priority. If you are not satisfied with the technician's work, please contact our customer support immediately at 8189800757. We will arrange for a re-visit or assign a different technician at no extra cost. Your feedback helps us maintain our quality standards.",
  },
  {
    category: 'technicians',
    question: 'Do technicians carry their own tools and materials?',
    answer: 'Yes, our technicians come fully equipped with all necessary tools and standard materials. However, if specific spare parts are required, they will inform you of the cost and availability. In some cases, the technician may need to source parts from a local supplier, which may take additional time.',
  },
  {
    category: 'technicians',
    question: 'I am a technician. How can I join VATTAMS?',
    answer: 'We are always looking for skilled technicians to join our network! You can register on our website by clicking "Login" and selecting "Technician" as your role. After registration, you will need to complete a verification process which includes a nominal verification fee of ₹50. Once approved, you can start receiving job assignments. Call our technician helpline at 8189800767 for more information.',
  },

  // Service & Warranty
  {
    category: 'service',
    question: 'Do you provide a warranty on your services?',
    answer: 'Yes, we provide a 30-day service warranty on most repair services. If the same issue recurs within the warranty period, we will fix it free of charge. The warranty covers the specific repair performed and does not cover new issues or damage caused by misuse.',
  },
  {
    category: 'service',
    question: 'What if the problem comes back after the warranty period?',
    answer: 'If the same problem recurs after the warranty period, you can book a new service. However, as a returning customer, you may be eligible for discounts. We recommend regular maintenance to prevent recurring issues.',
  },
  {
    category: 'service',
    question: 'Do you provide services for all brands?',
    answer: 'Yes, our technicians are trained to service all major brands of appliances and equipment. Whether it is LG, Samsung, Whirlpool, Voltas, Daikin, or any other brand, our technicians have the expertise to handle it. We use genuine spare parts wherever required.',
  },
  {
    category: 'service',
    question: 'What areas do you currently serve?',
    answer: 'We currently serve 10+ cities across Tamil Nadu including Chennai, Coimbatore, Madurai, Tiruchirappalli, Salem, Tirunelveli, Vellore, Erode, Dindigul, and Thanjavur. We are rapidly expanding to more cities. Check our Cities page for the latest updates on service availability.',
  },
  {
    category: 'service',
    question: 'How do I track my booking?',
    answer: 'Once your booking is confirmed and a technician is assigned, you can track the status in real-time through your account dashboard. You will also receive notifications at each stage: confirmed, technician assigned, on the way, arrived, and completed. You can also call our support team for updates.',
  },
  {
    category: 'service',
    question: 'Is it safe to let the technician into my home?',
    answer: "Yes, safety is our top priority. All our technicians are background-verified with valid ID proofs. They wear VATTAMS uniforms and carry ID cards. You can verify the technician's identity on the app before allowing them in. We also follow strict safety and hygiene protocols including the use of masks and sanitizers.",
  },
]

export default function FaqPage() {
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState('all')
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredFaqs = faqItems.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory
    const matchesSearch =
      !searchQuery ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-4 border-white/20 bg-white/10 text-white">
              FAQ
            </Badge>
            <h1 className="text-4xl font-bold sm:text-5xl">Frequently Asked Questions</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-blue-100">
              Find answers to common questions about booking, pricing, technicians, and more. Can't find what you're looking for? Contact us anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Search */}
      <section className="bg-slate-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setSearchQuery(e.target.value)}
                className="pl-12"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter & FAQ */}
      <section className="bg-slate-50 pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Category Tabs */}
          <div className="mb-8 flex flex-wrap justify-center gap-2">
            {faqCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id)
                  setOpenIndex(null)
                }}
                className={cn(
                  'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition',
                  activeCategory === cat.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-600'
                )}
              >
                <cat.icon className="h-4 w-4" />
                {cat.label}
              </button>
            ))}
          </div>

          {/* FAQ Accordion */}
          <div className="space-y-3">
            {filteredFaqs.map((faq, index) => (
              <Card
                key={index}
                className={cn(
                  'overflow-hidden transition',
                  openIndex === index && 'ring-2 ring-blue-500'
                )}
              >
                <button
                  onClick={() => toggleAccordion(index)}
                  className="flex w-full items-center justify-between p-5 text-left"
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle className="h-5 w-5 flex-shrink-0 text-blue-600" />
                    <h3 className="text-base font-semibold text-slate-900">{faq.question}</h3>
                  </div>
                  <ChevronDown
                    className={cn(
                      'h-5 w-5 flex-shrink-0 text-slate-400 transition-transform',
                      openIndex === index && 'rotate-180'
                    )}
                  />
                </button>
                <div
                  className={cn(
                    'grid transition-all duration-300',
                    openIndex === index ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  )}
                >
                  <div className="overflow-hidden">
                    <CardContent className="p-5 pt-0">
                      <p className="pl-8 text-sm leading-relaxed text-slate-600">{faq.answer}</p>
                    </CardContent>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {filteredFaqs.length === 0 && (
            <div className="py-12 text-center">
              <HelpCircle className="mx-auto mb-4 h-12 w-12 text-slate-300" />
              <p className="text-lg text-slate-500">
                No questions found matching your search. Try a different query or contact us directly.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="text-center transition hover:shadow-lg">
              <CardContent className="p-8">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50">
                  <Phone className="h-7 w-7 text-blue-600" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">Call Us</h3>
                <p className="mb-4 text-sm text-slate-600">
                  Speak directly with our customer support team
                </p>
                <a href={telLink(PRIMARY_PHONE)}>
                  <Button variant="outline" className="w-full">
                    <Phone className="mr-2 h-4 w-4" /> {PRIMARY_PHONE}
                  </Button>
                </a>
              </CardContent>
            </Card>
            <Card className="text-center transition hover:shadow-lg">
              <CardContent className="p-8">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-green-50">
                  <MessageCircle className="h-7 w-7 text-green-600" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">WhatsApp</h3>
                <p className="mb-4 text-sm text-slate-600">
                  Chat with us on WhatsApp for quick answers
                </p>
                <a href={whatsappLink(WHATSAPP_NUMBER, 'Hi, I have a question about your services.')}>
                  <Button variant="outline" className="w-full">
                    <MessageCircle className="mr-2 h-4 w-4" /> Chat Now
                  </Button>
                </a>
              </CardContent>
            </Card>
            <Card className="text-center transition hover:shadow-lg">
              <CardContent className="p-8">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-amber-50">
                  <User className="h-7 w-7 text-amber-600" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">Contact Form</h3>
                <p className="mb-4 text-sm text-slate-600">
                  Send us a detailed message with your query
                </p>
                <Link to="/contact">
                  <Button variant="outline" className="w-full">
                    Contact Form <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <Star className="mx-auto mb-4 h-10 w-10 fill-amber-400 text-amber-400" />
          <h2 className="text-3xl font-bold sm:text-4xl">Ready to Experience Quality Service?</h2>
          <p className="mt-4 text-lg text-blue-100">
            Book a service today and join 10,000+ happy customers across Tamil Nadu.
          </p>
          <div className="mt-8">
            <Link to="/connect">
              <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50">
                Connect <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
