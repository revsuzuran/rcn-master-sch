var moment = require('moment-timezone');

function getDateTimeNow() {
   return moment().format('YYYY-MM-DD HH:mm:ss.SSS');
}

module.exports = {
    getDateTimeNow
}