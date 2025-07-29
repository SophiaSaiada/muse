import { MIDIFile } from "./MIDIFile";

export function MIDIPlayer() {
  var audioContext = null;
  var player = null;
  var reverberator = null;
  var equalizer = null;
  var songStart = 0;
  var input = null;
  var currentSongTime = 0;
  var nextStepTime = 0;
  var nextPositionTime = 0;
  var loadedsong = null;
  function startPlay() {
    currentSongTime = 0;
    songStart = audioContext.currentTime;
    nextStepTime = audioContext.currentTime;
    var stepDuration = 44 / 1000;
    tick(loadedsong, stepDuration);
  }
  function tick(song, stepDuration) {
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
  }
  function sendNotes(song, songStart, start, end, audioContext, input, player) {
    for (var t = 0; t < song.tracks.length; t++) {
      var track = song.tracks[t];
      for (var i = 0; i < track.notes.length; i++) {
        if (track.notes[i].when >= start && track.notes[i].when < end) {
          var when = songStart + track.notes[i].when;
          var duration = track.notes[i].duration;
          if (duration > 3) {
            duration = 3;
          }
          var instr = track.info.variable;
          var v = track.volume / 7;

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
    for (var b = 0; b < song.beats.length; b++) {
      var beat = song.beats[b];
      for (var i = 0; i < beat.notes.length; i++) {
        if (beat.notes[i].when >= start && beat.notes[i].when < end) {
          var when = songStart + beat.notes[i].when;
          var duration = 1.5;
          var instr = beat.info.variable;
          var v = beat.volume / 2;
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
  }
  function startLoad(song, onSongLoad) {
    console.log(song);
    var AudioContextFunc = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContextFunc();
    player = new WebAudioFontPlayer();

    equalizer = player.createChannel(audioContext);
    reverberator = player.createReverberator(audioContext);
    //input = reverberator.input;
    input = equalizer.input;
    equalizer.output.connect(reverberator.input);
    reverberator.output.connect(audioContext.destination);

    for (var i = 0; i < song.tracks.length; i++) {
      var nn = player.loader.findInstrument(song.tracks[i].program);
      var info = player.loader.instrumentInfo(nn);
      song.tracks[i].info = info;
      song.tracks[i].id = nn;
      player.loader.startLoad(audioContext, info.url, info.variable);
    }
    for (var i = 0; i < song.beats.length; i++) {
      var nn = player.loader.findDrum(song.beats[i].n);
      var info = player.loader.drumInfo(nn);
      song.beats[i].info = info;
      song.beats[i].id = nn;
      player.loader.startLoad(audioContext, info.url, info.variable);
    }
    player.loader.waitLoad(function () {
      audioContext.resume();
      loadedsong = song;
      resetEqlualizer();
      onSongLoad(song);
    });
  }
  function resetEqlualizer() {
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
  }

  function handleFileSelect(event, onSongLoad) {
    console.log(event);
    var file = event.target.files[0];
    console.log(file);
    var fileReader = new FileReader();
    fileReader.onload = function (progressEvent) {
      console.log(progressEvent);
      var arrayBuffer = progressEvent.target.result;
      console.log(arrayBuffer);
      var midiFile = new MIDIFile(arrayBuffer);
      var song = midiFile.parseSong();
      startLoad(song, onSongLoad);
    };
    fileReader.readAsArrayBuffer(file);
  }

  return { handleFileSelect, startLoad, startPlay };
}
