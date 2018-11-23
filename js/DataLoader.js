/*global log parseDateTime parseNumber*/

/**
 * @constructor
 */
function DataLoader()
{
  /** @type {Boolean} */
  this.dataRequested = false;
  /** @type {Number} */
  this.dataUpdated = 0;

  /** @type {DataRow[]} */
  this.data = [];

  /** @type {DataRow} */
  this.currentRow = null;
  /** @type {Number} */
  this.currentSaved = 0;


  this.loadRecent();
}

/**
 * @constructor
 */
function DataRow(timeKey)
{
  /** @type {String} */
  this.timeKey = timeKey;
  /** @type {Number} */
  this.time = parseDateTime(timeKey);

  /** @type {Object} */
  this.sensorsData = {};      // map<sensorID, value}
}

DataLoader.REFRESH_PERIOD = 1;
DataLoader.DATA_SIZE = 1000;


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
    var rows = csv.split("\n");
    var dataHeaders = rows[0].split(";");
    for (var i = 1; i < rows.length; i++)
    {
      if (rows[i].length === 0)
        continue;

      var cells = rows[i].split(";");
      var dataRow = new DataRow(cells[0].trim());
      for (var j = 1; j < cells.length; j++)
        dataRow.sensorsData[dataHeaders[j]] = parseNumber(cells[j]);

      this.data.push(dataRow);
    }

    log("recentDataReceived, data.size: " + this.data.length);
  }
  catch (e)
  {
    log(e);
  }

  window.requestAnimationFrame(this.run.bind(this));
};

/**
 * @this {DataLoader}
 */
DataLoader.prototype.run = function ()
{
  var now = new Date().getTime();
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

  this.currentSaved = parseDateTime(saveTime);

  if (dataTime && (!this.currentRow || this.currentRow.timeKey !== dataTime))
  {
    if (this.currentRow)
      this.data.push(this.currentRow);
    this.currentRow = new DataRow(dataTime);

    if (this.data.length > 0)
    {
      var lastRow = this.data[this.data.length - 1];
      if (Object.assign)
        this.currentRow.sensorsData = Object.assign({}, lastRow.sensorsData);
    }
    if (this.data.length > DataLoader.DATA_SIZE)
      this.data.shift();
  }

  if (Object.assign)
    this.currentRow.sensorsData = Object.assign(this.currentRow.sensorsData, sensorsData);
  else
    this.currentRow.sensorsData = sensorsData;
  this.dataUpdated = new Date().getTime();
  this.dataRequested = false;
};
