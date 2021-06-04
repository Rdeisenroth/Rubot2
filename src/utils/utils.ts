import * as fs from "fs";
// const utilFiles = fs.readdirSync(`${__dirname}/utils`).filter(file => file.endsWith('.ts') || file.endsWith('.js')).filter(file => file != 'utils.ts' && file != 'utils.js').forEach(util => {
// console.log(util.replace(".js", "").replace(".ts", ""))

// module.exports[util.replace(".js", "").replace(".ts","")] = require(`./${util}`);
// })
import * as errors from "./errors";
import * as general from "./general";
import * as embeds from "./embeds";
export {errors, general, embeds};
// module.exports = { //TODO dynamically read new Util classes
//     errors: require('./errors'),
//     // functions: require('./functions'),
//     // guildvars: require('./guildvars'),
//     // oldranks: require('./oldranks'),
//     // ranks: require('./ranks'),
//     // embeds: require('./embeds'),
//     // activities: require('./activities'),
//     // msgawaiters: require('./msgawaiters'),
// };