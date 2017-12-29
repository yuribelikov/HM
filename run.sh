cd /opt/hm/
rm log-7.txt
mv log-6.txt log-7.txt
mv log-5.txt log-6.txt
mv log-4.txt log-5.txt
mv log-3.txt log-4.txt
mv log-2.txt log-3.txt
mv log-1.txt log-2.txt
mv log.txt log-1.txt
java -jar hm.jar > /dev/null 2>&1 &
