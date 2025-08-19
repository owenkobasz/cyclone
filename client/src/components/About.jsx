import Cards from "./design/Cards"
import { motion } from "framer-motion";
import Section from "./Section";
import Heading from "./Heading";
import { Route, Mountain, Landmark, Bike, Users } from "lucide-react";

const About = () => {
  return (
    <Section id="about">
        <div className="container relative z-10">
            <Heading
                title="Key Features"
            />
            <motion.div
                className="grid md:grid-cols-3 gap-10"
                variants={{
                  show: { transition: { staggerChildren: 0.4 } },
                }}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-20% 0px" }}
            >
                <Cards
                    icon={<Route className="w-8 h-8 text-color-1" />}
                    title="Instant Routes"
                    text="Generate custom routes that match your mileage in seconds."
                />
                <Cards
                    icon={<Mountain className="w-8 h-8 text-color-1" />}
                    title="Elevation Control"
                    text="Dial in exact climb targets for racer‑ready training."
                />
                <Cards
                    icon={<Landmark className="w-8 h-8 text-color-1" />}
                    title="Custom Tailored"
                    text="Create your own personalized routes with specific preferences and requirements."
                />
                
                {/*
                <Cards
                    icon={<Landmark className="w-8 h-8 text-color-1" />}
                    title="Scenic Rides"
                    text="Prioritize greenways, parks & iconic views for unforgettable rides."
                />
                */}
            </motion.div>
        </div>
        <div className="container relative z-10 max-w-67xl mx-auto mt-20 lg:mt-22">
            <Heading
                title="Built for Every Rider"
            />
            <motion.div
                className="grid md:grid-cols-3 gap-10"
                variants={{
                  show: { transition: { staggerChildren: 0.4 } },
                }}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-20% 0px" }}
            >
                <Cards
                    title="Training Rides"
                    text="Ideal for cyclists focused on training goals, with challenging elevation and structured workouts."
                    icon={<Bike className="w-8 h-8 text-color-1" />}
                />
                <Cards 
                    title="Off-road Adventures"
                    text="Explore unpaved nature trails and green spaces for adventurous cycling experiences."
                    icon={<Mountain className="w-8 h-8 text-color-1" />}
                />
                <Cards 
                    title="Scenic Routes "
                    text="Prioritize greenways, parks & iconic views for unforgettable rides. "
                    icon={<Users className="w-8 h-8 text-color-1" />}
                />
            </motion.div>
            <h5 className="tagline mb-6 text-center text-n-1/50 translate-y-10">Having problems? Contact us webmaster@cyclone.com</h5>
        </div>
    </Section>
  );
};

export default About;