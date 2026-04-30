import { Schema, model, Document, Types } from 'mongoose';

export type TaskStatus = 'Todo' | 'In Progress' | 'Done';

export interface ITask extends Document {
  title: string;
  description?: string;
  projectId: Types.ObjectId;
  assignedTo: Types.ObjectId;
  status: TaskStatus;
  dueDate: Date;
  createdAt: Date;
  updatedAt?: Date;
}

const taskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['Todo', 'In Progress', 'Done'],
      default: 'Todo',
    },
    dueDate: {
      type: Date,
      required: true,
    },
    createdAt: {
      type: Date,
      required: true,
    },
  },
  {
    // Do not use timestamps: true — createdAt is set explicitly on creation
    // updatedAt is managed manually or omitted
    timestamps: false,
  }
);

taskSchema.index({ projectId: 1 });
taskSchema.index({ assignedTo: 1 });

const Task = model<ITask>('Task', taskSchema);

export default Task;
