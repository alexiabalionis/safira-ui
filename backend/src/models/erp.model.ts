import { Schema, model } from "mongoose";

const erpSchema = new Schema(
  {
    nome: {
      type: String,
      required: true,
      trim: true,
    },
    normalizedNome: {
      type: String,
      required: true,
      trim: true,
    },
    versao: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Aguardando", "em_andamento", "Finalizado"],
      required: true,
      default: "Aguardando",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

erpSchema.index({ nome: 1 });
erpSchema.index({ normalizedNome: 1 });

erpSchema.index({ nome: 1, versao: 1 }, { unique: true });

export const ERPModel = model("ERP", erpSchema);
