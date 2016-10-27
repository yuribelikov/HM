#!/bin/sh

# echo "checking web status.."
# STATUS=`ping ya.ru -c 1 -w 2 | grep " 1 received"`

# if [ -z "$STATUS" ]
# then
  # echo "web is unavailable, trying to restore connection.."
  # wget --post-data 'accept_lte=1&redirurl=http%3A%2F%2Fwww.kasatkin.org%2Fyota&connection_type=light&service_id=Sliders_Free_Temp' http://hello.yota.ru/php/go.php
  # echo "checking web status again.."
  # STATUS=`ping ya.ru -c 1 -w 2 | grep " 1 received"`
  # if [ -z "$STATUS" ]
  # then
    # echo "web is unavailable, exiting.."
    # exit;
  # else
    # echo "connection restored"
  # fi
# fi

echo "checking yandex.disk.."
DIR=/opt/yandex.disk/hm
if ! [ -d $DIR ]
then
  echo "mounting yandex.disk.."
  mount -t davfs https://webdav.yandex.ru /opt/yandex.disk -o uid=pi,gid=pi,rw,file_mode=0777,dir_mode=0777;
fi

echo "checking cmd file.."
if [ -f $DIR/cmd.sh ]
then
  echo "cmd file found, executing.."
  sudo su;
  cp -u $DIR/cmd.sh /opt/hm/;
  cp -u $DIR/hm.* /opt/hm;
  rm $DIR/cmd.sh.done;
  mv $DIR/cmd.sh $DIR/cmd.sh.done;
  /opt/hm/cmd.sh;
fi

echo "done."
