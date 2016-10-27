cd /opt/hm/
rm log0000.txt
mv log000.txt log0000.txt
mv log00.txt log000.txt
mv log0.txt log00.txt
mv log.txt log0.txt
java -jar hm.jar > /dev/null 2>&1 &
