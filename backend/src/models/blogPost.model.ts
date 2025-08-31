import mongoose, { Document, Schema } from "mongoose";

export interface IBlogPost extends Document {
  title: string;
  description: string;
  createdAt: Date;
}

const BlogPostSchema: Schema<IBlogPost> = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  createdAt: { type: Date, required: true, default: Date.now },
});

const BlogPost = mongoose.model<IBlogPost>("BlogPost", BlogPostSchema);

export default BlogPost;
