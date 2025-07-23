import { Mongoose, Model, isValidObjectId } from "mongoose";
import { Session } from "../../../models";
import { sessionSchema } from "../schema";

export interface CreateSession {
  user: string;
  expirationDate: Date;
}

export class SessionService {
  readonly sessionModel: Model<Session>;

  constructor(public readonly connection: Mongoose) {
    this.sessionModel = connection.model("Session", sessionSchema());
  }

  async createSession(session: CreateSession): Promise<Session> {
    return this.sessionModel.create(session);
  }

  async findActiveSession(sessionId: string): Promise<Session | null> {
    if (!isValidObjectId(sessionId)) {
      return null;
    }
    return this.sessionModel
      .findOne({
        _id: sessionId,
        expirationDate: { $gt: new Date() },
      })
      .populate("user")
      .exec();
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    if (!isValidObjectId(sessionId)) {
      return false;
    }
    const result = await this.sessionModel.deleteOne({ _id: sessionId }).exec();
    return result.deletedCount > 0;
  }

  async cleanExpiredSessions(): Promise<number> {
    const result = await this.sessionModel
      .deleteMany({
        expirationDate: { $lt: new Date() },
      })
      .exec();
    return result.deletedCount;
  }
}
