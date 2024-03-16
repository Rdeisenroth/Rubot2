import mongoose from 'mongoose';

/**
 * Simple Type To Export Event Dates
 */
export type EventDate = {
    /**
     * The Event ID
     */
    event_id?: mongoose.Types.ObjectId,
    /**
     * The Target ID
     */
    target_id: string,
    /**
     * The Timestamp
     */
    timestamp: string,
}