import { Mongoose, Model, FilterQuery, isValidObjectId } from "mongoose";
import { User, UserRole } from "../../../models";
import { userSchema } from "../schema";
import { sha256 } from "../../../utils";

export interface CreateUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  totalScore: number;
  badges?: string[];
  friends?: string[];
  challengesCompleted?: number;
  totalCaloriesBurned?: number;
  streakDays?: number;
}

export class UserService {
  readonly userModel: Model<User>;

  constructor(public readonly connection: Mongoose) {
    this.userModel = connection.model("User", userSchema());
  }

  async findUser(email: string, password?: string): Promise<User | null> {
    const filter: FilterQuery<User> = { email: email };
    if (password) {
      filter.password = sha256(password);
    }
    return this.userModel.findOne(filter).exec();
  }

  async createUser(user: CreateUser): Promise<User> {
    return this.userModel.create({
      ...user,
      password: sha256(user.password),
    });
  }

  async findUserById(id: string): Promise<User | null> {
    if (!isValidObjectId(id)) {
      return null;
    }
    return this.userModel.findById(id).exec();
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    if (!isValidObjectId(id)) {
      return null;
    }
    return this.userModel.findByIdAndUpdate(id, updates, { new: true }).exec();
  }

  async desactivateUser(id: string): Promise<User | null> {
    return this.updateUser(id, { isActive: false });
  }

  async activateUser(id: string): Promise<User | null> {
    return this.updateUser(id, { isActive: true });
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await this.userModel.findByIdAndDelete(id);
    return result !== null;
  }

  async addBadgeToUser(userId: string, badgeId: string): Promise<User | null> {
    if (!isValidObjectId(userId)) {
      return null;
    }
    return this.userModel
      .findByIdAndUpdate(
        userId,
        { $addToSet: { badges: badgeId } },
        { new: true }
      )
      .exec();
  }

  async updateUserScore(userId: string, points: number): Promise<User | null> {
    if (!isValidObjectId(userId)) {
      return null;
    }
    return this.userModel
      .findByIdAndUpdate(
        userId,
        { $inc: { totalScore: points } },
        { new: true }
      )
      .exec();
  }

  async getLeaderboard(limit: number = 10): Promise<User[]> {
    return this.userModel
      .find({ isActive: true })
      .sort({ totalScore: -1 })
      .limit(limit)
      .exec();
  }

  async addFriend(userId: string, friendId: string): Promise<User | null> {
    if (!isValidObjectId(userId) || !isValidObjectId(friendId)) {
      return null;
    }

    const user = await this.findUserById(userId);
    if (!user) {
      return null;
    }

    // Vérifier que l'ami existe et est actif
    const friend = await this.findUserById(friendId);
    if (!friend || !friend.isActive) {
      return null;
    }

    const result = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $addToSet: { friends: friendId } },
        { new: true }
      )
      .exec();

    return result;
  }

  async removeFriend(userId: string, friendId: string): Promise<User | null> {
    if (!isValidObjectId(userId) || !isValidObjectId(friendId)) {
      return null;
    }

    // Utiliser $pull pour supprimer l'ami
    return this.userModel
      .findByIdAndUpdate(
        userId,
        { $pull: { friends: friendId } },
        { new: true }
      )
      .exec();
  }

  async getFriends(userId: string): Promise<User[]> {
    const user = await this.findUserById(userId);

    if (!user || !user.friends || user.friends.length === 0) {
      return [];
    }

    const friends = await this.userModel
      .find({
        _id: { $in: user.friends },
        isActive: true,
      })
      .select("_id email firstName lastName totalScore")
      .exec();

    return friends;
  }


  async findSuperAdmin(): Promise<User | null> {
    return this.userModel.findOne({ role: UserRole.SUPER_ADMIN }).exec();
  }

  async getAllUsers(
    filters: any = {},
    limit: number = 50,
    skip: number = 0
  ): Promise<User[]> {
    const query = { ...filters };

    return this.userModel
      .find(query)
      .select("-password") // Exclure le mot de passe
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .exec();
  }

  async assignUserToGym(userId: string, gymId: string): Promise<User | null> {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        { $set: { gymId: gymId } },
        { new: true }
      )
      .populate('gymId', 'name location')
      .exec();
  }

  async getUsersByGym(gymId: string): Promise<User[]> {
    return this.userModel
      .find({ gymId: gymId })
      .select('-password')
      .populate('gymId', 'name location')
      .exec();
  }

  async removeUserFromGym(userId: string): Promise<User | null> {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        { $unset: { gymId: 1 } },
        { new: true }
      )
      .exec();
  }

  async updateUserStats(userId: string, stats: {
    challengesCompleted?: number;
    totalCaloriesBurned?: number;
    streakDays?: number;
    lastActivityDate?: Date;
  }): Promise<User | null> {
    const updateData: any = {};
    
    if (stats.challengesCompleted !== undefined) {
      updateData.$inc = { challengesCompleted: stats.challengesCompleted };
    }
    if (stats.totalCaloriesBurned !== undefined) {
      updateData.$inc = { ...updateData.$inc, totalCaloriesBurned: stats.totalCaloriesBurned };
    }
    if (stats.streakDays !== undefined) {
      updateData.streakDays = stats.streakDays;
    }
    if (stats.lastActivityDate !== undefined) {
      updateData.lastActivityDate = stats.lastActivityDate;
    }

    return this.userModel
      .findByIdAndUpdate(userId, updateData, { new: true })
      .exec();
  }

  async getUserStats(): Promise<any> {
    const totalUsers = await this.userModel.countDocuments().exec();
    const activeUsers = await this.userModel
      .countDocuments({ isActive: true })
      .exec();
    const superAdmins = await this.userModel
      .countDocuments({ role: UserRole.SUPER_ADMIN })
      .exec();
    const gymOwners = await this.userModel
      .countDocuments({ role: UserRole.GYM_OWNER })
      .exec();
    const regularUsers = await this.userModel
      .countDocuments({ role: UserRole.USER })
      .exec();

    return {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      superAdmins,
      gymOwners,
      regularUsers,
    };
  }
}
