import { models } from "mongoose";
import { Document, Schema, model } from "mongoose";

// Team Member Interface
export interface ITeamMember extends Document {
  name: string;
  position: string;
  image?: string;
  bio?: string;
  experience?: string;
  location?: string;
  keyAchievement?: string;
  social: {
    email?: string;
    phone?: string;
    facebook?: string;
    linkedin?: string;
    twitter?: string;
  };
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// Team Member Schema
const teamMemberSchema = new Schema<ITeamMember>(
  {
    name: { type: String, required: true, trim: true },
    position: { type: String, required: true, trim: true },
    image: { type: String, default: "" },
    bio: { type: String, default: "" },
    experience: { type: String, default: "" },
    location: { type: String, default: "" },
    keyAchievement: { type: String, default: "" },
    social: {
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
      facebook: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      twitter: { type: String, default: "" },
    },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

teamMemberSchema.index({ order: 1, createdAt: -1 });
teamMemberSchema.index({ isActive: 1 });

// Export Team Member Model
export const TeamMember =
  models.TeamMember || model<ITeamMember>("TeamMember", teamMemberSchema);
