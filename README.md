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

**Устновка сервера с помощью vagrant**

Необходимо установить VirtualBox: https://www.virtualbox.org/

Vagrant: https://www.vagrantup.com/downloads.html

```
mkdir ~/itmoproctor
cd ~/itmoproctor
vagrant init itmoproctor/itmoproctor
vagrant up
vagrant ssh
```
Заходить в веб-интерфейс по адресу localhost:3001 на хост-машине. На гостевой localhost:3000.
