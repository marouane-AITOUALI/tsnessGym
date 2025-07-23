import { Schema } from "mongoose";
import { Gym, GymStatus } from "../../../models";

export function gymSchema(): Schema {
  return new Schema(
    {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      location: {
        type: String,
        required: true,
      },
      description: {
        type: String,
      },
      capacity: {
        type: Number,
      },
      equipment: [
        {
          type: String,
        },
      ],
      difficultyLevels: [
        {
          type: String,
        },
      ],
      createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      ownerId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      status: {
        type: String,
        enum: Object.values(GymStatus),
        default: GymStatus.PENDING,
      },
      approvedByAdmin: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      assignedTypeExercises: [{
        type: Schema.Types.ObjectId,
        ref: "TypeExercise",
      }],
    },
    {
      timestamps: true,
      versionKey: false,
    }
  );
}
