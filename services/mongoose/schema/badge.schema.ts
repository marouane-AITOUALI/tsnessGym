import { Schema, model } from "mongoose";
import { Badge, BadgeType } from "../../../models";

export function badgeSchema(): Schema {
  return new Schema(
    {
      name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
      },
      description: {
        type: String,
        required: true,
        trim: true,
      },
      type: {
        type: String,
        enum: Object.values(BadgeType),
        required: true,
      },
      rules: [
        {
          type: Schema.Types.Mixed,
          required: true,
          validate: {
            validator: function (rules: any[]) {
              return rules.length > 0;
            },
            message: "At least one rule is required",
          },
        },
      ],
      points: {
        type: Number,
        required: true,
        min: 0,
      },
      isActive: {
        type: Boolean,
        default: true,
      },
      createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    },
    {
      timestamps: true,
    }
  );
}