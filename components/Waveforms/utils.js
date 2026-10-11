export async function getWaveForms(serverUrl, songId) {
  try {
    const response = await fetch(`${serverUrl}/get_waveform/${songId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch data");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching waveform data:", error);
    return { duration: 0, bars: [] };
  }
}
