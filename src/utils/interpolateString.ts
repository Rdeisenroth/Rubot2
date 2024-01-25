import { StringReplacements } from "src/types/StringReplacements";
import moment from "moment";

/**
 * Replaces placeholders in a String with dynamic values
 * 
 * Default variables:
 * 
 *     'now':       System Time
 *     'mem_usage': Memory Usage
 * @param str The String to interpolate
 * @param replacements Additional Replace values, you can also overwrite the default ones by using the same name.
 * @returns The interpolated String
 */
export function interpolateString(str: string, replacements?: StringReplacements): string {
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
