import { useUnits } from "../contexts/UnitsContext";
import { kmToUi, uiToKm, distLabel } from "./units";

export default function DistanceInput({ valueKm, onChangeKm }) {
    const units = useUnits();
    const uiVal = Number.isFinite(valueKm) ? kmToUi(valueKm, units) : 0;
    const label = distLabel(units);


}