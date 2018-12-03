/*global log logObj DataRow formatNumber tempColorFromValue*/

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
  this.areaRect = null;
  /** @type {Object} */
  this.curvesRect = null;

  /** @type {Number} */
  this.dataOffset = 0;

  /** @type {Object[]} */
  this.sensorsRects = [];

  /** @type {Number[]} */
  this.sensorsStates = [];

}

ChartPanel.MIN_T = -30;
ChartPanel.MAX_T = 110;
ChartPanel.SENSOR_STATE_DISABLED = 1;
ChartPanel.SENSOR_STATE_ENABLED = 2;
ChartPanel.SENSOR_STATE_SELECTED = 3;


/**
 * @this {ChartPanel}
 * @param {HTMLCanvasElement} canvas
 * @param {String[]} dataHeaders
 * @param {DataRow[]} data
 * @param {DataRow} currentRow
 */
ChartPanel.prototype.draw = function (canvas, dataHeaders, data, currentRow)
{
  var ar = {x: 0, y: Dashboard.HEADER_H, ex: canvas.width, ey: canvas.height, w: 0, h: 0};    // area rect
  ar.w = ar.ex - ar.x;
  ar.h = ar.ey - ar.y;
  this.areaRect = ar;

  var cr = {x: 40, y: ar.y + 20, ex: ar.ex - 180, ey: ar.ey - 30, w: 0, h: 0};    // curves rect
  cr.w = cr.ex - cr.x;
  cr.h = cr.ey - cr.y;
  this.curvesRect = cr;

  this.dataByTime = {};
  for (var i = 0; i < data.length; i++)
    this.dataByTime[data[i].timeKey] = data[i];

  var ctx = canvas.getContext("2d");
  ctx.beginPath();
  ctx.lineWidth = 2;
  // ctx.strokeStyle = "cyan";
  // ctx.rect(ar.x + 1, ar.y, ar.w - 1, ar.h);
  // ctx.strokeStyle = "green";
  // ctx.rect(cr.x, cr.y, cr.w, cr.h);
  ctx.stroke();
  ctx.closePath();

  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  ctx.font = "14pt Arial";
  ctx.fillStyle = "white";
  this.drawAxisX(canvas, cr);
  this.drawAxisY(canvas, cr);
  this.drawCurves(canvas, cr, dataHeaders);
  this.drawSensors(canvas, cr, dataHeaders, currentRow);
  this.drawDataOffset(ctx, cr);

};

/**
 * @this {ChartPanel}
 * @param {HTMLCanvasElement} canvas
 * @param {Object} cr
 */
ChartPanel.prototype.drawAxisX = function (canvas, cr)
{
  var ctx = canvas.getContext("2d");
  ctx.beginPath();
  ctx.setLineDash([2, 10]);
  ctx.strokeStyle = "white";
  for (var i = 0; i < cr.w; i++)
  {
    var time = new Date();
    time.setMinutes(time.getMinutes() - i);
    if (time.getMinutes() === 0)
    {
      var strTime = formatNumber(time.getHours()) + ":" + formatNumber(time.getMinutes());
      var x = cr.ex - i - 20;
      ctx.fillText(strTime, x, cr.y - 4);
      ctx.fillText(strTime, x, cr.ey + 24);
      ctx.moveTo(cr.ex - i, cr.y);
      ctx.lineTo(cr.ex - i, cr.ey);
    }
  }

  ctx.stroke();
  ctx.closePath();
};

/**
 * @this {ChartPanel}
 * @param {HTMLCanvasElement} canvas
 * @param {Object} cr
 */
ChartPanel.prototype.drawAxisY = function (canvas, cr)
{
  var ctx = canvas.getContext("2d");
  ctx.beginPath();
  var step = cr.h / (ChartPanel.MAX_T - ChartPanel.MIN_T);
  for (var t = ChartPanel.MIN_T; t <= ChartPanel.MAX_T; t += 10)
  {
    var y = cr.ey - (t - ChartPanel.MIN_T) * step + 5;
    ctx.fillStyle = tempColorFromValue(t);
    ctx.fillText(t, cr.x - 34, y);
    ctx.fillText(t, cr.ex + 8, y);
  }
  ctx.stroke();
  ctx.closePath();

  ctx.beginPath();
  ctx.setLineDash([1, 15]);
  ctx.lineWidth = 1;
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
  ctx.setLineDash([2, 10]);
  ctx.lineWidth = 2;
  for (t = ChartPanel.MIN_T; t <= ChartPanel.MAX_T; t += 10)
  {
    y = cr.ey - (t - ChartPanel.MIN_T) * step;
    ctx.moveTo(cr.x, y);
    ctx.lineTo(cr.ex, y);
  }
  ctx.stroke();
  ctx.closePath();

  ctx.beginPath();
  ctx.setLineDash([6, 2]);
  ctx.strokeStyle = "#8080FF";
  y = cr.ey - (0 - ChartPanel.MIN_T) * step;
  ctx.moveTo(cr.x, y);
  ctx.lineTo(cr.ex, y);
  ctx.stroke();
  ctx.closePath();

  ctx.beginPath();
  ctx.strokeStyle = "red";
  y = cr.ey - (100 - ChartPanel.MIN_T) * step;
  ctx.moveTo(cr.x, y);
  ctx.lineTo(cr.ex, y);
  ctx.stroke();
  ctx.closePath();
};

/**
 * @this {ChartPanel}
 * @param {HTMLCanvasElement} canvas
 * @param {Object} cr
 * @param {String[]} dataHeaders
 */
ChartPanel.prototype.drawCurves = function (canvas, cr, dataHeaders)
{
  var ctx = canvas.getContext("2d");
  ctx.setLineDash([]);
  var step = cr.h / (ChartPanel.MAX_T - ChartPanel.MIN_T);
  var dy = cr.ey + ChartPanel.MIN_T * step;
  for (var h = 0; h < dataHeaders.length; h++)
  {
    var sensor = dataHeaders[h];
    ctx.beginPath();
    var style = this.sensors.styles[sensor];
    if (style)
    {
      ctx.strokeStyle = style.color;
      ctx.lineWidth = style.width;
    }
    else    // default style
    {
      ctx.strokeStyle = "yellow";
      ctx.lineWidth = 1;
    }
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
 * @param {HTMLCanvasElement} canvas
 * @param {Object} cr
 * @param {String[]} dataHeaders
 * @param {DataRow} currentRow
 */
ChartPanel.prototype.drawSensors = function (canvas, cr, dataHeaders, currentRow)
{
  var row = null;
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

  var ctx = canvas.getContext("2d");
  ctx.beginPath();
  ctx.setLineDash([]);
  var sh = cr.h / dataHeaders.length;
  var sensorsRects = [];
  for (var h = 0; h < dataHeaders.length; h++)
  {
    var sensor = dataHeaders[h];
    var sensorRect = {id: sensor, x: cr.ex + 50, y: cr.y + h * sh, w: 120, h: sh - 20};
    this.drawSensor(ctx, sensorRect, this.sensors.styles[sensor], row.sensorsData[sensor], this.sensorsStates[sensor]);
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
 * @param {Object} style
 * @param {Number} value
 * @param {Number} state
 */
ChartPanel.prototype.drawSensor = function (ctx, sr, style, value, state)
{
  ctx.fillStyle = style ? style.color : "yellow";
  if (!state)
    state = ChartPanel.SENSOR_STATE_ENABLED;

  if (state === ChartPanel.SENSOR_STATE_DISABLED)
    ctx.fillStyle = "#444444";
  ctx.fillRect(sr.x, sr.y, sr.w, sr.h);
  ctx.stroke();
  ctx.fillStyle = "black";
  ctx.font = "14pt Arial";
  ctx.fillText(style ? style.label : "???", sr.x + 5, sr.y + 20);
  ctx.font = "bold 24pt Arial";
  ctx.fillText(value ? value.toFixed(1) : "?", sr.x + 10, sr.y + sr.h - 8);

};

/**
 * @this {ChartPanel}
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} cr
 */
ChartPanel.prototype.drawDataOffset = function (ctx, cr)
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

  for (var i = 0; i <= 1; i++)
  {
    var oy = 6 + cr.y + i * cr.h;
    ctx.beginPath();
    ctx.fillStyle = "black";
    ctx.fillRect(x - 44, oy - 20, 88, 34);
    ctx.lineWidth = 2;
    ctx.rect(x - 40, oy - 18, 80, 30);
    ctx.stroke();
    ctx.closePath();

    ctx.beginPath();
    ctx.fillStyle = "yellow";
    ctx.font = "bold 18pt Arial";
    var time = new Date();
    time.setMinutes(time.getMinutes() - this.dataOffset);
    var strTime = formatNumber(time.getHours()) + ":" + formatNumber(time.getMinutes());
    ctx.fillText(strTime, x - 33, oy + 5);
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
  var ar = this.areaRect;
  var cr = this.curvesRect;

  if (x >= cr.x && x < cr.ex && y >= cr.y && y < cr.ey)   // click on curves area
  {
    var offset = cr.ex - x;
    if (offset > 0 && offset < cr.w)
      this.dataOffset = offset;
  }
  else if (this.sensorsRects.length > 0 && x >= this.sensorsRects[0].x && x < (this.sensorsRects[0].x + this.sensorsRects[0].w))
  {
    for (var i = 0; i < this.sensorsRects.length; i++)
      if (y >= this.sensorsRects[i].y && y < (this.sensorsRects[i].y + this.sensorsRects[i].h))
      {
        log("click on: " + this.sensorsRects[i].id);
        var sensorState = this.sensorsStates[this.sensorsRects[i].id];
        if (sensorState)
        {
          sensorState++;
          if (sensorState > ChartPanel.SENSOR_STATE_SELECTED)
            sensorState = ChartPanel.SENSOR_STATE_DISABLED;
        }
        else
          sensorState = ChartPanel.SENSOR_STATE_SELECTED;

        this.sensorsStates[this.sensorsRects[i].id] = sensorState;
        log("state: " + this.sensorsStates[this.sensorsRects[i].id]);

        break;
      }
  }
  else
    this.dataOffset = 0;
};
