// small runtime test for ReadableStream ponyfill
if (typeof globalThis.ReadableStream === 'undefined') {
  try {
    const pony = require('web-streams-polyfill/ponyfill');
    globalThis.ReadableStream = pony.ReadableStream;
    console.log('ponyfill applied');
  } catch (e) {
    console.error('ponyfill install failed', e);
  }
} else {
  console.log('ReadableStream present');
}
try {
  const undici = require('undici');
  console.log('undici required ok');
} catch (e) {
  console.error('undici require failed', e);
}
