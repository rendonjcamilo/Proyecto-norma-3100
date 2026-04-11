/**
 * Action Store (Zustand)
 * Manages state for corrective actions and tracking
 */
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
    dateRange?: {
        from: string;
        to: string;
    };
    providerId?: string;
    serviceId?: string;
    sortBy?: 'deadline' | 'priority' | 'progress' | 'created';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
}
interface ActionStore {
    actions: Action[];
    selectedAction: Action | null;
    actionDetail: Action & {
        followups: ActionFollowup[];
    } | null;
    filters: ActionFilters;
    stats: ActionStats | null;
    loading: boolean;
    error: string | null;
    fetchActions: (filters?: ActionFilters) => Promise<void>;
    fetchActionDetail: (actionId: string) => Promise<void>;
    setSelectedAction: (action: Action | null) => void;
    setFilters: (filters: ActionFilters) => void;
    updateAction: (actionId: string, data: Partial<Action>) => Promise<void>;
    updateActionProgress: (actionId: string, followupId: string, data: Partial<ActionFollowup>) => Promise<void>;
    updateFollowup: (actionId: string, followupId: string, data: Partial<ActionFollowup>) => Promise<void>;
    fetchStats: () => Promise<void>;
    clearError: () => void;
}
export declare const useActionStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<ActionStore>, "setState"> & {
    setState<A extends string | {
        type: string;
    }>(partial: ActionStore | Partial<ActionStore> | ((state: ActionStore) => ActionStore | Partial<ActionStore>), replace?: boolean | undefined, action?: A | undefined): void;
}>;
export {};
//# sourceMappingURL=actionStore.d.ts.map