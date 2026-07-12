import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const tiers = [
  {
    name: 'Basic',
    price: '₹499',
    period: '/visit',
    description: 'Perfect for small fixes and quick repairs',
    features: ['1 service per visit', 'Basic repair work', 'Up to 1 hour service', 'Email support'],
    popular: false,
  },
  {
    name: 'Standard',
    price: '₹999',
    period: '/visit',
    description: 'Most popular for regular home maintenance',
    features: ['1 service per visit', 'Standard repair & maintenance', 'Up to 2 hours service', 'Phone & email support', '30-day service warranty'],
    popular: true,
  },
  {
    name: 'Premium',
    price: '₹1,999',
    period: '/visit',
    description: 'Comprehensive service with priority support',
    features: ['1 service per visit', 'Premium repair & maintenance', 'Up to 4 hours service', '24/7 priority support', '90-day service warranty', 'Free follow-up visit'],
    popular: false,
  },
];

export function PricingPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-gray-900">Simple, Transparent Pricing</h1>
        <p className="mt-2 text-lg text-gray-600">Choose the plan that fits your needs</p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {tiers.map((tier) => (
          <Card
            key={tier.name}
            className={tier.popular ? 'border-blue-600 ring-2 ring-blue-600' : ''}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{tier.name}</CardTitle>
                {tier.popular && <Badge>Most Popular</Badge>}
              </div>
              <p className="text-sm text-gray-500">{tier.description}</p>
              <div className="mt-4">
                <span className="text-4xl font-bold">{tier.price}</span>
                <span className="text-gray-500">{tier.period}</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="mb-6 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className="w-full" variant={tier.popular ? 'default' : 'outline'}>
                <Link to="/register/customer">Get Started</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
