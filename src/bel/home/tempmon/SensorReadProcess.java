package bel.home.tempmon;

import org.apache.log4j.Logger;

import java.util.ArrayList;

public class SensorReadProcess extends Thread
{
  private static final Logger lgr = TempMon.lgr;
  boolean isAlive = true;
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
    while (isAlive)
    {
      for (Sensor sensor : sensors)
      {
        readFromSensor(sensor);
        Utils.sleep(Utils.parse(TempMon.properties.getProperty("read.delay.ms"), 10));
        if (sensorsUpdated)
        {
          sensorsUpdated = false;
          break;
        }
      }
      Utils.sleep(10);
    }

    lgr.info("SensorReadProcess is stopped for: " + sensors);
  }

  private void readFromSensor(Sensor sensor)
  {
    try
    {
      SensorReader sensorReader = new SensorReader(sensor);
      sensorReader.read();
      if (sensorReader.sensorData.hasData())
        TempMon.addSensorData(sensorReader.sensorData);
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