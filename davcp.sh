#!/bin/bash

echo 'checking video data..';
today=$(date +%Y-%m-%d);
#hour=$(date +%H);

cameraPath='/media/camera/2H03B20PAM00044';
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

davDir='/media/dav';
davTodayDir="$davDir/$today";
if ! [ -d $davTodayDir ]
then
  echo "dav today directory is not exist, creating: $davTodayDir";
  mkdir $davTodayDir;
fi
echo "moving '$srcDav' to '$davTodayDir'";
mv $srcDav $davTodayDir;

echo "done.";
