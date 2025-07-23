import { Schema } from "mongoose";
import { User, UserRole } from "../../../models";

export function userSchema(): Schema<User> {
  return new Schema<User>(
    {
      email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
      },
      password: {
        type: String,
        required: true,
      },
      firstName: {
        type: String,
        required: true,
        trim: true,
      },
      lastName: {
        type: String,
        required: true,
        trim: true,
      },
      role: {
        type: String,
        enum: Object.values(UserRole),
        default: UserRole.USER,
      },
      isActive: {
        type: Boolean,
        default: true,
      },
      badges: [
        {
          type: Schema.Types.ObjectId,
          ref: "Badge",
        },
      ],
      totalScore: {
        type: Number,
        default: 0,
      },
      gymId: {
        type: Schema.Types.ObjectId,
        ref: "Gym",
      },
      friends: [
        {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      challengesCompleted: {
        type: Number,
        default: 0,
      },
      totalCaloriesBurned: {
        type: Number,
        default: 0,
      },
      streakDays: {
        type: Number,
        default: 0,
      },
      lastActivityDate: {
        type: Date,
      },
    },
    {
      timestamps: true,
      versionKey: false,
    }
  );
}
