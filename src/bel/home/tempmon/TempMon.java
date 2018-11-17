package bel.home.tempmon;

import org.apache.log4j.Logger;
import org.apache.log4j.PropertyConfigurator;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStreamReader;
import java.net.ServerSocket;
import java.util.*;

public class TempMon
{
  static final Logger lgr = Logger.getLogger("tempmon");

  static boolean isAlive = true;
  static Properties properties = null;
  private static long propertiesUpdated = 0;
  static final HashMap<String, Sensor> sensors = new HashMap<>();
  private static SensorReadProcess sensorReadProcessT = null;
  private static SensorReadProcess sensorReadProcessTH = null;
  private static DataManager dataManager = null;
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
      updateSensorReaders();
      waitingForStopCommand();
      if (!emulationMode)
        scanForNewSensors();

//      ydProcess = new YDProcess();    // todo

      while (isAlive)
      {
        if (checkAndReloadProperties())
          updateSensorReaders();

        checkAndReboot();
        while (isAlive)
          Utils.sleep(10);
      }

      lgr.info("main() finished.");
    }
    catch (Exception e)
    {
      lgr.warn(e.getMessage(), e);
    }
  }

  private static boolean checkAndReloadProperties()
  {
    try
    {
      File file = new File("hm.properties");
//      lgr.debug("check properties file modified: " + Utils.timeFormat(file.lastModified(), Utils.DF_PRESIZE));
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
      lgr.warn(e.getMessage(), e);
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
        sensors.put(sensor.uid, sensor);
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

    if (dataManager == null)
      dataManager = new DataManager();

    dataManager.updateSensors(sa);
  }

  private static void scanForNewSensors()
  {
    try
    {
      lgr.info("scanning for new DS18B20 sensors");
      Process p = Runtime.getRuntime().exec("ls " + properties.getProperty("ds18b20.path"));     // ls /sys/bus/w1/devices
      BufferedReader br = new BufferedReader(new InputStreamReader(p.getInputStream()));
      String line;
      StringBuilder output = new StringBuilder();
      while ((line = br.readLine()) != null)
        output.append(line).append(' ');
      br.close();

      String[] sa = output.toString().split(" ");
      HashSet<Object> allSensorsIds = new HashSet<>();
      for (String s : sa)
        if (s.startsWith("28-"))
          allSensorsIds.add(s.trim());

      allSensorsIds.removeAll(properties.values());
      if (allSensorsIds.size() > 0)
        lgr.warn("Unregistered sensors: " + allSensorsIds);

    }
    catch (Exception e)
    {
      lgr.warn(e.getMessage(), e);
    }
  }

  static void addSensorData(SensorData sensorData)
  {
    if (dataManager != null)
      dataManager.addSensorData(sensorData);
  }

  private static void checkAndReboot()
  {
    try
    {
//      lgr.debug("checkAndReboot..");
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
//        lgr.debug("hour: " + hour + ", minute: " + minute + ", rebootOn: " + rebootOn);
        if ((rebootHour == hour || rebootHour == -1) && minute == rebootMinute)
        {
          lgr.info("time to reboot..");
          stop();
          reboot();
        }
      }

//      lgr.debug("checkAndReboot - ok");
    }
    catch (Exception e)
    {
      lgr.warn(e.getMessage(), e);
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
        lgr.warn(e.getMessage(), e);
      }

    }).start();
  }

  private static void stop()
  {
    lgr.info("stop command received, stopping threads..");
    if (sensorReadProcessT != null)
      sensorReadProcessT.isAlive = false;
    if (sensorReadProcessTH != null)
      sensorReadProcessTH.isAlive = false;
    if (dataManager != null)
      dataManager.isAlive = false;

    isAlive = false;
    Utils.sleep(500);
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
      lgr.warn(e.getMessage(), e);
    }
  }

}
