package bel.home;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.text.SimpleDateFormat;
import java.util.*;

public class HM
{
  static final SimpleDateFormat DF = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss,SSS");
  static final String DATA_PATH = "data/";
  static final String PROPERTIES_FN = "hm.properties";
  private static final String LOG_FN = "log.txt";

  static String version = "2016.10.23";
  static Properties properties = null;
  private static TempMonProcess tempMonProcess;
  static StatusSaveProcess statusSaveProcess;
  static YDProcess ydProcess;


  public static void main(String[] args)
  {
    try
    {
      if (!Files.exists(Paths.get(LOG_FN)))
        Files.write(Paths.get(LOG_FN), "".getBytes(), StandardOpenOption.CREATE_NEW);

      log("--------------------------------------------------------------");
      log("version: " + version);

      reloadProperties();

      tempMonProcess = new TempMonProcess();
      statusSaveProcess = new StatusSaveProcess();
      ydProcess = new YDProcess();

      //noinspection StatementWithEmptyBody
      while (healthCheck()) ;

      tempMonProcess.isAlive = false;
      statusSaveProcess.isAlive = false;
      ydProcess.isAlive = false;

      log("finished.");
    }
    catch (Exception e)
    {
      err(e);
    }
  }

  private static boolean healthCheck()
  {
    try
    {
      String rebootOn = properties.getProperty("reboot.on");    // 56 (minutes of every hour) OR 23:56
      if (rebootOn != null)
      {
        int rebootHour = -1;
        int rebootMinute;
        if (rebootOn.contains(":"))
        {
          String[] sa = rebootOn.split(":");
          rebootHour = Integer.parseInt(sa[0]);
          rebootMinute = Integer.parseInt(sa[1]);
        } else
          rebootMinute = Integer.parseInt(rebootOn);

        Calendar c = Calendar.getInstance();
        int hour = c.get(Calendar.HOUR_OF_DAY);
        int minute = c.get(Calendar.MINUTE);
        log("hour: " + hour + ", minute: " + minute + ", rebootOn: " + rebootOn);
        if ((rebootHour == hour || rebootHour == -1) && minute == rebootMinute)
        {
          log("time to reboot..");
          reboot();
          return false;
        }
      }

      if ((System.currentTimeMillis() - tempMonProcess.lastSuccess) > 1000 * 60 * 5)
      {
        log("cannot get temperature data for more than 5 minutes, rebooting..");
        reboot();
        return false;
      }

      if ((System.currentTimeMillis() - statusSaveProcess.lastSuccess) > 1000 * 60 * 5)
      {
        log("cannot save status for more than 5 minutes, rebooting..");
        reboot();
        return false;
      }

      long t = System.currentTimeMillis();
      while (System.currentTimeMillis() - t < 30000)
        Thread.sleep(100);

    }
    catch (Exception e)
    {
      err(e);
      return false;
    }

    return true;
  }

  static void reloadProperties()
  {
    try
    {
      log("reloadProperties");
      File file = new File(PROPERTIES_FN);
      while ((ydProcess != null && ydProcess.copyingProps) || !file.exists())    // file can be under replacement from yandex.disk (deleted and created)
        Thread.sleep(100);

      Properties p = new Properties();
      FileInputStream fis = new FileInputStream(file);
      p.load(fis);
      fis.close();
      properties = p;
      log("properties reloaded");

    }
    catch (Exception e)
    {
      err(e);
    }
  }

  private static void reboot()
  {
    try
    {
      log("rebooting..");
      Runtime.getRuntime().exec("/sbin/reboot");
      log("reboot command sent.");
    }
    catch (Exception e)
    {
      err(e);
    }
  }

  static void log(Object obj)
  {
    String msg = DF.format(System.currentTimeMillis()) + ": " + obj;
    System.out.println(msg);
    try
    {
      Files.write(Paths.get(LOG_FN), (msg + System.lineSeparator()).getBytes(), StandardOpenOption.APPEND);
    }
    catch (IOException e)
    {
      err(e);
    }
  }

  static void err(Exception e)
  {
    log("error:");
    e.printStackTrace();
    try
    {
      StringWriter sw = new StringWriter();
      e.printStackTrace(new PrintWriter(sw));
      log(sw.toString());
    }
    catch (Exception e1)
    {
      e1.printStackTrace();
    }
  }

}

