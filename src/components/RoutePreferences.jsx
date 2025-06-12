// components/RoutePreferences.jsx
export default function RoutePreferences() {
    return (
        <div className="bg-accent p-4 rounded-xl shadow-md flex-1 space-y-4">
            <h2 className="text-base md:text-lg font-bold">Route Preferences</h2>
            <div className="space-y-2">
                <label className="block"><input type="checkbox" className="mr-2" />Avoid hills</label>
                <label className="block"><input type="checkbox" className="mr-2" />Use bike lanes</label>
            </div>
            <div className="space-y-1">
                <label className="font-medium block">Distance (mi)</label>
                <div className="flex gap-2">
                    <input type="number" placeholder="Min" className="w-1/2 p-1 rounded border" />
                    <input type="number" placeholder="Max" className="w-1/2 p-1 rounded border" />
                </div>
            </div>
            <div className="space-y-1">
                <label className="font-medium block">Elevation Gain (ft)</label>
                <div className="flex gap-2">
                    <input type="number" placeholder="Min" className="w-1/2 p-1 rounded border" />
                    <input type="number" placeholder="Max" className="w-1/2 p-1 rounded border" />
                </div>
            </div>
        </div>
    );
}
