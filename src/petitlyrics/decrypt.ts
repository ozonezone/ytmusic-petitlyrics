export function decrypt(buffer: ArrayBufferLike) {
  const view = new DataView(buffer);

  let projectionKey = view.getUint16(0x1a, true);
  const protectionKeySwitchFlag = view.getUint8(0x19) == 1;
  if (protectionKeySwitchFlag) {
    projectionKey = (projectionKey & 0x3) |
      (projectionKey & 0xc) << 2 |
      (projectionKey & 0x30) >> 2 |
      (projectionKey & 0xc0) << 2 |
      (projectionKey & 0x300) >> 2 |
      (projectionKey & 0xc00) << 2 |
      (projectionKey & 0x3000) >> 2 |
      (projectionKey & 0xc000);
  }
  const lineCount = view.getUint32(0x38, true);

  const time: number[] = [];
  for (let i = 0; i < lineCount; i++) {
    const timeBeginByteIndex = i * 2 + 0xcc;
    const timeRaw = view.getUint16(timeBeginByteIndex, true);
    const timeCs = timeRaw ^ projectionKey;

    time.push(timeCs);
  }

  const lyricsStartByteIndex = lineCount * 2 + 0xcc;
  const lyrics: number[][] = [];
  let line = 0;
  for (let i = 0; i < (view.byteLength - lyricsStartByteIndex) / 2; i++) {
    const byte = view.getUint16(lyricsStartByteIndex + i * 2, true);
    if (byte == 0) {
      line++;
    } else {
      if (!lyrics[line]) {
        lyrics[line] = [];
      }
      lyrics[line].push(byte ^ projectionKey);
    }
  }
  const lyricsCombined = lyrics.reduce(
    (acc, val) => acc.concat(val, [0, 0]),
    [],
  );
  const binary = new Uint16Array(lyricsCombined);

  return {
    time,
    projectionKey,
    lineCount,
    lyricStartByte: lineCount * 2 + 0xcc,
    lyricsDecrypted: binary,
  };
}
