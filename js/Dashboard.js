/*global log parseDateTime, parseNumber, formatTime, formatNumber*/

/**
 * @constructor
 */
function Dashboard()
{
  this.version = "4.35";

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

  /** @type {Boolean} */
  this.soundsEnabled = false;
  /** @type {HTMLAudioElement} */
  this.beep = new Audio("data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");
  /** @type {number} */
  this.beeped = 0;

  /** @type {Object} */
  this.downEvent = null;
  /** @type {Object} */
  // this.moveEvent = null;

  this.start();
}

Dashboard.SCALE = 1;
Dashboard.HEADER_H = 17;
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
  // log("onResize");
  $('#vp').attr('content', 'width=device-width; initial-scale=1.0');
  if (this.canvas)
  {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.portrait = (this.canvas.height > this.canvas.width);
    if ((this.portrait && this.mode === Dashboard.MODE_BOTH) || (!this.portrait && this.mode === Dashboard.MODE_CURR_VALUES))
      this.mode = Dashboard.MODE_CHART;
    // log("portrait: " + this.portrait + ", mode: " + this.mode);
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
  if (this.dataLoader.dataHeaders && (this.redrawn < this.dataLoader.dataUpdated || now - this.redrawn > 800))
  {
    this.redraw();
    this.checkAndAlarm();
  }

  window.requestAnimationFrame(this.run.bind(this));
};

/**
 * @this {Dashboard}
 */
Dashboard.prototype.redraw = function ()
{
  if (!this.canvas || !this.dataLoader.dataHeaders)
    return;

  Dashboard.SCALE = 1 / window.visualViewport.scale;
  Dashboard.HEADER_H = 20 * Dashboard.SCALE;
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
    this.currentValuesPanel.draw(ctx, currValPanelRect, this.dataLoader.currentRow.sensorsData, this.dataLoader.data);

  if (this.mode !== Dashboard.MODE_CURR_VALUES)
    this.chartPanel.draw(ctx, chartPanelRect, this.dataLoader.dataHeaders, this.dataLoader.data, this.dataLoader.currentRow);

  this.redrawn = new Date().getTime();
};

/**
 * @this {Dashboard}
 */
Dashboard.prototype.drawHeader = function ()
{
  var s = Dashboard.SCALE;
  var ctx = this.canvas.getContext("2d");
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.lineWidth = s;
  ctx.strokeStyle = "red";
  ctx.rect(1, 1, this.canvas.width - 2, Dashboard.HEADER_H - 2);
  ctx.stroke();

  ctx.font = 10 * s + "pt Arial";
  var dy = Dashboard.HEADER_H - 2 - 4 * s;
  ctx.fillStyle = "white";
  ctx.fillText(formatTime(this.dataLoader.dataUpdated), this.canvas.width - 55 * s, dy);

  var now = new Date().getTime();
  if (this.dataLoader.currentRow)
  {
      var ago = Math.floor((now - this.dataLoader.currentSaved) / 1000);
      ctx.fillText(formatTime(this.dataLoader.currentSaved, true), 5, dy);
      ctx.fillText("(" + formatNumber(ago) + ")", 5 + 150 * s, dy);
  }

  ctx.fillStyle = "white";
  dy = this.canvas.height - 5;
  ctx.fillText(this.soundsEnabled ? "))o" : "X", 3, dy);

  var text = "ver: " + this.version + "   scr: " + window.visualViewport.width.toFixed() + "x" + window.visualViewport.height.toFixed() +
    " (" + window.visualViewport.scale.toFixed(3) + ") - " + Dashboard.SCALE.toFixed(3);
  ctx.fillText(text, this.canvas.width - ctx.measureText(text).width - 10, dy);
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
  var dx = this.downEvent !== null ? evt.clientX - this.downEvent.clientX : 0;
  var dy = this.downEvent !== null ? evt.clientY - this.downEvent.clientY : 0;
  if (evt.type === "pointerdown")
  {
    this.downEvent = evt;
  }
  else if (evt.type === "pointerup")
  {
    if (dx < 3 && dy < 3)  // noinspection JSSuspiciousNameCombination
      this.click(Math.round(evt.clientX), Math.round(evt.clientY));

    this.downEvent = null;
  }

};

/**
 * @this {Dashboard}
 * @param {Number} x
 * @param {Number} y
 */
Dashboard.prototype.click = function (x, y)
{
  log("click on: " + x + ", " + y);
  if (!this.soundsEnabled)
  {
    // this.beep.play();
    this.soundsEnabled = true;
  }

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

/**
 * @this {Dashboard}
 */
Dashboard.prototype.checkAndAlarm = function ()
{
  if (!this.soundsEnabled)
    return;

  var warmOut = this.dataLoader.currentRow.sensorsData["warmOut.t"];
  var edge = 90;
  var max = 100;
  if (warmOut > edge)
  {
    console.log(warmOut);
    var now = new Date().getTime();
    var delay = 1000 * (max - warmOut);   // 10 sec for 90t; 1 sec for 99t; 0 for 100t
    console.log(delay);
    if (now > this.beeped + delay)
    {
      this.beep.play();
      this.beeped = now;
    }
  }

};