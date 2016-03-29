#!/bin/bash
# webm-archiver.sh
# (C) 2016 Anton Skshidlevsky <meefik@gmail.com>, GPLv3
#
# Перекодирование множества файлов от трех камер в один комлексный экран и передача его на webdav-сервер.
# Требуется: bash, curl, ffmpeg
#
# Формат входных файлов: <timestamp>_<type>-<exam_id>-<user_id>.webm (^[0-9]\+_[a-z0-9]\+-[0-9a-f]\{24\}-[0-9a-f]\{24\}\.webm$)
# timestamp - отметка времени создания файла в миллисекундах
# type - тип видеопотока (camera или screen)
# exam_id - идентификатор экзамена
# user_id - идентификатор пользователя

STORAGE_URL="http://localhost/webdav/"
STORAGE_USER="proctor"
STORAGE_PASS="proctor"

STORAGE_DIR="/storage"
FRAME_RATE="5"
LOG_FILE="${STORAGE_DIR%/}/output.log"
NCPU=$(grep -c ^processor /proc/cpuinfo)

# определение разрешения видео на основе идентификатора камеры в имени файла
get_video_resolution()
{
    case "$1" in
    *camera*)
        echo 320 240
    ;;
    *screen*)
        echo 768 480
    ;;
    esac
}

# запись в лог
write_log()
{
    echo "$(date '+%D %T') $@" >> "${LOG_FILE}"
}

# команда вызова ffmpeg
ffmpeg_exec()
{
    ffmpeg -y -threads ${NCPU} "$@" </dev/null >/dev/null
}

# определение продолжительности видеофайла в миллисекундах
get_video_duration()
{
    local in_file="$1"
    ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${in_file}" | LC_NUMERIC="C" awk '{printf("%.0f", $1 * 1000)}'
}

# перекодирование исходного видеофайла с заданным разрешением и числом кадров в секунду
scale_video_file()
{
    local in_file="$1"
    local out_file="$2"
    local width="$3"
    local height="$4"
    ffmpeg_exec -i "$in_file" -c:v vp8 -r:v ${FRAME_RATE} -filter:v scale="'if(gte(a,4/3),${width},-1)':'if(gt(a,4/3),-1,${height})'",pad="${width}:${height}:(${width}-iw)/2:(${height}-ih)/2" -c:a libvorbis -q:a 0 "${out_file}"
}

# создания файла-загрушки для заполнения пропусков между видеофайлами
write_blank_file()
{
    local out_file="$1"
    [ -e "${out_file}" ] && return;
    local duration=$(echo $2 | LC_NUMERIC="C" awk '{printf("%.3f", $1 / 1000)}')
    local width="$3"
    local height="$4"
    ffmpeg_exec -f lavfi -i "color=c=black:s=${width}x${height}:d=${duration}" -c:v vp8 -r:v ${FRAME_RATE} -f lavfi -i "aevalsrc=0|0:d=${duration}:s=48k" -c:a libvorbis -q:a 0 "${out_file}"
}

# объединение файлов одной видеогруппы
concat_video_group()
{
    local video_group="$1"
    ffmpeg_exec -f concat -i <(ls "${OUTPUT_DIR}" | grep -oe "^[0-9]\+_${video_group}$" | sort -n | xargs -I FILE echo "file ${OUTPUT_DIR%/}/FILE") -c copy "${OUTPUT_DIR}/${video_group}"
    ls "${OUTPUT_DIR}" | grep -oe "^[0-9]\+_${video_group}$" | xargs -I FILE rm "${OUTPUT_DIR%/}/FILE"
}

# кодирование комплексного экрана из трех видеофайлов
encode_video_complex()
{
    local video_file="$1"
    local camera1="$2"
    local camera2="$3"
    local camera3="$4"
    ffmpeg_exec \
        -i "${OUTPUT_DIR%/}/${camera1}" \
        -i "${OUTPUT_DIR%/}/${camera2}" \
        -i "${OUTPUT_DIR%/}/${camera3}" \
        -threads ${NCPU} -c:v vp8 -r:v ${FRAME_RATE} -c:a libvorbis -q:a 0 \
        -filter_complex "
            pad=1088:480 [base];
            [0:v] setpts=PTS-STARTPTS, scale=320:240 [camera1];
            [1:v] setpts=PTS-STARTPTS, scale=320:240 [camera2];
            [2:v] setpts=PTS-STARTPTS, scale=768:480 [screen];
            [base][camera1] overlay=x=0:y=0 [tmp1];
            [tmp1][camera2] overlay=x=0:y=240 [tmp2];
            [tmp2][screen] overlay=x=320:y=0;
            [0:a][1:a] amix" "${OUTPUT_DIR%/}/${video_file}"
    ls "${OUTPUT_DIR}" | grep -v "${video_file}" | xargs -I FILE rm "${OUTPUT_DIR%/}/FILE"
}

# преобразование меток
# input: timestamp:flag:filename
# output: timestamp:duration:filename
find_spaces()
{
    local state=0 prev=0
    sort -n | while read item
    do
        arr=(${item//:/ })
        timestamp=${arr[0]}
        flag=${arr[1]}
        let state=state+flag
        if [ ${state} -eq 0 ]
        then
            let prev=timestamp
        elif [ ${prev} -gt 0 ]
        then
            let duration=timestamp-prev
            if [ ${duration} -gt 0 ]
            then
                echo ${prev}:${duration}:${arr[2]}
            fi
            prev=0
        fi
    done
}

# добавление первой и последней метки с нулевой продолжительностью
zero_marks()
{
    sort -n | sed '1!{$!d}' | while read item
    do
        arr=(${item//:/ })
        timestamp=${arr[0]}
        for video_group in ${VIDEO_GROUPS}
        do
            echo ${timestamp}:1:${video_group}
            echo ${timestamp}:-1:${video_group}
        done
    done
}

# добавить фрагменты, на которых нет видео ни с одной камеры
blank_marks()
{
    find_spaces | while read item
    do
        arr=(${item//:/ })
        first_time=${arr[0]}
        duration=${arr[1]}
        let last_time=first_time+duration
        for video_group in ${VIDEO_GROUPS}
        do
            echo ${first_time}:1:${video_group}
            echo ${last_time}:-1:${video_group}
        done
    done
}

# генерирование меток в формате: timestamp:duration:filename
generate_marks()
{
    ls "${OUTPUT_DIR}" | grep "^[0-9]\+_" | sort -n | while read video_file
    do
        filename=${video_file#*_}
        timestamp=${video_file%%_*}
        duration=$(get_video_duration "${OUTPUT_DIR%/}/${video_file}")
        echo ${timestamp}:1:${filename}
        echo $((timestamp+duration)):-1:${filename}
    done | tee >(zero_marks) >(blank_marks)
}

# поиск фрагментов по каждой камере, на которых нет видео
fragments_by_groups()
{
    local cmd="tee"
    for video_group in ${VIDEO_GROUPS}
    do
        cmd="${cmd} >(grep :${video_group}$ | find_spaces)"
    done
    eval "${cmd} >/dev/null"
}

# запись недостающих видеофрагментов
write_fragments()
{
    while read item
    do
        arr=(${item//:/ })
        timestamp=${arr[0]}
        duration=${arr[1]}
        video_file=${arr[2]}
        write_blank_file "${OUTPUT_DIR%/}/${timestamp}_${video_file}" "${duration}" $(get_video_resolution "${video_file}")
    done
}

# загрузить файл на сервер webdav
# input: video_file
upload()
{
    local video_file="$1"
    [ -n "${video_file}" ] || return 1
    [ -z "${STORAGE_URL}" ] && return 0
    local http_code=$(curl -o /dev/null -w "%{http_code}" --digest --user ${STORAGE_USER}:${STORAGE_PASS} -T "${STORAGE_DIR%/}/${video_file}" "${STORAGE_URL%/}/${video_file}")
    # если файл создан, то код ответа 201, если обновлен - 204
    test "${http_code}" = "201" -o "${http_code}" = "204"
}

# проверить существование файла на сервере webdav
# input: video_file
is_uploaded()
{
    local video_file="$1"
    [ -n "${video_file}" ] || return 1
    [ -z "${STORAGE_URL}" ] && return 0
    local http_code=$(curl -I -o /dev/null -w "%{http_code}" --digest --user ${STORAGE_USER}:${STORAGE_PASS} "${STORAGE_URL%/}/${video_file}")
    # если файл существует, то код ответа 200
    test "${http_code}" = "200"
}

# проверить существование файла
# input: video_file
is_exist()
{
    local video_file="$1"
    [ -n "${video_file}" ] || return 1
    test -e "${STORAGE_DIR%/}/${video_file}"
}

# функция кодирования видеосессии
# input: video_file
# output: ${STORAGE_DIR}/${video_file}
encode_video_session()
{
    local output_file="$1"
    [ -n "${output_file}" ] || return 1
    # создать временную директорию
    OUTPUT_DIR=$(mktemp -d)
    # удалить пустые файлы из исходного каталога
    find "${STORAGE_DIR}" -empty -type f -exec rm {} \;
    # перекодировать видео по заданному формату
    ls "${STORAGE_DIR}" | grep -e "^[0-9]\+_[a-z0-9]\+-${output_file%*.webm}.*$" | while read video_file
    do
        scale_video_file "${STORAGE_DIR%/}/${video_file}" "${OUTPUT_DIR%/}/${video_file}" $(get_video_resolution "${video_file}")
    done
    # получить видеогруппы
    VIDEO_GROUPS=$(ls "${OUTPUT_DIR}" | grep "^[0-9]\+_" | cut -f2- -d_ | sort -u)
    if [ $(echo ${VIDEO_GROUPS} | grep -c camera) -lt 2 ]
    then
        VIDEO_GROUPS="${VIDEO_GROUPS} camera-${output_file}"
    fi
    if [ $(echo ${VIDEO_GROUPS} | grep -c screen) -eq 0 ]
    then
        VIDEO_GROUPS="${VIDEO_GROUPS} screen-${output_file}"
    fi
    # воссоздать недостающие видеофрагменты
    generate_marks | fragments_by_groups | write_fragments
    # объединить видеофрагменты по группам
    local video_group
    for video_group in ${VIDEO_GROUPS}
    do
        concat_video_group "${video_group}"
    done
    # создать комплексный экран на основе полученных групп
    encode_video_complex "${output_file}" ${VIDEO_GROUPS}
    # переместить файл комплескного экрана в исходную директорию
    mv "${OUTPUT_DIR%/}/${output_file}" "${STORAGE_DIR%/}/${output_file}"
    # удалить временную директорию
    if [ -e "${OUTPUT_DIR}" ]
    then
        rm -rf "${OUTPUT_DIR}"
    fi
}

# архивирование видеофрагментов и загрузка на сервер
# input: pipe
archiver()
{
    while read exam_id
    do
        video_file="${exam_id}.webm"
        echo ">>> Processing: ${video_file}"
        # проверить существование файла
        if ! is_exist "${video_file}"
        then
            # запустить перекодирование видеофайлов сессии
            encode_video_session "${video_file}"
            # загрузить или обновить файл на сервере
            upload "${video_file}"
        else
            # загрузить файл на сервер, если еще не загружен
            is_uploaded "${video_file}" || upload "${video_file}"
        fi
        # записать результат в лог
        if [ $? -eq 0 ]
        then
            write_log "${video_file} ok"
        else
            write_log "${video_file} fail"
        fi
    done
}

# получение списка сессий и запуск архивирования
ls "${STORAGE_DIR}" | grep -e "^[0-9]\+_[a-z0-9]\+-[0-9a-f]\{24\}-[0-9a-f]\{24\}\.webm$" | cut -f2 -d- | sort -u | archiver
