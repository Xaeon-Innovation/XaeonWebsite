import mongoose, { type Document, Schema } from "mongoose";

export interface IBlogPost extends Document {
  title: string;
  description: string;
  author: mongoose.Types.ObjectId;
  // images: ;
  createdAt: Date;
  updatedAt: Date;
}

const BlogPostSchema: Schema<IBlogPost> = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  author: {
    type: Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
  },
}, { timestamps: true });

const BlogPost = mongoose.model<IBlogPost>("BlogPost", BlogPostSchema);

export default BlogPost;
