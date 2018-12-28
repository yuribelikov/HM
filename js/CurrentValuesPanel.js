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
  this.sensors.push({x: 0, y: 0, w: 0.5, h: 0.3, name: "warmOut.t", label: "Из печи"});
  this.sensors.push({x: 0.5, y: 0, w: 0.5, h: 0.15, name: "warmFloor.t", label: "Пол в ванной"});
  this.sensors.push({x: 0.5, y: 0.15, w: 0.5, h: 0.15, name: "warmIn.t", label: "В печь"});
  this.sensors.push({x: 0, y: 0.3, w: 0.5, h: 0.2, name: "inside.t", label: "Гостиная"});
  this.sensors.push({x: 0.5, y: 0.3, w: 0.5, h: 0.2, name: "outside.t", label: "Улица"});
  this.sensors.push({x: 0, y: 0.5, w: 0.5, h: 0.2, name: "room.t", label: "Кабинет"});
  this.sensors.push({x: 0.5, y: 0.5, w: 0.5, h: 0.2, name: "bedroom.t", label: "Спальня"});
  this.sensors.push({x: 0, y: 0.7, w: 0.5, h: 0.2, name: "winterGarden.t", label: "Зим. сад"});
  this.sensors.push({x: 0.5, y: 0.7, w: 0.5, h: 0.2, name: "secondFloor.t", label: "2й этаж"});

};

/**
 * @this {CurrentValuesPanel}
 * @param {HTMLCanvasElement} canvas
 * @param {Object} currentData
 */
CurrentValuesPanel.prototype.draw = function (canvas, currentData)
{
  var ctx = canvas.getContext("2d");
  ctx.beginPath();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "red";
  var s = window.devicePixelRatio;
  for (var i = 0; i < this.sensors.length; i++)
  {
    var sensor = this.sensors[i];
    var w = sensor.w * canvas.width;
    var h = sensor.h * canvas.height;
    var x = sensor.x * canvas.width;
    var y = Dashboard.HEADER_H + sensor.y * canvas.height;
    ctx.fillStyle = "#000025";
    ctx.fillRect(x, y, w, h);
    var offset = 7 * s;
    var fontSize = h / 6;
    ctx.font = fontSize + "pt Calibri";
    ctx.fillStyle = "#00FF00";
    ctx.fillText(sensor.label, x + offset, y + fontSize + offset / 2);
    fontSize = h / 1.6;
    ctx.font = fontSize + "pt Calibri";
    var value = currentData[sensor.name];
    if (sensor.name === "outside.t")
    {
      var inside = currentData["inside.t"];
      if (value && inside && value < inside)
        value -= (inside - value) / 10;
    }
    if (value)
      ctx.fillStyle = tempColorFromValue(value);
    var text = value ? value.toFixed() : "?";
    ctx.fillText(text, x + w / 2 - ctx.measureText(text).width / 2, y + h - offset);
    ctx.rect(x, y, w, h);
  }

  ctx.stroke();
  ctx.closePath();
};
