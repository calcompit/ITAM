# noVNC Setup Guide for Windows

## 📋 Prerequisites

### 1. Install Python
- Download from: https://www.python.org/downloads/
- **IMPORTANT**: Check "Add Python to PATH" during installation
- Verify installation: Open Command Prompt and run `python --version`

### 2. Install Git
- Download from: https://git-scm.com/download/win
- Use default settings during installation
- Verify installation: Open Command Prompt and run `git --version`

## 🚀 Quick Setup

### Method 1: Automated Setup (Recommended)
1. **Download the setup script:**
   - Save `setup-novnc-windows.bat` to your project folder
   - Double-click to run it

2. **Run the setup:**
   ```cmd
   setup-novnc-windows.bat
   ```

3. **Start noVNC:**
   ```cmd
   start-novnc-windows.bat
   ```
   
   **Or use Python script directly:**
   ```cmd
   python start-novnc-windows.py
   ```

### Method 2: Manual Setup

#### Step 1: Install Dependencies
```cmd
pip install websockify
```

#### Step 2: Download noVNC
```cmd
git clone https://github.com/novnc/noVNC.git
cd noVNC
```

#### Step 3: Start VNC Server
Make sure your VNC server is running on port 5900 (default)

#### Step 4: Start noVNC Proxy
```cmd
python utils/websockify/websockify.py 6081 localhost:5900 --web .
```

#### Step 5: Access Web Interface
Open your browser and go to:
```
http://localhost:6081/vnc.html
```

## 🔧 Configuration Options

### Basic Usage
```cmd
python utils/websockify/websockify.py 6081 localhost:5900 --web .
```

### Custom Port
```cmd
python utils/websockify/websockify.py 8081 localhost:5900 --web .
```

### With SSL/HTTPS
```cmd
python utils/websockify/websockify.py 6081 localhost:5900 --web . --cert cert.pem --key key.pem
```

### Multiple VNC Servers
```cmd
python utils/websockify/websockify.py 6081 localhost:5900 --web .
python utils/websockify/websockify.py 6082 localhost:5901 --web .
```

## 🌐 Access URLs

After starting noVNC, you can access:

- **Main Interface**: http://localhost:6081/vnc.html
- **Lite Interface**: http://localhost:6081/vnc_lite.html
- **App Interface**: http://localhost:6081/app/

## 🔒 Security Considerations

### For Local Use Only
```cmd
python utils/websockify/websockify.py 6081 localhost:5900 --web .
```

### For Network Access
```cmd
python utils/websockify/websockify.py 6081 localhost:5900 --web . --listen 0.0.0.0
```

### With SSL Certificate
```cmd
python utils/websockify/websockify.py 6081 localhost:5900 --web . --cert cert.pem --key key.pem
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. Python not found
```
ERROR: Python is not installed!
```
**Solution**: Install Python and check "Add Python to PATH"

#### 2. Git not found
```
ERROR: Failed to download noVNC!
```
**Solution**: Install Git from https://git-scm.com/download/win

#### 3. websockify not found
```
❌ websockify is not installed
```
**Solution**: Run `pip install websockify`

#### 4. Port already in use
```
Address already in use
```
**Solution**: Change the port or stop the service using that port

#### 5. VNC server not accessible
```
Connection refused
```
**Solution**: Make sure your VNC server is running on the specified port

#### 6. SyntaxError in novnc_proxy script
```
SyntaxError: unmatched ')'
```
**Solution**: Use the Python script (`start-novnc-windows.py`) instead of the bash script

### Debug Mode
```cmd
python utils/websockify/websockify.py 6081 localhost:5900 --web . --verbose
```

## 📱 Mobile Access

noVNC works on mobile browsers:
- **iOS Safari**: http://your-ip:6081/vnc.html
- **Android Chrome**: http://your-ip:6081/vnc.html

## 🔄 Integration with IT Asset Monitor

You can integrate noVNC with your existing VNC launcher:

1. **Replace TightVNC launcher with noVNC**
2. **Use WebSocket proxy instead of direct VNC**
3. **Access via web browser instead of desktop app**

### Example Integration
```javascript
// Instead of launching TightVNC, open noVNC in browser
window.open('http://localhost:6081/vnc.html?host=localhost&port=5900', '_blank');
```

## 📚 Additional Resources

- **noVNC Documentation**: https://github.com/novnc/noVNC
- **Websockify Documentation**: https://github.com/novnc/websockify
- **VNC Protocol**: https://tools.ietf.org/html/rfc6143

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all prerequisites are installed
3. Check firewall settings
4. Ensure VNC server is running
5. Try different ports if needed
6. Use the Python script instead of bash scripts
