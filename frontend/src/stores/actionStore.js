/**
 * Action Store (Zustand)
 * Manages state for corrective actions and tracking
 */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
const API_BASE_URL = '/api';
export const useActionStore = create()(devtools((set, get) => ({
    actions: [],
    selectedAction: null,
    actionDetail: null,
    filters: {},
    stats: null,
    loading: false,
    error: null,
    fetchActions: async (filters) => {
        set({ loading: true, error: null });
        try {
            const params = new URLSearchParams();
            if (filters?.status)
                params.append('status', filters.status);
            if (filters?.priority)
                params.append('priority', filters.priority);
            if (filters?.dateRange?.from)
                params.append('from_date', filters.dateRange.from);
            if (filters?.dateRange?.to)
                params.append('to_date', filters.dateRange.to);
            if (filters?.providerId)
                params.append('provider_id', filters.providerId);
            if (filters?.serviceId)
                params.append('service_id', filters.serviceId);
            if (filters?.sortBy)
                params.append('sort_by', filters.sortBy);
            if (filters?.sortOrder)
                params.append('sort_order', filters.sortOrder);
            if (filters?.limit)
                params.append('limit', String(filters.limit));
            if (filters?.offset)
                params.append('offset', String(filters.offset));
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
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Error fetching actions';
            set({ error: message });
            console.error('fetchActions error:', err);
        }
        finally {
            set({ loading: false });
        }
    },
    fetchActionDetail: async (actionId) => {
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
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Error fetching action detail';
            set({ error: message });
            console.error('fetchActionDetail error:', err);
        }
        finally {
            set({ loading: false });
        }
    },
    setSelectedAction: (action) => {
        set({ selectedAction: action });
    },
    setFilters: (filters) => {
        set({ filters });
    },
    updateAction: async (actionId, data) => {
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
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Error updating action';
            set({ error: message });
            console.error('updateAction error:', err);
            throw err;
        }
        finally {
            set({ loading: false });
        }
    },
    updateActionProgress: async (actionId, followupId, data) => {
        set({ loading: true, error: null });
        try {
            const response = await fetch(`${API_BASE_URL}/actions/${actionId}/followups/${followupId}`, {
                method: 'POST',
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
            // Update detail view
            const currentDetail = get().actionDetail;
            if (currentDetail?.id === actionId) {
                const updatedFollowups = currentDetail.followups.map((f) => f.id === followupId ? result.data : f);
                set({
                    actionDetail: {
                        ...currentDetail,
                        followups: updatedFollowups,
                        completion_percentage: Math.round(updatedFollowups.reduce((sum, f) => sum + f.completion_percentage, 0) /
                            updatedFollowups.length),
                    },
                });
            }
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Error updating progress';
            set({ error: message });
            console.error('updateActionProgress error:', err);
            throw err;
        }
        finally {
            set({ loading: false });
        }
    },
    updateFollowup: async (actionId, followupId, data) => {
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
        }
        catch (err) {
            console.error('fetchStats error:', err);
            // Don't set error as this is optional
        }
    },
    clearError: () => {
        set({ error: null });
    },
}), {
    name: 'actionStore',
}));
//# sourceMappingURL=actionStore.js.map