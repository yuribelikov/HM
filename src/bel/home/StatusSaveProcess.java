package bel.home;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.Socket;
import java.net.URL;
import java.net.URLEncoder;
import java.util.List;

public class StatusSaveProcess extends Thread
{
  private String data = null;
  boolean isAlive = true;
  long lastSuccess = System.currentTimeMillis();
  byte failures = 0;
  long lastWiFiReboot = -1;


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

        String encodedData = URLEncoder.encode(data, "UTF-8");
        String type = "application/x-www-form-urlencoded";
        String statusSaveUrl = HM.properties.getProperty("status.save.url");
        HM.log("SSP, sending status data to: " + statusSaveUrl);
        URL u = new URL(statusSaveUrl);
        HttpURLConnection conn = (HttpURLConnection) u.openConnection();
        conn.setConnectTimeout(25000);
        conn.setDoOutput(true);
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", type);
        conn.setRequestProperty("Content-Length", String.valueOf(encodedData.length()));
        OutputStream os = conn.getOutputStream();
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
          continue;
        }

        restoreConnection();
      }
      catch (Exception e)
      {
        HM.log("SSP, error: " + e.getMessage() + ", cause: " + e.getCause().getMessage());
        restoreConnection();
      }

      sleepBeforeRetry();
    }
  }

  private void restoreConnection()
  {
    HM.log("SSP, restoreConnection(), failures: " + failures);
    failures++;
    if (checkRouter())
      return;

    while (System.currentTimeMillis() - lastWiFiReboot < 60000)
    {
      sleepBeforeRetry();
      if (checkRouter())
        return;
    }

    try
    {
      String cmd = "sudo /sbin/ifdown wlan0";
      HM.log("SSP, turning down WiFi: " + cmd);
      Runtime.getRuntime().exec(cmd).waitFor();
      HM.log("SSP, waiting for 10 seconds..");
      sleep(10000);
      cmd = "sudo /sbin/ifup --force wlan0";
      HM.log("SSP, turning up WiFi: " + cmd);
      Runtime.getRuntime().exec(cmd).waitFor();
      HM.log("SSP, waiting for 20 seconds..");
      sleep(20000);
      lastWiFiReboot = System.currentTimeMillis();
      checkRouter();
    }
    catch (Exception e)
    {
      HM.err(e);
    }
  }

  private boolean checkRouter()
  {
    try
    {
      String router = "192.168.1.1";
      HM.log("SSP, failures: " + failures + ", checking WiFi on: " + router);
      Socket s = new Socket(router, 80);
      HM.log("SSP, WiFi is OK, router socket: " + s);
      failures = 0;
      return true;
    }
    catch (Exception e)
    {
      HM.err(e);
    }
    return false;
  }

  private void sleepBeforeRetry()
  {
    int seconds = failures * 20;
    if (seconds > 60)
      seconds = 60;
    HM.log("SSP, waiting for " + seconds + " seconds..");
    try
    {
      sleep(1000 * seconds);
    }
    catch (InterruptedException ignored)
    {
    }
  }
}