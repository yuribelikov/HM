$(document).ready(main);

function main()
{
  $.ajaxSetup({cache: false});
  var dashboard = new Dashboard();
  $(window).resize(dashboard.onResize.bind(dashboard));
}
