var moment = require('moment-timezone');

function getDateTimeNow() {
   return moment().format('YYYY-MM-DD HH:mm:ss.SSS');
}

/**
 * Returns a random number between min (inclusive) and max (exclusive)
 */
 function randNum(min = 10000, max = 99999) {  
    return Math.floor(
      Math.random() * (max - min) + min
    )
  }

module.exports = {
    getDateTimeNow,
    randNum
}