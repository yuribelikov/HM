package org.rm.tool.web.test;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;

public class WebIPTest
{

  public static void main0(String[] args)
  {

    try
    {
      URL u = new URL("http://172.16.34.178/webiptest/");
      HttpURLConnection conn = (HttpURLConnection) u.openConnection();
      System.out.println(conn.getResponseCode());
      System.out.println(conn.getResponseMessage());

    }
    catch (Exception e)
    {
      e.printStackTrace();
    }
  }

  public static void main(String[] args)
  {

    try
    {
      String rawData = "data time: 2016-09-05 17:49:00,005\n" +
        "cycle: 51\n" +
        "inside.t = 21.9\n" +
        "inside.h = 64.4\n" +
        "outside.t = 15.6\n" +
        "outside.h = 59.3\n" +
        "test.t = 26.062\n" +
        "warmOut.t = 25.0\n" +
        "warmIn.t = 23.5\n" +
        "warm.floor.t = 18.5\n" +
        "faucet.t = 21.0\n" +
        "room.t = 20.937\n" +
        "bedroom.t = 21.25\n" +
        "cellar.t = 15.312\n" +
        "under.floor.t = 15.312\n" +
        "second.floor.t = 20.937\n" +
        "attic.t = 21.062\n" +
        "chimney.t = 22.5\n" +
        "version: 2.07\n" +
        "Properties:\n" +
        "second.floor=cat /sys/bus/w1/devices/28-01159263b5ff/w1_slave\n" +
        "yd.sync.delay=600\n" +
        "sensors=inside outside test warmOut warmIn warm.floor faucet room bedroom cellar under.floor second.floor attic chimney\n" +
        "warmIn=cat /sys/bus/w1/devices/28-031590d20eff/w1_slave\n" +
        "warmOut=cat /sys/bus/w1/devices/28-0115911af8ff/w1_slave\n" +
        "faucet=cat /sys/bus/w1/devices/28-01159261cbff/w1_slave\n" +
        "chimney=cat /sys/bus/w1/devices/28-031590d382ff/w1_slave\n" +
        "bedroom=cat /sys/bus/w1/devices/28-0115926205ff/w1_slave\n" +
        "under.floor=cat /sys/bus/w1/devices/28-01159267edff/w1_slave\n" +
        "test=cat /sys/bus/w1/devices/28-01159264e1ff/w1_slave\n" +
        "inside=/opt/dht22/lol_dht22/loldht 25\n" +
        "cellar=cat /sys/bus/w1/devices/28-011592606cff/w1_slave\n" +
        "room=cat /sys/bus/w1/devices/28-0115926eb7ff/w1_slave\n" +
        "reboot.minute=56\n" +
        "outside=/opt/dht22/lol_dht22/loldht 28\n" +
        "warm.floor=cat /sys/bus/w1/devices/28-03159043f4ff/w1_slave\n" +
        "attic=cat /sys/bus/w1/devices/28-0315904578ff/w1_slave\n" +
        "delay=60\n";
      rawData = rawData.replaceAll("\n", "<br>");
      String encodedData = URLEncoder.encode(rawData, "UTF-8");
      String type = "application/x-www-form-urlencoded";
//      URL u = new URL("http://172.16.34.178/webiptest/");
      URL u = new URL("http://mtc.rmcity.net/webiptest/");
      HttpURLConnection conn = (HttpURLConnection) u.openConnection();
      conn.setDoOutput(true);
      conn.setRequestMethod("POST");
      conn.setRequestProperty( "Content-Type", type );
      conn.setRequestProperty( "Content-Length", String.valueOf(encodedData.length()));
      OutputStream os = conn.getOutputStream();
      final byte[] bytes = encodedData.getBytes();
      os.write(bytes);
      System.out.println(bytes.length);
      System.out.println(conn.getResponseCode());
      System.out.println(conn.getResponseMessage());

    }
    catch (Exception e)
    {
      e.printStackTrace();
    }
  }

//  public static void main3(String[] args)
//  {
//
//    try
//    {
//      HttpClient client = new DefaultHttpClient();
//      HttpPost post = new HttpPost("http://172.16.34.178/webiptest/");
////      httpPost.addHeader(new BasicHeader("Content-type", "application/json"));
//      HttpResponse response = client.execute(post);
//      System.out.println(response.getStatusLine().getStatusCode());
//
//    }
//    catch (Exception e)
//    {
//      e.printStackTrace();
//    }
//  }
}
