/*global log tempColorFromValue*/

/**
 * @constructor
 */
function CurrentValuesPanel()
{
  /** @type {Object[]} */
  this.sensors = [];

  this.init();
}

/**
 * @this {CurrentValuesPanel}
 */
CurrentValuesPanel.prototype.init = function ()
{
  this.sensors.push({x: 0, y: 0, w: 0.6, h: 0.36, name: "warmOut.t", label: "Из печи"});
  this.sensors.push({x: 0.6, y: 0, w: 0.4, h: 0.18, name: "warmFloor.t", label: "Пол в ванной"});
  this.sensors.push({x: 0.6, y: 0.18, w: 0.4, h: 0.18, name: "warmIn.t", label: "В печь"});
  this.sensors.push({x: 0, y: 0.36, w: 0.5, h: 0.24, name: "inside.t", label: "Гостиная"});
  this.sensors.push({x: 0.5, y: 0.36, w: 0.5, h: 0.24, name: "outside.t", label: "Улица"});
  this.sensors.push({x: 0, y: 0.6, w: 0.5, h: 0.18, name: "room.t", label: "Кабинет"});
  this.sensors.push({x: 0.5, y: 0.6, w: 0.5, h: 0.18, name: "bedroom.t", label: "Спальня"});
  this.sensors.push({x: 0, y: 0.78, w: 0.5, h: 0.2, name: "winterGarden.t", label: "Зим. сад"});
  this.sensors.push({x: 0.5, y: 0.78, w: 0.5, h: 0.2, name: "secondFloor.t", label: "2й этаж"});

};

/**
 * @this {CurrentValuesPanel}
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} rect
 * @param {Object} currentData
 */
CurrentValuesPanel.prototype.draw = function (ctx, rect, currentData)
{
  ctx.beginPath();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "red";
  var s = window.devicePixelRatio;
  for (var i = 0; i < this.sensors.length; i++)
  {
    var sensor = this.sensors[i];
    var w = sensor.w * rect.w;
    var h = sensor.h * rect.h;
    var m = h < w ? h : w;
    var x = rect.x + sensor.x * rect.w;
    var y = rect.y + sensor.y * rect.h;
    ctx.fillStyle = "#000025";
    ctx.fillRect(x, y, w, h);
    var offset = 7 * s;
    var fontSize = m / 7;
    ctx.font = fontSize + "pt Calibri";
    ctx.fillStyle = "#00FF00";
    ctx.fillText(sensor.label, x + offset, y + fontSize + offset / 2);
    fontSize = m / 1.6;
    ctx.font = fontSize + "pt Calibri";
    var value = currentData[sensor.name];
    if (!isNaN(value))
      ctx.fillStyle = tempColorFromValue(value);
    var text = isNaN(value) ? "?" : value.toFixed();
    ctx.fillText(text, x + w / 2 - ctx.measureText(text).width / 2, y + h - 1.5 * offset);
    ctx.rect(x, y, w, h);
  }

  ctx.stroke();
  ctx.closePath();
};
