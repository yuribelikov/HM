/*global log*/

$(document).ready(main);

function main()
{
  var client = new HMClient();
  $(window).resize(client.onResize.bind(client));
}

/**
 * @constructor
 */
function HMClient()
{
  this.version = "1.04";

  /** @type {HTMLCanvasElement} */
  this.canvas;
  /** @type {number} */
  this.updated = 0;
  /** @type {number} */
  this.dataUpdated = 0;

  /** @type {Array<number>} */
  this.dataTimes;
  /** @type {Array<string>} */
  this.dataHeaders;
  /** @type {Array<Array<number>>} */
  this.data;

  /** @type {Number} */
  this.lastDataTime = 0;
  /** @type {Object} */
  this.lastValues = {};

  /** @type {Boolean} */
  this.drawLabels = false;

  //this.started = new Date().getTime();
  this.start();
}

HMClient.HEADER_H = 50;
HMClient.GRAPH_W = 300;
HMClient.GRAPH_T_H = 60;
HMClient.GRAPH_H_H = 100;
HMClient.REFRESH_PERIOD = 10;
HMClient.DATA_UPDATE_TIMEOUT = 60;

/**
 * @this {HMClient}
 */
HMClient.prototype.start = function ()
{
  log("start");
  viewport = document.querySelector("meta[name=viewport]");
  viewport.setAttribute('content', 'width=device-width, initial-scale=0.333, maximum-scale=1.0, user-scalable=0');

  this.canvas = document.createElement("canvas");
  document.body.appendChild(this.canvas);

  this.onResize();
  window.requestAnimationFrame(this.run.bind(this));
};

/**
 * @this {HMClient}
 */
HMClient.prototype.onResize = function ()
{
  log("onResize");
  $('#vp').attr('content', 'width=device-width; initial-scale=1.0');
  if (this.canvas)
  {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    if (this.data)
      this.redraw(true);
  }
};

/**
 * @this {HMClient}
 */
HMClient.prototype.run = function ()
{
  var now = new Date().getTime();
  //log("run, now: " + now + ", this.updated: " + this.updated + ", diff: " + (now - this.updated));
  if (now - this.updated >= HMClient.REFRESH_PERIOD * 1000)
  {
    $.get("data/recent.csv", this.dataReceived.bind(this));
    this.updated = now;
  }
  else
    this.redraw(false);

  var drawLabels = (now / 1000) % 10 >= 6;
  if (drawLabels != this.drawLabels)
  {
    this.drawLabels = drawLabels;
    this.redraw(true);
  }

  window.requestAnimationFrame(this.run.bind(this));
};

/**
 * @this {HMClient}
 * @param {string} csv
 */
HMClient.prototype.dataReceived = function (csv)
{
  log("dataReceived: " + csv.length);
  var rows = csv.split("\n");
  this.dataHeaders = rows[0].split(";").slice(1);
  this.dataTimes = [];
  this.data = [];
  for (var i = 1; i < rows.length; i++)
  {
    if (rows[i].length == 0)
      break;

    var cells = rows[i].split(";");
    this.dataTimes[i - 1] = this.parseDateTime(cells[0]);
    this.data[i - 1] = [];
    for (var j = 1; j < cells.length; j++)
      this.data[i - 1][j - 1] = this.parseNumber(cells[j]);
  }

  this.lastDataTime = this.dataTimes[this.dataTimes.length - 1];
  log(this.lastDataTime);
  this.lastValues = {};
  for (i = 0; i < this.dataHeaders.length; i++)
    this.lastValues[this.dataHeaders[i]] = this.data[this.data.length - 1][i];

  log(this.lastValues);
  //this.dataTimes[this.dataTimes.length - 1] = this.started;
  this.dataUpdated = new Date().getTime();
  this.redraw(true);
};

/**
 * @this {HMClient}
 * @param {boolean} redrawData
 */
HMClient.prototype.redraw = function (redrawData)
{
  this.drawHeader();

  if (redrawData)
    this.drawData();
};

/**
 * @this {HMClient}
 */
HMClient.prototype.drawHeader = function ()
{
  var ctx = this.canvas.getContext("2d");
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.clearRect(0, 0, this.canvas.width, HMClient.HEADER_H);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "red";
  ctx.rect(1, 1, this.canvas.width - 2, HMClient.HEADER_H - 2);
  ctx.stroke();

  ctx.font = "30pt Calibri";
  var dy = HMClient.HEADER_H - 10;
  var now = new Date().getTime();
  var updatedAgo = Math.floor((now - this.dataUpdated) / 1000);
  ctx.fillStyle = "pink";
  ctx.fillText(this.formatTime(this.dataUpdated), this.canvas.width - 390, dy);
  ctx.fillStyle = "white";
  ctx.fillText(this.formatTime(now), this.canvas.width - 156, dy);
  ctx.fillStyle = this.colorFromValue((updatedAgo - HMClient.REFRESH_PERIOD * 0.7) / HMClient.REFRESH_PERIOD);
  ctx.fillText(this.formatNumber(updatedAgo), this.canvas.width - 220, dy);

  if (this.dataTimes)
  {
    updatedAgo = Math.floor((now - this.lastDataTime) / 1000);
    ctx.fillStyle = "yellow";
    ctx.fillText(this.formatTime(this.lastDataTime, true), 2, dy);
    ctx.fillStyle = this.colorFromValue((updatedAgo - HMClient.DATA_UPDATE_TIMEOUT * 0.7) / HMClient.DATA_UPDATE_TIMEOUT);
    ctx.fillText(this.formatNumber(Math.floor((now - this.lastDataTime) / 1000)), 420, dy);
  }

  ctx.clearRect(0, this.canvas.height - 20, this.canvas.width, 20);
  ctx.fillStyle = "white";
  ctx.fillText(this.version, 2, this.canvas.height - 2);
  //noinspection JSUnresolvedVariable
  var text = this.canvas.width + "x" + this.canvas.height + " (" + window.devicePixelRatio + ")";
  ctx.fillText(text, this.canvas.width - ctx.measureText(text).width - 3, this.canvas.height - 2);
  ctx.closePath();
};

/**
 * @this {HMClient}
 */
HMClient.prototype.drawData = function ()
{
  log("this.drawLabels: " + this.drawLabels);
  var ctx = this.canvas.getContext("2d");
  ctx.beginPath();

  ctx.clearRect(0, HMClient.HEADER_H, this.canvas.width, this.canvas.height - HMClient.HEADER_H);
  var x2 = this.canvas.width / 2;
  var dy = HMClient.HEADER_H + 420;

  if (this.drawLabels)
  {
    ctx.font = "120pt Calibri";
    ctx.fillStyle = "#00FF00";
    ctx.fillText("Выход", 10, dy - 290);
    ctx.fillText("из печи", 10, dy - 170);
  }
  else
    ctx.font = "400pt Calibri";
  this.printTemp(ctx, "warmOut.t", 10, dy);

  if (this.drawLabels)
  {
    ctx.font = "60pt Calibri";
    ctx.fillStyle = "#00FF00";
    ctx.fillText("Пол в ванной", x2 + 50, dy - 330);
    ctx.font = "80pt Calibri";
  }
  else
    ctx.font = "180pt Calibri";
  this.printTemp(ctx, "warm.floor.t", x2 + 170, dy - 220);

  if (this.drawLabels)
  {
    ctx.font = "60pt Calibri";
    ctx.fillStyle = "#00FF00";
    ctx.fillText("Вход в печь", x2 + 50, dy - 100);
    ctx.font = "80pt Calibri";
  }
  else
    ctx.font = "180pt Calibri";
  this.printTemp(ctx, "warmIn.t", x2 + 170, dy + 20);

  dy += 500;
  if (this.drawLabels)
  {
    ctx.font = "80pt Calibri";
    ctx.fillStyle = "#00FF00";
    ctx.fillText("Гостиная", 10, dy - 280);
    ctx.font = "200pt Calibri";
  }
  else
    ctx.font = "300pt Calibri";
  this.printTemp(ctx, "inside.t", 40, dy);

  if (this.drawLabels)
  {
    ctx.font = "80pt Calibri";
    ctx.fillStyle = "#00FF00";
    ctx.fillText("Улица", x2 - 50, dy - 270);
    ctx.font = "200pt Calibri";
  }
  else
    ctx.font = "300pt Calibri";
  this.printTemp(ctx, "outside.t", x2 + 100, dy);

  dy += 400;
  if (this.drawLabels)
  {
    ctx.font = "90pt Calibri";
    ctx.fillStyle = "#00FF00";
    ctx.fillText("Кабинет", 10, dy - 240);
    ctx.font = "160pt Calibri";
  }
  else
    ctx.font = "200pt Calibri";
  this.printTemp(ctx, "room.t", 40, dy);

  if (this.drawLabels)
  {
    ctx.font = "90pt Calibri";
    ctx.fillStyle = "#00FF00";
    ctx.fillText("Спальня", x2 - 50, dy - 240);
    ctx.font = "160pt Calibri";
  }
  else
    ctx.font = "200 Calibri";
  this.printTemp(ctx, "bedroom.t", x2 + 100, dy);


  ctx.lineWidth = 2;
  ctx.strokeStyle = "red";
  ctx.rect(1, HMClient.HEADER_H - 2, this.canvas.width, 480);
  ctx.rect(620, HMClient.HEADER_H - 2, this.canvas.width - 621, 240);
  ctx.rect(620, HMClient.HEADER_H - 2, this.canvas.width - 621, 480);

  ctx.rect(1, HMClient.HEADER_H - 2 + 480, this.canvas.width - 2, 501);
  ctx.rect(1, HMClient.HEADER_H - 2 + 981, this.canvas.width - 2, 401);
  ctx.rect(1, HMClient.HEADER_H - 2 + 480, 500, 902);
  ctx.stroke();

  ctx.closePath();
};

/**
 * @this {HMClient}
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} key
 * @param {number} x
 * @param {number} y
 */
HMClient.prototype.printTemp = function (ctx, key, x, y)
{
  var t = this.lastValues[key];
  if (t)
    ctx.fillStyle = this.tempColorFromValue(t);

  ctx.fillText(t ? t.toFixed() : "?", x, y);
};

/**
 }
 * @this {HMClient}
 * @param {number} value
 * @return {string}
 */
HMClient.prototype.colorFromValue = function (value)       // <0 is white, 0-1 is yellow to red, >1 - red
{
  if (value > 1)
    value = 1;

  var r = 255;
  var g = (value < 0 ? 255 : 255 - 255 * value);
  var b = (value < 0 ? 255 : 0);

  return "rgb(" + Math.floor(r) + "," + Math.floor(g) + "," + Math.floor(b) + ")";    // "rgb(155, 102, 102)"
};

/**
 * @this {HMClient}
 * @param {number} t
 * @return {string}
 */
HMClient.prototype.tempColorFromValue = function (t)
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

/**
 * @this {HMClient}
 * @param {number} time
 * @param {boolean=} withDate
 * @return {string}
 */
HMClient.prototype.formatTime = function (time, withDate)
{
  var date = new Date();
  date.setTime(time);
  var d = (withDate ? date.getFullYear() + "-" + this.formatNumber(1 + date.getMonth()) + "-" + this.formatNumber(date.getDate()) + "  " : "");
  return d + this.formatNumber(date.getHours()) + ":" + this.formatNumber(date.getMinutes()) + ":" + this.formatNumber(date.getSeconds());
};

/**
 * @this {HMClient}
 * @param {number} num
 * @return {string}
 */
HMClient.prototype.formatNumber = function (num)
{
  return num < 10 ? "0" + num : "" + num;
};

/**
 * @this {HMClient}
 * @param {string} dateTime in format "2016-04-04_06:23"
 * @return {number}
 */
HMClient.prototype.parseDateTime = function (dateTime)
{
  var d = new Date(dateTime.replace("_", " "));
  //log(d);
  return d.getTime();
};

/**
 * @this {HMClient}
 * @param {string} value in format 22.937
 * @return {number}
 */
HMClient.prototype.parseNumber = function (value)
{
  try
  {
    //log(Number(value));
    return Number(value);
  }
  catch (ignored)
  {
    return Number.NaN;
  }
};
