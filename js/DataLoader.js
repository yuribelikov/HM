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
    var dataHeaders = rows[0].split(";").slice(1);
    for (var i = 1; i < rows.length; i++)
    {
      if (rows[i].length === 0)
        continue;

      var cells = rows[i].split(";");
      var dataRow = new DataRow(cells[0].trim());
      for (var j = 1; j < cells.length; j++)
        dataRow.sensorsData[dataHeaders[j]] = parseNumber(cells[j]);

      data.push(dataRow);
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
  var currentData = {};
  var rows = map.split("\n");
  for (var i = 0; i < rows.length; i++)
  {
    var sa = rows[i].split("=");
    if (sa[0] && sa[1])
    {
      var value = sa[1].trim();
      currentData[sa[0].trim()] = (value.indexOf("-") === -1 ? parseNumber(value) : parseDateTime(value));
    }
  }

  if (currentData["save.time"])
    this.currentSaved = parseDateTime(value);

  var currentDataTime = currentData["data.time"];
  if (currentDataTime && (!this.currentRow || this.currentRow.time !== currentDataTime))
  {
    if (this.currentRow)
      this.data.push(this.currentRow);
    this.currentRow = new DataRow(currentDataTime);
  }

  this.dataUpdated = new Date().getTime();
  this.dataRequested = false;
};
