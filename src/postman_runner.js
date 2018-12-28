const fs     = require('fs');
const path   = require('path'); // ensures that the path is consistent, regardless of where the script is run from
const async  = require('async'); // https://npmjs.org/pacakge/async
const newman = require('newman'); // change to require('newman'), if using outside this repository
const utils  = require('./utils');
const start  = Date.now();

function doTest(finished){
    return newman.run(options,finished)
        .on('start', ()=> process.stdout.write('>'))
        .on('done', ()=> process.stdout.write('<'))
}

function getExecution(result,cursorId){
    return result.run.executions.find(execution => execution.cursor.ref === cursorId);
}

/**
 * The
 *
 * @param {?Error} err - An Error instance / null that determines whether or not the parallel collection run
 * succeeded.
 * @param {Array} result - An array of collection run summary objects.
 */
function done(err, results) {
    if(err) console.error(err);
    else {
        let stats = {
            runCount: results.length,
            timings:  [],
            failures: []
        }
        results.forEach((result) => {
            stats.timings.push({
                average: `${Math.floor(result.run.timings.responseAverage)}ms`,
                total: `${result.run.timings.completed - result.run.timings.started}ms`
            });
            stats.failures = stats.failures.concat(result.run.failures.map( failure => { 
                const execution = getExecution(result,failure.cursor.ref);
                return {
                    on: execution.item.name,
                    reason: failure.error.message,
                    responseBody: execution.response && execution.response.stream ? execution.response.stream.toString('utf8').substring(0,255) : null
                }
            }));
        });
        if(utils.getFromArgs('--detailed',false)) console.log(`${process.pid}: Results (${Date.now()-start}ms)`,stats);
        else {
            console.log(`${process.pid}: (${Date.now()-start}ms) failures: ${stats.failures.length}`);
            if(stats.failures.length !== 0) console.log(`${process.pid}:`,stats.failures);
        }
    }
};

const countToRun    = Number(utils.getFromArgs('--procs', 1));
const interations   = Number(utils.getFromArgs('--iterations',1));
const environment   = utils.getFromArgs('--env','qa');
const scriptToRun   = utils.getFromArgs('--script','video_upload.postman_collection.json');
const dataFilePath  = path.join(__dirname, '../', 'data', scriptToRun.replace('postman_collection','data'));
const paralleleRuns = new Array(countToRun).fill(doTest);
let   globalData    = null;

/*
 * If a data file exists for the script, load it.
 */
if(fs.existsSync(dataFilePath)) {
    globalData = JSON.parse(fs.readFileSync(dataFilePath).toString('utf8'));

    /*
    * For ecah value of type 'file' resolve the file definition
    * and update the type to 'text'.
    */
    globalData.values = globalData.values
        .map( value => {
            if(value.type === 'file') {
                const filePath = path.join(__dirname, '../', value.value);
                value.value = filePath;
                value.type  = 'text';
            }
            return value;
        })
}

/**
 * A set of collection run options for the paralle collection runs. For demonstrative purposes in this script, an
 * identical set of options has been used. However, different options can be used, so as to actually run different
 * collections, with their corresponding run options in parallel.
 *
 * @type {Object}
 */
const options = {
    bail: true,
    iterationCount: interations,
    collection: path.join(__dirname, '../', 'postman_scripts', scriptToRun),
    environment: path.join(__dirname, '../', 'envs', `${environment}.json`),
    globals: globalData
};

console.log(`${process.pid}: Executing ${paralleleRuns.length} paralelle runs of ${scriptToRun} against ${environment}, ${interations} times for each run.`);

async.parallel(paralleleRuns,done);