/*global log parseDateTime*/

/**
 * @constructor
 */
function DataRow(timeKey)
{
  /** @type {String} */
  this.timeKey = timeKey;
  /** @type {Number} */
  this.time = parseDateTime(timeKey);

  /** @type {Object} */
  this.sensorsData = {};      // map<String sensorID, Number value>
}
