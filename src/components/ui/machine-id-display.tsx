import { CopyableText } from "./copyable-text";

interface MachineIdDisplayProps {
  machineId: string;
  className?: string;
}

export function MachineIdDisplay({ machineId, className }: MachineIdDisplayProps) {
  return (
    <CopyableText 
      text={machineId} 
      className={className} 
      title="Copy Machine ID" 
    />
  );
}
