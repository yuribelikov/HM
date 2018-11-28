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
 * @param {Object} obj
 */
function logObj(obj)
{
  var text = "{";
  for (var property in obj)
    if (obj.hasOwnProperty(property))
      text += (property + "=" + obj[property] + ", ");

  log(text.slice(0, -2) + "}");
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

/**
 * @param {number} value
 * @return {string}
 */
function colorFromValue(value)       // <0 is white, 0-1 is yellow to red, >1 - red
{
  if (value > 1)
    value = 1;

  var r = 255;
  var g = (value < 0 ? 255 : 255 - 255 * value);
  var b = (value < 0 ? 255 : 0);

  return "rgb(" + Math.floor(r) + "," + Math.floor(g) + "," + Math.floor(b) + ")";    // "rgb(155, 102, 102)"
}

/**
 * @param {number} time
 * @param {boolean=} withDate
 * @return {string}
 */
function formatTime(time, withDate)
{
  var date = new Date();
  date.setTime(time);
  var d = (withDate ? date.getFullYear() + "-" + formatNumber(1 + date.getMonth()) + "-" + formatNumber(date.getDate()) + "  " : "");
  return d + formatNumber(date.getHours()) + ":" + formatNumber(date.getMinutes()) + ":" + formatNumber(date.getSeconds());
}

/**
 * @param {number} num
 * @return {string}
 */
function formatNumber(num)
{
  return num < 10 ? "0" + num : "" + num;
}

/**
 * @param {number} t
 * @return {string}
 */
function tempColorFromValue(t)
{
  var c = "CCCCCC";
  if (t >= 80)
    c = "FF0000";
  else if (t >= 60)
    c = "FF6600";
  else if (t >= 40)
    c = "FFBB00";
  else if (t >= 30)
    c = "FFFF00";
  else if (t <= 0)
    c = "6666FF";
  else if (t <= 5)
    c = "9999FF";
  else if (t <= 10)
    c = "CCCCFF";

  return "#" + c;
}