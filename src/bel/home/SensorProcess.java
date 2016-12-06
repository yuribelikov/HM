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
  private final String id;
  private final String cmd;
  private final boolean dht22;     // DHT22 (with Humidity) or DS18B20
  private Process p = null;
  private BufferedReader br = null;
  boolean finished = false;
  private boolean killed = false;
  private ArrayList<String> execResult = null;
  float[] result = null;
  long tryStarted;


  public SensorProcess(String sensor, String cmd)
  {
    this.cmd = cmd;
    dht22 = cmd.contains("dht22");
    if (dht22)
      id = sensor + " (" + cmd.substring(cmd.lastIndexOf('/') + 1) + ")";
    else
      id = sensor + " (" + cmd.substring(cmd.indexOf("devices") + 8, cmd.lastIndexOf('/')) + ")";

    start();
  }

  public void run()
  {
    long started = System.currentTimeMillis();
    int tryN = 0;
    while (isAlive)
    {
      try
      {
        tryStarted = System.currentTimeMillis();
        exec();
        if (execResult != null)
          if (dht22 ? processResultLinesDHT22() : processResultLinesDS18B20())
            break;

        HM.log("SP, " + id + ": failed, try: " + tryN + ", exec: " + execResult + (killed ? " - killed" : ""));
        if (System.currentTimeMillis() >= started + TIMEOUT)
          break;

        tryN++;
        sleepMs(300 * tryN);
      }
      catch (Exception e)
      {
        HM.err(e);
      }
    }

    finished = true;
    HM.log("SP, " + id + ": " + (System.currentTimeMillis() < started + TIMEOUT ? "done" : "timeout") + ", exec: " + execResult +
      ", result: " + Arrays.toString(result) + " (" + (tryN > 0 ? "tries: " + (tryN + 1) + ", " : "") + (System.currentTimeMillis() - started) + " ms)");
  }

  private boolean processResultLinesDHT22()
  {
    for (String line : execResult)
    {
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
    for (String line : execResult)
    {
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

  private void exec()
  {
    try
    {
      killed = false;
      p = Runtime.getRuntime().exec(cmd);
      ArrayList<String> result = read(false);
      if (killed)
        return;

      boolean error = (result.size() == 0);
      if (error)
      {
        HM.log("SP, " + id + ": " + " failed, getting error info..");
        result = read(true);
      }

      p.waitFor();  // wait for process to complete
      execResult = result;
      if (error)
        HM.log("SP, " + id + ": " + " p.exitValue: " + p.exitValue());
    }
    catch (Exception e)
    {
      HM.err(e);
    }
  }

  private ArrayList<String> read(boolean error)
  {
    ArrayList<String> result = new ArrayList<>();
    try
    {
      br = new BufferedReader(new InputStreamReader(error ? p.getErrorStream() : p.getInputStream()));
      if (killed)
        return result;

      if (error)
        result.add("error:");
      String line;
      while ((line = br.readLine()) != null)
        result.add(line);
      br.close();
    }
    catch (Exception e)
    {
      HM.err(e);
    }
    return result;
  }

  void kill()
  {
    killed = true;
    try
    {
      if (p != null)
        p.destroy();
    }
    catch (Exception e)
    {
      HM.err(e);
    }
    try
    {
      if (br != null)
        br.close();
    }
    catch (Exception e)
    {
      HM.err(e);
    }

    HM.log("SP, " + id + ", killed.");
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