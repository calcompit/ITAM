import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MonitorPlay, Play, Square, Settings, ExternalLink, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/services/api";

interface VncViewerProps {
  activeTab: string;
}

interface VncServer {
  name: string;
  host: string;
  port: number;
  password?: string;
}

const VncViewer = ({ activeTab }: VncViewerProps) => {
  const [selectedServer, setSelectedServer] = useState<string>("");
  const [customHost, setCustomHost] = useState("");
  const [customPort, setCustomPort] = useState("5900");
  const [customPassword, setCustomPassword] = useState("123");
  const [isConnected, setIsConnected] = useState(false);
  const [novncPort, setNovncPort] = useState("6081");
  const [novncStatus, setNovncStatus] = useState<{ isRunning: boolean; port: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Predefined VNC servers
  const vncServers: VncServer[] = [
    { name: "Server 1 (10.51.101.83)", host: "10.51.101.83", port: 5900, password: "123" },
    { name: "Server 2 (10.51.101.94)", host: "10.51.101.94", port: 5900, password: "123" },
    { name: "Local Server", host: "localhost", port: 5900, password: "123" },
  ];

  // Check noVNC status on component mount
  useEffect(() => {
    checkNovncStatus();
  }, []);

  const checkNovncStatus = async () => {
    try {
      const response = await fetch('/api/vnc/status');
      const data = await response.json();
      setNovncStatus(data);
    } catch (error) {
      console.error('Failed to check noVNC status:', error);
      setNovncStatus({ isRunning: false, port: 6081 });
    }
  };

  const handleStartNovnc = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/vnc/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: '10.51.101.83',
          port: 5900,
          webPort: parseInt(novncPort)
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
        });
        await checkNovncStatus();
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start noVNC. Please start manually using: python start-novnc-simple.py",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    const server = selectedServer 
      ? vncServers.find(s => s.name === selectedServer)
      : { host: customHost, port: parseInt(customPort), password: customPassword };

    if (!server?.host) {
      toast({
        title: "Error",
        description: "Please select a server or enter custom host",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/vnc/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: server.host,
          port: server.port,
          password: server.password
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Open noVNC in new tab
        window.open(data.url, '_blank');
        setIsConnected(true);
        toast({
          title: "Connected",
          description: `Opening VNC viewer for ${server.host}:${server.port}`,
        });
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      // Fallback to direct URL
      const novncUrl = `http://localhost:${novncPort}/vnc.html?host=${server.host}&port=${server.port}`;
      window.open(novncUrl, '_blank');
      
      setIsConnected(true);
      toast({
        title: "Connected",
        description: `Opening VNC viewer for ${server.host}:${server.port}`,
      });
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    toast({
      title: "Disconnected",
      description: "VNC connection closed",
    });
  };

  const handleQuickConnect = async (server: VncServer) => {
    // Check if noVNC is running first
    if (!novncStatus?.isRunning) {
      toast({
        title: "noVNC Not Running",
        description: "Please start noVNC first using the 'Start noVNC' button",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/vnc/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: server.host,
          port: server.port,
          password: server.password
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        window.open(data.url, '_blank');
        setIsConnected(true);
        toast({
          title: "Quick Connect",
          description: `Connecting to ${server.name}`,
        });
      } else {
        // Fallback to direct URL
        const novncUrl = `http://localhost:${novncPort}/vnc.html?host=${server.host}&port=${server.port}`;
        window.open(novncUrl, '_blank');
        setIsConnected(true);
        toast({
          title: "Quick Connect",
          description: `Connecting to ${server.name}`,
        });
      }
    } catch (error) {
      // Fallback to direct URL
      const novncUrl = `http://localhost:${novncPort}/vnc.html?host=${server.host}&port=${server.port}`;
      window.open(novncUrl, '_blank');
      setIsConnected(true);
      toast({
        title: "Quick Connect",
        description: `Connecting to ${server.name}`,
      });
    }
  };

  if (activeTab !== "vnc") return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">VNC Viewer</h1>
          <p className="text-muted-foreground">
            Connect to remote computers via VNC through noVNC web interface
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
          <Badge variant={novncStatus?.isRunning ? "default" : "destructive"}>
            noVNC: {novncStatus?.isRunning ? "Running" : "Stopped"}
          </Badge>
          <Button onClick={checkNovncStatus} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleStartNovnc} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? "Starting..." : "Start noVNC"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Connect */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MonitorPlay className="h-5 w-5" />
              Quick Connect
            </CardTitle>
            <CardDescription>
              Connect to predefined VNC servers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {vncServers.map((server) => (
              <div key={server.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{server.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {server.host}:{server.port}
                  </p>
                </div>
                <Button 
                  onClick={() => handleQuickConnect(server)}
                  size="sm"
                  variant="outline"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Connect
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Custom Connection */}
        <Card>
          <CardHeader>
            <CardTitle>Custom Connection</CardTitle>
            <CardDescription>
              Connect to any VNC server
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="server-select">Select Server</Label>
              <Select value={selectedServer} onValueChange={setSelectedServer}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a server or enter custom" />
                </SelectTrigger>
                <SelectContent>
                  {vncServers.map((server) => (
                    <SelectItem key={server.name} value={server.name}>
                      {server.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom Server</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedServer === "custom" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="host">Host</Label>
                  <Input
                    id="host"
                    placeholder="e.g., 192.168.1.100"
                    value={customHost}
                    onChange={(e) => setCustomHost(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="port">Port</Label>
                  <Input
                    id="port"
                    placeholder="5900"
                    value={customPort}
                    onChange={(e) => setCustomPort(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password (optional)</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="VNC password"
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="novnc-port">noVNC Port</Label>
              <Input
                id="novnc-port"
                placeholder="6081"
                value={novncPort}
                onChange={(e) => setNovncPort(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleConnect}
                className="flex-1"
                disabled={!selectedServer && !customHost}
              >
                <Play className="h-4 w-4 mr-2" />
                Connect
              </Button>
              {isConnected && (
                <Button 
                  onClick={handleDisconnect}
                  variant="outline"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">1. Start noVNC Server</h4>
              <div className="bg-muted p-3 rounded-lg font-mono text-sm">
                python start-novnc-simple.py
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">2. Access Web Interface</h4>
              <div className="bg-muted p-3 rounded-lg font-mono text-sm">
                http://localhost:6081/vnc.html
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ExternalLink className="h-4 w-4" />
            <span>
              Make sure your VNC server is running and accessible before connecting
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VncViewer;
