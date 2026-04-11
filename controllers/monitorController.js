const monitors = {};//In memory DB

function startTimer(id) {
    const monitor = monitors[id];
    if (monitor.timerId) {
        clearTimeout(monitor.timerId);
    }

    monitor.timerId = setTimeout(() => {
        monitor.status = 'down';
        console.log(JSON.stringify({
            ALERT: `Device ${id} is down!`,
            time: new Date().toISOString()
        }));
    }, monitor.timeout * 1000);
}

function safeView(monitor) {
    const { timerId, ...safeMonitor } = monitor;
    return safeMonitor;
}

// --- Endpoints ---

// POST /monitors
const registerMonitor = (req, res) => {
    const { id, timeout, alert_email } = req.body;
    if (!id || !timeout) return res.status(400).json({ error: "Missing id or timeout" });

    monitors[id] = { id, timeout, alert_email, status: 'active', timerId: null };
    startTimer(id);
    res.status(201).json({ message: "Monitor created successfully." });
};

// POST /monitors/:id/heartbeat (Resets timer & Auto-Unpauses)
const heartbeat = (req, res) => {
    const monitor = monitors[req.params.id];
    if (!monitor) return res.status(404).json({ error: "Monitor not found." });

    // CRITERIA CHECK: Calling heartbeat automatically "un-pauses" the monitor
    if (monitor.status === 'paused') {
        monitor.status = 'active';
    }
    
    startTimer(req.params.id);
    res.status(200).json({ message: "Heartbeat received. Timer reset." });
};

// POST /monitors/:id/pause (Stops timer completely)
const pauseMonitor = (req, res) => {
    const monitor = monitors[req.params.id];
    if (!monitor) return res.status(404).json({ error: "Monitor not found." });

    // CRITERIA CHECK: Timer stops completely. No alerts will fire.
    clearTimeout(monitor.timerId);
    monitor.status = 'paused';
    res.status(200).json({ message: `Monitor ${req.params.id} paused.` });
};

// GET /monitors (DEVELOPER'S CHOICE)
const listMonitors = (req, res) => {
    const allMonitors = Object.values(monitors).map(safeView);
    res.status(200).json({ count: allMonitors.length, monitors: allMonitors });
};

module.exports = { registerMonitor, heartbeat, pauseMonitor, listMonitors };