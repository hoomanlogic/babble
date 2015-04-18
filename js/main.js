var currentLocale = 'en-US';

var switchLocale = function (locale) {
    setUp(locale);
};

var setUp = function (locale) {
    
    currentLocale = locale;
    document.getElementById('en-US').className = "button";
    document.getElementById('de-DE').className = "button";
    document.getElementById(locale).className = "button selected";
    
    babble.assign('numbers', 'numbersInput', 'input', locale, onNumbersInput);
    babble.assign('durations', 'durationsInput', 'input', locale, onDurationsInput);

    var localeText = 'Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal.';
    if (locale === 'de-DE') {
        localeText = 'Es regnet einemillion sechshundertdreiundfünfzig tausend eins Katzen und drei hundert siebzig Hunden.';
    }
    
    // demonstrate cool factor
    document.getElementById('numbersInput').value = localeText;
    document.getElementById('numbersInput').innerHTML = localeText;
    onNumbersInput(babble.get('numbers').translate(localeText, locale));
    
    document.getElementById('durationsInput').value = localeText;
    document.getElementById('durationsInput').innerHTML = localeText;
    onDurationsInput(babble.get('durations').translate(localeText, locale));
};

/**
 * This is currently the best practice and should be 
 * used unless a legitimate reason arises to use
 * a separate instance of a translator
 */
var onNumbersInput = function (result) {
    document.getElementById('numbersResult').innerHTML = result.digify();
    document.getElementById('numbersValues').innerHTML = null;

    if (result.tokens.length> 0) {
        var values = [];
        result.tokens.forEach(function (item) {
            values.push(item.value);
        });
        document.getElementById('numbersValues').innerHTML = values.join(',');
    }
    console.log(result);
};

var onDurationsInput = function (result) {
    document.getElementById('durationsResult').innerHTML = result.digify();
    document.getElementById('durationsValues').innerHTML = null;

    if (result.tokens.length > 0) {
        var values = [];
        var hoomanized = [];
        result.tokens.forEach(function (item) {
            values.push(item.value.value);
            hoomanized.push(item.value.hoomanize());
        });
        document.getElementById('durationsValues').innerHTML = values.join(',');
        document.getElementById('durationsHoomanized').innerHTML = hoomanized.join('<br />');
    }
    console.log(result);
};

function makeSocial( id, width, height, url ){

    function go( e ){ window.open(

        url,
        id,
        'width='+ width +',height='+ height +',resizable=yes,scrollbars=yes,titlebar=yes,menubar=yes,location=yes'
    )}

    var el = document.getElementById( id )

    el.addEventListener( 'click', go )
    el.addEventListener( 'touchend', go )
}

function makeLink( id, url ){

    function go( e ){ window.location.href = url}

    var el = document.getElementById( id )

    el.addEventListener( 'click', go )
    el.addEventListener( 'touchend', go )
}

makeLink( 'github', 'https://github.com/hoomanlogic/babble' );
makeSocial( 'twitter',  500, 300, 'https://twitter.com/share?text='+ escape( '#Babble by @hoomanlogic is a JavaScript library for building user interfaces that understand humans:' ) +'&url=' + escape( 'http://hoomanlogic.github.io/babble' ));
makeSocial( 'facebook', 400, 300, 'https://www.facebook.com/sharer/sharer.php?u='+ escape( 'http://hoomanlogic.github.io/babble' ));
setUp('en-US');

document.getElementById('en-US').addEventListener( 'click', switchLocale.bind(null, 'en-US'));
document.getElementById('de-DE').addEventListener( 'click', switchLocale.bind(null, 'de-DE'));
document.getElementById('en-US').addEventListener( 'touchend', switchLocale.bind(null, 'en-US'));
document.getElementById('de-DE').addEventListener( 'touchend', switchLocale.bind(null, 'de-DE'));