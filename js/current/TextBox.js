/**
 * @constructor
 */
function TextBox(x, y, w, h, text, color, alignment, fontSize)
{
  /** @type {String} */
  this.text = text;
  /** @type {String} */
  this.color = color;
  /** @type {Number} */
  this.x = x;
  /** @type {Number} */
  this.y = y;
  /** @type {Number} */
  this.w = w;
  /** @type {Number} */
  this.h = h;
  /** @type {String} */
  this.alignment = alignment;
  /** @type {Number} */
  this.fontSize = fontSize;
}


/**
 * @this {TextBox}
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} sensorRect
 */
TextBox.prototype.draw = function (ctx, sensorRect)
{
  const w = this.w * sensorRect.w;
  const h = this.h * sensorRect.h;
  const x = sensorRect.x + this.x * sensorRect.w;
  const y = sensorRect.y + this.y * sensorRect.h;

  ctx.beginPath();

  const fontName = "px Arial";
  let textWidth = 0;
  let textHeight = 0;
  if (!this.fontSize)
  {
    let fontSize = 1;
    while (textWidth < w && textHeight < h)
    {
      fontSize++;
      ctx.font = fontSize + fontName;
      const metrics = ctx.measureText(this.text);
      textWidth = metrics.width;
      textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
    }

    fontSize--;
    ctx.font = fontSize + fontName;
  }
  else
    ctx.font = this.fontSize + fontName;
  
  const metrics = ctx.measureText(this.text);
  textWidth = metrics.width;
  textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

  ctx.fillStyle = this.color;

  let dx = 0;
  if (this.alignment === "center")
    dx = w / 2 - textWidth / 2;
  else if (this.alignment === "right")
    dx = w - textWidth;

  ctx.fillText(this.text, x + dx, y + h);

  ctx.stroke();
  ctx.closePath();
};
