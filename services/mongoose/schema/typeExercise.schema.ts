import { Schema, model } from "mongoose";
import { TypeExercise } from "../../../models";


export function typeExerciseSchema(): Schema {
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
        trim: true,
      },
      targetedMuscles: {
        type: [String],
        required: true,
        validate: {
          validator: function (muscles: string[]) {
            return muscles.length > 0;
          },
          message: "At least one targeted muscle is required",
        },
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