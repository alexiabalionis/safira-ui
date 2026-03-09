import mongoose, { Schema, model } from "mongoose";

export const userRoles = ["admin", "operador", "visitante"] as const;
export type UserRole = (typeof userRoles)[number];

const userSchema = new Schema(
  {
    _id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    nome: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    role: {
      type: String,
      enum: userRoles,
      required: true,
      default: "visitante",
    },
    passwordHash: {
      type: String,
      required: true,
    },
    forcePasswordChange: {
      type: Boolean,
      required: true,
      default: true,
    },
    ativo: {
      type: Boolean,
      required: true,
      default: true,
    },
    passwordUpdatedAt: {
      type: Date,
      required: false,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      required: false,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const UserModel = model("User", userSchema);
