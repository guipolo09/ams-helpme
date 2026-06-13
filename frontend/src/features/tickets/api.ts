import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";

export interface TicketListItem {
  id: string;
  number: number;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
  application: { id: string; name: string } | null;
  category: { id: string; name: string; color: string | null } | null;
  requester: { id: string; name: string };
  assignee: { id: string; name: string } | null;
  _count: { comments: number };
}

export interface TicketDetail extends TicketListItem {
  description: string;
  rating: number | null;
  comments: {
    id: string;
    body: string;
    isInternal: boolean;
    createdAt: string;
    author: { id: string; name: string; role: string };
  }[];
  statusHistory: {
    id: string;
    fromStatus: string | null;
    toStatus: string;
    note: string | null;
    createdAt: string;
    changedBy: { id: string; name: string };
  }[];
}

export function useTickets(filters: Record<string, string>) {
  return useQuery({
    queryKey: ["tickets", filters],
    queryFn: async () => {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v)
      );
      const { data } = await api.get("/tickets", { params });
      return data as {
        items: TicketListItem[];
        total: number;
        page: number;
        pageSize: number;
      };
    },
  });
}

export function useTicketStats() {
  return useQuery({
    queryKey: ["ticket-stats"],
    queryFn: async () => {
      const { data } = await api.get("/tickets/stats");
      return data as { total: number; byStatus: Record<string, number> };
    },
  });
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: ["ticket", id],
    queryFn: async () => {
      const { data } = await api.get(`/tickets/${id}`);
      return data as TicketDetail;
    },
    enabled: !!id,
  });
}

export function useCreateTicket() {
  return useMutation({
    mutationFn: async (input: {
      title: string;
      description: string;
      priority: string;
      applicationId?: string | null;
      categoryId?: string | null;
    }) => {
      const { data } = await api.post("/tickets", input);
      return data as TicketDetail;
    },
  });
}

function useTicketMutation<T>(fn: (vars: T & { id: string }) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (_d, vars: any) => {
      qc.invalidateQueries({ queryKey: ["ticket", vars.id] });
      qc.invalidateQueries({ queryKey: ["tickets"] });
      qc.invalidateQueries({ queryKey: ["ticket-stats"] });
    },
  });
}

export function useAddComment() {
  return useTicketMutation<{ body: string; isInternal: boolean }>((vars) =>
    api.post(`/tickets/${vars.id}/comments`, {
      body: vars.body,
      isInternal: vars.isInternal,
    })
  );
}

export function useUpdateStatus() {
  return useTicketMutation<{ status: string; note?: string }>((vars) =>
    api.patch(`/tickets/${vars.id}/status`, {
      status: vars.status,
      note: vars.note,
    })
  );
}

export function useAssign() {
  return useTicketMutation<{ assigneeId: string | null }>((vars) =>
    api.patch(`/tickets/${vars.id}/assign`, { assigneeId: vars.assigneeId })
  );
}

export function useApplications() {
  return useQuery({
    queryKey: ["applications"],
    queryFn: async () => {
      const { data } = await api.get("/applications");
      return data as { id: string; name: string; description: string | null; ownerName: string | null }[];
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await api.get("/categories");
      return data as { id: string; name: string; color: string | null }[];
    },
  });
}

export function useAgents(enabled: boolean) {
  return useQuery({
    queryKey: ["agents"],
    queryFn: async () => {
      const { data } = await api.get("/users", { params: { role: "AGENT" } });
      return data as { id: string; name: string }[];
    },
    enabled,
  });
}
