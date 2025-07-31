// Adapted from https://github.com/surikov/webaudiofont/blob/fd16e95/examples/midiplayer.html

import type { Song } from "@/types";
import type {
  WebAudioFontChannel,
  WebAudioFontPlayer,
  WebAudioFontReverberator,
} from "@/lib/midi/types";

export class MIDIPlayer {
  private audioContext: AudioContext | null = null;
  private player: WebAudioFontPlayer | null = null;
  private reverberator: WebAudioFontReverberator | null = null;
  private equalizer: WebAudioFontChannel | null = null;
  private songStart: number = 0;
  private input: AudioNode | null = null;
  private currentSongTime: number = 0;
  private nextStepTime: number = 0;
  private nextPositionTime: number = 0;
  private loadedSong: Song | null = null;

  constructor() {}

  public startPlay = (onSongEnd: () => void): void => {
    this.currentSongTime = 0;
    this.songStart = this.audioContext!.currentTime;
    this.nextStepTime = this.audioContext!.currentTime;
    const stepDuration = 44 / 1000;
    this.tick(this.loadedSong!, stepDuration, onSongEnd);
  };

  private tick = (
    song: Song,
    stepDuration: number,
    onSongEnd: () => void
  ): void => {
    if (this.audioContext!.currentTime > this.nextStepTime - stepDuration) {
      this.sendNotes(
        song,
        this.songStart,
        this.currentSongTime,
        this.currentSongTime + stepDuration,
        this.audioContext!,
        this.input!,
        this.player!
      );
      this.currentSongTime = this.currentSongTime + stepDuration;
      this.nextStepTime = this.nextStepTime + stepDuration;
      if (this.currentSongTime > song.duration) {
        onSongEnd();
        return;
      }
    }
    if (this.nextPositionTime < this.audioContext!.currentTime) {
      this.nextPositionTime = this.audioContext!.currentTime + 3;
    }
    window.requestAnimationFrame(() => {
      this.tick(song, stepDuration, onSongEnd);
    });
  };

  private sendNotes = (
    song: Song,
    songStart: number,
    start: number,
    end: number,
    audioContext: AudioContext,
    input: AudioNode,
    player: WebAudioFontPlayer
  ): void => {
    for (let t = 0; t < song.tracks.length; t++) {
      const track = song.tracks[t];
      for (let i = 0; i < track.notes.length; i++) {
        if (track.notes[i].when >= start && track.notes[i].when < end) {
          const when = songStart + track.notes[i].when;
          let duration = track.notes[i].duration;
          if (duration > 3) {
            duration = 3;
          }
          const instr = track.info.variable;
          const v = track.volume / 7;

          player.queueWaveTable(
            audioContext,
            input,
            (window[instr] as { zones: unknown[] }) || { zones: [] },
            when,
            track.notes[i].pitch,
            duration,
            v,
            track.notes[i].slides
          );
        }
      }
    }
    for (let b = 0; b < song.beats.length; b++) {
      const beat = song.beats[b];
      for (let i = 0; i < beat.notes.length; i++) {
        if (beat.notes[i].when >= start && beat.notes[i].when < end) {
          const when = songStart + beat.notes[i].when;
          const duration = 1.5;
          const instr = beat.info.variable;
          const v = beat.volume / 2;
          player.queueWaveTable(
            audioContext,
            input,
            (window[instr] as { zones: unknown[] }) || { zones: [] },
            when,
            beat.n,
            duration,
            v
          );
        }
      }
    }
  };

  public startLoad = (song: Song, onSongLoad: (song: Song) => void): void => {
    console.log(song);
    const AudioContextFunc = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new AudioContextFunc();
    this.player = new window.WebAudioFontPlayer();

    this.equalizer = this.player.createChannel(this.audioContext);
    this.reverberator = this.player.createReverberator(this.audioContext);
    this.input = this.equalizer.input;
    this.equalizer.output.connect(this.reverberator.input);
    this.reverberator.output.connect(this.audioContext.destination);

    for (let i = 0; i < song.tracks.length; i++) {
      const nn = this.player.loader.findInstrument(song.tracks[i].program);
      const info = this.player.loader.instrumentInfo(nn);
      song.tracks[i].info = info;
      song.tracks[i].id = nn;
      this.player.loader.startLoad(this.audioContext, info.url, info.variable);
    }
    for (let i = 0; i < song.beats.length; i++) {
      const nn = this.player.loader.findDrum(song.beats[i].n);
      const info = this.player.loader.drumInfo(nn);
      song.beats[i].info = info;
      song.beats[i].id = nn;
      this.player.loader.startLoad(this.audioContext, info.url, info.variable);
    }
    this.player.loader.waitLoad(() => {
      this.loadedSong = song;
      this.resetEqualizer();
      onSongLoad(song);
    });
  };

  private resetEqualizer = (): void => {
    this.equalizer!.band32.gain.setTargetAtTime(2, 0, 0.0001);
    this.equalizer!.band64.gain.setTargetAtTime(2, 0, 0.0001);
    this.equalizer!.band128.gain.setTargetAtTime(1, 0, 0.0001);
    this.equalizer!.band256.gain.setTargetAtTime(0, 0, 0.0001);
    this.equalizer!.band512.gain.setTargetAtTime(-1, 0, 0.0001);
    this.equalizer!.band1k.gain.setTargetAtTime(5, 0, 0.0001);
    this.equalizer!.band2k.gain.setTargetAtTime(4, 0, 0.0001);
    this.equalizer!.band4k.gain.setTargetAtTime(3, 0, 0.0001);
    this.equalizer!.band8k.gain.setTargetAtTime(-2, 0, 0.0001);
    this.equalizer!.band16k.gain.setTargetAtTime(2, 0, 0.0001);
  };

  public stop = (): void => {
    this.audioContext?.close();
    this.input?.disconnect();
  };
}
