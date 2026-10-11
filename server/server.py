import os
import random
import re

import miniaudio
import numpy as np
from flask import Flask, Response, abort, jsonify, send_from_directory
from mutagen.id3 import ID3, ID3NoHeaderError
from mutagen.mp3 import MP3

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SONGS_DIR = os.path.join(BASE_DIR, "songs")
MIN_BARS = 10
MAX_BARS = 600
MIN_BAR_HEIGHT = 15
SAMPLE_RATE = 8000
CONTRAST = 3
IMAGE_EXTENSIONS = (".jpg", ".jpeg", ".png", ".webp")

app = Flask(__name__)
waveform_cache = {}


def list_playlist_folders():
    folders = [
        name
        for name in os.listdir(SONGS_DIR)
        if os.path.isdir(os.path.join(SONGS_DIR, name))
    ]
    return sorted(folders)


def list_songs():
    songs = []
    for folder in [""] + list_playlist_folders():
        for file in sorted(os.listdir(os.path.join(SONGS_DIR, folder))):
            if file.lower().endswith(".mp3"):
                songs.append(
                    {
                        "id": len(songs) + 1,
                        "playlist": folder,
                        "path": os.path.join(folder, file).replace("\\", "/"),
                        "name": os.path.splitext(file)[0],
                    }
                )
    return songs


def get_song(song_id):
    for song in list_songs():
        if song["id"] == song_id:
            return song
    abort(404)


def find_image(folder, name):
    for extension in IMAGE_EXTENSIONS:
        path = os.path.join(SONGS_DIR, folder, name + extension)
        if os.path.exists(path):
            return path
    return None


def split_name(name):
    name = re.sub(r"^\d+\s*[-.]\s*", "", name)
    artist, separator, title = name.partition(" - ")
    if separator:
        return artist, title
    return "Unknown", name


def read_tags(song):
    try:
        return ID3(os.path.join(SONGS_DIR, song["path"]))
    except ID3NoHeaderError:
        return None


def get_artist_and_title(song):
    artist, title = split_name(song["name"])
    tags = read_tags(song)
    if tags and "TPE1" in tags:
        artist = str(tags["TPE1"])
    if tags and "TIT2" in tags:
        title = str(tags["TIT2"])
    return artist, title


def get_embedded_cover(song):
    tags = read_tags(song)
    if tags is None:
        return None
    pictures = tags.getall("APIC")
    if pictures:
        return pictures[0].data, pictures[0].mime
    return None


def get_cover(song):
    return (
        find_image(song["playlist"], song["name"])
        or get_embedded_cover(song)
        or find_image(song["playlist"], "cover")
        or find_image("", "cover")
    )


def get_duration(song):
    try:
        return MP3(os.path.join(SONGS_DIR, song["path"])).info.length
    except Exception:
        return 0


def count_bars(seconds):
    return min(MAX_BARS, max(MIN_BARS, round(seconds)))


def samples_to_bars(samples, bars_num):
    if len(samples) < bars_num:
        return [MIN_BAR_HEIGHT] * bars_num
    chunks = np.array_split(samples, bars_num)
    loudness = [np.sqrt(np.mean(chunk**2)) for chunk in chunks]
    loudest = max(loudness)
    if loudest == 0:
        return [MIN_BAR_HEIGHT] * bars_num
    bars = []
    for value in loudness:
        relative = (value / loudest) ** CONTRAST
        bars.append(round(MIN_BAR_HEIGHT + (100 - MIN_BAR_HEIGHT) * relative))
    return bars


def get_waveform_data(song):
    path = os.path.join(SONGS_DIR, song["path"])
    key = (path, os.path.getmtime(path))
    if key not in waveform_cache:
        try:
            decoded = miniaudio.decode_file(
                path, nchannels=1, sample_rate=SAMPLE_RATE
            )
            samples = np.array(decoded.samples, dtype=np.float64)
            seconds = len(samples) / SAMPLE_RATE
            waveform_cache[key] = {
                "duration": seconds,
                "bars": samples_to_bars(samples, count_bars(seconds)),
            }
        except Exception:
            waveform_cache[key] = {
                "duration": get_duration(song),
                "bars": [MIN_BAR_HEIGHT] * MIN_BARS,
            }
    return waveform_cache[key]


def send_image(image):
    if image is None:
        abort(404)
    if isinstance(image, tuple):
        data, mime = image
        return Response(data, mimetype=mime)
    return send_from_directory(os.path.dirname(image), os.path.basename(image))


@app.route("/media_files")
def media_files():
    result = []
    for song in list_songs():
        artist, title = get_artist_and_title(song)
        has_cover = get_cover(song) is not None
        result.append(
            {
                "id": song["id"],
                "name": title,
                "artist": artist,
                "playlist": song["playlist"],
                "image": f"get_cover/{song['id']}" if has_cover else None,
            }
        )
    return jsonify(result)


@app.route("/playlists")
def playlists():
    songs = list_songs()
    result = []
    for folder in list_playlist_folders():
        count = len([song for song in songs if song["playlist"] == folder])
        has_cover = find_image(folder, "cover") is not None
        result.append(
            {
                "name": folder,
                "count": count,
                "image": f"playlist_cover/{folder}" if has_cover else None,
            }
        )
    return jsonify(result)


@app.route("/playlist_cover/<name>")
def playlist_cover(name):
    if name.startswith("."):
        abort(404)
    return send_image(find_image(name, "cover"))


@app.route("/get_mp3/<int:song_id>")
def get_mp3(song_id):
    song = get_song(song_id)
    return send_from_directory(SONGS_DIR, song["path"], conditional=True)


@app.route("/get_name/<int:song_id>")
def get_name(song_id):
    _, title = get_artist_and_title(get_song(song_id))
    return jsonify({"name": title})


@app.route("/get_duration/<int:song_id>")
def get_song_duration(song_id):
    return jsonify({"duration": get_duration(get_song(song_id))})


@app.route("/get_waveform/<int:song_id>")
def get_waveform(song_id):
    return jsonify(get_waveform_data(get_song(song_id)))


@app.route("/get_cover/<int:song_id>")
def get_song_cover(song_id):
    return send_image(get_cover(get_song(song_id)))


@app.route("/random_song_id")
def random_song_id():
    songs = list_songs()
    if not songs:
        abort(404)
    return jsonify({"random_song_id": random.choice(songs)["id"]})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
