package bel.home;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

class YDProcess extends Thread
{
  private final String YD_PATH;
  private final String YD_DATA_PATH;
//  private static final String CONNS_FN = "conns.txt";

  private Map<String, List<String>> dataMap = new LinkedHashMap<>();
  private long lastSync = System.currentTimeMillis();
  boolean copyingProps = false;
//  private static List<String> connChecks = new ArrayList<>();
  boolean isAlive = true;


  YDProcess()
  {
    YD_PATH = HM.properties.getProperty("yd.path");
    YD_DATA_PATH = YD_PATH + HM.DATA_PATH;
    start();
  }

  void add(String fileName, List<String> lines)
  {
    dataMap.put(fileName, lines);
  }

  public void run()
  {
    HM.log("YDP started, YD_PATH: " + YD_PATH);
//    loadConnChecks();

    long syncDelay;
    while (isAlive)
    {
      try
      {
        try
        {
          syncDelay = 300;
          if (HM.properties != null)
            syncDelay = Long.parseLong(HM.properties.getProperty("yd.sync.delay"));
        }
        catch (NumberFormatException ignored)
        {
          syncDelay = 300;
        }

        if (dataMap.isEmpty() || (System.currentTimeMillis() < lastSync + syncDelay * 1000))   // sync once per X (syncDelay) seconds
        {
          sleepMs(1000);
          continue;
        }

        sleepMs(1000);    // waiting for main HM thread is adding all data to the dataMap
        lastSync = System.currentTimeMillis();    // to avoid having connection channel always busy the lastSync time has to be updated even if sync is failed
//        copyPropertiesFromYD();
//        saveConnChecks();
        HM.log("YDP, has data for saving, dataMap.size: " + dataMap.size());
        if (!Files.exists(Paths.get(YD_DATA_PATH)))
        {
          HM.log("YDP, " + YD_DATA_PATH + " is unavailable");
          sleepMs(60000);
          continue;
        }

        for (Map.Entry<String, List<String>> entry : dataMap.entrySet())
        {
          String fileName = entry.getKey();
          Files.write(Paths.get(YD_DATA_PATH, fileName), entry.getValue(), StandardCharsets.UTF_8);
          HM.log("YDP, data saved to: " + YD_DATA_PATH + fileName);
        }
        dataMap.clear();
      }
      catch (Exception e)
      {
        HM.log("YDP, error: " + e.getMessage());
        sleepMs(60000);
      }
    }

   HM.log("YDP finished.");
  }

//  private void saveConnChecks()
//  {
//    try
//    {
//      List<String> lines = new ArrayList<>();
//      for (String row : connChecks)
//        lines.add(row);
//
//      Files.write(Paths.get(HM.DATA_PATH, CONNS_FN), lines, StandardCharsets.UTF_8);
//      HM.log("connChecks data saved to: " + HM.DATA_PATH + CONNS_FN);
//
//      add(CONNS_FN, lines);
//
//      while (connChecks.size() > 1000)
//        connChecks.remove(0);
//    }
//    catch (Exception e)
//    {
//      HM.err(e);
//    }
//  }

//  private void loadConnChecks()
//  {
//    try
//    {
//      Path path = Paths.get(HM.DATA_PATH, CONNS_FN);
//      if (Files.exists(path))
//      {
//        List<String> lines = Files.readAllLines(path, StandardCharsets.UTF_8);
//        for (String line : lines)
//          connChecks.add(line);
//      }
//
//      HM.log("connChecks data loaded from " + HM.DATA_PATH + CONNS_FN + ", data size: " + connChecks.size());
//    }
//    catch (Exception e)
//    {
//      HM.err(e);
//    }
//  }

//  private void copyPropertiesFromYD()
//  {
//    try
//    {
//      HM.log("copyPropertiesFromYD");
//      long startTime = System.currentTimeMillis();
//      Path from = Paths.get(YD_PATH, HM.PROPERTIES_FN);
//      if (Files.exists(from))
//      {
//        long endTime = System.currentTimeMillis();
//        connChecks.add(HM.DF.format(System.currentTimeMillis()) + ": YD   time (ms): " + (endTime - startTime));
//        Path to = Paths.get(HM.PROPERTIES_FN);
//        if (Files.getLastModifiedTime(to).toMillis() >= Files.getLastModifiedTime(from).toMillis())
//        {
//          HM.log("properties are up to date");
//          return;
//        }
//
//        copyingProps = true;
//        sleepMs(100);    // file can be under reading now, so waiting
//        Files.copy(from, to, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.COPY_ATTRIBUTES);
//        copyingProps = false;
//        HM.log(HM.PROPERTIES_FN + " has been copied from " + YD_PATH);
//      }
//      else
//      {
//        HM.log(YD_PATH + " is unavailable");
//        connChecks.add(HM.DF.format(System.currentTimeMillis()) + ": YD failed");
//      }
//    }
//    catch (Exception e)
//    {
//      HM.err(e);
//    }
//  }

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