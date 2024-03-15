import { Severity, setGlobalOptions } from "@typegoose/typegoose"

// TODO: is this a good idea?
setGlobalOptions({ options: { allowMixed: Severity.ALLOW } });

import { mongoose } from "@typegoose/typegoose";

beforeAll(async () => {
    // put your client connection code here, example with mongoose:
    await mongoose.connect(process.env.MONGODB_CONNECTION_URL!, {});
});

afterAll(async () => {
    // put your client disconnection code here, example with mongodb:
    await mongoose.disconnect();
});