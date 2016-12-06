package bel.home;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.util.List;

class StatusSaveProcess extends Thread
{
  private String data = null;
  boolean isAlive = true;
  long lastSuccess = System.currentTimeMillis();
  private HttpURLConnection conn = null;
  private OutputStream os = null;


  StatusSaveProcess()
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
          sleep(100);
          continue;
        }

        if (!HM.checkRouter())
        {
          HM.log("SSP, router not available - skipping..");
          data = null;
          sleep(100);
          continue;
        }

        String encodedData = URLEncoder.encode(data, "UTF-8");
        String type = "application/x-www-form-urlencoded";
        String statusSaveUrl = HM.properties.getProperty("status.save.url");
        URL u = new URL(statusSaveUrl);
        conn = (HttpURLConnection) u.openConnection();
        HM.log("SSP, conn: " + conn);
        conn.setUseCaches(false);
        conn.setConnectTimeout(5000);
        conn.setDoOutput(true);
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", type);
        conn.setRequestProperty("Content-Length", String.valueOf(encodedData.length()));
        conn.setReadTimeout(5000);
        HM.log("SSP, connecting..");
        conn.connect();
        HM.log("SSP, connected");
        os = conn.getOutputStream();
        final byte[] bytes = encodedData.getBytes();
        os.write(bytes);
        int responseCode = conn.getResponseCode();
        HM.log("SSP, server response: " + responseCode + ", " + conn.getResponseMessage() + " (" + bytes.length + " bytes)");
        os.close();

        try
        {
          conn.disconnect();
        }
        catch (Exception e)
        {
          HM.log("SSP, error: " + e.getMessage() + ", cause: " + e.getCause().getMessage());
        }

        if (responseCode == 200)
        {
          data = null;
          lastSuccess = System.currentTimeMillis();
        }
        else
          sleep(20000);

      }
      catch (Exception e)
      {
        HM.log("SSP, error: " + e.getMessage() + ", cause: " + e.getCause().getMessage());
      }
    }

    HM.log("SSP finished.");
  }

  void killProcess()
  {
    HM.log("SSP, killProcess()");
    new Thread()
    {
      public void run()
      {
        try
        {
          isAlive = false;
          sleep(200);
          interrupt();
          sleep(200);
        }
        catch (Exception e)
        {
          HM.err(e);
        }

        try
        {
          HM.log("SSP, os: " + os);
          if (os != null)
            os.close();
        }
        catch (Exception e)
        {
          HM.err(e);
        }

        try
        {
          HM.log("SSP, conn: " + conn);
          if (conn != null)
            conn.disconnect();
        }
        catch (Exception e)
        {
          HM.err(e);
        }

        HM.log("SSP, killProcess() - done");
      }
    }.start();
  }
}