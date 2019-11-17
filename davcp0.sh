#!/bin/bash

echo 'starting..';
echo 'copying hm data..';
cp -rf /opt/hm/data /opt/yandex.disk/hm/

echo 'cheching video data..';
today=$(date +%Y-%m-%d);
#hour=$(date +%H);

cameraPath='/media/camera/2H03B20PAM00044';
buffDir='/tmp/buff';
if ! [ -d $buffDir ]
then
  echo "buffer directory is not exist, creating: $buffDir";
  mkdir $buffDir;
fi

todayDir="$cameraPath/$today";
echo "today dir: $todayDir";
if ! [ -d $todayDir ]
then
  echo "today directory is not exist, exiting.";
  exit;
fi

srcDav="$todayDir/001/dav/*/*.dav";
if ! [ "$(ls -A $srcDav)" ]
then
  echo "today directory has no files like '$srcDav', exiting.";
  exit;
fi


echo 'checking yandex.disk..';
ydDir="/opt/yandex.disk/camera"
if ! [ -d $ydDir ]
then
  echo "yandex.disk is not available for path: '$ydDir', exiting.";
  exit;
fi

ydTodayDir="$ydDir/$today";
if ! [ -d $ydTodayDir ]
then
  echo "yandex.disk today directory is not exist, creating: $ydTodayDir";
  mkdir $ydTodayDir;
fi


echo 'checking lock..';
lockFile="/opt/hm/davcp.lock";
if  [ -e $lockFile ]
then
  echo "locked by another process, lock file: $lockFile";
  exit;
fi

touch $lockFile;

#rm -f /var/cache/davfs2/webdav.yandex.ru+opt-yandex.disk+pi/*

echo "moving '$srcDav' to '$buffDir'";
mv $srcDav $buffDir;
srcIdx="$todayDir/001/dav/*/*.idx";
echo "moving '$srcIdx' to '$buffDir'";
mv $srcIdx $buffDir;

buffFiles="$buffDir/*";
echo "copying '$buffFiles' to '$ydTodayDir'";
cp $buffFiles $ydTodayDir;

davDir='/media/dav';
davTodayDir="$davDir/$today";
if ! [ -d $davTodayDir ]
then
  echo "dav today directory is not exist, creating: $davTodayDir";
  mkdir $davTodayDir;
fi
echo "moving '$buffFiles' to '$davTodayDir'";
mv $buffFiles $davTodayDir;


rm $lockFile;
echo "done.";
