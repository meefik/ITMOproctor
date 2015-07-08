#!/bin/bash

NW_VERSION="0.12.2"
NW_PLATFORM="linux-ia32 linux-x64 win-ia32 win-x64" # linux-ia32 linux-x64 osx-ia32 osx-x64 win-ia32 win-x64
APP_NAME="itmo-proctor"
APP_DIR="${PWD}/app-nw"
CACHE_DIR="${PWD}/cache"
DIST_DIR="${PWD}/dist"

download()
{
   local url=$1
   local filename=$2
   echo -n "Downloading ${filename##*/}... "
   if [ ! -e "$filename" ]
   then
      [ ! -e "${CACHE_DIR}" ] && mkdir -p ${CACHE_DIR}
      wget -O $filename $url > /dev/null
   fi
   echo "done"
}

unpack()
{
   local filename=$1
   local target_dir=$2
   echo -n "Unpacking ${filename##*/} to ${target_dir##*/}... "
   [ ! -e "${target_dir}" ] && mkdir -p ${target_dir}
   if [ "${filename##*.}" = "zip" ]
   then
      unzip -q $filename -d $target_dir
      local unpacked_dir=$(find $target_dir -mindepth 1 -maxdepth 1)
      mv $unpacked_dir/* $target_dir
      rmdir $unpacked_dir
   else
      tar xzf $filename --strip 1 -C $target_dir
   fi
   echo "done"
}

clean()
{
   echo -n "Cleaning nw.js... "
   local target_dir=$1
   find $target_dir -name "credits.html" -o -name "nwjc" -o -name "nwjc.exe" | while read f; do rm $f; done
   echo "done"
}

pack_upx()
{
   local target_dir=$1
   echo -n "Packaging nw.js using UPX... "
   local files=$(find $target_dir -type f -name "nw" -o -name "nw.exe" | tr '\n' ' ')
   [ -n "${files}" ] && upx ${files} > /dev/null
   echo "done"
}

pack_app()
{
   local target_dir=$1
   echo -n "Combining nw.js and ${APP_NAME} app... "
   if [ -e "$target_dir/nw" ]
   then
      cat $target_dir/nw ${DIST_DIR}/app.nw > $target_dir/${APP_NAME} && chmod +x $target_dir/${APP_NAME}
      rm $target_dir/nw
   fi
   if [ -e "$target_dir/nw.exe" ]
   then
      cat $target_dir/nw.exe ${DIST_DIR}/app.nw > $target_dir/${APP_NAME}.exe && chmod +x $target_dir/${APP_NAME}.exe
      rm $target_dir/nw.exe
   fi
   echo "done"
}

pack_zip()
{
   local target_dir=$1
   local archive=$2
   echo -n "Packaging ${archive##*/}... "
   [ -e "$archive" ] && rm $archive
   (cd $target_dir; zip -qr $archive *)
   echo "done"
}

pack_tgz()
{
   local target_dir=$1
   local archive=$2
   echo -n "Packaging ${archive##*/}... "
   [ -e "$archive" ] && rm $archive
   tar czf $archive -C $target_dir .
   echo "done"
}

build_app()
{
   local url=$1
   local target_dir=$2
   local filename=${CACHE_DIR}/${url##*/}
   download $url $filename
   unpack $filename $target_dir
   clean $target_dir
   pack_upx $target_dir
   pack_app $target_dir
}

clean_dir()
{
   local target_dir=$1
   local recreate=$2
   echo -n "Clearing ${target_dir##*/} directory... "
   if [ -e "$target_dir" ]
   then
      rm -rf $target_dir
      mkdir -p $target_dir
   fi
   echo "done"
}

clean_dir ${DIST_DIR}
pack_zip ${APP_DIR} ${DIST_DIR}/app.nw

for platform in ${NW_PLATFORM}
do
   echo ">>> Processing: ${platform}"
   platform_dir=${DIST_DIR}/${platform}
   case "${platform}" in
   linux-*)
      build_app "http://dl.nwjs.io/v${NW_VERSION}/nwjs-v${NW_VERSION}-${platform}.tar.gz" ${platform_dir}
      pack_tgz ${platform_dir} ${DIST_DIR}/${APP_NAME}-${platform}.tar.gz
   ;;
   win-*)
      build_app "http://dl.nwjs.io/v${NW_VERSION}/nwjs-v${NW_VERSION}-${platform}.zip" ${platform_dir}
      pack_zip ${platform_dir} ${DIST_DIR}/${APP_NAME}-${platform}.zip
   ;;
   osx-*)
      
   ;;
   esac
   [ -e "${platform_dir}" ] && rm -rf ${platform_dir}
done
