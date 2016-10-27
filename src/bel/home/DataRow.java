package bel.home;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;

public class DataRow
{
  static final SimpleDateFormat DF = new SimpleDateFormat("yyyy-MM-dd_HH:mm");

  static {DF.setTimeZone(HM.TZ);}

  long time;
  String data;


  public DataRow(long time, String data)
  {
    this.time = time;
    this.data = data;
  }

  public DataRow(String line)
  {
    int idx = line.indexOf(';');
    try
    {
      time = DF.parse(line.substring(0, idx)).getTime();
    }
    catch (ParseException e)
    {
      e.printStackTrace();
    }

    data = line.substring(idx + 1);
  }

  boolean equalsMinute()
  {
    return equals(60);
  }

  boolean equals10minutes()
  {
    return equals(600);
  }

  boolean equals4hours()
  {
    return equals(4 * 60 * 60);
  }

  boolean equals(long period)
  {
    long seconds = time / 1000;
    long rounded = period * (long) Math.floor(seconds / period);
    return (seconds == rounded);
  }

  int get(int what)
  {
    Calendar cal = Calendar.getInstance();
    cal.setTimeInMillis(time);
    cal.setTimeZone(HM.TZ);
    return cal.get(what);
  }

  @Override
  public String toString()
  {
    return DF.format(time) + ";" + data;
  }
}
