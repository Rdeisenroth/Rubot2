import ChannelType, { CommandInteraction, Guild, GuildMember, GuildMemberResolvable, GuildResolvable, Interaction, Message, Role, RoleResolvable, User, UserResolvable } from "discord.js";
import moment from "moment";
import { Command, StringReplacements } from "../../typings";
import { promisify } from "util";
import GuildSchema from "../models/guilds";
import glob from "glob";
import guilds from "../models/guilds";
import { Bot } from "../bot";
const globPromise = promisify(glob);
import * as crypto from "crypto";
import { dm_only_verify, dm_verify_guild, verify_secret } from "../../config.json";
import UserSchema from "../models/users";

/**
 * Checks if a given Variable is an array[] with at least a length of one or not
 *
 * @param variable the Variable to check
 * @returns
 */
export const isArraywithContent = (variable: any) => Array.isArray(variable) && (!!variable.length) && (variable.length > 0);

/**
 * Gets a random Integer
 *
 * @param min the minimum int
 * @param max the maximum int
 * @returns the random integer
 */
export const getRandomInt = (min: number, max: number) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Counts the Amount of Digits after the Comma of a Number
 *
 * @param {Number} number
 */
export const countDigits = (number: number) => (Math.floor(number) === number) ? 0 : number.toString().split(".")[1].length;

/**
 * Chooses Random Element off an Array
 * @param array The Non-empty Array to choose a random Entry off
 * @returns the Chosen Entry
 */
export const getRandomEntry: <T>(array: T[]) => T = (array) => {
    if (!isArraywithContent(array)) {
        throw new TypeError("The given Argument is not an array or is empty");
    }
    return array[getRandomInt(0, array.length - 1)];
};

/**
 * Chooses Random Element off an Array and considers weights
 * @param array The Weighted Array (Entries are Arrays with The actual entry and a weight > 0)
 * @returns The chosen Entry
 */
export const getRandomEntryWithWeights: <T>(array: [T, number][]) => T = (array) => {
    if (!isArraywithContent(array)) {
        throw new TypeError("The given Argument is not a weighted array or is empty");
    }
    //Gewichte Abspeichern, und dabei
    const maxdigits = Math.max(...array.map(x => countDigits(x[1])));
    const weights = array.map(x => x[1] * Math.pow(10, maxdigits));
    //Maximalgewicht
    const chosenNumber = getRandomInt(1, weights.reduce((x, y) => x + y));
    for (let i = 0, currentWeight = 0; i < weights.length; currentWeight += weights[i], i++) {
        if (chosenNumber > currentWeight && chosenNumber <= currentWeight + weights[i]) {
            return array[i][0];
        }
    }
    return array[0][0];
};

/**
 * Creates a clean User object from an Interaction
 * @param interaction the Interaction to get the User from
 * @returns the User
 */
export function getUser(interaction: Message | Interaction): ChannelType.User;
/**
 * Creates a clean User object from an Interaction
 * @param interaction  the Interaction to get the User from
 * @returns the User or null
 */
export function getUser(interaction: Message | Interaction | undefined): ChannelType.User | null;

export function getUser(interaction: Message | Interaction | undefined) {
    // Check if user is in VC
    if (!interaction) {
        return null;
    }
    if (interaction instanceof Message) {
        return interaction.author;
    } else {
        return interaction.user;
    }
}
/**
 * Creates a clean Member object from an Interaction
 * @param interaction  the Interaction to get the Member from
 * @returns the Member or null
 */
export const getMember = (interaction: Message | Interaction | undefined) => {
    // Check if user is in VC
    if (!interaction || !interaction.guild) {
        return null;
    }
    if (interaction instanceof Message) {
        return interaction.member;
    } else if (interaction instanceof Interaction) {
        const memberId = interaction.user.id;
        const member = interaction.guild.members.cache.find(x => x.id === memberId);
        if (member) {
            return member;
        }
    }
    return null;
};

/**
 * Replaces placeholders in a String with dynamic values
 * 
 * Default variables:
 * 
 *     'now':       System Time
 *     'mem_usage': Memory Usage
 * @param str The String to interpolate
 * @param replacements Additional Replace values, you can also overwrite the default ones by using the same name.
 */
export const interpolateString = (str: string, replacements?: StringReplacements) => {
    // Interpolate String
    const default_replacements: StringReplacements = {
        "now": moment().format("DD.MMMM YYYY hh:mm:ss"),
        "mem_usage": `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
    };
    for (const [key, value] of Object.entries({ ...default_replacements, ...replacements })) {
        str = str.replace(`\${${key}}`, value as string);
    }
    return str;
};

/**
 * Sleeps for given amount of Time
 * @param msec the Sleep Duration in ms
 * @returns Nothing
 */
export const sleep = async (msec: number) => {
    return new Promise(resolve => setTimeout(resolve, msec));
};


export async function hasPermission(client: Bot, mentionable: UserResolvable, command: Command): Promise<boolean>;
export async function hasPermission(client: Bot, mentionable: GuildMemberResolvable | RoleResolvable, command: Command, guild: GuildResolvable): Promise<boolean>;
export async function hasPermission(client: Bot, mentionable: UserResolvable | RoleResolvable, command: Command, guild?: GuildResolvable | null): Promise<boolean>;
export async function hasPermission(client: Bot, mentionable: UserResolvable | RoleResolvable, command: Command, guild?: GuildResolvable | null): Promise<boolean> {
    const g = guild ? client.guilds.resolve(guild) : null;
    const roleoruser = g?.roles.resolve(mentionable as RoleResolvable) ?? g?.members.resolve(mentionable as GuildMemberResolvable) ?? client.users.resolve(mentionable as UserResolvable);
    if (!g) {
        // TODO: Permissions for Global Commands
        return command.defaultPermission || roleoruser?.id === client.ownerID;
    }
    const guildData = (await GuildSchema.findById(g.id))!;
    const commandSettings = await guildData.guild_settings.getCommandByInternalName(command.name);
    const permission_overwrite = commandSettings?.permissions.some(x => x.id === roleoruser?.id && x.permission) ?? false;
    const role_permission_overwrite = (roleoruser instanceof GuildMember) && [...roleoruser.roles.cache.values()].some(r => commandSettings?.permissions.some(x => x.id === r.id && x.permission));
    return (commandSettings?.defaultPermission ?? command.defaultPermission ?? true) || permission_overwrite || role_permission_overwrite || roleoruser?.id === client.ownerID;
}

/**
 * Handles User Verification
 * @param replyable A Replyable message
 * @param tokenstring the Tokenstring used
 * @returns void
 */
export async function verifyUser(replyable: Message | CommandInteraction, tokenstring: string) {
    const author = (replyable instanceof Message) ? replyable.author : replyable.user;
    const client = replyable.client as Bot;
    // let content = (replyable instanceof Message) ? replyable.cleanContent : replyable.options.;
    console.log(`Verifying User ${author.tag} with token: ${tokenstring}`);
    const token = tokenstring.trim();
    const rauteSplit = token.split("#");
    if (rauteSplit.length != 2) {
        console.log(`Failed Verifying User ${author.tag} with message: Invalid Token String.`);
        return await client.utils.embeds.SimpleEmbed(replyable, { title: "Verification System Error", text: "Invalid Token String.", empheral: true });

    }
    const [other_infos, hmac] = rauteSplit;

    // HMAC bilden
    const expected_hmac = crypto.createHmac("sha256", verify_secret)
        .update(other_infos)
        .digest("hex");

    const buffer1 = Buffer.from(hmac);
    const buffer2 = Buffer.from(expected_hmac);


    if (buffer1.length != buffer2.length || !crypto.timingSafeEqual(buffer1, buffer2)) {
        console.log(`Failed Verifying User ${author.tag} with message: Invalid Token String.`);
        return await client.utils.embeds.SimpleEmbed(replyable, { title: "Verification System Error", text: "Invalid Token String.", empheral: true });
    }

    const user = author;
    const guild = await client.guilds.fetch(dm_verify_guild);
    if (!(guild instanceof Guild)) {
        console.log(`Failed Verifying User ${author.tag} with message: This should not happen... Please Contact the owner of the Bot.`);
        return await client.utils.embeds.SimpleEmbed(replyable, { title: "Server Not Found", text: "This should not happen... Please Contact the owner of the Bot.", empheral: true });
    }

    console.log(`${user.id}`);
    const member = await guild.members.fetch({ user, force: true });
    if (!(member instanceof GuildMember)) {
        console.log(`Failed Verifying User ${author.tag} with message: You are not a Member of the Guild.`);

        return await client.utils.embeds.SimpleEmbed(replyable, { title: "Verification System Error", text: "You are not a Member of the Guild.", empheral: true });
    }

    // Token-Format: "FOP-DiscordV1|tu-id|moodle-id#hmac"
    const [version_string, tu_id, moodle_id] = other_infos.split("|");

    let databaseUser = await UserSchema.findById(member.id);
    if (!databaseUser) {
        databaseUser = new UserSchema({ _id: member.id });
        await databaseUser.save();
    }
    databaseUser.tu_id = tu_id;
    databaseUser.moodle_id = moodle_id;

    // Check Duplicate Entry

    try {
        await databaseUser.save();
    } catch (error) {
        if ((error as any).message?.includes("duplicate key")) {
            console.log(`User ${member.displayName} tried to valid but already used token with TU-ID: "${tu_id}", Moodle-ID: "${moodle_id}"`);
            return await client.utils.embeds.SimpleEmbed(replyable, { title: "Verification System Error", text: "You can only Link one Discord Account.", empheral: true });
        } else {
            console.log(error);
            return await client.utils.embeds.SimpleEmbed(replyable, { title: "Verification System Error", text: "An Internal Error Occurred.", empheral: true });
        }
    }
    console.log(`Linked ${member.displayName} to TU-ID: "${tu_id}", Moodle-ID: "${moodle_id}"`);

    // Give Roles
    await member.guild.roles.fetch();
    const verifiedRole = member.guild.roles.cache.find(x => x.name.toLowerCase() === "verified");
    if (!verifiedRole) {
        return await client.utils.embeds.SimpleEmbed(replyable, { title: "Verification System Error", text: "Verified-Role Could not be found.", empheral: true });
    }

    if (member.roles.cache.has(verifiedRole.id) && version_string !== "FOP-DiscordV1-Tutor") {
        return await client.utils.embeds.SimpleEmbed(replyable, { title: "Verification System Error", text: "Your account has already been verified.", empheral: true });
    }
    await member.roles.add(verifiedRole);



    if (version_string === "FOP-DiscordV1-Tutor") {
        const coachRole = member.guild.roles.cache.find(x => x.name.toLowerCase() === "tutor");
        if (!coachRole) {
            return await client.utils.embeds.SimpleEmbed(replyable, { title: "Verification System Error", text: "Coach-Role Could not be found.", empheral: true });
        }
        if (member.roles.cache.has(coachRole.id)) {
            return await client.utils.embeds.SimpleEmbed(replyable, { title: "Verification System Error", text: "Your already have the coach Role.", empheral: true });
        }
        await member.roles.add(coachRole);
    }

    return await client.utils.embeds.SimpleEmbed(replyable, { title: "Verification System", text: "Your Discord-Account has been verified.", empheral: true });

}

export async function filterAsync<T>(array: readonly T[], callback: (value: T, index: number) => Promise<boolean>): Promise<T[]> {
    checkArgument(array, "array");
    checkArgument(callback, "callback");
    const results = await Promise.all(array.map((value, index) => callback(value, index)));
    return array.filter((_, i) => results[i]);
}
function checkArgument(value: unknown, name: string) {
    if (!value) {
        throw new Error(`The argument "${name}" cannot be empty`);
    }
}