
module.exports.getFromArgs = function(key,defaultValue){
    let keyIndex = process.argv.findIndex( (argvKey) => argvKey.toLowerCase() === key.toLowerCase());
    let value;
    if(keyIndex !== -1) value = process.argv[keyIndex+1];
    return value || defaultValue;
}