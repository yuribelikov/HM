/*global log*/

/**
 * @constructor
 */
function Dashboard()
{
  this.version = "1.12";

  /** @type {HTMLCanvasElement} */
  this.canvas = null;
  /** @type {number} */
  this.updated = 0;
  /** @type {number} */
  this.dataUpdated = 0;

  /** @type {Array<number>} */
  this.dataTimes = null;
  /** @type {Array<string>} */
  this.dataHeaders = null;
  /** @type {Array<Array<number>>} */
  this.data = null;

  /** @type {Number} */
  this.currentDataIndex = -1;
  /** @type {Number} */
  this.currentDataTime = 0;
  /** @type {Array<number>} */
  this.currentDataRow = {};
  /** @type {Number} */
  this.currentDataIndexUpdated = 0;

  /** @type CurrentValuesPanel */
  this.currentValuesPanel = new CurrentValuesPanel();

  /** @type ChartPanel */
  this.chartPanel = new ChartPanel();

  /** @type {Boolean} */
  this.chartMode = false;

  /** @type {Object} */
  this.downEvent = null;


  this.start();
}

Dashboard.HEADER_H = 50;
Dashboard.GRAPH_W = 300;
Dashboard.GRAPH_T_H = 60;
Dashboard.GRAPH_H_H = 100;
Dashboard.REFRESH_PERIOD = 10;
Dashboard.DATA_UPDATE_TIMEOUT = 80;

/**
 * @this {Dashboard}
 */
Dashboard.prototype.start = function ()
{
  log("start");
  viewport = document.querySelector("meta[name=viewport]");
  viewport.setAttribute('content', 'width=device-width, initial-scale=0.333, maximum-scale=1.0, user-scalable=0');

  this.canvas = document.createElement("canvas");
  document.body.appendChild(this.canvas);

  this.canvas.addEventListener("pointerdown", this.onPointer.bind(this));
  this.canvas.addEventListener("pointermove", this.onPointer.bind(this));
  this.canvas.addEventListener("pointerup", this.onPointer.bind(this));
  this.canvas.addEventListener("pointercancel", this.onPointer.bind(this));
  this.canvas.addEventListener("pointerleave", this.onPointer.bind(this));

  this.onResize();
  window.requestAnimationFrame(this.run.bind(this));
};

/**
 * @this {Dashboard}
 */
Dashboard.prototype.onResize = function ()
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
 * @this {Dashboard}
 */
Dashboard.prototype.run = function ()
{
  var now = new Date().getTime();
  //log("run, now: " + now + ", this.updated: " + this.updated + ", diff: " + (now - this.updated));
  if (now - this.updated >= Dashboard.REFRESH_PERIOD * 1000)
  {
    // $.get("data/recent.csv", this.dataReceived.bind(this));
    $.get("data/recent.csv", {"_": $.now()}, this.dataReceived.bind(this));
    this.updated = now;
  }
  else
    this.redraw(false);

  window.requestAnimationFrame(this.run.bind(this));
};

/**
 * @this {Dashboard}
 * @param {string} csv
 */
Dashboard.prototype.dataReceived = function (csv)
{
  log("dataReceived: " + csv.length);
  var rows = csv.split("\n");
  this.dataHeaders = rows[0].split(";").slice(1);
  this.dataTimes = [];
  this.data = [];
  for (var i = 1; i < rows.length; i++)
  {
    if (rows[i].length === 0)
      break;

    var cells = rows[i].split(";");
    this.dataTimes[i - 1] = this.parseDateTime(cells[0]);
    this.data[i - 1] = [];
    for (var j = 1; j < cells.length; j++)
      this.data[i - 1][j - 1] = this.parseNumber(cells[j]);
  }

  var now = new Date().getTime();
  log("diff: " + (now - this.currentDataIndexUpdated));
  this.updateDataIndex(now - this.currentDataIndexUpdated > 3 * 60000 ? 0 : this.currentDataIndex);   // reset after 3 minutes

  //this.dataTimes[this.dataTimes.length - 1] = this.started;
  this.dataUpdated = now;
  this.redraw(true);
};

/**
 * @this {Dashboard}
 * @param {boolean} redrawData
 */
Dashboard.prototype.redraw = function (redrawData)
{
  this.drawHeader(this.canvas);

  if (redrawData)
  {
    if (!this.chartMode)
      this.currentValuesPanel.draw(this.canvas, this.currentDataRow);
    else
      this.chartPanel.draw(this.canvas, this.data);
  }
};

/**
 * @this {Dashboard}
 * @param {HTMLCanvasElement} canvas
 */
Dashboard.prototype.drawHeader = function (canvas)
{
  var ctx = canvas.getContext("2d");
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.clearRect(0, 0, this.canvas.width, Dashboard.HEADER_H);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "red";
  ctx.rect(20, 1, this.canvas.width - 20, Dashboard.HEADER_H - 2);
  ctx.stroke();

  ctx.font = "30pt Calibri";
  var dy = Dashboard.HEADER_H - 10;
  var now = new Date().getTime();
  var updatedAgo = Math.floor((now - this.dataUpdated) / 1000);
  ctx.fillStyle = "pink";
  ctx.fillText(this.formatTime(this.dataUpdated), this.canvas.width - 390, dy);
  ctx.fillStyle = "white";
  ctx.fillText(this.formatTime(now), this.canvas.width - 156, dy);
  ctx.fillStyle = this.colorFromValue((updatedAgo - Dashboard.REFRESH_PERIOD * 0.7) / Dashboard.REFRESH_PERIOD);
  ctx.fillText(this.formatNumber(updatedAgo), this.canvas.width - 220, dy);

  if (this.dataTimes)
  {
    updatedAgo = Math.floor((now - this.currentDataTime) / 1000);
    ctx.fillStyle = "yellow";
    ctx.fillText(this.formatTime(this.currentDataTime, true), 20, dy);
    ctx.fillStyle = this.colorFromValue((updatedAgo - Dashboard.DATA_UPDATE_TIMEOUT * 0.7) / Dashboard.DATA_UPDATE_TIMEOUT);
    ctx.fillText(this.formatNumber(Math.floor((now - this.currentDataTime) / 1000)), 440, dy);
  }

  ctx.clearRect(0, this.canvas.height - 20, this.canvas.width, 20);
  ctx.fillStyle = "white";
  ctx.fillText(this.version, 20, this.canvas.height - 40);
  //noinspection JSUnresolvedVariable
  var text = this.canvas.width + "x" + this.canvas.height + " (" + window.devicePixelRatio + ")";
  ctx.fillText(text, this.canvas.width - ctx.measureText(text).width - 3, this.canvas.height - 40);
  ctx.closePath();
};

/**
 }
 * @this {Dashboard}
 * @param {number} value
 * @return {string}
 */
Dashboard.prototype.colorFromValue = function (value)       // <0 is white, 0-1 is yellow to red, >1 - red
{
  if (value > 1)
    value = 1;

  var r = 255;
  var g = (value < 0 ? 255 : 255 - 255 * value);
  var b = (value < 0 ? 255 : 0);

  return "rgb(" + Math.floor(r) + "," + Math.floor(g) + "," + Math.floor(b) + ")";    // "rgb(155, 102, 102)"
};

/**
 * @this {Dashboard}
 * @param {string} dateTime in format "2016-04-04_06:23"
 * @return {number}
 */
Dashboard.prototype.parseDateTime = function (dateTime)
{
  var d = new Date(dateTime.replace("_", " "));
  //log(d);
  return d.getTime();
};

/**
 * @this {Dashboard}
 * @param {string} value in format 22.937
 * @return {number}
 */
Dashboard.prototype.parseNumber = function (value)
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

/**
 * @this {Dashboard}
 * @param {number} time
 * @param {boolean=} withDate
 * @return {string}
 */
Dashboard.prototype.formatTime = function (time, withDate)
{
  var date = new Date();
  date.setTime(time);
  var d = (withDate ? date.getFullYear() + "-" + this.formatNumber(1 + date.getMonth()) + "-" + this.formatNumber(date.getDate()) + "  " : "");
  return d + this.formatNumber(date.getHours()) + ":" + this.formatNumber(date.getMinutes()) + ":" + this.formatNumber(date.getSeconds());
};


/**
 * @this {Dashboard}
 * @param {number} num
 * @return {string}
 */
Dashboard.prototype.formatNumber = function (num)
{
  return num < 10 ? "0" + num : "" + num;
};

/**
 Mouse types (pointerType = mouse):
 pointermove - mouse move
 pointerdown - mouse button pressing
 pointerup

 Touch types (pointerType = touch):
 pointerdown - pressing
 pointerup
 pointermove - dragging
 pointercancel - long touch

 * @this {Dashboard}
 * @param {Event} evt
 */
Dashboard.prototype.onPointer = function (evt)
{
  // log(evt.type, evt.clientX, evt.clientY);
  var minMove = 20;
  var slideDist = 70;
  if (evt.type === "pointerdown")
    this.downEvent = evt;
  else if (evt.type === "pointerup")
    this.downEvent = null;
  else if (evt.type === "pointermove" && this.downEvent != null)
  {
    // log(evt.type, evt.clientX, evt.clientY);
    var dy = evt.clientY - this.downEvent.clientY;
    var dx = evt.clientX - this.downEvent.clientX;
    if (dy > minMove && Math.abs(dx) < minMove)   // down
    {
      if (dy > slideDist && !this.chartMode)
      {
        this.chartMode = true;
        this.redraw(true);
      }
    }
    else if (-dy > minMove && Math.abs(dx) < minMove)   // up
    {
      if (-dy > slideDist && this.chartMode)
      {
        this.chartMode = false;
        this.redraw(true);
      }
    }
    else if (dx > minMove && Math.abs(dy) < minMove)   // right
    {
      this.updateDataIndex(this.currentDataIndex + Math.round(dx / minMove));
    }
    else if (-dx > minMove && Math.abs(dy) < minMove)   // left
    {

    }

  }

};

/**
 * @this {Dashboard}
 * @param {Number} newDataIndex
 */
Dashboard.prototype.updateDataIndex = function (newDataIndex)
{
  log("updateDataIndex: " + newDataIndex);
  if (newDataIndex !== this.currentDataIndex && newDataIndex < this.data.length)
  {
    this.currentDataIndex = newDataIndex;
    log(this.currentDataIndex);
    this.currentDataTime = this.dataTimes[this.dataTimes.length - 1 - this.currentDataIndex];
    this.currentDataIndexUpdated = new Date().getTime();
    log(this.formatTime(this.currentDataTime, true));
    this.currentDataRow = {};
    for (i = 0; i < this.dataHeaders.length; i++)
      this.currentDataRow[this.dataHeaders[i]] = this.data[this.data.length - 1 - this.currentDataIndex][i];

    log(this.currentDataRow);
    this.redraw(true);
  }
};
