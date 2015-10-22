# ITMOproctor

(с) [Университет ИТМО](http://www.ifmo.ru), 2015

Проект опубликован под лицензией [GPL версии 3](http://www.gnu.org/licenses/gpl-3.0.html).

Система дистанционного надзора ITMOproctor предназначена для сопровождения процесса территориально удаленного прохождения экзаменов, подтверждения личности испытуемого и подтверждения результатов его аттестации.

**Клиентская часть**

| Параметр                     | Минимальные требования          |
|------------------------------|---------------------------------|
| Операционная система         | Windows XP+; OS X 10.7+; Linux  |
| Разрешение веб-камеры        | 640x480                         |
| Частота кадров веб-камеры    | 15 кадров/с                     |
| Разрешение экрана монитора   | 1280x720                        |
| Скорость сетевого соединения | 2 Мбит/c                        |
| Свободное место на диске     | 100 МБ                          |
| Оперативная память           | 1 ГБ                            |
| Процессор                    | Intel i3 1.2 ГГц или эквивалент |

[Инструкция по использованию системы ITMOproctor](https://drive.google.com/file/d/0B7YdZbqVWxzeZnU4WmlvWXJubnc/view?usp=sharing)

**Серверная часть**

* [Debian GNU/Linux](http://www.debian.org)
* [node.js](http://www.nodejs.org) и [nw.js](http://nwjs.io)
* [MongoDB](http://mongodb.org)
* [Kurento Media Server](http://kurento.com)

[Структурная схема ITMOproctor] (https://drive.google.com/file/d/0B7YdZbqVWxzeMGRuVjZaaEpzVDA/view?usp=sharing)

**Запуск серверной части через Vagrant**

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

**Развертывание системы на Ubuntu 14.04**

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

Клонирование репозитория itmoproctor и инициализация:
```
mkdir ~/itmoproctor
cd ~/itmoproctor
git clone https://github.com/meefik/ITMOproctor.git ./
npm install
npm start
```

Добавление пользователей
```
cd ~/imoproctor/db
node import.js data.json
```