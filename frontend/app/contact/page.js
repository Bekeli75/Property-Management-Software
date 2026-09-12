import Link from 'next/link';
import Logo from '@/components/Logo';
import AppShell from '@/components/AppShell';
import PageHeader from '@/components/ui/PageHeader';
import ContactForm from './ContactForm';
import { Mail, MapPin, Phone, Building2, Shield, Clock } from 'lucide-react';

export const metadata = {
  title: 'Contact Us | Propentra',
  description: 'Get in touch with the Propentra team for support, sales, or general inquiries.',
};

const contactInfo = [
  {
    icon: Mail,
    title: 'General Support',
    value: 'support@propentra.com',
    description: 'Technical issues, account help, bug reports',
    href: 'mailto:support@propentra.com',
  },
  {
    icon: Building2,
    title: 'Sales & Partnerships',
    value: 'sales@propentra.com',
    description: 'Enterprise plans, API access, partnerships',
    href: 'mailto:sales@propentra.com',
  },
  {
    icon: Shield,
    title: 'Legal & Compliance',
    value: 'legal@propentra.com',
    description: 'Privacy, terms, data protection requests',
    href: 'mailto:legal@propentra.com',
  },
  {
    icon: MapPin,
    title: 'Office Address',
    value: 'Bole Road, Addis Ababa, Ethiopia',
    description: 'Monday–Friday, 9:00 AM – 6:00 PM EAT',
  },
  {
    icon: Phone,
    title: 'Phone Support',
    value: '+251 911 000 123',
    description: 'Available during business hours',
    href: 'tel:+251911000123',
  },
];

export default function ContactPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-10">
        <PageHeader
          eyebrow="Get in touch"
          title="Contact Us"
          description="Have questions? We'd love to hear from you. Choose the best way to reach us below."
        />

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Contact Info Cards */}
          <div className="lg:col-span-1 space-y-4">
            {contactInfo.map((item, index) => (
              <article key={index} className="card-premium p-5">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300">
                    <item.icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-950 dark:text-white">{item.title}</h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{item.description}</p>
                    {item.href ? (
                      <a href={item.href} className="mt-1 block truncate text-sm font-medium text-teal-700 hover:underline dark:text-teal-300">{item.value}</a>
                    ) : (
                      <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">{item.value}</p>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <ContactForm />
          </div>
        </div>

        {/* FAQ Quick Links */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Quick links</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/privacy" className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
              Privacy Policy
            </Link>
            <Link href="/terms" className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
              Terms of Service
            </Link>
            <Link href="/login" className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
              Sign In
            </Link>
            <Link href="/register" className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">
              Create Account
            </Link>
          </div>
        </section>
      </main>
    </AppShell>
  );
}