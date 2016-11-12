/*exported log*/

function pad(num, size)
{
  return ("000000000" + num).substr(-size);
}

/**
 * @param {...*} var_args
 */
function log(var_args) // jshint ignore:line
{
  var d = new Date();
  var time = pad(d.getHours(), 2) + ":" + pad(d.getMinutes(), 2) + ":" + pad(d.getSeconds(), 2) + "." + pad(d.getMilliseconds(), 3);

  var args = Array.prototype.slice.call(arguments);
  args.unshift(time);
  if (window.navigator["vendor"] === "Google Inc.")
    console.trace.apply(console, args);
  else if (console.log && console.log.apply)
    console.log.apply(console, args);
  else
    console.log(args.join(' '));
}
