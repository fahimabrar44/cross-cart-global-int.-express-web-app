import mongoose from "mongoose";
import { models } from "mongoose";
import { Document, Schema, Types, model } from "mongoose";

// Blog Interface
export interface IBlog extends Document {
  title: string;
  slug: string; // URL-friendly slug
  content: string;
  excerpt?: string; // short summary for blog cards / SEO
  image?: string;
  images?: string[]; // gallery of images
  author: Types.ObjectId;
  category: string; // service, news, update, promotion
  tags?: string[]; // SEO tags / keywords
  relatedService?: Types.ObjectId;
  status: string; // draft, review, published, archived
  isPublished: boolean;
  views: number;
  likes: number;
  dislikes: number;
  reactions?: {
    // Optional: social reactions
    [key: string]: number; // e.g., { love: 5, wow: 2, sad: 1 }
  };
  metaTitle?: string;
  metaDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Blog Schema
const blogSchema = new Schema<IBlog>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true },
    content: { type: String, required: true },
    excerpt: { type: String, default: "" },
    image: { type: String, default: "" },
    images: { type: [String], default: [] },

    author: { type: Schema.Types.ObjectId, ref: "User", required: true },

    category: {
      type: String,
      enum: ["service", "news", "update", "promotion"],
      default: "service",
    },

    tags: [{ type: String }], // SEO keywords

    relatedService: { type: Schema.Types.ObjectId, ref: "Service" },

    status: {
      type: String,
      enum: ["draft", "review", "published", "archived"],
      default: "draft",
    },

    isPublished: { type: Boolean, default: true },

    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    reactions: { type: Schema.Types.Mixed, default: {} },

    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
  },
  { timestamps: true }
);

// Slug auto-generation from title (handles special chars + duplicate titles)
blogSchema.pre("save", async function (next) {
  if (!this.isModified("title")) return next();

  const base =
    this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-") || "post";

  let candidate = base;
  let suffix = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await (
      this.constructor as typeof mongoose.Model
    ).findOne({
      slug: candidate,
      _id: { $ne: this._id },
    });
    if (!existing) break;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  this.slug = candidate;
  next();
});

// Index for search & filter
blogSchema.index({ title: "text", content: "text", tags: 1 });
blogSchema.index({ category: 1, createdAt: -1 });

// Export Blog Model
export const Blog = models.Blog || model<IBlog>("Blog", blogSchema);
