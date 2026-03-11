export interface Movimiento {
  fecha: Date | null;
  ano: number | null;
  mes: number | null;
  op: string;
  vinculante: string;
  estado: string;
  tipo: string;
  origen: string;
  destino: string;
  importe: number | null;
  moneda: string;
  porc1: number | null;
  cImpo: number | null;
  cTotal: number | null;
  v1: string;
  porc2: number | null;
  dImpo: number | null;
  dTotal: number | null;
  v2: string;
  cotRef: number | null;
  comentario: string;
  customerId: string;
  usd: number | null;
  ars: number | null;
  usdt: string;
}

export interface Operacion {
  operacion: string;
  cliente: string;
  ingreso: number | null;
  egreso: number | null;
  comision: number | null;
  diferencia: number | null;
  cierre: string;
  otros: number | null;
  usdRent: number | null;
  arsRent: number | null;
  usdtRent: number | null;
}

export interface CarteraCliente {
  cliente: string;
  tipo: string;
  saldoInicial: number | null;
  usdCo: number | null;
  usdImporte: number | null;
  diferencia: number | null;
  usdMov: number | null;
  usdSaldo: number | null;
  pendiente: number | null;
  comentario: string;
}

export interface CarteraBanco {
  cliente: string;
  tipo: string;
  direccion: string;
  saldoInicial: number | null;
  usdCo: number | null;
  usdImporte: number | null;
  diferencia: number | null;
  usdMov: number | null;
  usdSaldo: number | null;
  pendiente: number | null;
  saldoUnificado: number | null;
  saldoReal: number | null;
}

export interface CarteraBancoVerificado {
  cliente: string;
  tipo: string;
  direccion: string;
  saldoInicial: number | null;
  usdCo: number | null;
  ingreso: number | null;
  egreso: number | null;
  usdMov: number | null;
  usdSaldo: number | null;
  pendiente: number | null;
  saldoUnificado: number | null;
}

export interface DashboardKPI {
  ano: number | null;
  mes: number | null;
  estado: string;
  monedas: {
    moneda: string;
    ingresos: number | null;
    costo1: number | null;
    egresos: number | null;
    ganancias: number | null;
    importe: number | null;
  }[];
}

export interface Salida {
  fecha: Date | null;
  ano: number | null;
  mes: number | null;
  nroOperacion: number | null;
  pagador: string;
  beneficiario: string;
  importe: number | null;
  pTasa: number | null;
  pImpo: number | null;
  pTotal: number | null;
  bTasa: number | null;
  bImpo: number | null;
  bTotal: number | null;
  verificado: string;
  comentario: string;
}

export interface Compensacion {
  fecha: Date | null;
  ano: number | null;
  mes: number | null;
  nroOperacion: number | null;
  pagador: string;
  beneficiario: string;
  importe: number | null;
  pTasa: number | null;
  pImpo: number | null;
  pTotal: number | null;
  bTasa: number | null;
  bImpo: number | null;
  bTotal: number | null;
  verificado: string;
  comentario: string;
  pagado: string;
  ctaCtePagador: string;
  ctaCteBeneficiario: string;
}

export interface HistoricoOperacion {
  fecha: Date | null;
  ano: number | null;
  mes: number | null;
  nroOperacion: number | null;
  status: string;
  tipo: string;
  cliente: string;
  importe: number | null;
  tasaPor: number | null;
  tasaImp: number | null;
  total: number | null;
  ctaCteCliente: string;
  comisionista: string;
  comisionistasPorc: string;
  customerId: string;
  zohoCustomerId: string;
  shippingCharge: number | null;
  entityDiscountAmount: number | null;
  deudaCliente: number | null;
}

export interface HistoricoEntrada {
  date: Date | null;
  ano: number | null;
  mes: number | null;
  paymentNumber: number | null;
  customerName: string;
  depositTo: string;
  forma: string;
  customerPaymentId: string;
  customerId: string;
  unusedAmount: number | null;
  referenceNumber: string;
  invoicePaymentId: string;
  amountApplied: number | null;
  invoiceNumber: string;
  invoiceDate: Date | null;
}

export interface HistoricoSalida {
  fecha: Date | null;
  ano: number | null;
  mes: number | null;
  nroOperacion: number | null;
  pagador: string;
  beneficiario: string;
  importe: number | null;
  tasaPor: number | null;
  tasaImp: number | null;
  pagado: string;
  ctaCtePagador: string;
  ctaCteBeneficiario: string;
  idZoho: string;
  vendor: string;
}
