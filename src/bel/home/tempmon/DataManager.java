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

  private boolean writing = false;
  private String[] sensorsOrder = null;
  private final ArrayList<DataRow> data = new ArrayList<>();


  private class DataRow
  {
    final String time;
    final HashMap<String, Sensor> sensors = new HashMap<>();

    DataRow(String time)
    {
      this.time = time;
    }
  }

  DataManager()
  {
    loadData();
    start();
  }

  private void loadData()
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
          Sensor sensor = null;
          for (int i = 1; i < sensors.length; i++)
          {
            if (sensors[i].endsWith(".t"))
            {
              sensor = new Sensor(sensors[i].substring(sensors[i].indexOf('.')), null);
              sensor.t = Utils.parseFloat(values[i]);
              dataRow.sensors.put(sensor.uid, sensor);
            }
            else if (sensor != null)
              sensor.h = Utils.parseFloat(values[i]);
          }

          data.add(dataRow);
        }
      }

      lgr.info("data loaded from " + RECENT_FN + ", data size: " + data.size());
    }
    catch (Exception e)
    {
      lgr.warn(e);
    }
  }

  public void run()
  {
    lgr.info("DataManager is started");
    long lastSaved = 0;
    while (!Thread.currentThread().isInterrupted())
    {
      int dataSavePeriod = 1000 * Utils.parse(TempMon.properties.getProperty("data.save.period"), 10);
      DataRow lastDataRow = lastDataRow();
      if (Utils.now() > lastSaved + dataSavePeriod && sensorsOrder != null && lastDataRow != null)
      {
        writing = true;
        saveStatus(lastDataRow);
        saveRecent(lastDataRow);
        writing = false;
        lastSaved = Utils.now();
      }

      Utils.sleep(100);
    }

    lgr.info("DataManager is stopped");
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

  void addSensorData(Sensor sensor)
  {
    synchronized (data)
    {
      String time = Utils.timeFormat(Utils.now(), Utils.DF_KEY);
      DataRow lastDataRow = lastDataRow();
      if (lastDataRow == null || !lastDataRow.time.equals(time))
      {
        if (lastDataRow != null)
          appendToMonthly(lastDataRow);

        lastDataRow = new DataRow(time);
        data.add(lastDataRow);
      }

      lastDataRow.sensors.put(sensor.uid, sensor);
    }
  }

  private DataRow lastDataRow()
  {
    return data.size() > 0 ? data.get(data.size() - 1) : null;
  }

  private void saveStatus(DataRow lastDataRow)
  {
    try
    {
      List<String> statusLines = new ArrayList<>();
      statusLines.add(Utils.timeFormat(Utils.now(), Utils.DF_PRESIZE));
      lastValuesToStatus(lastDataRow, statusLines);
      for (Map.Entry entry : TempMon.properties.entrySet())
        statusLines.add(entry.getKey() + " = " + entry.getValue());

      Files.write(Paths.get(DATA_PATH, "status.txt"), statusLines, StandardCharsets.UTF_8);
      lgr.debug("status is saved");

    }
    catch (Exception e)
    {
      lgr.warn(e);
    }
  }

  private void lastValuesToStatus(DataRow lastDataRow, List<String> statusLines)
  {
    statusLines.add(lastDataRow.time);
    for (String sensorUID : sensorsOrder)
    {
      Sensor sensor = lastDataRow.sensors.get(sensorUID);
      if (sensor != null)
      {
        statusLines.add(sensor.uid + " = " + Utils.numFormat(sensor.t, 3));
        if (sensor.isdht22())
          statusLines.add(sensor.uid + " = " + Utils.numFormat(sensor.h, 2));
      }
    }
  }

  private void saveRecent(DataRow lastDataRow)
  {
    try
    {
      List<String> recentLines = new ArrayList<>();
      recentLines.add(headerToCsv(lastDataRow));
      for (DataRow dataRow : data)
        recentLines.add(dataRowToCsv(dataRow));

      Files.write(Paths.get(DATA_PATH, RECENT_FN), recentLines, StandardCharsets.UTF_8);
      lgr.debug("recent data is saved");
    }
    catch (Exception e)
    {
      lgr.warn(e);
    }
  }

  private String headerToCsv(DataRow lastDataRow)
  {
    StringBuilder header = new StringBuilder();
    header.append("time;");
    for (String sensorUID : sensorsOrder)
    {
      Sensor sensor = lastDataRow.sensors.get(sensorUID);
      if (sensor != null)
      {
        header.append(sensor.uid).append(".t;");
        if (sensor.isdht22())
          header.append(sensor.uid).append(".h;");
      }
    }
    return header.substring(0, header.length() - 1);
  }

  private String dataRowToCsv(DataRow dataRow)
  {
    StringBuilder row = new StringBuilder();
    row.append(dataRow.time).append(';');
    for (String sensorUID : sensorsOrder)
    {
      Sensor sensor = dataRow.sensors.get(sensorUID);
      if (sensor != null)
      {
        row.append(Utils.numFormat(sensor.t, 1)).append(';');
        if (sensor.isdht22())
          row.append(Utils.numFormat(sensor.h, 1)).append(';');
      }
    }
    return row.substring(0, row.length() - 1);
  }

  private void appendToMonthly(DataRow lastDataRow)
  {
    try
    {
      String fileName = lastDataRow.time.substring(0, 7);   // e.g. 2018-11
      if (!Files.exists(Paths.get(DATA_PATH, fileName)))
        Files.write(Paths.get(DATA_PATH, fileName), headerToCsv(lastDataRow).getBytes());

      Files.write(Paths.get(DATA_PATH, fileName), dataRowToCsv(lastDataRow).getBytes(), StandardOpenOption.APPEND);
    }
    catch (Exception e)
    {
      lgr.warn(e.getMessage(), e);
    }
  }

}