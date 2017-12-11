module.exports = {
  "extends": "airbnb-base",
  "rules": {
    "consistent-return": 0,
    "max-len": [
      2,
      {
        "code": 400
      }
    ],
    "import/no-dynamic-require": 0,
    "import/prefer-default-export": 0,
    "no-console": 0,
    "no-use-before-define": ["error",
      {
        "functions": true,
        "classes": false
      }
    ],
    "no-param-reassign": ["error",
      {
        "props": true,
        "ignorePropertyModificationsFor": ["poolAction"]
      }
    ],
    "no-unused-vars": ["error",
      {
        "args": "none", // "all" for everything
        "caughtErrors": "none"
      }
    ],
    "class-methods-use-this": [0,
      {
        "exceptMethods": ["foo"] // Not effective since it's 0
      }
    ],
    "no-param-reassign": ["error",
      {
        "props": false
      }
    ]

  }
};