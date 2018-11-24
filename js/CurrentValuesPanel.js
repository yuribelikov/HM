/*global log tempColorFromValue*/

/**
 * @constructor
 */
function CurrentValuesPanel()
{
}

/**
 * @this {CurrentValuesPanel}
 * @param {HTMLCanvasElement} canvas
 * @param {Object} currentData
 */
CurrentValuesPanel.prototype.draw = function (canvas, currentData)
{
  var ctx = canvas.getContext("2d");
  ctx.beginPath();

  ctx.fillStyle = "#000020";
  ctx.fillRect(0, Dashboard.HEADER_H, canvas.width, canvas.height - 150);
  var x2 = canvas.width / 2;
  var dy = Dashboard.HEADER_H + 420;

  ctx.font = "70pt Calibri";
  ctx.fillStyle = "#00FF00";
  ctx.fillText("Из печи", 30, dy - 340);
  ctx.font = "330pt Calibri";
  this.printTemp(ctx, "warmOut.t", 30, dy + 20, currentData);

  ctx.font = "46pt Calibri";
  ctx.fillStyle = "#00FF00";
  ctx.fillText("Пол в", x2 + 90, dy - 350);
  ctx.fillText("ванной", x2 + 90, dy - 280);
  ctx.font = "120pt Calibri";
  this.printTemp(ctx, "warm.floor.t", x2 + 300, dy - 220, currentData);

  ctx.font = "60pt Calibri";
  ctx.fillStyle = "#00FF00";
  ctx.fillText("В", x2 + 90, dy - 100);
  ctx.fillText("печь", x2 + 90, dy - 30);
  ctx.font = "160pt Calibri";
  this.printTemp(ctx, "warmIn.t", x2 + 250, dy + 20, currentData);

  dy += 420;
  ctx.font = "75pt Calibri";
  ctx.fillStyle = "#00FF00";
  ctx.fillText("Гостиная", 30, dy - 270);
  ctx.font = "240pt Calibri";
  this.printTemp(ctx, "inside.t", 40, dy, currentData);

  ctx.font = "75pt Calibri";
  ctx.fillStyle = "#00FF00";
  ctx.fillText("Улица", x2 + 50, dy - 270);
  ctx.font = "210pt Calibri";
  this.printTemp(ctx, "outside.t", x2 + 40, dy, currentData);

  dy += 320;
  ctx.font = "60pt Calibri";
  ctx.fillStyle = "#00FF00";
  ctx.fillText("Кабинет", 30, dy - 200);
  ctx.font = "180pt Calibri";
  this.printTemp(ctx, "room.t", 40, dy, currentData);

  ctx.font = "60pt Calibri";
  ctx.fillStyle = "#00FF00";
  ctx.fillText("Спальня", x2 + 50, dy - 200);
  ctx.font = "180pt Calibri";
  this.printTemp(ctx, "bedroom.t", x2 + 100, dy, currentData);

  dy += 300;
  ctx.font = "50pt Calibri";
  ctx.fillStyle = "#00FF00";
  ctx.fillText("Зим. сад", 30, dy - 190);
  ctx.font = "160pt Calibri";
  this.printTemp(ctx, "winter.garden.t", 40, dy, currentData);

  ctx.font = "50pt Calibri";
  ctx.fillStyle = "#00FF00";
  ctx.fillText("2й этаж", x2 + 50, dy - 190);
  ctx.font = "160pt Calibri";
  this.printTemp(ctx, "second.floor.t", x2 + 100, dy, currentData);


  ctx.lineWidth = 2;
  ctx.strokeStyle = "red";
  ctx.rect(1, Dashboard.HEADER_H - 2, canvas.width - 2, 480);
  ctx.rect(550, Dashboard.HEADER_H - 2, canvas.width - 551, 240);
  ctx.rect(550, Dashboard.HEADER_H - 2, canvas.width - 551, 480);

  ctx.rect(1, Dashboard.HEADER_H - 2 + 480, canvas.width - 2, 401);
  ctx.rect(1, Dashboard.HEADER_H - 2 + 881, canvas.width - 2, 321);
  ctx.rect(1, Dashboard.HEADER_H - 2 + 1202, canvas.width -2, 281);
  ctx.rect(1, Dashboard.HEADER_H - 2 + 480, 500, 1003);
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
    ctx.fillStyle = tempColorFromValue(t);

  ctx.fillText(t ? t.toFixed() : "?", x, y);
};

