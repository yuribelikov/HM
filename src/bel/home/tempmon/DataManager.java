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
    final HashMap<String, SensorData> sensorsData = new HashMap<>();

    DataRow(String time)
    {
      this.time = time;
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
      lgr.warn(e);
    }
  }

  public void run()
  {
    lgr.info("DataManager is started");
    long statusLastSaved = 0;
    while (!Thread.currentThread().isInterrupted())
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
        writing = false;
        statusLastSaved = Utils.now();
      }

      String time = Utils.timeFormat(Utils.now(), Utils.DF_KEY);
      DataRow lastDataRow = lastDataRow();
      if (lastDataRow == null || !lastDataRow.time.equals(time))
      {
        if (lastDataRow != null)      // switch row once a minute
        {
          writing = true;
          saveRecent();
          appendToMonthly(lastDataRow);
          writing = false;
        }

        lastDataRow = new DataRow(time);
        data.add(lastDataRow);
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

  void addSensorData(SensorData sensorData)
  {
    lgr.info("addSensorData: " + sensorData);
    DataRow lastDataRow = lastDataRow();
    if (lastDataRow != null)
      lastDataRow.sensorsData.put(sensorData.sensor.uid, sensorData);
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
      DataRow dataRow = lastDataRow();
      if (dataRow != null)
      {
        statusLines.add("");
        statusLines.add("Current data row:");
        rowValuesToStatus(dataRow, statusLines);
        if (data.size() > 1)
        {
          statusLines.add("");
          statusLines.add("Last completed data row:");
          rowValuesToStatus(data.get(data.size() - 2), statusLines);
        }
      }
      statusLines.add("");
      statusLines.add("");
      statusLines.add("hm.properties:");
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

  private void rowValuesToStatus(DataRow dataRow, List<String> statusLines)
  {
    statusLines.add("Row data time: " + dataRow.time);
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

  private void saveRecent()
  {
    try
    {
      List<String> recentLines = new ArrayList<>();
      recentLines.add(headerToCsv());
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

  private void appendToMonthly(DataRow lastDataRow)
  {
    try
    {
      String fileName = lastDataRow.time.substring(0, 7) + ".csv";   // e.g. 2018-11
      if (!Files.exists(Paths.get(DATA_PATH, fileName)))
        Files.write(Paths.get(DATA_PATH, fileName), headerToCsv().getBytes());

      Files.write(Paths.get(DATA_PATH, fileName), dataRowToCsv(lastDataRow).getBytes(), StandardOpenOption.APPEND);
    }
    catch (Exception e)
    {
      lgr.warn(e.getMessage(), e);
    }
  }

}