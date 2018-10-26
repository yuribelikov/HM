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

  ctx.lineWidth = 2;
  ctx.strokeStyle = "blue";
  ctx.rect(20, Dashboard.HEADER_H + 20, 100, 100);
  ctx.stroke();

  ctx.closePath();
};

