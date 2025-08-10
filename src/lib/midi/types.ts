export interface WebAudioFontPlayer {
  loader: {
    findInstrument(program: number): number;
    findDrum(n: number): number;
    instrumentInfo(nn: number): { url: string; variable: string };
    drumInfo(nn: number): { url: string; variable: string };
    loadInstrument(url: string, variable: string): Promise<void>;
    startLoad(audioContext: AudioContext, url: string, variable: string): void;
    waitLoad(callback: () => void): void;
  };
  createChannel(audioContext: AudioContext): WebAudioFontChannel;
  createReverberator(audioContext: AudioContext): WebAudioFontReverberator;
  queueWaveTable(
    audioContext: AudioContext,
    input: AudioNode,
    preset: { zones: unknown[] },
    when: number,
    pitch: number,
    duration: number,
    volume: number,
    slides?: unknown
  ): void;
  cancelQueue(audioContext: AudioContext): void;
}

export interface WebAudioFontReverberator {
  input: AudioNode;
  output: AudioNode;
}

export interface WebAudioFontChannel {
  input: AudioNode;
  output: AudioNode;
  band32: { gain: AudioParam };
  band64: { gain: AudioParam };
  band128: { gain: AudioParam };
  band256: { gain: AudioParam };
  band512: { gain: AudioParam };
  band1k: { gain: AudioParam };
  band2k: { gain: AudioParam };
  band4k: { gain: AudioParam };
  band8k: { gain: AudioParam };
  band16k: { gain: AudioParam };
}

declare global {
  interface Window {
    WebAudioFontPlayer: new () => WebAudioFontPlayer;
    WebAudioFontReverberator: new () => WebAudioFontReverberator;
    WebAudioFontChannel: new () => WebAudioFontChannel;
    webkitAudioContext: typeof AudioContext;
    [key: string]: unknown;
  }
}
