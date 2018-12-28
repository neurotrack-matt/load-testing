
const path      = require('path');
const { fork }  = require('child_process');
const utils     = require('./utils');
const threads   = Number(utils.getFromArgs('--threads',"1"));

for(count = 0; count < threads; count++) {
    /**
     * Starting up threads thrashes the machien thsi runs on pretty hard
     * the 50ms wait will cause a slightly slow increasing of resources
     * and cause fewer resource issues on the machine this executes from
     * when initializing a large number of threads.
     */
    setTimeout(()=> fork(
        path.join(__dirname, './postman_runner.js'), 
        process.argv
    ), count % 5 === 0 ? 100 : 50);
}