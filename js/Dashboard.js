/*global log parseDateTime, parseNumber, formatTime, formatNumber*/

/**
 * @constructor
 */
function Dashboard()
{
  this.version = "3.22";

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
  /** @type {Number} */
  this.mode = Dashboard.MODE_CURR_VALUES;
  /** @type {Boolean} */
  this.portrait = false;

  /** @type {Object} */
  this.downEvent = null;
  /** @type {Object} */
  // this.moveEvent = null;

  this.start();
}

Dashboard.HEADER_H = 17 * window.devicePixelRatio;
Dashboard.MODE_CURR_VALUES = 0;
Dashboard.MODE_CHART = 1;
Dashboard.MODE_BOTH = 2;

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
  if (!this.portrait)
    this.mode = Dashboard.MODE_BOTH;

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
    this.portrait = (this.canvas.height > this.canvas.width);
    if ((this.portrait && this.mode === Dashboard.MODE_BOTH) || (!this.portrait && this.mode === Dashboard.MODE_CURR_VALUES))
      this.mode = Dashboard.MODE_CHART;
    log("portrait: " + this.portrait + ", mode: " + this.mode);
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
  if (this.redrawn < this.dataLoader.dataUpdated || now - this.redrawn > 800)
    this.redraw();

  window.requestAnimationFrame(this.run.bind(this));
};

/**
 * @this {Dashboard}
 */
Dashboard.prototype.redraw = function ()
{
  if (!this.canvas || !this.dataLoader.dataHeaders)
    return;

  var ctx = this.canvas.getContext("2d");
  ctx.beginPath();
  ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  ctx.closePath();

  this.drawHeader();

  var minCurrPW = this.canvas.width / 4;
  var currValPanelRect =
    {
      x: this.mode === Dashboard.MODE_BOTH ? this.canvas.width - minCurrPW : 0,
      y: Dashboard.HEADER_H,
      w: this.mode === Dashboard.MODE_BOTH ? minCurrPW : this.canvas.width,
      h: this.canvas.height - Dashboard.HEADER_H
    };
  var chartPanelRect =
    {
      x: 0,
      y: currValPanelRect.y,
      w: this.mode === Dashboard.MODE_BOTH ? currValPanelRect.x : this.canvas.width,
      h: currValPanelRect.h
    };

  if (this.dataLoader.currentRow && this.mode !== Dashboard.MODE_CHART)
    this.currentValuesPanel.draw(ctx, currValPanelRect, this.dataLoader.currentRow.sensorsData);

  if (this.mode !== Dashboard.MODE_CURR_VALUES)
    this.chartPanel.draw(ctx, chartPanelRect, this.dataLoader.dataHeaders, this.dataLoader.data, this.dataLoader.currentRow);

  this.redrawn = new Date().getTime();
};

/**
 * @this {Dashboard}
 */
Dashboard.prototype.drawHeader = function ()
{
  var s = window.devicePixelRatio;
  var ctx = this.canvas.getContext("2d");
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.lineWidth = s;
  ctx.strokeStyle = "red";
  ctx.rect(1, 1, this.canvas.width - 2, Dashboard.HEADER_H - 2);
  ctx.stroke();

  ctx.font = 8 * s + "pt Arial";
  var dy = Dashboard.HEADER_H - 2 - 3 * s;
  ctx.fillStyle = "white";
  ctx.fillText(formatTime(this.dataLoader.dataUpdated), this.canvas.width - 45 * s, dy);

  var now = new Date().getTime();
  if (this.dataLoader.currentRow)
  {
    var times = [this.dataLoader.currentSaved, this.dataLoader.currentRow.time];
    for (var i = 0; i < times.length; i++)
    {
      var ago = Math.floor((now - times[i]) / 1000);
      var ox = 157 * s;
      ctx.fillStyle = (i === 0 ? "white" : "gray");
      ctx.fillText(formatTime(times[i], true), i * ox + 4 * s, dy);
      ctx.fillText("(" + formatNumber(ago) + ")", i * ox + 112 * s, dy);
    }
  }

  ctx.fillStyle = "white";
  var text = "ver: " + this.version + "   scr: " + this.canvas.width + "x" + this.canvas.height + " (" + window.devicePixelRatio + ")";
  ctx.fillText(text, this.canvas.width - ctx.measureText(text).width - 3, this.canvas.height - 3 * window.devicePixelRatio);
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
  // var minMove = 20;
  // var slideDist = 70;
  var dx = this.downEvent !== null ? evt.clientX - this.downEvent.clientX : 0;
  var dy = this.downEvent !== null ? evt.clientY - this.downEvent.clientY : 0;
  // var mx = this.moveEvent !== null ? evt.clientX - this.moveEvent.clientX : 0;
  // var my = this.moveEvent !== null ? evt.clientY - this.moveEvent.clientY : 0;
  if (evt.type === "pointerdown")
  {
    this.downEvent = evt;
    // this.moveEvent = evt;
  }
  else if (evt.type === "pointerup")
  {
    if (dx < 3 && dy < 3)  // noinspection JSSuspiciousNameCombination
      this.click(Math.round(evt.clientX), Math.round(evt.clientY));

    this.downEvent = null;
  }
  // else if (evt.type === "pointermove" && this.downEvent != null)
  // {
  //   // log(evt.type, evt.clientX, evt.clientY);
  //   if (dy > minMove && Math.abs(dx) < minMove)   // down
  //   {
  //     if (dy > slideDist && !this.chartMode)
  //     {
  //       this.chartMode = true;
  //       this.redraw();
  //     }
  //   }
  //   else if (-dy > minMove && Math.abs(dx) < minMove)   // up
  //   {
  //     if (-dy > slideDist && this.chartMode)
  //     {
  //       this.chartMode = false;
  //       this.redraw();
  //     }
  //   }
  //   else if (evt.clientY > Dashboard.HEADER_H && Math.abs(my) < 10 && (mx > 2 || mx < -2))   // right / left
  //   {
  //     // this.updateDataIndex(this.currentDataIndex + Math.round(mx / 10));
  //   }
  //
  //   this.moveEvent = evt;
  // }

};

/**
 * @this {Dashboard}
 * @param {Number} x
 * @param {Number} y
 */
Dashboard.prototype.click = function (x, y)
{
  log("click on: " + x + ", " + y);
  if (y < Dashboard.HEADER_H)
  {
    if (this.portrait)
      this.mode = 1 - this.mode;    // switch between 0 and 1
    else
      this.mode = 3 - this.mode;    // switch between 1 and 2
    log("this.mode: " + this.mode);
  }
  else if (this.mode)
    this.chartPanel.click(x, y);

  this.redraw();
};
