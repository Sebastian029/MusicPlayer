let waveformCache = {};

export const clearWaveFormsCache = () => {
  waveformCache = {};
};

export async function getWaveForms(serverUrl, songId) {
  if (waveformCache[songId]) {
    return waveformCache[songId];
  }
  try {
    const response = await fetch(`${serverUrl}/get_waveform/${songId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch data");
    }
    waveformCache[songId] = await response.json();
    return waveformCache[songId];
  } catch (error) {
    console.error("Error fetching waveform data:", error);
    return { duration: 0, bars: [] };
  }
}
