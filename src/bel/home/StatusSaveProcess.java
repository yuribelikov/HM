package bel.home;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.util.List;

public class StatusSaveProcess extends Thread
{
  private String data = null;
  boolean isAlive = true;
  long lastSuccess = System.currentTimeMillis();
  private HttpURLConnection conn = null;
  private OutputStream os = null;


  public StatusSaveProcess()
  {
    start();
  }

  void setData(List<String> lines)
  {
    StringBuilder sb = new StringBuilder();
    for (String line : lines)
      sb.append(line).append("<br>");

    data = sb.toString();
  }

  public void run()
  {
    HM.log("SSP started");
    while (isAlive)
    {
      try
      {
        if (data == null)
        {
          sleep(1000);
          continue;
        }

        if (!HM.checkRouter())
        {
          HM.log("SSP, router not available - skipping..");
          data = null;
          continue;
        }

        String encodedData = URLEncoder.encode(data, "UTF-8");
        String type = "application/x-www-form-urlencoded";
        String statusSaveUrl = HM.properties.getProperty("status.save.url");
        HM.log("SSP, sending status data to: " + statusSaveUrl);
        URL u = new URL(statusSaveUrl);
        HM.log("SSP, u: " + u);
        conn = (HttpURLConnection) u.openConnection();
        HM.log("SSP, conn: " + conn);
        conn.setConnectTimeout(25000);
        conn.setDoOutput(true);
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", type);
        conn.setRequestProperty("Content-Length", String.valueOf(encodedData.length()));
        os = conn.getOutputStream();
        HM.log("os: " + os);
        final byte[] bytes = encodedData.getBytes();
        HM.log("SSP, bytes to send: " + bytes.length);
        os.write(bytes);
        int responseCode = conn.getResponseCode();
        HM.log("SSP, server response: " + responseCode + ", " + conn.getResponseMessage());
        os.close();

        if (responseCode == 200)
        {
          data = null;
          lastSuccess = System.currentTimeMillis();
        }
      }
      catch (Exception e)
      {
        HM.log("SSP, error: " + e.getMessage() + ", cause: " + e.getCause().getMessage());
      }
    }

    HM.log("SSP stopped");
  }

  void killConnections()
  {
    HM.log("SSP, killConnections()");
    new Thread()
    {
      public void run()
      {
        try
        {
          HM.log("SSP, os: " + os);
          if (os != null)
            os.close();

          HM.log("SSP, conn: " + conn);
          if (conn != null)
            conn.disconnect();

          HM.log("SSP, killConnections() - done");
        }
        catch (Exception e)
        {
          HM.log("SSP, connection kill error: " + e.getMessage() + ", cause: " + e.getCause().getMessage());
        }
      }
    }.start();
  }
}