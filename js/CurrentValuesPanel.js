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
  this.sensors.push({x: 0, y: 0, w: 0.6, h: 0.34, name: "outside.t", label: "Улица", period: 1});
  this.sensors.push({x: 0.6, y: 0, w: 0.4, h: 0.17, name: "winterGarden.t", label: "Зим. сад", period: 2});
  this.sensors.push({x: 0.6, y: 0.17, w: 0.4, h: 0.17, name: "cellar.t", label: "Погреб", period: 24});

  this.sensors.push({x: 0, y: 0.35, w: 0.5, h: 0.22, name: "inside.t", label: "1й этаж", period: 4});
  this.sensors.push({x: 0.5, y: 0.35, w: 0.5, h: 0.22, name: "secondFloor.t", label: "2й этаж", period: 4});

  this.sensors.push({x: 0, y: 0.58, w: 0.5, h: 0.18, name: "bedroom.t", label: "Спальня", period: 4});
  this.sensors.push({x: 0.5, y: 0.58, w: 0.5, h: 0.18, name: "room.t", label: "Кабинет", period: 4});

  this.sensors.push({x: 0, y: 0.77, w: 0.3, h: 0.1, name: "warmIn.t", label: "Котёл: вход", period: 0.2});
  this.sensors.push({
    x: 0.3,
    y: 0.82,
    w: 0.2,
    h: 0.1,
    name: DataLoader.WARM_DIFF_SENSOR,
    label: "Нагрев на",
    period: 0.1
  });
  this.sensors.push({x: 0, y: 0.87, w: 0.3, h: 0.1, name: "warmOut.t", label: "Выход", period: 0.2});
  this.sensors.push({x: 0.5, y: 0.77, w: 0.5, h: 0.2, name: "warmFloor.t", label: "Тёплый пол", period: 0.2});
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
    const x = rect.x + sensor.x * rect.w;
    const y = rect.y + sensor.y * rect.h;

    ctx.beginPath();
    ctx.fillStyle = "#000025";
    ctx.fillRect(x, y, w, h);
    const offset = 5 * s;
    let fontSize = h / 10
    ctx.font = fontSize + "pt Arial";
    ctx.fillStyle = "#00FF00";
    ctx.fillText(sensor.label, x + offset, y + fontSize + offset);
    fontSize = h / 1.8;
    ctx.font = fontSize + "pt Arial";
    let value = currentData[sensor.name];
    let dy = y + h - offset - fontSize / 20;
    if (!isNaN(value))
    {
      let vf = Math.trunc(value);
      let vd = Math.round(10 * (value - vf));
      ctx.fillStyle = tempColorFromValue(value);
      ctx.fillText(Math.round(value), x + w / 2 - ctx.measureText(vf).width / 2 - 16 * Dashboard.SCALE, dy);
      ctx.font = 12 * Dashboard.SCALE + "pt Arial";
      ctx.fillText(vf + '.' + vd, x + w - ctx.measureText(vf + '.' + vd).width - 10, dy);
    }
    else
      ctx.fillText("?", x + w / 2 - 20, dy);

    ctx.lineWidth = 2;
    ctx.strokeStyle = "red";
    ctx.rect(x, y, w, h);
    ctx.stroke();
    ctx.closePath();

    let sumV = 0;
    let period = 60 * sensor.period;
    if (data.length < period)
      period = data.length;
    for (let j = 1; j <= period; j++)
    {
      let value = data[data.length - j].sensorsData[sensor.name];
      if (!isNaN(value) && value > -50 && value < 200)
        sumV += value;
    }

    value = currentData[sensor.name];
    const diff = value ? (value - (sumV / period)) : 0;
    const k = sensor.name === "outside.t" ? 3 : 1;
    this.drawChange(ctx, {x: x, y: y, w: w, h: h}, diff / k, period);
  }
};

CurrentValuesPanel.prototype.drawChange = function (ctx, cell, change = 0, period)
{
  ctx.font = (12 + 2 * Dashboard.SCALE) + "pt Arial";
  ctx.fillStyle = "#00FF00";
  let x = cell.x + cell.w;
  let y = cell.y + 18 + 3 * Dashboard.SCALE;
  const text = period >= 60 ? (Math.round(period / 60) + 'ч') : (Math.round(period) + 'м');
  ctx.fillText(text, x - ctx.measureText(text).width - 3 * Dashboard.SCALE, y);

  change = Math.round(10 * change) / 10;
  let abs = Math.abs(change);
  if (abs < 0.1)
    return;

  ctx.beginPath();
  ctx.strokeStyle = change > 0 ? "red" : "blue";
  ctx.lineWidth = cell.h / 50;
  x = cell.x + 0.88 * cell.w;
  y = cell.y + 30 + 5 * Dashboard.SCALE;
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