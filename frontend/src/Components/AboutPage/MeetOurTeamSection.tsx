import { motion } from "framer-motion";
import styles from "./MeetOurTeamSection.module.css";

const TEAM_MEMBERS = [
  { name: "Youssef Hossam", role: "Web Developer" },
  { name: "Ziad Mohy", role: "Web Developer" },
  { name: "Nour Ahmed", role: "UI/UX Designer" },
  { name: "Mariam Adel", role: "Project Strategist" },
] as const;

const MeetOurTeamSection = () => {
  return (
    <section className={styles.section} aria-labelledby="meet-our-team-title">
      <div className={styles.inner}>
        <motion.h2
          id="meet-our-team-title"
          className={styles.title}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.35 }}
        >
          MEET OUR <span className={styles.titleAccent}>TEAM</span>
        </motion.h2>

        <motion.p
          className={styles.subtitle}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.35 }}
        >
          At Xaeon Innovation, our team is fueled by creativity, dedication, and
          a drive to deliver results that matter.
        </motion.p>

        <div className={styles.cards}>
          {TEAM_MEMBERS.map((member, idx) => (
            <motion.article
              key={member.name}
              className={styles.card}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.06 * idx, ease: "easeOut" }}
              viewport={{ once: true, amount: 0.25 }}
            >
              <div className={styles.avatar} aria-hidden />
              <div className={styles.cardMeta}>
                <p className={styles.cardName}>{member.name}</p>
                <p className={styles.cardRole}>{member.role}</p>
              </div>
            </motion.article>
          ))}
        </div>

        <motion.p
          className={styles.bodyCopy}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.3 }}
        >
          We are a group of designers, developers, and strategists who believe
          in building more than just projects; we build partnerships. Every
          member of our team brings unique skills to the table, from crafting
          clean, user-friendly designs to developing scalable software and
          creating impactful digital campaigns.
        </motion.p>
      </div>
    </section>
  );
};

export default MeetOurTeamSection;
