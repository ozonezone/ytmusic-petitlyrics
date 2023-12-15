import { getNotSyncedLyrics, getWordSyncedLyrics } from "./petitlyrics/get";
import { search } from "./petitlyrics/search";

export type SearchData = Awaited<ReturnType<typeof search>>;
export type WordSyncLyricsData = Awaited<
  ReturnType<typeof getWordSyncedLyrics>
>;
export type NotSyncedLyricsData = Awaited<
  ReturnType<typeof getNotSyncedLyrics>
>;
export type Message = (string | Error)[];
type LyricsResult = {
  success: true;
  lyricsType: 1;
  message: Message;
  data: NotSyncedLyricsData;
} | {
  success: true;
  lyricsType: 3;
  message: Message;
  data: WordSyncLyricsData;
} | {
  success: false;
  message: Message;
} | null;

export type LyricsQuery = {
  artist?: string[];
  album?: string;
  title?: string;
};

const fetchLyrices = async (query: LyricsQuery): Promise<LyricsResult> => {
  let message: Message = [];
  let searchData: SearchData;
  try {
    searchData = await search({
      key_artist: query.artist?.[0],
      key_title: query.title,
      key_album: query.album,
      maxCount: 10,
    });
  } catch (e) {
    try {
      console.log("Falling back to no album");
      searchData = await search({
        key_artist: query.artist?.[0],
        key_title: query.title,
        maxCount: 10,
      });
    } catch (e) {
      message.push("Failed to search song (fallback)" + e);
      return { success: false, message };
    }
  }

  const lyricsId = searchData.response.songs.song?.[0]?.lyricsId;
  if (!lyricsId) {
    message.push("No lyrics found");
    return { success: false, message };
  }

  try {
    return {
      success: true,
      lyricsType: 3,
      message,
      data: await getWordSyncedLyrics({ key_lyricsId: lyricsId }),
    };
  } catch (e) {
    message.push(
      "Failed to search song. Falling back to non-sync lyrics." + e,
    );
    try {
      return {
        success: true,
        lyricsType: 1,
        message,
        data: await getNotSyncedLyrics({ key_lyricsId: lyricsId }),
      };
    } catch (e) {
      message.push("Failed to get lyrics (fallback)" + e);
      return { success: false, message };
    }
  }
};

export const getLyrics = async (query: LyricsQuery) => {
  if (!query.artist && !query.title && !query.album) {
    return null;
  }

  return await fetchLyrices(query);
};
