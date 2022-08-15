ps ax | grep java
echo stopping..
exec 3<>/dev/tcp/127.0.0.1/61234
sleep 2
echo done.
ps ax | grep java

