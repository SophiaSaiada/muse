export const searchSongOnMidiDB = async (songName: string) => {
  const filePageUrl = await fetchSongPageUrl(songName);
  const downloadUrl = await findMidiDownloadUrl(filePageUrl);
  return fetch(getCorsProxyUrl(downloadUrl));
};

const fetchSongPageUrl = async (songName: string) => {
  const searchResultsText = await fetchSearchResultsText(songName);
  return findSongPageUrl(searchResultsText);
};

const fetchSearchResultsText = async (songName: string) => {
  const params = new URLSearchParams({
    q: songName,
    formatID: "1",
  });
  const searchUrl = `https://www.mididb.com/search.asp?${params.toString()}`;
  return fetchHtml(searchUrl);
};

const findSongPageUrl = (searchResultsText: string) => {
  const searchResultsPageSongsArticle = searchResultsText
    .replace(/^[\s\S]*?<article id="songs">/, "")
    .replace(/<\/article>[\s\S]*$/, "");

  const filePageLinkMatches = searchResultsPageSongsArticle.match(
    /<a href="(https:\/\/www.mididb.com\/[^"]+)"/
  );
  if (!filePageLinkMatches) {
    throw new Error("No file page link matches");
  }

  return filePageLinkMatches[1];
};

const getCorsProxyUrl = (url: string) =>
  `https://corsproxy.io/?url=${encodeURIComponent(url)}`;

const fetchHtml = async (url: string) => {
  const response = await fetch(getCorsProxyUrl(url));
  return response.text();
};

const findMidiDownloadUrl = async (filePageUrl: string) => {
  const filePageText = await fetchHtml(filePageUrl);

  const midiFileLinkMatch = filePageText.match(
    /<a href="(https:\/\/www.mididb.com\/midi-download\/[^.]+\.mid)"/
  );
  if (midiFileLinkMatch) {
    const downloadUrl = midiFileLinkMatch[1];
    return downloadUrl;
  }

  const zipFileLinkMatch = filePageText.match(
    /<a href="https:\/\/www.mididb.com\/downloadzip.asp\?ccode=([^"]+)"/
  );
  if (zipFileLinkMatch) {
    const fileCode = zipFileLinkMatch[1];
    console.log("No midi file link found, using zip file link", fileCode);
    return `https://www.mididb.com/midi-download/AUD_${fileCode}.mid}`;
  }

  throw new Error("No midi file link or zip file link matches");
};
