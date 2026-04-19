import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import styles from "./MeetOurTeamSection.module.css";
import api from "../../lib/api";

type TeamMemberRow = {
  _id: string;
  name: string;
  role: string;
  photoUrl: string;
};

const FALLBACK_TEAM: TeamMemberRow[] = [
  { _id: "fallback-1", name: "Youssef Hossam", role: "Web Developer", photoUrl: "" },
  { _id: "fallback-2", name: "Ziad Mohy", role: "Web Developer", photoUrl: "" },
  { _id: "fallback-3", name: "Nour Ahmed", role: "UI/UX Designer", photoUrl: "" },
  { _id: "fallback-4", name: "Mariam Adel", role: "Project Strategist", photoUrl: "" },
];

const MeetOurTeamSection = () => {
  const [members, setMembers] = useState<TeamMemberRow[]>(FALLBACK_TEAM);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ teamMembers?: TeamMemberRow[] }>("/site/team-members")
      .then((res) => {
        const list = res.data?.teamMembers;
        if (cancelled || !Array.isArray(list) || list.length === 0) return;
        setMembers(list);
      })
      .catch(() => {
        /* keep fallback */
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
          At Xaeon Innovation, our team is fueled by creativity, dedication, and a drive to deliver results that matter.
        </motion.p>

        <div className={styles.cards}>
          {members.map((member, idx) => (
            <motion.article
              key={member._id}
              className={styles.card}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.06 * idx, ease: "easeOut" }}
              viewport={{ once: true, amount: 0.25 }}
            >
              {member.photoUrl ? (
                <div className={styles.avatarPhoto} aria-hidden>
                  <img className={styles.avatarImg} src={member.photoUrl} alt="" loading="lazy" />
                </div>
              ) : (
                <div className={styles.avatar} aria-hidden role="presentation" />
              )}
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
          We are a group of designers, developers, and strategists who believe in building more than just projects; we
          build partnerships. Every member of our team brings unique skills to the table, from crafting clean,
          user-friendly designs to developing scalable software and creating impactful digital campaigns.
        </motion.p>
      </div>
    </section>
  );
};

export default MeetOurTeamSection;
