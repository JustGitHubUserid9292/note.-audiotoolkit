import { useEffect, useState, useRef } from "react";

function App() {
    const [tabID, setTabID] = useState(null);
    const [enabled, setEnabled] = useState(false);
    const [volume, setVolume] = useState(100);

    const [bassPoint, setBassPoint] = useState({ x: 25, y: 50 });
    const [gainPoint, setGainPoint] = useState({ x: 70, y: 50 });
    const [frequencyPoint, setFrequencyPoint] = useState({ x: 50, y: 50 });

    const gridRef = useRef(null);
    const draggingPoint = useRef(null);

    useEffect(() => {
        let currentTabId = null;

        async function loadSettings() {
            const [tab] = await chrome.tabs.query({
                active: true,
                currentWindow: true
            });

            if (!tab?.id) {
                return;
            }

            currentTabId = tab.id;
            setTabID(tab.id);

            const result = await chrome.storage.local.get("tabs");
            const tabs = result.tabs ?? {};

            const settings = tabs[tab.id] ?? {
                enabled: false,
                volume: 100
            };

            setEnabled(settings.enabled);
            setVolume(settings.volume);
        }

        loadSettings();

        function handleChromeStorageChanges(changes, areaName) {
            if (areaName !== "local") {
                return;
            }

            if (!changes.tabs) {
                return;
            }

            if (!currentTabId) {
                return;
            }

            const tabs = changes.tabs.newValue ?? {};

            const settings = tabs[currentTabId] ?? {
                enabled: false,
                volume: 100
            };

            setEnabled(settings.enabled);
            setVolume(settings.volume);
        }

        chrome.storage.onChanged.addListener(
            handleChromeStorageChanges
        );

        return () => {
            chrome.storage.onChanged.removeListener(
                handleChromeStorageChanges
            );
        };
    }, []);

    async function toggleAudio() {
        const newEnabled = !enabled;

        setEnabled(newEnabled);

        const result = await chrome.storage.local.get("tabs");
        const tabs = result.tabs ?? {};

        tabs[tabID] = {
            ...(tabs[tabID] ?? {}),
            enabled: newEnabled,
        };

        await chrome.storage.local.set({
            tabs
        });

        chrome.runtime.sendMessage({
            type: newEnabled ? "START_AUDIO" : "STOP_AUDIO"
        });
    }

    async function handleVolumeChange(e) {
        const value = Number(e.target.value);

        setVolume(value);

        const result = await chrome.storage.local.get("tabs");
        const tabs = result.tabs ?? {};

        tabs[tabID] = {
            ...(tabs[tabID] ?? {}),
            volume: value,
        };

        await chrome.storage.local.set({
            tabs
        });

        chrome.runtime.sendMessage({
            type: "SET_VOLUME",
            value: value / 100
        });
    }

    function handlePointMouseDown(pointName, e) {
        e.stopPropagation();

        draggingPoint.current = pointName;

        document.addEventListener(
            "mousemove",
            handlePointMouseMove
        );

        document.addEventListener(
            "mouseup",
            handlePointMouseUp
        );
    }

    function handlePointMouseMove(e) {
        if (!gridRef.current || !draggingPoint.current) {
            return;
        }

        const rect = gridRef.current.getBoundingClientRect();

        let x = ((e.clientX - rect.left) / rect.width) * 100;

        let y = ((e.clientY - rect.top) / rect.height) * 100;

        x = Math.max(0, Math.min(100, x));
        y = Math.max(0, Math.min(100, y));

        if (draggingPoint.current === "bass") {
            setBassPoint({ x, y });
        }

        if (draggingPoint.current === "gain") {
            setGainPoint({ x, y });
        }

        if (draggingPoint.current === "frequency") {
            setFrequencyPoint({ x, y });
        }
    }

    function handlePointMouseUp() {
        draggingPoint.current = null;

        document.removeEventListener(
            "mousemove",
            handlePointMouseMove
        );

        document.removeEventListener(
            "mouseup",
            handlePointMouseUp
        );
    }

    return (
        <div className="audio-control">
            <div className="audio-toggle-wrapper">
                <button className={`audio-toggle ${ enabled ? "active" : ""}`} onClick={toggleAudio} />
                <span>EQing this tab</span>
            </div>

            <h1 className="eq-title">note<span>.</span> Audio ToolKit</h1>

            <div className="eq-control">
                <div className="graph-wrapper">
                    <div className="y-axis">
                        <span>+12</span>
                        <span>+6</span>
                        <span>0</span>
                        <span>-6</span>
                        <span>-12</span>
                    </div>
                    <div ref={gridRef} className="audio-grid">
                        <div className="control-point bass-point" style={{ left: `${bassPoint.x}%`, top: `${bassPoint.y}%` }} onMouseDown={(e) => handlePointMouseDown("bass", e)}></div>
                        <div className="control-point gain-point" style={{ left: `${gainPoint.x}%`, top: `${gainPoint.y}%`}} onMouseDown={(e) => handlePointMouseDown("gain", e)}></div>
                        <div className="control-point frequency-point" style={{ left: `${frequencyPoint.x}%`, top: `${frequencyPoint.y}%`}} onMouseDown={(e) => handlePointMouseDown("frequency", e)}></div>
                    </div>
                    <div className="x-axis">
                        <span>20</span>
                        <span>50</span>
                        <span>100</span>
                        <span>250</span>
                        <span>500</span>
                        <span>1k</span>
                        <span>5k</span>
                        <span>10k</span>
                        <span>20k</span>
                    </div>
                </div>
            </div>
            <div className="volume-control">
                <div className="volume-slider-wrapper">
                    <span>volume</span>
                    <div className="volume-mark"></div>
                    <input className="volume-slider" type="range" min="0" max="200" step="1" value={volume} onChange={handleVolumeChange}/>
                </div>
            </div>
        </div>
    );
}

export default App;