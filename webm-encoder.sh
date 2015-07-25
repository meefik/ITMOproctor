#!/bin/bash

if [ ! -d "$1" ]
then
    echo "Usage: $0 <directory>"
    exit 1
fi

STORAGE_DIR=$1
NCPU=$(grep -c ^processor /proc/cpuinfo)

# get video resolution
resolution()
{
    for filename in $*
    do
        local eval $(ffprobe -v error -of flat=s=_ -select_streams v:0 -show_entries stream=height,width "$filename")
        echo ${streams_stream_0_width}x${streams_stream_0_height}
    done
}

# encode video
encoder()
{
    local file_type=$1
    local frame_rate=$2
    ls ${STORAGE_DIR} | grep -oe "^[0-9]\+_${file_type}\-[0-9a-f]\{24\}-[0-9a-f]\{24\}\.webm$" | grep -oe "${file_type}\-[0-9a-f]\{24\}-[0-9a-f]\{24\}\.webm$" | sort -u | while read webm_file
    do
        echo ">>> Processing: ${webm_file}"
        [ -e "${STORAGE_DIR}/${webm_file}" ] && continue
        local temp_dir=$(mktemp -d)
        local webm_group=$(ls ${STORAGE_DIR} | grep -e "^[0-9]\+_${webm_file}$")
        local output_resolution=$(cd ${STORAGE_DIR} && resolution ${webm_group} | sort | tail -1)
        for filename in ${webm_group}
        do
            ffmpeg -i ${STORAGE_DIR}/${filename} -threads ${NCPU} -r ${frame_rate} -c:v vp8 -c:a copy -vf scale=${output_resolution} ${temp_dir}/${filename} </dev/null
        done
        ffmpeg -f concat -i <(find ${temp_dir} -name '*.webm' -printf "file '%p'\n" | sort) -c copy ${STORAGE_DIR}/${webm_file} </dev/null
        (cd ${STORAGE_DIR} && md5sum ${webm_file}) > ${STORAGE_DIR}/${webm_file}.md5
        [ -d "${temp_dir}" ] && rm -rf ${temp_dir}
    done
}

# remove empty files
find ${STORAGE_DIR} -empty -type f -exec rm {} \;

# encode webcam
encoder webcam 15

# encode screen
encoder screen 5
