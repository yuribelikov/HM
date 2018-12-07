/**
 * @constructor
 */
function SensorsDescr()
{
  /** @type {Object} */
  this.styles = {};

  this.styles["inside.t"] = {label: "Гост. t", color: "white"};
  this.styles["inside.h"] = {label: "Гост. h", color: "#BBBBBB"};
  this.styles["outside.t"] = {label: "Улица t", color: "#60FF60"};
  this.styles["outside.h"] = {label: "Улица h", color: "#00AA00"};
  this.styles["test.t"] = {label: "Тест", color: "gray"};
  this.styles["warmOut.t"] = {label: "Из печи", color: "red"};
  this.styles["warmFloor.t"] = {label: "Теп. пол", color: "#FF8800"};
  this.styles["warmIn.t"] = {label: "В печь", color: "#FFCC00"};
  this.styles["bedroom.t"] = {label: "Спальня", color: "#FF00FF"};
  this.styles["room.t"] = {label: "Кабинет", color: "#AA00AA"};
  this.styles["secondFloor.t"] = {label: "2-й этаж", color: "#CCCC00"};
  this.styles["winterGarden.t"] = {label: "Зим. сад", color: "#88FF88"};
  this.styles["cellar.t"] = {label: "Погреб", color: "#8888FF"};
  this.styles["underFloor.t"] = {label: "Подпол", color: "#4444FF"};
  this.styles["waterIn.t"] = {label: "Насос", color: "#009999"};
  this.styles["faucet.t"] = {label: "Кран", color: "#44FFFF"};
  this.styles["attic.t"] = {label: "Чердак", color: "#888888"};
  this.styles["chimney.t"] = {label: "Труба", color: "#FFFF88"};
}
