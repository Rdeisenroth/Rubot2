export default class testEnvironment {
    public static monogodbUrl = process.env.MONGODB_CONNECTION_URL!
    public static token = process.env.TOKEN!
    public static logLevel: number = parseInt(process.env.LOG_LEVEL ?? "3")
}