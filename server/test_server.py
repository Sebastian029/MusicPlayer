import numpy as np
import pytest

import server


@pytest.fixture
def client(tmp_path, monkeypatch):
    frame = bytes([0xFF, 0xFB, 0x90, 0x00]) + bytes(413)
    song_data = frame * 230

    (tmp_path / "02 - Artist B - Second.mp3").write_bytes(song_data)
    (tmp_path / "01 - Artist A - First.mp3").write_bytes(song_data)

    rock = tmp_path / "Rock"
    rock.mkdir()
    (rock / "Band - Loud.mp3").write_bytes(song_data)
    (rock / "Band - Quiet.mp3").write_bytes(song_data)
    (rock / "cover.jpg").write_bytes(b"playlist-cover")
    (rock / "Band - Loud.png").write_bytes(b"song-cover")

    monkeypatch.setattr(server, "SONGS_DIR", str(tmp_path))
    return server.app.test_client()


def test_media_files_are_sorted_and_named(client):
    songs = client.get("/media_files").get_json()
    assert [song["id"] for song in songs] == [1, 2, 3, 4]
    assert songs[0]["artist"] == "Artist A"
    assert songs[0]["name"] == "First"
    assert songs[0]["playlist"] == ""
    assert songs[0]["image"] is None


def test_playlists_are_sub_folders(client):
    assert client.get("/playlists").get_json() == [
        {"name": "Rock", "count": 2, "image": "playlist_cover/Rock"}
    ]
    songs = client.get("/media_files").get_json()
    rock_names = [song["name"] for song in songs if song["playlist"] == "Rock"]
    assert rock_names == ["Loud", "Quiet"]


def test_song_cover_wins_over_playlist_cover(client):
    assert client.get("/get_cover/3").data == b"song-cover"
    assert client.get("/get_cover/4").data == b"playlist-cover"
    assert client.get("/playlist_cover/Rock").data == b"playlist-cover"


def test_missing_cover_returns_404(client):
    assert client.get("/get_cover/1").status_code == 404
    assert client.get("/playlist_cover/Nope").status_code == 404


def test_get_mp3_supports_range(client):
    response = client.get("/get_mp3/1", headers={"Range": "bytes=0-99"})
    assert response.status_code == 206
    assert len(response.data) == 100


def test_song_in_playlist_is_streamed(client):
    assert client.get("/get_mp3/3").status_code == 200


def test_unknown_id_returns_404(client):
    for path in ["get_mp3", "get_name", "get_duration", "get_waveform", "get_cover"]:
        assert client.get(f"/{path}/99").status_code == 404


def test_waveform_values_are_percentages(client):
    bars = client.get("/get_waveform/1").get_json()["bars"]
    assert len(bars) >= server.MIN_BARS
    assert all(0 < value <= 100 for value in bars)


def test_waveform_bars_match_its_duration(client):
    waveform = client.get("/get_waveform/1").get_json()
    assert waveform["duration"] > 0
    assert len(waveform["bars"]) == server.count_bars(waveform["duration"])


def test_one_bar_per_second_within_limits():
    assert server.count_bars(240) == 240
    assert server.count_bars(2) == server.MIN_BARS
    assert server.count_bars(5000) == server.MAX_BARS


def test_loud_part_gives_taller_bars():
    quiet_then_loud = np.concatenate([np.full(4000, 100.0), np.full(4000, 10000.0)])
    bars = server.samples_to_bars(quiet_then_loud, 100)
    assert len(bars) == 100
    assert max(bars[:50]) < min(bars[50:])
    assert max(bars) == 100


def test_silence_and_short_audio_give_minimum_bars():
    flat = [server.MIN_BAR_HEIGHT] * 100
    assert server.samples_to_bars(np.zeros(8000), 100) == flat
    assert server.samples_to_bars(np.ones(10), 100) == flat


def test_duration_is_positive(client):
    assert client.get("/get_duration/1").get_json()["duration"] > 0


def test_random_song_id_is_valid(client):
    song_id = client.get("/random_song_id").get_json()["random_song_id"]
    assert song_id in [1, 2, 3, 4]
