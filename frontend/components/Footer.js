'use client';

import Link from 'next/link';
import { Mail, Shield, Building2, Users, FileText, CreditCard, Wrench, MessageSquare, BarChart3, Settings, HelpCircle, Scale, Globe, ArrowRight, Moon, Sun, Clock, Share2, Code, Heart, Globe as GlobeIcon, MessageSquare as MessageSquareIcon, Mail as MailIcon, MapPin, Phone, Twitter as TwitterIcon, Linkedin as LinkedinIcon, Github as GithubIcon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import Logo from '@/components/Logo';

const footerLinks = {
  Product: [
    { label: 'Properties', href: '/properties' },
    { label: 'Tenants', href: '/tenants' },
    { label: 'Leases', href: '/leases' },
    { label: 'Payments', href: '/payments' },
    { label: 'Maintenance', href: '/maintenance' },
    { label: 'Reports', href: '/reports' },
  ],
  Company: [
    { label: 'About Us', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Press', href: '/press' },
    { label: 'Blog', href: '/blog' },
    { label: 'Partners', href: '/partners' },
  ],
  Resources: [
    { label: 'Help Center', href: '/help' },
    { label: 'API Docs', href: '/docs' },
    { label: 'Community', href: '/community' },
    { label: 'Status', href: '/status' },
    { label: 'Changelog', href: '/changelog' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'Security', href: '/security' },
    { label: 'GDPR', href: '/gdpr' },
  ],
};

const socialLinks = [
  { icon: MessageSquareIcon, href: 'https://twitter.com/propentra', label: 'Twitter' },
  { icon: Code, href: 'https://github.com/propentra', label: 'GitHub' },
  { icon: Heart, href: 'https://linkedin.com/company/propentra', label: 'LinkedIn' },
  { icon: GlobeIcon, href: 'https://facebook.com/propentra', label: 'Facebook' },
];

const features = [
  { icon: Building2, label: 'Properties' },
  { icon: Users, label: 'Tenants' },
  { icon: FileText, label: 'Leases' },
  { icon: CreditCard, label: 'Payments' },
  { icon: Wrench, label: 'Maintenance' },
  { icon: MessageSquare, label: 'Discussion' },
  { icon: BarChart3, label: 'Reports' },
  { icon: Settings, label: 'Settings' },
];

export default function Footer() {
  const { theme, toggleTheme } = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
      <div className="mx-auto max-w-[1500px] px-5 py-10 sm:px-8 sm:py-14">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-6">
          {/* Brand */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/dashboard" className="flex items-center gap-2" aria-label="Propentra Home">
              <Logo size="lg" />
              <span className="text-xl font-semibold text-slate-950 dark:text-white">Propentra</span>
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
              Professional property management platform for owners, managers, and tenants. Streamline operations, automate rent collection, and delight your tenants.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 transition"
                >
                  <item.icon size={18} />
                </a>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                className="btn btn-ghost p-2"
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>
              <span className="text-xs text-slate-500 dark:text-slate-400">Theme</span>
            </div>
          </div>

          {/* Product */}
          <nav aria-label="Product links">
            <h3 className="font-semibold text-slate-950 dark:text-white">Product</h3>
            <ul className="mt-4 space-y-3" role="list">
              {footerLinks.Product.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Company */}
          <nav aria-label="Company links">
            <h3 className="font-semibold text-slate-950 dark:text-white">Company</h3>
            <ul className="mt-4 space-y-3" role="list">
              {footerLinks.Company.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Resources */}
          <nav aria-label="Resources links">
            <h3 className="font-semibold text-slate-950 dark:text-white">Resources</h3>
            <ul className="mt-4 space-y-3" role="list">
              {footerLinks.Resources.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Legal */}
          <nav aria-label="Legal links">
            <h3 className="font-semibold text-slate-950 dark:text-white">Legal</h3>
            <ul className="mt-4 space-y-3" role="list">
              {footerLinks.Legal.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Features bar */}
        <div className="mt-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Everything you need to manage properties efficiently</p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            {features.map((item) => (
              <Link
                key={item.label}
                href={`/${item.label.toLowerCase()}`}
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-teal-600 dark:hover:text-teal-400 transition"
              >
                <item.icon size={13} />
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col justify-between gap-4 border-t border-slate-200 dark:border-slate-700 pt-6 sm:flex-row sm:items-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            &copy; {currentYear} Propentra. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <GlobeIcon size={13} />
              Ethiopia
            </span>
            <span className="flex items-center gap-1">
              <Shield size={13} />
              Secure
            </span>
            <span className="flex items-center gap-1">
              <Clock size={13} />
              24/7 Uptime
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}