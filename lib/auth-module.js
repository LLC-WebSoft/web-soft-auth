const { Auth } = require('./auth');

module.exports = {
  schema: {
    register: {
      public: true,
      description: 'Регистрация нового пользователя с ролью user.',
      params: {
        required: ['username', 'password'],
        properties: {
          username: {
            type: 'string',
            description: 'Имя пользователя.'
          },
          password: {
            description: 'Пароль.',
            type: 'string'
          }
        }
      },
      result: {
        required: ['username', 'role', 'createdTime'],
        properties: {
          username: {
            description: 'Имя пользователя.',
            type: 'string'
          },
          role: {
            description: 'Роль пользователя.',
            type: 'string'
          },
          createdTime: {
            description: 'Временная метка создания пользователя.',
            type: 'string'
          }
        }
      },
      transport: 'http'
    },
    login: {
      public: true,
      description: 'Аутентификация пользователя.',
      params: {
        required: ['username', 'password'],
        properties: {
          username: {
            description: 'Имя пользователя.',
            type: 'string'
          },
          password: {
            description: 'Пароль.',
            type: 'string'
          }
        }
      },
      result: {
        required: ['username', 'role', 'createdTime'],
        properties: {
          username: {
            description: 'Имя пользователя.',
            type: 'string'
          },
          role: {
            description: 'Роль пользователя.',
            type: 'string'
          },
          createdTime: {
            description: 'Временная метка создания пользователя.',
            type: 'string'
          }
        }
      },
      transport: 'http'
    },
    logout: {
      public: false,
      description: 'Выход пользователя из системы.',
      transport: 'http'
    },
    me: {
      public: false,
      description: 'Получение данных о текущем пользователе.',
      result: {
        required: ['username', 'role', 'createdTime'],
        properties: {
          username: {
            description: 'Имя пользователя.',
            type: 'string'
          },
          role: {
            description: 'Роль пользователя.',
            type: 'string'
          },
          createdTime: {
            description: 'Временная метка создания пользователя.',
            type: 'string'
          }
        }
      }
    },
    changePassword: {
      public: false,
      description: 'Смена пароля текущего пользователя.',
      params: {
        required: ['username', 'oldPassword', 'newPassword'],
        properties: {
          username: {
            description: 'Имя пользователя.',
            type: 'string'
          },
          oldPassword: {
            description: 'Старый пароль.',
            type: 'string'
          },
          newPassword: {
            description: 'Новый пароль.',
            type: 'string'
          }
        }
      },
      result: {
        required: ['username', 'role', 'createdTime'],
        properties: {
          username: {
            description: 'Имя пользователя.',
            type: 'string'
          },
          role: {
            description: 'Роль пользователя.',
            type: 'string'
          },
          createdTime: {
            description: 'Временная метка создания пользователя.',
            type: 'string'
          }
        }
      }
    }
  },
  Module: Auth
};
