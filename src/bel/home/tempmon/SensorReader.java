package bel.home.tempmon;

import org.apache.log4j.Logger;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;

public class SensorReader
{
  private static final Logger lgr = TempMon.lgr;

  final SensorData sensorData;
  private Process p = null;
  private BufferedReader br = null;
  private boolean killed = false;


  SensorReader(Sensor sensor)
  {
    this.sensorData = new SensorData(sensor);
  }

  void read()
  {
    long started = Utils.now();
    long timeout = 1000 * Utils.parse(TempMon.properties.getProperty("sensor.read.timeout"), 2);
    new Thread(this::exec).start();
    lgr.debug(sensorData.sensor.uid + ": waiting " + timeout + " ms for response..");
    while (!sensorData.hasData() && Utils.now() - started < timeout)
      Utils.sleep(10);

    if (!sensorData.hasData())
    {
      lgr.debug(sensorData.sensor.uid + ": no data - killing..");
      kill();
    }
    else
      lgr.debug(sensorData + " - ok");
  }

  private void exec()
  {
    try
    {
      lgr.debug("exec: " + sensorData.sensor.uid + " -> " + sensorData.sensor.cmd);
      killed = false;
      ArrayList<String> result;
      if (TempMon.emulationMode)
      {
        Utils.sleep(Math.round(2700 * Math.random()));
        result = new ArrayList<>();
        result.add("emulation fake string..");
        if (sensorData.sensor.isdht22())
          result.add("Humidity = 20.30 % Temperature = 24.60 *C");
        else
        {
          result.add("78 01 4b 46 1f ff 0c 10 fa : crc=fa YES");
          result.add("8 01 4b 46 1f ff 0c 10 fa t=23500");
        }
        lgr.debug("result: " + result);
      }
      else
      {
        p = Runtime.getRuntime().exec(sensorData.sensor.cmd);
        result = readFromCmd();
      }

      if (killed || result.size() == 0)
        return;

      if (!TempMon.emulationMode)
        p.waitFor();  // wait for process to complete

      if (sensorData.sensor.isdht22())
        processResultLinesDHT22(result);
      else
        processResultLinesDS18B20(result);
    }
    catch (Exception e)
    {
      lgr.warn(e);
    }
  }

  private ArrayList<String> readFromCmd()
  {
    ArrayList<String> result = new ArrayList<>();
    br = new BufferedReader(new InputStreamReader(p.getInputStream()));
    if (!killed)
      readLines(br, result);

    if (result.size() > 0 || killed)
      return result;

    br = new BufferedReader(new InputStreamReader(p.getErrorStream()));
    result.add("error:");
    readLines(br, result);
    result.add("p.exitValue: " + p.exitValue());

    lgr.debug("result: " + result);
    return result;
  }

  private void readLines(BufferedReader br, ArrayList<String> result)
  {
    try
    {
      String line;
      while ((line = br.readLine()) != null)
        result.add(line);
      br.close();
    }
    catch (IOException e)
    {
      lgr.warn(e.getMessage(), e);
    }
  }

  private void kill()
  {
    killed = true;
    try
    {
      if (p != null)
        p.destroy();
    }
    catch (Exception e)
    {
      lgr.warn(e);
    }
    try
    {
      if (br != null)
        br.close();
    }
    catch (Exception e)
    {
      lgr.warn(e);
    }

    lgr.warn(sensorData.sensor.uid + " is killed.");
  }

  private void processResultLinesDHT22(ArrayList<String> result)
  {
    for (String line : result)
      if (line.startsWith("Humidity"))   // Humidity = 20.30 % Temperature = 24.60 *C
      {
        String[] sa = line.split("=");
        sensorData.h = Float.parseFloat(sa[1].substring(0, sa[1].indexOf("%")));   // humidity
        sensorData.t = Float.parseFloat(sa[2].substring(0, sa[2].indexOf("*")));     // temperature
        break;
      }
  }

  private void processResultLinesDS18B20(ArrayList<String> result)
  {
    for (String line : result)
      if (line.contains("crc=") && !line.endsWith("YES"))   // 78 01 4b 46 1f ff 0c 10 fa : crc=fa YES
        break;                       // Read failed CRC check
      else if (line.contains("t="))          // 8 01 4b 46 1f ff 0c 10 fa t=23500
      {
        String[] sa = line.split("=");
        sensorData.t = Float.parseFloat(sa[1]) / 1000;
        break;
      }
  }

}