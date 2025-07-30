import { useRef, useEffect } from "react";
import { motion, useAnimation, useInView } from "framer-motion";

const Heading = ({ title }) => {
  const words = title.split(" ");
  const controls = useAnimation();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });

  useEffect(() => {
    if (inView) {
      controls.start("show");
    }
  }, [inView, controls]);

  const container = {
    hidden: { opacity: 1 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.10,
      },
    },
  };

  const word = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  return (
    <div ref={ref} className="md:max-w-md lg:max-w-lg mb-6 text-left">
      <h2 className="h2">
        <motion.span
          variants={container}
          initial="hidden"
          animate={controls}
          className="inline-block"
        >
          {words.map((w, i) => (
            <motion.span key={i} variants={word} className="inline-block mr-2">
              {w}
            </motion.span>
          ))}
        </motion.span>
      </h2>
    </div>
  );
};
export default Heading;