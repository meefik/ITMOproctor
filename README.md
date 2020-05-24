# ITMOproctor

Система дистанционного надзора ITMOproctor предназначена для сопровождения
процесса территориально удаленного прохождения экзаменов, подтверждения личности
испытуемого и подтверждения результатов его аттестации.

Система поддерживает интеграцию на уровне API со следующими LMS:

- [Национальная платформа открытого образования](https://openedu.ru)
- [Система управления обучением Университета ИТМО](https://de.ifmo.ru)

## Клиентская часть

Системные требования:

| Параметр                     | Минимальные требования          |
| ---------------------------- | ------------------------------- |
| Операционная система         | Windows XP+; OS X 10.7+; Linux  |
| Процессор                    | Intel i3 1.2 ГГц или эквивалент |
| Скорость сетевого соединения | 1 Мбит/c                        |
| Свободное место на диске     | 100 МБ                          |
| Свободная оперативная память | 1 ГБ                            |
| Разрешение веб-камеры        | 640x480                         |
| Частота кадров веб-камеры    | 15 кадров/с                     |
| Разрешение экрана монитора   | 1280x720                        |

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
| Операционная система          | Ubuntu 16.04 (64 бита)                           |
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

Установить MongoDB:

```sh
apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 58712A2291FA4AD5
echo "deb http://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/3.6 multiverse" | tee /etc/apt/sources.list.d/mongodb-org.list
apt-get update
apt-get install -y mongodb-org --no-install-recommends
systemctl enable mongod
```

Установить Node.js:

```sh
apt-get update
apt-get install -y wget gnupg
wget -O - https://deb.nodesource.com/setup_12.x | bash -
apt-get install -y nodejs git build-essential python-dev --no-install-recommends
```

Установить Kurento Media Server:

```sh
echo "deb [arch=amd64] http://ubuntu.openvidu.io/6.13.0 xenial kms6" | tee /etc/apt/sources.list.d/kurento.list
apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 5AFA7A83
apt-get update
apt-get install -y kurento-media-server ffmpeg curl --no-install-recommends
```

Запуск сервера, по умолчанию сервер доступен по адресу [localhost:3000](http://localhost:3000):

```sh
git clone https://github.com/meefik/ITMOproctor.git
cd ./ITMOproctor
npm install
cp config-example.json config.json
npm start
```

Сборка приложения под все архитектуры, архивы для загрузки приложения будут
размещены в `public/dist`:

```sh
apt-get install tar zip unzip wget upx-ucl
npm run build-app
```

Добавление пользователей:

```sh
cd ./db
node import.js users.json
```

Для администратора логин / пароль: `admin / admin`
