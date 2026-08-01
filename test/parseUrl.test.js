import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractVideoId,
  isValidVideoId,
  buildEmbedUrl,
  buildWatchUrl,
  buildThumbnailUrl,
} from '../lib/services/youtube/parseUrl.js';

const ID = 'dQw4w9WgXcQ';

test('extractVideoId accepts every common YouTube URL form', () => {
  const accepted = [
    `https://www.youtube.com/watch?v=${ID}`,
    `https://youtube.com/watch?v=${ID}`,
    `https://m.youtube.com/watch?v=${ID}`,
    `https://music.youtube.com/watch?v=${ID}`,
    `https://youtu.be/${ID}`,
    `https://www.youtube.com/embed/${ID}`,
    `https://www.youtube.com/shorts/${ID}`,
    `https://www.youtube.com/live/${ID}`,
    `https://www.youtube-nocookie.com/embed/${ID}`,
    // Extra query parameters must not confuse it.
    `https://www.youtube.com/watch?v=${ID}&t=42s&list=PLabc`,
    `https://youtu.be/${ID}?t=42`,
    // No scheme, as a teacher might paste it.
    `youtube.com/watch?v=${ID}`,
    // Surrounding whitespace from a copy-paste.
    `  https://youtu.be/${ID}  `,
    // A bare id.
    ID,
  ];

  for (const url of accepted) {
    assert.equal(extractVideoId(url), ID, `should extract from: ${url}`);
  }
});

test('extractVideoId rejects non-YouTube hosts', () => {
  // The previous substring-matching implementation accepted all of these,
  // because it only looked for "v=" anywhere in the string.
  const rejected = [
    `https://evil.example/?v=${ID}`,
    `https://youtube.com.evil.example/watch?v=${ID}`,
    `https://notyoutube.com/watch?v=${ID}`,
    `https://vimeo.com/watch?v=${ID}`,
    `https://fakeyoutu.be/${ID}`,
  ];

  for (const url of rejected) {
    assert.equal(extractVideoId(url), null, `should reject: ${url}`);
  }
});

test('extractVideoId rejects malformed ids and junk input', () => {
  const rejected = [
    'https://www.youtube.com/watch?v=tooshort',
    'https://www.youtube.com/watch?v=waaaaaytoolongforanid',
    'https://www.youtube.com/watch?v=has spaces!',
    'https://www.youtube.com/',
    'javascript:alert(1)',
    'not a url at all',
    '',
    '   ',
    null,
    undefined,
    12345,
    {},
  ];

  for (const input of rejected) {
    assert.equal(extractVideoId(input), null, `should reject: ${String(input)}`);
  }
});

test('isValidVideoId enforces the 11-character alphabet', () => {
  assert.equal(isValidVideoId(ID), true);
  assert.equal(isValidVideoId('_-abcABC123'), true);
  assert.equal(isValidVideoId('short'), false);
  assert.equal(isValidVideoId('contains spc'), false);
  assert.equal(isValidVideoId(null), false);
});

test('URL builders derive from the id, never from user input', () => {
  assert.equal(buildWatchUrl(ID), `https://www.youtube.com/watch?v=${ID}`);
  assert.equal(buildEmbedUrl(ID), `https://www.youtube-nocookie.com/embed/${ID}`);
  assert.equal(buildThumbnailUrl(ID), `https://i.ytimg.com/vi/${ID}/hqdefault.jpg`);

  assert.equal(buildWatchUrl('bad'), null);
  assert.equal(buildEmbedUrl('bad'), null);
  assert.equal(buildThumbnailUrl(null), null);
});
