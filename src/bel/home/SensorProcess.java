package bel.home;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Arrays;

public class SensorProcess extends Thread
{
  private final static long TIMEOUT = 10000;
  final static long TRY_TIMEOUT = 5000;

  boolean isAlive = true;
  private String cmd;
  private Process p = null;
  private BufferedReader br = null;
  boolean finished = false;
  float[] result = null;
  long tryStarted;


  public SensorProcess(String cmd)
  {
    this.cmd = cmd;
    start();
  }

  public void run()
  {
    long started = System.currentTimeMillis();
    boolean dht22 = cmd.contains("dht22");     // DHT22 (with Humidity) or DS18B20
    int tryN = 0;
    while (isAlive && System.currentTimeMillis() < started + TIMEOUT)
    {
      try
      {
        HM.log("SP, try: " + tryN);
        tryStarted = System.currentTimeMillis();
        boolean success = dht22 ? processResultLinesDHT22() : processResultLinesDS18B20();
        HM.log("SP, success: " + success + ", result: " + (result != null ? Arrays.toString(result) : null));
        if (success)
          break;

        tryN++;
        sleepMs(100 * tryN);
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
        result = new float[]{Float.NaN, Float.NaN};
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
        result = new float[]{Float.NaN};
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

  private void sleepMs(long ms)
  {
    try
    {
      long waitUntil = System.currentTimeMillis() + ms;
      while (isAlive && System.currentTimeMillis() < waitUntil)
        sleep(10);
    }
    catch (InterruptedException ignored)
    {
    }
  }
}