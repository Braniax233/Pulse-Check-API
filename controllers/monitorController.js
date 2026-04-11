
const monitors = {}; // In memory DB


function startTimer(id) {
    const monitor = monitors[id];
    
    // Clear any existing timer for this device to avoid overlapping alerts
    if (monitor.timerId) {
        clearTimeout(monitor.timerId);
    }

    // Set a new timeout. If not reset by a heartbeat, the alert triggers.
    monitor.timerId = setTimeout(() => {
        monitor.status = 'down';
        monitor.timerId = null; // Clear the reference once it fires
        console.log(JSON.stringify({
            ALERT: `Device ${id} is down!`,
            time: new Date().toISOString()
        }));
    }, monitor.timeout * 1000);
}

/**
 * DATA FORMATTER
 * Removes the internal timerId reference before sending data to the client.
 */
function safeView(monitor) {
    const { timerId, ...safeMonitor } = monitor;
    return safeMonitor;
}

// --- API HANDLERS ---

// Registers a new device and starts the monitoring countdown.
const registerMonitor = (req, res) => {
    const { id, timeout, alert_email } = req.body;

    // Validation: Ensure all required fields are present
    if (!id || !timeout || !alert_email) {
        return res.status(400).json({ 
            error: "Missing required fields: id, timeout, and alert_email must be provided." 
        });
    }

    //Validation: Convert string timeouts to numbers and check validity
    const numericTimeout = Number(timeout);
    if (isNaN(numericTimeout) || numericTimeout <= 0) {
        return res.status(400).json({ error: "Timeout must be a positive number." });
    }

    // Save to memory
    monitors[id] = { 
        id, 
        timeout: numericTimeout, 
        alert_email, 
        status: 'active', 
        timerId: null 
    };

    startTimer(id);

    res.status(201).json({ 
        message: "Monitor created successfully.",
        monitor: safeView(monitors[id])
    });
};

// Resets the countdown and Implicitly un pauses the monitor if it was suspended.
const heartbeat = (req, res) => {
    const monitor = monitors[req.params.id];

    if (!monitor) {
        return res.status(404).json({ error: "Monitor not found." });
    }

    // Implicit Unpause logic
    if (monitor.status === 'paused') {
        monitor.status = 'active';
    }
    
    startTimer(req.params.id);
    res.status(200).json({ message: "Heartbeat received. Timer reset." });
};

//Stops the timer completely for maintenance or repairs.
const pauseMonitor = (req, res) => {
    const monitor = monitors[req.params.id];

    if (!monitor) {
        return res.status(404).json({ error: "Monitor not found." });
    }

    clearTimeout(monitor.timerId);
    monitor.status = 'paused';
    res.status(200).json({ message: `Monitor ${req.params.id} paused successfully.` });
};

//GET /monitors (DEVELOPER'S CHOICE)
//Lists all registered devices and their current status for administrative review.
const listMonitors = (req, res) => {
    const allMonitors = Object.values(monitors).map(safeView);
    res.status(200).json({ 
        count: allMonitors.length, 
        monitors: allMonitors 
    });
};

module.exports = { registerMonitor, heartbeat, pauseMonitor, listMonitors };