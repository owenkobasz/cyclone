function formatDistance(meters, unitSystem) {
  if (unitSystem === 'imperial') {
    if (meters < 160.9) {
      const feet = meters * 3.28084;
      return `${Math.round(feet)} ft`;
    } else {
      const miles = meters / 1609.34;
      return `${miles.toFixed(1)} mi`;
    }
  } else {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    } else {
      const km = meters / 1000;
      return `${km.toFixed(1)} km`;
    }
  }
}

function formatDuration(seconds) {
  if (seconds < 60) {
    return `${Math.round(seconds)} sec`;
  } else if (seconds < 3600) {
    // If less than 1 hour, then show minutes and seconds
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    if (remainingSeconds === 0) {
      return `${minutes} min`;
    } else {
      return `${minutes} min ${remainingSeconds} sec`;
    }
  } else {
    // If 1 hour or more, then show hours and minutes only
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (minutes === 0) {
      return `${hours} hr`;
    } else {
      return `${hours} hr ${minutes} min`;
    }
  }
}

module.exports = {
  formatDistance,
  formatDuration
};
