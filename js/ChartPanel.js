/*global log logObj formatNumber*/

/**
 * @constructor
 */
function ChartPanel()
{
}

/**
 * @this {ChartPanel}
 * @param {HTMLCanvasElement} canvas
 * @param {DataRow[]} data
 */
ChartPanel.prototype.draw = function (canvas, data)
{
  var ar = {x: 0, y: Dashboard.HEADER_H, ex: canvas.width, ey: canvas.height, w: 0, h: 0};    // area rect
  ar.w = ar.ex - ar.x;
  ar.h = ar.ey - ar.y;
  var cr = {x: 40, y: ar.y + 20, ex: ar.ex - 150, ey: ar.ey - 30, w: 0, h: 0};    // curves rect
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

  this.drawAxisX(canvas, cr);
  this.drawAxisY(canvas, cr);
  this.drawCurves(canvas, cr, data);

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
  ctx.lineWidth = 1;
  ctx.strokeStyle = "white";
  ctx.setLineDash([]);
  ctx.font = "12pt Calibri";
  ctx.fillStyle = "white";
  ctx.setLineDash([1, 8]);
  for (var i = 0; i < cr.w; i++)
  {
    var time = new Date();
    time.setMinutes(time.getMinutes() - i);
    if (time.getMinutes() === 0)
    {
      var strDate = formatNumber(time.getHours()) + ":" + formatNumber(time.getMinutes());
      ctx.fillText(strDate, cr.ex - i - 20, cr.ey + 15);
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
  ctx.lineWidth = 1;
  ctx.strokeStyle = "white";
  ctx.font = "12pt Calibri";
  ctx.fillStyle = "white";
  ctx.setLineDash([1, 8]);
  var minT = -30;
  var maxT = 110;
  var step = cr.h / (maxT - minT);
  for (var t = minT; t <= maxT; t += 10)
  {
    ctx.beginPath();
    var y = cr.ey - (t - minT) * step;
    ctx.fillText("" + t, cr.x - 30, y + 4);
    if (t === 0 || t === 100)
      ctx.setLineDash([1, 2]);
    else
      ctx.setLineDash([1, 8]);
    ctx.moveTo(cr.x, y);
    ctx.lineTo(cr.ex, y);
    ctx.stroke();
    ctx.closePath();
  }

};

/**
 * @this {ChartPanel}
 * @param {HTMLCanvasElement} canvas
 * @param {Object} cr
 * @param {DataRow[]} data
 */
ChartPanel.prototype.drawCurves = function (canvas, cr, data)
{
  var ctx = canvas.getContext("2d");
  ctx.lineWidth = 1;
  ctx.strokeStyle = "white";
  ctx.font = "12pt Calibri";
  ctx.fillStyle = "white";
  ctx.setLineDash([1, 8]);
  var minT = -30;
  var maxT = 110;
  var step = cr.h / (maxT - minT);


};
