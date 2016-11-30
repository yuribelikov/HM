package bel.home;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Arrays;

public class SensorProcess extends Thread
{
  final static long TIMEOUT = 10000;

  private String cmd;
  private Process p = null;
  private BufferedReader br = null;
  boolean finished = false;
  float[] result = null;
  long started;
  int tryN = 0;


  public SensorProcess(String cmd)
  {
    this.cmd = cmd;
    start();
  }

  public void run()
  {
    started = System.currentTimeMillis();
    boolean dht22 = cmd.contains("dht22");     // DHT22 (with Humidity) or DS18B20
    result = (dht22 ? new float[]{Float.NaN, Float.NaN} : new float[]{Float.NaN});
    while (System.currentTimeMillis() < started + TIMEOUT)
    {
      try
      {
        HM.log("SP, try: " + tryN);
        boolean success = dht22 ? processResultLinesDHT22() : processResultLinesDS18B20();
        HM.log("SP, success: " + success + ", result: " + Arrays.toString(result));
        if (success)
          break;

        tryN++;
        sleep(100 * tryN);
      }
      catch (Exception e)
      {
        HM.err(e);
      }
    }

    finished = true;
    HM.log("SP, finished, cmd: " + cmd);
  }

  private boolean processResultLinesDHT22()
  {
    for (String line : exec())
    {
      HM.log("SP, line: " + line);
      if (line.startsWith("Humidity"))   // Humidity = 20.30 % Temperature = 24.60 *C
      {
        String[] sa = line.split("=");
        result[1] = Float.parseFloat(sa[1].substring(0, sa[1].indexOf("%")));   // humidity
        result[0] = Float.parseFloat(sa[2].substring(0, sa[2].indexOf("*")));     // temperature
        return true;
      }
    }

    return false;
  }

  private boolean processResultLinesDS18B20()
  {
    for (String line : exec())
    {
      HM.log("SP, line: " + line);
      if (line.contains("crc=") && !line.endsWith("YES"))   // 78 01 4b 46 1f ff 0c 10 fa : crc=fa YES
        return false;                       // Read failed CRC check

      if (line.contains("t="))          // 8 01 4b 46 1f ff 0c 10 fa t=23500
      {
        String[] sa = line.split("=");
        result[0] = Float.parseFloat(sa[1]) / 1000;
        return true;
      }
    }

    return false;
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
  }
}