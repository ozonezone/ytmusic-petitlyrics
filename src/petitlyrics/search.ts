import { fetchApi } from "./util";
import * as v from "valibot";

const ResponseSchema = v.object({
  response: v.object({
    songs: v.object({
      song: v.optional(
        v.coerce(
          v.array(v.object({
            lyricsId: v.number(),
            artist: v.string(),
            title: v.string(),
            album: v.string(),
          })),
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

export type SearchParams = {
  key_artist?: string;
  key_album?: string;
  key_title?: string;
  key_duration?: number;
  index?: number;
  maxCount: number;
};
export const search = async (options: SearchParams) => {
  const res = await fetchApi(options);
  return v.parse(ResponseSchema, res);
};
