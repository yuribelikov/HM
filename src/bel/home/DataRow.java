package bel.home;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;

class DataRow
{
  private static final SimpleDateFormat DF = new SimpleDateFormat("yyyy-MM-dd_HH:mm");

  long time;
  String data;


  DataRow(long time, String data)
  {
    this.time = time;
    this.data = data;
  }

  DataRow(String line)
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

  boolean equals5minutes()
  {
    return equals(300);
  }

  boolean equals4hours()
  {
    return equals(4 * 60 * 60);
  }

  private boolean equals(long period)
  {
    long seconds = time / 1000;
    long rounded = period * (long) Math.floor(seconds / period);
    return (seconds == rounded);
  }

  int get(int what)
  {
    Calendar cal = Calendar.getInstance();
    cal.setTimeInMillis(time);
    return cal.get(what);
  }

  @Override
  public String toString()
  {
    return DF.format(time) + ";" + data;
  }
}
