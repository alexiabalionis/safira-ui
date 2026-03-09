"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { queryKeys } from "@/services/query-keys";
import {
  createUser,
  createPosto,
  importPostos,
  importWayCsv,
  createCliente,
  createERP,
  createRede,
  deleteCliente,
  deleteERP,
  deleteRede,
  getDashboard,
  listPostoRedes,
  listAutomationStatus,
  listClientes,
  listERPs,
  listPostos,
  listRedes,
  listReports,
  listReportsForExport,
  listUsers,
  resetUserTemporaryPassword,
  updateAutomationStatus,
  updateCliente,
  updateERP,
  updatePosto,
  updateUserRole,
  updateUserStatus,
} from "@/services/safira-api";

export function useDashboardQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: getDashboard,
  });
}

export function usePostosQuery(params: {
  page: number;
  pageSize: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  tipo?: string;
  erp?: string;
  redeId?: string;
  etapa?: string;
}) {
  return useQuery({
    queryKey: queryKeys.postos(params),
    queryFn: () => listPostos(params),
    placeholderData: keepPreviousData,
  });
}

export function usePostoRedesQuery() {
  return useQuery({
    queryKey: queryKeys.postosRedes,
    queryFn: listPostoRedes,
  });
}

export function useAutomationQuery(params: {
  page: number;
  pageSize: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  fase?: string;
  erp?: string;
}) {
  return useQuery({
    queryKey: queryKeys.automations(params),
    queryFn: () => listAutomationStatus(params),
    placeholderData: keepPreviousData,
  });
}

export function useUpdatePostoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof updatePosto>[1];
    }) => updatePosto(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["postos"] });
      await queryClient.invalidateQueries({ queryKey: queryKeys.postosRedes });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useCreatePostoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPosto,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["postos"] });
      await queryClient.invalidateQueries({ queryKey: queryKeys.postosRedes });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useImportPostosMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: importPostos,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["postos"] });
      await queryClient.invalidateQueries({ queryKey: queryKeys.postosRedes });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useImportWayCsvMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: importWayCsv,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["postos"] });
      await queryClient.invalidateQueries({ queryKey: ["redes"] });
      await queryClient.invalidateQueries({ queryKey: ["erps"] });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      await queryClient.invalidateQueries({ queryKey: queryKeys.postosRedes });
    },
  });
}

export function useUpdateAutomationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof updateAutomationStatus>[1];
    }) => updateAutomationStatus(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["automations"] });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useClientesQuery(params: {
  page: number;
  pageSize: number;
  search?: string;
  postoCnpj?: string;
}) {
  return useQuery({
    queryKey: queryKeys.clientes(params),
    queryFn: () => listClientes(params),
    placeholderData: keepPreviousData,
  });
}

export function useUpdateClienteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof updateCliente>[1];
    }) => updateCliente(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["clientes"] });
    },
  });
}

export function useERPsQuery(params: {
  page: number;
  pageSize: number;
  search?: string;
}) {
  return useQuery({
    queryKey: queryKeys.erps(params),
    queryFn: () => listERPs(params),
    placeholderData: keepPreviousData,
  });
}

export function useRedesQuery(params: {
  page: number;
  pageSize: number;
  search?: string;
}) {
  return useQuery({
    queryKey: queryKeys.redes(params),
    queryFn: () => listRedes(params),
    placeholderData: keepPreviousData,
  });
}

export function useCreateClienteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCliente,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["clientes"] });
    },
  });
}

export function useUsersQuery(params: {
  search?: string;
  role?: "admin" | "operador" | "visitante";
  ativo?: boolean;
}) {
  return useQuery({
    queryKey: queryKeys.users(params),
    queryFn: () => listUsers(params),
    placeholderData: keepPreviousData,
  });
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUserRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateUserRole,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUserStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateUserStatus,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useResetUserTemporaryPasswordMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resetUserTemporaryPassword,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useCreateERPMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createERP,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["erps"] });
    },
  });
}

export function useUpdateERPMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof updateERP>[1];
    }) => updateERP(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["erps"] });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useCreateRedeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRede,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["redes"] });
    },
  });
}

export function useDeleteClienteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCliente,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["clientes"] });
    },
  });
}

export function useDeleteERPMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteERP,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["erps"] });
    },
  });
}

export function useDeleteRedeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRede,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["redes"] });
    },
  });
}

export function useReportsQuery(params: {
  page: number;
  pageSize: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  category?: "Posto" | "Rede" | "ERP";
  tipo?: string;
  erp?: string;
  redeId?: string;
  etapa?: string;
}) {
  return useQuery({
    queryKey: queryKeys.reports(params),
    queryFn: () => listReports(params),
    placeholderData: keepPreviousData,
  });
}

export { listReportsForExport };
