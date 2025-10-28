import mongoose, { Document, Model, Schema } from 'mongoose';

// TypeScript interface for the Booking document
export interface IBooking extends Document {
  eventId: mongoose.Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose schema definition
const bookingSchema = new Schema<IBooking>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt
  }
);

// Pre-save hook: Verify that the referenced event exists
bookingSchema.pre('save', async function (next) {
  // Only verify eventId if it's modified or document is new
  if (this.isModified('eventId')) {
    try {
      // Import Event model dynamically to avoid circular dependency issues
      const Event = mongoose.models.Event || (await import('./event.model')).default;
      
      // Check if the event exists in the database
      const eventExists = await Event.exists({ _id: this.eventId });
      
      if (!eventExists) {
        return next(new Error('Referenced event does not exist'));
      }
    } catch (error) {
      return next(new Error('Failed to verify event existence'));
    }
  }

  next();
});

// Create index on eventId for faster queries
bookingSchema.index({ eventId: 1 });

// Create compound index for unique booking per email per event (optional, uncomment if needed)
bookingSchema.index({ eventId: 1, email: 1 }, { unique: true });

// Enforce one booking per events per email
bookingSchema.index({ eventId: 1, email: 1 }, { unique: true, name: 'uniq_event_email' });

// Create and export the Booking model
const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>('Booking', bookingSchema);

export default Booking;
