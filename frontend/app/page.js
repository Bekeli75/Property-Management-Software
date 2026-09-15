'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { Building2, Users, FileText, CreditCard, Wrench, BarChart3, Shield, TrendingUp, Star, ArrowRight, Check, Shield as ShieldIcon, Zap, Globe, Lock, MessageSquare, Code, Heart } from 'lucide-react';

const features = [
  {
    icon: Building2,
    title: 'Property & Unit Management',
    description: 'Organize properties, units, and floor plans with drag-and-drop floor plans and bulk operations.',
  },
  {
    icon: Users,
    title: 'Tenant & Lease Management',
    description: 'Automated lease lifecycle, tenant screening, document storage, and renewal reminders.',
  },
  {
    icon: CreditCard,
    title: 'Automated Rent Collection',
    description: 'Recurring payments, Chapa integration, late fee automation, and instant reconciliation.',
  },
  {
    icon: Wrench,
    title: 'Maintenance & Work Orders',
    description: 'Tenant portal submissions, vendor dispatch, SLA tracking, and completion photos.',
  },
  {
    icon: BarChart3,
    title: 'Financial Reporting',
    description: 'Real-time P&L, occupancy reports, expense tracking, and owner statements.',
  },
  {
    icon: Shield,
    title: 'Role-Based Access Control',
    description: 'Granular permissions for admins, owners, managers, and tenants with audit logs.',
  },
];

const testimonials = [
  {
    name: 'Marta Bekele',
    role: 'Property Owner, 12 units',
    avatar: 'MB',
    content: 'Propentra reduced my admin time by 80%. Rent collection is automated, maintenance requests are tracked, and I finally have real-time visibility into my portfolio performance.',
    rating: 5,
  },
  {
    name: 'Yonas Tesfaye',
    role: 'Property Manager, 45 units',
    avatar: 'YT',
    content: 'The maintenance workflow alone saved us 15 hours/week. Tenants submit requests with photos, vendors get dispatched automatically, and I track everything from my phone.',
    rating: 5,
  },
  {
    name: 'Sara Ahmed',
    role: 'Tenant, 2 years',
    avatar: 'SA',
    content: 'Paying rent takes 30 seconds. Maintenance requests get updates in real-time. Finally, a property management system that actually works for tenants too.',
    rating: 5,
  },
];

const pricing = [
  {
    name: 'Starter',
    price: 'ETB 2,999',
    period: '/month',
    description: 'Perfect for individual landlords',
    features: [
      'Up to 10 units',
      'Automated rent collection',
      'Maintenance tracking',
      'Basic reporting',
      'Email support',
    ],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'Professional',
    price: 'ETB 7,999',
    period: '/month',
    description: 'For growing property managers',
    features: [
      'Up to 50 units',
      'Advanced reporting & analytics',
      'Maintenance workflow automation',
      'Owner portal access',
      'Priority email & chat support',
      'API access',
    ],
    cta: 'Get Started',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large portfolios & enterprises',
    features: [
      'Unlimited units',
      'Custom integrations & API',
      'Dedicated account manager',
      'Custom workflows & SLA',
      'SSO & advanced security',
      'On-premise deployment option',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Logo size="lg" markOnly className="mx-auto animate-pulse" />
          <div className="mx-auto mt-6 h-10 w-10 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
          <p className="mt-4 text-sm font-medium text-slate-500">Loading…</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // AuthGuard will redirect
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <nav className="mx-auto max-w-[1400px] flex h-16 items-center justify-between px-5 sm:px-8" aria-label="Main navigation">
          <Link href="/" className="flex items-center gap-2" aria-label="Propentra Home">
            <Logo size="lg" />
            <span className="hidden text-xl font-semibold text-slate-900 sm:block">Propentra</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-slate-600 hover:text-teal-600 transition">Features</Link>
            <Link href="#pricing" className="text-sm font-medium text-slate-600 hover:text-teal-600 transition">Pricing</Link>
            <Link href="#testimonials" className="text-sm font-medium text-slate-600 hover:text-teal-600 transition">Testimonials</Link>
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-teal-600 transition">Sign In</Link>
            <Link href="/register" className="btn btn-primary px-4 py-2">Get Started Free</Link>
          </div>
        </nav>
      </header>

<main id="main" className="outline-none">
        <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white pt-20 pb-32 sm:pt-28 sm:pb-40 lg:pt-32 lg:pb-48">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-teal-100/50 blur-3xl" />
            <div className="absolute bottom-1/4 left-1/4 w-72 h-72 rounded-full bg-amber-100/50 blur-3xl" />
          </div>
          <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-4 flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
                <Zap size={16} className="text-teal-600" />
                New: Chapa Payment Integration & Dark Mode
              </p>
              <h1 className="mb-6 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Property Management
                <br />
                <span className="text-teal-600">Made Simple</span>
              </h1>
              <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-600">
                Automate rent collection, streamline maintenance, and gain real-time insights into your portfolio.
                Built for owners, managers, and tenants.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/register" className="btn btn-primary w-full sm:w-auto px-8 py-3.5 text-lg">
                  Start Free Trial
                  <ArrowRight size={18} className="ml-2" />
                </Link>
                <Link href="/login" className="btn btn-secondary w-full sm:w-auto px-8 py-3.5 text-lg">
                  Sign In
                </Link>
              </div>
              <p className="mt-6 text-sm text-slate-500">
                No credit card required • 14-day free trial • Cancel anytime
              </p>
            </div>
            {/* Hero Visual */}
            <div className="mt-16 relative">
              <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
                <div className="flex h-9 bg-slate-50 border-b border-slate-200 px-4 items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-400" />
                    <div className="h-3 w-3 rounded-full bg-yellow-400" />
                    <div className="h-3 w-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 text-center text-xs text-slate-500">app.propentra.com/dashboard</div>
                </div>
                <div className="p-8">
                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="rounded-xl bg-slate-50 p-6">
                      <div className="flex items-center gap-2 text-sm font-semibold text-teal-700">
                        <TrendingUp size={16} className="text-teal-600" />
                        Occupancy
                      </div>
                      <div className="mt-2 text-3xl font-bold text-slate-950">94%</div>
                      <div className="mt-1 flex items-center gap-1 text-sm text-emerald-600">
                        <span>↑ 2.1%</span> vs last month
                      </div>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-6">
                      <div className="flex items-center gap-2 text-sm font-semibold text-amber-700">
                        <CreditCard size={16} className="text-amber-600" />
                        Monthly Revenue
                      </div>
                      <div className="mt-2 text-3xl font-bold text-slate-950">ETB 2.4M</div>
                      <div className="mt-1 flex items-center gap-1 text-sm text-emerald-600">
                        <span>↑ 12%</span> vs last month
                      </div>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-6">
                      <div className="flex items-center gap-2 text-sm font-semibold text-amber-700">
                        <Wrench size={16} className="text-amber-600" />
                        Open Tickets
                      </div>
                      <div className="mt-2 text-3xl font-bold text-slate-950">3</div>
                      <div className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                        2 in progress • 1 pending
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Indicators */}
        <section className="py-16 border-y border-slate-200 bg-slate-50/50">
          <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
            <p className="mb-8 text-center text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Trusted by property professionals across Ethiopia</p>
            <div className="flex flex-wrap items-center justify-center gap-10 opacity-60 grayscale hover:grayscale-0 transition-all duration-300">
              <span className="text-lg font-semibold text-slate-400">Addis Housing</span>
              <span className="text-lg font-semibold text-slate-400">Ethio Properties</span>
              <span className="text-lg font-semibold text-slate-400">Capital Realty</span>
              <span className="text-lg font-semibold text-slate-400">Prime Estates</span>
              <span className="text-lg font-semibold text-slate-400">Habesha Homes</span>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-24 bg-white">
          <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Features</p>
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Everything you need to manage properties efficiently
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-slate-600">
                From lease management to automated payments, Propentra covers every aspect of property management.
              </p>
            </div>
            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <article key={index} className="card p-6 group">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 group-hover:scale-110 transition-transform">
                    <feature.icon size={22} />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-24 bg-slate-50">
          <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Testimonials</p>
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Loved by owners, managers, and tenants
              </h2>
            </div>
            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <article key={index} className="card p-6">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} size={18} className="text-amber-400 fill-current" />
                    ))}
                  </div>
                  <p className="mb-6 text-base leading-7 text-slate-700 dark:text-slate-300">&ldquo;{testimonial.content}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-sm font-bold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-950 dark:text-white">{testimonial.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{testimonial.role}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-24 bg-white">
          <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Pricing</p>
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Simple, transparent pricing
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-slate-600">
                All plans include a 14-day free trial. No credit card required. Cancel anytime.
              </p>
            </div>
            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {pricing.map((plan, index) => (
                <article key={index} className={`relative card p-6 ${plan.popular ? 'ring-2 ring-teal-500 dark:ring-teal-400' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-teal-500 px-3 py-1 text-xs font-semibold text-white">Most Popular</span>
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{plan.name}</h3>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-slate-950 dark:text-white">{plan.price}</span>
                      <span className="text-slate-500 dark:text-slate-400">{plan.period}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{plan.description}</p>
                  </div>
                  <ul className="mb-8 space-y-3" role="list">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check size={18} className="mt-0.5 shrink-0 text-teal-600 dark:text-teal-400" />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={plan.popular ? '/register' : '#'}
                    className={`btn w-full ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {plan.cta}
                  </Link>
                </article>
              ))}
            </div>
            <p className="mt-10 text-center text-sm text-slate-500">
              All plans include 14-day free trial. No credit card required.{' '}
              <Link href="/contact" className="font-semibold text-teal-700 hover:underline dark:text-teal-300">
                Contact sales
              </Link>{' '}
              for Enterprise pricing.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 bg-gradient-to-br from-teal-600 to-teal-700">
          <div className="mx-auto max-w-[1400px] px-5 sm:px-8 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to simplify property management?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-teal-100">
              Join hundreds of property professionals who trust Propentra. Start your 14-day free trial today.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/register" className="btn btn-primary w-full sm:w-auto px-8 py-3.5 text-lg bg-white text-teal-700 hover:bg-slate-100">
                Start Free Trial
                <ArrowRight size={18} className="ml-2" />
              </Link>
              <Link href="/contact" className="btn w-full sm:w-auto px-8 py-3.5 text-lg border-2 border-white text-white hover:bg-white/10">
                Contact Sales
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-[1500px] px-5 py-10 sm:px-8 sm:py-14">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-6">
            <div className="lg:col-span-2 space-y-4">
              <Link href="/" className="flex items-center gap-2" aria-label="Propentra Home">
                <Logo size="lg" />
                <span className="text-xl font-semibold text-slate-900 dark:text-white">Propentra</span>
              </Link>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xs">
                Professional property management platform for owners, managers, and tenants.
              </p>
              <div className="flex gap-4">
                <a href="https://twitter.com/propentra" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 transition"><MessageSquare size={18} /></a>
                <a href="https://github.com/propentra" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 transition"><Code size={18} /></a>
                <a href="https://linkedin.com/company/propentra" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 transition"><Heart size={18} /></a>
                <a href="https://facebook.com/propentra" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 transition"><Globe size={18} /></a>
              </div>
            </div>
            <nav aria-label="Product links"><h3 className="font-semibold text-slate-900 dark:text-white">Product</h3><ul className="mt-4 space-y-3" role="list"><li><Link href="/properties" className="text-sm text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition">Properties</Link></li><li><Link href="/tenants" className="text-sm text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition">Tenants</Link></li><li><Link href="/leases" className="text-sm text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition">Leases</Link></li><li><Link href="/payments" className="text-sm text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition">Payments</Link></li><li><Link href="/maintenance" className="text-sm text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition">Maintenance</Link></li></ul></nav>
            <nav aria-label="Company links"><h3 className="font-semibold text-slate-900 dark:text-white">Company</h3><ul className="mt-4 space-y-3" role="list"><li><Link href="/about" className="text-sm text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition">About Us</Link></li><li><Link href="/careers" className="text-sm text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition">Careers</Link></li><li><Link href="/contact" className="text-sm text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition">Contact</Link></li></ul></nav>
            <nav aria-label="Resources links"><h3 className="font-semibold text-slate-900 dark:text-white">Resources</h3><ul className="mt-4 space-y-3" role="list"><li><Link href="/help" className="text-sm text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition">Help Center</Link></li><li><Link href="/docs" className="text-sm text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition">API Docs</Link></li><li><Link href="/status" className="text-sm text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition">Status</Link></li></ul></nav>
            <nav aria-label="Legal links"><h3 className="font-semibold text-slate-900 dark:text-white">Legal</h3><ul className="mt-4 space-y-3" role="list"><li><Link href="/privacy" className="text-sm text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition">Privacy Policy</Link></li><li><Link href="/terms" className="text-sm text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition">Terms of Service</Link></li><li><Link href="/security" className="text-sm text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition">Security</Link></li></ul></nav>
          </div>
          <div className="mt-10 flex flex-col justify-between gap-4 border-t border-slate-200 dark:border-slate-700 pt-6 sm:flex-row sm:items-center">
            <p className="text-sm text-slate-600 dark:text-slate-300">&copy; {new Date().getFullYear()} Propentra. All rights reserved.</p>
            <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-300"><span className="flex items-center gap-1"><span className="text-slate-400 dark:text-slate-500">🌍</span>Ethiopia</span><span className="flex items-center gap-1"><span className="text-slate-400 dark:text-slate-500">🔒</span>Secure</span><span className="flex items-center gap-1"><span className="text-slate-400 dark:text-slate-500">⏰</span>24/7 Uptime</span></div>
          </div>
        </div>
      </footer>
    </div>
  );
}
