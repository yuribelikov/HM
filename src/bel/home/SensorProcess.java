package bel.home;

import java.io.BufferedReader;
import java.io.InputStreamReader;
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
    try
    {
      p = Runtime.getRuntime().exec(cmd);
      br = new BufferedReader(new InputStreamReader(p.getInputStream()));
      String line;
      while ((line = br.readLine()) != null)
      {
//        HM.log(line);
        if (dht22 && line.startsWith("Humidity"))   // Humidity = 20.30 % Temperature = 24.60 *C
        {
          String[] sa = line.split("=");
          result[1] = Float.parseFloat(sa[1].substring(0, sa[1].indexOf("%")));   // humidity
          result[0] = Float.parseFloat(sa[2].substring(0, sa[2].indexOf("*")));     // temperature
          break;
        }
        else if (!dht22 && line.contains("t="))   // 90 01 4b 46 1f ff 0c 10 a3 t=25000
        {
          String[] sa = line.split("=");
          result[0] = Float.parseFloat(sa[1]) / 1000;
          break;
        }
      }

      br.close();
      p.waitFor();  // wait for process to complete
      HM.log("result: " + Arrays.toString(result));
    }
    catch (Exception e)
    {
      HM.err(e);
    }
    finished = true;
//    HM.log("SP finished, cmd: " + cmd);
  }

  void kill()
  {
    HM.log("killing SP.. cmd: " + cmd);

    try { p.destroy(); } catch (Exception e) { HM.err(e); }
    try { br.close(); } catch (Exception e) { HM.err(e); }

    HM.log("SP killed, cmd: " + cmd);
    finished = true;
  }
}