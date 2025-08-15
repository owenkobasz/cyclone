function getValhallaInstructionType(valhallaType) {
  switch (valhallaType) {
    case 1: return 6;   // Continue
    case 2: return 6;   // Continue
    case 3: return 6;   // Slight right
    case 4: return 10;  // Destination
    case 5: return 10;  // Destination right
    case 6: return 10;  // Destination left
    case 7: return 6;   // Continue
    case 8: return 6;   // Slight left
    case 9: return 0;   // Turn left
    case 10: return 1;  // Turn right
    case 11: return 0;  // Sharp left
    case 12: return 2;  // Sharp right
    case 13: return 9;  // U-turn left
    case 14: return 9;  // U-turn right
    case 15: return 6;  // Continue
    case 16: return 8;  // Roundabout enter
    case 17: return 8;  // Roundabout exit
    case 18: return 6;  // Continue
    case 19: return 6;  // Continue
    case 20: return 6;  // Continue
    default: return 6;  // Continue
  }
}

function getGhInstructionType(graphHopperSign) {
  if (graphHopperSign === -2) return 0;  // Turn left
  if (graphHopperSign === -3) return 0;  // Turn sharp left
  if (graphHopperSign === -1) return 4;  // Turn slight left
  if (graphHopperSign === -7) return 9;  // U-turn left
  if (graphHopperSign === -6) return 12; // Keep left
  
  // Handle right turns and other positive signs
  if (graphHopperSign === 2) return 1;   // Turn right
  if (graphHopperSign === 3) return 2;   // Turn sharp right
  if (graphHopperSign === 1) return 5;   // Turn slight right
  if (graphHopperSign === 7) return 13;  // Keep right
  
  // Handle special signs
  if (graphHopperSign === 0) return 6;   // Continue
  if (graphHopperSign === 4) return 10;  // Finish/Destination
  if (graphHopperSign === 5) return 11;  // Start
  if (graphHopperSign === 6) return 8;   // Roundabout exit
  
  // OpenRouteService compatibility
  if (graphHopperSign === 10) return 10;  // Finish
  if (graphHopperSign === 11) return 11;  // Start
  if (graphHopperSign === 13) return 13;  // Keep right
  
  // Default to continue
  return 6;
}

module.exports = {
  getValhallaInstructionType,
  getInstructionType: getGhInstructionType
};
