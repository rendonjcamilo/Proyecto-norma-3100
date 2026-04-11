/**
 * Action Store (Zustand)
 * Manages state for corrective actions and tracking
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface Action {
  id: string;
  finding_id: string;
  action_number: string;
  title: string;
  description: string;
  responsible_user_id?: string;
  assigned_to?: string;
  due_date: string;
  deadline: string;
  priority: 'crítica' | 'alta' | 'media' | 'baja';
  status: 'abierta' | 'en_progreso' | 'cerrada';
  completion_percentage: number;
  created_date: string;
  created_by?: string;
}

export interface ActionFollowup {
  id: string;
  action_id: string;
  step_number: number;
  step_name: string;
  description?: string;
  status: 'pendiente' | 'en_progreso' | 'completado';
  due_date?: string;
  completion_percentage: number;
  evidence_attachment?: string;
  completed_date?: string;
  completed_by?: string;
  comments?: string;
  created_at: string;
  updated_at: string;
}

export interface ActionStats {
  total_actions: number;
  open_actions: number;
  in_progress: number;
  closed_actions: number;
  overdue_actions: number;
  avg_completion: number;
  latest_deadline?: string;
}

export interface ActionFilters {
  status?: 'abierta' | 'en_progreso' | 'cerrada';
  priority?: 'crítica' | 'alta' | 'media' | 'baja';
  dateRange?: { from: string; to: string };
  providerId?: string;
  serviceId?: string;
  sortBy?: 'deadline' | 'priority' | 'progress' | 'created';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

interface ActionStore {
  // State
  actions: Action[];
  selectedAction: Action | null;
  actionDetail: Action & { followups: ActionFollowup[] } | null;
  filters: ActionFilters;
  stats: ActionStats | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchActions: (filters?: ActionFilters) => Promise<void>;
  fetchActionDetail: (actionId: string) => Promise<void>;
  setSelectedAction: (action: Action | null) => void;
  setFilters: (filters: ActionFilters) => void;
  updateAction: (actionId: string, data: Partial<Action>) => Promise<void>;
  updateActionProgress: (
    actionId: string,
    followupId: string,
    data: Partial<ActionFollowup>
  ) => Promise<void>;
  updateFollowup: (
    actionId: string,
    followupId: string,
    data: Partial<ActionFollowup>
  ) => Promise<void>;
  fetchStats: () => Promise<void>;
  clearError: () => void;
}

const API_BASE_URL = '/api';

export const useActionStore = create<ActionStore>()(
  devtools(
    (set, get) => ({
      actions: [],
      selectedAction: null,
      actionDetail: null,
      filters: {},
      stats: null,
      loading: false,
      error: null,

      fetchActions: async (filters?: ActionFilters) => {
        set({ loading: true, error: null });
        try {
          const params = new URLSearchParams();

          if (filters?.status) params.append('status', filters.status);
          if (filters?.priority) params.append('priority', filters.priority);
          if (filters?.dateRange?.from) params.append('from_date', filters.dateRange.from);
          if (filters?.dateRange?.to) params.append('to_date', filters.dateRange.to);
          if (filters?.providerId) params.append('provider_id', filters.providerId);
          if (filters?.serviceId) params.append('service_id', filters.serviceId);
          if (filters?.sortBy) params.append('sort_by', filters.sortBy);
          if (filters?.sortOrder) params.append('sort_order', filters.sortOrder);
          if (filters?.limit) params.append('limit', String(filters.limit));
          if (filters?.offset) params.append('offset', String(filters.offset));

          const response = await fetch(`${API_BASE_URL}/actions?${params}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const result = await response.json();
          set({ actions: result.data || [], filters: filters || {} });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Error fetching actions';
          set({ error: message });
          console.error('fetchActions error:', err);
        } finally {
          set({ loading: false });
        }
      },

      fetchActionDetail: async (actionId: string) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`${API_BASE_URL}/actions/${actionId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const result = await response.json();
          set({ actionDetail: result.data });
          set({ selectedAction: result.data });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Error fetching action detail';
          set({ error: message });
          console.error('fetchActionDetail error:', err);
        } finally {
          set({ loading: false });
        }
      },

      setSelectedAction: (action: Action | null) => {
        set({ selectedAction: action });
      },

      setFilters: (filters: ActionFilters) => {
        set({ filters });
      },

      updateAction: async (actionId: string, data: Partial<Action>) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`${API_BASE_URL}/actions/${actionId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const result = await response.json();

          // Update actions list
          set((state) => ({
            actions: state.actions.map((a) => (a.id === actionId ? result.data : a)),
          }));

          // Update detail if it's the selected action
          const currentDetail = get().actionDetail;
          if (currentDetail?.id === actionId) {
            set({ actionDetail: { ...currentDetail, ...result.data } });
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Error updating action';
          set({ error: message });
          console.error('updateAction error:', err);
          throw err;
        } finally {
          set({ loading: false });
        }
      },

      updateActionProgress: async (
        actionId: string,
        followupId: string,
        data: Partial<ActionFollowup>
      ) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(
            `${API_BASE_URL}/actions/${actionId}/followups/${followupId}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
              },
              body: JSON.stringify(data),
            }
          );

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const result = await response.json();

          // Update detail view
          const currentDetail = get().actionDetail;
          if (currentDetail?.id === actionId) {
            const updatedFollowups = currentDetail.followups.map((f) =>
              f.id === followupId ? result.data : f
            );
            set({
              actionDetail: {
                ...currentDetail,
                followups: updatedFollowups,
                completion_percentage: Math.round(
                  updatedFollowups.reduce((sum, f) => sum + f.completion_percentage, 0) /
                    updatedFollowups.length
                ),
              },
            });
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Error updating progress';
          set({ error: message });
          console.error('updateActionProgress error:', err);
          throw err;
        } finally {
          set({ loading: false });
        }
      },

      updateFollowup: async (
        actionId: string,
        followupId: string,
        data: Partial<ActionFollowup>
      ) => {
        return get().updateActionProgress(actionId, followupId, data);
      },

      fetchStats: async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/actions/stats`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const result = await response.json();
          set({ stats: result.data });
        } catch (err) {
          console.error('fetchStats error:', err);
          // Don't set error as this is optional
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'actionStore',
    }
  )
);
