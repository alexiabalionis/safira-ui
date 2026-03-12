export { ApiRequestError } from "@/services/integrations/api-base";

export {
  changePassword,
  createUser,
  getCurrentUser,
  listUsers,
  login,
  logout,
  resetUserTemporaryPassword,
  updateUserRole,
  updateUserStatus,
} from "@/services/integrations/auth.service";

export {
  createPosto,
  importPostos,
  importWayCsv,
  listAutomationStatus,
  listPostoRedes,
  listPostos,
  listPostosPage,
  updateAutomationStatus,
  updatePosto,
} from "@/services/integrations/posto.service";

export {
  createCliente,
  deleteCliente,
  listClientes,
  updateCliente,
} from "@/services/integrations/cliente.service";

export {
  createRede,
  deleteRede,
  listRedes,
  updateRede,
} from "@/services/integrations/rede.service";

export {
  createERP,
  deleteERP,
  listERPs,
  updateERP,
} from "@/services/integrations/erp.service";

export {
  getDashboard,
  listReports,
  listReportsForExport,
} from "@/services/integrations/dashboard.service";

export type { AuthRole, AuthUser } from "@/types/auth.types";
export type {
  ImportWayCsvResult,
  ListPostosFilters,
} from "@/types/posto.types";
export type { ReportFilters, ReportRow } from "@/types/report.types";
