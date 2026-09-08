'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import Logo from '@/components/Logo';

export default function MaintenancePage() {
  const { user, isAuthenticated, isOwner, isManager, isAdmin, isTenant } = useAuth();
  const router = useRouter();
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [formData, setFormData] = useState({
    property_id: '',
    unit_id: '',
    tenant_id: '',
    title: '',
    description: '',
    priority: 'medium',
    category: 'other',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchMaintenanceRequests();
    fetchProperties();
    fetchTenants();
  }, [isAuthenticated, router]);

  const fetchMaintenanceRequests = async () => {
    try {
      const response = await apiClient.getMaintenanceRequests();
      if (response.success) {
        setMaintenanceRequests(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch maintenance requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await apiClient.getProperties();
      if (response.success) {
        setProperties(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch properties:', error);
    }
  };

  const fetchTenants = async () => {
    try {
      const response = await apiClient.getTenants();
      if (response.success) {
        setTenants(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
    }
  };

  const fetchUnits = async (propertyId) => {
    try {
      const response = await apiClient.getUnitsByProperty(propertyId);
      if (response.success) {
        setUnits(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch units:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.createMaintenanceRequest(formData);
      if (response.success) {
        setShowModal(false);
        setFormData({
          property_id: '',
          unit_id: '',
          tenant_id: '',
          title: '',
          description: '',
          priority: 'medium',
          category: 'other',
        });
        fetchMaintenanceRequests();
      }
    } catch (error) {
      console.error('Failed to create maintenance request:', error);
    }
  };

  const handleAssign = async (id) => {
    const assignedTo = prompt('Enter assigned person:');
    if (!assignedTo) return;

    const scheduledDate = prompt('Scheduled date (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
    if (!scheduledDate) return;

    try {
      await apiClient.assignMaintenanceRequest(id, {
        assigned_to: assignedTo,
        scheduled_date: scheduledDate,
      });
      fetchMaintenanceRequests();
    } catch (error) {
      console.error('Failed to assign maintenance request:', error);
    }
  };

  const handleComplete = async (id) => {
    const actualCost = prompt('Enter actual cost (ETB):');
    if (actualCost === null) return;

    const notes = prompt('Enter completion notes:');
    if (notes === null) return;

    try {
      await apiClient.completeMaintenanceRequest(id, {
        actual_cost: parseFloat(actualCost) || null,
        notes: notes || '',
      });
      fetchMaintenanceRequests();
    } catch (error) {
      console.error('Failed to complete maintenance request:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this maintenance request?')) return;

    try {
      await apiClient.deleteMaintenanceRequest(id);
      fetchMaintenanceRequests();
    } catch (error) {
      console.error('Failed to delete maintenance request:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Logo size="sm" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Maintenance</h1>
                <p className="text-sm text-gray-600">Manage maintenance requests</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Maintenance Requests ({maintenanceRequests.length})
          </h2>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Create Request
          </button>
        </div>

        {maintenanceRequests.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">No maintenance requests found</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Create Your First Request
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {maintenanceRequests.map((request) => (
              <div key={request.id} className="bg-white rounded-lg shadow hover:shadow-lg transition">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{request.title}</h3>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        request.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        request.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        request.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {request.priority}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        request.status === 'completed' ? 'bg-green-100 text-green-800' :
                        request.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {request.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{request.description}</p>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600">
                      <span className="font-medium">Property:</span> {request.property?.name}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Unit:</span> {request.unit?.unit_number}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Category:</span> {request.category}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Requested:</span> {new Date(request.requested_date).toLocaleDateString()}
                    </p>
                    {request.assigned_to && (
                      <p className="text-gray-600">
                        <span className="font-medium">Assigned to:</span> {request.assigned_to}
                      </p>
                    )}
                    {request.estimated_cost && (
                      <p className="text-gray-600">
                        <span className="font-medium">Est. Cost:</span> ETB {request.estimated_cost?.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => router.push(`/maintenance/${request.id}`)}
                      className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition text-sm"
                    >
                      View Details
                    </button>
                    {request.status === 'pending' && (isOwner || isManager || isAdmin) && (
                      <button
                        onClick={() => handleAssign(request.id)}
                        className="px-3 py-2 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition text-sm"
                      >
                        Assign
                      </button>
                    )}
                    {request.status === 'in_progress' && (isOwner || isManager || isAdmin) && (
                      <button
                        onClick={() => handleComplete(request.id)}
                        className="px-3 py-2 bg-teal-50 text-teal-600 rounded-md hover:bg-teal-100 transition text-sm"
                      >
                        Complete
                      </button>
                    )}
                    {(isOwner || isAdmin) && (
                      <button
                        onClick={() => handleDelete(request.id)}
                        className="px-3 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition text-sm"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Maintenance Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Maintenance Request</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property *
                  </label>
                  <select
                    required
                    value={formData.property_id}
                    onChange={(e) => {
                      setFormData({ ...formData, property_id: e.target.value, unit_id: '' });
                      fetchUnits(e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a property</option>
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit *
                  </label>
                  <select
                    required
                    value={formData.unit_id}
                    onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                    disabled={!formData.property_id}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">Select a unit</option>
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.unit_number} - {unit.type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tenant
                  </label>
                  <select
                    value={formData.tenant_id}
                    onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a tenant (optional)</option>
                    {tenants.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.user?.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority *
                    </label>
                    <select
                      required
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="plumbing">Plumbing</option>
                      <option value="electrical">Electrical</option>
                      <option value="structural">Structural</option>
                      <option value="hvac">HVAC</option>
                      <option value="appliances">Appliances</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                  >
                    Create Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
