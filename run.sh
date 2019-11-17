cd /opt/hm/

ps ax | grep java
echo starting..
java -jar hm.jar > /dev/null 2>&1 &
echo started:
ps ax | grep java


