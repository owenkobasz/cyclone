import json
import gpxpy
import os
def parse_json(json):
    return None

def add_to_gpx():
    return None

def main():
    
    # set cwd to file
    # Get the directory of the current file
    file_dir = os.path.dirname(os.path.abspath(__file__))

    # Change the working directory to that directory
    os.chdir(file_dir)
    print(file_dir)
    # initialize GPX objects
    gpx = gpxpy.gpx.GPX()

    # Create first track in our GPX:
    gpx_track = gpxpy.gpx.GPXTrack()
    gpx.tracks.append(gpx_track)

    # Create first segment in our GPX track:
    gpx_segment = gpxpy.gpx.GPXTrackSegment()
    gpx_track.segments.append(gpx_segment)
    
    with open("data.json") as f:
        data = json.load(f)
        # parse json line
        for row in data['points']:
            lat = float(row['lat'])
            lon = float(row['lon'])
            # add to gpx object
            gpx_segment.points.append(gpxpy.gpx.GPXTrackPoint(lat, lon))
        
    
    # return gpx file to user
    with open("route.gpx", "w") as f:
        f.write(gpx.to_xml())
    
if __name__ == "__main__":
    main()
    