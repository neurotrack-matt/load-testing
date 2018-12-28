# Summary
Enables you to run multiple PostMan scripts in paralell, across threads.

# TODO
1. Support for data files.

# Setup
Fairly straight forward to setup this project as it relies on its own folder structure to execute. The below 4 steps are all that are necessary, unless you already have Node.js on your machine and then you can omit step 2.

1. Clone this project to your local machine.
1. Make sure you have [Node.js](https://nodejs.org/en/download/) installed, version 8.1 or later.
1. Open a command window and navigate to the root directory of this project on your local machine.
1. Install dependencies by typing `npm install`

# Constraints
Memory wise, each thread will use about 60-100mb to run. So for 100 threads you will need at minimum 7 gigs of memory available. Initial startup will be very CPU intensive but will taper back drastically once testing initiates, and once all the threads start completing their work.

# Usage
For the simplest example type `npm run example` and it will execute a single instance of the video_upload.postman_collection.json script on 1 thread with 1 process, but detailed output enabled. `npm run script` will be the root command for all other scripts, with arguments passed in to configure the execution to fit your needs. The argumenst are detailed below.

When passing in arguments you must provide two dashes after script `--`, these are in addition to the dashes required below. So if you were trying to execute the script with `--detailed` your command would need to be `npm run script -- --detailed`.

* --detailed, (default 1) output more details when the execution of the script is complete.
* --threads, (default 1) this many individual 'workers' to execute. Each of these execute in isolation from one another.
* --procs, (default 1) defines how many processes to execute within each thread. I dont recommend more than 10 here, as the amount of I/O available to each thread is limited and it will slow the overall load down as it juggles gathering responses and then acting on them. Also, depending on your script, to many Logins with the same account can result in the accoun being blocked and your run being useless.
* --iterations, (default 1) how many times to execute the script within each process.
* --env, (default qa) defines which environment to execute the script against.
* --script, (default video_upload.postman_collection.json) which script to execute. The script must be within the postman_scripts folder. If you want to provide a set of data to feed into this script, it must be within the data folder and have the same name, but with `postman_collection` changed to `data`.

# Adding PostMan Environments
Export from postman, and add to the envs folder. The name before .json will be the value to provide with the --env argument in order to have this environment be picked up.

# Adding PostMan Scripts
Export the script in the v2.1 PostMan format. Place the script in the postman_scripts folder and use the `--script` argument to select the script during execution. If the script has variables within it, that are global, then you must proide an appropriately named file in the data folder. The data file will have the same name as the script, but with `postman_collection` changed to `data`.

# Adding Script Data
There is a specific format for this file is outlined in the below example. You can add as many values as you wish in the values section. This data is expected to be global values, not data being seeded into the test. That is not yet supported by this load-testing runner.
```
{
    "id": "5bfde907-2a1e-8c5a-2246-4aff74b74236",
    "name": "Any Name Here",
    "values": [
        {
            "key": "key_in_script",
            "value": "value to use",
            "type": "text",
            "enabled": true
        }
    ],
    "_postman_variable_scope": "globals"
}
```

# Scripts
### calibration_upload
This script does a single video upload. The idea is to stress the upload process alone, to either produce 502's or to verify they are not happening.

This script will require that you update the calibration_upload.data.json file to have a valid calibration_id and access_token. So you will likely need to start a webview instance of a test and open the developer tools. Grab the access token returned to use as the access_token, its spit directly out in the logs. When you take an exam, and it creates a calibration, grab the ID and use it as calibration_id

### video_upload
Logs in as a Dai-Ichi user, creates a battery, then creates a calibration record and uploads 10 videos to that calibration. This test is much more verbose but Django begins to fall over on the creation of the battery and calibration so the upload process cannot get exercised properly when targeting that behavior. There is no configuration required to run this test.

# Q&A
* What are all the `>` and `<` I see spitting out in the console?
  Each `>` indicates a newman test that has been started. When it completes, it outputs a `<`. Can be used to determine if a test script has gone stale or still working, or if you see a lot of premature endings of your test.
* Will NewMan conitue to run the test when it encounters a failure?
  No, since this is not doing QA on the system and instead being used to exercise load, the first failure encountered in a script with multiple steps will immediately halt the script. This helps keep the reported logs down drastically.
