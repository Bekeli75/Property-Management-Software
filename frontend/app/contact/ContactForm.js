'use client';

import { useState } from 'react';
import { useToast } from '@/contexts/ToastContext';
import FormField from '@/components/ui/FormField';
import { Send, Loader2 } from 'lucide-react';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast.success('Message sent! We\'ll get back to you within 24 hours.');
    setFormData({ name: '', email: '', subject: '', message: '' });
    setLoading(false);
  };

  return (
    <section className="card-premium p-6 sm:p-8">
      <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Send us a message</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">We typically respond within 24 hours during business days.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Full name" required>
            <input
              type="text"
              name="name"
              required
              className="field-input"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your name"
            />
          </FormField>
          <FormField label="Email address" required>
            <input
              type="email"
              name="email"
              required
              className="field-input"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
            />
          </FormField>
        </div>

        <FormField label="Subject" required>
          <select
            name="subject"
            required
            className="field-input"
            value={formData.subject}
            onChange={handleChange}
          >
            <option value="">Select a topic</option>
            <option value="general">General inquiry</option>
            <option value="technical">Technical support</option>
            <option value="billing">Billing & payments</option>
            <option value="feature">Feature request</option>
            <option value="partnership">Partnership inquiry</option>
            <option value="legal">Legal / Privacy</option>
            <option value="other">Other</option>
          </select>
        </FormField>

        <FormField label="Message" required hint="Please provide as much detail as possible.">
          <textarea
            name="message"
            required
            rows={6}
            className="field-input resize-none"
            value={formData.message}
            onChange={handleChange}
            placeholder="Describe your question or issue..."
          />
        </FormField>

        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send size={16} />
              Send Message
            </>
          )}
        </button>
      </form>
    </section>
  );
}

function handleChange(event) {
  // This will be replaced by the actual handler in the parent
  // The form uses the parent's handler via closure
}