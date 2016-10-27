package bel.home;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.Map;

public class TempMonProcess extends Thread
{
  static final String STATUS_FN = "status.txt";
  static final String RECENT_FN = "recent.csv";

  boolean isAlive = true;
  long lastSuccess = System.currentTimeMillis();
  private static int cycle = 0;
  private static String header = "";
  private static List<DataRow> recentData = new ArrayList<>();     // per 1 minute for 3 hours (100 * 60 * 3   =  18000)
  private static List<DataRow> dailyData = new ArrayList<>();       // per 10 minutes for 24 hours (100 * 6 * 24  =  14400)
  private static List<DataRow> monthlyData = new ArrayList<>();   // per 4 hours for 1 month (100 * 6 * 30  =  18000)


  public TempMonProcess()
  {
    start();
  }


  public void run()
  {
    HM.log("TMP started");
    loadData(RECENT_FN, recentData);
    loadData(getDailyFileName(), dailyData);
    loadData(getMonthlyFileName(), monthlyData);

    while (isAlive)
    {
      try
      {
        HM.log("");
        HM.log("cycle: " + (++cycle));
        HM.reloadProperties();

        long delay = Long.parseLong(HM.properties.getProperty("delay"));
        HM.log("delay: " + delay);

        HM.log("waiting..");
        while (true)
        {
          long currSec = System.currentTimeMillis() / 1000;
          long rounded = delay * (long) Math.floor(currSec / delay);
          //          HM.log("currSec: " + currSec + ", rounded: " + rounded);
          if (currSec == rounded)
            break;
          else
            Thread.sleep(10);
        }

        HM.log("");
        long started = System.currentTimeMillis();
        String data = requestSensors();
        DataRow dataRow = new DataRow(started, data);
        HM.log("header: " + header);
        HM.log("dataRow: " + dataRow);

        saveStatus(cycle, dataRow);

        if (dataRow.equalsMinute())
        {
          recentData.add(dataRow);
          if (dataRow.time - recentData.get(0).time > 1000 * 60 * 60 * 3)    // store only data for last 3 hours
            recentData.remove(0);
          HM.log("recentData.size: " + recentData.size());
          saveData(RECENT_FN, recentData);
        }

        boolean save = false;
        if (dataRow.equals10minutes() || dataRow.time - lastDataTime(dailyData) > 1000 * 60 * 11)
        {
          checkAndClear(dailyData, dataRow, Calendar.DAY_OF_MONTH);
          dailyData.add(dataRow);
          HM.log("dailyData.size: " + dailyData.size());
          save = true;
        }

        if (dataRow.equals4hours() || dataRow.time - lastDataTime(monthlyData) > 1000 * (60 * 60 * 4 + 60 * 5))
        {
          checkAndClear(monthlyData, dataRow, Calendar.MONTH);
          monthlyData.add(dataRow);
          HM.log("monthlyData.size: " + monthlyData.size());
          save = true;
        }

        if (save)
        {
          saveData(getDailyFileName(), dailyData);
          saveData(getMonthlyFileName(), monthlyData);
        }

        lastSuccess = System.currentTimeMillis();
      }
      catch (Exception e)
      {
        HM.log("TMP, error: " + e.getMessage());
      }
    }
  }

  private String requestSensors() throws Exception
  {
    String ss = HM.properties.getProperty("sensors");
    HM.log("sensors: " + ss);
    String[] sensors = ss.split(" ");
    String result = "";
    header = "";
    for (String s : sensors)
    {
      String sensor = s.trim();
      String cmd = HM.properties.getProperty(sensor);
      if (cmd == null)
      {
        HM.log("WARNING: no sensor with id: " + sensor);
        continue;
      }
      HM.log(sensor + " -> " + cmd);
      result += ";" + callSensor(sensor, cmd);
      Thread.sleep(100);
    }

    header = header.substring(1);
    return result.substring(1);
  }

  private String callSensor(String sensor, String cmd)
  {
    long started = System.currentTimeMillis();
    SensorProcess sp = new SensorProcess(sensor, cmd);
    try
    {
      while (!sp.finished)
      {
        Thread.sleep(100);
        if (System.currentTimeMillis() - started > 10000)
          sp.kill();
      }
    }
    catch (Exception e)
    {
      HM.err(e);
    }

    header += (";" + sensor + ".t" + (sp.result.length > 1 ? (";" + sensor + ".h") : ""));
    return sp.result[0] + (sp.result.length > 1 ? (";" + sp.result[1]) : "");
  }

  private void checkAndClear(List<DataRow> data, DataRow lastRow, int dayOrMonth)
  {
    if (data.size() > 0 && data.get(data.size() - 1).get(dayOrMonth) != lastRow.get(dayOrMonth))     // new day or month
      data.clear();
  }

  private long lastDataTime(List<DataRow> data)
  {
    if (data.size() > 0)
      return data.get(data.size() - 1).time;
    else
      return 0;
  }

  private void saveStatus(int cycle, DataRow lastDataRow)
  {
    try
    {
      List<String> lines = new ArrayList<>();
      lines.add("data time: " + HM.DF.format(lastDataRow.time));
      lines.add("cycle: " + cycle);
      String[] hsa = header.split(";");
      String[] hda = lastDataRow.data.split(";");
      for (int i = 0; i < hsa.length; i++)
        lines.add(hsa[i] + " = " + hda[i]);

      lines.add("version: " + HM.version);
      if (HM.properties != null)
      {
        lines.add("Properties:");
        for (Map.Entry<Object, Object> entry : HM.properties.entrySet())
          lines.add("" + entry);
      }

      Files.write(Paths.get(HM.DATA_PATH, STATUS_FN), lines, StandardCharsets.UTF_8);
      HM.log("status saved to: " + HM.DATA_PATH + STATUS_FN);

      HM.statusSaveProcess.setData(lines);
      HM.ydProcess.add(STATUS_FN, lines);
    }
    catch (Exception e)
    {
      HM.err(e);
    }
  }

  private void saveData(String fileName, List<DataRow> data)
  {
    try
    {
      List<String> lines = new ArrayList<>();
      lines.add("time;" + header);
      for (DataRow dataRow : data)
        lines.add(dataRow.toString());

      Files.write(Paths.get(HM.DATA_PATH, fileName), lines, StandardCharsets.UTF_8);
      HM.log("data saved to: " + HM.DATA_PATH + fileName);

      HM.ydProcess.add(fileName, lines);
    }
    catch (Exception e)
    {
      HM.err(e);
    }
  }

  private void loadData(String filePath, List<DataRow> data)
  {
    try
    {
      Path path = Paths.get(HM.DATA_PATH, filePath);
      if (Files.exists(path))
      {
        List<String> lines = Files.readAllLines(path, StandardCharsets.UTF_8);
        lines.remove(0);
        for (String line : lines)
          data.add(new DataRow(line));
      }

      HM.log("data loaded from " + HM.DATA_PATH + filePath + ", data size: " + data.size());
    }
    catch (Exception e)
    {
      HM.err(e);
    }
  }

  private String getDailyFileName()
  {
    SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd");
    df.setTimeZone(HM.DF.getTimeZone());
    return "daily_" + df.format(System.currentTimeMillis()) + ".csv";
  }

  private String getMonthlyFileName()
  {
    SimpleDateFormat df = new SimpleDateFormat("yyyy-MM");
    df.setTimeZone(HM.DF.getTimeZone());
    return "monthly_" + df.format(System.currentTimeMillis()) + ".csv";
  }
}