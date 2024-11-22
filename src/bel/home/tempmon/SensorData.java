package bel.home.tempmon;

public class SensorData
{
  final Sensor sensor;
  Float t = Float.NaN;
  Float h = Float.NaN;


  SensorData(Sensor sensor)
  {
    this.sensor = sensor;
  }

  boolean hasData()
  {
    return !t.isNaN() && t != 0.0f;
  }

  @Override
  public String toString()
  {
    return sensor.uid + ": t=" + t + ", h=" + h;
  }
}