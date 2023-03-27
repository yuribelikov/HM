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
  this.sensors.push({x: 0.6, y: 0.17, w: 0.4, h: 0.17, name: "cellar.t", label: "Погреб"});

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
 * @param {Object} data
 */
CurrentValuesPanel.prototype.draw = function (ctx, rect, currentData, data)
{
  let s = Dashboard.SCALE;
  for (let i = 0; i < this.sensors.length; i++)
  {
    const sensor = this.sensors[i];
    const w = sensor.w * rect.w;
    const h = sensor.h * rect.h;
    const m = h < w ? h : w;
    const x = rect.x + sensor.x * rect.w;
    const y = rect.y + sensor.y * rect.h;

    ctx.beginPath();
    ctx.fillStyle = "#000025";
    ctx.fillRect(x, y, w, h);
    const offset = Dashboard.AMAZON * 5 * s;
    let fontSize = Dashboard.AMAZON * m / 8
    ctx.font = fontSize + "pt Calibri";
    ctx.fillStyle = "#00FF00";
    ctx.fillText(sensor.label, x + offset, y + fontSize + offset);
    fontSize = Dashboard.AMAZON * m / 1.6;
    ctx.font = fontSize + "pt Calibri";
    let value = currentData[sensor.name];
    let dy = y + h - offset - fontSize / 20;
    if (!isNaN(value))
    {
      if (sensor.name === "outside.t")
        value = Math.round(value);

      let vf = Math.trunc(value);
      let vd = Math.round(10 * (value - vf));
      ctx.fillStyle = tempColorFromValue(value);
      let dx = vd > 0 ? fontSize / 4 : 0;
      ctx.fillText(vf, x + w / 2 - ctx.measureText(vf).width / 2 - dx, dy);
      if (vd > 0)
      {
        ctx.font = fontSize / 2 + "pt Calibri";
        ctx.fillText('.' + vd, x + w / 2 + ctx.measureText(vf).width - dx * 1.2, dy);
      }

    }
    else
      ctx.fillText("?", x + w / 2 - 20, dy);

    ctx.lineWidth = 2;
    ctx.strokeStyle = "red";
    ctx.rect(x, y, w, h);
    ctx.stroke();
    ctx.closePath();

    let sumV = 0;
    let period = 30;
    if (data.length < period)
      period = data.length;
    for (let j = 1; j <= period; j++)
      sumV += data[data.length - j].sensorsData[sensor.name];

    const diff = value ? (value - (sumV / period)) : 0;
    const k = sensor.name === "outside.t" ? 10 : 1;
    this.drawChange(ctx, {x: x, y: y, w: w, h: h}, diff / k);
  }
};

CurrentValuesPanel.prototype.drawChange = function (ctx, cell, change = 0)
{
  change = Math.round(10 * change) / 10;
  let abs = Math.abs(change);
  if (abs < 0.1)
    return;

  ctx.beginPath();
  ctx.strokeStyle = change > 0 ? "red" : "blue";
  ctx.lineWidth = cell.h / 50;
  let x = cell.x + 0.88 * cell.w;
  let y = cell.y + cell.h / 15;
  let dx = cell.w / 15;
  let dy = cell.h / 20;
  if (change < 0)
  {
    dy *= -1;
    y -= dy;
  }

  const max = Math.round(10 * abs);
  for (let i = 1; i <= (max > 10 ? 10 : max); i++)
  {
    ctx.moveTo(x - dx / 25, y);
    ctx.lineTo(x + dx, y + dy);
    ctx.moveTo(x + dx / 25, y);
    ctx.lineTo(x - dx, y + dy);
    y += cell.h / 25;
  }

  ctx.stroke();
  ctx.closePath();
}