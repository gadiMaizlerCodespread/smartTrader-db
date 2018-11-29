import http from 'http';
import Server from 'server';
import nodeConfigModule from 'node-config-module';

// Set process name
process.title = ['smart trader data database'];



const defaultConf = {};
nodeConfigModule.init(defaultConf, null, ()=>{});
const conf = nodeConfigModule.getConfig();
/**
 * Create HTTP server.
 */
const serverApp = new Server(conf);
const server = http.createServer(serverApp.getServer()).listen(3003);
export default server;
