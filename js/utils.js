/*exported log parseDateTime parseNumber*/

function pad(num, size)
{
  return ("000000000" + num).substr(-size);
}

/**
 * @param {String} text
 */
function log(text)
{
  var d = new Date();
  var time = pad(d.getHours(), 2) + ":" + pad(d.getMinutes(), 2) + ":" + pad(d.getSeconds(), 2) + "." + pad(d.getMilliseconds(), 3);
  console.log(time + ": " + text);
}

/**
 * @param {string} dateTime in format "2016-04-04_06:23" OR "2018-11-17 22:02:36,225"
 * @return {number}
 */
function parseDateTime(dateTime)
{
  try
  {
    var d = new Date(dateTime.indexOf("_") !== -1 ? dateTime.replace("_", " ") : dateTime.substring(0, dateTime.indexOf(",")));
    //log(d);
    return d.getTime();
  }
  catch (ignored)
  {
    Number.NaN;
  }
}

/**
 * @param {string} value in format 22.937
 * @return {number}
 */
function parseNumber(value)
{
  try
  {
    //log(Number(value));
    return Number(value);
  }
  catch (ignored)
  {
    return Number.NaN;
  }
}
