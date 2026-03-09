import mongoose, { Schema, model } from "mongoose";

const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;

const postoReferenciaSchema = new Schema(
  {
    postoId: {
      type: String,
      required: true,
      trim: true,
    },
    cnpjEc: {
      type: String,
      required: true,
      trim: true,
      match: cnpjRegex,
    },
  },
  {
    _id: false,
  },
);

const clienteSchema = new Schema(
  {
    _id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    cnpj: {
      type: String,
      required: true,
      unique: true,
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
    postosAbastece: {
      type: [postoReferenciaSchema],
      required: true,
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

clienteSchema.index({ "postosAbastece.cnpjEc": 1 });

export const ClienteModel = model("Cliente", clienteSchema);
