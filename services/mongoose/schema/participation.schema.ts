import { Schema } from "mongoose";
import { ChallengeParticipation, ParticipationStatus } from "../../../models";

export function participationSchema(): Schema {
  return new Schema(
    {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      challengeId: {
        type: Schema.Types.ObjectId,
        ref: "Challenge",
        required: true,
      },
      status: {
        type: String,
        enum: Object.values(ParticipationStatus),
        default: ParticipationStatus.JOINED,
      },
      joinedAt: {
        type: Date,
        default: Date.now,
      },
      progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      workoutSessions: [
        {
          date: {
            type: Date,
            required: true,
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
              weight: { type: Number },
              distance: { type: Number },
              caloriesBurned: { type: Number },
              completed: { type: Boolean, default: false },
            },
          ],
          totalDuration: {
            type: Number,
            default: 0,
          },
          totalCalories: {
            type: Number,
            default: 0,
          },
          notes: {
            type: String,
            trim: true,
          },
        },
      ],
      // Statistiques globales
      totalWorkouts: {
        type: Number,
        default: 0,
      },
      totalDuration: {
        type: Number,
        default: 0,
      },
      totalCalories: {
        type: Number,
        default: 0,
      },
      // Dates importantes
      startedAt: {
        type: Date,
      },
      completedAt: {
        type: Date,
      },
      // Social et configuration
      isPublic: {
        type: Boolean,
        default: true,
      },
      pointsEarned: {
        type: Number,
        default: 0,
      },
      // Records personnels
      personalBest: {
        type: {
          type: String, // "time", "weight", "reps", etc.
        },
        value: { type: Number },
        unit: { type: String },
        achievedAt: { type: Date },
      },
      badgesEarned: [
        {
          type: Schema.Types.ObjectId,
          ref: "Badge",
        },
      ],
      invitedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      teamId: {
        type: String,
      },
    },
    {
      timestamps: true,
      versionKey: false,
    }
  );
}
