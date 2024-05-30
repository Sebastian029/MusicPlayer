export async function getWaveForms(flaskServerURL, path) {
  const waveforms = [];
  const url = `${flaskServerURL}/get_waveform/${path}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to fetch data");
    }

    const responseData = await response.text();

    const parsedData = JSON.parse(responseData);

    for (let i = 0; i < parsedData.length; i++) {
      waveforms.push(parsedData[i]);
    }
    console.log(waveforms.length);
    return waveforms;
  } catch (error) {
    console.error("Error fetching waveform data:", error);
    return waveforms; // Return empty array or partial data in case of error
  }
}
