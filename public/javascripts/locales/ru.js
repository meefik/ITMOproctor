define({
  loading: 'Ждите, идет загрузка данных...',
  login: {
    title: 'Вход в систему',
    username: 'Логин',
    password: 'Пароль',
    submit: 'Войти',
    from: 'войти через'
  },
  study: {
    title: 'Расписание экзаменов',
    menu: 'Меню',
    refresh: 'Обновить',
    history: 'Прошедшие',
    passport: 'Профиль',
    settings: 'Настройки',
    demo: 'Проверка',
    logout: 'Выход',
    subject: 'Экзамен',
    begin: 'Начало',
    duration: 'Длительность',
    status: 'Статус',
    plan: 'Запланировать',
    revoke: 'Отменить',
    start: 'Подключиться',
    time: 'Текущее время',
    countdown: 'Время до ближайшего экзамена',
    confirm: 'Подтверждение',
    revokeMessage: 'Вы действительно хотите отменить выбранный экзамен?',
    durationValue: '%{duration} мин.'
  },
  exam: {
    title: 'Карточка экзамена',
    close: 'Закрыть',
    subject: 'Экзамен',
    subjectPrompt: 'Название экзамена',
    code: 'Код',
    codePrompt: 'Код экзамена в LMS',
    dates: 'Сроки',
    duration: 'Длительность',
    begin: 'Начало',
    end: 'Окончание',
    student: 'Слушатель',
    inspector: 'Проктор',
    resolution: 'Заключение',
    comment: 'Комментарий',
    unknown: 'Неизвестно',
    noplan: 'Не запланировано',
    unset: 'Не назначен',
    assigned: 'Назначен',
    no: 'Нет',
    durationMinutes: '%{num} мин.',
    datesBetween: 'с %{from} по %{to}',
    missing: 'Отсутствует',
    reset: 'Cброс',
    identificator: 'Идентификатор',
    examIdPrompt: 'Идентификатор экзамена в LMS',
    leftDatePrompt: 'Дата начала',
    rightDatePrompt: 'Дата окончания',
    beginDatePrompt: 'Дата начала',
    endDatePrompt: 'Дата окончания',
    startDatePrompt: 'Дата начала',
    stopDatePrompt: 'Дата окончания',
    durationPrompt: 'Мин.',
    studentPrompt: 'Укажите слушателя...',
    inspectorPrompt: 'Укажите проктора...',
    resolutionPrompt: 'Заключение проктора',
    commentPrompt: 'Введите комментарий...',
    planDates: 'Плановые даты',
    factDates: 'Фактические даты',
    save: 'Сохранить',
    status: {
      '0': 'Не запланирован',
      '1': 'Запланирован',
      '2': 'Ожидает',
      '3': 'Идет',
      '4': 'Принят',
      '5': 'Прерван',
      '6': 'Пропущен'
    }
  },
  settings: {
    title: 'Настройки',
    save: 'Сохранить',
    close: 'Закрыть',
    webcamera: {
      title: 'Веб-камера',
      audio: 'Микрофон',
      video: 'Видео',
      resolution: 'Разрешение',
      fps: 'Частота кадров',
      unknown: 'Неизвестный источник %{num}'
    },
    screen: {
      title: 'Экран',
      id: 'Номер экрана',
      resolution: 'Разрешение',
      fps: 'Частота кадров',
      select: 'Выбрать'
    },
    app: {
      title: 'Система',
      name: 'ITMOproctor',
      description: 'Система дистанционного надзора',
      version: 'Версия',
      update: 'Обновление'
    }
  },
  planner: {
    title: 'Запланировать экзамен',
    date: 'Дата',
    time: 'Время начала',
    close: 'Закрыть',
    refresh: 'Обновить',
    select: 'Выбрать',
    subject: 'Экзамен',
    dates: 'Сроки',
    from: 'с',
    to: 'по',
    duration: 'Длительность'
  },
  demo: {
    title: 'Проверка связи',
    webcamera: 'Веб-камера',
    screen: 'Экран',
    network: 'Сеть',
    start: 'Запустить',
    stop: 'Остановить',
    test: 'Проверить',
    caption: 'Нет данных, запустите проверку',
    ip: 'IP-адрес',
    location: 'Местоположение',
    ping: 'Время отклика',
    tx: 'Скорость передачи',
    rx: 'Скорость получения'
  },
  user: {
    title: 'Профиль пользователя',
    save: 'Сохранить',
    close: 'Закрыть',
    login: 'Логин',
    loginPrompt: 'Логин',
    password: 'Пароль',
    passwordPrompt: 'Пароль',
    fullname: 'Полное имя',
    footnote: 'заполняется на русском языке',
    lastname: 'Фамилия',
    firstname: 'Имя',
    middlename: 'Отчество',
    gender: 'Пол',
    genderPrompt: 'Пол',
    genders: {
      male: 'Мужской',
      female: 'Женский'
    },
    birthday: 'Дата рождения',
    birthdayPrompt: 'Дата рождения',
    email: 'Электронная почта',
    emailPrompt: 'Электронная почта',
    citizenship: 'Гражданство',
    citizenshipPrompt: 'Гражданство',
    documentType: 'Тип документа',
    documentTypePrompt: 'Тип документа',
    documentTypes: {
      passport: 'Паспорт',
      internationalPassport: 'Заграничный паспорт',
      foreignDocument: 'Иностранный документ',
      seamanPassport: 'Паспорт моряка',
      birthCertificate: 'Свидетельство о рождении',
      militaryID: 'Военный билет'
    },
    documentNumber: 'Серия и номер',
    documentNumberPrompt: 'Серия и номер документа',
    documentIssueDate: 'Дата выдачи',
    documentIssueDatePrompt: 'Дата выдачи документа',
    address: 'Почтовый адрес',
    addressPrompt: 'Страна, индекс, город, улица, ...',
    description: 'Образование',
    descriptionPrompt:
      'Уровень образования, степень, квалификация, образовательная организация',
    photo: 'Фотография',
    noset: 'Не назначен',
    remove: 'Удалить',
    unknown: 'Неизвестный',
    provider: {
      title: 'Провайдер',
      prompt: 'Провайдер авторизации',
      local: 'Внутрисистемный (local)',
      openedu: 'Открытое образование (openedu)',
      ifmosso: 'Университет ИТМО (ifmosso)'
    },
    role: {
      title: 'Роль в системе',
      prompt: 'Роль пользователя в системе',
      '1': 'Слушатель',
      '2': 'Проктор',
      '3': 'Администратор'
    },
    active: {
      title: 'Статус',
      prompt: 'Статус пользователя',
      true: 'Активен',
      false: 'Заблокирован'
    }
  },
  schedule: {
    title: 'Планирование расписания',
    add: 'Добавить',
    remove: 'Удалить',
    save: 'Сохранить',
    close: 'Закрыть',
    begin: 'Начало',
    end: 'Окончание',
    concurrent: 'Кол-во сессий',
    dates: 'Даты',
    sessions: 'Сессии',
    beginDate: 'Дата начала',
    endDate: 'Дата окончания',
    unknown: 'Неизвестный',
    inspector: 'Проктор'
  },
  monitor: {
    title: 'Расписание экзаменов',
    my: 'Мои',
    all: 'Все',
    fromDatePrompt: 'Начало...',
    toDatePrompt: 'Окончание...',
    searchTextPrompt: 'Поиск...',
    schedule: 'Планирование',
    profile: 'Профиль',
    settings: 'Настройки',
    demo: 'Проверка',
    logout: 'Выход',
    start: 'Подключиться',
    studentProfile: 'Профиль слушателя',
    inspectorProfile: 'Профиль проктора',
    examInfo: 'Карточка экзамена',
    unknown: 'Неизвестный',
    student: 'Слушатель',
    inspector: 'Проктор',
    subject: 'Экзамен',
    beginDate: 'Начало',
    duration: 'Длительность',
    status: 'Статус',
    durationValue: '%{duration} мин.'
  },
  talk: {
    online: 'В сети',
    offline: 'Не в сети',
    connection: 'Статус соединения',
    time: 'Текущее время',
    duration: 'Продолжительность экзамена',
    exam: 'Об экзамене',
    profile: 'Профиль',
    settings: 'Настройки',
    disconnect: 'Отключиться',
    submit: {
      title: 'Экзамен завершен',
      message: 'Проктор %{resolution} экзамен',
      true: 'принял',
      false: 'прервал',
      nocomment: 'Без комментария'
    }
  },
  chat: {
    title: 'Сообщения',
    connect: 'подключился к экзамену...',
    limitMessage: {
      title: 'Ошибка загрузки файла',
      message: 'Выбранный файл больше установленного лимита в %{num} МБ.'
    },
    send: 'Отправить',
    attach: 'Прикрепить',
    inputPrompt: 'Текст сообщения...',
    templatesPrompt: 'Шаблон сообщения...',
    templates: {
      '0': 'Здравствуйте!',
      '1': 'Покажите в камеру удостоверяющий личность документ.',
      '2': 'Во время экзамена нельзя ничем пользоваться.'
    }
  },
  notes: {
    title: 'Заметки',
    editorTitle: 'Редактирование заметки',
    save: 'Сохранить',
    close: 'Закрыть',
    edit: 'Редактировать',
    remove: 'Удалить',
    removeConfirm: {
      title: 'Подтверждение',
      message: 'Вы действительно хотите удалить выбранную заметку?'
    },
    add: 'Добавить',
    inputPrompt: 'Введите текст заметки...',
    onDate: 'Заметка на'
  },
  members: {
    title: 'Участники'
  },
  webcamera: {
    title: 'Веб-камера'
  },
  screen: {
    title: 'Рабочий стол'
  },
  vision: {
    online: 'В сети',
    offline: 'Не в сети',
    connection: 'Статус соединения',
    time: 'Текущее время',
    duration: 'Продолжительность экзамена',
    settings: 'Настройки',
    exam: 'Об экзамене',
    passport: 'О слушателе',
    automute: 'Автопауза',
    profile: 'Профиль',
    disconnect: 'Отключиться',
    changeStatus: 'Статус экзамена в LMS изменился: %{status}',
    screenshot: {
      title: 'Снимок экрана',
      save: 'Сохранить',
      close: 'Закрыть',
      commentPrompt: 'Введите комментарий...'
    },
    screenshotBtn: 'Снимок экрана',
    identificationBtn: 'Идентификация',
    stopBtn: 'Прервать',
    applyBtn: 'Принять',
    submit: {
      title: 'Завершить экзамен',
      message:
        'Подтвердите свое решение %{resolution} экзамен, отменить операцию будет невозможно',
      true: 'принять',
      false: 'прервать',
      inputProtectionCode: 'Введите код подтверждения',
      incorrectProtectionCode: 'Неверный код подтверждения',
      comment: 'Комментарий',
      commentPrompt: 'Введите комментарий...',
      submitBtn: 'Подтвердить',
      cancelBtn: 'Отмена'
    },
    verify: {
      success: 'Личность слушателя подтверждена',
      fail: 'Личность слушателя не установлена'
    }
  },
  verify: {
    title: 'Идентификация личности',
    closeBtn: 'Закрыть',
    scanBtn: 'Cнимок документа',
    acceptBtn: 'Подтвердить',
    rejectBtn: 'Отклонить',
    fullname: 'ФИО',
    gender: 'Пол',
    birthday: 'Дата рождения',
    citizenship: 'Гражданство',
    documentType: 'Тип документа',
    documentNumber: 'Номер док-та',
    documentIssueDate: 'Дата выдачи'
  },
  play: {
    title: 'Протокол',
    video: 'Видеозапись'
  },
  admin: {
    title: 'Администрирование',
    management: 'Управление',
    settings: 'Настройки',
    help: 'Справка',
    users: {
      title: 'Пользователи',
      parameters: 'Параметры',
      profile: 'Профиль',
      searchTextPrompt: 'Поиск пользователя...',
      username: 'Логин',
      provider: 'Провайдер',
      fullname: 'Пользователь',
      role: 'Роль в системе',
      created: 'Зарегистрирован',
      activeTitle: 'Статус',
      studentProfile: 'Профиль слушателя'
    },
    exams: {
      title: 'Экзамены',
      searchTextPrompt: 'Поиск экзамена..',
      fromDatePrompt: 'Начало...',
      toDatePrompt: 'Окончание...',
      studentProfile: 'Профиль слушателя',
      inspectorProfile: 'Профиль проктора',
      examInfo: 'Карточка экзамена',
      student: 'Слушатель',
      inspector: 'Проктор',
      subject: 'Экзамен',
      beginDate: 'Начало',
      duration: 'Длительность',
      status: 'Статус',
      durationValue: '%{duration} мин.',
      play: 'Протокол экзамена'
    },
    schedules: {
      title: 'Расписание',
      searchTextPrompt: 'Поиск расписания...',
      inspectorProfile: 'Профиль проктора',
      fromDatePrompt: 'Начало...',
      toDatePrompt: 'Окончание...',
      student: 'Слушатель',
      inspector: 'Проктор',
      beginDate: 'Начало работы',
      endDate: 'Окончание работы',
      concurrent: 'Кол-во сессий'
    },
    about: {
      title: 'О системе',
      app: 'ITMOproctor',
      description: 'Система дистанционного надзора'
    },
    actions: {
      title: 'Действия',
      add: 'Добавить',
      edit: 'Изменить',
      remove: 'Удалить'
    },
    remove: {
      progressMsg: 'Удаление данных...',
      confirm: {
        title: 'Подтверждение',
        message: 'Вы действительно хотите удалить выбранные записи?'
      }
    },
    profile: 'Профиль',
    logout: 'Выход',
    menu: 'Меню'
  }
});
