import { fetchApi } from "./util";
import * as v from "valibot";

const ResponseSchema = v.object({
  response: v.object({
    songs: v.object({
      song: v.optional(
        v.pipe(
          v.any(),
          v.transform((input) => (Array.isArray(input) ? input : [input])),
          v.array(v.object({
            lyricsId: v.number(),
            artist: v.string(),
            title: v.string(),
            album: v.string(),
          })),
        ),
      ),
    }),
  }),
});

export type SearchParams = {
  key_artist: string;
  key_album: string;
  key_title: string;
  key_duration?: number;
  index?: number;
  maxCount: number;
};
export const search = async (options: SearchParams) => {
  const res = await fetchApi(options);
  console.log("Petitlyrics search result:", options, res);
  return v.parse(ResponseSchema, res);
};
