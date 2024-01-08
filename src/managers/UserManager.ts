import { Application } from "@application";
import { delay, inject, injectable, singleton } from "tsyringe";
import { User as DiscordUser } from "discord.js";
import { DocumentType } from "@typegoose/typegoose";
import { User, UserModel } from "@models/User";

@injectable()
@singleton()
export default class UserManager {
    protected app: Application;
    
    constructor(@inject(delay(() => Application)) app: Application) {
        this.app = app;
    }

    public async getUser(user: DiscordUser): Promise<DocumentType<User>> {
        var userModel = await UserModel.findById(user.id);
        if (!userModel) {
            this.app.logger.debug(`User "${user.tag}" (id: ${user.id}) does not exist. Creating...`)
            return await this.getDefaultUser(user);
        }
        this.app.logger.debug(`User "${user.tag}" (id: ${user.id}) already exists.`)
        return userModel;
    }

    public async getDefaultUser(user: DiscordUser): Promise<DocumentType<User>> {
        const newUser = new UserModel({
            _id: user.id,
        });
        await newUser.save();
        this.app.logger.info(`Created new User "${user.tag}" (id: ${user.id})`);
        return newUser;
    }
}