package bel.home;

import java.io.*;
import java.net.ServerSocket;
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
  private static final String PROPERTIES_FN = "hm.properties";
  private static final String LOG_FN = "log.txt";

  static String version = "2017.03.29";
  static Properties properties = null;
  static TempMonProcess tempMonProcess;
  static StatusSaveProcess statusSaveProcess;
  static YDProcess ydProcess;
  private static boolean isAlive = true;
  private static boolean logsEnabled = true;
  static boolean emulationMode = false;
  private static long started = System.currentTimeMillis();


  public static void main(String[] args)
  {
    try
    {
      if (args.length == 1 && args[0].startsWith("-"))
      {
        if (args[0].contains("s"))
          logsEnabled = false;
        if (args[0].contains("e"))
          emulationMode = true;
      }

      if (!Files.exists(Paths.get(LOG_FN)))
        Files.write(Paths.get(LOG_FN), "".getBytes(), StandardOpenOption.CREATE_NEW);

      log("--------------------------------------------------------------");
      log("version: " + version);

      reloadProperties();

      tempMonProcess = new TempMonProcess();
      statusSaveProcess = new StatusSaveProcess();
      ydProcess = new YDProcess();
      waitingForStopCommand();

      boolean heath = true;
      while (isAlive && heath)
      {
        sleepSec(30);
        if (System.currentTimeMillis() - started > 120000)
          heath = healthCheck();
      }

      tempMonProcess.isAlive = false;
      statusSaveProcess.isAlive = false;
      ydProcess.isAlive = false;

      log("finished.");
    } catch (Exception e)
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

      if ((System.currentTimeMillis() - tempMonProcess.lastSuccess) > 1000 * 60 * 30)
      {
        log("cannot get temperature data for more than 30 minutes, rebooting..");
        reboot();
        return false;
      }

      if ((System.currentTimeMillis() - statusSaveProcess.lastSuccess) > 1000 * 60 * 30)
      {
        log("cannot save status for more than 30 minutes, rebooting..");
        reboot();
        return false;
      }

      if ((System.currentTimeMillis() - statusSaveProcess.lastSuccess) > 1000 * 150)
      {
        log("cannot save status for more than 150 seconds, restoring connection..");
        restoreConnection();
        return true;
      }

      log("healthCheck - ok");
    } catch (Exception e)
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

    } catch (Exception e)
    {
      err(e);
    }
  }

  private static void restoreConnection()
  {
    HM.log("restoreConnection(), checking router..");
    statusSaveProcess.killProcess();
    if (!statusSaveProcess.isAlive())
      statusSaveProcess = new StatusSaveProcess();

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
    } catch (Exception e)
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
      s.close();
      return true;
    } catch (Exception e)
    {
      HM.err(e);
    }
    return false;
  }

  private static void waitingForStopCommand()
  {
    new Thread()
    {
      public void run()
      {
        try
        {
          HM.log("waitingForStopCommand..");
          ServerSocket s = new ServerSocket(61234);
          s.accept();
          HM.log("=========================================");
          HM.log("stop command received, stopping threads..");
          tempMonProcess.isAlive = false;
          statusSaveProcess.isAlive = false;
          ydProcess.isAlive = false;
          isAlive = false;
          sleepSec(1000);
          HM.log("stopped.");
        } catch (Exception e)
        {
          HM.log("SSP, waitingForStopCommand error: " + e.getMessage() + ", cause: " + e.getCause().getMessage());
        }

      }
    }.start();
  }

  private static void sleepSec(long seconds)
  {
    try
    {
      long waitUntil = System.currentTimeMillis() + 1000 * seconds;
      while (isAlive && System.currentTimeMillis() < waitUntil)
        Thread.sleep(100);
    } catch (InterruptedException ignored)
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
    } catch (Exception e)
    {
      err(e);
    }
  }

  static void log(Object obj)
  {
    if (!logsEnabled)
      return;

    String msg = DF.format(System.currentTimeMillis()) + ": " + obj;
    System.out.println(msg);
    try
    {
      Files.write(Paths.get(LOG_FN), (msg + System.lineSeparator()).getBytes(), StandardOpenOption.APPEND);
    } catch (IOException e)
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
    } catch (Exception e1)
    {
      e1.printStackTrace();
    }
  }

}
