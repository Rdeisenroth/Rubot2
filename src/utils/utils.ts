// import * as fs from "fs";
// const utilFiles = fs.readdirSync(`${__dirname}`).filter(file => file.endsWith('.ts') || file.endsWith('.js')).filter(file => file != 'utils.ts' && file != 'utils.js').forEach(util => {
// console.log(util.replace(".js", "").replace(".ts", ""));

// // module.exports[util.replace(".js", "").replace(".ts","")] = import(`./${util}`);
//     this.export * from `./${util}`;
// })
import * as errors from "./errors";
import * as general from "./general";
import * as embeds from "./embeds";
import * as voice from "./voice";
export { errors, general, embeds, voice };
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