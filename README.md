# ITMOproctor

Система дистанционного надзора ITMOproctor предназначена для сопровождения
процесса территориально удаленного прохождения экзаменов, подтверждения личности
испытуемого и подтверждения результатов его аттестации.

Система поддерживает интеграцию на уровне API со следующими LMS:

- [Национальная платформа открытого образования](https://openedu.ru)
- [Система управления обучением Университета ИТМО](https://de.ifmo.ru)

## Клиентская часть

Системные требования:

| Параметр                     | Минимальные требования           |
| ---------------------------- | -------------------------------- |
| Операционная система         | Windows 7+; macOS 10.12+; Linux  |
| Процессор                    | Intel i3 1.2 ГГц или эквивалент  |
| Скорость сетевого соединения | 1 Мбит/c                         |
| Свободное место на диске     | 500 МБ                           |
| Свободная оперативная память | 1 ГБ                             |
| Разрешение веб-камеры        | 640x480                          |
| Частота кадров веб-камеры    | 15 кадров/с                      |
| Разрешение экрана монитора   | 1280x720                         |

Инструкции:

- [Инструкция по использованию системы для студентов](https://docs.google.com/document/d/15fsEL3sHCGuJ9_rSuFprQXP--WXb9Ct-PzayBXvxWp0/preview)
- [Инструкция по использованию системы для инспекторов](https://docs.google.com/document/d/1EbW52RQLdgwkRwJa_HgzP-nqU_860bPQuMZZ-ns1Hmc/preview)

## Серверная часть

- [Ubuntu](https://ubuntu.com)
- [node.js](https://nodejs.org) и [nw.js](https://nwjs.io)
- [MongoDB](https://www.mongodb.com)
- [Kurento Media Server](https://www.kurento.org)

Системные требования:

| Параметр                      | Минимальные требования                           |
| ----------------------------- | ------------------------------------------------ |
| Операционная система          | Ubuntu 18.04 (64 бита)                           |
| Процессор                     | AMD Six-Core Opteron 2427 2.2 ГГц или эквивалент |
| Средняя нагрузка на процессор | 5% / сессия                                      |
| Оперативная память            | 2 ГБ + 100 МБ / сессия                           |
| Сетевое соединение            | 1.5 Мбит/c / сессия                              |
| Запись на диск                | 150 КБ/c / сессия                                |
| Дисковое пространство         | 500 МБ/час / сессия                              |
| Архивирование                 | 100 МБ/час / сессия                              |

Документация:

- [Открытая система прокторинга для дистанционного сопровождения онлайн-экзаменов](https://habr.com/ru/post/277147/)

## Развертывание системы

Установить Node.js:

```sh
apt-get update
apt-get install -y wget gnupg
wget -O - https://deb.nodesource.com/setup_12.x | bash -
apt-get install -y nodejs git build-essential python-dev --no-install-recommends
```

Установить MongoDB:

```sh
wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | sudo apt-key add -
echo "deb [arch=amd64,arm64] https://repo.mongodb.org/apt/ubuntu bionic/mongodb-org/4.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list
apt-get update
apt-get install -y mongodb-org --no-install-recommends
systemctl enable mongod
```

Установить Kurento Media Server:

```sh
sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 5AFA7A83
source /etc/lsb-release
sudo tee "/etc/apt/sources.list.d/kurento.list" >/dev/null <<EOF
# Kurento Media Server - Release packages
deb [arch=amd64] http://ubuntu.openvidu.io/6.16.0 $DISTRIB_CODENAME kms6
EOF
apt-get update
apt-get install -y kurento-media-server ffmpeg curl --no-install-recommends
```

Запустить сервер:

```sh
git clone https://github.com/meefik/ITMOproctor.git
cd ./ITMOproctor
npm install
cp config-example.json config.json
npm start
```

Собрать декстоп-приложение под все архитектуры:

```sh
apt-get install tar zip unzip wget upx-ucl
npm run build-app
```

Архивы для загрузки приложения будут размещены в `public/dist`.
Изменить адрес страртовой страницы приложения можно в файле `app-nw/package.json`, поле `homepage`.

## Вход в систему

По умолчанию сервер доступен по адресу [localhost:3000](http://localhost:3000).

Для администратора логин / пароль: `admin / changeme`
