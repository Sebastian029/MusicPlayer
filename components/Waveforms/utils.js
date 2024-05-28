export async function getWaveForms(path, flaskServerURL, size = 150) {
  const waveforms = [];
  const url = `${flaskServerURL}/${path}`;
  console.log("getweaveformsss");

  for (let i = 0; i < size; i++) {
    waveforms.push(Math.max(10, Math.floor(Math.random() * 100)));
  }

  return waveforms;
}
