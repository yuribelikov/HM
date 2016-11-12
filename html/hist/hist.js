/*global log*/

$(document).ready(hist);

function hist()
{
  var hmhist = new HMHist();
  $(window).resize(hmhist.onResize.bind(hmhist));
}

/**
 * @constructor
 */
function HMHist()
{
  this.version = "0.1";

  /** @type {HTMLCanvasElement} */
  this.canvas = null;

  /** @type {Array<String>} */
  this.sensors = null;

  /** @type {Array<Number>} */
  this.selectedData = {};

  /** @type {Array<Number>} */
  this.recentTimes = null;
  /** @type {Array<Array<Number>>} */
  this.recentData = null;

  /** @type {Array<Number>} */
  this.histTimes = null;
  /** @type {Array<Object>} */
  this.histData = null;

  this.start();
}

HMHist.HEADER_H = 50;
HMHist.GRAPH_W = 300;
HMHist.GRAPH_T_H = 60;
HMHist.GRAPH_H_H = 100;

/**
 * @this {HMHist}
 */
HMHist.prototype.start = function ()
{
  log("start");

  this.canvas = document.createElement("canvas");
  document.body.appendChild(this.canvas);

  $.get("/data/recent.csv", this.recentDataReceived.bind(this));
  $.get("/data/", this.dataDirListReceived.bind(this));

  this.onResize();
};

/**
 * @this {HMHist}
 */
HMHist.prototype.onResize = function ()
{
  log("onResize");
  if (this.canvas)
  {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  this.redraw();
};

/**
 * @this {HMHist}
 * @param {string} csv
 */
HMHist.prototype.recentDataReceived = function (csv)
{
  log("recentDataReceived:", csv.length, "bytes");
  var rows = csv.split("\n");
  this.sensors = rows[0].split(";").slice(1);
  log("sensors:", this.sensors);
  this.recentTimes = [];
  this.recentData = [];
  this.makeDataFromCSV(csv, this.recentTimes, this.recentData);
  log("recentTimes:", this.recentTimes.length);
  log("recentData:", this.recentData[0].length + "x" + this.recentData.length);

  this.redraw();
};

/**
 * @this {HMHist}
 * @param {string} csv
 * @param {Array<Number>} times
 * @param {Array<Array<Number>>} data
 */
HMHist.prototype.makeDataFromCSV = function (csv, times, data)
{
  var csvData = [];
  var rows = csv.split("\n");
  for (var i = 1; i < rows.length; i++)
  {
    if (rows[i].length == 0)
      break;

    var cells = rows[i].split(";");
    times[i - 1] = this.parseDateTime(cells[0]);
    csvData[i - 1] = [];
    for (var j = 1; j < cells.length; j++)
      csvData[i - 1][j - 1] = this.parseNumber(cells[j]);
  }

  for (i = 0; i < this.sensors.length; i++)
    data[i] = [];

  for (i = 0; i < this.sensors.length; i++)
    for (j = 0; j < csvData.length; j++)
      data[i][j] = csvData[j][i];
};

/**
 * @this {HMHist}
 * @param {string} html
 */
HMHist.prototype.dataDirListReceived = function (html)
{
  //log("dataDirListReceived: ", html);
  var lines = html.split("\n");
  var files = [];
  for (var i = 0; i < lines.length; i++)
    if (lines[i].indexOf("daily_") != -1)
      files.push(lines[i].substr(lines[i].indexOf("daily_"), 20));

  if (files.length > 5)
    files.splice(0, files.length - 5);

  this.histTimes = [];
  this.histData = [];
  log("files to load:", files);
  this.loadDailyFiles(files);
};

/**
 * @this {HMHist}
 * @param {Array<String>} files
 * @param {=String} csv
 */
HMHist.prototype.loadDailyFiles = function (files, csv)
{
  if (csv)    // process csv from loaded file
  {
    log("loadDailyFiles:", csv.length, "bytes");
    var times = [];
    var data = [];
    this.makeDataFromCSV(csv, times, data);
    this.histTimes = this.histTimes.concat(times);
    if (this.histData.length == 0)
      this.histData = data;
    else
      for (var i = 0; i < this.sensors.length; i++)
        this.histData[i] = this.histData[i].concat(data[i]);
  }

  if (files.length > 0)   // load next file
  {
    var file = files.shift();
    log("loadDailyFiles: ", file);
    $.get("/data/" + file, this.loadDailyFiles.bind(this, files));
  }
  else    // all files loaded
  {
    log("histTimes:", this.histTimes.length);
    log("histData:", this.histData[0].length + "x" + this.histData.length);
    this.redraw();
  }
};

/**
 * @this {HMHist}
 */
HMHist.prototype.redraw = function ()
{
  var ctx = this.canvas.getContext("2d");
  ctx.beginPath();
  ctx.clearRect(0, 0, this.canvas.width, HMHist.HEADER_H);
  ctx.closePath();

  if (!this.sensors)
    return;

  for (var i = 0; i < this.sensors.length; i++)
    this.drawSensorGraph(i);
};

/**
 * @this {HMHist}
 * @param {number} i
 */
HMHist.prototype.drawSensorGraph = function (i)
{


  var ctx = this.canvas.getContext("2d");
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.clearRect(0, 0, this.canvas.width, HMHist.HEADER_H);
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#00FF00";
  ctx.rect(0, 0, this.canvas.width, this.canvas.height);
  ctx.stroke();

  ctx.closePath();
};

/**
 * @this {HMHist}
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} key
 * @param {number} x
 * @param {number} y
 */
HMHist.prototype.printTemp = function (ctx, key, x, y)
{
  var t = this.lastValues[key];
  if (t)
    ctx.fillStyle = this.tempColorFromValue(t);

  ctx.fillText(t ? t.toFixed() : "?", x, y);
};

/**
 }
 * @this {HMHist}
 * @param {number} value
 * @return {string}
 */
HMHist.prototype.colorFromValue = function (value)       // <0 is white, 0-1 is yellow to red, >1 - red
{
  if (value > 1)
    value = 1;

  var r = 255;
  var g = (value < 0 ? 255 : 255 - 255 * value);
  var b = (value < 0 ? 255 : 0);

  return "rgb(" + Math.floor(r) + "," + Math.floor(g) + "," + Math.floor(b) + ")";    // "rgb(155, 102, 102)"
};

/**
 * @this {HMHist}
 * @param {number} t
 * @return {string}
 */
HMHist.prototype.tempColorFromValue = function (t)
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
 * @this {HMHist}
 * @param {number} time
 * @param {boolean=} withDate
 * @return {string}
 */
HMHist.prototype.formatTime = function (time, withDate)
{
  var date = new Date();
  date.setTime(time);
  var d = (withDate ? date.getFullYear() + "-" + this.formatNumber(1 + date.getMonth()) + "-" + this.formatNumber(date.getDate()) + "  " : "");
  return d + this.formatNumber(date.getHours()) + ":" + this.formatNumber(date.getMinutes()) + ":" + this.formatNumber(date.getSeconds());
};

/**
 * @this {HMHist}
 * @param {number} num
 * @return {string}
 */
HMHist.prototype.formatNumber = function (num)
{
  return num < 10 ? "0" + num : "" + num;
};

/**
 * @this {HMHist}
 * @param {string} dateTime in format "2016-04-04_06:23"
 * @return {number}
 */
HMHist.prototype.parseDateTime = function (dateTime)
{
  var d = new Date(dateTime.replace("_", " "));
  //log(d);
  return d.getTime();
};

/**
 * @this {HMHist}
 * @param {string} value in format 22.937
 * @return {number}
 */
HMHist.prototype.parseNumber = function (value)
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
