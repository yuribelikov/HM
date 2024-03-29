package bel.home.tempmon;

import java.text.DecimalFormat;
import java.text.SimpleDateFormat;
import java.util.Date;

public class Utils
{
  public static final SimpleDateFormat DF_PRESIZE = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss,SSS");
  public static final SimpleDateFormat DF_KEY = new SimpleDateFormat("yyyy-MM-dd_HH:mm");


  public static void sleep(long ms)
  {
    try
    {
      long till = now() + ms;
      while (TempMon.isAlive && now() < till)
        Thread.sleep(1);
    }
    catch (InterruptedException ignored)
    {
    }
  }

  static long now()
  {
    return System.currentTimeMillis();
  }

  static String timeFormat(long ms, SimpleDateFormat df)
  {
    return df.format(new Date(ms));
  }

  static int parse(String str, int defaultValue)
  {
    try
    {
      return Integer.parseInt(str);
    }
    catch (Exception e)
    {
      return defaultValue;
    }
  }

  static float parseFloat(String str)
  {
    try
    {
      return Float.parseFloat(str);
    }
    catch (Exception e)
    {
      return Float.NaN;
    }
  }

  static String numFormat(Float d, int precision)
  {
    try
    {
      if (d.isNaN())
        return "?";

      StringBuilder pattern = new StringBuilder("#.");
      while (precision-- > 0)
        pattern.append("#");

      DecimalFormat df = new DecimalFormat(pattern.toString());
      return df.format(d).replace(',', '.');
    }
    catch (Exception e)
    {
      return "?";
    }
  }
}
