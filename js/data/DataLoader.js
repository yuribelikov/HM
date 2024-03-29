/*global DataRow log parseDateTime parseNumber*/

/**
 * @constructor
 */
function DataLoader()
{
  /** @type {Boolean} */
  this.dataRequested = false;
  /** @type {Number} */
  this.dataUpdated = 0;

  /** @type {String[]} */
  this.dataHeaders = null;
  /** @type {DataRow[]} */
  this.data = [];

  /** @type {DataRow} */
  this.currentRow = null;
  /** @type {Number} */
  this.currentSaved = 0;


  this.loadRecent();
}

DataLoader.REFRESH_PERIOD = 1;
DataLoader.DATA_SIZE = 2000;
DataLoader.WARM_DIFF_SENSOR = "warmDiff.t";


/**
 * @this {DataLoader}
 */
DataLoader.prototype.loadRecent = function ()
{
  log("DataLoader: loading recent.csv");
  $.get("data/recent.csv", {"_": $.now()}, this.recentDataReceived.bind(this));
};

/**
 * @this {DataLoader}
 * @param {string} csv
 */
DataLoader.prototype.recentDataReceived = function (csv)
{
  try
  {
    log("recentDataReceived, file size: " + csv.length);
    const rows = csv.replace("\r", "").split("\n");
    const dataHeaders = rows[0].split(";");

    log(window.location);
    let tt;
    if (window.location.host === "localhost")
    {
      tt = new Date();
      tt.setTime(tt.getTime() - (rows.length - 1) * 60000);
      log("test time: " + tt);
    }

    for (let i = 1; i < rows.length; i++)
    {
      if (rows[i].length === 0)
        continue;

      const cells = rows[i].split(";");
      if (tt)     // 2023-03-22_23:49
      {
        tt.setTime(tt.getTime() + 60000);
        cells[0] = this.timeToStr(tt);
        // log(cells[0]);
      }

      const dataRow = new DataRow(cells[0].trim());
      for (let j = 1; j < cells.length; j++)
        dataRow.sensorsData[dataHeaders[j]] = parseNumber(cells[j]);

      // log(dataRow.timeKey, dataRow.time);
      dataRow.sensorsData[DataLoader.WARM_DIFF_SENSOR] = parseNumber(dataRow.sensorsData["warmOut.t"] - dataRow.sensorsData["warmIn.t"]);
      this.data.push(dataRow);
      if (this.data.length >= DataLoader.DATA_SIZE)
        this.data.shift();
    }

    dataHeaders.shift();
    dataHeaders.push(DataLoader.WARM_DIFF_SENSOR);
    this.dataHeaders = dataHeaders;
    log("recentDataReceived, data.size: " + this.data.length);
    if (this.data.length > 0)
      log("last row: " + this.data[this.data.length - 1].toString());
  } catch (e)
  {
    log(e);
  }

  window.requestAnimationFrame(this.run.bind(this));
};

DataLoader.prototype.timeToStr = function (tt)
{
  return tt.getFullYear() + '-' + pad(tt.getMonth() + 1) + '-' + pad(tt.getDate()) + '_' + pad(tt.getHours()) + ':' + pad(tt.getMinutes());
}

/**
 * @this {DataLoader}
 */
DataLoader.prototype.run = function ()
{
  var now = new Date().getTime();
  if (now - this.dataUpdated >= 30000)    // this.dataRequested stays true if there was an error on loading current.txt
    this.dataRequested = false;

  if (!this.dataRequested && now - this.dataUpdated >= DataLoader.REFRESH_PERIOD * 1000)
  {
    $.get("data/current.txt", {"_": $.now()}, this.currentDataReceived.bind(this));
    this.dataRequested = true;
  }

  window.requestAnimationFrame(this.run.bind(this));
};


/**
 * @this {DataLoader}
 * @param {String} map
 */
DataLoader.prototype.currentDataReceived = function (map)
{
  // log("dataReceived: " + map.length);
  var saveTime;
  var dataTime;
  var sensorsData = {};
  var rows = map.split("\n");
  for (var i = 0; i < rows.length; i++)
  {
    var sa = rows[i].split("=");
    if (sa[0] && sa[1])
    {
      var key = sa[0].trim();
      var value = sa[1].trim();
      if (key === "save.time")
        saveTime = value;
      else if (key === "data.time")
        dataTime = value;
      else
        sensorsData[key] = parseNumber(value);
    }
  }

  if (window.location.host === "localhost")
  {
    const now = new Date();
    dataTime = this.timeToStr(now);
    saveTime = dataTime;
    // log("dataTime: " + dataTime);
  }

  sensorsData[DataLoader.WARM_DIFF_SENSOR] = parseNumber(sensorsData["warmOut.t"] - sensorsData["warmIn.t"]);

  this.currentSaved = parseDateTime(saveTime);

  if (dataTime && (!this.currentRow || this.currentRow.timeKey !== dataTime))
  {
    if (this.currentRow && parseDateTime(dataTime) - this.currentRow.time > 120000)    // data wasn't updated by some reason for some time..
      location.reload();

    if (this.currentRow)
      this.data.push(this.currentRow);
    this.currentRow = new DataRow(dataTime);

    if (this.data.length > 0)
    {
      var lastRow = this.data[this.data.length - 1];
      this.copySensorsData(lastRow.sensorsData, this.currentRow.sensorsData);
    }

    if (this.data.length > DataLoader.DATA_SIZE)
      this.data.shift();

    log("current row rotated, data.size: " + this.data.length);
  }

  this.copySensorsData(sensorsData, this.currentRow.sensorsData);
  this.dataUpdated = new Date().getTime();
  this.dataRequested = false;
};

/**
 * @this {DataLoader}
 * @param {Object} from
 * @param {Object} to
 */
DataLoader.prototype.copySensorsData = function (from, to)
{
  for (var property in from)
    if (from.hasOwnProperty(property) && !isNaN(from[property]))
      to[property] = from[property];
};
