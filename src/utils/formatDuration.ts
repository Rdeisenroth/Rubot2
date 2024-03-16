/**
 * Formats a duration in milliseconds into a string representation.
 * The format is "Xh Ym Zs", where X represents hours, Y represents minutes, and Z represents seconds.
 * 
 * @param duration - The duration in milliseconds to format.
 * @returns A string representation of the formatted duration.
 */
export function formatDuration(duration: number): string {
    duration = duration / 1000;
    const days = Math.floor(duration / 86400);
    const hours = Math.floor((duration % 86400) / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;

    const parts = [];

    if (days > 1) {
        parts.push(`${days}d`);
    }

    parts.push(`${hours}h`);
    parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);

    return parts.join(' ');
}