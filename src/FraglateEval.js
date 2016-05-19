'use strict';

var FraglateEval = (function() {
    var fraglate = require('./index');
    var _ = require('./util');

    var FraglateEval = function(fraglate) {
        this.fraglate = fraglate;
    }

    FraglateEval.eval_with_context = function(code, context) {
        return (function() {
            return eval(code);
        }).call(context);
    };

    FraglateEval.eval_with_context_as_function = function(code, context) {
        return (function() {
            return eval(
                '(function () { ' + code + ' }).bind(this)()'
            );
        }).call(context);
    };

    FraglateEval.prototype.evalTranslate = function(sentence, lang, region) {
        if (_.isNil(sentence)) {
            return '';
        }
        var trans_re = /<([\s\S]+?)>|\\(?:<[\s\S]+?>)/g;
        var sentence_cur_idx = 0;
        var result = '';
        while (true) {
            var trans = trans_re.exec(sentence);
            if (trans == null) {
                result += sentence.substring(sentence_cur_idx, sentence.length);
                break;
            }
            if (trans.length !== 2) {
                console.error('trans array length !== 2. trans: ', trans);
                break;
            }
            result += sentence.substring(sentence_cur_idx, trans.index);
            sentence_cur_idx = trans.index;
            if (!_.isNil(trans[1])) {
                result += this.fraglate.translate(trans[1], lang, region);
            } else {
                result += trans[0];
            }
            sentence_cur_idx += trans[0].length;
        }
        return result;
    };

    FraglateEval.prototype.evalInterpolate = function(sentence, context) {
        if (_.isNil(sentence)) {
            return '';
        }
        var interpolate_re = /\{\{([\s\S]+?)\}\}/g;
        var sentence_cur_idx = 0;
        var result = '';
        while (true) {
            var interpolate = interpolate_re.exec(sentence);
            if (interpolate == null) {
                result += sentence.substring(sentence_cur_idx, sentence.length);
                break;
            }
            if (interpolate.length !== 2) {
                console.error('interpolate array length !== 2. interpolate: ',
                    interpolate);
                break;
            }
            result += sentence.substring(sentence_cur_idx, interpolate.index);
            sentence_cur_idx = interpolate.index;
            if (!_.isNil(interpolate[1])) {
                result += FraglateEval.eval_with_context(interpolate[1],
                    context);
            } else {
                result += trans[0];
            }
            sentence_cur_idx += interpolate[0].length;
        }
        return result;
    };

    FraglateEval.prototype.evalInterpolateAsFunction = function(sentence, context) {
        if (_.isNil(sentence)) {
            return '';
        }
        var interpolate_re = /\{\{\{([\s\S]+?)\}\}\}/g;
        var sentence_cur_idx = 0;
        var result = '';
        while (true) {
            var interpolate = interpolate_re.exec(sentence);
            if (interpolate == null) {
                result += sentence.substring(sentence_cur_idx, sentence.length);
                break;
            }
            if (interpolate.length !== 2) {
                console.error('interpolate array length !== 2. interpolate: ', interpolate);
                break;
            }
            result += sentence.substring(sentence_cur_idx, interpolate.index);
            sentence_cur_idx = interpolate.index;
            if (!_.isNil(interpolate[1])) {
                result += FraglateEval.eval_with_context_as_function(interpolate[1], context);
            } else {
                result += trans[0];
            }
            sentence_cur_idx += interpolate[0].length;
        }
        return result;
    };

    FraglateEval.prototype.eval = function(sentence, lang, region, context) {
        if (_.isNil(context)) {
            context = {};
        }
        var transed_sentence = this.evalTranslate(sentence, lang, region);
        var interpolated_as_function_sentence = this.evalInterpolateAsFunction(transed_sentence, context);
        var interpolated_sentence = this.evalInterpolate(interpolated_as_function_sentence, context);

        return interpolated_sentence;
    };

    return FraglateEval;
})();

module.exports = FraglateEval;