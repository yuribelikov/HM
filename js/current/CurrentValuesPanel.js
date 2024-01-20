/*global log tempColorFromValue*/

/**
 * @constructor
 */
function CurrentValuesPanel()
{
  /** @type {Sensor[]} */
  this.sensors = [];

  this.init();
}

/**
 * @this {CurrentValuesPanel}
 */
CurrentValuesPanel.prototype.init = function ()
{
  this.sensors.push(new Sensor(0, 0, 0.6, 0.34, "outside.t", "Улица", 1));
  this.sensors.push(new Sensor(0.6, 0, 0.4, 0.17, "winterGarden.t", "Зим. сад", 2));
  this.sensors.push(new Sensor(0.6, 0.17, 0.4, 0.17, "cellar.t", "Погреб", 24));

  this.sensors.push(new Sensor(0, 0.35, 0.5, 0.22, "inside.t", "1й этаж", 4));
  this.sensors.push(new Sensor(0.5, 0.35, 0.5, 0.22, "secondFloor.t", "2й этаж", 4));

  this.sensors.push(new Sensor(0, 0.58, 0.5, 0.18, "bedroom.t", "Спальня", 4));
  this.sensors.push(new Sensor(0.5, 0.58, 0.5, 0.18, "room.t", "Кабинет", 4));

  this.sensors.push(new Sensor(0, 0.77, 0.33, 0.1, "warmIn.t", "Котёл: вход", 0.2));
  this.sensors.push(new Sensor(0.33, 0.82, 0.3, 0.1, DataLoader.WARM_DIFF_SENSOR, "Нагрев", 0.1));
  this.sensors.push(new Sensor(0, 0.87, 0.33, 0.1, "warmOut.t", "Выход", 0.2));
  this.sensors.push(new Sensor(0.63, 0.77, 0.37, 0.2, "warmFloor.t", "Тёплый пол", 0.2));
};

/**
 * @this {CurrentValuesPanel}
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} rect
 * @param {Object} currentData
 * @param {Object} data
 */
CurrentValuesPanel.prototype.draw = function (ctx, rect, currentData, data)
{
  for (let i = 0; i < this.sensors.length; i++)
    this.sensors[i].draw(ctx, rect, currentData, data);
};
