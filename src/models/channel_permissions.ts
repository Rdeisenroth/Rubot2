import mongoose from "mongoose";

const ChannelPermissionsSchema = new mongoose.Schema<ChannelPermissionsDocument, ChannelPermissionsModel>({
    command_listen_mode: {
        type: Number,
        enum: [0, 1],
        default: 1,
        required: true
    },
    prefix: {
        type: String,
        required: true,
        default: "!"
    }
})


export interface ChannelPermissions {
    execute_commands: string[],
    // command_listen_mode: CommandListenMode,
}

export interface ChannelPermissionsDocument extends ChannelPermissions, mongoose.Document {

}
export interface ChannelPermissionsModel extends mongoose.Model<ChannelPermissionsDocument> {

}

// Default export
export default ChannelPermissionsSchema;