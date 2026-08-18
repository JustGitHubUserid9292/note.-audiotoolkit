let audioContext = null;
let source = null;
let gain = null;
let stream = null;

chrome.runtime.onMessage.addListener((message) => {
    console.log("OFFSCREEN MESSAGE:", message);

    if (message.type === "START_CAPTURE") {
        startAudio(message.streamId);
    }

    if (message.type === "SET_VOLUME") {
        setVolume(message.value);
    }

    if (message.type === "STOP_AUDIO") {
        stopAudio();
    }
});


async function startAudio(streamId) {
    try {
        console.log("Starting audio with stream ID");

        stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                mandatory: {
                    chromeMediaSource: "tab",
                    chromeMediaSourceId: streamId
                }
            },
            video: false
        });

        console.log("MediaStream received");

        audioContext = new AudioContext();

        source = audioContext.createMediaStreamSource(stream);

        gain = audioContext.createGain();

        gain.gain.value = 1;

        source.connect(gain);

        gain.connect(audioContext.destination);

        await audioContext.resume();

        console.log("AUDIO IS WORKING");
    } catch (error) {
        console.error("OFFSCREEN AUDIO ERROR:", error);
    }
}


function setVolume(value) {
    if (!gain) {
        console.warn("GainNode does not exist");
        return;
    }

    gain.gain.value = value;

    console.log("Volume:", value);
}


function stopAudio() {
    if (source) {
        source.disconnect();
        source = null;
    }

    if (stream) {
        stream.getTracks().forEach((track) => {
            track.stop();
        });

        stream = null;
    }

    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }

    gain = null;

    console.log("Audio stopped");
}