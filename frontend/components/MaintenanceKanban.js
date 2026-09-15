'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import apiClient from '@/lib/api';
import Badge from '@/components/ui/Badge';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Clock, XCircle, UserPlus, CheckCheck } from 'lucide-react';

const statusOrder = ['pending', 'in_progress', 'completed', 'cancelled'];
const statusLabels = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};
const statusColors = {
  pending: 'amber',
  in_progress: 'blue',
  completed: 'emerald',
  cancelled: 'slate',
};
const priorityColors = {
  low: 'slate',
  medium: 'amber',
  high: 'red',
  urgent: 'red',
};
const priorityLabels = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

const formatDate = (value) => {
  if (!value) return '\u2014';
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function MaintenanceKanban({ initialRequests = [], onAssign = null, onComplete = null }) {
  const router = useRouter();
  const { isTenant, isOwner, isAdmin } = useAuth();
  const toast = useToast();
  const [updating, setUpdating] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [columns, setColumns] = useState(() =>
    statusOrder.map((status) => ({
      status,
      label: statusLabels[status],
      color: statusColors[status],
      requests: initialRequests.filter((r) => r.status === status),
    }))
  );

  const canManage = !isTenant;
  const canDelete = isAdmin || isOwner;

  const handleStatusChange = async (requestId, newStatus) => {
    if (!canManage) {
      toast.error('Tenants cannot change request status.');
      return;
    }
    setUpdating(requestId);
    try {
      const response = await apiClient.updateMaintenanceRequest(requestId, { status: newStatus });
      if (response.success) {
        setColumns((prev) =>
          prev.map((col) => {
            if (col.status === newStatus) {
              return { ...col, requests: [...col.requests.filter((r) => r.id !== requestId), response.data] };
            }
            return { ...col, requests: col.requests.filter((r) => r.id !== requestId) };
          })
        );
        toast.success(`Moved to ${statusLabels[newStatus] || newStatus}.`);
      } else {
        toast.error(response.message || 'Unable to update the request.');
      }
    } catch (error) {
      console.error('Failed to update maintenance request:', error);
      toast.error('Unable to update the request.');
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const response = await apiClient.deleteMaintenanceRequest(deleteTarget.id);
      if (response.success === false) {
        toast.error(response.message || 'Unable to delete the request.');
      } else {
        setColumns((prev) =>
          prev.map((col) => ({ ...col, requests: col.requests.filter((r) => r.id !== deleteTarget.id) }))
        );
        setDeleteTarget(null);
        toast.success('Request deleted.');
      }
    } catch (error) {
      console.error('Failed to delete maintenance request:', error);
      toast.error('Unable to delete the request.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mt-6 overflow-x-auto pb-4">
      <div className="flex gap-4" style={{ minWidth: '1100px' }}>
        {columns.map((column) => (
          <div key={column.status} className="flex w-[300px] flex-shrink-0 flex-col">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge status={column.color}>{column.label}</Badge>
                <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                  {column.requests.length}
                </span>
              </div>
            </div>
            <div
              className="min-h-[320px] flex-1 space-y-3 rounded-xl bg-slate-100/70 p-3 dark:bg-slate-800/50"
              onDragOver={canManage ? (e) => e.preventDefault() : undefined}
              onDrop={canManage ? (e) => {
                e.preventDefault();
                const requestId = e.dataTransfer.getData('text/plain');
                if (requestId) handleStatusChange(requestId, column.status);
              } : undefined}
            >
              {column.requests.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center text-xs text-slate-400 dark:text-slate-500">
                  <p>No requests</p>
                  <p className="mt-1">Drop cards here</p>
                </div>
              ) : (
                column.requests.map((request) => (
                  <div
                    key={request.id}
                    draggable={canManage}
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', String(request.id))}
                    className="card cursor-pointer p-4 transition hover:shadow-md"
                    onClick={() => router.push(`/maintenance/${request.id}`)}
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {request.title}
                        </h4>
                        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                          {request.property && request.property.name}
                          {request.unit && request.unit.unit_number ? ` \u00B7 ${request.unit.unit_number}` : ''}
                        </p>
                      </div>
                      <Badge status={priorityColors[request.priority] || 'slate'}>
                        {priorityLabels[request.priority] || request.priority}
                      </Badge>
                    </div>

                    <p className="mb-3 line-clamp-2 text-xs leading-4 text-slate-500 dark:text-slate-400">
                      {request.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {formatDate(request.requested_date)}
                        </span>
                        {request.assigned_to && (
                          <span className="truncate">Assigned: {request.assigned_to}</span>
                        )}
                      </div>
                      {canManage && (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {request.status === 'completed' || request.status === 'cancelled' ? null : (
                            <button
                              type="button"
                              onClick={() => onAssign && onAssign(request)}
                              className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-xs font-medium text-blue-600 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
                              title="Assign staff"
                              aria-label={`Assign ${request.title}`}
                            >
                              <UserPlus size={13} />
                              Assign
                            </button>
                          )}
                          {request.status === 'in_progress' && (
                            <button
                              type="button"
                              onClick={() => onComplete && onComplete(request)}
                              className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-xs font-medium text-emerald-600 transition hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950"
                              title="Complete request"
                              aria-label={`Complete ${request.title}`}
                            >
                              <CheckCheck size={13} />
                              Complete
                            </button>
                          )}
                          <select
                            value={request.status}
                            onChange={(e) => handleStatusChange(request.id, e.target.value)}
                            disabled={updating === request.id}
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                          >
                            {statusOrder.map((s) => (
                              <option key={s} value={s}>
                                {statusLabels[s]}
                              </option>
                            ))}
                          </select>
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(request)}
                              className="p-1 text-slate-400 transition hover:text-red-600 dark:hover:text-red-400"
                              aria-label={`Delete ${request.title}`}
                              disabled={updating === request.id}
                            >
                              <XCircle size={14} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete maintenance request?"
        message="This permanently removes the request and its photo attachments. This action cannot be undone."
        confirmLabel="Delete request"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => !deleting && setDeleteTarget(null)}
      />
    </div>
  );
}