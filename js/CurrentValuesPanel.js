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
  this.sensors.push({x: 0, y: 0, w: 0.6, h: 0.34, name: "outside.t", label: "Улица"});
  this.sensors.push({x: 0.6, y: 0, w: 0.4, h: 0.17, name: "winterGarden.t", label: "Зим. сад"});
  this.sensors.push({x: 0.6, y: 0.17, w: 0.4, h: 0.17, name: "underFloor.t", label: "Подпол"});

  this.sensors.push({x: 0, y: 0.35, w: 0.5, h: 0.22, name: "inside.t", label: "1й этаж"});
  this.sensors.push({x: 0.5, y: 0.35, w: 0.5, h: 0.22, name: "secondFloor.t", label: "2й этаж"});

  this.sensors.push({x: 0, y: 0.58, w: 0.5, h: 0.18, name: "bedroom.t", label: "Спальня"});
  this.sensors.push({x: 0.5, y: 0.58, w: 0.5, h: 0.18, name: "room.t", label: "Кабинет"});

  this.sensors.push({x: 0, y: 0.77, w: 0.3, h: 0.1, name: "warmIn.t", label: "Котёл: вход"});
  this.sensors.push({x: 0.3, y: 0.82, w: 0.2, h: 0.1, name: DataLoader.WARM_DIFF_SENSOR, label: "Нагрев на"});
  this.sensors.push({x: 0, y: 0.87, w: 0.3, h: 0.1, name: "warmOut.t", label: "Выход"});
  this.sensors.push({x: 0.5, y: 0.77, w: 0.5, h: 0.2, name: "warmFloor.t", label: "Тёплый пол"});
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
  var s = Dashboard.SCALE;
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
    var offset = 5 * s;
    var fontSize = (m / 8) * 3;//(Dashboard.AMAZON ? 2 : 1);
    ctx.font = fontSize + "pt Calibri";
    ctx.fillStyle = "#00FF00";
    ctx.fillText(sensor.label, x + offset, y + fontSize + offset);
    fontSize = (m / 1.6) * 3;//(Dashboard.AMAZON ? 2 : 1);
    ctx.font = fontSize + "pt Calibri";
    var value = currentData[sensor.name];
    let dy = y + h - offset - fontSize / 20;
    if (!isNaN(value))
    {
      if (sensor.name === "outside.t")
        value = Math.round(value);

      var vf = Math.trunc(value);
      var vd = Math.round(10 * (value - vf));
      ctx.fillStyle = tempColorFromValue(value);
      var dx = vd > 0 ? fontSize / 4 : 0;
      ctx.fillText(vf, x + w / 2 - ctx.measureText(vf).width / 2 - dx, dy);
      if (vd > 0)
      {
        ctx.font = fontSize / 2 + "pt Calibri";
        ctx.fillText('.' + vd, x + w / 2 + ctx.measureText(vf).width - dx * 1.2, dy);
      }
    }
    else
      ctx.fillText("?", x + w / 2 - 20, dy);
    ctx.rect(x, y, w, h);
  }

  ctx.stroke();
  ctx.closePath();
};
