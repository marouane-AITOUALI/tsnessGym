import { Schema } from "mongoose";
import { Challenge, ChallengeStatus, ChallengeType, DifficultyLevel } from "../../../models";

export function challengeSchema(): Schema {
  return new Schema(
    {
      title: {
        type: String,
        required: true,
        trim: true,
      },
      description: {
        type: String,
        required: true,
        trim: true,
      },
      createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      gymId: {
        type: Schema.Types.ObjectId,
        ref: "Gym",
      },
      exercises: [
        {
          exerciseId: {
            type: Schema.Types.ObjectId,
            ref: "TypeExercise",
            required: true,
          },
          sets: { type: Number },
          reps: { type: Number },
          duration: { type: Number },
          restTime: { type: Number },
          weight: { type: Number },
          distance: { type: Number },
        },
      ],
      goals: [
        {
          type: {
            type: String,
            enum: ["TIME", "REPS", "WEIGHT", "DISTANCE", "CALORIES"],
            required: true,
          },
          target: {
            type: Number,
            required: true,
          },
          unit: {
            type: String,
            required: true,
          },
        },
      ],
      difficulty: {
        type: String,
        enum: Object.values(DifficultyLevel),
        required: true,
      },
      type: {
        type: String,
        enum: Object.values(ChallengeType),
        default: ChallengeType.INDIVIDUAL,
      },
      status: {
        type: String,
        enum: Object.values(ChallengeStatus),
        default: ChallengeStatus.ACTIVE,
      },
      duration: {
        type: Number,
        required: true, // Durée en jours
      },
      startDate: {
        type: Date,
      },
      endDate: {
        type: Date,
      },
      maxParticipants: {
        type: Number,
      },
      currentParticipants: {
        type: Number,
        default: 0,
      },
      rewards: {
        points: {
          type: Number,
          default: 0,
        },
        badgeIds: [
          {
            type: Schema.Types.ObjectId,
            ref: "Badge",
          },
        ],
      },
      estimatedCaloriesBurn: {
        type: Number,
        default: 0,
      },
      tags: [
        {
          type: String,
          trim: true,
        },
      ],
      isPublic: {
        type: Boolean,
        default: true,
      },
      inviteOnly: {
        type: Boolean,
        default: false,
      },
      teamBased: {
        type: Boolean,
        default: false,
      },
    },
    {
      timestamps: true,
      versionKey: false,
    }
  );
}
