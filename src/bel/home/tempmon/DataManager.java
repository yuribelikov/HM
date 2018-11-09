package bel.home.tempmon;

import org.apache.log4j.Logger;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

public class DataManager extends Thread
{
  private static final Logger lgr = TempMon.lgr;
  private static final String DATA_PATH = "data/";
  private static final String RECENT_FN = "recent.csv";

  //  private final static long STATUS_IDLE = 0;
//  private final static long STATUS_WRITING = 0;
  private boolean writing = false;
  private String[] sensorsOrder = null;
  private ArrayList<DataRow> data = new ArrayList<>();


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
      if (Utils.now() > lastSaved + dataSavePeriod && sensorsOrder != null)
      {
        saveData();
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
    String time = Utils.timeFormat(Utils.now(), Utils.DF_KEY);
    DataRow lastDataRow = lastDataRow();
    if (lastDataRow == null || !lastDataRow.time.equals(time))
    {
      lastDataRow = new DataRow(time);
      data.add(lastDataRow);
    }

    lastDataRow.sensors.put(sensor.uid, sensor);
  }

  private DataRow lastDataRow()
  {
    return data.size() > 0 ? data.get(data.size() - 1) : null;
  }

  private void saveData()
  {
    DataRow lastDataRow = lastDataRow();
    if (lastDataRow == null)
      return;

    writing = true;
    try
    {
      List<String> recentLines = new ArrayList<>();
      List<String> statusLines = new ArrayList<>();
      statusLines.add(Utils.timeFormat(Utils.now(), Utils.DF_PRESIZE));
      statusLines.add(lastDataRow.time);

      StringBuilder header = new StringBuilder();
      header.append("time;");
      for (String sensorUID : sensorsOrder)
      {
        Sensor sensor = lastDataRow.sensors.get(sensorUID);
        if (sensor != null)
        {
          header.append(sensor.uid).append(".t;");
          statusLines.add(sensor.uid + " = " + Utils.numFormat(sensor.t, 3));
          if (sensor.isdht22())
          {
            header.append(sensor.uid).append(".h;");
            statusLines.add(sensor.uid + " = " + Utils.numFormat(sensor.h, 2));
          }
        }
      }
      recentLines.add(header.substring(0, header.length() - 1));

      for (DataRow dataRow : data)
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
        recentLines.add(row.substring(0, row.length() - 1));
      }

      for (Map.Entry entry : TempMon.properties.entrySet())
        statusLines.add(entry.getKey() + " = " + entry.getValue());

      Files.write(Paths.get(DATA_PATH, "status.txt"), statusLines, StandardCharsets.UTF_8);
      Files.write(Paths.get(DATA_PATH, RECENT_FN), recentLines, StandardCharsets.UTF_8);
      lgr.debug("status and recent are saved");

    }
    catch (Exception e)
    {
      lgr.warn(e);
    }

    writing = false;
  }
}