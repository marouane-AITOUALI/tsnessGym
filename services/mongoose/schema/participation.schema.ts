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
      completedAt: {
        type: Date,
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
              sets: { type: Number, required: true },
              reps: { type: Number, required: true },
              weight: { type: Number },
              duration: { type: Number },
              distance: { type: Number },
            },
          ],
          caloriesBurned: {
            type: Number,
            default: 0,
          },
          notes: {
            type: String,
            trim: true,
          },
        },
      ],
      totalCaloriesBurned: {
        type: Number,
        default: 0,
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
      personalBest: {
        weight: { type: Number },
        reps: { type: Number },
        time: { type: Number },
        distance: { type: Number },
      },
    },
    {
      timestamps: true,
      versionKey: false,
    }
  );
}
