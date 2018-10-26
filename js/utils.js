/*exported log*/

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
