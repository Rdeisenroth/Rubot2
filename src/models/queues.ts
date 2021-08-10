import mongoose from "mongoose";

/**
 * A Schema For storing and Managing Guilds
 */
const QueueSchema = new mongoose.Schema<QueueDocument, QueueModel>({
    /**
     * The Name of the Queue
     */
    name: {
        type: String,
        required: true,
    },
    /**
     * The Description of the Queue
     */
    description: {
        type: String,
        required: false,
    },
    /**
     * The max Amount of Users that the queue can handle
     */
    limit: {
        type: Number,
        required: false,
    },
    /**
     * The Timeout in Milliseconds if the User disconnects from the Queue (usefull for VC based Queues)
     */
    disconnect_timeout: {
        type: Number,
        required: false,
    },
    /**
     * The Timeout in Milliseconds that the user is kicked off the queue After not accepting a match
     */
    match_timeout: {
        type: Number,
        required: false,
    },
    /**
     * A Custom Join Message for the Queue. Use ${pos} ${total} ${eta} ${user} and so on to create Dynamic Messages.
     */
    join_message: {
        type: String,
        required: false,
    },
    /**
     * A Custom Match Found Message for the Queue. Use ${pos} ${total} ${eta} ${user} and so on to create Dynamic Messages.
     */
    match_found_message: {
        type: String,
        required: false,
    },
    /**
     *  A Custom Timeout Message. Use ${pos} ${total} ${eta} ${user} ${timeout} and so on to create Dynamic Messages.
     */
    timeout_message: {
        type: String,
        required: false,
    },
});

// TODO Find better Names so that they don't conflict with discordjs Interfaces
/**
 * A Guild from the Database
 */
export interface Queue {
    /**
     * The Name Of The Queue
     */
    name: string,
    /**
     * A Description of the Queue
     */
    description?: string,
    /**
     * The max Amount of Users that the queue can handle
     */
    limit?: number,
    /**
     * The Timeout in Milliseconds if the User disconnects from the Queue (usefull for VC based Queues)
     */
    disconnect_timeout?: number,
    /**
     * The Timeout in Milliseconds that the user is kicked off the queue After not accepting a match
     */
    match_timeout?: number,
    /**
     * A Custom Join Message for the Queue. Use ${pos} ${total} ${eta} ${user} and so on to create Dynamic Messages.
     */
    join_message?: string,
    /**
     *  A Custom Match Found Message for the Queue. Use ${pos} ${total} ${eta} ${user} ${match} ${match_channel} and so on to create Dynamic Messages.
     */
    match_found_message?: string,
    /**
     *  A Custom Timeout Message. Use ${pos} ${total} ${eta} ${user} ${timeout} and so on to create Dynamic Messages.
     */
    timeout_message?: string,
}

export interface QueueDocument extends Queue, mongoose.Document {
    // List getters or non model methods here
}

export interface QueueModel extends mongoose.Model<QueueDocument> {
    // List Model methods here
}

// Default export
export default QueueSchema;