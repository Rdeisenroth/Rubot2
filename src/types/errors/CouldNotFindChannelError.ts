import { ChannelType } from "discord.js";

export default class CouldNotFindChannelError extends Error {
    /**
     * The name or id of the channel which could not be found.
     */
    public channelNameOrId: string
    /**
     * The type of the channel which was expected.
     */
    public channelType?: ChannelType

    /**
     * Crate a new could not find channel error.
     * @param channelNameOrId The name or id of the channel which could not be found.
     * @param channelType The type of the channel which was expected.
     */
    constructor(channelNameOrId: string, channelType?: ChannelType) {
        super(`Could not find channel "${channelNameOrId}"${channelType ? ` with type "${ChannelType[channelType]}"` : ""}.`)
        this.channelNameOrId = channelNameOrId
        this.channelType = channelType
    }
}