package bel.home;

import java.io.*;
import java.net.Socket;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Properties;

public class HM
{
  static final SimpleDateFormat DF = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss,SSS");
  static final String DATA_PATH = "data/";
  static final String PROPERTIES_FN = "hm.properties";
  private static final String LOG_FN = "log.txt";

  static String version = "2016.11.19j";
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

      boolean heath = true;
      while (heath)
      {
        sleepSec(10);
        heath = healthCheck();
      }

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
      log("healthCheck..");
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
        }
        else
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

      if ((System.currentTimeMillis() - tempMonProcess.lastSuccess) > 1000 * 60 * 30)
      {
        log("cannot get temperature data for more than 30 minutes, rebooting..");
        reboot();
        return false;
      }

      if ((System.currentTimeMillis() - statusSaveProcess.lastSuccess) > 1000 * 90)
      {
        log("cannot save status for more than 90 seconds, restoring connection..");
        restoreConnection();
        return true;
      }

      if ((System.currentTimeMillis() - statusSaveProcess.lastSuccess) > 1000 * 60 * 30)
      {
        log("cannot save status for more than 30 minutes, rebooting..");
        reboot();
        return false;
      }

      log("healthCheck - ok");
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

  private static void restoreConnection()
  {
    HM.log("restoreConnection(), checking router..");
    statusSaveProcess.killConnections();
    if (checkRouter())
      return;

    byte wifiReboots = 0;
    while (true)
    {
      rebootWiFi();
      wifiReboots++;
      if (checkRouter())
        break;

      sleepSec(60 * wifiReboots);
    }

    HM.log("restoreConnection(), wifiReboots: " + wifiReboots);
  }

  private static void rebootWiFi()
  {
    try
    {
      String cmd = "sudo /sbin/ifdown wlan0";
      HM.log("turning down WiFi: " + cmd);
      Runtime.getRuntime().exec(cmd).waitFor();
      HM.log("waiting for 10 seconds..");
      sleepSec(10);
      cmd = "sudo /sbin/ifup --force wlan0";
      HM.log("turning up WiFi: " + cmd);
      Runtime.getRuntime().exec(cmd).waitFor();
      HM.log("waiting for 20 seconds..");
      sleepSec(20);
    }
    catch (Exception e)
    {
      HM.err(e);
    }
  }

  static boolean checkRouter()
  {
    try
    {
      String router = "192.168.1.1";
      HM.log("checking WiFi with router: " + router);
      Socket s = new Socket(router, 80);
      HM.log("WiFi is OK, router socket: " + s);
      return true;
    }
    catch (Exception e)
    {
      HM.err(e);
    }
    return false;
  }

  private static void sleepSec(long seconds)
  {
    try
    {
      Thread.sleep(1000 * seconds);
    }
    catch (InterruptedException ignored)
    {
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

