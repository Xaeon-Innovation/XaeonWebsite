import mongoose, { Document, Schema } from "mongoose";

export interface IBlogPost extends Document {
  title: string;
  description: string;
  author: mongoose.Types.ObjectId;
  // images: ;
  createdAt: Date;
}

const BlogPostSchema: Schema<IBlogPost> = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  author: {
    type: Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
  },
  createdAt: { type: Date, required: true, default: Date.now },
});

const BlogPost = mongoose.model<IBlogPost>("BlogPost", BlogPostSchema);

export default BlogPost;
