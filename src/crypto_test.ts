import { ConfigHandler } from "./handlers/configHandler";
import * as cryptojs from "crypto-js";
import { InternalRoles } from "./models/bot_roles";
import { parse } from "csv-parse";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";
// Load the .env File
dotenv.config();

/**
 * Encrypts a given Text
 * @param text The Text to encrypt
 * @returns the encrypted Text
 */
export function encryptText(text: string) {
    return cryptojs.AES.encrypt(text, "mbvWKnjLFh4nHbj7Vx79rvp9kcJF9g4C").toString();
}

/**
 * Decrypts a given Text
 * @param text the Text to decrypt
 * @returns the decrypted Text
 */
export function decryptText(text: string) {
    return cryptojs.AES.decrypt(text, ConfigHandler.getInstance().get("verify_secret")).toString(cryptojs.enc.Utf8);
}

/**
 * Generates an encrypted Token-String with the given parameters
 * @param server_id The ID of the Server
 * @param version_id The Token Version
 * @param tu_id The TU ID
 * @param moodle_id The Moodle ID
 * @param internal_role_names The internal role names
 * @returns The generated Token
 */
export function encryptTokenString(server_id: string, version_id: string, tu_id: string, moodle_id: string, internal_role_names: InternalRoles[]): string {
    const token = `${server_id}|${version_id}|${tu_id}|${moodle_id}|${internal_role_names.join(",")}`;
    const crypted_token_string = encryptText(token);
    return crypted_token_string;
}

type Student = {
    id_tu: string;
    id_moodle: string;
    first_access: Date;
    name: string;
};

(() => {
    const csvFilePath = path.resolve(__dirname, "report.csv");

    const headers = ["id_tu", "id_moodle"];

    const fileContent = fs.readFileSync(csvFilePath, { encoding: "utf-8" });

    parse(fileContent, {
        delimiter: ",",
        columns: headers,
    }, (error, result: Student[]) => {
        if (error) {
            console.error(error);
        }
        // {"moodleId":"1","token":"FOP-DiscordV1|guest|1#5630c38fb1ae39b1048e0cf802f4170dba8943f5e13510055357b3cb67a3bac1"}
        const newResult = result.map((student) => {
            const token = encryptTokenString(
                "1078710248086446120",
                "01",
                student.id_tu,
                student.id_moodle,
                [InternalRoles.VERIFIED],
            );
            return {
                moodleId: student.id_moodle,
                token,
            };
        });
        console.log("Result", newResult);
        
        // write result to result.json file
        fs.writeFileSync(path.resolve(__dirname, "result.json"), JSON.stringify(newResult, null, 4));
    });
})();