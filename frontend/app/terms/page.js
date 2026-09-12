import Link from 'next/link';
import Logo from '@/components/Logo';
import AppShell from '@/components/AppShell';
import PageHeader from '@/components/ui/PageHeader';
import { FileText, Shield, CreditCard, Key, Scale, Gavel, AlertTriangle, MessageSquare, Building2, UserCheck, Clock, Globe, Wrench } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service | Propentra',
  description: 'Read the terms and conditions governing your use of Propentra property management platform.',
};

const sections = [
  {
    icon: FileText,
    title: 'Acceptance of Terms',
    content: 'By accessing or using Propentra ("the Platform"), you agree to be bound by these Terms of Service ("Terms") and our Privacy Policy. If you do not agree, you may not use the Platform. We reserve the right to modify these Terms at any time. Continued use after changes constitutes acceptance.',
  },
  {
    icon: UserCheck,
    title: 'Eligibility & Accounts',
    content: 'You must be at least 18 years old and have the legal capacity to enter into contracts. You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. You must provide accurate, current, and complete information during registration and keep it updated.',
  },
  {
    icon: Shield,
    title: 'User Roles & Responsibilities',
    content: 'The Platform supports Administrators, Owners, Managers, and Tenants. Each role has specific permissions and responsibilities. You must not attempt to access features or data beyond your assigned role. Administrators are responsible for managing user access within their organization.',
  },
  {
    icon: Building2,
    title: 'Property & Lease Management',
    content: 'Owners and Managers may create and manage properties, units, and leases. All information must be accurate and compliant with applicable laws. You are responsible for ensuring lease terms comply with local tenancy regulations. The Platform does not provide legal advice.',
  },
  {
    icon: CreditCard,
    title: 'Payments & Fees',
    content: 'Tenants may pay rent through integrated payment providers (e.g., Chapa). Transaction fees may apply and are disclosed at checkout. The Platform facilitates payments but is not a financial institution. Late payments, failed transactions, and disputes are governed by the lease agreement and payment provider terms.',
  },
  {
    icon: Wrench,
    title: 'Maintenance Requests',
    content: 'Tenants may submit maintenance requests through the Platform. Owners and Managers are responsible for timely response and resolution. The Platform is a communication tool and does not guarantee service quality or timelines.',
  },
  {
    icon: MessageSquare,
    title: 'Communications & Notifications',
    content: 'By using the Platform, you consent to receiving electronic communications, including system notifications, payment reminders, maintenance updates, and administrative messages. You may adjust notification preferences in settings, but critical system notices cannot be opted out.',
  },
  {
    icon: Scale,
    title: 'Intellectual Property',
    content: 'The Platform, including its design, code, content, and trademarks, is owned by Propentra and protected by intellectual property laws. You are granted a limited, non-exclusive, non-transferable license to use the Platform for its intended purpose. You may not copy, modify, distribute, or reverse-engineer any part of the Platform.',
  },
  {
    icon: AlertTriangle,
    title: 'Disclaimers & Limitation of Liability',
    content: 'THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT WARRANT UNINTERRUPTED OR ERROR-FREE OPERATION. TO THE MAXIMUM EXTENT PERMITTED BY LAW, PROPENTRA SHALL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR BUSINESS OPPORTUNITIES.',
  },
  {
    icon: Gavel,
    title: 'Indemnification',
    content: 'You agree to indemnify and hold harmless Propentra, its officers, directors, employees, and agents from any claims, damages, losses, or expenses (including reasonable attorney fees) arising from your use of the Platform, violation of these Terms, or infringement of any third-party rights.',
  },
  {
    icon: Clock,
    title: 'Termination',
    content: 'We may suspend or terminate your access to the Platform for breach of these Terms, illegal activity, or extended inactivity (12+ months). Upon termination, your right to use the Platform ceases immediately. Provisions that should survive termination (e.g., intellectual property, disclaimers, indemnification) will remain in effect.',
  },
  {
    icon: Globe,
    title: 'Governing Law & Disputes',
    content: 'These Terms are governed by the laws of the Federal Democratic Republic of Ethiopia. Any disputes arising from these Terms or your use of the Platform shall be resolved through good-faith negotiation. If unresolved, disputes shall be submitted to the competent courts of Addis Ababa, Ethiopia.',
  },
];

export default function TermsPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-10">
        <PageHeader
          eyebrow="Legal"
          title="Terms of Service"
          description="Last updated: September 2026. Please read these terms carefully before using Propentra."
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
          <h3 className="font-semibold text-slate-950 dark:text-white">Questions?</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Contact us at <a href="mailto:legal@propentra.com" className="text-teal-700 hover:underline dark:text-teal-300">legal@propentra.com</a>
          </p>
        </div>
      </main>
    </AppShell>
  );
}