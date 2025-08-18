function extractStreetName(instruction) {
  if (!instruction || typeof instruction !== 'string') return '';
  
  // Common patterns to extract street names from instructions
  const patterns = [
    /onto (.+?)(?:\sfor|\sinto|\.|,|$)/i,
    /on (.+?)(?:\sfor|\sinto|\.|,|$)/i,
    /turn.*onto (.+?)(?:\s|,|\.|$)/i,
    /continue.*on (.+?)(?:\s|,|\.|$)/i,
    /follow (.+?)(?:\s|,|\.|$)/i,
    /towards (.+?)(?:\s|,|\.|$)/i,
    /via (.+?)(?:\s|,|\.|$)/i,
    /along (.+?)(?:\s|,|\.|$)/i,
    /keep.*on (.+?)(?:\s|,|\.|$)/i,
    /stay.*on (.+?)(?:\s|,|\.|$)/i,
    // Additional patterns for different instruction formats
    /turn left onto (.+?)(?:\s|,|\.|$)/i,
    /turn right onto (.+?)(?:\s|,|\.|$)/i,
    /continue onto (.+?)(?:\s|,|\.|$)/i,
    /proceed on (.+?)(?:\s|,|\.|$)/i
  ];
  
  for (const pattern of patterns) {
    const match = instruction.match(pattern);
    if (match && match[1]) {
      // Clean up the extracted street name
      let streetName = match[1].trim();
      // Remove common suffixes that might be included
      streetName = streetName.replace(/\s+(for|into|towards|until).*$/i, '');
      if (streetName.length > 0) {
        return streetName;
      }
    }
  }
  
  return '';
}

module.exports = {
  extractStreetName
};
