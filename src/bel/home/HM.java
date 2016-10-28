package bel.home;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.text.SimpleDateFormat;
import java.util.*;

public class HM
{
  static final TimeZone TZ = TimeZone.getTimeZone("Europe/Moscow");
  static final SimpleDateFormat DF = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss,SSS");

  static
  {
    DF.setTimeZone(TZ);
  }

  static final String YD_PATH = "/opt/yandex.disk/hm/";
  static final String DATA_PATH = "data/";
  static final String YD_DATA_PATH = YD_PATH + "data/";
  static final String PROPERTIES_FN = "hm.properties";
  static final String STATUS_FN = "status.txt";
  static final String RECENT_FN = "recent.csv";
  static final String LOG_FN = "log.txt";
  static final String CONNS_FN = "conns.txt";

  static String version = "2.07";
  static Properties properties = null;
  static int cycle = 0;
  static boolean copyingProps = false;
  static String header = "";
  static List<DataRow> recentData = new ArrayList<>();     // per 1 minute for 3 hours (100 * 60 * 3   =  18000)
  static List<DataRow> dailyData = new ArrayList<>();       // per 10 minutes for 24 hours (100 * 6 * 24  =  14400)
  static List<DataRow> monthlyData = new ArrayList<>();   // per 4 hours for 1 month (100 * 6 * 30  =  18000)
  static YDSaveProcess ydSaveProcess;
  static List<String> connChecks = new ArrayList<>();


  public static void main(String[] args)
  {
    try
    {
      if (!Files.exists(Paths.get(LOG_FN)))
        Files.write(Paths.get(LOG_FN), "".getBytes(), StandardOpenOption.CREATE_NEW);

      log("--------------------------------------------------------------");
      log("version: " + version);

      ydSaveProcess = new YDSaveProcess();

      loadData(RECENT_FN, recentData);
      loadData(getDailyFileName(), dailyData);
      loadData(getMonthlyFileName(), monthlyData);
      loadConnChecks();

      //noinspection StatementWithEmptyBody
      while (cycle());

      ydSaveProcess.isAlive = false;

      log("finished.");
    }
    catch (Exception e)
    {
      err(e);
    }
  }

  static boolean cycle()
  {
    try
    {
      log("");
      log("cycle: " + (++cycle));
      reloadProperties();

      long delay = Long.parseLong(properties.getProperty("delay"));
      log("delay: " + delay);

      log("waiting..");
      while (true)
      {
        long currSec = System.currentTimeMillis() / 1000;
        long rounded = delay * (long) Math.floor(currSec / delay);
        //          log("currSec: " + currSec + ", rounded: " + rounded);
        if (currSec == rounded)
          break;
        else
          Thread.sleep(10);
      }

      log("");
      long started = System.currentTimeMillis();
      String data = requestSensors();
      DataRow dataRow = new DataRow(started, data);
      log("header: " + header);
      log("dataRow: " + dataRow);
      saveStatus(cycle, dataRow);

      if (dataRow.equalsMinute())
      {
        recentData.add(dataRow);
        if (dataRow.time - recentData.get(0).time > 1000 * 60 * 60 * 3)    // store only data for last 3 hours
          recentData.remove(0);
        log("recentData.size: " + recentData.size());
        saveData(RECENT_FN, recentData);
      }

      boolean save = false;
      if (dataRow.equals10minutes() || dataRow.time - lastDataTime(dailyData) > 1000 * 60 * 11)
      {
        checkAndClear(dailyData, dataRow, Calendar.DAY_OF_MONTH);
        dailyData.add(dataRow);
        log("dailyData.size: " + dailyData.size());
        save = true;
      }

      if (dataRow.equals4hours() || dataRow.time - lastDataTime(monthlyData) > 1000 * (60 * 60 * 4 + 60 * 5))
      {
        checkAndClear(monthlyData, dataRow, Calendar.MONTH);
        monthlyData.add(dataRow);
        log("monthlyData.size: " + monthlyData.size());
        save = true;
      }

      if (save)
      {
        saveData(getDailyFileName(), dailyData);
        saveData(getMonthlyFileName(), monthlyData);
      }

      try
      {
        int rebootMinute = Integer.parseInt(HM.properties.getProperty("reboot.minute"));
        Calendar c = Calendar.getInstance();
        c.setTimeInMillis(dataRow.time);
        int minute = c.get(Calendar.MINUTE);
        log("minute: " + minute +", rebootMinute: " + rebootMinute);
        if (minute == rebootMinute)
        {
          log("time to reboot..");
          reboot();
          return false;
        }
      }
      catch (NumberFormatException ignored)
      {
      }
    }
    catch (Exception e)
    {
      err(e);
    }
    return true;
  }

  static void checkAndClear(List<DataRow> data, DataRow lastRow, int dayOrMonth)
  {
    if (data.size() > 0 && data.get(data.size() - 1).get(dayOrMonth) != lastRow.get(dayOrMonth))     // new day or month
      data.clear();
  }

  static String requestSensors()
  {
    String ss = properties.getProperty("sensors");
    log("sensors: " + ss);
    String[] sensors = ss.split(" ");
    String result = "";
    header = "";
    for (String s : sensors)
    {
      String sensor = s.trim();
      String cmd = properties.getProperty(sensor);
      if (cmd == null)
      {
        log("WARNING: no sensor with id: " + sensor);
        continue;
      }
      log(sensor + " -> " + cmd);
      result += ";" + callSensor(sensor, cmd);
    }

    header = header.substring(1);
    return result.substring(1);
  }

  static String callSensor(String sensor, String cmd)
  {
    long started = System.currentTimeMillis();
    SensorProcess sp = new SensorProcess(sensor, cmd);
    try
    {
      while (!sp.finished)
      {
        Thread.sleep(10);
        if (System.currentTimeMillis() - started > 5000)
          sp.kill();
      }
    }
    catch (Exception e)
    {
      err(e);
    }

    header += (";" + sensor + ".t" + (sp.result.length > 1 ? (";" + sensor + ".h") : ""));
    return sp.result[0] + (sp.result.length > 1 ? (";" + sp.result[1]) : "");
  }

  static void loadData(String filePath, List<DataRow> data)
  {
    try
    {
      Path path = Paths.get(DATA_PATH, filePath);
      if (Files.exists(path))
      {
        List<String> lines = Files.readAllLines(path, StandardCharsets.UTF_8);
        lines.remove(0);
        for (String line : lines)
          data.add(new DataRow(line));
      }

      log("data loaded from " + DATA_PATH + filePath + ", data size: " + data.size());
    }
    catch (Exception e)
    {
      err(e);
    }
  }

  static void loadConnChecks()
  {
    try
    {
      Path path = Paths.get(DATA_PATH, CONNS_FN);
      if (Files.exists(path))
      {
        List<String> lines = Files.readAllLines(path, StandardCharsets.UTF_8);
        for (String line : lines)
          connChecks.add(line);
      }

      log("connChecks data loaded from " + DATA_PATH + CONNS_FN + ", data size: " + connChecks.size());
    }
    catch (Exception e)
    {
      err(e);
    }
  }

  static void saveStatus(int cycle, DataRow lastDataRow)
  {
    try
    {
      List<String> lines = new ArrayList<>();
      lines.add("data time: " + DF.format(lastDataRow.time));
      lines.add("cycle: " + cycle);
//      lines.add("header: " + header);
//      lines.add("data: " + lastDataRow.data);
      String[] hsa = header.split(";");
      String[] hda = lastDataRow.data.split(";");
      for (int i = 0; i < hsa.length; i++)
        lines.add(hsa[i] + " = " + hda[i]);

//      lines.add("");
      lines.add("version: " + version);
//      lines.add("");
      if (properties != null)
      {
        lines.add("Properties:");
        for (Map.Entry<Object, Object> entry : properties.entrySet())
          lines.add("" + entry);
      }

      Files.write(Paths.get(DATA_PATH, STATUS_FN), lines, StandardCharsets.UTF_8);
      log("status saved to: " + DATA_PATH + STATUS_FN);

      ydSaveProcess.add(STATUS_FN, lines);
    }
    catch (Exception e)
    {
      err(e);
    }
  }

  static void saveData(String fileName, List<DataRow> data)
  {
    try
    {
      List<String> lines = new ArrayList<>();
      lines.add("time;" + header);
      for (DataRow dataRow : data)
        lines.add(dataRow.toString());

      Files.write(Paths.get(DATA_PATH, fileName), lines, StandardCharsets.UTF_8);
      log("data saved to: " + DATA_PATH + fileName);

      ydSaveProcess.add(fileName, lines);
    }
    catch (Exception e)
    {
      err(e);
    }
  }

  static void saveConnChecks()
  {
    try
    {
      List<String> lines = new ArrayList<>();
      for (String row : connChecks)
        lines.add(row);

      Files.write(Paths.get(DATA_PATH, CONNS_FN), lines, StandardCharsets.UTF_8);
      log("connChecks data saved to: " + DATA_PATH + CONNS_FN);

      ydSaveProcess.add(CONNS_FN, lines);

      while (connChecks.size() > 1000)
        connChecks.remove(0);
    }
    catch (Exception e)
    {
      err(e);
    }
  }

  static void reloadProperties()
  {
    try
    {
      log("reloadProperties");
      File file = new File(PROPERTIES_FN);
      while (copyingProps || !file.exists())    // file can be under replacement from yandex.disk (deleted and created)
        Thread.sleep(100);

      Properties p = new Properties();
      FileInputStream fis = new FileInputStream(file);
      p.load(fis);
      fis.close();
      properties = p;
    }
    catch (Exception e)
    {
      err(e);
    }
  }

  static void copyPropertiesFromYD()
  {
    try
    {
      log("copyPropertiesFromYD");
      long startTime = System.currentTimeMillis();
      Path from = Paths.get(YD_PATH, PROPERTIES_FN);
      if (Files.exists(from))
      {
        long endTime = System.currentTimeMillis();
        connChecks.add(DF.format(System.currentTimeMillis()) + ": YD   time (ms): " + (endTime - startTime));
        Path to = Paths.get(PROPERTIES_FN);
        if (Files.getLastModifiedTime(to).toMillis() >= Files.getLastModifiedTime(from).toMillis())
        {
          log("properties are up to date");
          return;
        }

        copyingProps = true;
        Thread.sleep(100);    // file can be under reading now, so waiting
        Files.copy(from, to, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.COPY_ATTRIBUTES);
        copyingProps = false;
        log(PROPERTIES_FN + " has been copied from " + YD_PATH);
      }
      else
      {
        log(YD_PATH + " is unavailable");
        connChecks.add(DF.format(System.currentTimeMillis()) + ": YD failed");
      }
    }
    catch (Exception e)
    {
      err(e);
    }
  }

  static void reboot()
  {
    try
    {
      log("rebooting..");
      Process p = Runtime.getRuntime().exec("/sbin/reboot");
      p.waitFor();
    }
    catch (Exception e)
    {
      err(e);
    }
  }

  static String getDailyFileName()
  {
    SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd");
    df.setTimeZone(DF.getTimeZone());
    return "daily_" + df.format(System.currentTimeMillis()) + ".csv";
  }

  static String getMonthlyFileName()
  {
    SimpleDateFormat df = new SimpleDateFormat("yyyy-MM");
    df.setTimeZone(DF.getTimeZone());
    return "monthly_" + df.format(System.currentTimeMillis()) + ".csv";
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

  static long lastDataTime(List<DataRow> data)
  {
    if (data.size() > 0)
      return data.get(data.size() - 1).time;
    else
      return 0;
  }
}

