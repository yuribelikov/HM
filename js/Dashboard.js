/*global log parseDateTime, parseNumber, formatTime, formatNumber*/

/**
 * @constructor
 */
function Dashboard()
{
  this.version = "2.13";

  /** @type {DataLoader} */
  this.dataLoader = new DataLoader();

  /** @type {HTMLCanvasElement} */
  this.canvas = null;
  /** @type {number} */
  this.redrawn = 0;

  /** @type CurrentValuesPanel */
  this.currentValuesPanel = new CurrentValuesPanel();
  /** @type ChartPanel */
  this.chartPanel = new ChartPanel();
  /** @type {Boolean} */
  this.chartMode = true;

  /** @type {Object} */
  this.downEvent = null;
  /** @type {Object} */
  this.moveEvent = null;


  this.start();
}

Dashboard.HEADER_H = 50;
Dashboard.REFRESH_PERIOD = 800;

/**
 * @this {Dashboard}
 */
Dashboard.prototype.start = function ()
{
  log("start");
  var viewport = document.querySelector("meta[name=viewport]");
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
    this.redraw();
  }
};

/**
 * @this {Dashboard}
 */
Dashboard.prototype.run = function ()
{
  var now = new Date().getTime();
  //log("run, now: " + now + ", this.updated: " + this.updated + ", diff: " + (now - this.updated));
  // if (now - this.updated >= Dashboard.REFRESH_PERIOD)
  if (this.redrawn < this.dataLoader.dataUpdated || now - this.redrawn > Dashboard.REFRESH_PERIOD)
    this.redraw();

  window.requestAnimationFrame(this.run.bind(this));
};

/**
 * @this {Dashboard}
 */
Dashboard.prototype.redraw = function ()
{
  if (!this.canvas)
    return;

  var ctx = this.canvas.getContext("2d");
  ctx.beginPath();
  ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  ctx.closePath();

  this.drawHeader();

  if (!this.chartMode)
  {
    if (this.dataLoader.currentRow)
      this.currentValuesPanel.draw(this.canvas, this.dataLoader.currentRow.sensorsData);
  }
  else
    this.chartPanel.draw(this.canvas, this.dataLoader.data);

  this.redrawn = new Date().getTime();
};

/**
 * @this {Dashboard}
 */
Dashboard.prototype.drawHeader = function ()
{
  var ctx = this.canvas.getContext("2d");
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "red";
  ctx.rect(1, 1, this.canvas.width - 2, Dashboard.HEADER_H - 2);
  ctx.stroke();

  ctx.font = "25pt Calibri";
  var dy = Dashboard.HEADER_H - 10;
  ctx.fillStyle = "white";
  ctx.fillText(formatTime(this.dataLoader.dataUpdated), this.canvas.width - 130, dy);

  var now = new Date().getTime();
  if (this.dataLoader.currentRow)
  {
    var times = [this.dataLoader.currentSaved, this.dataLoader.currentRow.time];
    for (var i = 0; i < times.length; i++)
    {
      var ago = Math.floor((now - times[i]) / 1000);
      var ox = 410;
      ctx.fillStyle = (i === 0 ? "white" : "gray");
      ctx.fillText(formatTime(times[i], true), i * ox + 20, dy);
      ctx.fillText("(" + formatNumber(ago) + ")", i * ox + 350, dy);
    }
  }

  if (!this.chartMode)
  {
    ctx.fillStyle = "white";
    ctx.fillText(this.version, 20, this.canvas.height - 40);
    //noinspection JSUnresolvedVariable
    var text = this.canvas.width + "x" + this.canvas.height + " (" + window.devicePixelRatio + ")";
    ctx.fillText(text, this.canvas.width - ctx.measureText(text).width - 3, this.canvas.height - 40);
  }
  ctx.closePath();
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
  var dx = this.downEvent !== null ? evt.clientX - this.downEvent.clientX : 0;
  var dy = this.downEvent !== null ? evt.clientY - this.downEvent.clientY : 0;
  var mx = this.moveEvent !== null ? evt.clientX - this.moveEvent.clientX : 0;
  var my = this.moveEvent !== null ? evt.clientY - this.moveEvent.clientY : 0;
  if (evt.type === "pointerdown")
  {
    this.downEvent = evt;
    this.moveEvent = evt;
  }
  else if (evt.type === "pointerup")
  {
    if (dx < 3 && dy < 3)
      this.click(evt.clientX, evt.clientY);

    this.downEvent = null;
  }
  else if (evt.type === "pointermove" && this.downEvent != null)
  {
    // log(evt.type, evt.clientX, evt.clientY);
    if (dy > minMove && Math.abs(dx) < minMove)   // down
    {
      if (dy > slideDist && !this.chartMode)
      {
        this.chartMode = true;
        this.redraw();
      }
    }
    else if (-dy > minMove && Math.abs(dx) < minMove)   // up
    {
      if (-dy > slideDist && this.chartMode)
      {
        this.chartMode = false;
        this.redraw();
      }
    }
    else if (evt.clientY > Dashboard.HEADER_H && Math.abs(my) < 10 && (mx > 2 || mx < -2))   // right / left
    {
      // this.updateDataIndex(this.currentDataIndex + Math.round(mx / 10));
    }

    this.moveEvent = evt;
  }

};

/**
 * @this {Dashboard}
 * @param {Number} x
 * @param {Number} y
 */
Dashboard.prototype.click = function (x, y)
{
  // if (y < Dashboard.HEADER_H && x > this.canvas.width - Dashboard.HEADER_CURR_TIME_W)
  //   this.updateDataIndex(0);
};
