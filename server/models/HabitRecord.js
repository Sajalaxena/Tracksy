const { Schema, model } = require('mongoose');

const HabitRecordSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['boolean', 'numeric'],
      required: true,
    },
    month: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}$/,
    },
    data: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// Unique compound index — prevents duplicate category per user per month
HabitRecordSchema.index({ userId: 1, name: 1, month: 1 }, { unique: true });

module.exports = model('HabitRecord', HabitRecordSchema);
