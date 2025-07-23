import { Schema } from "mongoose";
import { Session } from "../../../models";

export function sessionSchema(): Schema<Session> {
  return new Schema<Session>(
    {
      user: {
        type: String,
        ref: "User",
        required: true,
      },
      expirationDate: {
        type: Date,
        required: true,
      },
    },
    {
      timestamps: true,
      versionKey: false,
    }
  );
}
