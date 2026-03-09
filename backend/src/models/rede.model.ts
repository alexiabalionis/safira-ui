import { Schema, model } from "mongoose";

const redeSchema = new Schema(
  {
    nome: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const RedeModel = model("Rede", redeSchema);
