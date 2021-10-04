import { BotConfig, BotEvent, Command } from "../../typings";
import { Bot } from "../bot";
// import fs from "../__mocks__/fs";

// jest.mock("discord.js");
jest.mock("fs");
jest.mock("discord.js", () => ({
    ...(jest.requireActual("discord.js")),
    Client: (jest.createMockFromModule("discord.js") as any).Client,
}));
let bot: Bot;
let fakeConfig: BotConfig;
// var clientMock: jest.Mock<Client>;
// const clientMock = (Client as unknown) as jest.Mock<Client>;
beforeEach(() => {
    process.chdir(`${__dirname}/..`);
    jest.clearAllMocks();

    bot = new Bot();
    jest.spyOn(bot, "login");
    jest.spyOn(bot, "on");
    (bot.login as jest.Mock).mockImplementation(async (token) => { return token; });
    (bot.on as jest.Mock).mockImplementation(async (event, listener) => { return bot; });
    fakeConfig = {
        "token": "test-token",
        "prefix": "!",
        "ownerID": "testownerid",
        "version": "v1.0-test",
        "current_season": "17",
        "rlstatsapikey": "rlstatsapikeytest",
        "googlemapsapikey": "googlemapsapikeytest",
        "steamapikey": "steamapikeytest",
        "ballchasingapikey": "ballchasingapikeytest",
        "mysqlhost": "localhost",
        "mysqluser": "root",
        "mysqlpassword": "a Super secure Passwort",
        "main_schema_name": "botdb",
        "mongodb_connection_url": "mongodb://<user>:<password>@<ip>:<port>/<schema>?<options>",
        "verify_secret": "0000000000000000000000",
    };
});

test("start() read Config", async () => {
    await bot.start(fakeConfig);
    expect(bot.login).toHaveBeenCalledWith(fakeConfig.token);
    expect(bot.login).toHaveBeenCalledTimes(1);
    expect(bot.prefix).toBe(fakeConfig.prefix);
    expect(bot.ownerID).toBe(fakeConfig.ownerID);
});

test("start() Command Handling", async () => {
    // Create Mock Command
    const mockCommand1: Command = {
        name: "test1",
        description: "",
        execute: async (client, message, args) => {
            return "i got executed.";
        },
    };
    // Mock the mockCommand
    jest.mock(`${process.cwd()}/commands/mockCommand1.ts`, () => {
        return mockCommand1;
    }, { virtual: true });
    // Mock File for Mock Command
    const mockFiles: { [name: string]: Command } = Object.create(null);
    mockFiles[`${process.cwd()}/commands/mockCommand1.ts`] = mockCommand1;
    // require("fs").__setMockFiles(mockFiles);
    // Begin Tests
    await bot.start(fakeConfig);
    expect(bot.commands.size).toBe(1);
    expect(bot.commands.keys()).toContain("test1");
    expect(bot.commands.get("test1")).toMatchObject(mockCommand1);
    expect(await bot.commands.get("test1")?.execute(bot, undefined, [])).toBe("i got executed.");
});


test("start() Event Handling", async () => {
    // Create every possible event
    const mockEvent1: BotEvent<"ready"> = {
        name: "ready",
        execute: async (client) => {},
    };
    // Mock the mockEvent
    jest.mock(`${process.cwd()}/events/ready.ts`, () => {
        return mockEvent1;
    }, { virtual: true });
    // Mock File for Mock Event
    const mockFiles: { [name: string]: BotEvent<any> } = Object.create(null);
    mockFiles[`${process.cwd()}/events/ready.ts`] = mockEvent1;
    // require("fs").__setMockFiles(mockFiles);
    // Begin Tests
    await bot.start(fakeConfig);
    expect(bot.login).toHaveBeenCalledWith(fakeConfig.token);
    expect(bot.login).toHaveBeenCalledTimes(1);
    expect(bot.on).toHaveBeenCalledTimes(1);
    expect(bot.on).toHaveBeenLastCalledWith("ready", expect.any(Function));
});