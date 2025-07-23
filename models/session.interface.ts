import { Document } from "mongoose";
import { Timestamps } from "./timestamps";

export interface Session extends Document, Timestamps {
  _id: string;
  user: string; // ID de l'utilisateur
  expirationDate: Date;
}
