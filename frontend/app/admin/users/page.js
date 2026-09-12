'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import AppShell from '@/components/AppShell';
import AuthGuard from '@/components/AuthGuard';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import FormField from '@/components/ui/FormField';
import { Shield, Plus, User, UserCheck, UserX, Loader2, Trash2 } from 'lucide-react';

const roleLabels = {
  administrator: 'Administrator',
  owner: 'Owner',
  manager: 'Manager',
  tenant: 'Tenant',
};

const roleColors = {
  administrator: 'badge-red',
  owner: 'badge-blue',
  manager: 'badge-teal',
  tenant: 'badge-emerald',
};

export default function AdminUsersPage() {
  const { user, isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'manager',
  });

  useEffect(() => {
    if (authLoading) return undefined;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }

    let active = true;
    const loadUsers = async () => {
      try {
        const response = await apiClient.getUsers();
        if (active && response.success) setUsers(response.data);
      } catch (loadError) {
        if (active) toast.error('We could not load the user list. Please try again.');
        console.error(loadError);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadUsers();

    return () => {
      active = false;
    };
  }, [authLoading, isAuthenticated, isAdmin, router, toast]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await apiClient.createUser(formData);
      if (!response.success) throw new Error('Unable to create user');
      setUsers((current) => [...current, response.data]);
      setFormData({ name: '', email: '', phone: '', password: '', role: 'manager' });
      setShowForm(false);
      toast.success(`${roleLabels[formData.role]} account created successfully.`);
    } catch (saveError) {
      toast.error(saveError.message || 'We could not create this account.');
    } finally {
      setSaving(false);
    }
  };

  const updateRole = async (account, role) => {
    try {
      const response = await apiClient.updateUserRole(account.id, role);
      if (!response.success) throw new Error('Unable to update role');
      setUsers((current) => current.map((item) => item.id === account.id ? { ...item, role } : item));
      toast.success(`${account.name} is now a ${roleLabels[role].toLowerCase()}.`);
    } catch (updateError) {
      toast.error(updateError.message || 'We could not update this role.');
    }
  };

  const handleDelete = async (account) => {
    setDeletingId(account.id);
    try {
      await apiClient.deleteUser(account.id);
      setUsers((current) => current.filter((item) => item.id !== account.id));
      toast.success('User deleted.');
    } catch (deleteError) {
      toast.error(deleteError.message || 'Unable to delete this user.');
    } finally {
      setDeletingId(null);
    }
  };

  const visibleUsers = filter === 'all' ? users : users.filter((account) => account.role === filter);
  const countFor = (role) => users.filter((account) => account.role === role).length;

  if (!user || !isAdmin) return null;

  return (
    <AuthGuard roles={['administrator']}>
      <AppShell>
        <main className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-10">
          <PageHeader
            eyebrow="Administration"
            title="User management"
            description="Create owners and managers, review tenant accounts, and keep platform access under administrator control."
            actions={
              <button
                type="button"
                onClick={() => setShowForm((visible) => !visible)}
                className="btn btn-primary"
              >
                <Plus size={16} />
                Add staff account
              </button>
            }
          />

          <div className="mt-8 grid gap-4 sm:grid-cols-4">
            <SummaryCard label="All accounts" value={users.length} />
            <SummaryCard label="Owners" value={countFor('owner')} />
            <SummaryCard label="Managers" value={countFor('manager')} />
            <SummaryCard label="Tenants" value={countFor('tenant')} />
          </div>

          <section className="card mt-8 overflow-hidden">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-semibold text-slate-950">Accounts and roles</h2>
                <p className="mt-1 text-sm text-slate-500">Change staff roles when responsibilities change.</p>
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {['all', 'administrator', 'owner', 'manager', 'tenant'].map((value) => (
                  <button
                    key={value}
                    onClick={() => setFilter(value)}
                    className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold capitalize ${
                      filter === value
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-12 text-center text-slate-500">Loading accounts...</div>
              ) : (
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead className="bg-slate-50/70">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">User</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 bg-white">
                    {visibleUsers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500">No users found.</td>
                      </tr>
                    ) : (
                      visibleUsers.map((account) => (
                        <tr key={account.id} className="premium-table-row">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-700">
                                {account.name?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">{account.name}</p>
                                <p className="text-xs text-slate-400">{account.phone || 'No phone'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-slate-500">{account.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={roleColors[account.role] || 'badge-slate'}>{roleLabels[account.role]}</Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {account.role === 'administrator' ? (
                              <span className="inline-flex items-center gap-1 text-slate-400">
                                <Shield size={12} />
                                Protected
                              </span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <select
                                  aria-label={`Change role for ${account.name}`}
                                  value={account.role}
                                  onChange={(event) => updateRole(account, event.target.value)}
                                  className="field-input text-sm py-1.5 px-2.5 w-auto"
                                >
                                  <option value="owner">Owner</option>
                                  <option value="manager">Manager</option>
                                  <option value="tenant">Tenant</option>
                                </select>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(account)}
                                  disabled={deletingId === account.id}
                                  className="inline-flex items-center justify-center rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                  aria-label={`Delete ${account.name}`}
                                >
                                  {deletingId === account.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* Create user modal */}
          <Modal
            open={showForm}
            onClose={() => setShowForm(false)}
            title="Add staff account"
            description="Only administrators can create owner and manager accounts."
            size="lg"
            footer={
              <>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" form="user-form" disabled={saving} className="btn btn-primary">
                  {saving ? 'Creating...' : 'Create account'}
                </button>
              </>
            }
          >
            <form id="user-form" onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField label="Full name" required>
                  <input
                    type="text"
                    required
                    className="field-input"
                    value={formData.name}
                    onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  />
                </FormField>
                <FormField label="Email" required>
                  <input
                    type="email"
                    required
                    className="field-input"
                    value={formData.email}
                    onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                  />
                </FormField>
                <FormField label="Phone">
                  <input
                    type="tel"
                    className="field-input"
                    value={formData.phone}
                    onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                  />
                </FormField>
                <FormField label="Temporary password" required hint="Minimum 8 characters">
                  <input
                    type="password"
                    required
                    minLength={8}
                    className="field-input"
                    value={formData.password}
                    onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                  />
                </FormField>
                <FormField label="Role" required>
                  <select
                    required
                    className="field-input"
                    value={formData.role}
                    onChange={(event) => setFormData({ ...formData, role: event.target.value })}
                  >
                    <option value="manager">Manager</option>
                    <option value="owner">Owner</option>
                  </select>
                </FormField>
              </div>
            </form>
          </Modal>
        </main>
      </AppShell>
    </AuthGuard>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}