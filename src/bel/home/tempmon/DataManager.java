package bel.home.tempmon;

import org.apache.log4j.Logger;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.*;

public class DataManager extends Thread
{
  private static final Logger lgr = TempMon.lgr;
  private static final String DATA_PATH = "data/";
  private static final String RECENT_FN = "recent.csv";

  boolean isAlive = true;
  private boolean writing = false;
  private String[] sensorsOrder = null;
  private DataRow currentRow = new DataRow(Utils.timeFormat(Utils.now(), Utils.DF_KEY));
  private final ArrayList<DataRow> data = new ArrayList<>();


  private class DataRow
  {
    final String time;
    final HashMap<String, SensorData> sensorsData = new HashMap<>();

    DataRow(String time)
    {
      this.time = time;
    }

    @Override
    public String toString()
    {
      return "time=" + time + ", sensorsData=" + sensorsData + System.lineSeparator();
    }
  }

  DataManager()
  {
    loadRecent();
    start();
  }

  private void loadRecent()
  {
    try
    {
      Path path = Paths.get(DATA_PATH, RECENT_FN);
      if (Files.exists(path))
      {
        List<String> lines = Files.readAllLines(path, StandardCharsets.UTF_8);
        String header = lines.remove(0);
        String[] sensors = header.split(";");

        for (String line : lines)
        {
          String[] values = line.split(";");
          DataRow dataRow = new DataRow(values[0]);
          SensorData sensorData = null;
          for (int i = 1; i < sensors.length; i++)
          {
            if (i >= values.length)
              break;

            if (sensors[i].endsWith(".t"))
            {
              String sensorUID = sensors[i].substring(0, sensors[i].indexOf('.'));
              Sensor sensor = TempMon.sensors.get(sensorUID);
              if (sensor == null)
              {
                sensor = new Sensor(sensorUID, null);
                TempMon.sensors.put(sensor.uid, sensor);
              }
              sensorData = new SensorData(sensor);
              sensorData.t = Utils.parseFloat(values[i]);
              dataRow.sensorsData.put(sensor.uid, sensorData);
            }
            else if (sensorData != null)
              sensorData.h = Utils.parseFloat(values[i]);
          }

          data.add(dataRow);
        }
      }

      lgr.info("data loaded from " + RECENT_FN + ", data size: " + data.size());
    }
    catch (Exception e)
    {
      lgr.warn(e.getMessage(), e);
    }
  }

  public void run()
  {
    lgr.info("DataManager is started");
    long statusLastSaved = 0;
    while (isAlive)
    {
      if (sensorsOrder == null)
      {
        Utils.sleep(10);
        continue;
      }

      int dataSavePeriod = 1000 * Utils.parse(TempMon.properties.getProperty("status.save.period"), 10);
      if (Utils.now() > statusLastSaved + dataSavePeriod)
      {
        writing = true;
        saveStatus();
        saveCurrent();
        writing = false;
        statusLastSaved = Utils.now();
      }

      String time = Utils.timeFormat(Utils.now(), Utils.DF_KEY);
      if (!currentRow.time.equals(time))          // switch row once a minute
      {
        writing = true;
        data.add(currentRow);
        checkRecentSize();
        saveRecent();
        appendToMonthly(currentRow);
        currentRow = new DataRow(time);
        writing = false;
      }

      Utils.sleep(100);
    }

    lgr.info("DataManager is stopped");
  }

  private void checkRecentSize()
  {
    int limit = Utils.parse(TempMon.properties.getProperty("recent.size"), 100);
    while (data.size() > limit)
      data.remove(0);
  }

  void updateSensors(String[] sensors)
  {
    LinkedHashSet<String> uniqueSensors = new LinkedHashSet<>(Arrays.asList(sensors));
    String[] us = new String[uniqueSensors.size()];
    uniqueSensors.toArray(us);
    while (writing)
      Utils.sleep(1);

    sensorsOrder = us;
  }

  void addSensorData(SensorData sensorData)
  {
    lgr.info("addSensorData: " + sensorData);
    currentRow.sensorsData.put(sensorData.sensor.uid, sensorData);
  }

  private DataRow lastDataRow()
  {
    return data.size() > 0 ? data.get(data.size() - 1) : null;
  }

  private void saveStatus()
  {
    try
    {
      List<String> statusLines = new ArrayList<>();
      statusLines.add("Save time: " + Utils.timeFormat(Utils.now(), Utils.DF_PRESIZE));
      statusLines.add("");
      statusLines.add("Current data row:");
      rowValuesToCurrent(currentRow, statusLines);
      DataRow lastDataRow = lastDataRow();
      if (lastDataRow != null)
      {
        statusLines.add("");
        statusLines.add("Last completed data row:");
        rowValuesToCurrent(lastDataRow, statusLines);
      }
      statusLines.add("");
      statusLines.add("");
      statusLines.add("hm.properties:");
      for (Map.Entry entry : TempMon.properties.entrySet())
        statusLines.add(entry.getKey() + " = " + entry.getValue());

      Files.write(Paths.get(DATA_PATH, "status.txt"), statusLines, StandardCharsets.UTF_8);
      lgr.info("status is saved");

    }
    catch (Exception e)
    {
      lgr.warn(e.getMessage(), e);
    }
  }

  private void rowValuesToCurrent(DataRow dataRow, List<String> statusLines)
  {
    statusLines.add("data.time = " + dataRow.time);
    for (String sensorUID : sensorsOrder)
    {
      SensorData sensorData = dataRow.sensorsData.get(sensorUID);
      if (sensorData != null && sensorData.sensor != null)
      {
        statusLines.add(sensorData.sensor.uid + ".t = " + Utils.numFormat(sensorData.t, 3));
        if (sensorData.sensor.isdht22())
          statusLines.add(sensorData.sensor.uid + ".h = " + Utils.numFormat(sensorData.h, 2));
      }
      else
      {
        Sensor sensor = TempMon.sensors.get(sensorUID);
        if (sensor != null)
        {
          statusLines.add(sensor.uid + ".t =");
          if (sensor.isdht22())
            statusLines.add(sensor.uid + ".h =");
        }
        else
          statusLines.add(sensorUID + " ???");
      }
    }
  }

  private void saveCurrent()
  {
    try
    {
      List<String> statusLines = new ArrayList<>();
      statusLines.add("save.time = " + Utils.timeFormat(Utils.now(), Utils.DF_PRESIZE));
      rowValuesToCurrent(currentRow, statusLines);
      Files.write(Paths.get(DATA_PATH, "current.txt"), statusLines, StandardCharsets.UTF_8);
      lgr.info("current is saved");

    }
    catch (Exception e)
    {
      lgr.warn(e.getMessage(), e);
    }
  }

  private void saveRecent()
  {
    try
    {
      List<String> recentLines = new ArrayList<>();
      recentLines.add(headerToCsv());
      for (DataRow dataRow : data)
        recentLines.add(dataRowToCsv(dataRow));

      Files.write(Paths.get(DATA_PATH, RECENT_FN), recentLines, StandardCharsets.UTF_8);
      lgr.info("recent data is saved");
    }
    catch (Exception e)
    {
      lgr.warn(e.getMessage(), e);
    }
  }

  private String headerToCsv()
  {
    StringBuilder header = new StringBuilder();
    header.append("time;");
    for (String sensorUID : sensorsOrder)
    {
      Sensor sensor = TempMon.sensors.get(sensorUID);
      if (sensor != null)
      {
        header.append(sensor.uid).append(".t;");
        if (sensor.isdht22())
          header.append(sensor.uid).append(".h;");
      }
      else
        header.append(sensorUID).append(".?;");
    }
    return header.substring(0, header.length() - 1);
  }

  private String dataRowToCsv(DataRow dataRow)
  {
    StringBuilder row = new StringBuilder();
    row.append(dataRow.time).append(';');
    for (String sensorUID : sensorsOrder)
    {
      SensorData sensorData = dataRow.sensorsData.get(sensorUID);
      if (sensorData != null && sensorData.sensor != null)
      {
        row.append(Utils.numFormat(sensorData.t, 1)).append(';');
        if (sensorData.sensor.isdht22())
          row.append(Utils.numFormat(sensorData.h, 1)).append(';');
      }
      else
      {
        Sensor sensor = TempMon.sensors.get(sensorUID);
        if (sensor != null)
        {
          row.append("?;");
          if (sensor.isdht22())
            row.append("?;");
        }
        else
          row.append(sensorUID).append("??;");
      }

    }
    return row.substring(0, row.length() - 1);
  }

  private void appendToMonthly(DataRow dataRow)
  {
    try
    {
      String fileName = dataRow.time.substring(0, 7) + ".csv";   // e.g. 2018-11
      if (!Files.exists(Paths.get(DATA_PATH, fileName)))
        Files.write(Paths.get(DATA_PATH, fileName), (headerToCsv() + System.lineSeparator()).getBytes());

      Files.write(Paths.get(DATA_PATH, fileName), (dataRowToCsv(dataRow) + System.lineSeparator()).getBytes(), StandardOpenOption.APPEND);

      lgr.info("appended to monthly");
    }
    catch (Exception e)
    {
      lgr.warn(e.getMessage(), e);
    }
  }

}