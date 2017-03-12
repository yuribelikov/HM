package bel.home;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.SimpleDateFormat;
import java.util.*;

class TempMonProcess extends Thread
{
  private static final String STATUS_FN = "status.txt";
  private static final String RECENT_FN = "recent.csv";

  boolean isAlive = true;
  long lastSuccess = System.currentTimeMillis();
  private int cycle = 0;
  private String header = "";
  private List<DataRow> recentData = new ArrayList<>();
  private List<DataRow> dailyData = new ArrayList<>();
  private List<DataRow> yearData = new ArrayList<>();
  private HashMap<String, float[]> lastSuccessfulValues = new HashMap<>();
  private HashMap<String, Integer> sensorFailures = new HashMap<>();


  TempMonProcess()
  {
    start();
  }

  public void run()
  {
    HM.log("TMP started");
    loadData(RECENT_FN, recentData);
    loadData(getDailyFileName(), dailyData);
    loadData(getYearFileName(), yearData);

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
        while (isAlive)
        {
          long currSec = System.currentTimeMillis() / 1000;
          long rounded = delay * (long) Math.floor(currSec / delay);
          //          HM.log("currSec: " + currSec + ", rounded: " + rounded);
          if (currSec == rounded)
            break;
          else
            sleepMs(10);
        }

        if (!isAlive)
          break;

        HM.log("");
        long started = System.currentTimeMillis();
        String data = requestSensors();
        DataRow dataRow = new DataRow(started, data);
        HM.log("header: " + header);
        HM.log("dataRow: " + dataRow);

        saveStatus(cycle, dataRow);

        if (dataRow.equalsMinute() || dataRow.time - lastDataTime(dailyData) > 1000 * 60)
        {
          recentData.add(dataRow);
          if (dataRow.time - recentData.get(0).time > 1000 * 60 * 60 * 6)    // store only data for last 6 hours
            recentData.remove(0);
          saveData(RECENT_FN, recentData);
        }

        boolean save = false;
        if (dataRow.equals5minutes() || dataRow.time - lastDataTime(dailyData) > 1000 * 60 * 5)
        {
          checkAndClear(dailyData, dataRow, Calendar.DAY_OF_MONTH);
          dailyData.add(dataRow);
          save = true;
        }

        if (dataRow.equals4hours() || dataRow.time - lastDataTime(yearData) > 1000 * (60 * 60 * 4 + 60 * 5))
        {
          checkAndClear(yearData, dataRow, Calendar.YEAR);
          yearData.add(dataRow);
          save = true;
        }

        if (save)
        {
          saveData(getDailyFileName(), dailyData);
          saveData(getYearFileName(), yearData);
        }

        lastSuccess = System.currentTimeMillis();
      }
      catch (Exception e)
      {
        HM.log("TMP, error: " + e.getMessage());
      }
    }

    HM.log("TMP finished.");
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
      result += ";" + callSensor(sensor, cmd);
      if (!isAlive)
        break;

      sleepMs(500);
    }

    header = header.substring(1);
    return result.substring(1);
  }

  private String callSensor(String sensor, String cmd)
  {
    SensorProcess sp = new SensorProcess(sensor, cmd);
    try
    {
      while (isAlive && !sp.finished)
      {
        while (isAlive && !sp.finished)   // sensor hangs check
        {
          sleepMs(100);
          if (System.currentTimeMillis() < sp.tryStarted + SensorProcess.TRY_TIMEOUT)
            continue;

          sp.kill();
          sleepMs(200);
          break;
        }
      }
    }
    catch (Exception e)
    {
      HM.err(e);
    }
    sp.isAlive = false;

    if (sp.finished && sp.result != null && sp.result[0] > -50 && sp.result[0] < 150)   // saving last successful result
    {
      lastSuccessfulValues.put(sensor, sp.result);
      sensorFailures.put(sensor, 0);
    }
    else
    {
      HM.log("value is invalid, getting old value");
      Integer failures = sensorFailures.get(sensor);
      HM.log("failures: " + failures);
      if (failures < 3)   // using last successful value if number of failures is not big
        sp.result = lastSuccessfulValues.get(sensor);
      HM.log("last valid value: " + sp.result[0]);
      sensorFailures.put(sensor, failures + 1);
    }

    header += (";" + sensor + ".t" + (sp.result.length > 1 ? (";" + sensor + ".h") : ""));
    return sp.result[0] + (sp.result.length > 1 ? (";" + sp.result[1]) : "");
  }

  private void checkAndClear(List<DataRow> data, DataRow newRow, int dayOrYearConst)
  {
    if (data.size() == 0)
      return;

    DataRow lastRow = data.get(data.size() - 1);
    int lastDayOrYear = lastRow.get(dayOrYearConst);    // getting day or year value from data row
    int newDayOrYear = newRow.get(dayOrYearConst);
    if (lastDayOrYear != newDayOrYear)    // new day or new year begins
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

  private String getYearFileName()
  {
    SimpleDateFormat df = new SimpleDateFormat("yyyy");
    df.setTimeZone(HM.DF.getTimeZone());
    return "year_" + df.format(System.currentTimeMillis()) + ".csv";
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