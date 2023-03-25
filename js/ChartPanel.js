/*global log logObj DataRow formatNumber tempColorFromValue LocalStorage*/

/**
 * @constructor
 */
function ChartPanel()
{
  /** @type {Object} */
  this.dataByTime = {};

  /** @type {SensorsDescr} */
  this.sensors = new SensorsDescr();

  /** @type {Object} */
  this.curvesRect = null;

  /** @type {Boolean} */
  this.portrait = false;

  /** @type {Number} */
  this.dataOffset = 0;
  /** @type {Object[]} */
  this.dataOffsetPoints = [];

  /** @type {Object[]} */
  this.sensorsRects = [];

  /** @type {Number[]} */
  this.sensorsStates = [];

  this.init();
}

ChartPanel.MIN_T = -30;
ChartPanel.MAX_T = 110;
ChartPanel.SENSOR_STATE_DISABLED = 1;
ChartPanel.SENSOR_STATE_ENABLED = 2;
ChartPanel.SENSOR_STATE_SELECTED = 3;


/**
 * @this {ChartPanel}
 */
ChartPanel.prototype.init = function ()
{
  for (var key in window.localStorage)
    if (key.indexOf("state.") === 0 && window.localStorage.hasOwnProperty(key))
    {
      try
      {
        var value = JSON.parse(window.localStorage[key]);
        var sensor = key.substring(6);
        this.sensorsStates[sensor] = value;
      } catch (e)
      {
      }
    }
};

/**
 * @this {ChartPanel}
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} rect
 * @param {String[]} dataHeaders
 * @param {DataRow[]} data
 * @param {DataRow} currentRow
 */
ChartPanel.prototype.draw = function (ctx, rect, dataHeaders, data, currentRow)
{
  this.dataByTime = {};
  for (var i = 0; i < data.length; i++)
    this.dataByTime[data[i].timeKey] = data[i];

  var ar = {x: rect.x, y: rect.y, ex: rect.w, ey: rect.h, w: 0, h: 0};    // area rect
  ar.w = ar.ex - ar.x;
  ar.h = ar.ey - ar.y;
  this.portrait = ar.h > ar.w;
  var s = Dashboard.SCALE === 1 ? 1.5 : Dashboard.SCALE;
  var cr = {x: 27 * s, y: ar.y + 20 * s, ex: ar.ex - 140 - s * 30, ey: ar.ey - 25 * s, w: 0, h: 0};    // curves rect
  cr.w = cr.ex - cr.x;
  cr.h = cr.ey - cr.y;
  this.curvesRect = cr;

  var step = cr.h / (ChartPanel.MAX_T - ChartPanel.MIN_T);
  ctx.beginPath();
  ctx.fillStyle = "#250000";
  ctx.fillRect(cr.x, cr.y, cr.w, (ChartPanel.MAX_T - 100) * step);
  ctx.fillStyle = "#000025";
  var h = 0 - ChartPanel.MIN_T * step;
  ctx.fillRect(cr.x, cr.ey - h, cr.w, h);
  ctx.stroke();
  ctx.closePath();

  this.drawAxisX(ctx, cr, s);
  this.drawAxisY(ctx, cr, s);
  this.drawCurves(ctx, cr, s, dataHeaders);
  this.drawSensors(ctx, ar, cr, s, dataHeaders, currentRow);
  this.drawDataOffset(ctx, cr, s);

};

/**
 * @this {ChartPanel}
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} cr
 * @param {Number} s
 */
ChartPanel.prototype.drawAxisX = function (ctx, cr, s)
{
  ctx.beginPath();
  ctx.lineWidth = s / 2;
  ctx.setLineDash([2, 4 * s]);
  ctx.font = 8 * s + "pt Arial";
  ctx.fillStyle = "white";
  ctx.strokeStyle = "white";
  for (var i = 0; i < cr.w; i++)
  {
    var time = new Date();
    time.setMinutes(time.getMinutes() - i);
    if (time.getMinutes() === 0)
    {
      var strTime = formatNumber(time.getHours());
      var x = cr.ex - i - 8 * s;
      ctx.fillText(strTime, x, cr.y - 6 * s);
      ctx.fillText(strTime, x, cr.ey + 18 * s);
      ctx.moveTo(cr.ex - i, cr.y);
      ctx.lineTo(cr.ex - i, cr.ey);
    }
  }

  ctx.stroke();
  ctx.closePath();
};

/**
 * @this {ChartPanel}
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} cr
 * @param {Number} s
 */
ChartPanel.prototype.drawAxisY = function (ctx, cr, s)
{
  ctx.beginPath();
  ctx.lineWidth = s / 2;
  ctx.font = 8 * s + "pt Arial";
  var step = cr.h / (ChartPanel.MAX_T - ChartPanel.MIN_T);
  for (var t = ChartPanel.MIN_T; t <= ChartPanel.MAX_T; t += 10)
  {
    var y = cr.ey - (t - ChartPanel.MIN_T) * step + 4 * s;
    ctx.fillStyle = tempColorFromValue(t);
    ctx.fillText(t, cr.x - ctx.measureText(t).width - 4 * s, y);
    ctx.fillText(t, cr.ex + 2 * s, y);
  }
  ctx.stroke();
  ctx.closePath();

  ctx.beginPath();
  ctx.setLineDash([2, 6 * s]);
  ctx.lineWidth = s / 2;
  ctx.strokeStyle = "white";
  for (t = ChartPanel.MIN_T + 5; t <= ChartPanel.MAX_T; t += 10)
  {
    y = cr.ey - (t - ChartPanel.MIN_T) * step;
    ctx.moveTo(cr.x, y);
    ctx.lineTo(cr.ex, y);
  }
  ctx.stroke();
  ctx.closePath();

  ctx.beginPath();
  ctx.setLineDash([2, 4 * s]);
  ctx.lineWidth = s;
  for (t = ChartPanel.MIN_T; t <= ChartPanel.MAX_T; t += 10)
  {
    y = cr.ey - (t - ChartPanel.MIN_T) * step;
    ctx.moveTo(cr.x, y);
    ctx.lineTo(cr.ex, y);
  }
  ctx.stroke();
  ctx.closePath();
};

/**
 * @this {ChartPanel}
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} cr
 * @param {Number} s
 * @param {String[]} dataHeaders
 */
ChartPanel.prototype.drawCurves = function (ctx, cr, s, dataHeaders)
{
  ctx.setLineDash([]);
  var step = cr.h / (ChartPanel.MAX_T - ChartPanel.MIN_T);
  var dy = cr.ey + ChartPanel.MIN_T * step;
  for (var h = 0; h < this.sensors.styles.length; h++)
  {
    var style = this.sensors.styles[h];
    var sensor = style.sensor;
    if (!dataHeaders.includes(sensor) || this.sensorsStates[sensor] === ChartPanel.SENSOR_STATE_DISABLED)
      continue;

    ctx.beginPath();
    if (style)
      ctx.strokeStyle = style.color;
    else    // default style
      ctx.strokeStyle = "yellow";

    if (this.sensorsStates[sensor] === ChartPanel.SENSOR_STATE_SELECTED)
      ctx.lineWidth = 3 * s;
    else
      ctx.lineWidth = s;

    var prevSensorsData = null;
    for (var i = 0; i < cr.w; i++)
    {
      var time = new Date();
      time.setMinutes(time.getMinutes() - i);
      var timeKey = this.makeTimeKey(time);
      var row = this.dataByTime[timeKey];
      if (!row || !row.sensorsData)
        continue;

      if (prevSensorsData)
      {
        var prevT = prevSensorsData[sensor];
        var t = row.sensorsData[sensor];
        if (prevT && prevT > -50 && prevT < 999 && t && t > -50 && t < 999 && Math.abs(t - prevT) < 10)
        {
          ctx.moveTo(cr.ex - i + 1, dy - prevT * step);
          ctx.lineTo(cr.ex - i, dy - t * step);
        }
      }
      prevSensorsData = row.sensorsData;
    }

    ctx.stroke();
    ctx.closePath();
  }
};

/**
 * @this {ChartPanel}
 * @param {Date} time
 * @return {string}
 */
ChartPanel.prototype.makeTimeKey = function (time)
{
  return time.getFullYear() + "-" + formatNumber(1 + time.getMonth()) + "-" + formatNumber(time.getDate()) + "_" +
    formatNumber(time.getHours()) + ":" + formatNumber(time.getMinutes());
};

/**
 * @this {ChartPanel}
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} ar
 * @param {Object} cr
 * @param {Number} s
 * @param {String[]} dataHeaders
 * @param {DataRow} currentRow
 */
ChartPanel.prototype.drawSensors = function (ctx, ar, cr, s, dataHeaders, currentRow)
{
  var row;
  if (this.dataOffset === 0)
    row = currentRow;
  else
  {
    var time = new Date();
    time.setMinutes(time.getMinutes() - this.dataOffset);
    var timeKey = this.makeTimeKey(time);
    row = this.dataByTime[timeKey];
  }

  if (!row)
    return;

  ctx.beginPath();
  ctx.setLineDash([]);
  var sh = (ar.h - 4 * s) / dataHeaders.length;
  var sensorsRects = [];
  for (var i = 0; i < this.sensors.styles.length; i++)
  {
    var sensor = this.sensors.styles[i].sensor;
    if (!dataHeaders.includes(sensor))
      continue;

    var sensorRect = {id: sensor, x: cr.ex + 25 * s, y: ar.y + 6 * s + i * sh, w: 140, h: sh - 5 * s};
    this.drawSensor(ctx, sensorRect, s, this.sensors.styles[i], row.sensorsData[sensor], this.sensorsStates[sensor]);
    sensorsRects.push(sensorRect);
  }
  ctx.stroke();
  ctx.closePath();
  this.sensorsRects = sensorsRects;
};

/**
 * @this {ChartPanel}
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} sr
 * @param {Number} s
 * @param {Object} style
 * @param {Number} value
 * @param {Number} state
 */
ChartPanel.prototype.drawSensor = function (ctx, sr, s, style, value, state)
{
  if (state === ChartPanel.SENSOR_STATE_SELECTED)
  {
    ctx.fillStyle = "white";
    var border = 3 * s;
    ctx.fillRect(sr.x - border, sr.y - border, sr.w + 2 * border, sr.h + 2 * border);
    ctx.fillStyle = "black";
    ctx.fillRect(sr.x, sr.y, sr.w, sr.h);
  }

  ctx.fillStyle = style ? style.color : "yellow";
  if (!state)
    state = ChartPanel.SENSOR_STATE_ENABLED;

  if (state === ChartPanel.SENSOR_STATE_DISABLED)
    ctx.fillStyle = "#333333";

  ctx.fillRect(sr.x + 1, sr.y + 1, sr.w - 2, sr.h - 2);
  ctx.fillStyle = "black";
  ctx.font = "bold " + (11 * s * (Dashboard.AMAZON ? 2 : 1)) + "pt Arial";
  var x = this.portrait ? sr.x + 5 : sr.x + sr.w - 70;
  ctx.fillText(isNaN(value) ? "?" : value.toFixed(1), x, sr.y + 5 + 12 * s);
  ctx.font = "bold " + (8 * s * (Dashboard.AMAZON ? 2 : 1)) + "pt Arial";
  ctx.fillText(style ? style.label : "???", sr.x + 4, sr.y + sr.h - 6);
  if (state !== ChartPanel.SENSOR_STATE_DISABLED)
    ctx.fillText("x", sr.x + sr.w - 7 - 6 * s, sr.y + 7 + 8 * s);

};

/**
 * @this {ChartPanel}
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} cr
 * @param {Number} s
 */
ChartPanel.prototype.drawDataOffset = function (ctx, cr, s)
{
  if (this.dataOffset === 0)
    return;

  ctx.beginPath();
  ctx.strokeStyle = "yellow";
  ctx.lineWidth = 1;
  var x = cr.ex - this.dataOffset;
  ctx.moveTo(x, cr.y);
  ctx.lineTo(x, cr.ey);
  ctx.stroke();
  ctx.closePath();

  var h = 24 * s;
  for (var i = 0; i <= 1; i++)
  {
    var y = cr.y - 10 * s + i * cr.h;
    ctx.beginPath();
    ctx.fillStyle = "black";
    ctx.fillRect(x - 3 * h / 2, y, 3 * h, h);
    ctx.lineWidth = 2 * s;
    ctx.rect(x - h, y, 2 * h, h);
    ctx.moveTo(x - h, y);
    ctx.lineTo(x - 3 * h / 2, y + h / 2);
    ctx.lineTo(x - h, y + h);
    ctx.moveTo(x + h, y);
    ctx.lineTo(x + 3 * h / 2, y + h / 2);
    ctx.lineTo(x + h, y + h);
    ctx.stroke();
    ctx.closePath();
    this.dataOffsetPoints[2 * i] = {x: x - 3 * h / 2, y: y + h / 2, dir: 1};
    this.dataOffsetPoints[2 * i + 1] = {x: x + 3 * h / 2, y: y + h / 2, dir: -1};

    ctx.beginPath();
    ctx.fillStyle = "yellow";
    ctx.font = "bold " + 13 * s + "pt Arial";
    var time = new Date();
    time.setMinutes(time.getMinutes() - this.dataOffset);
    var strTime = formatNumber(time.getHours()) + ":" + formatNumber(time.getMinutes());
    ctx.fillText(strTime, x - 22 * s, y + h - 6 * s);
    ctx.stroke();
    ctx.closePath();
  }
};

/**
 * @this {ChartPanel}
 * @param {Number} x
 * @param {Number} y
 */
ChartPanel.prototype.click = function (x, y)
{
  var cr = this.curvesRect;
  if (this.dataOffset > 0)    // precise moving
    for (var i = 0; i <= 3; i++)
    {
      var point = this.dataOffsetPoints[i];
      var a = x - point.x;
      var b = y - point.y;
      var dist = Math.sqrt(a * a + b * b);
      if (dist < 20)
      {
        this.dataOffset += point.dir;
        if (this.dataOffset < 0 || this.dataOffset >= cr.w)
          this.dataOffset = 0;
        return;
      }
    }

  if (x >= cr.x && x < cr.ex && y >= cr.y && y < cr.ey)   // click on curves area
  {
    var offset = cr.ex - x;
    if (offset > 0 && offset < cr.w)
      this.dataOffset = offset;
  }
  else if (this.sensorsRects.length > 0 && x >= this.sensorsRects[0].x && x < (this.sensorsRects[0].x + this.sensorsRects[0].w))
  {
    for (i = 0; i < this.sensorsRects.length; i++)
    {
      var sr = this.sensorsRects[i];
      if (y >= sr.y && y < (sr.y + sr.h))
      {
        log("click on: " + sr.id);
        var sensorState = this.sensorsStates[sr.id] ? this.sensorsStates[sr.id] : ChartPanel.SENSOR_STATE_ENABLED;
        if (x > sr.x + sr.w - 16 && y < sr.y + 16)    // enable/disable
          sensorState = (sensorState === ChartPanel.SENSOR_STATE_DISABLED ? ChartPanel.SENSOR_STATE_ENABLED : ChartPanel.SENSOR_STATE_DISABLED);
        else    // select/deselect
          sensorState = (sensorState === ChartPanel.SENSOR_STATE_ENABLED ? ChartPanel.SENSOR_STATE_SELECTED : ChartPanel.SENSOR_STATE_ENABLED);

        log("state: " + sensorState);
        this.sensorsStates[sr.id] = sensorState;
        window.localStorage.setItem("state." + sr.id, JSON.stringify(sensorState));
        break;
      }
    }
  }
  else
    this.dataOffset = 0;
};
