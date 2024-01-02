import { Severity, setGlobalOptions } from "@typegoose/typegoose"

// TODO: is this a good idea?
setGlobalOptions({ options: { allowMixed: Severity.ALLOW } });

import initiateBot from './Bot'

initiateBot()
