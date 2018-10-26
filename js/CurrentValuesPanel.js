/*global log*/

/**
 * @constructor
 */
function CurrentValuesPanel()
{
}

/**
 * @this {CurrentValuesPanel}
 * @param {HTMLCanvasElement} canvas
 * @param {Array<number>} dataRow
 */
CurrentValuesPanel.prototype.draw = function (canvas, dataRow)
{
  var ctx = canvas.getContext("2d");
  ctx.beginPath();

  ctx.clearRect(0, Dashboard.HEADER_H, canvas.width, canvas.height - Dashboard.HEADER_H);
  var x2 = canvas.width / 2;
  var dy = Dashboard.HEADER_H + 420;

  ctx.font = "70pt Calibri";
  ctx.fillStyle = "#00FF00";
  ctx.fillText("Из печи", 30, dy - 340);
  ctx.font = "330pt Calibri";
  this.printTemp(ctx, "warmOut.t", 30, dy + 20, dataRow);

  ctx.font = "46pt Calibri";
  ctx.fillStyle = "#00FF00";
  ctx.fillText("Пол в", x2 + 90, dy - 350);
  ctx.fillText("ванной", x2 + 90, dy - 280);
  ctx.font = "120pt Calibri";
  this.printTemp(ctx, "warm.floor.t", x2 + 300, dy - 220, dataRow);

  ctx.font = "60pt Calibri";
  ctx.fillStyle = "#00FF00";
  ctx.fillText("В", x2 + 90, dy - 100);
  ctx.fillText("печь", x2 + 90, dy - 30);
  ctx.font = "160pt Calibri";
  this.printTemp(ctx, "warmIn.t", x2 + 250, dy + 20, dataRow);

  dy += 420;
  ctx.font = "75pt Calibri";
  ctx.fillStyle = "#00FF00";
  ctx.fillText("Гостиная", 30, dy - 270);
  ctx.font = "240pt Calibri";
  this.printTemp(ctx, "inside.t", 40, dy, dataRow);

  ctx.font = "75pt Calibri";
  ctx.fillStyle = "#00FF00";
  ctx.fillText("Улица", x2 + 50, dy - 270);
  ctx.font = "210pt Calibri";
  this.printTemp(ctx, "outside.t", x2 + 40, dy, dataRow);

  dy += 320;
  ctx.font = "60pt Calibri";
  ctx.fillStyle = "#00FF00";
  ctx.fillText("Кабинет", 30, dy - 200);
  ctx.font = "180pt Calibri";
  this.printTemp(ctx, "room.t", 40, dy, dataRow);

  ctx.font = "60pt Calibri";
  ctx.fillStyle = "#00FF00";
  ctx.fillText("Спальня", x2 + 50, dy - 200);
  ctx.font = "180pt Calibri";
  this.printTemp(ctx, "bedroom.t", x2 + 100, dy, dataRow);

  dy += 300;
  ctx.font = "50pt Calibri";
  ctx.fillStyle = "#00FF00";
  ctx.fillText("Зим. сад", 30, dy - 190);
  ctx.font = "160pt Calibri";
  this.printTemp(ctx, "winter.garden.t", 40, dy, dataRow);

  ctx.font = "50pt Calibri";
  ctx.fillStyle = "#00FF00";
  ctx.fillText("2й этаж", x2 + 50, dy - 190);
  ctx.font = "160pt Calibri";
  this.printTemp(ctx, "second.floor.t", x2 + 100, dy, dataRow);


  ctx.lineWidth = 2;
  ctx.strokeStyle = "red";
  ctx.rect(20, Dashboard.HEADER_H - 2, canvas.width, 480);
  ctx.rect(560, Dashboard.HEADER_H - 2, canvas.width - 561, 240);
  ctx.rect(560, Dashboard.HEADER_H - 2, canvas.width - 561, 480);

  ctx.rect(20, Dashboard.HEADER_H - 2 + 480, canvas.width - 20, 401);
  ctx.rect(20, Dashboard.HEADER_H - 2 + 881, canvas.width - 20, 321);
  ctx.rect(20, Dashboard.HEADER_H - 2 + 1202, canvas.width - 20, 281);
  ctx.rect(20, Dashboard.HEADER_H - 2 + 480, 500, 1003);
  ctx.stroke();

  ctx.closePath();
};

/**
 * @this {CurrentValuesPanel}
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} key
 * @param {number} x
 * @param {number} y
 * @param {Object} lastValues
 */
CurrentValuesPanel.prototype.printTemp = function (ctx, key, x, y, lastValues)
{
  var t = lastValues[key];
  if (t)
    ctx.fillStyle = this.tempColorFromValue(t);

  ctx.fillText(t ? t.toFixed() : "?", x, y);
};

/**
 * @this {CurrentValuesPanel}
 * @param {number} t
 * @return {string}
 */
CurrentValuesPanel.prototype.tempColorFromValue = function (t)
{
  var c = "CCCCCC";
  if (t >= 80)
    c = "FF0000";
  else if (t >= 60)
    c = "FF6600";
  else if (t >= 40)
    c = "FFBB00";
  else if (t >= 30)
    c = "FFFF00";
  else if (t <= 0)
    c = "6666FF";
  else if (t <= 5)
    c = "9999FF";
  else if (t <= 10)
    c = "CCCCFF";

  return "#" + c;
};
