/**
 * @module core
 * @description Natural language processing core objects and methods
 */
(function (exports) {
    'use strict';
    
    /**
     * This takes any string, locates groups of 
     * spelled out numbers and converts them to digits
     * @return {number} Returns the processed input string.
     */
    var digify = function () {
        var input = this.preParsedOutput || this.input;
        for (var i = 0; i < this.tokens.length; i++) {
            input = input.replace(this.tokens[i].text, toStringIfExists(this.tokens[i].value));
        }
        return input;
    };
    
    /**
     * Returns the given object's toString representation
     * if it is defined, otherwise returns the given object.
     * @param {object} The object to get a string if toString exists.
     * @return {string, object} Result of toString or obj is toString does not exist.
     */
    var toStringIfExists = function (obj) {
        if (obj.hasOwnProperty('toString')) {
            return obj.toString();
        } else {
            return obj;   
        }
    };

    /**
     * Create parsed results object and Bind functions to the parsed results for sugar
     */
    var ParsedResult = function (input, tokens, preParsedOutput, preParsedResults) {
        this.input = input;
        this.tokens = tokens;
        this.preParsedOutput = preParsedOutput || null;
        this.preParsedResults = preParsedResults || null;
        this.digify = digify.bind(this);
    };

    var BaseTranslator = function (onTranslate, locale) {

        /**
         * Validate instance
         */ 
        if (
        !this.hasOwnProperty('name') || 
        typeof this.name !== 'string' || 
        !this.hasOwnProperty('parse') || 
        typeof this.parse !== 'function' || 
        this.constructor.toString() === 'function Object() { [native code] }') {
            
            throw new Error('BaseTranslator must be inheritied and properties set for "name" and "parse"');
        }
        
        /**
         * Validate registration
         */ 
        if (typeof translators[this.name] === 'undefined') {
            throw new Error('"' + this.name + '" must be registered before it is instantiated');
        }
        
        /**
         * Validate locale
         */ 
        this.locale = locale || translators[this.name].defaultLocale;
        if (translators[this.name].supportedLocales.indexOf(this.locale) === -1) {
            throw new Error('Locale "' + this.locale + '" is not supported by "' + this.name + '"');
        }
        
        /**
         * Define onTranslate which is called
         * by the listen event
         */ 
        this.onTranslate = onTranslate || null;
        
        /**
         * Define assistants array if derived class
         * has not already defined it
         */ 
        if (!this.hasOwnProperty('assistants')) {
            this.assistants = [];
        }
    };
    
    BaseTranslator.prototype = {
        /**
         * Attaches the translate function to an event listener
         * @param speaker {Element, object, string} 
         */
        listen: function (speaker, event, onTranslate) {
            /**
             * Get object reference to the Element
             * if speaker is a string and document
             * is defined
             */
            if (typeof speaker === 'string' && document && document.getElementById) {
                speaker = document.getElementById(speaker);
            }
            
            /**
             * Default event name to input if not given
             */
            event = event || 'input';
            
            /**
             * Define onTranslate which is called
             * by the listen event
             */
            onTranslate = onTranslate || this.onTranslate;
            
            /**
             * Bind to the input control's oninput event
             */
            if (speaker.addEventListener) {
                speaker.addEventListener(event, this.translate.bind(this, speaker, onTranslate));
            } else if (speaker.attachEvent) {
                speaker.attachEvent('on' + event, this.translate.bind(this, speaker, onTranslate));
            } else if (typeof speaker['on' + event] !== 'undefined') {
                speaker['on' + event] = this.translate.bind(this, speaker, onTranslate);
            } else if (typeof speaker[event] !== 'undefined') {
                speaker[event] = this.translate.bind(this, speaker, onTranslate);
            } else {
                throw new Error('Could not find an appropriate event to bind to');   
            }
        },
        /**
         * Determines accepts multiple arguments and
         * passes appropriate ones to the parse function.
         * Passes the result to callbacks before returning
         * the result. 
         * This can be used directly or by the listen method.
         */
        translate: function () {
            /**
             * Determine the locale
             */
            var localeIndex = arguments.length;
            var locale = this.locale;
            if (translators[this.name].supportedLocales.indexOf(arguments[arguments.length - 1]) !== -1) {
                localeIndex = arguments.length - 1
                locale = arguments[localeIndex];
            }
        
            /**
             * Determine the input
             */
            var input = '';
            var inputIndex = localeIndex - 1;
            if (typeof arguments[inputIndex] === 'string') {
                input = arguments[inputIndex];
            } else if (arguments[inputIndex] && arguments[inputIndex].target && arguments[inputIndex].target.value) {
                input = arguments[inputIndex].target.value;
            }

            /**
             * Parse the input, pass to callbacks, and return the result.
             */
            if (input) {
                var result = this.parse(input, locale);
                if (arguments.length > 2 && typeof arguments[1] === 'function') {
                    arguments[1](result, arguments[0]);
                } else if (this.onTranslate && arguments.length > 1 && typeof arguments[0] !== 'string') {
                    this.onTranslate(result, arguments[0]);
                }
                return result;
            }
        },
        /**
         * Passes the input to the translators 
         * assistants and returns parsed results
         */
        passToAssistants: function (input, locale) {
            var preParsedOutput = input, preParsedResults = [];
            for (var i = 0; i < this.assistants.length; i++) {
                preParsedResults.push(get(this.assistants[i]).parse(preParsedOutput, locale));
                preParsedOutput = preParsedResults[i].digify();
            }
            return {
                preParsedOutput: preParsedOutput,
                preParsedResults: preParsedResults
            };
        }
    };
        
    /**
     * Expose classes used by Translator implementations
     */
    exports.ParsedResult = ParsedResult;
    exports.BaseTranslator = BaseTranslator;
    
    /**
     * Expose method used for registering translators with
     * the core. passToAssistants uses these singleton
     * instances of each translator.
     */
    var translators = {};
    var register = function (name, instance, defaultLocale, supportedLocales) {
        translators[name] = {
            instance: null,
            defaultLocale: defaultLocale,
            supportedLocales: supportedLocales
        };
        
        translators[name].instance = new instance();
    };
    exports.register = register;
    
    /**
     * Expose method used for getting a singleton instance 
     * of a translator.
     */
    var get = function (name, locale) {
        locale = locale || translators[name].instance.locale;
        if (translators[name].supportedLocales.indexOf(locale) === -1) {
            throw new Error('Locale "' + this.locale + '" is not supported by "' + name + '"');
        }
        
        translators[name].locale = locale || translators[name].instance.locale;
        return translators[name].instance;
    };
    exports.get = get;
    
    /**
     * TODO: Describe this
     */
    var assign = function (name, speaker) {
        var event = null, 
            locale = null, 
            onTranslate = null;
        
        if (arguments.length < 3 || typeof arguments[arguments.length - 1] !== 'function') {
            throw new TypeError('Unexpected number of arguments');   
        }
        
        onTranslate = arguments[arguments.length - 1];
        if (arguments.length > 3) {
            event = arguments[2];
        }
        if (arguments.length > 4) {
            locale = arguments[3];
        }
        
        var translator = get(name, locale);
        translator.listen(speaker, event, onTranslate);
    };
    exports.assign = assign;
    
}(typeof exports === 'undefined' ? this['babble'] = this['babble'] || {}: exports));