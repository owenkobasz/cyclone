// components/UnitsToggle.jsx

import { useUnits } from "../contexts/UnitsContext";

export default function UnitsToggle(props) {
    const { units, setUnits, toggleUnits } = useUnits();
    return (
        <div className="flex gap-2">
            <button onClick={toggleUnits}>Toggle</button>
        </div>
    )
}