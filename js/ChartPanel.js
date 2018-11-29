/*global log logObj DataRow formatNumber tempColorFromValue*/

/**
 * @constructor
 */
function ChartPanel()
{
  /** @type {SensorsDescr} */
  this.sensors = new SensorsDescr();
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
 */
ChartPanel.prototype.draw = function (canvas, dataHeaders, data)
{
  var ar = {x: 0, y: Dashboard.HEADER_H, ex: canvas.width, ey: canvas.height, w: 0, h: 0};    // area rect
  ar.w = ar.ex - ar.x;
  ar.h = ar.ey - ar.y;
  var cr = {x: 40, y: ar.y + 20, ex: ar.ex - 180, ey: ar.ey - 30, w: 0, h: 0};    // curves rect
  cr.w = cr.ex - cr.x;
  cr.h = cr.ey - cr.y;
  // logObj(cr);
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
  this.drawCurves(canvas, cr, dataHeaders, data);
  this.drawSensors(canvas, cr, dataHeaders, data);

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
      var strDate = formatNumber(time.getHours()) + ":" + formatNumber(time.getMinutes());
      var x = cr.ex - i - 20;
      ctx.fillText(strDate, x, cr.y - 4);
      ctx.fillText(strDate, x, cr.ey + 24);
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
  ctx.setLineDash([2, 10]);
  ctx.strokeStyle = "white";
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
 * @param {DataRow[]} data
 */
ChartPanel.prototype.drawCurves = function (canvas, cr, dataHeaders, data)
{
  var dataByTime = {};
  for (var i = 0; i < data.length; i++)
    dataByTime[data[i].timeKey] = data[i];

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
    for (i = 0; i < cr.w; i++)
    {
      var time = new Date();
      time.setMinutes(time.getMinutes() - i);
      var timeKey = this.makeTimeKey(time);
      var row = dataByTime[timeKey];
      if (!row || !row.sensorsData)
        continue;

      if (prevSensorsData)
      {
        var prevT = prevSensorsData[sensor];
        var t = row.sensorsData[sensor];
        if (prevT && prevT > - 50 && prevT < 999 && t && t > -50 && t < 999 && Math.abs(t - prevT) < 20)
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
 * @param {DataRow[]} data
 */
ChartPanel.prototype.drawSensors = function (canvas, cr, dataHeaders, data)
{
  var ctx = canvas.getContext("2d");
  ctx.beginPath();
  ctx.font = "12pt Arial";
  var row = data[data.length - 1];
  var sh = cr.h / dataHeaders.length;
  for (var h = 0; h < dataHeaders.length; h++)
  {
    var sensor = dataHeaders[h];
    this.drawSensor(ctx, cr.ex + 50, cr.y + h * sh, sh - 8, this.sensors.styles[sensor], row.sensorsData[sensor], ChartPanel.SENSOR_STATE_ENABLED);
  }
  ctx.stroke();
  ctx.closePath();
};

/**
 * @this {ChartPanel}
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x
 * @param {Number} y
 * @param {Number} h
 * @param {Object} style
 * @param {Number} value
 * @param {Number} state
 */
ChartPanel.prototype.drawSensor = function (ctx, x, y, h, style, value, state)
{
  ctx.setLineDash([]);
  ctx.fillStyle = style ? style.color : "yellow";
  ctx.fillRect(x, y, 120, h);
  ctx.stroke();
  ctx.fillStyle = "black";
  ctx.fillText(style ? style.label : "???", x + 10, y + h - 10);

};