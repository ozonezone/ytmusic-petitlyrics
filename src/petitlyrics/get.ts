import { fetchApi, xmlParser } from "./util";
import * as v from "valibot";
import * as base64 from "js-base64";

const ResponseSchema = v.object({
  response: v.object({
    songs: v.object({
      song: v.optional(
        v.coerce(
          v.array(
            v.object({
              lyricsId: v.number(),
              artist: v.string(),
              title: v.string(),
              album: v.string(),
              lyricsData: v.string(),
            }),
          ),
          (v) => {
            if (!Array.isArray(v)) {
              return [v];
            }
            return v;
          },
        ),
      ),
    }),
  }),
});

/// If lyricsId is not provided, probably it will return the first result.
export type GetParams = {
  key_artist?: string;
  key_album?: string;
  key_title?: string;
  key_duration?: number;
  key_lyricsId?: number;
};

export const getNotSyncedLyrics = async (options: GetParams) => {
  const res_o = await fetchApi({ ...options, lyricsType: 1 });
  const res = v.parse(ResponseSchema, res_o);
  const lyricData = res.response.songs.song?.[0].lyricsData;
  if (!lyricData) {
    throw new Error("Lyric not found");
  }
  return base64.decode(lyricData);
};

const WordSyncedLyricsDataSchema = v.object({
  wsy: v.object({
    line: v.array(v.object({
      word: v.coerce(
        v.array(v.object({
          starttime: v.number(),
          endtime: v.number(),
          wordstring: v.coerce(v.string(), String),
        })),
        (v) => {
          if (!Array.isArray(v)) {
            return [v];
          }
          return v;
        },
      ),
    })),
  }),
});
export const getWordSyncedLyrics = async (options: GetParams) => {
  const res_o = await fetchApi({ ...options, lyricsType: 3 });
  const res = v.parse(ResponseSchema, res_o);
  const lyricData = res.response.songs.song?.[0].lyricsData;
  if (!lyricData) {
    throw new Error("Lyric not found");
  }
  const lyricDataObj = xmlParser.parse(base64.decode(lyricData));
  return v.parse(
    WordSyncedLyricsDataSchema,
    lyricDataObj,
  );
};

export const getEncryptedLyrics = async (options: GetParams) => {
  const res_o = await fetchApi({ ...options, lyricsType: 2 });
  const res = v.parse(ResponseSchema, res_o);
  const lyricData = res.response.songs.song?.[0].lyricsData;
  if (!lyricData) {
    throw new Error("Lyric not found");
  }
  return lyricData;
};
