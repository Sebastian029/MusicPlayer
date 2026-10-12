import json
import os
import re

import miniaudio
import numpy as np
from flask import Flask, Response, abort, jsonify, request, send_from_directory
from mutagen.id3 import ID3, ID3NoHeaderError
from mutagen.mp3 import MP3

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SONGS_DIR = os.path.join(BASE_DIR, "songs")
PLAYLISTS_FILE = os.path.join(BASE_DIR, "my_playlists.json")
MIN_BARS = 10
MAX_BARS = 600
MIN_BAR_HEIGHT = 15
MAX_BAR_HEIGHT = 100
SAMPLE_RATE = 8000
CONTRAST = 3
IMAGE_EXTENSIONS = (".jpg", ".jpeg", ".png", ".webp")
COVER_CACHE_SECONDS = 60 * 60 * 24 * 30

app = Flask(__name__)
waveform_cache = {}
metadata_cache = {}
songs_cache = {"signature": None, "songs": []}


def list_playlist_folders():
    folders = [
        name
        for name in os.listdir(SONGS_DIR)
        if os.path.isdir(os.path.join(SONGS_DIR, name))
    ]
    return sorted(folders)


def get_library_signature():
    folders = [""] + list_playlist_folders()
    return tuple(
        (SONGS_DIR, folder, os.path.getmtime(os.path.join(SONGS_DIR, folder)))
        for folder in folders
    )


def scan_songs():
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


def list_songs():
    signature = get_library_signature()
    if songs_cache["signature"] != signature:
        songs_cache["songs"] = scan_songs()
        songs_cache["signature"] = signature
    return songs_cache["songs"]


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


def get_cache_key(song):
    path = os.path.join(SONGS_DIR, song["path"])
    return (path, os.path.getmtime(path))


def get_metadata(song):
    key = get_cache_key(song)
    if key not in metadata_cache:
        artist, title = split_name(song["name"])
        tags = read_tags(song)
        if tags and "TPE1" in tags:
            artist = str(tags["TPE1"])
        if tags and "TIT2" in tags:
            title = str(tags["TIT2"])
        metadata_cache[key] = {
            "artist": artist,
            "title": title,
            "has_embedded_cover": bool(tags and tags.getall("APIC")),
        }
    return metadata_cache[key]


def get_artist_and_title(song):
    metadata = get_metadata(song)
    return metadata["artist"], metadata["title"]


def get_embedded_cover(song):
    tags = read_tags(song)
    if tags is None:
        return None
    pictures = tags.getall("APIC")
    if pictures:
        return pictures[0].data, pictures[0].mime
    return None


def uses_embedded_cover(song):
    has_own_image = find_image(song["playlist"], song["name"]) is not None
    return not has_own_image and get_metadata(song)["has_embedded_cover"]


def get_cover_source(song):
    image = find_image(song["playlist"], song["name"])
    if image:
        return image
    if uses_embedded_cover(song):
        return os.path.join(SONGS_DIR, song["path"])
    return find_image(song["playlist"], "cover") or find_image("", "cover")


def get_cover_url(song):
    source = get_cover_source(song)
    if source is None:
        return None
    return f"get_cover/{song['id']}?v={int(os.path.getmtime(source))}"


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
    bar_range = MAX_BAR_HEIGHT - MIN_BAR_HEIGHT
    bars = []
    for value in loudness:
        relative = (value / loudest) ** CONTRAST
        bars.append(round(MIN_BAR_HEIGHT + bar_range * relative))
    return bars


def get_waveform_data(song):
    key = get_cache_key(song)
    if key not in waveform_cache:
        try:
            with open(key[0], "rb") as file:
                decoded = miniaudio.decode(
                    file.read(), nchannels=1, sample_rate=SAMPLE_RATE
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


def load_user_playlists():
    if not os.path.exists(PLAYLISTS_FILE):
        return []
    with open(PLAYLISTS_FILE, encoding="utf-8") as file:
        return json.load(file)


def save_user_playlists(playlists):
    with open(PLAYLISTS_FILE, "w", encoding="utf-8") as file:
        json.dump(playlists, file, ensure_ascii=False, indent=2)


def find_user_playlist(playlists, playlist_id):
    for playlist in playlists:
        if playlist["id"] == playlist_id:
            return playlist
    abort(404)


def read_playlist_name():
    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()
    if not name:
        abort(400)
    return name


def user_playlist_to_json(playlist):
    id_by_path = {song["path"]: song["id"] for song in list_songs()}
    song_ids = [
        id_by_path[path] for path in playlist["paths"] if path in id_by_path
    ]
    return {"id": playlist["id"], "name": playlist["name"], "song_ids": song_ids}


def send_image_file(path):
    if path is None:
        abort(404)
    return send_from_directory(
        os.path.dirname(path), os.path.basename(path), max_age=COVER_CACHE_SECONDS
    )


def send_embedded_cover(song):
    data, mime = get_embedded_cover(song)
    response = Response(data, mimetype=mime)
    response.cache_control.max_age = COVER_CACHE_SECONDS
    response.add_etag()
    return response.make_conditional(request)


def send_cover(song):
    if uses_embedded_cover(song):
        return send_embedded_cover(song)
    return send_image_file(get_cover_source(song))


@app.route("/media_files")
def media_files():
    result = []
    for song in list_songs():
        artist, title = get_artist_and_title(song)
        result.append(
            {
                "id": song["id"],
                "name": title,
                "artist": artist,
                "playlist": song["playlist"],
                "image": get_cover_url(song),
            }
        )
    return jsonify(result)


@app.route("/playlists")
def playlists():
    songs = list_songs()
    result = []
    for folder in list_playlist_folders():
        count = len([song for song in songs if song["playlist"] == folder])
        cover = find_image(folder, "cover")
        image = None
        if cover:
            image = f"playlist_cover/{folder}?v={int(os.path.getmtime(cover))}"
        result.append({"name": folder, "count": count, "image": image})
    return jsonify(result)


@app.route("/my_playlists")
def my_playlists():
    return jsonify([user_playlist_to_json(p) for p in load_user_playlists()])


@app.route("/my_playlists", methods=["POST"])
def create_my_playlist():
    name = read_playlist_name()
    saved_playlists = load_user_playlists()
    new_id = max([playlist["id"] for playlist in saved_playlists], default=0) + 1
    playlist = {"id": new_id, "name": name, "paths": []}
    saved_playlists.append(playlist)
    save_user_playlists(saved_playlists)
    return jsonify(user_playlist_to_json(playlist)), 201


@app.route("/my_playlists/<int:playlist_id>", methods=["PUT"])
def update_my_playlist(playlist_id):
    name = read_playlist_name()
    data = request.get_json(silent=True) or {}
    song_ids = data.get("song_ids", [])
    path_by_id = {song["id"]: song["path"] for song in list_songs()}
    saved_playlists = load_user_playlists()
    playlist = find_user_playlist(saved_playlists, playlist_id)
    playlist["name"] = name
    playlist["paths"] = [
        path_by_id[song_id] for song_id in song_ids if song_id in path_by_id
    ]
    save_user_playlists(saved_playlists)
    return jsonify(user_playlist_to_json(playlist))


@app.route("/my_playlists/<int:playlist_id>", methods=["DELETE"])
def delete_my_playlist(playlist_id):
    saved_playlists = load_user_playlists()
    playlist = find_user_playlist(saved_playlists, playlist_id)
    saved_playlists.remove(playlist)
    save_user_playlists(saved_playlists)
    return "", 204


@app.route("/playlist_cover/<name>")
def playlist_cover(name):
    if name.startswith("."):
        abort(404)
    return send_image_file(find_image(name, "cover"))


@app.route("/get_mp3/<int:song_id>")
def get_mp3(song_id):
    song = get_song(song_id)
    return send_from_directory(SONGS_DIR, song["path"], conditional=True)


@app.route("/get_waveform/<int:song_id>")
def get_waveform(song_id):
    return jsonify(get_waveform_data(get_song(song_id)))


@app.route("/get_cover/<int:song_id>")
def get_song_cover(song_id):
    return send_cover(get_song(song_id))


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
