'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import apiClient from '@/lib/api';

export default function PropertyDetailPage() {
  const { user, isAuthenticated, isOwner, isManager, isAdmin } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  const fetchProperty = useCallback(async () => {
    try {
      const response = await apiClient.getProperty(params.id);
      if (response.success) {
        setProperty(response.data);
        setEditFormData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch property:', error);
      router.push('/properties');
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    void Promise.resolve().then(fetchProperty);
  }, [fetchProperty, isAuthenticated, router]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.updateProperty(params.id, editFormData);
      if (response.success) {
        setShowEditModal(false);
        fetchProperty();
      }
    } catch (error) {
      console.error('Failed to update property:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this property?')) return;

    try {
      await apiClient.deleteProperty(params.id);
      router.push('/properties');
    } catch (error) {
      console.error('Failed to delete property:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Property not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{property.name}</h1>
              <p className="text-sm text-gray-600">Property Details</p>
            </div>
            <button
              onClick={() => router.push('/properties')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
            >
              Back to Properties
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Property Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Property Information</h2>
                {(isOwner || isAdmin) && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      className="px-3 py-1 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition text-sm"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Address</h3>
                  <p className="text-gray-900">{property.address}</p>
                  <p className="text-gray-900">{property.city}, {property.state} {property.postal_code}</p>
                </div>
                
                {property.description && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-600">Description</h3>
                    <p className="text-gray-900">{property.description}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  {property.total_area && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-600">Total Area</h3>
                      <p className="text-gray-900">{property.total_area} sq ft</p>
                    </div>
                  )}
                  {property.year_built && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-600">Year Built</h3>
                      <p className="text-gray-900">{property.year_built}</p>
                    </div>
                  )}
                  {property.property_type && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-600">Property Type</h3>
                      <p className="text-gray-900">{property.property_type}</p>
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-medium text-gray-600">Status</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      property.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {property.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Units */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Units</h2>
                <button
                  onClick={() => router.push(`/properties/${property.id}/units`)}
                  className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition text-sm"
                >
                  Manage Units
                </button>
              </div>
              
              {property.units && property.units.length > 0 ? (
                <div className="space-y-3">
                  {property.units.map((unit) => (
                    <div key={unit.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{unit.unit_number}</p>
                        <p className="text-sm text-gray-600">{unit.type} - {unit.bedrooms} bed, {unit.bathrooms} bath</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        unit.status === 'available' ? 'bg-green-100 text-green-800' :
                        unit.status === 'occupied' ? 'bg-blue-100 text-blue-800' :
                        unit.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {unit.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No units added yet</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Units</span>
                  <span className="font-medium">{property.units?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Occupied</span>
                  <span className="font-medium text-green-600">
                    {property.units?.filter(u => u.status === 'occupied').length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Available</span>
                  <span className="font-medium text-blue-600">
                    {property.units?.filter(u => u.status === 'available').length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Maintenance</span>
                  <span className="font-medium text-yellow-600">
                    {property.units?.filter(u => u.status === 'maintenance').length || 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Owner</h2>
              {property.owner && (
                <div>
                  <p className="font-medium">{property.owner.name}</p>
                  <p className="text-sm text-gray-600">{property.owner.email}</p>
                </div>
              )}
            </div>

            {property.managers && property.managers.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Assigned Managers</h2>
                <div className="space-y-2">
                  {property.managers.map((manager) => (
                    <div key={manager.id}>
                      <p className="font-medium">{manager.name}</p>
                      <p className="text-sm text-gray-600">{manager.email}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Property</h3>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.address || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={editFormData.city || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      value={editFormData.state || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.postal_code || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, postal_code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editFormData.description || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={editFormData.status || 'active'}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                  >
                    Save Changes
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
