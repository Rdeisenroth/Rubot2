import ChannelType, { GuildMember, Interaction, Message } from "discord.js";
import moment from "moment";
import { StringReplacements } from "../../typings";
import { APIInteractionDataResolvedGuildMember } from 'discord-api-types/v9';

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
}

/**
 * Counts the Amount of Digits after the Comma of a Number
 *
 * @param {Number} number
 */
export const countDigits = (number: number) => (Math.floor(number) === number) ? 0 : number.toString().split('.')[1].length;

/**
 * Chooses Random Element off an Array
 * @param array The Non-empty Array to choose a random Entry off
 * @returns the Chosen Entry
 */
export const getRandomEntry: <T>(array: T[]) => T = (array) => {
    if (!isArraywithContent(array)) {
        throw new TypeError("The given Argument is not an array or is empty")
    }
    return array[getRandomInt(0, array.length - 1)];
}

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
    let maxdigits = Math.max(...array.map(x => countDigits(x[1])));
    let weights = array.map(x => x[1] * Math.pow(10, maxdigits));
    //Maximalgewicht
    let chosenNumber = getRandomInt(1, weights.reduce((x, y) => x + y))
    for (let i = 0, currentWeight = 0; i < weights.length; currentWeight += weights[i], i++) {
        if (chosenNumber > currentWeight && chosenNumber <= currentWeight + weights[i]) {
            return array[i][0];
        }
    }
    return array[0][0];
}


/**
 * Creates a clean User object from an Interaction
 * @param interaction  the Interaction to get the User from
 * @returns the User or null
 */
export const getUser = (interaction: Message | Interaction | undefined) => {
    // Check if user is in VC
    if (!interaction) {
        return null;
    }
    if (interaction instanceof Message) {
        return interaction.author;
    } else if (interaction instanceof Interaction) {
        return interaction.user;
    }
    return null;
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
        let memberId = interaction.user.id;
        let member = interaction.guild.members.cache.find(x => x.id === memberId);
        if (member) {
            return member;
        }
    }
    return null;
}

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
    let default_replacements: StringReplacements = {
        "now": moment().format(`DD.MMMM YYYY hh:mm:ss`),
        "mem_usage": `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
    }
    for (const [key, value] of Object.entries({ ...default_replacements, ...replacements })) {
        str = str.replace(`\${${key}}`, value as string);
    }
    return str;
}