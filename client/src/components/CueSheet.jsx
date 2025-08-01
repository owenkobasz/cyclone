// components/CueSheet.jsx
import { motion } from "framer-motion";

export default function CueSheet({ cueSheet }) {
    return (
        <motion.div
            className="relative p-6 bg-n-8/40 backdrop-blur-sm rounded-2xl border border-n-2/20 transition-all duration-300 hover:border-color-2/50"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
            viewport={{ once: true }}
        >
            <h3 className="h3 mb-4 text-n-1">Cue Sheet</h3>
            
            {cueSheet.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                    <div className="text-center">
                        <motion.div
                            className="w-12 h-12 mx-auto mb-4 text-n-4"
                            animate={{ 
                                scale: [1, 1.05, 1],
                                opacity: [0.5, 1, 0.5] 
                            }}
                            transition={{ 
                                duration: 2, 
                                repeat: Infinity,
                                ease: "easeInOut" 
                            }}
                        >
                            <svg fill="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                            </svg>
                        </motion.div>
                        <p className="body-2 text-n-4">Turn-by-turn directions will appear here</p>
                    </div>
                </div>
            ) : (
                <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="space-y-3">
                        {cueSheet.map((step, idx) => (
                            <div
                                key={idx}
                                className="flex items-start p-3 bg-n-7/50 rounded-lg border border-n-6/50 hover:border-color-1/50 transition-all duration-300"
                            >
                                <div className="w-2 h-2 bg-color-1 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                <p className="body-2 text-n-2 flex-1">{step}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
}
