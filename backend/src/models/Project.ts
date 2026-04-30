import { Schema, model, Document, Types } from 'mongoose';

export interface IProject extends Document {
  title: string;
  description?: string;
  admin: Types.ObjectId;
  members: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    admin: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

projectSchema.index({ admin: 1 });
projectSchema.index({ members: 1 });

const Project = model<IProject>('Project', projectSchema);

export default Project;
