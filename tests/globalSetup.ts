import { MongoMemoryServer } from 'mongodb-memory-server';
import { config } from './testutils';
import { mongoose } from '@typegoose/typegoose';

export = async function globalSetup() {
    if (config.Memory) { // Config to decide if an mongodb-memory-server instance should be used
        // it's needed in global space, because we don't want to create a new instance every test-suite
        const instance = await MongoMemoryServer.create();
        const uri = instance.getUri();
        (global as any).__MONGOINSTANCE = instance;
        process.env.MONGODB_CONNECTION_URL = uri.slice(0, uri.lastIndexOf('/'));
    } else {
        process.env.MONGODB_CONNECTION_URL = `mongodb://${config.IP}:${config.Port}`;
    }

    // The following is to make sure the database is clean before an test starts
    await mongoose.connect(`${process.env.MONGODB_CONNECTION_URL}/${config.Database}`);
    await mongoose.connection.db.dropDatabase();
    await mongoose.disconnect();
};
