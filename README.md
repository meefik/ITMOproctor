# ITMOproctor

Система дистанционного надзора ITMOproctor предназначена для сопровождения процесса территориально удаленного прохождения экзаменов, подтверждения личности испытуемого и подтверждения результатов его аттестации.

Система поддежрививает интеграцию на уровне API со следующими LMS:
* [Национальная платформа открытого образования](https://openedu.ru)
* [Система управления обучением Университета ИТМО](http://de.ifmo.ru)

### Клиентская часть

Системные требования:

| Параметр                     | Минимальные требования          |
|------------------------------|---------------------------------|
| Операционная система         | Windows XP+; OS X 10.7+; Linux  |
| Процессор                    | Intel i3 1.2 ГГц или эквивалент |
| Скорость сетевого соединения | 1 Мбит/c                        |
| Свободное место на диске     | 100 МБ                          |
| Свободная оперативная память | 1 ГБ                            |
| Разрешение веб-камеры        | 640x480                         |
| Частота кадров веб-камеры    | 15 кадров/с                     |
| Разрешение экрана монитора   | 1280x720                        |

Инструкции:
* [Инструкция по использованию системы для студентов](https://docs.google.com/document/d/15fsEL3sHCGuJ9_rSuFprQXP--WXb9Ct-PzayBXvxWp0/edit?usp=sharing)
* [Инструкция по использованию системы для инспекторов](https://docs.google.com/document/d/1EbW52RQLdgwkRwJa_HgzP-nqU_860bPQuMZZ-ns1Hmc/edit?usp=sharing)

### Серверная часть

* [Debian GNU/Linux](http://www.debian.org) или [Ubuntu](http://www.ubuntu.com)
* [node.js](http://www.nodejs.org) и [nw.js](http://nwjs.io)
* [MongoDB](http://mongodb.org)
* [Kurento Media Server](http://kurento.com)

Системные требования:

| Параметр                      | Минимальные требования                           |
|-------------------------------|--------------------------------------------------|
| Операционная система          | Ubuntu 14.04 (64 бита)                           |
| Процессор                     | AMD Six-Core Opteron 2427 2.2 ГГц или эквивалент |
| Средняя нагрузка на процессор | 5% / сессия                                      |
| Оперативная память            | 2 ГБ + 100 МБ / сессия                           |
| Сетевое соединение            | 1.5 Мбит/c / сессия                              |
| Запись на диск                | 150 КБ/c / сессия                                |
| Дисковое пространство         | 500 МБ/час / сессия                              |
| Архивирование                 | 100 МБ/час / сессия                              |

Документация:
* [Структурная схема системы](https://drive.google.com/file/d/0B7YdZbqVWxzeSlFWZUl4S1RiaVE/view?usp=sharing)
* [Диаграмма взаимодействия компонентов системы](https://drive.google.com/file/d/0B7YdZbqVWxzeRVVBanVFWlVNQ2M/view?usp=sharing)

#### Запуск серверной части через Vagrant

Необходимо установить:

* [VirtualBox](https://www.virtualbox.org/)
* [Vagrant](https://www.vagrantup.com/downloads.html)

Выполнить команды для запуска бокса:
```
mkdir ~/itmoproctor
cd ~/itmoproctor
vagrant init itmo/itmoproctor
vagrant up
vagrant ssh
```
Веб-интерфейс на хост-машине: [localhost:3001](http://localhost:3001)<br>На гостевой машине: [localhost:3000](http://localhost:3000)

#### Развертывание системы на Ubuntu 14.04

Установить MongoDB:
```
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
echo "deb http://repo.mongodb.org/apt/ubuntu trusty/mongodb-org/3.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
```

Установить Node.js:
```
curl --silent --location https://deb.nodesource.com/setup_0.12 | sudo bash -
sudo apt-get install --yes nodejs
```

Установить Kurento Media Server:
```
echo "deb http://ubuntu.kurento.org trusty main" | sudo tee /etc/apt/sources.list.d/kurento.list
wget -O - http://ubuntu.kurento.org/kurento.gpg.key | sudo apt-key add -
sudo apt-get update
sudo apt-get install kurento-server
```

Клонирование репозитория ITMOproctor и инициализация:
```
git clone https://github.com/meefik/ITMOproctor.git
cd ./ITMOproctor
mv config-example.json config.json
npm install
```

Запуск сервера, по умолчанию сервер доступен по адресу [localhost:3000](http://localhost:3000):
```
npm start
```

Сборка приложения под все архитектуры, архивы для загрузки приложения будут размещены в public/dist:
```
apt-get install tar zip unzip wget upx-ucl
npm run-script build-app
```

Добавление пользователей:
```
cd ./ITMOproctor/db
node import.js users.json
```
