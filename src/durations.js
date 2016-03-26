/**
 * @module durations
 * @dependency core
 * @description Natural language processing for Durations of time.
 */
(function(exports) {
   'use strict';

   var Locales = {
      'en-US': {
         code: 'en-US',
         millennium: {
            full: ['millennium', 'millennia']
         },
         century: {
            full: ['centuries', 'century']
         },
         decade: {
            full: ['decades', 'decade']
         },
         year: {
            full: ['years', 'year'],
            short: ['yr'],
            symbol: ['y']
         },
         day: {
            full: ['days', 'day'],
            short: ['dys', 'dy'],
            symbol: ['d']
         },
         hour: {
            full: ['hours', 'hour'],
            short: ['hrs', 'hr'],
            symbol: ['h'],
         },
         minute: {
            full: ['minutes', 'minute'],
            short: ['mins', 'min'],
            symbol: ['m'],
         },
         second: {
            full: ['seconds', 'second'],
            short: ['secs', 'sec'],
            symbol: ['s'],
         },
         millisecond: {
            full: ['milliseconds', 'millisecond'],
            short: ['millisecs', 'millisec', 'msecs', 'msec'],
            symbol: ['ms'],
         },
         timeJoiners: [',', ', and', ',and', 'and', ''],
         modifierJoiners: ['of an', 'of a', 'an', 'a', ''],

         /**
          * Pluralizes a word based on how many
          */
         formatNoun: function(noun, howMany) {

            var plural = function() {
               var vowels = ['a', 'e', 'i', 'o', 'u'];
               if (noun[noun.length - 1] === 'y' && vowels.indexOf(noun[noun.length - 2].toLowerCase()) === -1) {
                  return noun.substring(0, noun.length - 1) + 'ies';
               }
               else {
                  return noun + 's';
               }
            };

            if (howMany === 0) {
               return 'no ' + plural();
            }
            else if (howMany === 1) {
               return noun;
            }
            else {
               return plural();
            }
         }
      },

   };
   Locales['de-DE'] = {
      code: 'de-DE',
      millennium: {
         full: []
      },
      century: {
         full: []
      },
      decade: {
         full: []
      },
      year: {
         full: ['jahre', 'jahr'],
         short: [],
         symbol: ['j']
      },
      day: {
         full: ['tage', 'tag'],
         short: [],
         symbol: ['t']
      },
      hour: {
         full: ['stunde'],
         short: [],
         symbol: ['st'],
      },
      minute: {
         full: ['minuten'],
         short: ['min'],
         symbol: ['m'],
      },
      second: {
         full: ['sekunden'],
         short: ['sek'],
         symbol: ['s'],
      },
      millisecond: {
         full: ['millisekunden'],
         short: ['millisek', 'msek'],
         symbol: ['ms'],
      },
      timeJoiners: [',', ', und', ',und', 'und', ''],
      modifierJoiners: ['ob', ''],

      /**
       * Pluralizes a word based on how many
       */
      formatNoun: function(noun, howMany) {

         var plural = function() {
            return noun + 'e';
         };

         if (howMany === 0) {
            return 'kein ' + plural();
         }
         else if (howMany === 1) {
            return noun;
         }
         else {
            return plural();
         }
      }
   };

   /**
    * Module variables for duration calculations
    */
   var secondInt = 1000;
   var minuteInt = 60 * secondInt;
   var hourInt = 60 * minuteInt;
   var dayInt = 24 * hourInt;
   var yearInt = 365 * dayInt;
   var decadeInt = 10 * yearInt;
   var centuryInt = 10 * decadeInt;
   var millenniumInt = 10 * centuryInt;

   /**
    * Create Duration object
    */
   exports.Duration = function(milliseconds) {

      this.value = milliseconds;

      this.milliseconds = 0;
      this.seconds = 0;
      this.minutes = 0;
      this.hours = 0;
      this.days = 0;
      this.years = 0;

      var leftOver = milliseconds;
      if (leftOver >= yearInt) {
         this.years = Math.floor(leftOver / yearInt);
         leftOver -= this.years * yearInt;
      }
      if (leftOver >= dayInt) {
         this.days = Math.floor(leftOver / dayInt);
         leftOver -= this.days * dayInt;
      }
      if (leftOver >= hourInt) {
         this.hours = Math.floor(leftOver / hourInt);
         leftOver -= this.hours * hourInt;
      }
      if (leftOver >= minuteInt) {
         this.minutes = Math.floor(leftOver / minuteInt);
         leftOver -= this.minutes * minuteInt;
      }
      if (leftOver >= secondInt) {
         this.seconds = Math.floor(leftOver / secondInt);
         leftOver -= this.seconds * secondInt;
      }
      this.milliseconds = leftOver;
   };


   exports.Duration.prototype.toString = function(format, locale) {

      /**
       * Set the locale used for matching
       * and default to the CurrentLocale
       * if not specified.
       */
      if (locale && Locales[locale]) {
         locale = Locales[locale];
      }
      else {
         locale = Locales[defaultLocale];
      }

      if (typeof format === 'string' && format.slice(0, 1) === ':') {

         if (this.days > 0) {
            return (
               this.days + ':' +
               (this.hours < 10 ? '0' : '') + this.hours + ':' +
               (this.minutes < 10 ? '0' : '') + this.minutes
            );
         }
         else if (this.hours > 0) {
            if (format === ':minutes') {
               return (
                  this.hours + ':' +
                  (this.minutes < 10 ? '0' : '') + this.minutes
               );
            }
            else {
               return (
                  this.hours + ':' +
                  (this.minutes < 10 ? '0' : '') + this.minutes + ':' +
                  (this.seconds < 10 ? '0' : '') + this.seconds
               );
            }
         }
         else {
            if (format === ':minutes') {
               return (
                  this.minutes
               );
            }
            else {
               return (
                  this.minutes + ':' +
                  (this.seconds < 10 ? '0' : '') + this.seconds
               );
            }
         }
      }
      else if (typeof format === 'string' && format.slice(0, 2) === 'hm') {
         return (
            (this.days ? this.days + 'd' : '') +
            (this.hours ? this.hours + 'h' : '') +
            (this.minutes ? this.minutes + 'm' : '') +
            (format.slice(-1) === 's' && this.seconds ? this.seconds + 's' : '') 
         );
      }
      else {

         if (typeof format === 'undefined' || format === null) {
            format = 'milliseconds';
         }

         var info = [];
         if (this.years) {
            info.push(this.years + ' ' + locale.formatNoun(locale.year.full[1], this.years));
         }
         if (format === 'days') {
            return info.join(', ');
         }
         if (this.days) {
            info.push(this.days + ' ' + locale.formatNoun(locale.day.full[1], this.days));
         }
         if (format === 'days') {
            return info.join(', ');
         }
         if (this.hours) {
            info.push(this.hours + ' ' + locale.formatNoun(locale.hour.full[1], this.hours));
         }
         if (format === 'hours') {
            return info.join(', ');
         }
         if (this.minutes) {
            info.push(this.minutes + ' ' + locale.formatNoun(locale.minute.full[1], this.minutes));
         }
         if (format === 'minutes') {
            return info.join(', ');
         }
         if (this.seconds) {
            info.push(this.seconds + ' ' + locale.formatNoun(locale.second.full[1], this.seconds));
         }
         if (format === 'seconds') {
            return info.join(', ');
         }
         if (this.milliseconds) {
            info.push(this.milliseconds + ' ' + locale.formatNoun(locale.millisecond.full[1], this.milliseconds));
         }
         return info.join(', ');
      }
   };

   exports.Duration.prototype.toMinutes = function() {
      if (this.value > 60000) {
         return Math.floor((this.value / 1000) / 60);
      } else {
         return 0;
      }
   };

   /**
    * Return whether name is variation of millenium
    * @param {string} A recognized duration name
    */
   var isMillennium = function(name, locale) {
      if (locale.millennium.full.indexOf(name) > -1) {
         return true;
      }
      return false;
   };

   /**
    * Return whether name is variation of century
    * @param {string} A recognized duration name
    */
   var isCentury = function(name, locale) {
      if (locale.century.full.indexOf(name) > -1) {
         return true;
      }
      return false;
   };

   /**
    * Return whether name is variation of decade
    * @param {string} A recognized duration name
    */
   var isDecade = function(name, locale) {
      if (locale.decade.full.indexOf(name) > -1) {
         return true;
      }
      return false;
   };

   /**
    * Return whether name is variation of year
    * @param {string} A recognized duration name
    */
   var isYear = function(name, locale) {
      if (locale.year.full.indexOf(name) > -1) {
         return true;
      }
      if (locale.year.short.indexOf(name) > -1) {
         return true;
      }
      if (locale.year.symbol.indexOf(name) > -1) {
         return true;
      }
      return false;
   };

   /**
    * Return whether name is variation of day
    * @param {string} A recognized duration name
    */
   var isDay = function(name, locale) {
      if (locale.day.full.indexOf(name) > -1) {
         return true;
      }
      if (locale.day.short.indexOf(name) > -1) {
         return true;
      }
      if (locale.day.symbol.indexOf(name) > -1) {
         return true;
      }
      return false;
   };

   /**
    * Return whether name is variation of hour
    * @param {string} A recognized duration name
    */
   var isHour = function(name, locale) {
      if (locale.hour.full.indexOf(name) > -1) {
         return true;
      }
      if (locale.hour.short.indexOf(name) > -1) {
         return true;
      }
      if (locale.hour.symbol.indexOf(name) > -1) {
         return true;
      }
      return false;
   };

   /**
    * Return whether name is variation of minute
    * @param {string} A recognized duration name
    */
   var isMinute = function(name, locale) {
      if (locale.minute.full.indexOf(name) > -1) {
         return true;
      }
      if (locale.minute.short.indexOf(name) > -1) {
         return true;
      }
      if (locale.minute.symbol.indexOf(name) > -1) {
         return true;
      }
      return false;
   };

   /**
    * Return whether name is variation of second
    * @param {string} A recognized duration name
    */
   var isSecond = function(name, locale) {
      if (locale.second.full.indexOf(name) > -1) {
         return true;
      }
      if (locale.second.short.indexOf(name) > -1) {
         return true;
      }
      if (locale.second.symbol.indexOf(name) > -1) {
         return true;
      }
      return false;
   };

   /**
    * Return whether name is variation of millisecond
    * @param {string} A recognized duration name
    */
   var isMillisecond = function(name, locale) {
      if (locale.millisecond.full.indexOf(name) > -1) {
         return true;
      }
      if (locale.millisecond.short.indexOf(name) > -1) {
         return true;
      }
      if (locale.millisecond.symbol.indexOf(name) > -1) {
         return true;
      }
      return false;
   };

   /**
    * Return duration value in milliseconds
    * @param {string} A recognized duration name
    */
   var getValue = function(name, locale) {

      if (isMillennium(name, locale)) {
         return millenniumInt;
      }
      if (isCentury(name, locale)) {
         return centuryInt;
      }
      if (isDecade(name, locale)) {
         return decadeInt;
      }
      if (isYear(name, locale)) {
         return yearInt;
      }
      if (isDay(name, locale)) {
         return dayInt;
      }
      if (isHour(name, locale)) {
         return hourInt;
      }
      if (isMinute(name, locale)) {
         return minuteInt;
      }
      if (isSecond(name, locale)) {
         return secondInt;
      }
      if (isMillisecond(name, locale)) {
         return 1;
      }
      throw new Error('Invalid duration name');
   };

   /**
    * This takes any string, locates groups of
    * durations and returns results
    */
   var parse = function(input, locale) {

      /**
       * Set the locale used for matching
       * and default to the CurrentLocale
       * if not specified.
       */
      if (locale && Locales[locale]) {
         locale = Locales[locale];
      } else {
         locale = Locales[defaultLocale];
      }

      /**
       * Build list of duration words
       * for use in regular expression
       */
      var names = []
         .concat(locale.millennium.full)
         .concat(locale.century.full)
         .concat(locale.decade.full)
         .concat(locale.year.full)
         .concat(locale.day.full)
         .concat(locale.hour.full)
         .concat(locale.minute.full)
         .concat(locale.second.full)
         .concat(locale.millisecond.full)
         .concat(locale.year.short)
         .concat(locale.day.short)
         .concat(locale.hour.short)
         .concat(locale.minute.short)
         .concat(locale.second.short)
         .concat(locale.millisecond.short)
         .concat(locale.year.symbol)
         .concat(locale.day.symbol)
         .concat(locale.hour.symbol)
         .concat(locale.minute.symbol)
         .concat(locale.second.symbol)
         .concat(locale.millisecond.symbol);


      /**
       * Run pre-parsing dependencies
       */
      var preParsedResults = this.passToAssistants(input, locale.code);

      /**
       * Array for holding number matches
       */
      var matches = [];

      //http://leaverou.github.io/regexplained/
      var match;
      // use negative lookahead to ensure it's the end of a word
      // without consuming a digit that could otherwise be a part
      // of the following match
      var re = new RegExp('(\\b|\\d)(' + names.join('|') + ')\.?(?![a-zA-Z])', 'gi');
      while ((match = re.exec(input)) !== null) {
         var truePos = match.index + (match[1] || '').length;
         core.insertToken(matches, {
            kind: 'duration.name',
            pos: truePos,
            text: match[2],
            value: getValue(match[2], locale)
         });
      }

      /**
       * Add numerical language matches
       */
      //input.replace(/((\d)+:(\d)+(:(\d)+)?(:(\d)+)?(\.(\d){1,3})?)/gi, function () {
      re = /((\d)+:(\d)+(:(\d)+)?(:(\d)+)?(\.(\d){1,3})?)/gi;
      while ((match = re.exec(input)) !== null) {
         if (arguments[0].trim() !== '') {
            core.insertToken(matches, {
               kind: 'duration.full',
               pos: match.index,
               text: match[0],
               value: null
            });
         }
      }

      if (matches.length === 0) {
         return new core.ParsedResult(input, [], preParsedResults);
      }

      var results = [];
      var segments = [];
      var previousMatch = null;
      for (var i = 0; i < matches.length; i++) {

         if (matches[i].kind === 'duration.full') {

            var timeSegments = matches[i].text.split(':');
            var timeSum = 0;
            if (timeSegments.length === 4) {
               timeSum += parseFloat(timeSegments[0]) * dayInt;
               timeSum += parseInt(timeSegments[1]) * hourInt;
               timeSum += parseInt(timeSegments[2]) * minuteInt;
               timeSum += parseFloat(timeSegments[3]) * secondInt;
            }
            else if (timeSegments.length === 3) {
               timeSum += parseInt(timeSegments[0]) * hourInt;
               timeSum += parseInt(timeSegments[1]) * minuteInt;
               timeSum += parseFloat(timeSegments[2]) * secondInt;
            }
            else if (timeSegments.length === 2) {
               timeSum += parseInt(timeSegments[0] * hourInt);
               timeSum += parseInt(timeSegments[1] * minuteInt);
            }

            segments.push({
               kind: 'duration',
               pos: matches[i].pos,
               text: matches[i].text,
               value: timeSum
            });
            continue;
         }

         /**
          * Find number token that modifies this duration match
          */
         var numToken = core.getTokenModifier(preParsedResults['numbers'].tokens, matches[i], previousMatch);

         /**
          * This match segment has no modifier
          */
         if (numToken === null) {
            segments.push({
               kind: 'duration.segment',
               pos: matches[i].pos,
               text: matches[i].text,
               value: matches[i].value
            });
            continue;
         }

         /**
          * Check i
          */
         var theSpaceBetween = input.slice(numToken.pos + numToken.text.length, matches[i].pos);
         if (locale.modifierJoiners.indexOf(theSpaceBetween.trim()) > -1) {
            segments.push({
               kind: 'duration.segment',
               pos: numToken.pos,
               text: input.slice(numToken.pos, matches[i].pos + matches[i].text.length),
               value: numToken.value * matches[i].value
            });
         }

         /**
          * Set previousMatch to current match for use in next iteration
          */
         previousMatch = matches[i];
      }

      /**
       * Combine segments
       */

      var prev = null;
      var next = null;
      for (var i = 0; i < segments.length; i++) {
         next = segments[i];
         if (prev) {
            var joiner = input.slice(prev.pos + prev.text.length, next.pos);
            if (locale.timeJoiners.indexOf(joiner.trim()) > -1) {
               next.value += prev.value;
               next.text = input.slice(prev.pos, next.pos + next.text.length);
               next.pos = prev.pos;
            } else {
               results.push(prev);
            }
         }
         prev = segments[i];
      }
      results.push(next);

      for (var i = 0; i < results.length; i++) {
         results[i].value = new exports.Duration(results[i].value);
      }

      /**
       * Create parsed results object and Bind functions to the parsed results for sugar
       */
      return new core.ParsedResult(input, results, preParsedResults);
   };

   /**
    * Define core and preparse dependencies
    */
   if (typeof require !== 'undefined') {
      var core = require('./core.js');
      var numbers = require('./numbers.js');
   } else {
      var core = window['babble'];
      var numbers = window['babble'];
   }

   /**
    * Define DurationTranslator class
    */
   var DurationTranslator = function(onTranslate, locale) {
      this.name = 'durations';
      this.parse = parse;
      this.assistants = ['numbers'];
      core.BaseTranslator.call(this, onTranslate, locale);
   };

   DurationTranslator.prototype = Object.create(core.BaseTranslator.prototype);
   DurationTranslator.prototype.constructor = DurationTranslator;
   exports.DurationTranslator = DurationTranslator;

   /**
    * Register this translator with the core list
    */
   var defaultLocale = 'en-US';
   var locales = [];
   for (var name in Locales) {
      locales.push(name);
   }
   core.register('durations', DurationTranslator, defaultLocale, locales);


   exports.durations = {
      /**
       * Calculates the number of days between two dates.
       * @param {Date} d1 - a date for comparison
       * @param {Date} d2 - a date for comparison
       */
      dayDiff: function(d1, d2) {
         var days = Math.abs(d1 - d2) / dayInt;
         return days;
      },

      /**
       * Calculates the number of hours between two dates.
       * @param {Date} d1 - a date for comparison
       * @param {Date} d2 - a date for comparison
       */
      hourDiff: function(d1, d2) {
         return Math.abs(d1 - d2) / hourInt;
      },

      formatDuration: function(minutes, locale) {
         if (typeof locale === 'undefined') {
            locale = 'en-US';
         }

         if (minutes < 60) {
            return minutes + ' ' + Locales[locale].formatNoun('minute', minutes);
         } else {
            var leftover = minutes % 60;

            var hours = (minutes - leftover) / 60;

            return hours + ' ' + Locales[locale].formatNoun('hour', hours) + ' and ' + leftover + ' ' + Locales[locale].formatNoun('minute', leftover);
         }
      }
   };

} (typeof exports === 'undefined' ? this['babble'] = this['babble'] || {} : exports));
