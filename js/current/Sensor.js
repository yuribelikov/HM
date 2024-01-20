/*global log tempColorFromValue*/

/**
 * @constructor
 */
function Sensor(x, y, w, h, name, label, period)
{
  /** @type {String} */
  this.name = name;
  /** @type {String} */
  this.label = label;
  /** @type {Number} */
  this.x = x;
  /** @type {Number} */
  this.y = y;
  /** @type {Number} */
  this.w = w;
  /** @type {Number} */
  this.h = h;
  /** @type {Number} */
  this.period = period;
  /** @type {TextBox} */
  this.labelBox = new TextBox(0.01, 0.01, 0.7, 0.16, label, "#00FF00", "left");
  /** @type {TextBox} */
  this.largeValueBox = new TextBox(0, 0.3, 0.85, 0.6, "?", "#FFFFFF", "center");
  /** @type {TextBox} */
  this.valueBox = new TextBox(0.82, 0.86, 0.17, 0.1, "?", "#FFFFFF", "right", (Math.round(12 / window.visualViewport.scale)));
}


/**
 * @this {Sensor}
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} panelRect
 * @param {Object} currentData
 * @param {Object} data
 */
Sensor.prototype.draw = function (ctx, panelRect, currentData, data)
{
  const rect = {
    x: panelRect.x + this.x * panelRect.w,
    y: panelRect.y + this.y * panelRect.h,
    w: this.w * panelRect.w,
    h: this.h * panelRect.h
  };

  ctx.beginPath();
  ctx.fillStyle = "#000025";
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "red";
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.stroke();
  ctx.closePath();

  this.labelBox.draw(ctx, rect);

  const value = currentData[this.name];
  if (!isNaN(value))
  {
    this.largeValueBox.text = Math.round(value);
    this.largeValueBox.color = tempColorFromValue(value);
    this.largeValueBox.draw(ctx, rect);
    const whole = Math.trunc(value);
    this.valueBox.text = whole + '.' + Math.abs(Math.round(10 * (value - whole)));
    this.valueBox.color = tempColorFromValue(value);
    this.valueBox.draw(ctx, rect);
  }
  else
  {
    this.largeValueBox.text = "?";
    this.largeValueBox.color = "#BB0000";
    this.largeValueBox.draw(ctx, rect);
  }

  let sumV = 0;
  let period = 60 * this.period;
  if (data.length < period)
    period = data.length;

  for (let j = 1; j <= period; j++)
  {
    let value = data[data.length - j].sensorsData[this.name];
    if (!isNaN(value) && value > -50 && value < 200)
      sumV += value;
  }

  const diff = value ? (value - (sumV / period)) : 0;
  const k = this.name === "outside.t" ? 3 : 1;
  this.drawChange(ctx, rect, diff / k, period);
};

Sensor.prototype.drawChange = function (ctx, cell, change = 0, period)
{
  ctx.font = (8 + 6 * Dashboard.SCALE) + "pt Arial";
  ctx.fillStyle = "#00FF00";
  let x = cell.x + cell.w;
  let y = cell.y + 18 + 3 * Dashboard.SCALE;
  const text = period >= 60 ? (Math.round(period / 60) + 'ч') : (Math.round(period) + 'м');
  ctx.fillText(text, x - ctx.measureText(text).width - 2 - Dashboard.SCALE, y);

  change = Math.round(10 * change) / 10;
  let abs = Math.abs(change);
  if (abs < 0.1)
    return;

  ctx.beginPath();
  ctx.strokeStyle = change > 0 ? "red" : "blue";
  ctx.lineWidth = cell.h / 80;
  x = cell.x + 0.92 * cell.w;
  y = cell.y + 30 + 5 * Dashboard.SCALE;
  let dx = cell.w / 20;
  let dy = cell.h / 30;

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
