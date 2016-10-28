package bel.home;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class YDSaveProcess extends Thread
{
  private Map<String, List<String>> dataMap = new LinkedHashMap<>();
  private long lastSync = -1;
  private long syncDelay = 300;
  boolean isAlive = true;


  public YDSaveProcess()
  {
    start();
  }

  void add(String fileName, List<String> lines)
  {
    dataMap.put(fileName, lines);
  }

  public void run()
  {
    HM.log("YDSP started");
    while (isAlive)
    {
      try
      {
        try
        {
          if (HM.properties != null)
            syncDelay = Long.parseLong(HM.properties.getProperty("yd.sync.delay"));
        }
        catch (NumberFormatException ignored)
        {
        }

        if (dataMap.isEmpty() || (lastSync != -1 && System.currentTimeMillis() < lastSync + syncDelay * 1000))   // sync once per X (syncDelay) minutes
        {
          sleep(1000);
          continue;
        }

        sleep(1000);    // waiting for main HM thread is adding all data to the dataMap
        lastSync = System.currentTimeMillis();    // to avoid having connection channel always busy the lastSync time has to be updated even if sync is failed
        HM.copyPropertiesFromYD();
        HM.saveConnChecks();
        HM.log("YDSP, has data for saving, dataMap.size: " + dataMap.size());
        if (!Files.exists(Paths.get(HM.YD_DATA_PATH)))
        {
          HM.log("YDSP, " + HM.YD_DATA_PATH + " is unavailable");
          sleep(5000);
          continue;
        }

        for (Map.Entry<String, List<String>> entry : dataMap.entrySet())
        {
          String fileName = entry.getKey();
          Files.write(Paths.get(HM.YD_DATA_PATH, fileName), entry.getValue(), StandardCharsets.UTF_8);
          HM.log("YDSP, data saved to: " + HM.YD_DATA_PATH + fileName);
        }
        dataMap.clear();
      }
      catch (Exception e)
      {
        HM.log("YDSP, " + e.getMessage());
        try
        {
          sleep(5000);
        }
        catch (InterruptedException e1)
        {
          HM.err(e1);
        }
      }
    }

  }

}