/**
 * Переводы для ORB MASTERS
 * Языки: EN (английский), ZH (китайский), KO (корейский), JA (японский), RU (русский), KZ (казахский)
 */

export const LANGUAGES = {
  en: { code: 'en', name: 'English', flag: '🇬🇧' },
  zh: { code: 'zh', name: '中文', flag: '🇨🇳' },
  ko: { code: 'ko', name: '한국어', flag: '🇰🇷' },
  ja: { code: 'ja', name: '日本語', flag: '🇯🇵' },
  ru: { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  kz: { code: 'kz', name: 'Қазақша', flag: '🇰🇿' }
};

export const translations = {
  // ===== ГЛАВНОЕ МЕНЮ =====
  menu: {
    title: {
      en: 'ORB MASTERS',
      zh: '宝珠大师',
      ko: 'ORB MASTERS',
      ja: 'ORB MASTERS',
      ru: 'ORB MASTERS',
      kz: 'ORB MASTERS'
    },
    play: {
      en: 'PLAY',
      zh: '开始游戏',
      ko: '플레이',
      ja: 'プレイ',
      ru: 'ИГРАТЬ',
      kz: 'ОЙНАУ'
    },
    continue: {
      en: 'CONTINUE',
      zh: '继续',
      ko: '계속하기',
      ja: '続ける',
      ru: 'ПРОДОЛЖИТЬ',
      kz: 'ЖАЛҒАСТЫРУ'
    },
    settings: {
      en: 'Settings',
      zh: '设置',
      ko: '설정',
      ja: '設定',
      ru: 'Настройки',
      kz: 'Баптаулар'
    },
    selectLevel: {
      en: 'Select Level',
      zh: '选择关卡',
      ko: '레벨 선택',
      ja: 'レベル選択',
      ru: 'Выбор уровня',
      kz: 'Деңгей таңдау'
    }
  },

  // ===== УРОВНИ =====
  levels: {
    level1: {
      name: {
        en: 'Cash Catcher',
        zh: '金币捕手',
        ko: '코인 캐처',
        ja: 'コインキャッチャー',
        ru: 'Ловец монет',
        kz: 'Тиын аулаушы'
      },
      description: {
        en: 'Catch falling coins!',
        zh: '接住掉落的金币！',
        ko: '떨어지는 코인을 잡아라!',
        ja: '落ちてくるコインをキャッチ！',
        ru: 'Лови падающие монеты!',
        kz: 'Түсіп жатқан тиындарды ұста!'
      }
    },
    level2: {
      name: {
        en: 'Bricks Breaker',
        zh: '打砖块',
        ko: '벽돌 깨기',
        ja: 'ブロック崩し',
        ru: 'Разбей блоки',
        kz: 'Блоктарды бұз'
      },
      description: {
        en: 'Destroy all blocks!',
        zh: '摧毁所有方块！',
        ko: '모든 블록을 파괴하라!',
        ja: 'すべてのブロックを破壊！',
        ru: 'Уничтожь все блоки!',
        kz: 'Барлық блоктарды жой!'
      }
    },
    level3: {
      name: {
        en: 'Block Puzzle',
        zh: '方块拼图',
        ko: '블록 퍼즐',
        ja: 'ブロックパズル',
        ru: 'Блок-пазл',
        kz: 'Блок-пазл'
      },
      description: {
        en: 'Fill the lines!',
        zh: '填满行列！',
        ko: '라인을 채워라!',
        ja: 'ラインを埋めろ！',
        ru: 'Заполняй линии!',
        kz: 'Жолдарды толтыр!'
      }
    },
    level4: {
      name: {
        en: 'Crystal Match',
        zh: '宝石消除',
        ko: '크리스탈 매치',
        ja: 'クリスタルマッチ',
        ru: 'Кристаллы',
        kz: 'Кристалдар'
      },
      description: {
        en: 'Match 3 or more!',
        zh: '匹配3个或更多！',
        ko: '3개 이상 맞춰라!',
        ja: '3つ以上をマッチ！',
        ru: 'Собери 3 и более!',
        kz: '3 немесе одан көп жина!'
      }
    },
    locked: {
      en: 'Locked',
      zh: '未解锁',
      ko: '잠김',
      ja: 'ロック',
      ru: 'Заблокировано',
      kz: 'Құлыпталған'
    },
    unlockHint: {
      en: 'Complete previous level',
      zh: '完成上一关解锁',
      ko: '이전 레벨 완료 필요',
      ja: '前のレベルをクリア',
      ru: 'Пройди предыдущий уровень',
      kz: 'Алдыңғы деңгейді аяқта'
    }
  },

  // ===== ИГРОВОЙ ИНТЕРФЕЙС =====
  game: {
    score: {
      en: 'Score',
      zh: '分数',
      ko: '점수',
      ja: 'スコア',
      ru: 'Очки',
      kz: 'Ұпай'
    },
    best: {
      en: 'Best',
      zh: '最高',
      ko: '최고',
      ja: 'ベスト',
      ru: 'Рекорд',
      kz: 'Рекорд'
    },
    moves: {
      en: 'Moves',
      zh: '步数',
      ko: '이동',
      ja: '手数',
      ru: 'Ходов',
      kz: 'Қадам'
    },
    turn: {
      en: 'Turn',
      zh: '回合',
      ko: '턴',
      ja: 'ターン',
      ru: 'Ход',
      kz: 'Кезек'
    },
    combo: {
      en: 'COMBO',
      zh: '连击',
      ko: '콤보',
      ja: 'コンボ',
      ru: 'КОМБО',
      kz: 'КОМБО'
    },
    lives: {
      en: 'Lives',
      zh: '生命',
      ko: '라이프',
      ja: 'ライフ',
      ru: 'Жизни',
      kz: 'Өмір'
    }
  },

  // ===== ПАУЗА =====
  pause: {
    title: {
      en: 'PAUSED',
      zh: '暂停',
      ko: '일시정지',
      ja: 'ポーズ',
      ru: 'ПАУЗА',
      kz: 'ТОҚТАТЫЛДЫ'
    },
    resume: {
      en: 'Resume',
      zh: '继续',
      ko: '계속',
      ja: '再開',
      ru: 'Продолжить',
      kz: 'Жалғастыру'
    },
    restart: {
      en: 'Restart',
      zh: '重新开始',
      ko: '다시 시작',
      ja: 'リスタート',
      ru: 'Заново',
      kz: 'Қайта бастау'
    },
    menu: {
      en: 'Menu',
      zh: '菜单',
      ko: '메뉴',
      ja: 'メニュー',
      ru: 'Меню',
      kz: 'Мәзір'
    },
    info: {
      en: 'How to Play',
      zh: '玩法说明',
      ko: '플레이 방법',
      ja: '遊び方',
      ru: 'Как играть',
      kz: 'Қалай ойнау'
    }
  },

  // ===== НАСТРОЙКИ =====
  settings: {
    title: {
      en: 'Settings',
      zh: '设置',
      ko: '설정',
      ja: '設定',
      ru: 'Настройки',
      kz: 'Баптаулар'
    },
    sound: {
      en: 'Sound',
      zh: '音效',
      ko: '효과음',
      ja: 'サウンド',
      ru: 'Звуки',
      kz: 'Дыбыстар'
    },
    music: {
      en: 'Music',
      zh: '音乐',
      ko: '음악',
      ja: '音楽',
      ru: 'Музыка',
      kz: 'Музыка'
    },
    vibration: {
      en: 'Vibration',
      zh: '振动',
      ko: '진동',
      ja: 'バイブ',
      ru: 'Вибрация',
      kz: 'Дірілдеу'
    },
    language: {
      en: 'Language',
      zh: '语言',
      ko: '언어',
      ja: '言語',
      ru: 'Язык',
      kz: 'Тіл'
    },
    close: {
      en: 'Close',
      zh: '关闭',
      ko: '닫기',
      ja: '閉じる',
      ru: 'Закрыть',
      kz: 'Жабу'
    },
    on: {
      en: 'ON',
      zh: '开',
      ko: '켜기',
      ja: 'オン',
      ru: 'ВКЛ',
      kz: 'ҚОСУ'
    },
    off: {
      en: 'OFF',
      zh: '关',
      ko: '끄기',
      ja: 'オフ',
      ru: 'ВЫКЛ',
      kz: 'ӨШІРУ'
    },
    resetProgress: {
      en: 'Reset Progress',
      zh: '重置进度',
      ko: '진행 초기화',
      ja: '進行リセット',
      ru: 'Сбросить прогресс',
      kz: 'Прогресті тазалау'
    },
    resetConfirm: {
      en: 'Reset all progress? This action cannot be undone!',
      zh: '重置所有进度？此操作无法撤消！',
      ko: '모든 진행을 초기화하시겠습니까? 되돌릴 수 없습니다!',
      ja: '全ての進行をリセットしますか？元に戻せません！',
      ru: 'Сбросить весь прогресс? Это действие необратимо!',
      kz: 'Барлық прогресті тазалау? Бұл әрекет қайтарылмайды!'
    }
  },

  // ===== РЕЗУЛЬТАТЫ =====
  results: {
    victory: {
      en: 'VICTORY!',
      zh: '胜利！',
      ko: '승리!',
      ja: '勝利！',
      ru: 'ПОБЕДА!',
      kz: 'ЖЕҢІС!'
    },
    gameOver: {
      en: 'GAME OVER',
      zh: '游戏结束',
      ko: '게임 오버',
      ja: 'ゲームオーバー',
      ru: 'ИГРА ОКОНЧЕНА',
      kz: 'ОЙЫН АЯҚТАЛДЫ'
    },
    newRecord: {
      en: 'NEW RECORD!',
      zh: '新纪录！',
      ko: '신기록!',
      ja: '新記録！',
      ru: 'НОВЫЙ РЕКОРД!',
      kz: 'ЖАҢА РЕКОРД!'
    },
    points: {
      en: 'Points',
      zh: '分',
      ko: '점',
      ja: 'ポイント',
      ru: 'Очки',
      kz: 'Ұпай'
    },
    nextLevel: {
      en: 'Next Level',
      zh: '下一关',
      ko: '다음 레벨',
      ja: '次のレベル',
      ru: 'Следующий',
      kz: 'Келесі'
    },
    tryAgain: {
      en: 'Try Again',
      zh: '再试一次',
      ko: '다시 시도',
      ja: 'もう一度',
      ru: 'Ещё раз',
      kz: 'Қайталау'
    },
    backToMenu: {
      en: 'Menu',
      zh: '菜单',
      ko: '메뉴',
      ja: 'メニュー',
      ru: 'В меню',
      kz: 'Мәзірге'
    },
    stage: {
      en: 'Stage',
      zh: '阶段',
      ko: '스테이지',
      ja: 'ステージ',
      ru: 'Стадия',
      kz: 'Кезең'
    },
    time: {
      en: 'Time',
      zh: '时间',
      ko: '시간',
      ja: '時間',
      ru: 'Время',
      kz: 'Уақыт'
    },
    multiplier: {
      en: 'multiplier',
      zh: '倍率',
      ko: '배율',
      ja: '倍率',
      ru: 'множитель',
      kz: 'көбейткіш'
    },
    doubleReward: {
      en: 'Double Reward',
      zh: '双倍奖励',
      ko: '2배 보상',
      ja: '報酬2倍',
      ru: 'Удвоить награду',
      kz: 'Сыйлықты екі есе арттыру'
    },
    loading: {
      en: 'Loading...',
      zh: '加载中...',
      ko: '로딩 중...',
      ja: '読み込み中...',
      ru: 'Загрузка...',
      kz: 'Жүктелуде...'
    },
    tryNextMode: {
      en: 'Try next:',
      zh: '尝试下一个：',
      ko: '다음 시도:',
      ja: '次を試す:',
      ru: 'Попробуйте:',
      kz: 'Келесін көріңіз:'
    }
  },

  // ===== ПОДСКАЗКИ =====
  hints: {
    dragToShoot: {
      en: 'Drag and release to shoot',
      zh: '拖动并释放来射击',
      ko: '드래그해서 발사',
      ja: 'ドラッグして発射',
      ru: 'Потяни и отпусти для выстрела',
      kz: 'Ату үшін сүйреп жібер'
    },
    tapToStart: {
      en: 'Tap to start',
      zh: '点击开始',
      ko: '탭하여 시작',
      ja: 'タップして開始',
      ru: 'Нажми чтобы начать',
      kz: 'Бастау үшін бас'
    },
    swapGems: {
      en: 'Swap gems to match 3',
      zh: '交换宝石匹配3个',
      ko: '보석을 바꿔 3개 맞추기',
      ja: '宝石を交換して3つ揃える',
      ru: 'Меняй кристаллы местами',
      kz: 'Кристалдарды ауыстыр'
    },
    dragPiece: {
      en: 'Drag pieces to the grid',
      zh: '拖动方块到网格',
      ko: '조각을 그리드로 드래그',
      ja: 'ピースをグリッドにドラッグ',
      ru: 'Перетащи фигуру на поле',
      kz: 'Фигураны алаңға сүйре'
    },
    moveBasket: {
      en: 'Move the basket to catch',
      zh: '移动篮子来接住',
      ko: '바구니를 움직여 잡기',
      ja: 'カゴを動かしてキャッチ',
      ru: 'Двигай корзину чтобы ловить',
      kz: 'Себетті жылжыт'
    }
  },

  // ===== ОБЩИЕ =====
  common: {
    back: {
      en: 'Back',
      zh: '返回',
      ko: '뒤로',
      ja: '戻る',
      ru: 'Назад',
      kz: 'Артқа'
    },
    loading: {
      en: 'Loading...',
      zh: '加载中...',
      ko: '로딩 중...',
      ja: '読み込み中...',
      ru: 'Загрузка...',
      kz: 'Жүктелуде...'
    },
    error: {
      en: 'Error',
      zh: '错误',
      ko: '오류',
      ja: 'エラー',
      ru: 'Ошибка',
      kz: 'Қате'
    },
    ok: {
      en: 'OK',
      zh: '确定',
      ko: '확인',
      ja: 'OK',
      ru: 'ОК',
      kz: 'ОК'
    },
    cancel: {
      en: 'Cancel',
      zh: '取消',
      ko: '취소',
      ja: 'キャンセル',
      ru: 'Отмена',
      kz: 'Болдырмау'
    },
    yes: {
      en: 'Yes',
      zh: '是',
      ko: '예',
      ja: 'はい',
      ru: 'Да',
      kz: 'Иә'
    },
    no: {
      en: 'No',
      zh: '否',
      ko: '아니오',
      ja: 'いいえ',
      ru: 'Нет',
      kz: 'Жоқ'
    },
    bonus: {
      en: 'bonus',
      zh: '奖励',
      ko: '보너스',
      ja: 'ボーナス',
      ru: 'бонус',
      kz: 'бонус'
    }
  },

  // ===== ГЛАВНОЕ МЕНЮ (расширенное) =====
  mainMenu: {
    selectMode: {
      en: 'Select Game Mode',
      zh: '选择游戏模式',
      ko: '게임 모드 선택',
      ja: 'ゲームモード選択',
      ru: 'Выберите режим игры',
      kz: 'Ойын режимін таңдаңыз'
    },
    dailyBonus: {
      en: '🎁 Daily Bonus!',
      zh: '🎁 每日奖励！',
      ko: '🎁 일일 보너스!',
      ja: '🎁 デイリーボーナス！',
      ru: '🎁 Ежедневный бонус!',
      kz: '🎁 Күнделікті бонус!'
    },
    dayStreak: {
      en: 'Day {0} streak',
      zh: '连续第{0}天',
      ko: '{0}일 연속',
      ja: '{0}日連続',
      ru: 'День {0} подряд',
      kz: '{0} күн қатарынан'
    },
    selectDifficulty: {
      en: 'Select Difficulty:',
      zh: '选择难度：',
      ko: '난이도 선택:',
      ja: '難易度選択:',
      ru: 'Выберите сложность:',
      kz: 'Қиындықты таңдаңыз:'
    },
    mastery: {
      en: 'Mastery',
      zh: '精通',
      ko: '마스터',
      ja: 'マスター',
      ru: 'Мастерство',
      kz: 'Шеберлік'
    },
    unlockLevel: {
      en: 'Unlock at lvl {0}',
      zh: '{0}级解锁',
      ko: '레벨 {0}에 해금',
      ja: 'レベル{0}で解放',
      ru: 'Открыть на ур. {0}',
      kz: '{0} деңгейде ашылады'
    }
  },

  // ===== РЕЖИМЫ ИГРЫ =====
  modes: {
    catch: {
      name: {
        en: 'Cash Catcher',
        zh: '金币捕手',
        ko: '코인 캐처',
        ja: 'コインキャッチャー',
        ru: 'Ловец монет',
        kz: 'Тиын аулаушы'
      },
      shortName: {
        en: 'Catcher',
        zh: '捕手',
        ko: '캐처',
        ja: 'キャッチャー',
        ru: 'Ловец',
        kz: 'Аулаушы'
      },
      description: {
        en: 'Catch falling items',
        zh: '接住掉落的物品',
        ko: '떨어지는 아이템 잡기',
        ja: '落ちてくるアイテムをキャッチ',
        ru: 'Ловите падающие предметы',
        kz: 'Түсіп жатқан заттарды ұстаңыз'
      }
    },
    bricks: {
      name: {
        en: 'Bricks Breaker',
        zh: '打砖块',
        ko: '벽돌 깨기',
        ja: 'ブロック崩し',
        ru: 'Разрушитель',
        kz: 'Бұзғыш'
      },
      shortName: {
        en: 'Bricks',
        zh: '砖块',
        ko: '벽돌',
        ja: 'ブロック',
        ru: 'Блоки',
        kz: 'Блоктар'
      },
      description: {
        en: 'Break blocks with balls',
        zh: '用球打破方块',
        ko: '공으로 블록 깨기',
        ja: 'ボールでブロックを破壊',
        ru: 'Разбивайте блоки шарами',
        kz: 'Доптармен блоктарды бұзыңыз'
      }
    },
    puzzle: {
      name: {
        en: 'Block Puzzle',
        zh: '方块拼图',
        ko: '블록 퍼즐',
        ja: 'ブロックパズル',
        ru: 'Блок-паззл',
        kz: 'Блок-пазл'
      },
      shortName: {
        en: 'Puzzle',
        zh: '拼图',
        ko: '퍼즐',
        ja: 'パズル',
        ru: 'Паззл',
        kz: 'Пазл'
      },
      description: {
        en: 'Fill lines with shapes',
        zh: '用形状填满行列',
        ko: '도형으로 라인 채우기',
        ja: '形でラインを埋める',
        ru: 'Заполняйте линии фигурами',
        kz: 'Жолдарды пішіндермен толтырыңыз'
      }
    },
    zuma: {
      name: {
        en: 'Crystal Match',
        zh: '水晶消除',
        ko: '크리스탈 매치',
        ja: 'クリスタルマッチ',
        ru: 'Кристаллы',
        kz: 'Кристалдар'
      },
      shortName: {
        en: 'Match',
        zh: '消除',
        ko: '매치',
        ja: 'マッチ',
        ru: 'Матч',
        kz: 'Матч'
      },
      description: {
        en: 'Match 3 or more crystals',
        zh: '匹配3个或更多水晶',
        ko: '3개 이상의 크리스탈 맞추기',
        ja: '3つ以上のクリスタルをマッチ',
        ru: 'Собирайте 3+ кристалла',
        kz: '3+ кристалды жинаңыз'
      }
    },
    match3: {
      name: {
        en: 'Crystal Match',
        zh: '水晶消除',
        ko: '크리스탈 매치',
        ja: 'クリスタルマッチ',
        ru: 'Кристаллы',
        kz: 'Кристалдар'
      },
      shortName: {
        en: 'Match',
        zh: '消除',
        ko: '매치',
        ja: 'マッチ',
        ru: 'Матч',
        kz: 'Матч'
      },
      description: {
        en: 'Match 3 or more crystals',
        zh: '匹配3个或更多水晶',
        ko: '3개 이상의 크리스탈 맞추기',
        ja: '3つ以上のクリスタルをマッチ',
        ru: 'Собирайте 3+ кристалла',
        kz: '3+ кристалды жинаңыз'
      }
    }
  },

  // ===== СЛОЖНОСТИ =====
  stages: {
    rookie: {
      en: 'Rookie',
      zh: '新手',
      ko: '루키',
      ja: 'ルーキー',
      ru: 'Новичок',
      kz: 'Жаңадан'
    },
    skilled: {
      en: 'Skilled',
      zh: '熟练',
      ko: '숙련자',
      ja: 'スキルド',
      ru: 'Умелый',
      kz: 'Шебер'
    },
    expert: {
      en: 'Expert',
      zh: '专家',
      ko: '전문가',
      ja: 'エキスパート',
      ru: 'Эксперт',
      kz: 'Сарапшы'
    },
    master: {
      en: 'Master',
      zh: '大师',
      ko: '마스터',
      ja: 'マスター',
      ru: 'Мастер',
      kz: 'Шебер'
    },
    legend: {
      en: 'Legend',
      zh: '传奇',
      ko: '레전드',
      ja: 'レジェンド',
      ru: 'Легенда',
      kz: 'Аңыз'
    }
  },

  // ===== НИЖНЯЯ ПАНЕЛЬ =====
  bottomBar: {
    daily: {
      en: 'Daily',
      zh: '每日',
      ko: '일일',
      ja: 'デイリー',
      ru: 'День',
      kz: 'Күн'
    },
    leaderboard: {
      en: 'Ranking',
      zh: '排行榜',
      ko: '랭킹',
      ja: 'ランキング',
      ru: 'Рейтинг',
      kz: 'Рейтинг'
    },
    shop: {
      en: 'Shop',
      zh: '商店',
      ko: '상점',
      ja: 'ショップ',
      ru: 'Магазин',
      kz: 'Дүкен'
    },
    settings: {
      en: 'Settings',
      zh: '设置',
      ko: '설정',
      ja: '設定',
      ru: 'Настройки',
      kz: 'Баптау'
    }
  },

  // ===== ЕЖЕДНЕВНЫЕ ЗАДАНИЯ =====
  daily: {
    title: {
      en: 'Daily Challenges',
      zh: '每日挑战',
      ko: '일일 챌린지',
      ja: 'デイリーチャレンジ',
      ru: 'Ежедневные задания',
      kz: 'Күнделікті тапсырмалар'
    },
    resetIn: {
      en: 'Reset in',
      zh: '重置于',
      ko: '리셋까지',
      ja: 'リセットまで',
      ru: 'Обновление',
      kz: 'Жаңару'
    },
    claim: {
      en: 'CLAIM',
      zh: '领取',
      ko: '받기',
      ja: '受取',
      ru: 'ЗАБРАТЬ',
      kz: 'АЛУ'
    },
    claimed: {
      en: 'CLAIMED',
      zh: '已领取',
      ko: '받음',
      ja: '受取済',
      ru: 'ПОЛУЧЕНО',
      kz: 'АЛЫНДЫ'
    },
    bonusOrbs: {
      en: 'Bonus Orbs',
      zh: '额外宝珠',
      ko: '보너스 오브',
      ja: 'ボーナスオーブ',
      ru: 'Бонусные сферы',
      kz: 'Бонус сфералар'
    },
    watchAd: {
      en: 'Watch ad for +50 orbs',
      zh: '观看广告获得+50宝珠',
      ko: '광고 보고 +50 오브 받기',
      ja: '広告視聴で+50オーブ',
      ru: 'Смотреть рекламу за +50 сфер',
      kz: 'Жарнама көру +50 сфера'
    },
    adReward: {
      en: '+50 Orbs received!',
      zh: '获得+50宝珠！',
      ko: '+50 오브 획득!',
      ja: '+50オーブ獲得！',
      ru: '+50 сфер получено!',
      kz: '+50 сфера алынды!'
    },
    playGames: {
      en: 'Play {0} games',
      zh: '进行{0}场游戏',
      ko: '{0}게임 플레이',
      ja: '{0}ゲームプレイ',
      ru: 'Сыграйте {0} игр',
      kz: '{0} ойын ойнаңыз'
    },
    scoreTotal: {
      en: 'Score {0} points',
      zh: '获得{0}分',
      ko: '{0}점 획득',
      ja: '{0}ポイント獲得',
      ru: 'Наберите {0} очков',
      kz: '{0} ұпай жинаңыз'
    },
    collectOrbs: {
      en: 'Collect {0} orbs',
      zh: '收集{0}个宝珠',
      ko: '{0}오브 수집',
      ja: '{0}オーブ収集',
      ru: 'Соберите {0} сфер',
      kz: '{0} сфера жинаңыз'
    },
    comboCount: {
      en: 'Make {0} combos',
      zh: '完成{0}个连击',
      ko: '{0}콤보 달성',
      ja: '{0}コンボ達成',
      ru: 'Сделайте {0} комбо',
      kz: '{0} комбо жасаңыз'
    },
    winCatch: {
      en: 'Win in Cash Catcher',
      zh: '在抓金币中获胜',
      ko: '코인 캐처에서 승리',
      ja: 'コインキャッチャーで勝利',
      ru: 'Победите в Поймай монеты',
      kz: 'Монета ұстада жеңіңіз'
    },
    winBricks: {
      en: 'Win in Bricks Breaker',
      zh: '在打砖块中获胜',
      ko: '벽돌 깨기에서 승리',
      ja: 'ブロック崩しで勝利',
      ru: 'Победите в Разбей блоки',
      kz: 'Блоктарды сындыруда жеңіңіз'
    },
    winPuzzle: {
      en: 'Win in Block Puzzle',
      zh: '在方块拼图中获胜',
      ko: '블록 퍼즐에서 승리',
      ja: 'ブロックパズルで勝利',
      ru: 'Победите в Блоки',
      kz: 'Блок пазлда жеңіңіз'
    },
    winMatch3: {
      en: 'Win in Crystal Match',
      zh: '在水晶消除中获胜',
      ko: '크리스탈 매치에서 승리',
      ja: 'クリスタルマッチで勝利',
      ru: 'Победите в Кристаллы',
      kz: 'Кристалдарда жеңіңіз'
    },
    adWatched: {
      en: 'Watched today',
      zh: '今日已观看',
      ko: '오늘 시청함',
      ja: '本日視聴済み',
      ru: 'Просмотрено сегодня',
      kz: 'Бүгін көрілді'
    }
  },

  // ===== РЕКОРДЫ =====
  records: {
    title: {
      en: 'Personal Records',
      zh: '个人记录',
      ko: '개인 기록',
      ja: '個人記録',
      ru: 'Мои рекорды',
      kz: 'Менің рекордтарым'
    },
    bestScore: {
      en: 'Best Score',
      zh: '最高分',
      ko: '최고 점수',
      ja: 'ベストスコア',
      ru: 'Лучший счёт',
      kz: 'Үздік ұпай'
    },
    gamesPlayed: {
      en: 'Games Played',
      zh: '游戏次数',
      ko: '플레이 횟수',
      ja: 'プレイ回数',
      ru: 'Игр сыграно',
      kz: 'Ойналған ойындар'
    },
    totalOrbs: {
      en: 'Total Orbs Earned',
      zh: '获得的宝珠总数',
      ko: '총 획득 오브',
      ja: '獲得オーブ総数',
      ru: 'Всего заработано сфер',
      kz: 'Барлық жиналған сфералар'
    },
    noRecords: {
      en: 'No records yet',
      zh: '暂无记录',
      ko: '아직 기록 없음',
      ja: '記録なし',
      ru: 'Пока нет рекордов',
      kz: 'Әлі рекорд жоқ'
    }
  },

  // ===== МАГАЗИН =====
  shop: {
    title: {
      en: 'Shop',
      zh: '商店',
      ko: '상점',
      ja: 'ショップ',
      ru: 'Магазин',
      kz: 'Дүкен'
    },
    tabs: {
      orbs: {
        en: 'Orbs',
        zh: '宝珠',
        ko: '오브',
        ja: 'オーブ',
        ru: 'Сферы',
        kz: 'Сфералар'
      },
      boosters: {
        en: 'Boosters',
        zh: '道具',
        ko: '부스터',
        ja: 'ブースター',
        ru: 'Бустеры',
        kz: 'Бустерлер'
      },
      upgrades: {
        en: 'Upgrades',
        zh: '升级',
        ko: '업그레이드',
        ja: 'アップグレード',
        ru: 'Улучшения',
        kz: 'Жаңартулар'
      },
      cosmetic: {
        en: 'Cosmetic',
        zh: '外观',
        ko: '꾸미기',
        ja: 'コスメティック',
        ru: 'Косметика',
        kz: 'Косметика'
      }
    },
    items: {
      extraLife: {
        name: {
          en: 'Extra Life',
          zh: '额外生命',
          ko: '추가 생명',
          ja: 'エクストラライフ',
          ru: 'Доп. жизнь',
          kz: 'Қосымша өмір'
        },
        desc: {
          en: 'Continue after game over',
          zh: '游戏结束后继续',
          ko: '게임오버 후 계속',
          ja: 'ゲームオーバー後続行',
          ru: 'Продолжить после проигрыша',
          kz: 'Ойын біткеннен кейін жалғастыру'
        }
      },
      scoreBoost: {
        name: {
          en: '2x Score',
          zh: '双倍得分',
          ko: '2배 점수',
          ja: '2倍スコア',
          ru: '2x Очки',
          kz: '2x Ұпай'
        },
        desc: {
          en: 'Double points for 1 game',
          zh: '1局游戏双倍积分',
          ko: '1게임 2배 점수',
          ja: '1ゲーム2倍ポイント',
          ru: 'Удвоение очков на 1 игру',
          kz: '1 ойынға ұпайды екі есе'
        }
      },
      slowTime: {
        name: {
          en: 'Slow Time',
          zh: '时间减速',
          ko: '슬로우 타임',
          ja: 'スロータイム',
          ru: 'Замедление',
          kz: 'Баяулату'
        },
        desc: {
          en: 'Slow down game speed',
          zh: '减慢游戏速度',
          ko: '게임 속도 감소',
          ja: 'ゲーム速度低下',
          ru: 'Замедлить скорость игры',
          kz: 'Ойын жылдамдығын баяулату'
        }
      },
      orbMagnet: {
        name: {
          en: 'Orb Magnet',
          zh: '宝珠磁铁',
          ko: '오브 자석',
          ja: 'オーブマグネット',
          ru: 'Магнит сфер',
          kz: 'Сфера магниті'
        },
        desc: {
          en: 'Attract orbs automatically',
          zh: '自动吸引宝珠',
          ko: '자동으로 오브 끌어당김',
          ja: 'オーブ自動引き寄せ',
          ru: 'Автоматически притягивает сферы',
          kz: 'Сфераларды автоматты тарту'
        }
      },
      biggerBasket: {
        name: {
          en: 'Bigger Basket',
          zh: '更大的篮子',
          ko: '더 큰 바구니',
          ja: '大きなバスケット',
          ru: 'Большая корзина',
          kz: 'Үлкен себет'
        },
        desc: {
          en: '+20% basket size',
          zh: '篮子尺寸+20%',
          ko: '바구니 크기 +20%',
          ja: 'バスケット+20%',
          ru: '+20% размер корзины',
          kz: '+20% себет өлшемі'
        }
      },
      startingPoints: {
        name: {
          en: 'Head Start',
          zh: '起始加成',
          ko: '헤드 스타트',
          ja: 'ヘッドスタート',
          ru: 'Фора',
          kz: 'Бастапқы артықшылық'
        },
        desc: {
          en: 'Start with 500 points',
          zh: '以500分开始',
          ko: '500점으로 시작',
          ja: '500ポイントでスタート',
          ru: 'Начать с 500 очками',
          kz: '500 ұпаймен бастау'
        }
      },
      purpleTheme: {
        name: {
          en: 'Purple Theme',
          zh: '紫色主题',
          ko: '보라색 테마',
          ja: 'パープルテーマ',
          ru: 'Фиолетовая тема',
          kz: 'Күлгін тақырып'
        },
        desc: {
          en: 'Stylish purple visuals',
          zh: '时尚的紫色视觉',
          ko: '스타일리시한 보라색',
          ja: 'スタイリッシュな紫',
          ru: 'Стильный фиолетовый стиль',
          kz: 'Сәнді күлгін көрініс'
        }
      },
      goldTheme: {
        name: {
          en: 'Gold Theme',
          zh: '金色主题',
          ko: '골드 테마',
          ja: 'ゴールドテーマ',
          ru: 'Золотая тема',
          kz: 'Алтын тақырып'
        },
        desc: {
          en: 'Luxurious golden style',
          zh: '奢华的金色风格',
          ko: '럭셔리 골드 스타일',
          ja: '豪華なゴールドスタイル',
          ru: 'Роскошный золотой стиль',
          kz: 'Сәнді алтын стиль'
        }
      },
      neonTheme: {
        name: {
          en: 'Neon Theme',
          zh: '霓虹主题',
          ko: '네온 테마',
          ja: 'ネオンテーマ',
          ru: 'Неоновая тема',
          kz: 'Неон тақырыбы'
        },
        desc: {
          en: 'Bright neon effects',
          zh: '明亮的霓虹效果',
          ko: '밝은 네온 효과',
          ja: '鮮やかなネオン効果',
          ru: 'Яркие неоновые эффекты',
          kz: 'Жарқын неон эффектілері'
        }
      }
    },
    buy: {
      en: 'BUY',
      zh: '购买',
      ko: '구매',
      ja: '購入',
      ru: 'КУПИТЬ',
      kz: 'САТЫП АЛУ'
    },
    owned: {
      en: 'OWNED',
      zh: '已拥有',
      ko: '보유',
      ja: '所有済み',
      ru: 'КУПЛЕНО',
      kz: 'САТЫП АЛЫНДЫ'
    },
    equipped: {
      en: 'EQUIPPED',
      zh: '已装备',
      ko: '장착됨',
      ja: '装備中',
      ru: 'ПРИМЕНЕНО',
      kz: 'ҚОЛДАНЫЛҒАН'
    },
    notEnough: {
      en: 'Not enough orbs!',
      zh: '宝珠不足！',
      ko: '오브 부족!',
      ja: 'オーブ不足！',
      ru: 'Недостаточно сфер!',
      kz: 'Сфералар жеткіліксіз!'
    },
    purchased: {
      en: 'Purchase successful!',
      zh: '购买成功！',
      ko: '구매 완료!',
      ja: '購入完了！',
      ru: 'Покупка успешна!',
      kz: 'Сатып алу сәтті!'
    },
    realMoney: {
      en: 'Purchase with real money',
      zh: '用真实货币购买',
      ko: '실제 돈으로 구매',
      ja: '実際のお金で購入',
      ru: 'Покупка за реальные деньги',
      kz: 'Нақты ақшаға сатып алу'
    },
    perOrb: {
      en: 'orb',
      zh: '宝珠',
      ko: '오브',
      ja: 'オーブ',
      ru: 'сфера',
      kz: 'сфера'
    },
    confirmPurchase: {
      en: 'Confirm Purchase',
      zh: '确认购买',
      ko: '구매 확인',
      ja: '購入確認',
      ru: 'Подтвердите покупку',
      kz: 'Сатып алуды растаңыз'
    },
    orbs: {
      en: 'Orbs',
      zh: '宝珠',
      ko: '오브',
      ja: 'オーブ',
      ru: 'Сфер',
      kz: 'Сфера'
    },
    bestValue: {
      en: 'Best Value',
      zh: '超值',
      ko: '최고 가치',
      ja: 'お得',
      ru: 'Лучшее',
      kz: 'Ең тиімді'
    },
    popular: {
      en: 'Popular',
      zh: '热门',
      ko: '인기',
      ja: '人気',
      ru: 'Хит',
      kz: 'Танымал'
    },
    iapDisclaimer: {
      en: 'Purchases are processed securely. No refunds.',
      zh: '购买安全处理。不退款。',
      ko: '구매는 안전하게 처리됩니다. 환불 불가.',
      ja: '購入は安全に処理されます。返金不可。',
      ru: 'Покупки безопасны. Возврат невозможен.',
      kz: 'Сатып алулар қауіпсіз. Қайтару жоқ.'
    }
  }
};

export default translations;
