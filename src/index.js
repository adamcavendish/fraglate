'use strict';

var FraglateClass = (function() {
  var FraglateEval = require('./FraglateEval');
  var _ = require('./util');

  var async = require('async');
  var fs = require('fs');
  var extend = require('node.extend');
  var process = require('process');
  var path = require('path');

  function __get_lang_region(lang_str) {
    var lang_region = lang_str.split('-', 2);
    var lang = lang_region[0];
    var region = lang_region[1];
    if (!_.isNil(region)) {
      region = region.toLowerCase();
    } else {
      region = null;
    }
    return [lang, region];
  }

  function __is_exist_locale(locales, lang, region) {
    if (_.isNil(region) && !_.isNil(locales[lang])) {
      return true;
    } else if (!_.isNil(region) && !_.isNil(locales[lang]) && !_.isNil(locales[lang]['region'][region])) {
      return true;
    }
    return false;
  }

  function __construct_lang_region(lang, region) {
    if (region) {
      return lang + '-' + region;
    }
    return lang;
  }

  function __load_all_locales(_this, locale_path) {
    return (function(locale_path) {
      fs.readdir(locale_path, function(err, files) {
        if (err) {
          console.error('Unable to list locale directory: ' + locale_path);
          console.error(err.toString());
          return;
        }
        async.each(files, function(file, callback) {
            fs.readFile(path.join(locale_path, file), function(err, content) {
              if (err) {
                callback(err);
                return;
              }
              var lang_region = __get_lang_region(file.replace(/\.json$/g, ''));
              var lang = lang_region[0];
              var region = lang_region[1];
              content = JSON.parse(content);
              if (_.isNil(region)) {
                if (_.isNil(this.locales[lang])) {
                  this.locales[lang] = {
                    'data': content,
                    'region': {}
                  };
                } else {
                  this.locales[lang]['data'] = content;
                }
                callback();
              } else {
                if (_.isNil(this.locales[lang])) {
                  this.locales[lang] = {
                    'data': '',
                    'region': {}
                  };
                  this.locales[lang]['region'][region] = content;
                } else {
                  this.locales[lang]['region'][region] = content;
                }
                callback();
              }
            }.bind(this));
          }.bind(this),
          Fraglate.DEFAULT_ASYNC_HANDLE);
      }.bind(this));
    }.bind(_this))(locale_path);
  }

  function Fraglate(config) {
    this.config = Object.assign({}, Fraglate.DEFAULT_CONFIG, config);
    /*
    Locale Data Structure:
    {
      'en': {
        'data': JSON, // file: en.json
        'region': {
          'us': JSON, // file: en-us.json
          'uk': JSON
        },
        zh: {
          'data': JSON, // file: zh.json
          'region': {
            'cn': JSON,
            'tw': JSON
          }
        }
      }
    }
    */
    this.locales = {};
    __load_all_locales(this, this.config['locale_path']);

    // init globals
    global[this.config.translate] = this._t.bind(this);
    global[this.config.eval] = this._e.bind(this);
  }

  Fraglate.DEFAULT_ASYNC_HANDLER = function(err, results) {
    if (err) {
      console.error('err: ' + err.toString());
    }
  };

  Fraglate.EVAL = FraglateEval;

  Fraglate.DEFAULT_CONFIG = {
    'translate': '_t',
    'eval': '_e',
    'locale_path': 'locale',
    'locale_extension': 'json',
    'default_locale': 'en',
    'cookiename': 'locale',
  };

  // Example:
  //   GET_ACCEPTED_LANGUAGES_FROM_HEADER('en-US,en;q=0.8,zh-CN;q=0.6,zh;q=0.4,zh-TW;q=0.2')
  //   ==> [ [ 'en-US', 1 ], [ 'en', 0.8 ], [ 'zh-CN', 0.6 ], [ 'zh', 0.4 ], [ 'zh-TW', 0.2 ] ]
  Fraglate.GET_ACCEPTED_LANGUAGES_FROM_HEADER = function(header) {
    var languages = header.split(',');
    return languages.map(function(item) {
      var preference = item.trim().split(';q=');
      if (preference.length < 2) {
        preference.push(1.0);
      } else {
        var quality = parseFloat(preference[1]);
        preference[1] = quality ? quality : 0.0;
      }
      return preference;
    }).filter(function(preference) {
      return preference[1] > 0;
    }).sort(function(preference1, preference2) {
      // accending
      return preference2[1] - preference1[1];
    });
  };

  // as_middleware will provide each request with property: 'locale' as best matched locale
  Fraglate.prototype.as_middleware = function() {
    return function(req, res, next) {
      if (!req.locale) {
        this.guess_language(req);
      }
      this.express_request = req;

      if (typeof next === 'function') {
        return next();
      }
    }.bind(this);
  };

  Fraglate.prototype.guess_language = function(req) {
    if (!(typeof req === 'object')) {
      return;
    }
    // check cookie
    var cookiename = this.config['cookiename'];
    if (!_.isNil(cookiename) && !_.isNil(req.cookies) && !_.isNil(req.cookies[cookiename])) {
      var cookie_locale = req.cookies[cookiename];
      var lang_region = __get_lang_region(cookie_locale);
      if (__is_exist_locale(this.locales, lang_region[0], lang_region[1])) {
        req.locale = __construct_lang_region(lang_region[0], lang_region[1]);
        return;
      }
    }

    // guess request header: accept-language
    var acc_langs = req.headers['accept-language'];
    if (acc_langs) {
      var pref_langs = Fraglate.GET_ACCEPTED_LANGUAGES_FROM_HEADER(acc_langs);
      var bestGuess = null,
        fallbackGuess = null;
      var defaultLocale = __get_lang_region(this.config['default_locale']);
      for (var i = 0; i < pref_langs.length; ++i) {
        var lang_region = __get_lang_region(pref_langs[i][0]);
        var lang = lang_region[0];
        var region = lang_region[1];
        var locales_lang = this.locales[lang];
        var locales_region = this.locales[lang]['region'][region];
        if (_.isNil(region) && !_.isNil(locales_lang)) {
          bestGuess = [lang, null];
          break;
        } else if (!_.isNil(region) && !_.isNil(locales_lang) && !_.isNil(locales_region)) {
          bestGuess = [lang, region];
          break;
        } else if (!_.isNil(region) && !_.isNil(locales_lang) && _.isNil(locales_region)) {
          fallbackGuess = [lang, null];
        }
      }
      var finalGuess = bestGuess || fallbackGuess || defaultLocale;
      req.locale = __construct_lang_region(finalGuess[0], finalGuess[1]);
    }
  };

  Fraglate.prototype._t = function(key, locale_str) {
    if (_.isNil(locale_str)) {
      locale_str = ((!_.isNil(this.express_request)) ? (this.express_request.locale) : (this.config['default_locale']));
    }
    var lang_region = __get_lang_region(locale_str);
    var lang = lang_region[0];
    var region = lang_region[1];
    return this.translate(key, lang, region);
  };

  Fraglate.prototype._e = function(str, locale_str) {
    if (_.isNil(locale_str)) {
      locale_str = ((!_.isNil(this.express_request)) ? (this.express_request.locale) : (this.config['default_locale']));
    }
    var lang_region = __get_lang_region(locale_str);
    var lang = lang_region[0];
    var region = lang_region[1];
    return new Fraglate.EVAL(this).eval(str, lang, region);
  };

  Fraglate.prototype.translate = function(key, lang, region) {
    var fe = new Fraglate.EVAL(this);
    var localeunit = ((_.isNull(region)) ? (this.locales[lang]['data'][key]) : (this.locales[lang]['region'][region][key]));
    if (typeof localeunit === 'string') {
      return fe.eval(localeunit, lang, region, null);
    } else if (typeof localeunit === 'undefined') {
      console.error('locale: ' + locale.toString() + ', no translation to key: "' + key.toString() + '"');
    } else {
      console.error('locale: ' + locale.toString() + ', translation to \'' + (typeof localeunit).toString() + '\' is not supported!');
    }
    return null;
  };

  return Fraglate;
})();

module.exports = FraglateClass;