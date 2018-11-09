package bel.home.tempmon;

public class Sensor
{
  final String uid;
  final String cmd;
  Float t = Float.NaN;
  Float h = Float.NaN;


  Sensor(String uid, String cmd)
  {
    this.uid = uid;
    this.cmd = cmd;
  }

  void reset()
  {
    t = Float.NaN;
    h = Float.NaN;
  }

  boolean isdht22()    // DHT22 (with Humidity) or DS18B20
  {
    return cmd.contains("dht22");
  }

  boolean hasData()
  {
    return t != Float.NaN;
  }

  @Override
  public String toString()
  {
    return "uid='" + uid + '\'' +
      ", t=" + t +
      ", h=" + h;
  }
}