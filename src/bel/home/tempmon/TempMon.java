package bel.home.tempmon;

import org.apache.log4j.BasicConfigurator;
import org.apache.log4j.Logger;
import org.apache.log4j.PropertyConfigurator;

import java.io.File;
import java.io.FileInputStream;
import java.net.ServerSocket;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Properties;

public class TempMon
{
  static final Logger lgr = Logger.getLogger("tempmon");

  private static boolean isAlive = true;
  static Properties properties = null;
  private static long propertiesUpdated = 0;
  private static SensorReadProcess sensorReadProcessT;
  private static SensorReadProcess sensorReadProcessTH;
  private static DataManager dataManager;
  static boolean emulationMode = false;


  public static void main(String[] args)
  {
    try
    {
      PropertyConfigurator.configure("hm_log4j.properties");

      lgr.info("--------------------------------------------------------------");
      String jarFile = "hm.jar";
      File file = new File(jarFile);
      lgr.info(jarFile + " modified: " + Utils.timeFormat(file.lastModified(), Utils.DF_PRESIZE));
      emulationMode = (args.length == 1 && args[0].equals("-e"));
      lgr.info("emulationMode: " + emulationMode);

      checkAndReloadProperties();
      waitingForStopCommand();

//      tempMonProcess = new TempMonProcess();    // todo
//      statusSaveProcess = new StatusSaveProcess();
//      ydProcess = new YDProcess();

      dataManager = new DataManager();
      while (isAlive)
      {
        if (checkAndReloadProperties())
          updateSensorReaders();

        checkAndReboot();
        Utils.sleep(1000);
      }

      lgr.info("main() finished.");
    }
    catch (Exception e)
    {
      lgr.warn(e);
    }
  }

  private static boolean checkAndReloadProperties()
  {
    try
    {
      File file = new File("hm.properties");
      lgr.debug("check properties file modified: " + Utils.timeFormat(file.lastModified(), Utils.DF_PRESIZE));
      if (file.lastModified() <= propertiesUpdated)
        return false;

      lgr.info("reloadProperties..");
      Properties p = new Properties();
      FileInputStream fis = new FileInputStream(file);
      p.load(fis);
      fis.close();
      properties = p;
      propertiesUpdated = Utils.now();
      lgr.info("properties reloaded");
      return true;

    }
    catch (Exception e)
    {
      lgr.warn(e);
      return false;
    }
  }

  private static void updateSensorReaders()
  {
    String[] sa = properties.getProperty("sensors").split(" ");
    ArrayList<Sensor> tSensors = new ArrayList<>();
    ArrayList<Sensor> thSensors = new ArrayList<>();
    for (String sensorUID : sa)
    {
      String sensorCMD = properties.getProperty(sensorUID);
      if (sensorCMD != null)
      {
        Sensor sensor = new Sensor(sensorUID, sensorCMD);
        if (sensor.isdht22())
          thSensors.add(sensor);
        else
          tSensors.add(sensor);
      }
    }

    if (sensorReadProcessT == null)   // first time
    {
      sensorReadProcessT = new SensorReadProcess(tSensors);
      sensorReadProcessTH = new SensorReadProcess(thSensors);
    }
    else
    {
      sensorReadProcessT.updateSensors(tSensors);
      sensorReadProcessTH.updateSensors(thSensors);
    }

    dataManager.updateSensors(sa);
  }

  static void addSensorData(Sensor sensor)
  {
    dataManager.addSensorData(sensor);
  }

  private static void checkAndReboot()
  {
    try
    {
      lgr.info("healthCheck..");
      String rebootOn = properties.getProperty("reboot.on");    // 57 (minutes of every hour) OR 01:57
      if (rebootOn != null)
      {
        int rebootHour = -1;
        int rebootMinute;
        if (rebootOn.contains(":"))
        {
          String[] sa = rebootOn.split(":");
          rebootHour = Utils.parse(sa[0], 1);
          rebootMinute = Utils.parse(sa[1], 57);
        }
        else
          rebootMinute = Utils.parse(rebootOn, 57);

        Calendar c = Calendar.getInstance();
        int hour = c.get(Calendar.HOUR_OF_DAY);
        int minute = c.get(Calendar.MINUTE);
        lgr.info("hour: " + hour + ", minute: " + minute + ", rebootOn: " + rebootOn);
        if ((rebootHour == hour || rebootHour == -1) && minute == rebootMinute)
        {
          lgr.info("time to reboot..");
          stop();
          reboot();
        }
      }

      lgr.info("healthCheck - ok");
    }
    catch (Exception e)
    {
      lgr.warn(e);
    }
  }

  private static void waitingForStopCommand()
  {
    new Thread(() -> {
      try
      {
        lgr.info("waitingForStopCommand..");
        ServerSocket s = new ServerSocket(61234);
        s.accept();
        stop();
      }
      catch (Exception e)
      {
        lgr.warn(e);
      }

    }).start();
  }

  private static void stop()
  {
    lgr.info("stop command received, stopping threads..");
    if (sensorReadProcessT != null)
      sensorReadProcessT.interrupt();
    if (sensorReadProcessTH != null)
      sensorReadProcessTH.interrupt();

    isAlive = false;
    Utils.sleep(1000);
    lgr.info("stopped.");
    lgr.info("=========================================");
  }

  private static void reboot()
  {
    try
    {
      lgr.info("rebooting..");
      Runtime.getRuntime().exec("/sbin/reboot");
      lgr.info("reboot command sent.");
    }
    catch (Exception e)
    {
      lgr.warn(e);
    }
  }

}
