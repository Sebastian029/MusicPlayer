import os

import numpy as np
import pytest
from mutagen.id3 import APIC, ID3

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
    monkeypatch.setattr(server, "PLAYLISTS_FILE", str(tmp_path / "my_playlists.json"))
    return server.app.test_client()


def test_media_files_are_sorted_and_named(client):
    songs = client.get("/media_files").get_json()
    assert [song["id"] for song in songs] == [1, 2, 3, 4]
    assert songs[0]["artist"] == "Artist A"
    assert songs[0]["name"] == "First"
    assert songs[0]["playlist"] == ""
    assert songs[0]["image"] is None


def test_playlists_are_sub_folders(client):
    playlists = client.get("/playlists").get_json()
    assert len(playlists) == 1
    assert playlists[0]["name"] == "Rock"
    assert playlists[0]["count"] == 2
    assert playlists[0]["image"].startswith("playlist_cover/Rock?v=")
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
    for path in ["get_mp3", "get_waveform", "get_cover"]:
        assert client.get(f"/{path}/99").status_code == 404


def test_waveform_values_are_percentages(client):
    bars = client.get("/get_waveform/1").get_json()["bars"]
    assert len(bars) >= server.MIN_BARS
    assert all(0 < value <= 100 for value in bars)


def test_waveform_bars_match_its_duration(client):
    waveform = client.get("/get_waveform/1").get_json()
    assert waveform["duration"] > 0
    assert len(waveform["bars"]) == server.count_bars(waveform["duration"])


def test_waveform_works_for_non_ascii_file_names(client, tmp_path, monkeypatch):
    song_data = (tmp_path / "01 - Artist A - First.mp3").read_bytes()
    (tmp_path / "00 - Zażółć gęślą jaźń.mp3").write_bytes(song_data)
    monkeypatch.setattr(server, "get_duration", lambda song: 0)
    waveform = client.get("/get_waveform/1").get_json()
    assert waveform["duration"] > 0


def create_playlist(client, name):
    return client.post("/my_playlists", json={"name": name}).get_json()


def test_no_user_playlists_at_start(client):
    assert client.get("/my_playlists").get_json() == []


def test_user_playlist_is_created_with_next_id(client):
    first = create_playlist(client, "Gym")
    second = create_playlist(client, "Chill")
    assert first == {"id": 1, "name": "Gym", "song_ids": []}
    assert second["id"] == 2
    assert len(client.get("/my_playlists").get_json()) == 2


def test_user_playlist_keeps_the_chosen_order(client):
    playlist = create_playlist(client, "Mix")
    response = client.put(
        f"/my_playlists/{playlist['id']}", json={"name": "Mix", "song_ids": [3, 1, 2]}
    )
    assert response.get_json()["song_ids"] == [3, 1, 2]
    assert client.get("/my_playlists").get_json()[0]["song_ids"] == [3, 1, 2]


def test_user_playlist_can_be_renamed(client):
    playlist = create_playlist(client, "Old")
    client.put(f"/my_playlists/{playlist['id']}", json={"name": "New", "song_ids": []})
    assert client.get("/my_playlists").get_json()[0]["name"] == "New"


def test_user_playlist_follows_songs_when_ids_shift(client, tmp_path):
    playlist = create_playlist(client, "Mix")
    client.put(f"/my_playlists/{playlist['id']}", json={"name": "Mix", "song_ids": [1]})
    (tmp_path / "00 - Artist 0 - Zero.mp3").write_bytes(
        (tmp_path / "01 - Artist A - First.mp3").read_bytes()
    )
    os.utime(tmp_path, (1, 1))
    song_ids = client.get("/my_playlists").get_json()[0]["song_ids"]
    songs = client.get("/media_files").get_json()
    assert [song["name"] for song in songs if song["id"] in song_ids] == ["First"]


def test_missing_song_is_skipped(client, tmp_path):
    playlist = create_playlist(client, "Mix")
    client.put(f"/my_playlists/{playlist['id']}", json={"name": "Mix", "song_ids": [1, 2]})
    (tmp_path / "02 - Artist B - Second.mp3").unlink()
    os.utime(tmp_path, (1, 1))
    assert client.get("/my_playlists").get_json()[0]["song_ids"] == [1]


def test_user_playlist_can_be_deleted(client):
    playlist = create_playlist(client, "Gone")
    assert client.delete(f"/my_playlists/{playlist['id']}").status_code == 204
    assert client.get("/my_playlists").get_json() == []


def test_user_playlist_needs_a_name(client):
    assert client.post("/my_playlists", json={"name": "  "}).status_code == 400
    assert client.post("/my_playlists", json={}).status_code == 400


def test_unknown_user_playlist_returns_404(client):
    assert client.put("/my_playlists/99", json={"name": "x", "song_ids": []}).status_code == 404
    assert client.delete("/my_playlists/99").status_code == 404


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


def test_cover_urls_have_a_version(client):
    songs = client.get("/media_files").get_json()
    assert songs[2]["image"].startswith("get_cover/3?v=")


def test_cover_can_be_cached_by_the_app(client):
    response = client.get("/get_cover/3")
    assert response.cache_control.max_age == server.COVER_CACHE_SECONDS


def test_embedded_cover_is_cached_and_revalidated(client, tmp_path):
    path = tmp_path / "01 - Artist A - First.mp3"
    tags = ID3()
    tags.add(APIC(encoding=3, mime="image/png", type=3, desc="", data=b"embedded"))
    tags.save(str(path))
    os.utime(path, (1, 1))

    response = client.get("/get_cover/1")
    assert response.data == b"embedded"
    assert response.cache_control.max_age == server.COVER_CACHE_SECONDS

    etag = response.headers["ETag"]
    again = client.get("/get_cover/1", headers={"If-None-Match": etag})
    assert again.status_code == 304


def test_tags_are_read_once_per_file(client, monkeypatch):
    client.get("/media_files")
    calls = []
    monkeypatch.setattr(server, "read_tags", lambda song: calls.append(song))
    client.get("/media_files")
    assert calls == []


def test_song_list_is_rebuilt_when_a_file_is_added(client, tmp_path):
    assert len(client.get("/media_files").get_json()) == 4
    (tmp_path / "03 - Artist C - Third.mp3").write_bytes(b"")
    os.utime(tmp_path, (1, 1))
    assert len(client.get("/media_files").get_json()) == 5
