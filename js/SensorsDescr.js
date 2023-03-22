/**
 * @constructor
 */
function SensorsDescr()
{
  /** @type {Object} */
  this.styles = [];

  this.styles.push({sensor: "outside.t", label: "Улица", color: "#60FF60"});
  this.styles.push({sensor: "winterGarden.t", label: "Зим. сад", color: "#88FF88"});
  this.styles.push({sensor: "underFloor.t", label: "Подпол", color: "#4444FF"});
  this.styles.push({sensor: "cellar.t", label: "Погреб", color: "#8888FF"});
  this.styles.push({sensor: "waterIn.t", label: "Насос", color: "#009999"});
  this.styles.push({sensor: "faucet.t", label: "Кран", color: "#44FFFF"});

  this.styles.push({sensor: "inside.h", label: "влажность", color: "#BBBBBB"});
  this.styles.push({sensor: "inside.t", label: "1-й этаж", color: "white"});
  this.styles.push({sensor: "secondFloor.t", label: "2-й этаж", color: "#CCCC00"});

  this.styles.push({sensor: "bedroom.t", label: "Спальня", color: "#FF00FF"});
  this.styles.push({sensor: "room.t", label: "Кабинет", color: "#AA00AA"});

  this.styles.push({sensor: "warmIn.t", label: "В котел", color: "#FFCC00"});
  this.styles.push({sensor: "warmDiff.t", label: "Нагрев", color: "gray"});
  this.styles.push({sensor: "warmOut.t", label: "Из котла", color: "red"});
  this.styles.push({sensor: "warmFloor.t", label: "Теп. пол", color: "#FF8800"});

  this.styles.push({sensor: "attic.t", label: "Чердак", color: "#888888"});
  this.styles.push({sensor: "chimney.t", label: "Труба", color: "#FFFF88"});
  this.styles.push({sensor: "test.t", label: "Тест", color: "gray"});
}
