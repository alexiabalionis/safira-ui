export type InvoiceStatus = "Emitida" | "Aguardando" | "Cancelada";

export type Invoice = {
  id: string;
  numero: string;
  cliente: string;
  valor: number;
  emissao: string;
  status: InvoiceStatus;
};

export type CreateInvoiceInput = {
  numero: string;
  cliente: string;
  valor: number;
};

const seedInvoices: Invoice[] = [
  {
    id: "1",
    numero: "NF-0001",
    cliente: "Distribuidora Aurora",
    valor: 2480.5,
    emissao: "2026-03-01",
    status: "Emitida",
  },
  {
    id: "2",
    numero: "NF-0002",
    cliente: "Mercado Horizonte",
    valor: 932.1,
    emissao: "2026-03-02",
    status: "Aguardando",
  },
  {
    id: "3",
    numero: "NF-0003",
    cliente: "Atacado Prisma",
    valor: 17120,
    emissao: "2026-03-03",
    status: "Emitida",
  },
  {
    id: "4",
    numero: "NF-0004",
    cliente: "Loja Vértice",
    valor: 420,
    emissao: "2026-03-03",
    status: "Cancelada",
  },
  {
    id: "5",
    numero: "NF-0005",
    cliente: "Comercial Delta",
    valor: 3560,
    emissao: "2026-03-04",
    status: "Emitida",
  },
  {
    id: "6",
    numero: "NF-0006",
    cliente: "Rede Atlante",
    valor: 780,
    emissao: "2026-03-04",
    status: "Aguardando",
  },
  {
    id: "7",
    numero: "NF-0007",
    cliente: "Bazar Ônix",
    valor: 1540,
    emissao: "2026-03-05",
    status: "Emitida",
  },
  {
    id: "8",
    numero: "NF-0008",
    cliente: "Grupo Nexo",
    valor: 9670,
    emissao: "2026-03-05",
    status: "Aguardando",
  },
  {
    id: "9",
    numero: "NF-0009",
    cliente: "Casa Vela",
    valor: 615,
    emissao: "2026-03-05",
    status: "Emitida",
  },
  {
    id: "10",
    numero: "NF-0010",
    cliente: "Importadora Órbita",
    valor: 12000,
    emissao: "2026-03-06",
    status: "Emitida",
  },
  {
    id: "11",
    numero: "NF-0011",
    cliente: "Café Brasa",
    valor: 358,
    emissao: "2026-03-06",
    status: "Aguardando",
  },
  {
    id: "12",
    numero: "NF-0012",
    cliente: "Farma Vista",
    valor: 2640,
    emissao: "2026-03-06",
    status: "Emitida",
  },
];

let invoicesDb = [...seedInvoices];

const sleep = (timeMs: number) =>
  new Promise((resolve) => setTimeout(resolve, timeMs));

export async function listInvoices(page: number, pageSize: number) {
  await sleep(220);

  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  return {
    data: invoicesDb.slice(start, end),
    total: invoicesDb.length,
  };
}

export async function createInvoice(input: CreateInvoiceInput) {
  await sleep(180);

  const invoice: Invoice = {
    id: String(Date.now()),
    numero: input.numero,
    cliente: input.cliente,
    valor: input.valor,
    emissao: new Date().toISOString().slice(0, 10),
    status: "Aguardando",
  };

  invoicesDb = [invoice, ...invoicesDb];
  return invoice;
}
