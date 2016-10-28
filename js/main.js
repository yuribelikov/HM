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
  /** @type {HTMLCanvasElement} */
  this.canvas;
  /** @type {number} */
  this.updated = 0;

  /** @type {Array<number>} */
  this.dataTimes;
  /** @type {Array<string>} */
  this.dataHeaders;
  /** @type {Array<Array<number>>} */
  this.data;

  this.started = new Date().getTime();
  this.start();
}

HMClient.HEADER_H = 16;
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

  //this.dataTimes[this.dataTimes.length - 1] = this.started;
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

  ctx.font = "10pt Calibri";
  var now = new Date().getTime();
  var updatedAgo = Math.floor((now - this.updated) / 1000);
  ctx.fillStyle = "white";
  ctx.fillText(this.formatTime(this.updated), this.canvas.width - 140, 12);
  ctx.fillText(this.formatTime(now), this.canvas.width - 51, 12);
  ctx.fillStyle = this.colorFromValue((updatedAgo - HMClient.REFRESH_PERIOD * 0.7) / HMClient.REFRESH_PERIOD);
  ctx.fillText(this.formatNumber(updatedAgo), this.canvas.width - 85, 12);

  if (this.dataTimes)
  {
    var lastDataTime = this.dataTimes[this.dataTimes.length - 1];
    updatedAgo = Math.floor((now - lastDataTime) / 1000);
    ctx.fillStyle = "white";
    ctx.fillText(this.formatTime(lastDataTime, true), 2, 12);
    ctx.fillStyle = this.colorFromValue((updatedAgo - HMClient.DATA_UPDATE_TIMEOUT * 0.7) / HMClient.DATA_UPDATE_TIMEOUT);
    ctx.fillText(this.formatNumber(Math.floor((now - lastDataTime) / 1000)), 130, 12);
  }

  ctx.clearRect(0, this.canvas.height - 20, this.canvas.width, 20);
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
  var ctx = this.canvas.getContext("2d");
  ctx.clearRect(0, HMClient.HEADER_H, this.canvas.width, this.canvas.height - HMClient.HEADER_H);
  var idx = 0;
  var dy = HMClient.HEADER_H;
  for (var col = 0; col < this.data[0].length; col++)
  {
    var ha = this.dataHeaders[col].split('.');
    if (ha[1] == "t")
    {
      this.drawSensorGraph(idx++, ha[0], false, dy);
      dy += HMClient.GRAPH_T_H;
    }
  }
  for (col = 0; col < this.data[0].length; col++)
  {
    ha = this.dataHeaders[col].split('.');
    if (ha[1] == "h")
    {
      this.drawSensorGraph(idx++, ha[0], true, dy);
      dy += HMClient.GRAPH_H_H;
    }
  }

};

/**
 * @this {HMClient}
 * @param {number} sensorIdx
 * @param {string} name
 * @param {boolean} h
 * @param {number} dy
 */
HMClient.prototype.drawSensorGraph = function (sensorIdx, name, h, dy)
{
  var gw = HMClient.GRAPH_W;
  var gh = (h ? HMClient.GRAPH_H_H : HMClient.GRAPH_T_H);
  var ctx = this.canvas.getContext("2d");
  ctx.translate(0.5, 0.5);
  ctx.lineWidth = 1;
  ctx.strokeStyle = "white";
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(gw, dy);
  ctx.lineTo(gw, dy + gh);
  ctx.stroke();
  ctx.closePath();
  var step = gh / 10;
  for (var i = 1; i <= step; i++)
  {
    ctx.beginPath();
    if (i < step)
      ctx.setLineDash([1, 5]);
    else
      ctx.setLineDash([]);
    ctx.moveTo(0, dy + i * gh / step);
    ctx.lineTo(gw, dy + i * gh / step);
    ctx.stroke();
    ctx.closePath();
  }

  for (var row = 0; row < this.data[sensorIdx].length; row++)
  {

  }

  ctx.font = "10pt Calibri";
  ctx.fillStyle = "white";
  ctx.fillText((h ? "H " : "T ") + name, 2, dy + 18);

  ctx.translate(-0.5, -0.5);
};

/**
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
