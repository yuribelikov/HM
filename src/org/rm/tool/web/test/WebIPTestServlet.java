package org.rm.tool.web.test;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.net.URLDecoder;

public class WebIPTestServlet extends HttpServlet
{
  //  static String lastIP = "NA";
//  static ArrayList<String> ips = new ArrayList<>();
  static String lastStatus = "NA";

  public WebIPTestServlet()
  {
    System.out.println("new WebIPTest ");
  }

  public void init()
  {
    System.out.println("WebIPTest.init()");
  }

  public void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException
  {
    try
    {
      System.out.println("WebIPTest.doGet()");
      response.getWriter().write("<HTML><body>" + lastStatus + "</body></HTML>");
    }
    catch (Exception e)
    {
      throw new ServletException(e);
    }
  }

  public void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException
  {
    try
    {
      final int contentLength = request.getContentLength();
      System.out.println("WebIPTest.doPost(), len: " + contentLength);
      char[] ca = new char[contentLength];
      final int read = request.getReader().read(ca);
      System.out.println("WebIPTest.doPost(), read: " + read);
      lastStatus = URLDecoder.decode(new String(ca), "UTF-8");

    }
    catch (Exception e)
    {
      throw new ServletException(e);
    }
  }

//  public void doGet0(HttpServletRequest request, HttpServletResponse response) throws ServletException
//  {
//    try
//    {
//      System.out.println("WebIPTest.doGet()");
//      response.getWriter().write("<HTML><body>");
//      response.getWriter().write("last IP: " + lastIP + "<br>");
//      response.getWriter().write("<a href=\"http://" + lastIP + "/hm/data/status.txt\">Move to HM</a><br><br>");
//      response.getWriter().write("Historical IP:<br>");
//      for (int i = ips.size() - 1; i >= 0; i--)
//        response.getWriter().write(ips.get(i) + "<br>");
//
//      response.getWriter().write("</body></HTML>");
//    }
//    catch (Exception e)
//    {
//      throw new ServletException(e);
//    }
//  }
//
//  public void doPost0(HttpServletRequest request, HttpServletResponse response) throws ServletException
//  {
//    try
//    {
//      String ip = request.getHeader("X-Real-IP");
//      System.out.println("WebIPTest.doPost() from: " + ip + " - " + new Date());
//      if (!ip.equals(lastIP))
//      {
//        ips.add(ip + " - " + (new Date()));
//        lastIP = ip;
//      }
//
//    }
//    catch (Exception e)
//    {
//      throw new ServletException(e);
//    }
//  }

//  public void service(HttpServletRequest request, HttpServletResponse response) throws ServletException
//  {
//    try
//    {
//      System.out.println(request.getMethod());
//
//
//    }
//    catch (Exception e)
//    {
//      throw new ServletException(e);
//    }
//  }

}
