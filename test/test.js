'use strict';

var Fraglate = require('../src/index.js');
var process = require('process');
var path = require('path');
var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;

describe("Test Fraglate", () => {
    it('debug here', () => {
        assert.equal(true, true);
        let foo = 'bar';
        let tea = {
            'flavors': ['a', 'b', 'c']
        };
        expect(foo).to.be.a('string');
        expect(foo).to.equal('bar');
        expect(foo).to.have.length(3);
        expect(tea).to.have.property('flavors')
            .with.length(3);

        assert.typeOf(foo, 'string');
        assert.equal(foo, 'bar');
        assert.lengthOf(foo, 3)
        assert.property(tea, 'flavors');
        assert.lengthOf(tea.flavors, 3);

        var fraglate = new Fraglate({});
        assert.equal('_t', fraglate.config['translate']);
        assert.equal(path.join(process.cwd(), 'locale'), fraglate.config['locale_path']);
    });

    it('test eval', () => {
        var fraglate = new Fraglate({});
        assert.equal('', _e(''));
        assert.equal('a', _e('a'));
        assert.equal('hello world', _e('hello world', 'zh'));
        assert.equal('hello 生活', _e('hello <life>', 'zh'));
        assert.equal('Adam, hello!', _e('{{this.name}}, hello!', null, {
            'name': 'Adam'
        }));
        assert.equal('Hello 巧克力! 2 here \\<choco>', _e('Hello <choco>! {{1+1}} here \\<choco>', 'zh'));
        assert.equal('  HELLO world', _e('  {{ (function () { if (this.length > 3) { return "hello" } else { return "HELLO" } }).bind(this)() }} world', null, [1, 2, 3]));
        assert.equal('  hello world', _e('  {{{ if (this.length > 3) { return "hello" } else { return "HELLO" } }}} world', null, [1, 2, 3, 4]));
        assert.equal('  HELLO world', _e('  {{ (this.length > 3)? "hello" : "HELLO" }} world', null, {
            'aabb': ''
        }));
    });

    it('translate FGquote', () => {
        var fraglate = new Fraglate({});
        assert.equal('生活', _t('life', 'zh'));
        assert.equal('life', _t('life', 'en'));
        assert.equal('一盒', _t('a box', 'zh'));
        assert.equal('a box', _t('a box', 'en'));
        assert.equal('生活像一盒巧克力', _t('FGquote', 'zh'));
        assert.equal('life is like a box of chocolate', _t('FGquote', 'en'));
        assert.equal('1+1的答案是2', _t('calc', 'zh'));
        assert.equal('The answer to 1+1 is 2', _t('calc', 'en'));
        assert.equal('hello world', _t('foo', 'zh'));
        assert.equal('hello world', _t('foo', 'en'));
    });
});
