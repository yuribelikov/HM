/*global log*/

/**
 * @constructor
 */
function ChartPanel()
{
}

/**
 * @this {ChartPanel}
 * @param {HTMLCanvasElement} canvas
 * @param {Array<Array<number>>} data
 */
ChartPanel.prototype.draw = function (canvas, data)
{
  var ctx = canvas.getContext("2d");
  ctx.beginPath();
  ctx.clearRect(0, Dashboard.HEADER_H, canvas.width, canvas.height - Dashboard.HEADER_H);
  ctx.closePath();

  this.drawAxisX(canvas);
  this.drawAxisY(canvas);


};

/**
 * @this {ChartPanel}
 * @param {HTMLCanvasElement} canvas
 */
ChartPanel.prototype.drawAxisX = function (canvas)
{
  var ctx = canvas.getContext("2d");
  ctx.beginPath();

  ctx.lineWidth = 1;
  ctx.strokeStyle = "white";
  var y = canvas.height - 50;
  ctx.moveTo(50, y);
  ctx.lineTo(canvas.width - 100, y);
  ctx.stroke();

  ctx.closePath();
};

/**
 * @this {ChartPanel}
 * @param {HTMLCanvasElement} canvas
 */
ChartPanel.prototype.drawAxisY = function (canvas)
{
  var ctx = canvas.getContext("2d");
  ctx.beginPath();


  ctx.closePath();
};

