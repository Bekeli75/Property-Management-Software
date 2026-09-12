import Link from 'next/link';
import Logo from '@/components/Logo';
import AppShell from '@/components/AppShell';
import PageHeader from '@/components/ui/PageHeader';
import { Shield, FileText, Lock, Mail, Truck, Database, Globe, Clock, AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | Propentra',
  description: 'Learn how Propentra collects, uses, and protects your personal information.',
};

const sections = [
  {
    icon: Shield,
    title: 'Data We Collect',
    content: 'We collect information you provide directly to us, such as when you create an account, manage properties, communicate with tenants, or contact us for support. This includes your name, email address, phone number, payment information, property details, and any content you upload or share through our platform.',
  },
  {
    icon: FileText,
    title: 'How We Use Your Data',
    content: 'Your information is used to provide, maintain, and improve our services; process transactions and send related communications; respond to your requests and provide customer support; send technical notices and security alerts; and comply with legal obligations. We do not sell your personal data to third parties.',
  },
  {
    icon: Lock,
    title: 'Data Security',
    content: 'We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes encryption in transit (TLS 1.2+), encryption at rest for sensitive data, regular security assessments, and access controls based on the principle of least privilege.',
  },
  {
    icon: Database,
    title: 'Data Retention',
    content: 'We retain your personal data for as long as your account is active or as needed to provide you services, comply with legal obligations, resolve disputes, and enforce our agreements. When you request account deletion, we will delete or anonymize your data within 30 days, except where retention is required by law.',
  },
  {
    icon: Globe,
    title: 'Third-Party Services',
    content: 'We may share data with trusted service providers who perform services on our behalf, such as payment processing (Chapa), cloud hosting, analytics, and email delivery. These providers are contractually bound to protect your data and use it only for the specified purposes. We do not authorize them to use your data for their own marketing.',
  },
  {
    icon: Truck,
    title: 'International Transfers',
    content: 'Your data may be transferred to and processed in countries other than your own. Where we transfer data internationally, we ensure appropriate safeguards are in place, such as Standard Contractual Clauses or adequacy decisions, to maintain a level of protection equivalent to your local data protection laws.',
  },
  {
    icon: Mail,
    title: 'Your Rights',
    content: 'Depending on your jurisdiction, you may have rights to access, rectify, erase, restrict, or object to processing of your personal data, as well as the right to data portability. You can exercise these rights by contacting us at privacy@propentra.com. We will respond within the legally required timeframe.',
  },
  {
    icon: Clock,
    title: 'Cookies & Tracking',
    content: 'We use essential cookies for authentication, security, and session management. We may also use analytics cookies (with your consent) to understand how you use our platform and improve your experience. You can manage cookie preferences in your browser settings, though disabling essential cookies may affect functionality.',
  },
  {
    icon: AlertCircle,
    title: 'Changes to This Policy',
    content: 'We may update this Privacy Policy from time to time. We will notify you of material changes by posting the new policy on this page and updating the effective date. For significant changes, we may also send an email notification. Your continued use of the service after changes constitutes acceptance.',
  },
];

export default function PrivacyPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-10">
        <PageHeader
          eyebrow="Legal"
          title="Privacy Policy"
          description="Last updated: September 2026. This policy explains how Propentra collects, uses, and protects your personal information."
        />

        <div className="mt-8 space-y-8">
          {sections.map((section, index) => (
            <article key={index} className="card-premium p-6 sm:p-8">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300">
                  <section.icon size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-950 dark:text-white">{section.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{section.content}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-6">
          <h3 className="font-semibold text-slate-950 dark:text-white">Contact Us</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            If you have questions about this Privacy Policy or our data practices, please contact us:
          </p>
          <div className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-300">
            <p>Email: <a href="mailto:privacy@propentra.com" className="text-teal-700 hover:underline dark:text-teal-300">privacy@propentra.com</a></p>
            <p>Address: Propentra, Bole Road, Addis Ababa, Ethiopia</p>
          </div>
        </div>
      </main>
    </AppShell>
  );
}