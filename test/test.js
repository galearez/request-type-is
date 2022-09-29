var assert = require('assert');
var requesTypeIs = require('..');

describe('requestTypeIs(req, types)', function () {
  it('should ignore params', function () {
    var req = createRequest('text/html; charset=utf-8');
    assert.strictEqual(requesTypeIs(req, ['text/*']), 'text/html');
  });

  it('should ignore params LWS', function () {
    var req = createRequest('text/html ; charset=utf-8');
    assert.strictEqual(requesTypeIs(req, ['text/*']), 'text/html');
  });

  it('should ignore casing', function () {
    var req = createRequest('text/HTML');
    assert.strictEqual(requesTypeIs(req, ['text/*']), 'text/html');
  });

  it('should fail invalid type', function () {
    var req = createRequest('text/html**');
    assert.strictEqual(requesTypeIs(req, ['text/*']), false);
  });

  it('should not match invalid type', function () {
    var req = createRequest('text/html');
    assert.strictEqual(requesTypeIs(req, ['text/html/']), false);
    assert.strictEqual(
      requesTypeIs(req, [undefined, null, true, function () {}]),
      false,
    );
  });

  describe('when no body is given', function () {
    it('should return null', function () {
      var req = new request({});

      assert.strictEqual(requesTypeIs(req), null);
      assert.strictEqual(requesTypeIs(req, ['image/*']), null);
      assert.strictEqual(requesTypeIs(req, 'image/*', 'text/*'), null);
    });
  });

  describe('when no content type is given', function () {
    it('should return false', function () {
      var req = createRequest();
      assert.strictEqual(requesTypeIs(req), false);
      assert.strictEqual(requesTypeIs(req, ['image/*']), false);
      assert.strictEqual(requesTypeIs(req, ['text/*', 'image/*']), false);
    });
  });

  describe('give no types', function () {
    it('should return the mime type', function () {
      var req = createRequest('image/png');
      assert.strictEqual(requesTypeIs(req), 'image/png');
    });
  });

  describe('given one type', function () {
    it('should return the type or false', function () {
      var req = createRequest('image/png');

      assert.strictEqual(requesTypeIs(req, ['png']), 'png');
      assert.strictEqual(requesTypeIs(req, ['.png']), '.png');
      assert.strictEqual(requesTypeIs(req, ['image/png']), 'image/png');
      assert.strictEqual(requesTypeIs(req, ['image/*']), 'image/png');
      assert.strictEqual(requesTypeIs(req, ['*/png']), 'image/png');

      assert.strictEqual(requesTypeIs(req, ['jpeg']), false);
      assert.strictEqual(requesTypeIs(req, ['.jpeg']), false);
      assert.strictEqual(requesTypeIs(req, ['image/jpeg']), false);
      assert.strictEqual(requesTypeIs(req, ['text/*']), false);
      assert.strictEqual(requesTypeIs(req, ['*/jpeg']), false);

      assert.strictEqual(requesTypeIs(req, ['bogus']), false);
      assert.strictEqual(requesTypeIs(req, ['something/bogus*']), false);
    });
  });

  describe('given multiple types', function () {
    it('should return the first match or false', function () {
      var req = createRequest('image/png');

      assert.strictEqual(requesTypeIs(req, ['png']), 'png');
      assert.strictEqual(requesTypeIs(req, '.png'), '.png');
      assert.strictEqual(requesTypeIs(req, ['text/*', 'image/*']), 'image/png');
      assert.strictEqual(requesTypeIs(req, ['image/*', 'text/*']), 'image/png');
      assert.strictEqual(
        requesTypeIs(req, ['image/*', 'image/png']),
        'image/png',
      );
      assert.strictEqual(
        requesTypeIs(req, 'image/png', 'image/*'),
        'image/png',
      );

      assert.strictEqual(requesTypeIs(req, ['jpeg']), false);
      assert.strictEqual(requesTypeIs(req, ['.jpeg']), false);
      assert.strictEqual(requesTypeIs(req, ['text/*', 'application/*']), false);
      assert.strictEqual(
        requesTypeIs(req, ['text/html', 'text/plain', 'application/json']),
        false,
      );
    });
  });

  describe('given +suffix', function () {
    it('should match suffix types', function () {
      var req = createRequest('application/vnd+json');

      assert.strictEqual(requesTypeIs(req, '+json'), 'application/vnd+json');
      assert.strictEqual(
        requesTypeIs(req, 'application/vnd+json'),
        'application/vnd+json',
      );
      assert.strictEqual(
        requesTypeIs(req, 'application/*+json'),
        'application/vnd+json',
      );
      assert.strictEqual(
        requesTypeIs(req, '*/vnd+json'),
        'application/vnd+json',
      );
      assert.strictEqual(requesTypeIs(req, 'application/json'), false);
      assert.strictEqual(requesTypeIs(req, 'text/*+json'), false);
    });
  });

  describe('given "*/*"', function () {
    it('should match any content-type', function () {
      assert.strictEqual(
        requesTypeIs(createRequest('text/html'), '*/*'),
        'text/html',
      );
      assert.strictEqual(
        requesTypeIs(createRequest('text/xml'), '*/*'),
        'text/xml',
      );
      assert.strictEqual(
        requesTypeIs(createRequest('application/json'), '*/*'),
        'application/json',
      );
      assert.strictEqual(
        requesTypeIs(createRequest('application/vnd+json'), '*/*'),
        'application/vnd+json',
      );
    });

    it('should not match invalid content-type', function () {
      assert.strictEqual(requesTypeIs(createRequest('bogus'), '*/*'), false);
    });

    it('should not match body-less request', function () {
      var req = new request({ 'content-type': 'text/html' });
      assert.strictEqual(requesTypeIs(req, '*/*'), null);
    });
  });

  describe('when Content-Type: application/x-www-form-urlencoded', function () {
    it('should match "urlencoded"', function () {
      var req = createRequest('application/x-www-form-urlencoded');

      assert.strictEqual(requesTypeIs(req, ['urlencoded']), 'urlencoded');
      assert.strictEqual(
        requesTypeIs(req, ['json', 'urlencoded']),
        'urlencoded',
      );
      assert.strictEqual(
        requesTypeIs(req, ['urlencoded', 'json']),
        'urlencoded',
      );
    });
  });

  describe('when Content-Type: multipart/form-data', function () {
    it('should match "multipart/*"', function () {
      var req = createRequest('multipart/form-data');

      assert.strictEqual(
        requesTypeIs(req, ['multipart/*']),
        'multipart/form-data',
      );
    });

    it('should match "multipart"', function () {
      var req = createRequest('multipart/form-data');

      assert.strictEqual(requesTypeIs(req, ['multipart']), 'multipart');
    });
  });
});

describe('requestTypeIs.hasBody(req)', function () {
  describe('content-length', function () {
    it('should indicate body', function () {
      var req = new request({ 'Content-Length': '1' });
      assert.strictEqual(requesTypeIs.hasBody(req), true);
    });

    it('should be true when 0', function () {
      var req = new request({ 'Content-Length': '0' });
      assert.strictEqual(requesTypeIs.hasBody(req), true);
    });

    it('should be false when bogus', function () {
      var req = new request({ 'Content-Length': 'bogus' });
      assert.strictEqual(requesTypeIs.hasBody(req), false);
    });
  });

  describe('transfer-encoding', function () {
    it('should indicate body', function () {
      var req = new request({ 'Transfer-Encoding': 'chunked' });
      assert.strictEqual(requesTypeIs.hasBody(req), true);
    });
  });
});

describe('requestTypeIs.typeIs(mediaType, types)', function () {
  it('should ignore params', function () {
    assert.strictEqual(
      requesTypeIs.typeIs('text/html; charset=utf-8', ['text/*']),
      'text/html',
    );
  });

  it('should ignore casing', function () {
    assert.strictEqual(
      requesTypeIs.typeIs('text/HTML', ['text/*']),
      'text/html',
    );
  });

  it('should fail invalid type', function () {
    assert.strictEqual(requesTypeIs.typeIs('text/html**', ['text/*']), false);
  });

  it('should not match invalid type', function () {
    var req = createRequest('text/html');
    assert.strictEqual(requesTypeIs(req, ['text/html/']), false);
    assert.strictEqual(
      requesTypeIs(req, [undefined, null, true, function () {}]),
      false,
    );
  });

  it('should not match invalid type', function () {
    assert.strictEqual(requesTypeIs.typeIs('text/html', ['text/html/']), false);
    assert.strictEqual(
      requesTypeIs.typeIs('text/html', [undefined, null, true, function () {}]),
      false,
    );
  });

  describe('when no media type is given', function () {
    it('should return false', function () {
      assert.strictEqual(requesTypeIs.typeIs(), false);
      assert.strictEqual(requesTypeIs.typeIs('', ['application/json']), false);
      assert.strictEqual(requesTypeIs.typeIs(null, ['image/*']), false);
      assert.strictEqual(
        requesTypeIs.typeIs(undefined, ['text/*', 'image/*']),
        false,
      );
    });
  });

  describe('given no types', function () {
    it('should return the mime type', function () {
      assert.strictEqual(requesTypeIs.typeIs('image/png'), 'image/png');
    });
  });

  describe('given one type', function () {
    it('should return the type or false', function () {
      assert.strictEqual(requesTypeIs.typeIs('image/png', ['png']), 'png');
      assert.strictEqual(requesTypeIs.typeIs('image/png', ['.png']), '.png');
      assert.strictEqual(
        requesTypeIs.typeIs('image/png', ['image/png']),
        'image/png',
      );
      assert.strictEqual(
        requesTypeIs.typeIs('image/png', ['image/*']),
        'image/png',
      );
      assert.strictEqual(
        requesTypeIs.typeIs('image/png', ['*/png']),
        'image/png',
      );

      assert.strictEqual(requesTypeIs.typeIs('image/png', ['jpeg']), false);
      assert.strictEqual(requesTypeIs.typeIs('image/png', ['.jpeg']), false);
      assert.strictEqual(
        requesTypeIs.typeIs('image/png', ['image/jpeg']),
        false,
      );
      assert.strictEqual(requesTypeIs.typeIs('image/png', ['text/*']), false);
      assert.strictEqual(requesTypeIs.typeIs('image/png', ['*/jpeg']), false);

      assert.strictEqual(requesTypeIs.typeIs('image/png', ['bogus']), false);
      assert.strictEqual(
        requesTypeIs.typeIs('image/png', ['something/bogus*']),
        false,
      );
    });
  });

  describe('given multiple types', function () {
    it('should return the first match or false', function () {
      assert.strictEqual(requesTypeIs.typeIs('image/png', ['png']), 'png');
      assert.strictEqual(requesTypeIs.typeIs('image/png', '.png'), '.png');
      assert.strictEqual(
        requesTypeIs.typeIs('image/png', ['text/*', 'image/*']),
        'image/png',
      );
      assert.strictEqual(
        requesTypeIs.typeIs('image/png', ['image/*', 'text/*']),
        'image/png',
      );
      assert.strictEqual(
        requesTypeIs.typeIs('image/png', ['image/*', 'image/png']),
        'image/png',
      );
      assert.strictEqual(
        requesTypeIs.typeIs('image/png', 'image/png', 'image/*'),
        'image/png',
      );

      assert.strictEqual(requesTypeIs.typeIs('image/png', ['jpeg']), false);
      assert.strictEqual(requesTypeIs.typeIs('image/png', ['.jpeg']), false);
      assert.strictEqual(
        requesTypeIs.typeIs('image/png', ['text/*', 'application/*']),
        false,
      );
      assert.strictEqual(
        requesTypeIs.typeIs('image/png', [
          'text/html',
          'text/plain',
          'application/json',
        ]),
        false,
      );
    });
  });

  describe('given +suffix', function () {
    it('should match suffix types', function () {
      assert.strictEqual(
        requesTypeIs.typeIs('application/vnd+json', '+json'),
        'application/vnd+json',
      );
      assert.strictEqual(
        requesTypeIs.typeIs('application/vnd+json', 'application/vnd+json'),
        'application/vnd+json',
      );
      assert.strictEqual(
        requesTypeIs.typeIs('application/vnd+json', 'application/*+json'),
        'application/vnd+json',
      );
      assert.strictEqual(
        requesTypeIs.typeIs('application/vnd+json', '*/vnd+json'),
        'application/vnd+json',
      );
      assert.strictEqual(
        requesTypeIs.typeIs('application/vnd+json', 'application/json'),
        false,
      );
      assert.strictEqual(
        requesTypeIs.typeIs('application/vnd+json', 'text/*+json'),
        false,
      );
    });
  });

  describe('given "*/*"', function () {
    it('should match any media type', function () {
      assert.strictEqual(requesTypeIs.typeIs('text/html', '*/*'), 'text/html');
      assert.strictEqual(requesTypeIs.typeIs('text/xml', '*/*'), 'text/xml');
      assert.strictEqual(
        requesTypeIs.typeIs('application/json', '*/*'),
        'application/json',
      );
      assert.strictEqual(
        requesTypeIs.typeIs('application/vnd+json', '*/*'),
        'application/vnd+json',
      );
    });

    it('should not match invalid media type', function () {
      assert.strictEqual(requesTypeIs.typeIs('bogus', '*/*'), false);
    });
  });

  describe('when media type is application/x-www-form-urlencoded', function () {
    it('should match "urlencoded"', function () {
      assert.strictEqual(
        requesTypeIs.typeIs('application/x-www-form-urlencoded', [
          'urlencoded',
        ]),
        'urlencoded',
      );
      assert.strictEqual(
        requesTypeIs.typeIs('application/x-www-form-urlencoded', [
          'json',
          'urlencoded',
        ]),
        'urlencoded',
      );
      assert.strictEqual(
        requesTypeIs.typeIs('application/x-www-form-urlencoded', [
          'urlencoded',
          'json',
        ]),
        'urlencoded',
      );
    });
  });

  describe('when media type is multipart/form-data', function () {
    it('should match "multipart/*"', function () {
      assert.strictEqual(
        requesTypeIs.typeIs('multipart/form-data', ['multipart/*']),
        'multipart/form-data',
      );
    });

    it('should match "multipart"', function () {
      assert.strictEqual(
        requesTypeIs.typeIs('multipart/form-data', ['multipart']),
        'multipart',
      );
    });
  });

  describe('when give request object', function () {
    it('should use the content-type header', function () {
      var req = createRequest('image/png');

      assert.strictEqual(requesTypeIs.typeIs(req, ['png']), 'png');
      assert.strictEqual(requesTypeIs.typeIs(req, ['jpeg']), false);
    });

    it('should not check for body', function () {
      var req = new request({ 'Content-Type': 'text/html' });

      assert.strictEqual(requesTypeIs.typeIs(req, ['html']), 'html');
      assert.strictEqual(requesTypeIs.typeIs(req, ['jpeg']), false);
    });
  });
});

describe('requestTypeIs.mimeMatch(expected, actual)', function () {
  it('should return false when expected is false', function () {
    assert.strictEqual(requesTypeIs.mimeMatch(false, 'text/html'), false);
  });

  it('should perform exact matching', function () {
    assert.strictEqual(requesTypeIs.mimeMatch('text/html', 'text/html'), true);
    assert.strictEqual(
      requesTypeIs.mimeMatch('text/html', 'text/plain'),
      false,
    );
    assert.strictEqual(requesTypeIs.mimeMatch('text/html', 'text/xml'), false);
    assert.strictEqual(
      requesTypeIs.mimeMatch('text/html', 'application/html'),
      false,
    );
    assert.strictEqual(
      requesTypeIs.mimeMatch('text/html', 'text/html+xml'),
      false,
    );
  });

  it('should perform type wildcard matching', function () {
    assert.strictEqual(requesTypeIs.mimeMatch('*/html', 'text/html'), true);
    assert.strictEqual(
      requesTypeIs.mimeMatch('*/html', 'application/html'),
      true,
    );
    assert.strictEqual(requesTypeIs.mimeMatch('*/html', 'text/xml'), false);
    assert.strictEqual(
      requesTypeIs.mimeMatch('*/html', 'text/html+xml'),
      false,
    );
  });

  it('should perform subtype wildcard matching', function () {
    assert.strictEqual(requesTypeIs.mimeMatch('text/*', 'text/html'), true);
    assert.strictEqual(requesTypeIs.mimeMatch('text/*', 'text/xml'), true);
    assert.strictEqual(requesTypeIs.mimeMatch('text/*', 'text/html+xml'), true);
    assert.strictEqual(
      requesTypeIs.mimeMatch('text/*', 'application/xml'),
      false,
    );
  });

  it('should perform full wildcard matching', function () {
    assert.strictEqual(requesTypeIs.mimeMatch('*/*', 'text/html'), true);
    assert.strictEqual(requesTypeIs.mimeMatch('*/*', 'text/html+xml'), true);
    assert.strictEqual(
      requesTypeIs.mimeMatch('*/*+xml', 'text/html+xml'),
      true,
    );
  });

  it('should perform full wildcard matching with specific suffix', function () {
    assert.strictEqual(
      requesTypeIs.mimeMatch('*/*+xml', 'text/html+xml'),
      true,
    );
    assert.strictEqual(requesTypeIs.mimeMatch('*/*+xml', 'text/html'), false);
  });
});

describe('requestTypeIs.normalize(type)', function () {
  it('should return false for non-strings', function () {
    assert.strictEqual(requesTypeIs.normalize({}), false);
    assert.strictEqual(requesTypeIs.normalize([]), false);
    assert.strictEqual(requesTypeIs.normalize(42), false);
    assert.strictEqual(requesTypeIs.normalize(null), false);
    assert.strictEqual(
      requesTypeIs.normalize(function () {}),
      false,
    );
  });

  it('should return media type for extension', function () {
    assert.strictEqual(requesTypeIs.normalize('json'), 'application/json');
  });

  it('should return expanded wildcard for suffix', function () {
    assert.strictEqual(requesTypeIs.normalize('+json'), '*/*+json');
  });

  it('should pass through media type', function () {
    assert.strictEqual(
      requesTypeIs.normalize('application/json'),
      'application/json',
    );
  });

  it('should pass through wildcard', function () {
    assert.strictEqual(requesTypeIs.normalize('*/*'), '*/*');
    assert.strictEqual(requesTypeIs.normalize('image/*'), 'image/*');
  });

  it('should return false for unmapped extension', function () {
    assert.strictEqual(requesTypeIs.normalize('unknown'), false);
  });

  it('should expand special "urlencoded"', function () {
    assert.strictEqual(
      requesTypeIs.normalize('urlencoded'),
      'application/x-www-form-urlencoded',
    );
  });

  it('should expand special "multipart"', function () {
    assert.strictEqual(requesTypeIs.normalize('multipart'), 'multipart/*');
  });
});

// this calls mocks the Fetch API Request interface
class request {
  constructor({ ...a } = {}) {
    this.headers = a;
    this.headers = {
      ...this.headers,
      get(str) {
        return this[str];
      },
    };
  }
}

function createRequest(type) {
  return new request({
    'Content-Type': type || undefined,
    'Transfer-Encoding': 'chunked',
  });
}
