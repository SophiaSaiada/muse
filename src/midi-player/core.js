import { MIDIFile } from "./MIDIFile";

export const MIDIPlayer = () => {
  let audioContext = null;
  let player = null;
  let reverberator = null;
  let equalizer = null;
  let songStart = 0;
  let input = null;
  let currentSongTime = 0;
  let nextStepTime = 0;
  let nextPositionTime = 0;
  let loadedSong = null;

  const startPlay = () => {
    currentSongTime = 0;
    songStart = audioContext.currentTime;
    nextStepTime = audioContext.currentTime;
    const stepDuration = 44 / 1000;
    tick(loadedSong, stepDuration);
  };

  const tick = (song, stepDuration) => {
    if (audioContext.currentTime > nextStepTime - stepDuration) {
      sendNotes(
        song,
        songStart,
        currentSongTime,
        currentSongTime + stepDuration,
        audioContext,
        input,
        player
      );
      currentSongTime = currentSongTime + stepDuration;
      nextStepTime = nextStepTime + stepDuration;
      if (currentSongTime > song.duration) {
        currentSongTime = currentSongTime - song.duration;
        sendNotes(
          song,
          songStart,
          0,
          currentSongTime,
          audioContext,
          input,
          player
        );
        songStart = songStart + song.duration;
      }
    }
    if (nextPositionTime < audioContext.currentTime) {
      nextPositionTime = audioContext.currentTime + 3;
    }
    window.requestAnimationFrame(function (t) {
      tick(song, stepDuration);
    });
  };

  const sendNotes = (
    song,
    songStart,
    start,
    end,
    audioContext,
    input,
    player
  ) => {
    for (let t = 0; t < song.tracks.length; t++) {
      let track = song.tracks[t];
      for (let i = 0; i < track.notes.length; i++) {
        if (track.notes[i].when >= start && track.notes[i].when < end) {
          const when = songStart + track.notes[i].when;
          const duration = track.notes[i].duration;
          if (duration > 3) {
            duration = 3;
          }
          const instr = track.info.variable;
          const v = track.volume / 7;

          player.queueWaveTable(
            audioContext,
            input,
            window[instr] || { zones: [] },
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
            window[instr],
            when,
            beat.n,
            duration,
            v
          );
        }
      }
    }
  };

  const startLoad = (song, onSongLoad) => {
    console.log(song);
    const AudioContextFunc = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContextFunc();
    player = new WebAudioFontPlayer();

    equalizer = player.createChannel(audioContext);
    reverberator = player.createReverberator(audioContext);
    //input = reverberator.input;
    input = equalizer.input;
    equalizer.output.connect(reverberator.input);
    reverberator.output.connect(audioContext.destination);

    for (let i = 0; i < song.tracks.length; i++) {
      const nn = player.loader.findInstrument(song.tracks[i].program);
      const info = player.loader.instrumentInfo(nn);
      song.tracks[i].info = info;
      song.tracks[i].id = nn;
      player.loader.startLoad(audioContext, info.url, info.variable);
    }
    for (let i = 0; i < song.beats.length; i++) {
      const nn = player.loader.findDrum(song.beats[i].n);
      const info = player.loader.drumInfo(nn);
      song.beats[i].info = info;
      song.beats[i].id = nn;
      player.loader.startLoad(audioContext, info.url, info.variable);
    }
    player.loader.waitLoad(function () {
      audioContext.resume();
      loadedSong = song;
      resetEqlualizer();
      onSongLoad(song);
    });
  };

  const resetEqlualizer = () => {
    equalizer.band32.gain.setTargetAtTime(2, 0, 0.0001);
    equalizer.band64.gain.setTargetAtTime(2, 0, 0.0001);
    equalizer.band128.gain.setTargetAtTime(1, 0, 0.0001);
    equalizer.band256.gain.setTargetAtTime(0, 0, 0.0001);
    equalizer.band512.gain.setTargetAtTime(-1, 0, 0.0001);
    equalizer.band1k.gain.setTargetAtTime(5, 0, 0.0001);
    equalizer.band2k.gain.setTargetAtTime(4, 0, 0.0001);
    equalizer.band4k.gain.setTargetAtTime(3, 0, 0.0001);
    equalizer.band8k.gain.setTargetAtTime(-2, 0, 0.0001);
    equalizer.band16k.gain.setTargetAtTime(2, 0, 0.0001);
  };

  const handleFileSelect = (event, onSongLoad) => {
    console.log(event);
    const file = event.target.files[0];
    console.log(file);
    const fileReader = new FileReader();
    fileReader.onload = function (progressEvent) {
      console.log(progressEvent);
      const arrayBuffer = progressEvent.target.result;
      console.log(arrayBuffer);
      const midiFile = new MIDIFile(arrayBuffer);
      const song = midiFile.parseSong();
      startLoad(song, onSongLoad);
    };
    fileReader.readAsArrayBuffer(file);
  };

  return { handleFileSelect, startLoad, startPlay };
};
