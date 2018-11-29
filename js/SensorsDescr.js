/**
 * @constructor
 */
function SensorsDescr()
{
  /** @type {Object} */
  this.styles = {};

  this.styles["inside.t"] = {color: "white", width: 3};
  this.styles["inside.h"] = {color: "white", width: 1};
  this.styles["outside.t"] = {color: "#80FF80", width: 3};
  this.styles["outside.h"] = {color: "#80FF80", width: 1};
  this.styles["test.t"] = {color: "gray", width: 1};
  this.styles["warmOut.t"] = {color: "red", width: 2};
  this.styles["warm.floor.t"] = {color: "#FF8800", width: 1};
  this.styles["warmIn.t"] = {color: "#FFCC00", width: 1};
  this.styles["bedroom.t"] = {color: "#AAAA00", width: 3};
  this.styles["second.floor.t"] = {color: "#CCCC00", width: 2};
  this.styles["room.t"] = {color: "#888800", width: 2};
  this.styles["winter.garden.t"] = {color: "#88FF88", width: 2};
  this.styles["cellar.t"] = {color: "#8888FF", width: 1};
  this.styles["under.floor.t"] = {color: "#4444FF", width: 2};
  this.styles["water.in.t"] = {color: "#44FFFF", width: 2};
  this.styles["faucet.t"] = {color: "#44FFFF", width: 1};
  this.styles["attic.t"] = {color: "#888888", width: 1};
  this.styles["chimney.t"] = {color: "#FFFF88", width: 1};
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