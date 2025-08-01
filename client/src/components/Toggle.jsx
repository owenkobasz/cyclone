import { motion } from "framer-motion";

const Toggle = ({ checked, onChange, label }) => {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <span className="body-2 text-n-3 group-hover:text-n-2 transition-colors">{label}</span>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="sr-only"
        />
        <motion.div
          className={`w-12 h-6 rounded-full transition-all duration-300 ${
            checked 
              ? 'bg-gradient-to-r from-color-1 to-color-3' 
              : 'bg-n-6 hover:bg-n-5'
          }`}
        >
          <motion.div
            className="w-5 h-5 bg-white rounded-full shadow-lg absolute top-0.5"
            animate={{
              x: checked ? 26 : 2,
              scale: checked ? 1.1 : 1,
            }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30
            }}
          />
        </motion.div>
      </div>
    </label>
  );
};

export default Toggle;
