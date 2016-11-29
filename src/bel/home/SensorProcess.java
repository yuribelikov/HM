package bel.home;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Arrays;

public class SensorProcess extends Thread
{
  String sensor;
  String cmd;
  Process p = null;
  BufferedReader br = null;
  boolean finished = false;
  float[] result = null;


  public SensorProcess(String sensor, String cmd)
  {
    this.sensor = sensor;
    this.cmd = cmd;
    start();
  }

  public void run()
  {
//    HM.log("SP started, cmd: " + cmd).;
    boolean dht22 = cmd.contains("dht22");     // DHT22 (with Humidity) or DS18B20
    result = (dht22 ? new float[]{Float.NaN, Float.NaN} : new float[]{Float.NaN});
    for (int tryN = 0; tryN < 3; tryN++)    // 3 tries
    {
      try
      {
        HM.log("SP, try: " + tryN);
        boolean success = false;
        ArrayList<String> resultLines = exec();
        for (String line : resultLines)
        {
          HM.log("SP, line: " + line);
          if (dht22 && line.startsWith("Humidity"))   // DHT22, Humidity = 20.30 % Temperature = 24.60 *C
          {
            String[] sa = line.split("=");
            result[1] = Float.parseFloat(sa[1].substring(0, sa[1].indexOf("%")));   // humidity
            result[0] = Float.parseFloat(sa[2].substring(0, sa[2].indexOf("*")));     // temperature
            success = true;
            break;
          }
          else if (!dht22)      // DS18B20
          {
            if (line.contains("crc=") && !line.endsWith("YES"))   // 78 01 4b 46 1f ff 0c 10 fa : crc=fa YES
              break;                       // Read failed CRC check
            else if (line.contains("t="))          // 8 01 4b 46 1f ff 0c 10 fa t=23500
            {
              String[] sa = line.split("=");
              result[0] = Float.parseFloat(sa[1]) / 1000;
              success = true;
              break;
            }
          }
        }

        HM.log("SP, success: " + success + ", result: " + Arrays.toString(result));
        if (success)
          break;
      }
      catch (Exception e)
      {
        HM.err(e);
      }
    }

    finished = true;
//    HM.log("SP finished, cmd: " + cmd);
  }

  private ArrayList<String> exec()
  {
    ArrayList<String> result = new ArrayList<>();
    try
    {
      p = Runtime.getRuntime().exec(cmd);
      br = new BufferedReader(new InputStreamReader(p.getInputStream()));
      String line;
      while ((line = br.readLine()) != null)
        result.add(line);

      br.close();
      p.waitFor();  // wait for process to complete
    }
    catch (Exception e)
    {
      HM.err(e);
    }

    return result;
  }

  void kill()
  {
    HM.log("SP, killing.. cmd: " + cmd);

    try
    {
      p.destroy();
    }
    catch (Exception e)
    {
      HM.err(e);
    }
    try
    {
      br.close();
    }
    catch (Exception e)
    {
      HM.err(e);
    }

    HM.log("SP, killed. cmd: " + cmd);
    finished = true;
  }
}