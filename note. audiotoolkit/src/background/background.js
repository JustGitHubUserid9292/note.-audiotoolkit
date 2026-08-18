let creatingOffscreen = null;


async function setupOffscreen() {
    const offscreenUrl =
        chrome.runtime.getURL("offscreen.html");

    const contexts = await chrome.runtime.getContexts({
        contextTypes: ["OFFSCREEN_DOCUMENT"],
        documentUrls: [offscreenUrl]
    });

    if (contexts.length > 0) {
        return;
    }

    if (creatingOffscreen) {
        await creatingOffscreen;
        return;
    }

    creatingOffscreen = chrome.offscreen.createDocument({
        url: "offscreen.html",
        reasons: ["USER_MEDIA"],
        justification: "Process audio from active tab"
    });

    await creatingOffscreen;

    creatingOffscreen = null;
}


async function startAudio() {

    await setupOffscreen();

    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });

    if (!tab?.id) {
        throw new Error("Active tab not found");
    }

    const streamId =
        await chrome.tabCapture.getMediaStreamId({
            targetTabId: tab.id
        });

    console.log("Stream ID received:", streamId);


    await chrome.runtime.sendMessage({
        type: "START_CAPTURE",
        streamId
    });
}


chrome.runtime.onMessage.addListener((message, sender) => {


    if (message.type === "START_AUDIO") {

        startAudio().catch((error) => {
            console.error(
                "Failed to start audio:",
                error
            );
        });

        return;
    }

    if (
        message.type === "STOP_AUDIO" &&
        sender.id === chrome.runtime.id
    ) {

        chrome.runtime.sendMessage({
            type: "STOP_AUDIO"
        });

        return;
    }

    if (
        message.type === "SET_VOLUME" &&
        sender.id === chrome.runtime.id
    ) {

        console.log(
            "SET_VOLUME:",
            message.value
        );

        chrome.runtime.sendMessage({
            type: "SET_VOLUME",
            value: message.value
        });

        return;
    }

});