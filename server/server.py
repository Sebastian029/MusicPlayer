import os
import random
import re

from flask import Flask, abort, jsonify, send_from_directory
from mutagen import File as MutagenFile

BASE = os.path.dirname(os.path.abspath(__file__))
SONGS_DIR = os.path.join(BASE, "songs")

BARS_NUM = 200

app = Flask(__name__)


def list_songs():
    """Songs sorted by filename; the id is the 1-based position (app uses id +/- 1)."""
    files = sorted(f for f in os.listdir(SONGS_DIR) if f.lower().endswith(".mp3"))
    return [
        {"id": i, "file": f, "name": os.path.splitext(f)[0]}
        for i, f in enumerate(files, start=1)
    ]


def get_song(song_id):
    for s in list_songs():
        if s["id"] == song_id:
            return s
    abort(404)


def split_name(name):
    """Return (artist, title), ignoring a leading track number like "01 - "."""
    name = re.sub(r"^\d+\s*[-.]\s*", "", name)
    artist, sep, title = name.partition(" - ")
    return (artist, title) if sep else ("Unknown", name)


def duration_of(song):
    audio = MutagenFile(os.path.join(SONGS_DIR, song["file"]))
    return audio.info.length if audio else 0


@app.route("/media_files")
def media_files():
    # Names like "Artist - Title.mp3" or "01 - Artist - Title.mp3"
    result = []
    for s in list_songs():
        artist, title = split_name(s["name"])
        result.append({"id": s["id"], "name": title, "artist": artist, "image": None})
    return jsonify(result)


@app.route("/get_mp3/<int:song_id>")
def get_mp3(song_id):
    return send_from_directory(SONGS_DIR, get_song(song_id)["file"], conditional=True)


@app.route("/get_name/<int:song_id>")
def get_name(song_id):
    return jsonify({"name": split_name(get_song(song_id)["name"])[1]})


@app.route("/get_duration/<int:song_id>")
def get_duration(song_id):
    return jsonify({"duration": duration_of(get_song(song_id))})


@app.route("/get_waveform/<int:song_id>")
def get_waveform(song_id):
    # The app maps the whole song onto exactly BARS_NUM bars (components/Waveforms/constants.js),
    # whatever its length. Heights in percent; fake (seeded) shape, not real audio analysis.
    get_song(song_id)
    rng = random.Random(song_id)
    return jsonify([rng.randint(15, 100) for _ in range(BARS_NUM)])


@app.route("/get_cover/<int:song_id>")
def get_cover(song_id):
    # No covers: serve cover.jpg from songs/ if present, otherwise 404.
    get_song(song_id)
    if os.path.exists(os.path.join(SONGS_DIR, "cover.jpg")):
        return send_from_directory(SONGS_DIR, "cover.jpg")
    abort(404)


@app.route("/random_song_id")
def random_song_id():
    songs = list_songs()
    if not songs:
        abort(404)
    return jsonify({"random_song_id": random.choice(songs)["id"]})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
