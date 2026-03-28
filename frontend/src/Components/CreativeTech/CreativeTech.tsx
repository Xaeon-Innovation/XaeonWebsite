import { motion } from "framer-motion";
import { Highlighter } from "../ui/Highlighter";
import styles from "./CreativeTech.module.css";

/** Marker on headline + quoted terms in body copy */
const headHighlight = {
  action: "highlight" as const,
  color: "#ffffff",
  strokeWidth: 2,
  animationDuration: 720,
  iterations: 1,
  padding: 5,
  multiline: true,
  isView: true,
};

const taglineUnderline = {
  ...headHighlight,
  action: "underline" as const,
  color: "#ffffff",
  strokeWidth: 2.2,
  padding: 6,
};

/** Body copy: marker on quoted terms only */
const descHighlight = {
  action: "highlight" as const,
  color: "#ffffff",
  strokeWidth: 1.4,
  animationDuration: 650,
  iterations: 1,
  padding: 3,
  multiline: true,
  isView: true,
};

const CreativeTech = () => {
  return (
    <section className={styles.creativeTech}>
      <div className={styles.container}>
        <div className={styles.content}>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className={styles.leftContent}
          >
            <h2 className={styles.headline}>
              <Highlighter {...headHighlight}>WHAT WE BELIEVE</Highlighter>
              <br />
              <Highlighter {...taglineUnderline}>
                Beyond{" "}
                <span className={styles.accentWord}>Time</span>. Beyond{" "}
                <span className={styles.accentWord}>Limits</span>.
              </Highlighter>
            </h2>

            <p className={styles.description}>
              We don’t just design, we design with{" "}
              <span className={styles.descQuote}>&ldquo;</span>
              <Highlighter {...descHighlight}>intent</Highlighter>
              <span className={styles.descQuote}>&rdquo;</span>.
              <br />
              We don’t just build platforms, we build{" "}
              <span className={styles.descQuote}>&ldquo;</span>
              <Highlighter {...descHighlight}>
                systems that perform
              </Highlighter>
              <span className={styles.descQuote}>&rdquo;</span>.
              <br />
              We don’t chase trends, we{" "}
              <span className={styles.descQuote}>&ldquo;</span>
              <Highlighter {...descHighlight}>
                create solutions built to last
              </Highlighter>
              <span className={styles.descQuote}>&rdquo;</span>.
              <br />
              <br />
              We believe that lasting impact comes from the perfect blend of{" "}
              <span className={styles.descQuote}>&ldquo;</span>
              <Highlighter {...descHighlight}>
                strategy
              </Highlighter>
              <span className={styles.descQuote}>&rdquo;</span>,{" "}
              <span className={styles.descQuote}>&ldquo;</span>
              <Highlighter {...descHighlight}>
                design
              </Highlighter>
              <span className={styles.descQuote}>&rdquo;</span>, and{" "}
              <span className={styles.descQuote}>&ldquo;</span>
              <Highlighter {...descHighlight}>
                technology
              </Highlighter>
              <span className={styles.descQuote}>&rdquo;</span>.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className={styles.rightContent}
          >
            <div className={styles.gridPanel}>
              <img
                src="/assets/xaeon/what-we-believe-laptop.jpg"
                alt="Xaeon website shown on a laptop in a dark studio setting."
                className={styles.posterImage}
                width={1200}
                height={800}
                loading="lazy"
                decoding="async"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CreativeTech;
