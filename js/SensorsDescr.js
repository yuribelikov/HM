/**
 * @constructor
 */
function SensorsDescr()
{
  /** @type {Object} */
  this.styles = {};

  this.styles["inside.t"] = {label: "Гостинная", color: "white", width: 3};
  this.styles["inside.h"] = {label: "Гост. влаж.", color: "white", width: 1};
  this.styles["outside.t"] = {label: "Улица", color: "#80FF80", width: 3};
  this.styles["outside.h"] = {label: "Улица влаж.", color: "#80FF80", width: 1};
  this.styles["test.t"] = {label: "Тест", color: "gray", width: 1};
  this.styles["warmOut.t"] = {label: "Выход из печи", color: "red", width: 2};
  this.styles["warm.floor.t"] = {label: "Пол в ванной", color: "#FF8800", width: 1};
  this.styles["warmIn.t"] = {label: "Вход в печь", color: "#FFCC00", width: 1};
  this.styles["bedroom.t"] = {label: "Спальня", color: "#AAAA00", width: 3};
  this.styles["room.t"] = {label: "Кабинет", color: "#888800", width: 2};
  this.styles["second.floor.t"] = {label: "2-й этаж", color: "#CCCC00", width: 2};
  this.styles["winter.garden.t"] = {label: "Зимний сад", color: "#88FF88", width: 2};
  this.styles["cellar.t"] = {label: "Погреб", color: "#8888FF", width: 1};
  this.styles["under.floor.t"] = {label: "Подпол", color: "#4444FF", width: 2};
  this.styles["water.in.t"] = {label: "Вод. насос", color: "#44FFFF", width: 2};
  this.styles["faucet.t"] = {label: "Кран", color: "#44FFFF", width: 1};
  this.styles["attic.t"] = {label: "Чердак", color: "#888888", width: 1};
  this.styles["chimney.t"] = {label: "Печ. труба", color: "#FFFF88", width: 1};
}

/*
inside.t = 22
inside.h = 34.4
outside.t = -3.6
outside.h = 70.1
test.t = 31.25
warmOut.t = 44.875
warm.floor.t = 33.75
warmIn.t = 32.187
bedroom.t = 20.5
room.t = 19.562
winter.garden.t = 8.625
cellar.t = 11.062
under.floor.t = 9.187
water.in.t = 10.562
faucet.t = 18.25
attic.t = 14.062
chimney.t = 46.062
*/