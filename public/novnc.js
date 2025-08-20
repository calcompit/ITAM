/**
 * noVNC - HTML5 VNC Client
 * Simplified version for VNC proxy server
 */

(function() {
    'use strict';

    // RFB Constructor
    function RFB(target, url, options) {
        this.target = target;
        this.url = url;
        this.options = options || {};
        this.ws = null;
        this.connected = false;
        this.canvas = target;
        this.ctx = target.getContext('2d');
        
        // VNC state
        this.framebufferWidth = 0;
        this.framebufferHeight = 0;
        this.bitsPerPixel = 32;
        this.depth = 24;
        this.bigEndian = false;
        this.trueColour = true;
        this.redMax = 255;
        this.greenMax = 255;
        this.blueMax = 255;
        this.redShift = 16;
        this.greenShift = 8;
        this.blueShift = 0;
        
        // Initialize
        this.init();
    }

    RFB.prototype.init = function() {
        console.log('RFB initializing...');
        this.setupCanvas();
        this.connect();
    };

    RFB.prototype.setupCanvas = function() {
        // Set canvas size
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Fill with black background
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Add some text to show it's working
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('VNC Viewer - Connecting...', this.canvas.width / 2, this.canvas.height / 2);
    };

    RFB.prototype.connect = function() {
        try {
            console.log('Connecting to:', this.url);
            this.ws = new WebSocket(this.url);
            
            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.connected = true;
                this.triggerEvent('connect');
                this.startVNCProtocol();
            };
            
            this.ws.onmessage = (event) => {
                this.handleMessage(event.data);
            };
            
            this.ws.onclose = () => {
                console.log('WebSocket closed');
                this.connected = false;
                this.triggerEvent('disconnect');
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.triggerEvent('error', { detail: { message: 'WebSocket connection failed' } });
            };
            
        } catch (error) {
            console.error('Connection error:', error);
            this.triggerEvent('error', { detail: { message: error.message } });
        }
    };

    RFB.prototype.startVNCProtocol = function() {
        // Send VNC protocol version
        const version = 'RFB 003.008\n';
        this.ws.send(version);
        
        // Update canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fillText('VNC Connected - Waiting for data...', this.canvas.width / 2, this.canvas.height / 2);
    };

    RFB.prototype.handleMessage = function(data) {
        // Handle VNC data - simplified for demo
        console.log('Received VNC data:', data.byteLength || data.length, 'bytes');
        
        // For demo purposes, just show that we're receiving data
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fillText('VNC Data Received: ' + (data.byteLength || data.length) + ' bytes', this.canvas.width / 2, this.canvas.height / 2);
        
        // In a real implementation, this would decode VNC protocol
        // and update the canvas with the actual screen data
    };

    RFB.prototype.disconnect = function() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.connected = false;
        
        // Clear canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fillText('VNC Disconnected', this.canvas.width / 2, this.canvas.height / 2);
    };

    RFB.prototype.addEventListener = function(event, callback) {
        if (!this.eventListeners) {
            this.eventListeners = {};
        }
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    };

    RFB.prototype.triggerEvent = function(event, data) {
        if (this.eventListeners && this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => {
                try {
                    callback(data || {});
                } catch (error) {
                    console.error('Event callback error:', error);
                }
            });
        }
    };

    // Add mouse and keyboard event handlers
    RFB.prototype.enableInput = function() {
        this.canvas.addEventListener('mousedown', this.handleMouse.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouse.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouse.bind(this));
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
        this.canvas.addEventListener('keydown', this.handleKey.bind(this));
        this.canvas.addEventListener('keyup', this.handleKey.bind(this));
        this.canvas.focus();
    };

    RFB.prototype.handleMouse = function(event) {
        if (!this.connected) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Send mouse event to VNC server
        const message = {
            type: 'mouse',
            x: x,
            y: y,
            button: event.button,
            action: event.type
        };
        
        this.ws.send(JSON.stringify(message));
    };

    RFB.prototype.handleWheel = function(event) {
        if (!this.connected) return;
        
        event.preventDefault();
        
        const message = {
            type: 'wheel',
            deltaX: event.deltaX,
            deltaY: event.deltaY
        };
        
        this.ws.send(JSON.stringify(message));
    };

    RFB.prototype.handleKey = function(event) {
        if (!this.connected) return;
        
        const message = {
            type: 'key',
            key: event.key,
            keyCode: event.keyCode,
            action: event.type
        };
        
        this.ws.send(JSON.stringify(message));
    };

    // Global RFB object
    window.RFB = RFB;
    
    console.log('noVNC library loaded successfully');
})();
