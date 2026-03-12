import mongoose, { Schema, model } from "mongoose";

import {
  AUTOMACAO_ETAPA_VALUES,
  AUTOMACAO_TIPO_VALUES,
} from "../domain/automation";

const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;

const automacaoSchema = new Schema(
  {
    tipo: {
      type: String,
      enum: AUTOMACAO_TIPO_VALUES,
      required: false,
      default: null,
    },
    etapa: {
      type: String,
      enum: AUTOMACAO_ETAPA_VALUES,
      required: false,
      trim: true,
      default: null,
    },
    dataEtapa: {
      type: Date,
      required: false,
      default: null,
    },
    analistaResponsavel: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
  },
  {
    _id: false,
  },
);

const clienteAbasteceSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
    },
    cnpj: {
      type: String,
      required: true,
      trim: true,
      match: cnpjRegex,
    },
    razaoSocial: {
      type: String,
      required: true,
      trim: true,
    },
    nomeFantasia: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  },
);

const postoSchema = new Schema(
  {
    _id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    cnpjEc: {
      type: String,
      required: true,
      trim: true,
      match: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
    },
    cnpjEcDigits: {
      type: String,
      required: true,
      trim: true,
      match: /^\d{14}$/,
      unique: true,
    },
    razaoSocial: {
      type: String,
      required: true,
      trim: true,
    },
    nomeFantasia: {
      type: String,
      required: true,
      trim: true,
    },
    cidade: {
      type: String,
      required: true,
      trim: true,
    },
    uf: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      minlength: 2,
      maxlength: 2,
    },
    redeId: {
      type: Schema.Types.ObjectId,
      ref: "Rede",
      required: false,
      default: null,
    },
    erp: {
      type: String,
      required: false,
      default: null,
      trim: true,
    },
    erpId: {
      type: Schema.Types.ObjectId,
      ref: "ERP",
      required: false,
      default: null,
    },
    responsavelPosto: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    telefone: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    email: {
      type: String,
      required: false,
      trim: true,
      lowercase: true,
      default: null,
    },
    automacao: {
      type: automacaoSchema,
      required: false,
      default: null,
    },
    clientesQueAbastecem: {
      type: [clienteAbasteceSchema],
      required: true,
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

postoSchema.index({ nomeFantasia: 1 });
postoSchema.index({ razaoSocial: 1 });
postoSchema.index({ cidade: 1, uf: 1 });
postoSchema.index({ erpId: 1 });

export const PostoModel = model("Posto", postoSchema);
