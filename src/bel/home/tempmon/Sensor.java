package bel.home.tempmon;

public class Sensor
{
  final String uid;
  final String cmd;


  Sensor(String uid, String cmd)
  {
    this.uid = uid;
    this.cmd = cmd;
  }

  boolean isdht22()    // DHT22 (with Humidity) or DS18B20
  {
    return cmd.contains("dht22");
  }

  @Override
  public String toString()
  {
    return uid;
  }
}