
const helper = require('./helper')

function info(idRekon = "", context) {  
    console.log(`${helper.getDateTimeNow()} [${idRekon}] ${context}`);
}

module.exports = {
    info,
}