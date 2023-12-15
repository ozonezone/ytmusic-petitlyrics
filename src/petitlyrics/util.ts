import { XMLParser } from "fast-xml-parser";

import { default as fetch } from "@trim21/gm-fetch";

export const xmlParser = new XMLParser();

export const CLIENT_APP_ID = "p1110417";
export const TERMINAL_TYPE = 10;
export const ENDPOINT = "https://p1.petitlyrics.com/api/GetPetitLyricsData.php";

export const fetchApi = async (
  options: Record<string, string | number>,
): Promise<unknown> => {
  const res_s = await (await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      ...options,
      terminalType: TERMINAL_TYPE.toString(),
      clientAppId: CLIENT_APP_ID,
    }),
  })).text();
  const res = xmlParser.parse(res_s);
  return res;
};
