import { useState } from 'react';
import { Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

interface Plan {
  id: string;
  name: string;
  display_name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: {
    maxPatients: number;
    maxUsers: number;
    maxBeds: number;
    storageGB: number;
    modules: string[];
    support: string;
    customBranding: boolean;
    whatsappIntegration: boolean;
    apiAccess: boolean;
  };
  is_popular: boolean;
}

export function PricingPlans() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const { data: plans, isLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return data as Plan[];
    }
  });

  if (isLoading) {
    return <div className="text-center py-12">Loading plans...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          Choose the Perfect Plan for Your Hospital
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Start with a 14-day free trial. No credit card required.
        </p>

        {/* Billing Period Toggle */}
        <div className="inline-flex items-center gap-4 bg-secondary p-1 rounded-lg">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-6 py-2 rounded-md transition-colors ${
              billingPeriod === 'monthly'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod('yearly')}
            className={`px-6 py-2 rounded-md transition-colors ${
              billingPeriod === 'yearly'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Yearly
            <Badge variant="success" className="ml-2">Save 17%</Badge>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-8">
        {plans?.map((plan) => (
          <PricingCard 
            key={plan.id} 
            plan={plan} 
            billingPeriod={billingPeriod}
          />
        ))}
      </div>

      {/* Feature Comparison Table */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-center mb-8">
          Detailed Feature Comparison
        </h2>
        <FeatureComparison plans={plans || []} />
      </div>
    </div>
  );
}

function PricingCard({ 
  plan, 
  billingPeriod 
}: { 
  plan: Plan; 
  billingPeriod: 'monthly' | 'yearly';
}) {
  const price = billingPeriod === 'monthly' 
    ? plan.price_monthly 
    : Math.round(plan.price_yearly / 12);

  const handleSelectPlan = () => {
    // Store selected plan and redirect to onboarding
    localStorage.setItem('selected_plan', plan.id);
    window.location.href = '/onboarding';
  };

  return (
    <Card 
      className={`relative p-8 ${
        plan.is_popular 
          ? 'border-primary shadow-xl scale-105' 
          : 'border-border'
      }`}
    >
      {/* Popular Badge */}
      {plan.is_popular && (
        <Badge 
          className="absolute -top-3 left-1/2 -translate-x-1/2"
          variant="default"
        >
          Most Popular
        </Badge>
      )}

      {/* Plan Header */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-2">{plan.display_name}</h3>
        <p className="text-muted-foreground text-sm">{plan.description}</p>
      </div>

      {/* Price */}
      <div className="mb-8">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold">₹{price.toLocaleString()}</span>
          <span className="text-muted-foreground">/month</span>
        </div>
        {billingPeriod === 'yearly' && (
          <p className="text-sm text-muted-foreground mt-2">
            Billed annually at ₹{plan.price_yearly.toLocaleString()}
          </p>
        )}
      </div>

      {/* CTA Button */}
      <Button 
        className="w-full mb-6" 
        variant={plan.is_popular ? 'default' : 'outline'}
        onClick={handleSelectPlan}
      >
        Start Free Trial
      </Button>

      {/* Features */}
      <div className="space-y-3">
        <Feature 
          text={`Up to ${plan.features.maxPatients === -1 ? 'Unlimited' : plan.features.maxPatients} patients`} 
        />
        <Feature 
          text={`${plan.features.maxUsers === -1 ? 'Unlimited' : plan.features.maxUsers} user accounts`} 
        />
        <Feature 
          text={`${plan.features.maxBeds === -1 ? 'Unlimited' : plan.features.maxBeds} bed management`} 
        />
        <Feature 
          text={`${plan.features.storageGB === -1 ? 'Unlimited' : plan.features.storageGB + 'GB'} storage`} 
        />
        
        <div className="pt-3 border-t border-border">
          <p className="text-sm font-medium mb-2">Modules Included:</p>
          {plan.features.modules.map(module => (
            <Feature 
              key={module} 
              text={formatModuleName(module)} 
              small 
            />
          ))}
        </div>

        <div className="pt-3 border-t border-border">
          <Feature 
            text={`${formatSupportType(plan.features.support)} support`} 
          />
          {plan.features.customBranding && <Feature text="Custom branding" />}
          {plan.features.whatsappIntegration && <Feature text="WhatsApp integration" />}
          {plan.features.apiAccess && <Feature text="API access" />}
        </div>
      </div>
    </Card>
  );
}

function Feature({ text, small = false }: { text: string; small?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <Check className={`${small ? 'h-4 w-4' : 'h-5 w-5'} text-primary mt-0.5 flex-shrink-0`} />
      <span className={small ? 'text-sm text-muted-foreground' : 'text-sm'}>
        {text}
      </span>
    </div>
  );
}

function FeatureComparison({ plans }: { plans: Plan[] }) {
  const features = [
    { key: 'maxPatients', label: 'Patient Records', format: (v: number) => v === -1 ? 'Unlimited' : v },
    { key: 'maxUsers', label: 'User Accounts', format: (v: number) => v === -1 ? 'Unlimited' : v },
    { key: 'maxBeds', label: 'Bed Management', format: (v: number) => v === -1 ? 'Unlimited' : v },
    { key: 'storageGB', label: 'Storage', format: (v: number) => v === -1 ? 'Unlimited' : `${v}GB` },
    { key: 'support', label: 'Support', format: (v: string) => formatSupportType(v) },
    { key: 'customBranding', label: 'Custom Branding', format: (v: boolean) => v ? '✓' : '—' },
    { key: 'whatsappIntegration', label: 'WhatsApp Notifications', format: (v: boolean) => v ? '✓' : '—' },
    { key: 'apiAccess', label: 'API Access', format: (v: boolean) => v ? '✓' : '—' },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left p-4 font-semibold">Feature</th>
            {plans.map(plan => (
              <th key={plan.id} className="p-4 font-semibold text-center">
                {plan.display_name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {features.map((feature, idx) => (
            <tr key={feature.key} className={idx % 2 === 0 ? 'bg-muted/50' : ''}>
              <td className="p-4 font-medium">{feature.label}</td>
              {plans.map(plan => (
                <td key={plan.id} className="p-4 text-center">
                  {feature.format((plan.features as any)[feature.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Helper functions
function formatModuleName(module: string): string {
  const names: Record<string, string> = {
    opd: 'OPD Management',
    ipd: 'IPD Management',
    lab: 'Laboratory',
    pharmacy: 'Pharmacy',
    radiology: 'Radiology',
    ot: 'Operation Theatre',
    billing: 'Billing & Invoicing'
  };
  return names[module] || module.toUpperCase();
}

function formatSupportType(type: string): string {
  const types: Record<string, string> = {
    email: 'Email',
    priority: 'Priority Email & Chat',
    dedicated: 'Dedicated Account Manager'
  };
  return types[type] || type;
}
