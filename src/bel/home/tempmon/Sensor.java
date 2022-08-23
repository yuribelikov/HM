package bel.home.tempmon;

public class Sensor
{
  final String uid;
  final String id;


  Sensor(String uid, String id)
  {
    this.uid = uid;
    this.id = id;
  }

  boolean isRemote()
  {
    return id.equals("remote");
  }

  boolean isdht22()    // DHT22 (with Humidity) or DS18B20
  {
    return !id.startsWith("28-");
  }

  @Override
  public String toString()
  {
    return uid;
  }
}