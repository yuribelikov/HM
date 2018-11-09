package bel.home.tempmon;

import org.apache.log4j.Logger;

import java.util.ArrayList;

public class SensorReadProcess extends Thread
{
  private static final Logger lgr = TempMon.lgr;
  private ArrayList<Sensor> sensors;
  private boolean sensorsUpdated = false;


  SensorReadProcess(ArrayList<Sensor> sensors)
  {
    this.sensors = sensors;
    start();
  }

  public void run()
  {
    lgr.info("SensorReadProcess is started for: " + sensors);
    while (!Thread.currentThread().isInterrupted())
    {
      for (Sensor sensor : sensors)
      {
        readFromSensor(sensor);
        Utils.sleep(100);
        if (sensorsUpdated)
          break;
      }
      Utils.sleep(100);
    }

    lgr.info("SensorReadProcess is stopped for: " + sensors);
  }

  private void readFromSensor(Sensor sensor)
  {
    try
    {
      SensorReader sensorReader = new SensorReader(sensor);
      sensorReader.read();
      if (sensor.hasData())
        TempMon.addSensorData(sensor);
    }
    catch (Exception e)
    {
      lgr.warn(e.getMessage(), e);
    }
  }

  void updateSensors(ArrayList<Sensor> sensors)
  {
    this.sensors = sensors;
    sensorsUpdated = true;
  }
}